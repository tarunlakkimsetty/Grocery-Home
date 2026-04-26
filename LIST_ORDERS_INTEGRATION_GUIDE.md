# List Orders Feature - Integration & Testing Guide

## 📋 Overview
This guide provides step-by-step instructions to complete the integration of the List Orders feature in your Grocery Shopping application.

---

## 🔧 Step 1: Run the Database Migration

The feature requires a new `list_orders` table in your database. Follow these steps:

### Option A: Using the Migration Script (Recommended)
```bash
cd backend
node scripts/createListOrdersTable.js
```

**Expected Output:**
```
✓ list_orders table created successfully
```

### Option B: Manual SQL Execution
If the script doesn't work, run the SQL directly:

1. Open your MySQL client:
   ```bash
   mysql -u root -p grocery_db
   ```

2. Paste this SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS list_orders (
       id INT AUTO_INCREMENT PRIMARY KEY,
       customerName VARCHAR(100) NOT NULL,
       phone VARCHAR(15) NOT NULL,
       imagePath TEXT NOT NULL,
       imageFileName VARCHAR(255) NOT NULL,
       status ENUM('pending', 'converted') DEFAULT 'pending',
       offlineOrderId INT NULL,
       notes TEXT,
       createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       INDEX idx_phone (phone),
       INDEX idx_status (status),
       INDEX idx_createdAt (createdAt)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```

3. Verify:
   ```sql
   DESCRIBE list_orders;
   ```

---

## 🚀 Step 2: Backend Setup

### 1. Ensure Backend is Running
```bash
cd backend
npm install  # if needed
npm start
```

Expected output: `Server running on port 5000`

### 2. Verify Files Created
Check that these files exist:
- ✓ `backend/models/listOrderModel.js`
- ✓ `backend/controllers/listOrderController.js`
- ✓ `backend/routes/listOrderRoutes.js`
- ✓ `backend/scripts/createListOrdersTable.js`

### 3. Verify app.js Integration
Check that `app.js` includes:
```javascript
const listOrderRoutes = require('./routes/listOrderRoutes');
// ... in routes section:
app.use('/api/list-orders', listOrderRoutes);
```

---

## 💻 Step 3: Frontend Setup

### 1. Ensure Frontend Files Exist
Check that these files exist:
- ✓ `grocery-app/src/pages/ListOrdersUploadPage.js`
- ✓ `grocery-app/src/pages/AdminListOrdersPage.js`
- ✓ `grocery-app/src/services/listOrderService.js`

### 2. Verify Routes Added
Check `grocery-app/src/routes/AppRoutes.js` includes:
```javascript
import ListOrdersUploadPage from '../pages/ListOrdersUploadPage';
import AdminListOrdersPage from '../pages/AdminListOrdersPage';

// Customer route
<Route path="/upload-grocery-list" element={...} />

// Admin route  
<Route path="/admin/list-orders" element={...} />
```

### 3. Verify Navigation Added
Check `grocery-app/src/components/Sidebar.js` includes:
- ✓ Customer link: `📸 Upload List` → `/upload-grocery-list`
- ✓ Admin link: `📋 List Orders` → `/admin/list-orders`

### 4. Start Frontend
```bash
cd grocery-app
npm start
```

Expected: App opens at `http://localhost:3000`

---

## 🧪 Step 4: Testing the Feature

### Test 1: Customer Upload Grocery List

**Steps:**
1. Login as a customer
2. Go to **"Upload List"** in the sidebar
3. Fill in:
   - Customer Name: `Test Customer`
   - Phone: `9876543210`
   - Select an image from your device
   - Notes: `Please prioritize dairy products`
4. Click **"Upload List"**

**Expected Result:**
- ✅ Success toast: "Grocery list uploaded successfully!"
- ✅ Form clears
- ✅ Green success message appears

---

### Test 2: Admin View List Orders

**Steps:**
1. Logout and login as admin
2. Go to **"List Orders"** in the admin menu
3. Verify you see:
   - Thumbnail of uploaded image
   - Customer name, phone
   - Status badge (should say "pending")
   - Date/time of upload

**Expected Result:**
- ✅ Table displays the uploaded list order
- ✅ Pending badge shows count of pending orders
- ✅ Image thumbnail is visible

---

### Test 3: View Image & Details

**Steps:**
1. In the List Orders table, click **"View"** button
2. A modal should open showing:
   - Full-size image
   - Customer details (name, phone, status, date, notes)
   - Action buttons (Print, Convert, Delete)

**Expected Result:**
- ✅ Modal displays with full image preview
- ✅ All details are visible
- ✅ Can close modal with X button

---

### Test 4: Print Grocery List

**Steps:**
1. Click the **"Print"** button (either from table or modal)
2. Browser print dialog opens
3. Print or preview the document

**Expected Result:**
- ✅ Print preview shows:
  - Customer name and phone
  - Order reference number
  - Full image of grocery list
  - Date/time information
  - Professional formatting

---

### Test 5: Filter List Orders

**Steps:**
1. In the List Orders page, use the filters:
   - Search by customer name: e.g., "Test"
   - Filter by status: Select "pending"

**Expected Result:**
- ✅ Table filters in real-time
- ✅ Shows only matching orders

---

### Test 6: Delete List Order

**Steps:**
1. Click **"Delete"** button on any list order
2. Confirm the deletion
3. Image is removed and order is deleted from database

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Order is removed from table
- ✅ Image file is deleted from server
- ✅ Toast message: "Grocery list deleted"

---

## 🔗 Step 5: Integration with Offline Orders (Future)

### Current State
The "Convert to Offline Order" button is implemented and ready to link with the offline orders system.

### How It Works
When admin clicks **"Convert"** on a list order:
1. Modal closes
2. Pre-filled data should include:
   - Customer name
   - Phone number
   - Reference to the list order image

### To Complete Integration
You'll need to:
1. Modify `AdminOfflineOrdersPage` to accept pre-filled data
2. Pass list order ID and image path to the offline order creation
3. Update status to "converted" when order is created

---

## 🌍 API Endpoints Reference

### Public (No Authentication Required)
- **POST** `/api/list-orders/upload` - Upload grocery list image

### Protected (Admin Authentication Required)
- **GET** `/api/list-orders` - Get all list orders with filters
- **GET** `/api/list-orders/pending-count` - Get count of pending orders
- **GET** `/api/list-orders/recent` - Get recent list orders
- **GET** `/api/list-orders/:id` - Get single list order
- **PATCH** `/api/list-orders/:id/status` - Update status
- **DELETE** `/api/list-orders/:id` - Delete list order

---

## 📂 File Structure Created

```
backend/
├── migrations/
│   └── 004_create_list_orders_table.sql
├── models/
│   └── listOrderModel.js
├── controllers/
│   └── listOrderController.js
├── routes/
│   └── listOrderRoutes.js
└── scripts/
    └── createListOrdersTable.js

grocery-app/src/
├── pages/
│   ├── ListOrdersUploadPage.js
│   └── AdminListOrdersPage.js
├── services/
│   └── listOrderService.js
└── routes/
    └── AppRoutes.js (updated)
└── components/
    └── Sidebar.js (updated)
```

---

## ✅ Verification Checklist

- [ ] Database migration ran successfully
- [ ] `list_orders` table exists with correct structure
- [ ] Backend routes are registered in `app.js`
- [ ] Frontend routes are added in `AppRoutes.js`
- [ ] Navigation links added to Sidebar
- [ ] Customer can upload grocery list images
- [ ] Admin can view all list orders
- [ ] Admin can search and filter orders
- [ ] Admin can view full image in modal
- [ ] Admin can print list orders
- [ ] Admin can delete list orders
- [ ] Images are stored in `/uploads/list-orders/`
- [ ] No errors in browser console
- [ ] No errors in backend console

---

## 🐛 Troubleshooting

### Issue: "Failed to upload grocery list"
**Solution:**
- Check file size (max 10MB)
- Verify file is a valid image (JPEG, PNG, GIF, WebP)
- Check backend is running on port 5000
- Check CORS is configured in `app.js`

### Issue: "Database table does not exist"
**Solution:**
```bash
cd backend
node scripts/createListOrdersTable.js
```

### Issue: Images not displaying
**Solution:**
- Check `/uploads/list-orders/` directory exists
- Verify static file serving: `app.use('/uploads', express.static('uploads'))`
- Check file permissions on the uploads directory

### Issue: 401 Unauthorized errors
**Solution:**
- Clear browser cache and localStorage
- Logout and login again
- Verify JWT token is being sent (check Network tab in DevTools)

---

## 📝 Next Steps

1. **Complete offline order integration** - Link converted list orders with offline order creation
2. **Add OCR** - Extract text from images automatically
3. **Email notifications** - Notify customers when order is processed
4. **Mobile app** - Build mobile version of upload feature
5. **Analytics** - Track list order metrics in dashboard

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs (browser DevTools, backend terminal)
3. Verify all files were created correctly
4. Re-run the migration script
5. Restart both backend and frontend servers

---

**Version:** 1.0  
**Last Updated:** April 19, 2026  
**Status:** ✅ Ready for Testing
