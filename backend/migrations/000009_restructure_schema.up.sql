-- Migration 009: Restructure schema
-- 1. Remove credit_card from account_type, add paylater
-- 2. Add parent_account_id to accounts for pockets functionality
-- 3. Simplify budgets to month/year
-- 4. Replace investments with gold_assets
-- 5. Add gold_prices table for daily prices

-- Step 1: Create new account_type enum and update accounts
ALTER TABLE accounts ADD COLUMN parent_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
CREATE INDEX idx_accounts_parent ON accounts(parent_account_id);

-- Step 2: Update account_type enum (create new, migrate data, drop old)
CREATE TYPE account_type_new AS ENUM ('bank', 'wallet', 'cash', 'paylater');

-- Update existing credit_card to bank (will be handled separately in credit_cards table)
UPDATE accounts SET type = 'bank' WHERE type = 'credit_card';
UPDATE accounts SET type = 'bank' WHERE type = 'investment';

ALTER TABLE accounts 
    ALTER COLUMN type TYPE account_type_new 
    USING type::text::account_type_new;

DROP TYPE account_type;
ALTER TYPE account_type_new RENAME TO account_type;

-- Step 3: Migrate pockets data to accounts as sub-accounts
INSERT INTO accounts (id, user_id, name, type, balance, currency, created_at, updated_at, parent_account_id)
SELECT id, user_id, name, 'bank'::account_type, balance, 'IDR', created_at, updated_at, account_id
FROM pockets;

-- Step 4: Update budgets - add month/year columns, remove period
ALTER TABLE budgets ADD COLUMN budget_month INTEGER;
ALTER TABLE budgets ADD COLUMN budget_year INTEGER;

-- Migrate existing data
UPDATE budgets SET 
    budget_month = EXTRACT(MONTH FROM start_date),
    budget_year = EXTRACT(YEAR FROM start_date);

-- Make month/year required
ALTER TABLE budgets ALTER COLUMN budget_month SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN budget_year SET NOT NULL;

-- Drop old columns
ALTER TABLE budgets DROP COLUMN start_date;
ALTER TABLE budgets DROP COLUMN end_date;
ALTER TABLE budgets DROP COLUMN period;
DROP TYPE budget_period;

-- Add unique constraint for user + category + month + year
CREATE UNIQUE INDEX idx_budgets_unique ON budgets(user_id, category, budget_month, budget_year);

-- Step 5: Create gold_prices table for daily prices (managed by admin/API)
CREATE TABLE IF NOT EXISTS gold_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_date DATE NOT NULL UNIQUE,
    price_per_gram DECIMAL(15, 2) NOT NULL,
    source VARCHAR(100) DEFAULT 'manual',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gold_prices_date ON gold_prices(price_date DESC);

-- Step 6: Create gold_assets table (replacing investments)
CREATE TYPE gold_type AS ENUM ('antam', 'ubs', 'galeri24', 'pegadaian', 'other');

CREATE TABLE IF NOT EXISTS gold_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    gold_type gold_type NOT NULL DEFAULT 'antam',
    weight_gram DECIMAL(10, 4) NOT NULL,
    purchase_price_per_gram DECIMAL(15, 2) NOT NULL,
    purchase_date DATE NOT NULL,
    storage_location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gold_assets_user ON gold_assets(user_id);

-- Insert today's gold price as initial data (approximate IDR price)
INSERT INTO gold_prices (id, price_date, price_per_gram, source)
VALUES (gen_random_uuid(), CURRENT_DATE, 1450000, 'initial');
