-- Grocery Billing System Database Schema
-- Created: February 28, 2026

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS grocery_db;
USE grocery_db;

-- Drop tables if exist (in reverse order of dependencies)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    place VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer') DEFAULT 'customer',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. ORDERS TABLE
-- ============================================
CREATE TABLE orders (
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
    totalAmount DECIMAL(12,2),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    orderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    verifiedAt TIMESTAMP NULL,
    deliveredAt TIMESTAMP NULL,
    FOREIGN KEY (customerId) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT NOT NULL,
    productId INT NOT NULL,
    productName VARCHAR(150),
    price DECIMAL(10,2),
    quantity INT,
    isSelected BOOLEAN DEFAULT TRUE,
    total DECIMAL(12,2),
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INDEXES for better query performance
-- ============================================
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_customerId ON orders(customerId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_orderType ON orders(orderType);
CREATE INDEX idx_order_items_orderId ON order_items(orderId);
CREATE INDEX idx_order_items_productId ON order_items(productId);

-- ============================================
-- Insert default admin user (password: admin123)
-- Note: In production, use bcrypt hashed password
-- ============================================
INSERT INTO users (fullName, phone, place, password, role) VALUES
('Admin User', '9876543210', 'Palakollu', '$2b$10$defaultHashedPasswordForAdmin123', 'admin');

-- Confirm tables created
SELECT 'Schema created successfully!' AS Status;
SHOW TABLES;
