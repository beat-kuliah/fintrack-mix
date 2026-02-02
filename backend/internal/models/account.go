package models

import (
	"time"

	"github.com/google/uuid"
)

type AccountType string

const (
	AccountTypeBank    AccountType = "bank"
	AccountTypeWallet  AccountType = "wallet"
	AccountTypeCash    AccountType = "cash"
	AccountTypePaylater AccountType = "paylater"
)

type Account struct {
	ID              uuid.UUID   `db:"id" json:"id"`
	UserID          uuid.UUID   `db:"user_id" json:"user_id"`
	Name            string      `db:"name" json:"name"`
	Type            AccountType `db:"type" json:"type"`
	Balance         float64     `db:"balance" json:"balance"`
	Currency        string      `db:"currency" json:"currency"`
	ParentAccountID *uuid.UUID  `db:"parent_account_id" json:"parent_account_id,omitempty"`
	CreatedAt       time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time   `db:"updated_at" json:"updated_at"`
	// For response only - child accounts (pockets)
	SubAccounts []Account `db:"-" json:"sub_accounts,omitempty"`
}

type CreateAccountRequest struct {
	Name            string      `json:"name" binding:"required"`
	Type            AccountType `json:"type" binding:"required"`
	Currency        string      `json:"currency"`
	ParentAccountID *uuid.UUID  `json:"parent_account_id,omitempty"`
}

type CreateSubAccountRequest struct {
	Name            string    `json:"name" binding:"required"`
	ParentAccountID uuid.UUID `json:"parent_account_id" binding:"required"`
}
