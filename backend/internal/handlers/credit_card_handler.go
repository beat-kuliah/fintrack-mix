package handlers

import (
	"net/http"

	"github.com/financial-tracker/backend/internal/models"
	"github.com/financial-tracker/backend/internal/repository"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreditCardHandler struct {
	cardRepo *repository.CreditCardRepository
}

func NewCreditCardHandler(cardRepo *repository.CreditCardRepository) *CreditCardHandler {
	return &CreditCardHandler{cardRepo: cardRepo}
}

type CreateCreditCardRequest struct {
	CardName        string  `json:"card_name" binding:"required"`
	LastFourDigits  string  `json:"last_four_digits" binding:"required,len=4"`
	CreditLimit     float64 `json:"credit_limit" binding:"required,gt=0"`
	CurrentBalance  float64 `json:"current_balance"`
	BillingDate     int     `json:"billing_date" binding:"required,gte=1,lte=31"`
	PaymentDueDate  int     `json:"payment_due_date" binding:"required,gte=1,lte=31"`
}

func (h *CreditCardHandler) Create(c *gin.Context) {
	var req CreateCreditCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	card := &models.CreditCard{
		UserID:         userID.(uuid.UUID),
		CardName:       req.CardName,
		LastFourDigits: req.LastFourDigits,
		CreditLimit:    req.CreditLimit,
		CurrentBalance: req.CurrentBalance,
		BillingDate:    req.BillingDate,
		PaymentDueDate: req.PaymentDueDate,
	}

	if err := h.cardRepo.Create(card); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create credit card"})
		return
	}

	c.JSON(http.StatusCreated, card)
}

func (h *CreditCardHandler) GetAll(c *gin.Context) {
	userID, _ := c.Get("user_id")
	cards, err := h.cardRepo.GetByUserID(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get credit cards"})
		return
	}

	c.JSON(http.StatusOK, cards)
}

func (h *CreditCardHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid credit card ID"})
		return
	}

	card, err := h.cardRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Credit card not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if card.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, card)
}

func (h *CreditCardHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid credit card ID"})
		return
	}

	card, err := h.cardRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Credit card not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if card.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if err := h.cardRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete credit card"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Credit card deleted successfully"})
}
