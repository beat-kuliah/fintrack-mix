package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/financial-tracker/backend/internal/models"
	"github.com/financial-tracker/backend/internal/repository"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TransactionHandler struct {
	transactionRepo *repository.TransactionRepository
	accountRepo     *repository.AccountRepository
	creditCardRepo  *repository.CreditCardRepository
}

func NewTransactionHandler(transactionRepo *repository.TransactionRepository, accountRepo *repository.AccountRepository, creditCardRepo *repository.CreditCardRepository) *TransactionHandler {
	return &TransactionHandler{
		transactionRepo: transactionRepo,
		accountRepo:     accountRepo,
		creditCardRepo:  creditCardRepo,
	}
}

func (h *TransactionHandler) Create(c *gin.Context) {
	var req models.CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate that either account_id or credit_card_id is provided
	if req.AccountID == "" && req.CreditCardID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Either account_id or credit_card_id must be provided"})
		return
	}

	if req.AccountID != "" && req.CreditCardID != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot provide both account_id and credit_card_id"})
		return
	}

	userID, _ := c.Get("user_id")
	
	var accountID *uuid.UUID
	var creditCardID *uuid.UUID
	var err error

	if req.AccountID != "" {
		parsedAccountID, err := uuid.Parse(req.AccountID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
			return
		}
		accountID = &parsedAccountID
	} else {
		parsedCreditCardID, err := uuid.Parse(req.CreditCardID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid credit card ID"})
			return
		}
		creditCardID = &parsedCreditCardID
	}

	// Parse transaction date
	var transactionDate time.Time
	if req.TransactionDate != "" {
		transactionDate, err = time.Parse("2006-01-02", req.TransactionDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}
	} else {
		transactionDate = time.Now()
	}

	transaction := &models.Transaction{
		UserID:          userID.(uuid.UUID),
		AccountID:       accountID,
		CreditCardID:    creditCardID,
		Type:            req.Type,
		Category:        req.Category,
		Amount:          req.Amount,
		Description:     req.Description,
		TransactionDate: transactionDate,
	}

	if err := h.transactionRepo.Create(transaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}

	// Update account or credit card balance
	if req.AccountID != "" && accountID != nil {
		account, err := h.accountRepo.GetByID(*accountID)
		if err == nil {
			if req.Type == models.TransactionTypeIncome {
				account.Balance += req.Amount
			} else if req.Type == models.TransactionTypeExpense {
				account.Balance -= req.Amount
			}
			h.accountRepo.Update(account)
		}
	} else if req.CreditCardID != "" && creditCardID != nil {
		// For credit cards, expenses increase the balance (debt), income decreases it (payment)
		if req.Type == models.TransactionTypeExpense {
			// Expense on credit card increases debt
			if err := h.creditCardRepo.UpdateBalance(*creditCardID, req.Amount); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update credit card balance"})
				return
			}
		} else if req.Type == models.TransactionTypeIncome {
			// Income on credit card decreases debt (payment)
			if err := h.creditCardRepo.UpdateBalance(*creditCardID, -req.Amount); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update credit card balance"})
				return
			}
		}
	}

	c.JSON(http.StatusCreated, transaction)
}

func (h *TransactionHandler) GetAll(c *gin.Context) {
	userID, _ := c.Get("user_id")
	
	limit := 50
	offset := 0
	
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}
	
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil {
			offset = parsed
		}
	}

	transactions, err := h.transactionRepo.GetByUserID(userID.(uuid.UUID), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transactions"})
		return
	}

	c.JSON(http.StatusOK, transactions)
}

func (h *TransactionHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	transaction, err := h.transactionRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	// Check ownership
	userID, _ := c.Get("user_id")
	if transaction.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, transaction)
}

