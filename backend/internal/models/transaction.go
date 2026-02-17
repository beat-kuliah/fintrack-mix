package models

import (
	"time"

	"github.com/google/uuid"
)

type TransactionType string

const (
	TransactionTypeIncome   TransactionType = "income"
	TransactionTypeExpense  TransactionType = "expense"
	TransactionTypeTransfer TransactionType = "transfer"
)

type Transaction struct {
	ID              uuid.UUID       `db:"id" json:"id"`
	UserID          uuid.UUID       `db:"user_id" json:"user_id"`
	AccountID       *uuid.UUID      `db:"account_id" json:"account_id,omitempty"`
	CreditCardID    *uuid.UUID      `db:"credit_card_id" json:"credit_card_id,omitempty"`
	Type            TransactionType `db:"type" json:"type"`
	Category        string          `db:"category" json:"category"`
	Amount          float64         `db:"amount" json:"amount"`
	Description     string          `db:"description" json:"description"`
	TransactionDate time.Time       `db:"transaction_date" json:"transaction_date"`
	CreatedAt       time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time       `db:"updated_at" json:"updated_at"`
}

type CreateTransactionRequest struct {
	AccountID       string          `json:"account_id"`
	CreditCardID    string          `json:"credit_card_id"`
	Type            TransactionType `json:"type" binding:"required"`
	Category        string          `json:"category" binding:"required"`
	Amount          float64         `json:"amount" binding:"required,gt=0"`
	Description     string          `json:"description"`
	TransactionDate string          `json:"transaction_date"`
}

type UpdateTransactionRequest struct {
	AccountID       string          `json:"account_id"`
	CreditCardID    string          `json:"credit_card_id"`
	Type            TransactionType `json:"type"`
	Category        string          `json:"category"`
	Amount          float64         `json:"amount" binding:"gt=0"`
	Description     string          `json:"description"`
	TransactionDate string          `json:"transaction_date"`
}