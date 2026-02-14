package repository

import (
	"fmt"
	"time"

	"github.com/financial-tracker/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type BudgetRepository struct {
	db *sqlx.DB
}

func NewBudgetRepository(db *sqlx.DB) *BudgetRepository {
	return &BudgetRepository{db: db}
}

func (r *BudgetRepository) Create(budget *models.Budget) error {
	budget.ID = uuid.New()
	budget.CreatedAt = time.Now()
	budget.UpdatedAt = time.Now()

	query := `
		INSERT INTO budgets (id, user_id, category, amount, budget_month, budget_year, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.db.Exec(query, budget.ID, budget.UserID, budget.Category, budget.Amount, budget.BudgetMonth, budget.BudgetYear, budget.CreatedAt, budget.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create budget: %w", err)
	}

	return nil
}

func (r *BudgetRepository) GetByUserID(userID uuid.UUID) ([]models.Budget, error) {
	var budgets []models.Budget
	query := `SELECT id, user_id, category, amount, budget_month, budget_year, created_at, updated_at FROM budgets WHERE user_id = $1 ORDER BY budget_year DESC, budget_month DESC, category ASC`
	err := r.db.Select(&budgets, query, userID)
	if err != nil {
		return nil, err
	}
	return budgets, nil
}

// GetByMonthYear returns budgets for specific month/year
func (r *BudgetRepository) GetByMonthYear(userID uuid.UUID, month, year int) ([]models.Budget, error) {
	var budgets []models.Budget
	query := `SELECT id, user_id, category, amount, budget_month, budget_year, created_at, updated_at 
		FROM budgets WHERE user_id = $1 AND budget_month = $2 AND budget_year = $3 
		ORDER BY category ASC`
	err := r.db.Select(&budgets, query, userID, month, year)
	if err != nil {
		return nil, err
	}
	return budgets, nil
}

func (r *BudgetRepository) GetByID(id uuid.UUID) (*models.Budget, error) {
	var budget models.Budget
	query := `SELECT id, user_id, category, amount, budget_month, budget_year, created_at, updated_at FROM budgets WHERE id = $1`
	err := r.db.Get(&budget, query, id)
	if err != nil {
		return nil, err
	}
	return &budget, nil
}

func (r *BudgetRepository) Update(budget *models.Budget) error {
	budget.UpdatedAt = time.Now()
	query := `UPDATE budgets SET category = $1, amount = $2, budget_month = $3, budget_year = $4, updated_at = $5 WHERE id = $6`
	_, err := r.db.Exec(query, budget.Category, budget.Amount, budget.BudgetMonth, budget.BudgetYear, budget.UpdatedAt, budget.ID)
	return err
}

func (r *BudgetRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM budgets WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

// CopyFromMonth copies all budgets from one month to another
func (r *BudgetRepository) CopyFromMonth(userID uuid.UUID, fromMonth, fromYear, toMonth, toYear int) (int, error) {
	// Get budgets from source month
	sourceBudgets, err := r.GetByMonthYear(userID, fromMonth, fromYear)
	if err != nil {
		return 0, err
	}

	count := 0
	for _, sb := range sourceBudgets {
		newBudget := models.Budget{
			UserID:      userID,
			Category:    sb.Category,
			Amount:      sb.Amount,
			BudgetMonth: toMonth,
			BudgetYear:  toYear,
		}
		// Try to create, skip if duplicate
		err := r.Create(&newBudget)
		if err == nil {
			count++
		}
	}

	return count, nil
}
