const { promisePool } = require('../config/db');

const ListOrderModel = {
  // Create a new list order
  async create(customerName, phone, place, imagePath, imageFileName, notes = '') {
    try {
      const [result] = await promisePool.query(
        `INSERT INTO list_orders (customerName, phone, place, imagePath, imageFileName, status, notes)
         VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        [customerName, phone, place, imagePath, imageFileName, notes]
      );
      return { id: result.insertId, ...{ customerName, phone, place, imagePath, imageFileName, status: 'pending', notes } };
    } catch (error) {
      console.error('ListOrderModel.create error:', error);
      throw error;
    }
  },

  // Get all list orders with filters
  async getAll(filters = {}) {
    try {
      let query = 'SELECT * FROM list_orders WHERE 1=1';
      const params = [];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.phone) {
        query += ' AND phone = ?';
        params.push(filters.phone);
      }

      if (filters.customerName) {
        query += ' AND customerName LIKE ?';
        params.push(`%${filters.customerName}%`);
      }

      query += ' ORDER BY createdAt DESC';
      
      const [rows] = await promisePool.query(query, params);
      return rows || [];
    } catch (error) {
      console.error('ListOrderModel.getAll error:', error);
      throw error;
    }
  },

  // Get list order by ID
  async getById(id) {
    try {
      const [rows] = await promisePool.query(
        'SELECT * FROM list_orders WHERE id = ?',
        [id]
      );
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('ListOrderModel.getById error:', error);
      throw error;
    }
  },

  // Update list order status
  async updateStatus(id, status, offlineOrderId = null) {
    try {
      const [result] = await promisePool.query(
        `UPDATE list_orders 
         SET status = ?, offlineOrderId = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, offlineOrderId, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('ListOrderModel.updateStatus error:', error);
      throw error;
    }
  },

  // Delete list order
  async delete(id) {
    try {
      const [result] = await promisePool.query(
        'DELETE FROM list_orders WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('ListOrderModel.delete error:', error);
      throw error;
    }
  },

  // Get recent list orders (for dashboard)
  async getRecent(limit = 10) {
    try {
      const [rows] = await promisePool.query(
        `SELECT * FROM list_orders 
         ORDER BY createdAt DESC LIMIT ?`,
        [limit]
      );
      return rows || [];
    } catch (error) {
      console.error('ListOrderModel.getRecent error:', error);
      throw error;
    }
  },

  // Get pending list orders count
  async getPendingCount() {
    try {
      const [rows] = await promisePool.query(
        'SELECT COUNT(*) as count FROM list_orders WHERE status = "pending"'
      );
      return rows && rows.length > 0 ? rows[0].count : 0;
    } catch (error) {
      console.error('ListOrderModel.getPendingCount error:', error);
      throw error;
    }
  }
};

module.exports = ListOrderModel;
