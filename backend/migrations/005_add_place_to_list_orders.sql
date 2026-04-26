-- Migration: Add place field to list_orders table
-- Purpose: Store customer's place/city for grocery list uploads

ALTER TABLE list_orders
ADD COLUMN place VARCHAR(100) AFTER phone;

-- Add index for faster queries
ALTER TABLE list_orders
ADD INDEX idx_place (place);
