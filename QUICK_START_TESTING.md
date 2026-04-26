# 🚀 Quick Start & Testing Commands

## Prerequisites
- Node.js installed
- MySQL running
- Backend and Frontend codebases setup

---

## 🔧 Installation Commands

### 1. Database Setup (One-time)
```bash
# Run from backend directory
cd backend
node scripts/createListOrdersTable.js

# Expected output: ✓ list_orders table created successfully
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies (if not already done)
npm install

# Start backend server
npm start

# Expected output:
# Connected to MySQL
# Server running on port 5000
```

### 3. Frontend Setup
```bash
cd grocery-app

# Install dependencies (if not already done)
npm install

# Start frontend development server
npm start

# Expected output:
# Compiled successfully!
# You can now view grocery-app in the browser.
# Local: http://localhost:3000
```

---

## 🧪 Testing Commands & Steps

### Test 1: Upload Grocery List (Customer)

**Steps:**
```
1. Navigate to http://localhost:3000
2. Register as customer (if new user)
   - Name: Test Customer
   - Phone: 9876543210
   - Password: any password
   - Role: Customer

3. Login with customer credentials

4. Click sidebar → "Upload List" 

5. Fill the form:
   - Customer Name: Test Customer
   - Phone: 9876543210
   - Select an image file (JPG/PNG)
   - Notes: Test grocery list

6. Click "Upload List" button

Expected Result:
✅ Success toast: "Grocery list uploaded successfully!"
✅ Form clears
✅ Green success message appears for 5 seconds
```

### Test 2: View List Orders (Admin)

**Steps:**
```
1. Logout from customer account
2. Register/Login as admin
   - Phone: 9000000000
   - Role: Admin

3. Click sidebar → "List Orders"

Expected Result:
✅ Table shows uploaded list order
✅ Pending badge shows count
✅ Image thumbnail is visible
✅ Customer name, phone, status, date visible
```

### Test 3: View Image Modal

**Steps:**
```
1. In List Orders table, click "View" button

Expected Result:
✅ Modal opens with full image
✅ Customer details displayed:
   - Customer Name
   - Phone
   - Status (pending)
   - Date submitted
   - Notes (if any)
✅ Action buttons visible
```

### Test 4: Print Grocery List

**Steps:**
```
1. In modal, click "🖨️ Print" button
2. Browser print dialog opens
3. Click "Save as PDF" or print to printer

Expected Result:
✅ Print preview shows:
   - Grocery List title
   - Order reference (#ID)
   - Customer name
   - Phone number
   - Status
   - Full image
   - Date submitted
   - Timestamp
```

### Test 5: Delete List Order

**Steps:**
```
1. Click "🗑️ Delete" button
2. Confirm deletion dialog

Expected Result:
✅ Confirmation dialog appears
✅ Order removed from table
✅ Toast: "Grocery list deleted"
✅ Image file removed from server
```

### Test 6: Search & Filter

**Steps:**
```
1. In filter bar, type customer name: "Test"
2. Change status filter: "pending"

Expected Result:
✅ Table filters in real-time
✅ Only matching orders shown
✅ Can combine multiple filters
```

---

## 🔍 API Testing (Using curl or Postman)

### Upload List Order
```bash
curl -X POST http://localhost:5000/api/list-orders/upload \
  -F "customerName=John Doe" \
  -F "phone=9876543210" \
  -F "notes=Please prioritize dairy" \
  -F "image=@/path/to/image.jpg"

# Expected: 201 Created
# Response: { "success": true, "data": { "id": 1, ... } }
```

### Get All List Orders (requires token)
```bash
curl -X GET http://localhost:5000/api/list-orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: 200 OK
# Response: { "success": true, "data": [...], "count": 1 }
```

### Get Pending Count
```bash
curl -X GET http://localhost:5000/api/list-orders/pending-count \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: 200 OK
# Response: { "success": true, "data": { "pendingCount": 1 } }
```

### Delete List Order
```bash
curl -X DELETE http://localhost:5000/api/list-orders/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: 200 OK
# Response: { "success": true, "message": "List order deleted" }
```

---

## 📊 Database Verification

