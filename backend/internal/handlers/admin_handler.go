package handlers

import (
	"net/http"

	"github.com/financial-tracker/backend/internal/models"
	"github.com/financial-tracker/backend/internal/repository"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminHandler struct {
	userRepo      *repository.UserRepository
	apiConfigRepo *repository.APIConfigRepository
	goldRepo      *repository.GoldRepository
}

func NewAdminHandler(userRepo *repository.UserRepository, apiConfigRepo *repository.APIConfigRepository, goldRepo *repository.GoldRepository) *AdminHandler {
	return &AdminHandler{
		userRepo:      userRepo,
		apiConfigRepo: apiConfigRepo,
		goldRepo:      goldRepo,
	}
}

// User Management

func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	users, err := h.userRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}
	if users == nil {
		users = []models.User{}
	}
	c.JSON(http.StatusOK, users)
}

func (h *AdminHandler) GetUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.userRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *AdminHandler) UpdateUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.userRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.FullName != "" {
		user.FullName = req.FullName
	}
	if req.IsAdmin != nil {
		user.IsAdmin = *req.IsAdmin
	}

	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *AdminHandler) DeleteUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Prevent deleting self
	currentUserID, _ := c.Get("user_id")
	if id == currentUserID.(uuid.UUID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
		return
	}

	if err := h.userRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// API Configuration Management

func (h *AdminHandler) GetAllAPIConfigs(c *gin.Context) {
	configs, err := h.apiConfigRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get API configurations"})
		return
	}
	if configs == nil {
		configs = []models.APIConfiguration{}
	}
	c.JSON(http.StatusOK, configs)
}

func (h *AdminHandler) GetAPIConfig(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid config ID"})
		return
	}

	config, err := h.apiConfigRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Configuration not found"})
		return
	}

	c.JSON(http.StatusOK, config)
}

func (h *AdminHandler) UpdateAPIConfig(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid config ID"})
		return
	}

	var req models.UpdateAPIConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.apiConfigRepo.Update(id, req.Config, req.IsActive); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update configuration"})
		return
	}

	// Get updated config
	config, _ := h.apiConfigRepo.GetByID(id)
	c.JSON(http.StatusOK, config)
}

// Dashboard Stats

func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	// Get all users count
	users, _ := h.userRepo.GetAll()
	userCount := 0
	adminCount := 0
	if users != nil {
		userCount = len(users)
		for _, u := range users {
			if u.IsAdmin {
				adminCount++
			}
		}
	}

	// Get gold price
	goldPrice, _ := h.goldRepo.GetLatestPrice()
	var currentGoldPrice float64
	if goldPrice != nil {
		currentGoldPrice = goldPrice.PricePerGram
	}

	// Get API configs status
	configs, _ := h.apiConfigRepo.GetAll()
	activeAPIs := 0
	if configs != nil {
		for _, c := range configs {
			if c.IsActive {
				activeAPIs++
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_users":        userCount,
		"admin_users":        adminCount,
		"current_gold_price": currentGoldPrice,
		"active_apis":        activeAPIs,
		"total_apis":         len(configs),
	})
}
