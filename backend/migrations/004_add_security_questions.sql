-- Add security question fields for password reset
-- Migration: 004_add_security_questions

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS favoriteFood VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS favoritePlace VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS passwordResetAttempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS passwordResetAttemptedAt TIMESTAMP NULL;

-- If columns were added, display message
SELECT 'Security question fields added to users table' as status;
