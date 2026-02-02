-- Rollback migration 009

-- Remove gold tables
DROP TABLE IF EXISTS gold_assets;
DROP TYPE IF EXISTS gold_type;
DROP TABLE IF EXISTS gold_prices;

-- Restore budgets structure
ALTER TABLE budgets ADD COLUMN start_date DATE;
ALTER TABLE budgets ADD COLUMN end_date DATE;
CREATE TYPE budget_period AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
ALTER TABLE budgets ADD COLUMN period budget_period;

UPDATE budgets SET 
    start_date = make_date(budget_year, budget_month, 1),
    end_date = (make_date(budget_year, budget_month, 1) + interval '1 month - 1 day')::date,
    period = 'monthly';

ALTER TABLE budgets DROP COLUMN budget_month;
ALTER TABLE budgets DROP COLUMN budget_year;
DROP INDEX IF EXISTS idx_budgets_unique;

-- Delete pocket accounts (sub-accounts)
DELETE FROM accounts WHERE parent_account_id IS NOT NULL;

-- Restore account_type
CREATE TYPE account_type_old AS ENUM ('bank', 'wallet', 'investment', 'credit_card');
ALTER TABLE accounts 
    ALTER COLUMN type TYPE account_type_old 
    USING type::text::account_type_old;
DROP TYPE account_type;
ALTER TYPE account_type_old RENAME TO account_type;

-- Remove parent_account_id
DROP INDEX IF EXISTS idx_accounts_parent;
ALTER TABLE accounts DROP COLUMN parent_account_id;
