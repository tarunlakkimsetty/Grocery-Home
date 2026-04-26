const fs = require('fs');
const path = require('path');
const ListOrderModel = require('../models/listOrderModel');
const User = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/list-orders');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ListOrderController = {
  // Upload grocery list image(s)
  uploadImage: asyncHandler(async (req, res) => {
    console.log('=== Upload Request Started ===');
    console.log('Body:', req.body);
    console.log('Files received:', req.files ? `${req.files.length} files` : 'No files');
    console.log('File details:', req.files?.map(f => ({ name: f.originalname, size: f.size, mimetype: f.mimetype })));
    
    const { customerName, phone, place, notes } = req.body;

    if (!customerName || !phone) {
      console.log('Error: Missing customerName or phone');
      return res.status(400).json({ 
        error: 'Customer name and phone are required' 
      });
    }

    if (!place) {
      console.log('Error: Missing place');
      return res.status(400).json({ 
        error: 'Place/City is required' 
      });
    }

    // Support both single file (req.file) and multiple files (req.files)
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      console.log('Error: No files provided');
      return res.status(400).json({ 
        error: 'At least one image file is required' 
      });
    }

    try {
      console.log(`Processing ${files.length} files...`);
      
      // Save all files and collect paths
      const imagePaths = [];
      const imageFileNames = [];

      for (const file of files) {
        const fileName = `list-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
        const filePath = path.join(uploadsDir, fileName);
        
        console.log(`Saving file: ${fileName}`);
        fs.writeFileSync(filePath, file.buffer);
        imagePaths.push(`/uploads/list-orders/${fileName}`);
        imageFileNames.push(fileName);
        console.log(`File saved successfully: ${fileName}`);
      }

      console.log('All files saved. Creating DB entry...');
      console.log('imagePaths:', imagePaths);
      console.log('imageFileNames:', imageFileNames);
      
      // Store as JSON in database (for now, backward compatible)
      const imagePathJson = JSON.stringify(imagePaths);
      const imageFileNamesJson = JSON.stringify(imageFileNames);

      console.log('imagePathJson:', imagePathJson);
      console.log('imageFileNamesJson:', imageFileNamesJson);

      // Create database entry
      const listOrder = await ListOrderModel.create(
        customerName,
        phone,
        place,
        imagePathJson,
        imageFileNamesJson,
        notes || ''
      );

      console.log('DB entry created:', listOrder);

      // Parse back for response (primary image is first one for backward compatibility)
      const response = {
        ...listOrder,
        imagePath: imagePaths[0], // For backward compatibility
        imagePaths: imagePaths,   // New field for multiple images
        imageFileNames: imageFileNames
      };

      console.log('=== Upload Request Successful ===');
      res.status(201).json({
        success: true,
        message: `${files.length} grocery list image(s) uploaded successfully`,
        data: response
      });
    } catch (error) {
      console.error('=== ListOrderController.uploadImage ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', error);
      res.status(500).json({ 
        error: 'Failed to upload grocery list',
        details: error.message
      });
    }
  }),

  // Get all list orders
  getAllListOrders: asyncHandler(async (req, res) => {
    try {
      const { status, phone, customerName } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (phone) filters.phone = phone;
      if (customerName) filters.customerName = customerName;

      let listOrders = await ListOrderModel.getAll(filters);
      
      // Parse imagePath JSON and provide both backward compatible and new fields
      listOrders = listOrders.map(order => {
        try {
          const imagePaths = JSON.parse(order.imagePath);
          return {
            ...order,
            imagePaths: Array.isArray(imagePaths) ? imagePaths : [order.imagePath],
            imagePath: Array.isArray(imagePaths) ? imagePaths[0] : order.imagePath
          };
        } catch {
          return {
            ...order,
            imagePaths: [order.imagePath],
            imagePath: order.imagePath
          };
        }
      });
      
      res.json({
        success: true,
        data: listOrders,
        count: listOrders.length
      });
    } catch (error) {
      console.error('ListOrderController.getAllListOrders error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch list orders' 
      });
    }
  }),

  // Get single list order
  getListOrderById: asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const listOrder = await ListOrderModel.getById(id);

      if (!listOrder) {
        return res.status(404).json({ 
          error: 'List order not found' 
        });
      }

      res.json({
        success: true,
        data: listOrder
      });
    } catch (error) {
      console.error('ListOrderController.getListOrderById error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch list order' 
      });
    }
  }),

  // Update list order status (convert to offline order)
  updateListOrderStatus: asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { status, offlineOrderId } = req.body;

      if (!status || !['pending', 'converted'].includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status' 
        });
      }

      const updated = await ListOrderModel.updateStatus(id, status, offlineOrderId || null);

      if (!updated) {
        return res.status(404).json({ 
          error: 'List order not found' 
        });
      }

      res.json({
        success: true,
        message: 'List order status updated',
        data: { id, status, offlineOrderId }
      });
    } catch (error) {
      console.error('ListOrderController.updateListOrderStatus error:', error);
      res.status(500).json({ 
        error: 'Failed to update list order' 
      });
    }
  }),

  // Delete list order
  deleteListOrder: asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const listOrder = await ListOrderModel.getById(id);

      if (!listOrder) {
        return res.status(404).json({ 
          error: 'List order not found' 
        });
      }

      // Delete image file
      const filePath = path.join(__dirname, '..', listOrder.imagePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete database entry
      await ListOrderModel.delete(id);

      res.json({
        success: true,
        message: 'List order deleted'
      });
    } catch (error) {
      console.error('ListOrderController.deleteListOrder error:', error);
      res.status(500).json({ 
        error: 'Failed to delete list order' 
      });
    }
  }),

  // Get recent list orders
  getRecentListOrders: asyncHandler(async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const listOrders = await ListOrderModel.getRecent(parseInt(limit));

      res.json({
        success: true,
        data: listOrders
      });
    } catch (error) {
      console.error('ListOrderController.getRecentListOrders error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch recent list orders' 
      });
    }
  }),

  // Get pending count
  getPendingCount: asyncHandler(async (req, res) => {
    try {
      const count = await ListOrderModel.getPendingCount();

      res.json({
        success: true,
        data: { pendingCount: count }
      });
    } catch (error) {
      console.error('ListOrderController.getPendingCount error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch pending count' 
      });
    }
  }),

  // Get customer's previous uploads (public route - by phone number from request)
  getCustomerUploads: asyncHandler(async (req, res) => {
    try {
      // 🔒 SECURE: Extract phone from JWT token (via authMiddleware)
      let userPhone = req.user?.phone;
      
      // Backward compatibility: if phone not in token, fetch from database using user ID
      if (!userPhone && req.user?.id) {
        const user = await User.findById(req.user.id);
        userPhone = user?.phone;
      }
      
      if (!userPhone) {
        return res.status(401).json({ 
          success: false,
          error: 'Authentication required. Could not retrieve phone number.' 
        });
      }

      // 🔒 Filter uploads by authenticated user's phone ONLY
      let uploads = await ListOrderModel.getAll({ 
        phone: userPhone
      });

      // Parse imagePath JSON and provide both backward compatible and new fields
      uploads = uploads.map(order => {
        try {
          // Try to parse imagePath as JSON array
          let imagePaths = [];
          try {
            const parsed = JSON.parse(order.imagePath);
            imagePaths = Array.isArray(parsed) ? parsed : [order.imagePath];
          } catch (e) {
            imagePaths = [order.imagePath];
          }
          
          return {
            ...order,
            imagePaths: imagePaths, // Always an array
            imagePath: imagePaths[0] || order.imagePath, // First image for backward compatibility
            place: order.place || ''
          };
        } catch {
          return {
            ...order,
            imagePaths: [order.imagePath],
            imagePath: order.imagePath,
            place: order.place || ''
          };
        }
      });

      res.json({
        success: true,
        data: uploads,
        count: uploads.length
      });
    } catch (error) {
      console.error('ListOrderController.getCustomerUploads error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch customer uploads' 
      });
    }
  })
};

module.exports = ListOrderController;
