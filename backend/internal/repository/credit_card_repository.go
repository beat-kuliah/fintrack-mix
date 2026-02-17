package repository

import (
	"fmt"
	"time"

	"github.com/financial-tracker/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type CreditCardRepository struct {
	db *sqlx.DB
}

func NewCreditCardRepository(db *sqlx.DB) *CreditCardRepository {
	return &CreditCardRepository{db: db}
}

func (r *CreditCardRepository) Create(card *models.CreditCard) error {
	card.ID = uuid.New()
	card.CreatedAt = time.Now()
	card.UpdatedAt = time.Now()

	query := `
		INSERT INTO credit_cards (id, user_id, card_name, last_four_digits, credit_limit, current_balance, billing_date, payment_due_date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.db.Exec(query, card.ID, card.UserID, card.CardName, card.LastFourDigits, card.CreditLimit, card.CurrentBalance, card.BillingDate, card.PaymentDueDate, card.CreatedAt, card.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create credit card: %w", err)
	}

	return nil
}

func (r *CreditCardRepository) GetByUserID(userID uuid.UUID) ([]models.CreditCard, error) {
	var cards []models.CreditCard
	query := `SELECT id, user_id, card_name, last_four_digits, credit_limit, current_balance, billing_date, payment_due_date, created_at, updated_at FROM credit_cards WHERE user_id = $1 ORDER BY created_at DESC`
	err := r.db.Select(&cards, query, userID)
	if err != nil {
		return nil, err
	}
	return cards, nil
}

func (r *CreditCardRepository) GetByID(id uuid.UUID) (*models.CreditCard, error) {
	var card models.CreditCard
	query := `SELECT id, user_id, card_name, last_four_digits, credit_limit, current_balance, billing_date, payment_due_date, created_at, updated_at FROM credit_cards WHERE id = $1`
	err := r.db.Get(&card, query, id)
	if err != nil {
		return nil, err
	}
	return &card, nil
}

func (r *CreditCardRepository) Update(card *models.CreditCard) error {
	card.UpdatedAt = time.Now()
	// Don't update current_balance - it should be calculated from transactions
	query := `UPDATE credit_cards SET card_name = $1, credit_limit = $2, billing_date = $3, payment_due_date = $4, updated_at = $5 WHERE id = $6`
	_, err := r.db.Exec(query, card.CardName, card.CreditLimit, card.BillingDate, card.PaymentDueDate, card.UpdatedAt, card.ID)
	return err
}

func (r *CreditCardRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM credit_cards WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *CreditCardRepository) UpdateBalance(id uuid.UUID, amount float64) error {
	query := `UPDATE credit_cards SET current_balance = current_balance + $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.Exec(query, amount, time.Now(), id)
	return err
}