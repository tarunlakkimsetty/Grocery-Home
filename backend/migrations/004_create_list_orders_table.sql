-- Migration: Create list_orders table
-- Purpose: Store customer grocery list uploads with images

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
