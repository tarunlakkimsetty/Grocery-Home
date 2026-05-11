const { promisePool } = require('../config/db');

const normalize = (value) => String(value || '').trim().toLowerCase();

const isConvertedWorkflow = (row) => {
    const status = normalize(row?.status);
    const type = normalize(row?.type);
    const origin = normalize(row?.origin);

    return (
        status === 'converted' ||
        status === 'processing' ||
        status === 'completed' ||
        status === 'rejected' ||
        type === 'list_converted' ||
        origin === 'list_orders' ||
        origin === 'list_converted'
    );
};

const findFallbackOrder = async (listOrder) => {
    const name = String(listOrder?.listCustomerName || '').trim();
    const phone = String(listOrder?.listPhone || '').trim();
    const place = String(listOrder?.listPlace || '').trim();

    const conditions = ["o.orderType = 'Offline'"];
    const params = [];

    if (name) {
        conditions.push('LOWER(o.customerName) LIKE LOWER(?)');
        params.push(`%${name}%`);
    }

    if (phone) {
        conditions.push('o.phone = ?');
        params.push(phone);
    }

    if (place) {
        conditions.push('LOWER(COALESCE(o.place, "")) LIKE LOWER(?)');
        params.push(`%${place}%`);
    }

    const [rows] = await promisePool.query(
        `SELECT
            o.id,
            o.customerName,
            o.phone,
            o.place,
            o.status,
            o.paymentStatus,
            o.orderType,
            o.\`type\` AS type,
            o.origin,
            o.isArchived,
            o.totalAmount,
            o.createdAt,
            o.updatedAt,
            COUNT(oi.id) AS itemCount
         FROM orders o
         LEFT JOIN order_items oi ON oi.orderId = o.id
         WHERE ${conditions.join(' AND ')}
         GROUP BY o.id
         ORDER BY
            (LOWER(o.customerName) = LOWER(?)) DESC,
            (o.phone = ?) DESC,
            (LOWER(COALESCE(o.place, '')) = LOWER(?)) DESC,
            COALESCE(o.updatedAt, o.createdAt, o.orderDate) DESC
         LIMIT 5`,
        [...params, name, phone, place]
    );

    const candidates = Array.isArray(rows) ? rows : [];
    const convertedCandidates = candidates.filter(isConvertedWorkflow);
    if (convertedCandidates.length === 0) return null;

    return convertedCandidates.find((row) => Number(row.itemCount || 0) > 0) || convertedCandidates[0];
};

