const Chat = require('../models/chatModel');
const { maxMessageLength: MAX_MESSAGE_LENGTH } = require('../config/chatConfig');

const normalizeMessage = (value) => String(value || '').trim();
const validateMessage = (value) => {
    const message = normalizeMessage(value);
    if (!message) return { error: 'Message cannot be empty.' };
    if (message.length > MAX_MESSAGE_LENGTH) return { error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.` };
    return { message };
};

const sendMessage = async (req, res, next, senderRole, customerId) => {
    try {
        const validation = validateMessage(req.body?.message);
        if (validation.error) return res.status(400).json({ success: false, message: validation.error });
        const conversation = await Chat.getOrCreateConversation(customerId);
        if (!conversation) return res.status(404).json({ success: false, message: 'Customer conversation not found.' });

        const message = senderRole === 'CUSTOMER'
            ? await Chat.createCustomerMessage({
                conversationId: conversation.id,
                senderId: req.user.id,
                message: validation.message,
            })
            : await Chat.createMessage({
                conversationId: conversation.id,
                senderId: req.user.id,
                senderRole,
                message: validation.message,
            });

        res.status(201).json({
            success: true,
            message: message.message || message,
            autoOwnerMessage: message.autoOwnerMessage || null,
        });
    } catch (error) {
        next(error);
    }
};

const getCustomerConversation = async (req, res, next) => {
    try {
        const conversation = await Chat.getCustomerConversation(req.user.id);
        res.json({ success: true, conversation, unreadCount: await Chat.getUnreadCustomerCount(req.user.id) });
    } catch (error) { next(error); }
};

const sendCustomerMessage = (req, res, next) => sendMessage(req, res, next, 'CUSTOMER', req.user.id);

const markCustomerRead = async (req, res, next) => {
    try {
        const conversation = await Chat.getOrCreateConversation(req.user.id);
        if (!conversation) return res.status(404).json({ success: false, message: 'Customer conversation not found.' });
        await Chat.markRead(conversation.id, 'CUSTOMER');
        res.json({ success: true, unreadCount: 0 });
    } catch (error) { next(error); }
};

const getCustomerUnreadCount = async (req, res, next) => {
    try { res.json({ success: true, unreadCount: await Chat.getUnreadCustomerCount(req.user.id) }); }
    catch (error) { next(error); }
};

const getAdminChats = async (req, res, next) => {
    try { res.json({ success: true, conversations: await Chat.getAdminConversations(String(req.query.search || '').trim()) }); }
    catch (error) { next(error); }
};

const getAdminChat = async (req, res, next) => {
    try {
        const customerId = Number(req.params.customerId);
        if (!Number.isInteger(customerId) || customerId <= 0) return res.status(400).json({ success: false, message: 'Invalid customer id.' });
        const conversation = await Chat.getConversationForAdmin(customerId);
        if (!conversation) return res.status(404).json({ success: false, message: 'Customer conversation not found.' });
        res.json({ success: true, conversation });
    } catch (error) { next(error); }
};

const sendAdminMessage = async (req, res, next) => {
    try {
        const customerId = Number(req.params.customerId);
        if (!Number.isInteger(customerId) || customerId <= 0) return res.status(400).json({ success: false, message: 'Invalid customer id.' });
        const conversation = await Chat.getConversationForAdmin(customerId);
        if (!conversation) return res.status(404).json({ success: false, message: 'Customer not found.' });
        return sendMessage(req, res, next, 'ADMIN', customerId);
    } catch (error) { next(error); }
};

const markAdminRead = async (req, res, next) => {
    try {
        const customerId = Number(req.params.customerId);
        const conversation = await Chat.getConversationForAdmin(customerId);
        if (!conversation) return res.status(404).json({ success: false, message: 'Customer conversation not found.' });
        await Chat.markRead(conversation.id, 'ADMIN');
        res.json({ success: true, unreadCount: 0 });
    } catch (error) { next(error); }
};

const getAdminUnreadCount = async (req, res, next) => {
    try { res.json({ success: true, unreadCount: await Chat.getUnreadAdminCount() }); }
    catch (error) { next(error); }
};

module.exports = {
    getCustomerConversation, sendCustomerMessage, markCustomerRead, getCustomerUnreadCount,
    getAdminChats, getAdminChat, sendAdminMessage, markAdminRead, getAdminUnreadCount,
};