### Check Table Structure
```bash
mysql -u root -p grocery_db

# Run in MySQL CLI:
DESCRIBE list_orders;

# Expected columns:
# id, customerName, phone, imagePath, imageFileName, status, offlineOrderId, notes, createdAt, updatedAt
```

### View All Records
```sql
SELECT * FROM list_orders;

# Or check counts:
SELECT COUNT(*) as total FROM list_orders;
SELECT COUNT(*) as pending FROM list_orders WHERE status = 'pending';
```

### Check Image Files
```bash
# List uploaded files
ls -la backend/uploads/list-orders/

# You should see files like:
# list-order-1713590400000-image.jpg
# list-order-1713590500000-image.png
```

---

## 🐛 Debugging & Logs

### Backend Logs
The backend terminal should show:
```
[LIST_ORDER] Processing upload for: John Doe
[LIST_ORDER] File saved to: /uploads/list-orders/list-order-1713590400000-image.jpg
[LIST_ORDER] Database entry created: ID 1
```

### Browser Console Logs
Open DevTools (F12) → Console tab:
```
Look for any errors related to:
- Network errors
- Upload failures
- State management issues
```

### Network Tab
In DevTools → Network tab:
```
POST /api/list-orders/upload
- Status: 201 Created
- Response: { "success": true, ... }
```

---

## ✅ Quick Verification Checklist

Run this to verify everything is set up:

```bash
# 1. Check database table
mysql -u root -p -e "USE grocery_db; SHOW TABLES LIKE 'list_orders';"

# 2. Check backend files
ls backend/models/listOrderModel.js
ls backend/controllers/listOrderController.js
ls backend/routes/listOrderRoutes.js

# 3. Check frontend files
ls grocery-app/src/pages/ListOrdersUploadPage.js
ls grocery-app/src/pages/AdminListOrdersPage.js
ls grocery-app/src/services/listOrderService.js

# 4. Check uploads directory exists
mkdir -p backend/uploads/list-orders

# Expected: All files should exist, all commands should return 0 (success)
```

---

## 🎯 Expected Behavior

### Happy Path
1. Customer uploads image ✅
2. Image saved to disk ✅
3. Record created in DB ✅
4. Admin sees in table ✅
5. Admin can view, print, delete ✅

### Error Handling
- Invalid file type → Error toast
- File too large → Error toast
- Network error → Error message
- Missing fields → Validation error
- Database error → 500 error

---

## 📈 Performance Tips

- Images are stored in `/uploads/list-orders/`
- Thumbnails loaded lazily
- Database indexes on phone, status, createdAt
- Pagination ready (limit parameter supported)

---

## 🔒 Security Checklist

- ✅ File upload validation (type, size)
- ✅ Auth required for admin routes
- ✅ CORS configured
- ✅ Rate limiting enabled
- ✅ File names sanitized
- ✅ SQL injection prevention (prepared statements)
- ✅ Token-based authentication

---

## 📝 Logs Location

### Backend Error Logs
```
Terminal output where `npm start` was run
```

### Database Logs
```
MySQL error log (depends on MySQL installation)
```

### Image Storage
```
backend/uploads/list-orders/
```

---

## 🆘 If Something Goes Wrong

1. **Clear browser cache:**
   ```bash
   # Or use DevTools → Storage → Clear All
   ```

2. **Restart both servers:**
   ```bash
   # Terminal 1
   cd backend && npm start

   # Terminal 2  
   cd grocery-app && npm start
   ```

3. **Re-run migration:**
   ```bash
   cd backend && node scripts/createListOrdersTable.js
   ```

4. **Check logs:**
   - Backend console for errors
   - Browser DevTools for client errors
   - MySQL for database issues

5. **Verify connectivity:**
   ```bash
   curl http://localhost:5000/api/list-orders/pending-count
   # Should show CORS error (expected without token)
   ```

---

**That's it! Your List Orders feature is ready to test.** 🚀

For detailed information, see:
- `LIST_ORDERS_INTEGRATION_GUIDE.md` - Comprehensive guide
- `LIST_ORDERS_COMPLETION_SUMMARY.md` - Feature summary
