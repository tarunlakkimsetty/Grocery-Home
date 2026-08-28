const { promisePool } = require('../config/db');
const { ownerPhone: OWNER_PHONE } = require('../config/chatConfig');

const DEFAULT_OWNER_MESSAGE = `👋 Hi! Welcome to our store.

💬 Need help with your order or products?
Our owner will get back to you within 24 hours.

📞 For urgent assistance, call ${OWNER_PHONE}.`;
const DEFAULT_GAP_MS = 10 * 60 * 1000;

const normalizeSenderRole = (value) => String(value || '').toUpperCase();

const mapMessage = (row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    message: row.message,
    isReadByCustomer: Boolean(row.is_read_by_customer),
    isReadByAdmin: Boolean(row.is_read_by_admin),
    createdAt: row.created_at,
});

const getUnreadDelta = (senderRole) => {
    const role = normalizeSenderRole(senderRole);
    if (role === 'CUSTOMER') return { unreadForAdmin: 1, unreadForCustomer: 0 };
    if (role === 'ADMIN') return { unreadForAdmin: 0, unreadForCustomer: 1 };
    return { unreadForAdmin: 0, unreadForCustomer: 0 };
};

const shouldSendDefaultOwnerMessage = ({ latestCustomerAt, gapMs = DEFAULT_GAP_MS, currentTime = Date.now() }) => {
    if (!latestCustomerAt) return false;
    const lastCustomerMs = new Date(latestCustomerAt).getTime();
    if (!Number.isFinite(lastCustomerMs)) return false;
    return currentTime - lastCustomerMs >= gapMs;
};

const findOwnerSenderId = async (connection) => {
    const [rows] = await connection.query(
        `SELECT id
         FROM users
         WHERE phone = ? OR role = 'admin'
         ORDER BY CASE WHEN phone = ? THEN 0 ELSE 1 END, id ASC
         LIMIT 1`,
        [OWNER_PHONE, OWNER_PHONE]
    );
    return rows[0]?.id || null;
};

