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

type GoldHandler struct {
	goldRepo *repository.GoldRepository
}

func NewGoldHandler(goldRepo *repository.GoldRepository) *GoldHandler {
	return &GoldHandler{goldRepo: goldRepo}
}

type CreateGoldAssetRequest struct {
	Name                 string  `json:"name" binding:"required"`
	GoldType             string  `json:"gold_type" binding:"required"`
	WeightGram           float64 `json:"weight_gram" binding:"required,gt=0"`
	PurchasePricePerGram float64 `json:"purchase_price_per_gram" binding:"required,gt=0"`
	PurchaseDate         string  `json:"purchase_date" binding:"required"`
	StorageLocation      string  `json:"storage_location"`
	Notes                string  `json:"notes"`
}

type UpdateGoldPriceRequest struct {
	PricePerGram float64 `json:"price_per_gram" binding:"required,gt=0"`
	Source       string  `json:"source"`
}

// Asset handlers

func (h *GoldHandler) CreateAsset(c *gin.Context) {
	var req CreateGoldAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	purchaseDate, err := time.Parse("2006-01-02", req.PurchaseDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid purchase date format (use YYYY-MM-DD)"})
		return
	}

	asset := &models.GoldAsset{
		UserID:               userID.(uuid.UUID),
		Name:                 req.Name,
		GoldType:             models.GoldType(req.GoldType),
		WeightGram:           req.WeightGram,
		PurchasePricePerGram: req.PurchasePricePerGram,
		PurchaseDate:         purchaseDate,
		StorageLocation:      req.StorageLocation,
		Notes:                req.Notes,
	}

	if err := h.goldRepo.CreateAsset(asset); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create gold asset"})
		return
	}

	// Reload to get calculated values
	asset, _ = h.goldRepo.GetAssetByID(asset.ID)

	c.JSON(http.StatusCreated, asset)
}

func (h *GoldHandler) GetAllAssets(c *gin.Context) {
	userID, _ := c.Get("user_id")
	assets, err := h.goldRepo.GetAssetsByUserID(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get gold assets"})
		return
	}

	c.JSON(http.StatusOK, assets)
}

func (h *GoldHandler) GetAssetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid asset ID"})
		return
	}

	asset, err := h.goldRepo.GetAssetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Gold asset not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if asset.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, asset)
}

func (h *GoldHandler) DeleteAsset(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid asset ID"})
		return
	}

	asset, err := h.goldRepo.GetAssetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Gold asset not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if asset.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if err := h.goldRepo.DeleteAsset(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete gold asset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Gold asset deleted successfully"})
}

// Summary

func (h *GoldHandler) GetSummary(c *gin.Context) {
	userID, _ := c.Get("user_id")
	
	totalWeight, totalPurchase, totalCurrent, totalPL, err := h.goldRepo.GetSummary(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get summary"})
		return
	}

	var plPercent float64
	if totalPurchase > 0 {
		plPercent = (totalPL / totalPurchase) * 100
	}

	currentPrice, _ := h.goldRepo.GetLatestPrice()
	var pricePerGram float64
	var priceDate string
	if currentPrice != nil {
		pricePerGram = currentPrice.PricePerGram
		priceDate = currentPrice.PriceDate.Format("2006-01-02")
	}

	c.JSON(http.StatusOK, gin.H{
		"total_weight_gram":     totalWeight,
		"total_purchase_value":  totalPurchase,
		"total_current_value":   totalCurrent,
		"total_profit_loss":     totalPL,
		"profit_loss_percent":   plPercent,
		"current_price_per_gram": pricePerGram,
		"price_date":            priceDate,
	})
}

// Price handlers (for admin)

func (h *GoldHandler) GetLatestPrice(c *gin.Context) {
	price, err := h.goldRepo.GetLatestPrice()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No price data available"})
		return
	}

	c.JSON(http.StatusOK, price)
}

func (h *GoldHandler) GetPriceHistory(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "30")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 365 {
		limit = 30
	}

	prices, err := h.goldRepo.GetPriceHistory(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get price history"})
		return
	}

	c.JSON(http.StatusOK, prices)
}

func (h *GoldHandler) UpdateTodayPrice(c *gin.Context) {
	var req UpdateGoldPriceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	source := req.Source
	if source == "" {
		source = "admin"
	}

	today := time.Now().Truncate(24 * time.Hour)
	if err := h.goldRepo.UpsertPrice(today, req.PricePerGram, source); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update price"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Price updated successfully",
		"date":           today.Format("2006-01-02"),
		"price_per_gram": req.PricePerGram,
		"source":         source,
	})
}