const run = async () => {
    const applyChanges = process.argv.includes('--apply');
    const dryRun = !applyChanges;

    try {
        const [rows] = await promisePool.query(
            `SELECT
                lo.id AS listOrderId,
                lo.status AS listStatus,
                lo.offlineOrderId,
                lo.customerName AS listCustomerName,
                lo.phone AS listPhone,
                lo.place AS listPlace,
                lo.notes,
                o.id AS orderId,
                o.customerName,
                o.phone,
                o.place,
                o.status,
                o.paymentStatus,
                o.orderType,
                o.\`type\` AS type,
                o.origin,
                o.isArchived,
                o.totalAmount,
                o.createdAt,
                o.updatedAt,
                COUNT(oi.id) AS itemCount
             FROM list_orders lo
             LEFT JOIN orders o ON o.id = lo.offlineOrderId
             LEFT JOIN order_items oi ON oi.orderId = o.id
             WHERE LOWER(lo.status) = 'converted'
               AND lo.offlineOrderId IS NOT NULL
             GROUP BY lo.id, o.id
             ORDER BY COALESCE(o.updatedAt, o.createdAt, o.orderDate, lo.updatedAt, lo.createdAt) DESC`
        );

        const directCandidates = Array.isArray(rows) ? rows.filter((row) => row.orderId) : [];
        const missingOrders = Array.isArray(rows) ? rows.filter((row) => !row.orderId) : [];
        const recoveredOrders = [];

        console.log(`Found ${directCandidates.length} linked converted-list order candidate(s).`);
        if (missingOrders.length > 0) {
            console.log(`Skipped ${missingOrders.length} converted list order(s) with missing linked offline orders.`);
            missingOrders.forEach((row) => {
                console.log(
                    JSON.stringify(
                        {
                            listOrderId: row.listOrderId,
                            offlineOrderId: row.offlineOrderId,
                            listCustomerName: row.listCustomerName,
                            listPhone: row.listPhone,
                            listPlace: row.listPlace,
                            listStatus: row.listStatus,
                            notes: row.notes,
                            createdAt: row.createdAt,
                            updatedAt: row.updatedAt,
                        },
                        null,
                        2
                    )
                );
            });
            for (const row of missingOrders) {
                const fallback = await findFallbackOrder(row);
                if (fallback) {
                    recoveredOrders.push({ listOrder: row, order: fallback });
                }
            }
            if (recoveredOrders.length > 0) {
                console.log(`Recovered ${recoveredOrders.length} missing converted-list order(s) by customer/place matching.`);
            }
        }

        const candidateMap = new Map();
        for (const candidate of [
            ...directCandidates.map((row) => ({ listOrder: row, order: row })),
            ...recoveredOrders,
        ]) {
            const orderId = candidate?.order?.orderId || candidate?.order?.id;
            if (!orderId || candidateMap.has(orderId)) continue;
            candidateMap.set(orderId, candidate);
        }

        const candidates = Array.from(candidateMap.values());

        candidates.forEach(({ listOrder, order }) => {
            console.log(
                JSON.stringify(
                    {
                        listOrderId: listOrder.listOrderId,
                        offlineOrderId: listOrder.offlineOrderId,
                        id: order.orderId || order.id,
                        customerName: order.customerName,
                        status: order.status,
                        paymentStatus: order.paymentStatus,
                        orderType: order.orderType,
                        type: order.type,
                        origin: order.origin,
                        isArchived: Boolean(order.isArchived),
                        itemCount: Number(order.itemCount || 0),
                    },
                    null,
                    2
                )
            );
        });

        if (dryRun) {
            console.log('Dry run only. Re-run with --apply to update matching rows.');
            process.exit(0);
        }

        let updatedCount = 0;
        for (const { order } of candidates) {
            const currentStatus = normalize(order.status);
            const nextStatus = currentStatus === 'completed' || currentStatus === 'rejected' ? order.status : 'converted';
            const nextArchived = currentStatus === 'completed' || currentStatus === 'rejected';

            const [result] = await promisePool.query(
                `UPDATE orders
                 SET \`type\` = 'list_converted',
                     origin = 'list_orders',
                     orderType = 'Offline',
                     status = ?,
                     isArchived = ?,
                     updatedAt = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [nextStatus, nextArchived ? 1 : 0, order.orderId || order.id]
            );

            if (result?.affectedRows > 0) {
                updatedCount += 1;
            }
        }

        const [verifiedRows] = await promisePool.query(
            `SELECT
                o.id,
                o.status,
                o.orderType,
                                o.\`type\` AS type,
                o.origin,
                o.isArchived,
                COUNT(oi.id) AS itemCount
             FROM orders o
             LEFT JOIN order_items oi ON oi.orderId = o.id
             WHERE o.orderType = 'Offline'
                             AND o.\`type\` = 'list_converted'
               AND o.origin = 'list_orders'
               AND LOWER(o.status) IN ('converted', 'processing', 'completed', 'rejected')
             GROUP BY o.id
             ORDER BY o.updatedAt DESC`
        );

        console.log(`Updated ${updatedCount} row(s). Verified ${Array.isArray(verifiedRows) ? verifiedRows.length : 0} row(s) in the converted-list workflow.`);
        process.exit(0);
    } catch (error) {
        console.error('Backfill failed:', error?.message || error);
        process.exit(1);
    }
};

run();