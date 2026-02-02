-- Create credit_cards table
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_name VARCHAR(255) NOT NULL,
    last_four_digits VARCHAR(4) NOT NULL,
    credit_limit DECIMAL(15, 2) NOT NULL,
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    billing_date INT NOT NULL CHECK (billing_date >= 1 AND billing_date <= 31),
    payment_due_date INT NOT NULL CHECK (payment_due_date >= 1 AND payment_due_date <= 31),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_cards_user_id ON credit_cards(user_id);
