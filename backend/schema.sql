-- Grocery Billing System Database Schema Verification (Non-Destructive)
-- Updated: March 04, 2026

CREATE DATABASE IF NOT EXISTS grocery_db;
USE grocery_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    place VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer') DEFAULT 'customer',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pack',
    emoji VARCHAR(10) DEFAULT '📦',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT NULL,
    customerName VARCHAR(100),
    phone VARCHAR(15),
    place VARCHAR(100),
    address TEXT,
    orderType ENUM('Online', 'Offline') NOT NULL,
    isVerified BOOLEAN DEFAULT FALSE,
    isPaid BOOLEAN DEFAULT FALSE,
    isDelivered BOOLEAN DEFAULT FALSE,
    isArchived BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Pending',
    paymentStatus ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    totalAmount DECIMAL(12,2) DEFAULT 0.00,
    advanceAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    orderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    acceptedAt TIMESTAMP NULL,
    verifiedAt TIMESTAMP NULL,
    deliveredAt TIMESTAMP NULL,
    CONSTRAINT fk_orders_customerId_users
        FOREIGN KEY (customerId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT NOT NULL,
    productId INT NOT NULL,
    productName VARCHAR(150),
    price DECIMAL(10,2),
    quantity INT,
    isSelected BOOLEAN DEFAULT TRUE,
    total DECIMAL(12,2),
    CONSTRAINT fk_order_items_orderId_orders
        FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_order_items_productId_products
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_order_id_orders
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_feedback_customer_id_users
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT uq_feedback_order_id UNIQUE (order_id),
    CONSTRAINT chk_feedback_rating CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    grandTotal DECIMAL(12,2) NOT NULL,
    paymentMethod ENUM('Cash', 'Card', 'UPI', 'Other') DEFAULT 'Cash',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bills_userId_users
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    billId INT NOT NULL,
    productId INT NOT NULL,
    productName VARCHAR(150),
    price DECIMAL(10,2),
    quantity INT,
    total DECIMAL(12,2),
    CONSTRAINT fk_bill_items_billId_bills
        FOREIGN KEY (billId) REFERENCES bills(id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_bill_items_productId_products
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'pack';
ALTER TABLE products ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '📦';

ALTER TABLE orders ADD COLUMN IF NOT EXISTS isVerified BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS isPaid BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS isDelivered BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS isArchived BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS createdAt DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS acceptedAt TIMESTAMP NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS totalAmount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS advanceAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS verifiedAt TIMESTAMP NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deliveredAt TIMESTAMP NULL;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS isSelected BOOLEAN DEFAULT TRUE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total DECIMAL(12,2);
ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS total DECIMAL(12,2);

ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE orders MODIFY COLUMN totalAmount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE orders MODIFY COLUMN advanceAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_customerId ON orders(customerId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_orderType ON orders(orderType);
CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items(orderId);
CREATE INDEX IF NOT EXISTS idx_order_items_productId ON order_items(productId);
CREATE INDEX IF NOT EXISTS idx_feedback_order_id ON feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_feedback_customer_id ON feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_userId ON bills(userId);
CREATE INDEX IF NOT EXISTS idx_bills_createdAt ON bills(createdAt);
CREATE INDEX IF NOT EXISTS idx_bill_items_billId ON bill_items(billId);
CREATE INDEX IF NOT EXISTS idx_bill_items_productId ON bill_items(productId);

INSERT INTO users (fullName, phone, place, password, role)
SELECT 'Admin User', '9441754505', 'Palakollu', '$2b$10$QGqNPQ65FkTjD4qz5L/GOedtLj0ReolwlP1iRXu1jyXcLdSVtcnzO', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE phone = '9441754505' LIMIT 1
);

DROP VIEW IF EXISTS customers;
CREATE VIEW customers AS
SELECT
    id,
    fullName AS name,
    phone,
    place,
    createdAt AS created_at
FROM users
WHERE role = 'customer';

DROP VIEW IF EXISTS online_orders;
CREATE VIEW online_orders AS
SELECT
    id,
    customerId AS customer_id,
    totalAmount AS total_amount,
    advanceAmount AS advance_amount,
    status AS order_status,
    createdAt AS created_at
FROM orders
WHERE orderType = 'Online';

DROP VIEW IF EXISTS offline_orders;
CREATE VIEW offline_orders AS
SELECT
    id,
    customerName AS customer_name,
    phone,
    totalAmount AS total_amount,
    advanceAmount AS advance_amount,
    status AS order_status,
    createdAt AS created_at
FROM orders
WHERE orderType = 'Offline';

DROP VIEW IF EXISTS order_products;
CREATE VIEW order_products AS
SELECT
    id,
    orderId AS order_id,
    productId AS product_id,
    quantity,
    price
FROM order_items;

DROP VIEW IF EXISTS categories;
CREATE VIEW categories AS
SELECT
    ROW_NUMBER() OVER (ORDER BY category) AS id,
    category AS category_name
FROM (
    SELECT DISTINCT category
    FROM products
    WHERE category IS NOT NULL AND category <> ''
) c;

DROP VIEW IF EXISTS admin_users;
CREATE VIEW admin_users AS
SELECT
    id,
    fullName AS name,
    phone,
    place,
    createdAt AS created_at
FROM users
WHERE role = 'admin';

SELECT 'Schema verification completed successfully!' AS Status;
SHOW FULL TABLES;
