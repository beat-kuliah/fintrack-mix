-- Migration 011: Add username column to users table
-- Allows login with either username or email

ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;

-- Create index for username lookups
CREATE INDEX idx_users_username ON users(username);
