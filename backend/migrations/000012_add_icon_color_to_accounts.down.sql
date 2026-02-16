-- Remove icon and color columns from accounts table
ALTER TABLE accounts 
DROP COLUMN IF EXISTS icon,
DROP COLUMN IF EXISTS color;
