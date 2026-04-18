-- Migration: Add Telugu language support to products table
-- Date: April 2026
-- Purpose: Enable product search by Telugu names and transliterated keywords

USE grocery_db;

-- Add teluguName column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS teluguName VARCHAR(150) DEFAULT NULL;

-- Add keywords column for alternative search terms (JSON format)
ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords JSON DEFAULT NULL;

-- Create index on teluguName for faster searching
ALTER TABLE products ADD FULLTEXT INDEX IF NOT EXISTS ft_telugu_search (teluguName);

-- Create index on name for faster searching
ALTER TABLE products ADD FULLTEXT INDEX IF NOT EXISTS ft_name_search (name);
