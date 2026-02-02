-- Rollback migration 010

-- Remove API configurations
DROP TABLE IF EXISTS api_configurations;

-- Remove is_admin from users
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;
