package models

import (
	"time"

	"github.com/google/uuid"
)

// Budget - simplified with month/year instead of date range
type Budget struct {
	ID          uuid.UUID `db:"id" json:"id"`
	UserID      uuid.UUID `db:"user_id" json:"user_id"`
	Category    string    `db:"category" json:"category"`
	Amount      float64   `db:"amount" json:"amount"`
	BudgetMonth int       `db:"budget_month" json:"budget_month"`
	BudgetYear  int       `db:"budget_year" json:"budget_year"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type CreateBudgetRequest struct {
	Category    string  `json:"category" binding:"required"`
	Amount      float64 `json:"amount" binding:"required"`
	BudgetMonth int     `json:"budget_month" binding:"required,min=1,max=12"`
	BudgetYear  int     `json:"budget_year" binding:"required,min=2020"`
}

type CopyBudgetRequest struct {
	FromMonth int `json:"from_month" binding:"required,min=1,max=12"`
	FromYear  int `json:"from_year" binding:"required,min=2020"`
	ToMonth   int `json:"to_month" binding:"required,min=1,max=12"`
	ToYear    int `json:"to_year" binding:"required,min=2020"`
}

// Credit Card - kept separate for specific features
type CreditCard struct {
	ID             uuid.UUID `db:"id" json:"id"`
	UserID         uuid.UUID `db:"user_id" json:"user_id"`
	CardName       string    `db:"card_name" json:"card_name"`
	LastFourDigits string    `db:"last_four_digits" json:"last_four_digits"`
	CreditLimit    float64   `db:"credit_limit" json:"credit_limit"`
	CurrentBalance float64   `db:"current_balance" json:"current_balance"`
	BillingDate    int       `db:"billing_date" json:"billing_date"`
	PaymentDueDate int       `db:"payment_due_date" json:"payment_due_date"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time `db:"updated_at" json:"updated_at"`
}

type CreateCreditCardRequest struct {
	CardName       string  `json:"card_name" binding:"required"`
	LastFourDigits string  `json:"last_four_digits" binding:"required,len=4"`
	CreditLimit    float64 `json:"credit_limit" binding:"required"`
	BillingDate    int     `json:"billing_date" binding:"required,min=1,max=31"`
	PaymentDueDate int     `json:"payment_due_date" binding:"required,min=1,max=31"`
}

// Gold Asset - replacing investments
type GoldType string

const (
	GoldTypeAntam     GoldType = "antam"
	GoldTypeUBS       GoldType = "ubs"
	GoldTypeGaleri24  GoldType = "galeri24"
	GoldTypePegadaian GoldType = "pegadaian"
	GoldTypeOther     GoldType = "other"
)

type GoldAsset struct {
	ID                   uuid.UUID `db:"id" json:"id"`
	UserID               uuid.UUID `db:"user_id" json:"user_id"`
	Name                 string    `db:"name" json:"name"`
	GoldType             GoldType  `db:"gold_type" json:"gold_type"`
	WeightGram           float64   `db:"weight_gram" json:"weight_gram"`
	PurchasePricePerGram float64   `db:"purchase_price_per_gram" json:"purchase_price_per_gram"`
	PurchaseDate         time.Time `db:"purchase_date" json:"purchase_date"`
	StorageLocation      string    `db:"storage_location" json:"storage_location"`
	Notes                string    `db:"notes" json:"notes"`
	CreatedAt            time.Time `db:"created_at" json:"created_at"`
	UpdatedAt            time.Time `db:"updated_at" json:"updated_at"`
	// Calculated fields (from gold_prices)
	CurrentPricePerGram float64 `db:"-" json:"current_price_per_gram,omitempty"`
	CurrentValue        float64 `db:"-" json:"current_value,omitempty"`
	PurchaseValue       float64 `db:"-" json:"purchase_value,omitempty"`
	ProfitLoss          float64 `db:"-" json:"profit_loss,omitempty"`
	ProfitLossPercent   float64 `db:"-" json:"profit_loss_percent,omitempty"`
}

type CreateGoldAssetRequest struct {
	Name                 string   `json:"name" binding:"required"`
	GoldType             GoldType `json:"gold_type" binding:"required"`
	WeightGram           float64  `json:"weight_gram" binding:"required,gt=0"`
	PurchasePricePerGram float64  `json:"purchase_price_per_gram" binding:"required,gt=0"`
	PurchaseDate         string   `json:"purchase_date" binding:"required"`
	StorageLocation      string   `json:"storage_location"`
	Notes                string   `json:"notes"`
}

// Gold Price - daily price data
type GoldPrice struct {
	ID           uuid.UUID `db:"id" json:"id"`
	PriceDate    time.Time `db:"price_date" json:"price_date"`
	PricePerGram float64   `db:"price_per_gram" json:"price_per_gram"`
	Source       string    `db:"source" json:"source"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type UpdateGoldPriceRequest struct {
	PricePerGram float64 `json:"price_per_gram" binding:"required,gt=0"`
	Source       string  `json:"source"`
}