const Chat = {
    DEFAULT_OWNER_MESSAGE,
    shouldSendDefaultOwnerMessage,
    formatDateSeparatorLabel: (value) => {
        const date = new Date(value);
        if (!Number.isFinite(date.getTime())) return '';

        const today = new Date();
        const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.round((currentDay - targetDay) / 86400000);

        const shortDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
        if (diffDays === 0) return `📅 Today, ${shortDate}`;
        if (diffDays === 1) return `📅 Yesterday, ${shortDate}`;
        const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
        return `📅 ${weekday}, ${shortDate}`;
    },

    getOrCreateConversation: async (customerId) => {
        await promisePool.query(
            `INSERT INTO chat_conversations (customer_id)
             VALUES (?) ON DUPLICATE KEY UPDATE customer_id = VALUES(customer_id)`,
            [customerId]
        );
        const [rows] = await promisePool.query(
            `SELECT c.*, u.fullName AS customer_name, u.phone AS customer_phone
             FROM chat_conversations c JOIN users u ON u.id = c.customer_id
             WHERE c.customer_id = ? LIMIT 1`,
            [customerId]
        );
        const conversation = rows[0] || null;
        if (conversation) {
            await Chat.ensureDefaultOwnerMessage(conversation.id);
        }
        return conversation;
    },

    ensureDefaultOwnerMessage: async (conversationId) => {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();
            const [conversationRows] = await connection.query(
                'SELECT id FROM chat_conversations WHERE id = ? FOR UPDATE',
                [conversationId]
            );
            if (!conversationRows[0]) {
                await connection.rollback();
                return null;
            }

            const [systemRows] = await connection.query(
                `SELECT id
                 FROM chat_messages
                 WHERE conversation_id = ? AND sender_role = 'SYSTEM'
                 ORDER BY created_at DESC, id DESC
                 LIMIT 1`,
                [conversationId]
            );
            if (systemRows.length > 0) {
                await connection.commit();
                return mapMessage(systemRows[0]);
            }

            const senderId = await findOwnerSenderId(connection);
            if (!senderId) {
                await connection.rollback();
                return null;
            }

            const [result] = await connection.query(
                `INSERT INTO chat_messages
                    (conversation_id, sender_id, sender_role, message, is_read_by_customer, is_read_by_admin)
                 VALUES (?, ?, 'SYSTEM', ?, FALSE, FALSE)`,
                [conversationId, senderId, DEFAULT_OWNER_MESSAGE]
            );
            const [rows] = await connection.query(
                `SELECT id, conversation_id, sender_id, sender_role, message,
                        is_read_by_customer, is_read_by_admin, created_at
                 FROM chat_messages WHERE id = ?`,
                [result.insertId]
            );
            await connection.commit();
            return mapMessage(rows[0]);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    getMessages: async (conversationId, limit = 100) => {
        const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
        const [rows] = await promisePool.query(
            `SELECT id, conversation_id, sender_id, sender_role, message,
                    is_read_by_customer, is_read_by_admin, created_at
             FROM chat_messages
             WHERE conversation_id = ?
             ORDER BY created_at ASC, id ASC
             LIMIT ${safeLimit}`,
            [conversationId]
        );
        return rows.map(mapMessage);
    },

    createMessage: async ({ conversationId, senderId, senderRole, message }) => {
        const role = normalizeSenderRole(senderRole);
        const unreadDelta = getUnreadDelta(role);
        const [result] = await promisePool.query(
            `INSERT INTO chat_messages
                (conversation_id, sender_id, sender_role, message, is_read_by_customer, is_read_by_admin)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [conversationId, senderId, role, message, role === 'CUSTOMER', role === 'ADMIN']
        );
        await promisePool.query(
            `UPDATE chat_conversations
             SET last_message_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP,
                 unread_for_admin = unread_for_admin + ?,
                 unread_for_customer = unread_for_customer + ?
             WHERE id = ?`,
            [unreadDelta.unreadForAdmin, unreadDelta.unreadForCustomer, conversationId]
        );
        const [rows] = await promisePool.query(
            `SELECT id, conversation_id, sender_id, sender_role, message,
                    is_read_by_customer, is_read_by_admin, created_at
             FROM chat_messages WHERE id = ?`,
            [result.insertId]
        );
        return mapMessage(rows[0]);
    },

    createCustomerMessage: async ({ conversationId, senderId, message }) => {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();
            const [conversationRows] = await connection.query(
                'SELECT id FROM chat_conversations WHERE id = ? FOR UPDATE',
                [conversationId]
            );
            if (!conversationRows[0]) {
                throw new Error('Conversation not found.');
            }

            const [latestCustomerRows] = await connection.query(
                `SELECT created_at
                 FROM chat_messages
                 WHERE conversation_id = ? AND sender_role = 'CUSTOMER'
                 ORDER BY created_at DESC, id DESC
                 LIMIT 1`,
                [conversationId]
            );
            const [latestSystemRows] = await connection.query(
                `SELECT created_at
                 FROM chat_messages
                 WHERE conversation_id = ? AND sender_role = 'SYSTEM'
                 ORDER BY created_at DESC, id DESC
                 LIMIT 1`,
                [conversationId]
            );

            const shouldSend = shouldSendDefaultOwnerMessage({
                latestCustomerAt: latestCustomerRows[0]?.created_at,
                latestSystemAt: latestSystemRows[0]?.created_at,
            });

            const [customerResult] = await connection.query(
                `INSERT INTO chat_messages
                    (conversation_id, sender_id, sender_role, message, is_read_by_customer, is_read_by_admin)
                 VALUES (?, ?, 'CUSTOMER', ?, TRUE, FALSE)`,
                [conversationId, senderId, message]
            );

            let autoOwnerMessage = null;
            if (shouldSend) {
                const senderIdForOwner = await findOwnerSenderId(connection);
                if (senderIdForOwner) {
                    const [systemResult] = await connection.query(
                        `INSERT INTO chat_messages
                            (conversation_id, sender_id, sender_role, message, is_read_by_customer, is_read_by_admin)
                         VALUES (?, ?, 'SYSTEM', ?, FALSE, FALSE)`,
                        [conversationId, senderIdForOwner, DEFAULT_OWNER_MESSAGE]
                    );
                    const [systemRows] = await connection.query(
                        `SELECT id, conversation_id, sender_id, sender_role, message,
                                is_read_by_customer, is_read_by_admin, created_at
                         FROM chat_messages WHERE id = ?`,
                        [systemResult.insertId]
                    );
                    autoOwnerMessage = mapMessage(systemRows[0]);
                }
            }

            await connection.query(
                `UPDATE chat_conversations
                 SET last_message_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP,
                     unread_for_admin = unread_for_admin + 1,
                     unread_for_customer = unread_for_customer + 0
                 WHERE id = ?`,
                [conversationId]
            );

            const [customerRows] = await connection.query(
                `SELECT id, conversation_id, sender_id, sender_role, message,
                        is_read_by_customer, is_read_by_admin, created_at
                 FROM chat_messages WHERE id = ?`,
                [customerResult.insertId]
            );

            await connection.commit();
            return { message: mapMessage(customerRows[0]), autoOwnerMessage };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    markRead: async (conversationId, readerRole) => {
        const isCustomer = readerRole === 'CUSTOMER';
        const messageColumn = isCustomer ? 'is_read_by_customer' : 'is_read_by_admin';
        const unreadColumn = isCustomer ? 'unread_for_customer' : 'unread_for_admin';
        await promisePool.query(
            `UPDATE chat_messages SET ${messageColumn} = TRUE
             WHERE conversation_id = ? AND sender_role = ?`,
            [conversationId, isCustomer ? 'ADMIN' : 'CUSTOMER']
        );
        await promisePool.query(
            `UPDATE chat_conversations SET ${unreadColumn} = 0 WHERE id = ?`,
            [conversationId]
        );
    },

    getCustomerConversation: async (customerId) => {
        const conversation = await Chat.getOrCreateConversation(customerId);
        if (!conversation) return null;
        return { ...conversation, messages: await Chat.getMessages(conversation.id) };
    },

    getAdminConversations: async (search = '') => {
        const params = [];
        let where = 'WHERE u.role = \'customer\'';
        if (search) {
            where += ' AND (u.fullName LIKE ? OR u.phone LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        const [rows] = await promisePool.query(
            `SELECT u.id AS customer_id, u.fullName AS customer_name, u.phone AS customer_phone,
                    c.id AS conversation_id, c.last_message_at, c.unread_for_admin,
                    (SELECT message FROM chat_messages m WHERE m.conversation_id = c.id
                     ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message
             FROM users u LEFT JOIN chat_conversations c ON c.customer_id = u.id
             ${where}
             ORDER BY COALESCE(c.last_message_at, u.createdAt) DESC, u.id DESC`,
            params
        );
        return rows;
    },

    getConversationForAdmin: async (customerId) => {
        const conversation = await Chat.getOrCreateConversation(customerId);
        if (!conversation) return null;
        return { ...conversation, messages: await Chat.getMessages(conversation.id) };
    },

    getUnreadAdminCount: async () => {
        const [rows] = await promisePool.query(
            'SELECT COALESCE(SUM(unread_for_admin), 0) AS unread_count FROM chat_conversations'
        );
        return Number(rows[0]?.unread_count || 0);
    },

    getUnreadCustomerCount: async (customerId) => {
        const [rows] = await promisePool.query(
            'SELECT COALESCE(unread_for_customer, 0) AS unread_count FROM chat_conversations WHERE customer_id = ?',
            [customerId]
        );
        return Number(rows[0]?.unread_count || 0);
    },
};

module.exports = Chat;
