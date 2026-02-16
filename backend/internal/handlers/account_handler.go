package handlers

import (
	"net/http"

	"github.com/financial-tracker/backend/internal/models"
	"github.com/financial-tracker/backend/internal/repository"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AccountHandler struct {
	accountRepo *repository.AccountRepository
}

func NewAccountHandler(accountRepo *repository.AccountRepository) *AccountHandler {
	return &AccountHandler{accountRepo: accountRepo}
}

func (h *AccountHandler) Create(c *gin.Context) {
	var req models.CreateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate account type
	validTypes := map[models.AccountType]bool{
		models.AccountTypeBank:    true,
		models.AccountTypeWallet:  true,
		models.AccountTypeCash:    true,
		models.AccountTypePaylater: true,
	}
	if !validTypes[req.Type] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account type. Must be one of: bank, wallet, cash, paylater"})
		return
	}

	userID, _ := c.Get("user_id")
	account := &models.Account{
		UserID:          userID.(uuid.UUID),
		Name:            req.Name,
		Type:            req.Type,
		Currency:        req.Currency,
		Icon:            req.Icon,
		Color:           req.Color,
		ParentAccountID: req.ParentAccountID,
	}

	if account.Currency == "" {
		account.Currency = "IDR"
	}
	if account.Icon == "" {
		account.Icon = "💳"
	}
	if account.Color == "" {
		account.Color = "#3b82f6"
	}

	if err := h.accountRepo.Create(account); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account"})
		return
	}

	c.JSON(http.StatusCreated, account)
}

func (h *AccountHandler) GetAll(c *gin.Context) {
	userID, _ := c.Get("user_id")
	accounts, err := h.accountRepo.GetByUserID(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get accounts"})
		return
	}

	c.JSON(http.StatusOK, accounts)
}

func (h *AccountHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	account, err := h.accountRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	// Check ownership
	userID, _ := c.Get("user_id")
	if account.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, account)
}

func (h *AccountHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Check ownership
	account, err := h.accountRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if account.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var req models.UpdateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update only allowed fields
	account.Name = req.Name
	if req.Currency != "" {
		account.Currency = req.Currency
	}
	// Always update icon - use provided value or default if empty
	if req.Icon != "" {
		account.Icon = req.Icon
	} else {
		// If icon is empty in request, set default (but still update it)
		account.Icon = "💳"
	}
	// Always update color - use provided value or default if empty
	if req.Color != "" {
		account.Color = req.Color
	} else {
		// If color is empty in request, set default (but still update it)
		account.Color = "#3b82f6"
	}

	if err := h.accountRepo.Update(account); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update account"})
		return
	}

	c.JSON(http.StatusOK, account)
}

func (h *AccountHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Check ownership
	account, err := h.accountRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if account.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if err := h.accountRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
}
