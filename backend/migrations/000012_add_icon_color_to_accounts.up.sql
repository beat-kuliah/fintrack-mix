-- Add icon and color columns to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '💳',
ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#3b82f6';
