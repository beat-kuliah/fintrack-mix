-- Remove index
DROP INDEX IF EXISTS idx_transactions_credit_card_id;

-- Remove check constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_account_or_credit_card_check;

-- Make account_id NOT NULL again
ALTER TABLE transactions 
ALTER COLUMN account_id SET NOT NULL;

-- Remove credit_card_id column
ALTER TABLE transactions 
DROP COLUMN IF EXISTS credit_card_id;
