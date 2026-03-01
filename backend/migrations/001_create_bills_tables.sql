-- Bills Table Migration
-- Run this to add bills functionality

USE grocery_db;

-- ============================================
-- BILLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    grandTotal DECIMAL(12,2) NOT NULL,
    paymentMethod ENUM('Cash', 'Card', 'UPI', 'Other') DEFAULT 'Cash',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BILL_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    billId INT NOT NULL,
    productId INT NOT NULL,
    productName VARCHAR(150),
    price DECIMAL(10,2),
    quantity INT,
    total DECIMAL(12,2),
    FOREIGN KEY (billId) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bills_userId ON bills(userId);
CREATE INDEX IF NOT EXISTS idx_bills_createdAt ON bills(createdAt);
CREATE INDEX IF NOT EXISTS idx_bill_items_billId ON bill_items(billId);

SELECT 'Bills tables created successfully!' AS Status;