func (h *TransactionHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	// Check ownership
	transaction, err := h.transactionRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if transaction.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var req models.UpdateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Store old values for balance reversal
	oldAmount := transaction.Amount
	oldType := transaction.Type
	oldAccountID := transaction.AccountID
	oldCreditCardID := transaction.CreditCardID

	// Update fields if provided
	if req.Category != "" {
		transaction.Category = req.Category
	}
	if req.Amount > 0 {
		transaction.Amount = req.Amount
	}
	if req.Description != "" {
		transaction.Description = req.Description
	}
	if req.TransactionDate != "" {
		transactionDate, err := time.Parse("2006-01-02", req.TransactionDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}
		transaction.TransactionDate = transactionDate
	}
	if req.Type != "" {
		transaction.Type = req.Type
	}
	if req.AccountID != "" {
		accountID, err := uuid.Parse(req.AccountID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
			return
		}
		transaction.AccountID = &accountID
		transaction.CreditCardID = nil
	} else if req.CreditCardID != "" {
		creditCardID, err := uuid.Parse(req.CreditCardID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid credit card ID"})
			return
		}
		transaction.CreditCardID = &creditCardID
		transaction.AccountID = nil
	}

	// Reverse old balance change on old account/credit card
	if oldAccountID != nil {
		oldAccount, oldAccountErr := h.accountRepo.GetByID(*oldAccountID)
		if oldAccountErr == nil && oldAccount != nil {
			// Reverse old transaction effect on old account
			if oldType == models.TransactionTypeIncome {
				oldAccount.Balance -= oldAmount
			} else if oldType == models.TransactionTypeExpense {
				oldAccount.Balance += oldAmount
			}
			if err := h.accountRepo.Update(oldAccount); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update old account balance: " + err.Error()})
				return
			}
		}
	} else if oldCreditCardID != nil {
		// Reverse old credit card transaction effect
		if oldType == models.TransactionTypeExpense {
			if err := h.creditCardRepo.UpdateBalance(*oldCreditCardID, -oldAmount); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update old credit card balance: " + err.Error()})
				return
			}
		} else if oldType == models.TransactionTypeIncome {
			if err := h.creditCardRepo.UpdateBalance(*oldCreditCardID, oldAmount); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update old credit card balance: " + err.Error()})
				return
			}
		}
	}

	// Handle new account/credit card balance update
	if transaction.AccountID != nil {
		newAccount, newAccountErr := h.accountRepo.GetByID(*transaction.AccountID)
		if newAccountErr == nil && newAccount != nil {
			// Apply new transaction effect on new account
			if transaction.Type == models.TransactionTypeIncome {
				newAccount.Balance += transaction.Amount
			} else if transaction.Type == models.TransactionTypeExpense {
				newAccount.Balance -= transaction.Amount
			}
			if err := h.accountRepo.Update(newAccount); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update new account balance: " + err.Error()})
				return
			}
		}
	} else if transaction.CreditCardID != nil {
		// Apply new credit card transaction effect
		if transaction.Type == models.TransactionTypeExpense {
			if err := h.creditCardRepo.UpdateBalance(*transaction.CreditCardID, transaction.Amount); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update new credit card balance: " + err.Error()})
				return
			}
		} else if transaction.Type == models.TransactionTypeIncome {
			if err := h.creditCardRepo.UpdateBalance(*transaction.CreditCardID, -transaction.Amount); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update new credit card balance: " + err.Error()})
				return
			}
		}
	}

	// Update transaction
	if err := h.transactionRepo.Update(transaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update transaction"})
		return
	}

	c.JSON(http.StatusOK, transaction)
}

func (h *TransactionHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	// Check ownership
	transaction, err := h.transactionRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if transaction.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Reverse account or credit card balance before deleting transaction
	if transaction.AccountID != nil {
		account, accountErr := h.accountRepo.GetByID(*transaction.AccountID)
		if accountErr == nil && account != nil {
			// It's a regular account transaction - reverse the balance change
			if transaction.Type == models.TransactionTypeIncome {
				// Income was added to balance, so subtract it
				account.Balance -= transaction.Amount
			} else if transaction.Type == models.TransactionTypeExpense {
				// Expense was subtracted from balance, so add it back
				account.Balance += transaction.Amount
			}
			if err := h.accountRepo.Update(account); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update account balance: " + err.Error()})
				return
			}
		}
	} else if transaction.CreditCardID != nil {
		// It's a credit card transaction - reverse credit card balance
		if transaction.Type == models.TransactionTypeExpense {
			// Expense was added to balance (debt), so subtract it
			if err := h.creditCardRepo.UpdateBalance(*transaction.CreditCardID, -transaction.Amount); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update credit card balance: " + err.Error()})
				return
			}
		} else if transaction.Type == models.TransactionTypeIncome {
			// Income was subtracted from balance (payment), so add it back
			if err := h.creditCardRepo.UpdateBalance(*transaction.CreditCardID, transaction.Amount); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update credit card balance: " + err.Error()})
				return
			}
		}
	}

	if err := h.transactionRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transaction: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transaction deleted successfully"})
}

func (h *TransactionHandler) GetSummary(c *gin.Context) {
	userID, _ := c.Get("user_id")
	summary, err := h.transactionRepo.GetSummary(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get summary"})
		return
	}

	c.JSON(http.StatusOK, summary)
}
