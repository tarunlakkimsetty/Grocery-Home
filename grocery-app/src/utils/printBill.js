import { t } from './i18n';

const escapeHtml = (value) => {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const toSingleLineAddress = (value) => {
    const raw = String(value ?? '');
    const parts = raw
        .split(/\r?\n/)
        .map((p) => String(p).trim())
        .filter(Boolean)
        .map((p) => (p.endsWith(',') ? p.slice(0, -1).trim() : p));

    const joined = parts.join(', ');
    return joined
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s{2,}/g, ' ')
        .trim();
};

const formatCurrency = (value) => {
    const num = Number(value || 0) || 0;
    return `₹${num.toFixed(2)}`;
};

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const tr = (key, fallback) => {
    const val = t(key);
    return val && val !== key ? val : (fallback ?? key);
};

const formatPaymentMethod = (raw) => {
    const v = String(raw || '').trim();
    if (!v) return '—';
    const normalized = v.toLowerCase();
    if (normalized === 'cash') return tr('cash', 'Cash');
    if (normalized === 'card') return tr('card', 'Card');
    if (normalized === 'upi') return tr('upi', 'UPI');
    if (normalized === 'cod' || normalized === 'cash on delivery') return tr('cashOnDelivery', 'Cash on Delivery');
    return v;
};

export const openBillPrintWindow = (billPayload) => {
    const bill = billPayload?.bill || billPayload || {};
    const shop = bill.shop || {};
    const order = bill.order || {};
    const items = Array.isArray(bill.items) ? bill.items : [];
    const totals = bill.totals || {};

    // Ensure shop header is fully localized (shop name/address are static app strings).
    const headerShopName = tr('shopName', shop?.name || 'Shop');
    const headerShopAddress = toSingleLineAddress(tr('address', shop?.address || ''));
    const headerShopPhone = shop?.phone || tr('phone', '—');
    const headerShopGst = shop?.gst || null;

    const rows = items
        .map((item, index) => {
            const quantity = Number(item?.quantity || 0) || 0;
            const price = Number(item?.price || 0) || 0;
            const subtotal = Number(item?.subtotal || quantity * price || 0) || 0;
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(item?.productName || item?.name || '')}</td>
                    <td class="text-right">${quantity}</td>
                    <td class="text-right">${formatCurrency(price)}</td>
                    <td class="text-right">${formatCurrency(subtotal)}</td>
                </tr>
            `;
        })
        .join('');

    const html = `
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8" />
            <title>${escapeHtml(tr('bill', 'Bill'))} #${escapeHtml(order?.id || '')}</title>
            <style>
                @page { size: A4; margin: 14mm; }
                * { box-sizing: border-box; }
                body {
                    font-family: "Nirmala UI", "Noto Sans Telugu", Arial, sans-serif;
                    color: #222;
                    margin: 0;
                    font-size: 12px;
                    line-height: 1.4;
                }
                .invoice {
                    width: 100%;
                    max-width: 780px;
                    margin: 0 auto;
                }
                .header {
                    border-bottom: 2px solid #1f2937;
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                }
                .shop-name { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
                .muted { color: #4b5563; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
                .box { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; }
                .box h4 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                th, td { border: 1px solid #d1d5db; padding: 6px; }
                th { background: #f3f4f6; text-align: left; }
                .text-right { text-align: right; }
                .totals { margin-top: 10px; margin-left: auto; width: 320px; }
                .totals-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #d1d5db; padding: 4px 0; }
                .totals-row.total { font-weight: 700; font-size: 14px; border-bottom: 2px solid #111827; }
                .footer { margin-top: 14px; font-size: 11px; color: #4b5563; }
                .print-toolbar { display: flex; justify-content: flex-end; margin: 0 0 10px; }
                .print-btn {
                    border: 1px solid #d1d5db;
                    background: #f9fafb;
                    padding: 6px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                }
                @media print {
                    .print-toolbar { display: none !important; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="invoice">
                <div class="print-toolbar">
                    <button class="print-btn" onclick="window.print()">🖨️ ${escapeHtml(tr('printSavePdf', 'Print / Save as PDF'))}</button>
                </div>

                <div class="header">
                    <p class="shop-name">${escapeHtml(headerShopName)}</p>
                    <div class="muted">${escapeHtml(headerShopAddress)}</div>
                    <div class="muted">${escapeHtml(tr('phoneNumber', 'Phone Number'))}: ${escapeHtml(headerShopPhone)}</div>
                    ${headerShopGst ? `<div class="muted">${escapeHtml(tr('gst', 'GST'))}: ${escapeHtml(headerShopGst)}</div>` : ''}
                </div>

                <div class="grid">
                    <div class="box">
                        <h4>${escapeHtml(tr('orderDetails', 'Order Details'))}</h4>
                        <div>${escapeHtml(tr('orderId', 'Order ID'))}: <strong>#${escapeHtml(order?.id || '')}</strong></div>
                        <div>${escapeHtml(tr('orderDate', 'Order Date'))}: ${escapeHtml(formatDateTime(order?.orderDate))}</div>
                        <div>${escapeHtml(tr('paymentMethod', 'Payment Method'))}: ${escapeHtml(formatPaymentMethod(order?.paymentMethod || 'Cash'))}</div>
                    </div>
                    <div class="box">
                        <h4>${escapeHtml(tr('customerDetails', 'Customer Details'))}</h4>
                        <div>${escapeHtml(tr('customerName', 'Customer Name'))}: ${escapeHtml(order?.customerName || '—')}</div>
                        <div>${escapeHtml(tr('phoneNumber', 'Phone Number'))}: ${escapeHtml(order?.customerPhone || '—')}</div>
                        <div>${escapeHtml(tr('placeCity', 'Place / City'))}: ${escapeHtml(order?.place || '—')}</div>
                        <div>${escapeHtml(tr('addressLabel', 'Address'))}: ${escapeHtml(order?.customerAddress || '—')}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th>${escapeHtml(tr('productName', 'Product Name'))}</th>
                            <th style="width: 90px;" class="text-right">${escapeHtml(tr('quantity', 'Quantity'))}</th>
                            <th style="width: 120px;" class="text-right">${escapeHtml(tr('price', 'Price'))}</th>
                            <th style="width: 120px;" class="text-right">${escapeHtml(tr('total', 'Total'))}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows || `<tr><td colspan="5" style="text-align:center;">${escapeHtml(tr('noItems', 'No items'))}</td></tr>`}
                    </tbody>
                </table>

                <div class="totals">
                    <div class="totals-row"><span>${escapeHtml(tr('billAmount', 'Bill Amount'))}</span><strong>${formatCurrency(totals?.totalAmount)}</strong></div>
                    <div class="totals-row"><span>${escapeHtml(tr('advance', 'Advance'))}</span><strong>${formatCurrency(totals?.advanceAmount)}</strong></div>
                    <div class="totals-row total"><span>${escapeHtml(tr('remaining', 'Remaining Amount'))}</span><strong>${formatCurrency(totals?.remainingBalance)}</strong></div>
                </div>

                <div class="footer">${escapeHtml(tr('thankYou', 'Thank You'))}</div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'width=920,height=900');
    if (!printWindow || !printWindow.document) {
        throw new Error('Popup blocked. Please allow popups to print bill.');
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    if (typeof printWindow.focus === 'function') {
        printWindow.focus();
    }
};
