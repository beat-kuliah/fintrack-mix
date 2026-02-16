package repository

import (
	"fmt"
	"time"

	"github.com/financial-tracker/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type AccountRepository struct {
	db *sqlx.DB
}

func NewAccountRepository(db *sqlx.DB) *AccountRepository {
	return &AccountRepository{db: db}
}

func (r *AccountRepository) Create(account *models.Account) error {
	account.ID = uuid.New()
	account.CreatedAt = time.Now()
	account.UpdatedAt = time.Now()
	account.Balance = 0 // Always start with 0 balance

	query := `
		INSERT INTO accounts (id, user_id, name, type, balance, currency, parent_account_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.db.Exec(query, account.ID, account.UserID, account.Name, account.Type, account.Balance, account.Currency, account.ParentAccountID, account.CreatedAt, account.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create account: %w", err)
	}

	return nil
}

// GetByUserID returns all main accounts (no parent) with their sub-accounts
func (r *AccountRepository) GetByUserID(userID uuid.UUID) ([]models.Account, error) {
	var allAccounts []models.Account
	query := `SELECT id, user_id, name, type, balance, currency, parent_account_id, created_at, updated_at FROM accounts WHERE user_id = $1 ORDER BY created_at DESC`
	err := r.db.Select(&allAccounts, query, userID)
	if err != nil {
		return nil, err
	}

	// Separate main accounts and sub-accounts
	mainAccounts := []models.Account{}
	subAccountsMap := make(map[uuid.UUID][]models.Account)

	for _, acc := range allAccounts {
		if acc.ParentAccountID == nil {
			mainAccounts = append(mainAccounts, acc)
		} else {
			subAccountsMap[*acc.ParentAccountID] = append(subAccountsMap[*acc.ParentAccountID], acc)
		}
	}

	// Attach sub-accounts to their parents
	for i := range mainAccounts {
		if subs, ok := subAccountsMap[mainAccounts[i].ID]; ok {
			mainAccounts[i].SubAccounts = subs
		}
	}

	return mainAccounts, nil
}

// GetSubAccounts returns all sub-accounts for a parent account
func (r *AccountRepository) GetSubAccounts(parentID uuid.UUID) ([]models.Account, error) {
	var accounts []models.Account
	query := `SELECT id, user_id, name, type, balance, currency, parent_account_id, created_at, updated_at FROM accounts WHERE parent_account_id = $1 ORDER BY created_at DESC`
	err := r.db.Select(&accounts, query, parentID)
	if err != nil {
		return nil, err
	}
	return accounts, nil
}

func (r *AccountRepository) GetByID(id uuid.UUID) (*models.Account, error) {
	var account models.Account
	query := `SELECT id, user_id, name, type, balance, currency, parent_account_id, created_at, updated_at FROM accounts WHERE id = $1`
	err := r.db.Get(&account, query, id)
	if err != nil {
		return nil, err
	}

	// Load sub-accounts if this is a main account
	if account.ParentAccountID == nil {
		subs, _ := r.GetSubAccounts(account.ID)
		account.SubAccounts = subs
	}

	return &account, nil
}

func (r *AccountRepository) Update(account *models.Account) error {
	account.UpdatedAt = time.Now()
	query := `UPDATE accounts SET name = $1, balance = $2, currency = $3, updated_at = $4 WHERE id = $5`
	_, err := r.db.Exec(query, account.Name, account.Balance, account.Currency, account.UpdatedAt, account.ID)
	return err
}

func (r *AccountRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM accounts WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}
