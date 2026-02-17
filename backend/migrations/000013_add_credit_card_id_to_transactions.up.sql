-- Add credit_card_id column to transactions table
ALTER TABLE transactions 
ADD COLUMN credit_card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE;

-- Make account_id nullable since transactions can now use credit_card_id
ALTER TABLE transactions 
ALTER COLUMN account_id DROP NOT NULL;

-- Add check constraint to ensure either account_id or credit_card_id is provided
ALTER TABLE transactions 
ADD CONSTRAINT transactions_account_or_credit_card_check 
CHECK (
    (account_id IS NOT NULL AND credit_card_id IS NULL) OR 
    (account_id IS NULL AND credit_card_id IS NOT NULL)
);

-- Add index for credit_card_id
CREATE INDEX idx_transactions_credit_card_id ON transactions(credit_card_id);
