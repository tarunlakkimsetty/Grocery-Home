const { promisePool } = require('../config/db');

const ListOrderModel = {
  // Create a new list order
  async create(customerName, phone, place, imagePath, imageFileName, notes = '') {
    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction();

      const getNextGlobalOrderId = async () => {
        const [rows] = await connection.query(
          `SELECT GREATEST(
              COALESCE((SELECT MAX(id) FROM orders), 0),
              COALESCE((SELECT MAX(global_order_id) FROM list_orders), 0)
            ) AS maxId`
        );
        const maxId = Number(rows?.[0]?.maxId || 0);
        return maxId + 1;
      };

      let nextGlobalOrderId = await getNextGlobalOrderId();
      let insertResult;
      let retries = 0;
      const MAX_RETRIES = 3;

      while (retries < MAX_RETRIES) {
        try {
          console.log('Generated list_orders.global_order_id:', nextGlobalOrderId);
          [insertResult] = await connection.query(
            `INSERT INTO list_orders (customerName, phone, place, imagePath, imageFileName, status, notes, global_order_id)
             VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
            [customerName, phone, place, imagePath, imageFileName, notes, nextGlobalOrderId]
          );
          break;
        } catch (error) {
          if (error && error.errno === 1062) {
            retries += 1;
            nextGlobalOrderId = await getNextGlobalOrderId();
            continue;
          }
          throw error;
        }
      }

      if (!insertResult) {
        throw new Error('Failed to insert list order after retrying for a global order id');
      }

      await connection.commit();

      try {
        await connection.query('ALTER TABLE orders AUTO_INCREMENT = ?', [nextGlobalOrderId + 1]);
        console.log('Adjusted orders AUTO_INCREMENT to', nextGlobalOrderId + 1);
      } catch (autoIncError) {
        console.warn('Could not adjust orders AUTO_INCREMENT:', autoIncError.message || autoIncError);
      }

      return {
        id: insertResult.insertId,
        global_order_id: nextGlobalOrderId,
        customerName,
        phone,
        place,
        imagePath,
        imageFileName,
        status: 'pending',
        notes
      };
    } catch (error) {
      await connection.rollback();
      console.error('ListOrderModel.create error:', error);
      throw error;
    } finally {
      connection.release();
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
      console.log('[listOrderModel.getById] executing query for id:', id);
      const [rows] = await promisePool.query(
        'SELECT * FROM list_orders WHERE id = ?',
        [id]
      );
      console.log('[listOrderModel.getById] rows returned:', rows?.length || 0);
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
