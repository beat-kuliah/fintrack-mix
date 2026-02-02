package handlers

import (
	"net/http"
	"strconv"

	"github.com/financial-tracker/backend/internal/models"
	"github.com/financial-tracker/backend/internal/repository"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BudgetHandler struct {
	budgetRepo *repository.BudgetRepository
}

func NewBudgetHandler(budgetRepo *repository.BudgetRepository) *BudgetHandler {
	return &BudgetHandler{budgetRepo: budgetRepo}
}

type CreateBudgetRequest struct {
	Category    string  `json:"category" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	BudgetMonth int     `json:"budget_month" binding:"required,min=1,max=12"`
	BudgetYear  int     `json:"budget_year" binding:"required,min=2020"`
}

type CopyBudgetRequest struct {
	FromMonth int `json:"from_month" binding:"required,min=1,max=12"`
	FromYear  int `json:"from_year" binding:"required,min=2020"`
	ToMonth   int `json:"to_month" binding:"required,min=1,max=12"`
	ToYear    int `json:"to_year" binding:"required,min=2020"`
}

func (h *BudgetHandler) Create(c *gin.Context) {
	var req CreateBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	budget := &models.Budget{
		UserID:      userID.(uuid.UUID),
		Category:    req.Category,
		Amount:      req.Amount,
		BudgetMonth: req.BudgetMonth,
		BudgetYear:  req.BudgetYear,
	}

	if err := h.budgetRepo.Create(budget); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create budget. Category might already exist for this month."})
		return
	}

	c.JSON(http.StatusCreated, budget)
}

func (h *BudgetHandler) GetAll(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// Check for month/year filters
	monthStr := c.Query("month")
	yearStr := c.Query("year")

	if monthStr != "" && yearStr != "" {
		month, err1 := strconv.Atoi(monthStr)
		year, err2 := strconv.Atoi(yearStr)
		if err1 == nil && err2 == nil {
			budgets, err := h.budgetRepo.GetByMonthYear(userID.(uuid.UUID), month, year)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get budgets"})
				return
			}
			c.JSON(http.StatusOK, budgets)
			return
		}
	}

	budgets, err := h.budgetRepo.GetByUserID(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get budgets"})
		return
	}

	c.JSON(http.StatusOK, budgets)
}

func (h *BudgetHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid budget ID"})
		return
	}

	budget, err := h.budgetRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Budget not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if budget.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, budget)
}

func (h *BudgetHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid budget ID"})
		return
	}

	budget, err := h.budgetRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Budget not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if budget.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if err := h.budgetRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete budget"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Budget deleted successfully"})
}

// CopyFromMonth copies budgets from one month to another
func (h *BudgetHandler) CopyFromMonth(c *gin.Context) {
	var req CopyBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	count, err := h.budgetRepo.CopyFromMonth(userID.(uuid.UUID), req.FromMonth, req.FromYear, req.ToMonth, req.ToYear)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to copy budgets"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Budgets copied successfully",
		"copied":  count,
	})
}
