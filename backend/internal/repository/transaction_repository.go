package repository

import (
	"fmt"
	"time"

	"github.com/financial-tracker/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type TransactionRepository struct {
	db *sqlx.DB
}

func NewTransactionRepository(db *sqlx.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) Create(tx *models.Transaction) error {
	tx.ID = uuid.New()
	tx.CreatedAt = time.Now()
	tx.UpdatedAt = time.Now()

	query := `
		INSERT INTO transactions (id, user_id, account_id, type, category, amount, description, transaction_date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.db.Exec(query, tx.ID, tx.UserID, tx.AccountID, tx.Type, tx.Category, tx.Amount, tx.Description, tx.TransactionDate, tx.CreatedAt, tx.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create transaction: %w", err)
	}

	return nil
}

func (r *TransactionRepository) GetByUserID(userID uuid.UUID, limit, offset int) ([]models.Transaction, error) {
	var transactions []models.Transaction
	query := `
		SELECT id, user_id, account_id, type, category, amount, description, transaction_date, created_at, updated_at 
		FROM transactions 
		WHERE user_id = $1 
		ORDER BY transaction_date DESC, created_at DESC
		LIMIT $2 OFFSET $3
	`
	err := r.db.Select(&transactions, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	return transactions, nil
}

func (r *TransactionRepository) GetByID(id uuid.UUID) (*models.Transaction, error) {
	var transaction models.Transaction
	query := `SELECT id, user_id, account_id, type, category, amount, description, transaction_date, created_at, updated_at FROM transactions WHERE id = $1`
	err := r.db.Get(&transaction, query, id)
	if err != nil {
		return nil, err
	}
	return &transaction, nil
}

func (r *TransactionRepository) Update(tx *models.Transaction) error {
	tx.UpdatedAt = time.Now()
	query := `UPDATE transactions SET category = $1, amount = $2, description = $3, transaction_date = $4, updated_at = $5 WHERE id = $6`
	_, err := r.db.Exec(query, tx.Category, tx.Amount, tx.Description, tx.TransactionDate, tx.UpdatedAt, tx.ID)
	return err
}

func (r *TransactionRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM transactions WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *TransactionRepository) GetSummary(userID uuid.UUID) (*models.TransactionSummary, error) {
	summary := &models.TransactionSummary{}
	
	query := `
		SELECT 
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
		FROM transactions 
		WHERE user_id = $1
	`
	err := r.db.QueryRow(query, userID).Scan(&summary.TotalIncome, &summary.TotalExpense)
	if err != nil {
		return nil, err
	}
	
	summary.Balance = summary.TotalIncome - summary.TotalExpense
	return summary, nil
}
