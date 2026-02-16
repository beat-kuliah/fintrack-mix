package main

import (
	"fmt"
	"log"
	"os"

	"github.com/financial-tracker/backend/config"
	"github.com/financial-tracker/backend/internal/handlers"
	"github.com/financial-tracker/backend/internal/middleware"
	"github.com/financial-tracker/backend/internal/repository"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Connect to database
	db, err := config.NewDatabase()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	accountRepo := repository.NewAccountRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	budgetRepo := repository.NewBudgetRepository(db)
	creditCardRepo := repository.NewCreditCardRepository(db)
	goldRepo := repository.NewGoldRepository(db)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userRepo)
	accountHandler := handlers.NewAccountHandler(accountRepo)
	transactionHandler := handlers.NewTransactionHandler(transactionRepo, accountRepo)
	budgetHandler := handlers.NewBudgetHandler(budgetRepo)
	creditCardHandler := handlers.NewCreditCardHandler(creditCardRepo)
	goldHandler := handlers.NewGoldHandler(goldRepo)

	// Setup Gin router
	router := gin.Default()

	// CORS configuration
	corsOrigins := os.Getenv("CORS_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "http://localhost:3000"
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{corsOrigins},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Financial Tracker API is running"})
	})

	// API routes
	api := router.Group("/api")
	
	// Public routes (no authentication required)
	// Auth routes - MUST be defined before protected routes
	api.POST("/auth/register", authHandler.Register)
	api.POST("/auth/login", authHandler.Login)
	
	// Public gold price endpoints
	api.GET("/gold/price", goldHandler.GetLatestPrice)
	api.GET("/gold/price/history", goldHandler.GetPriceHistory)

	// Protected routes (authentication required)
	// Create separate groups for each resource to avoid conflicts
	authProtected := api.Group("/auth")
	authProtected.Use(middleware.AuthMiddleware())
	{
		authProtected.GET("/me", authHandler.GetMe)
	}

	accounts := api.Group("/accounts")
	accounts.Use(middleware.AuthMiddleware())
	{
		accounts.POST("", accountHandler.Create)
		accounts.GET("", accountHandler.GetAll)
		accounts.GET("/:id", accountHandler.GetByID)
		accounts.PUT("/:id", accountHandler.Update)
		accounts.DELETE("/:id", accountHandler.Delete)
	}

	transactions := api.Group("/transactions")
	transactions.Use(middleware.AuthMiddleware())
	{
		transactions.POST("", transactionHandler.Create)
		transactions.GET("", transactionHandler.GetAll)
		transactions.GET("/summary", transactionHandler.GetSummary)
		transactions.GET("/:id", transactionHandler.GetByID)
		transactions.DELETE("/:id", transactionHandler.Delete)
	}

	budgets := api.Group("/budgets")
	budgets.Use(middleware.AuthMiddleware())
	{
		budgets.POST("", budgetHandler.Create)
		budgets.GET("", budgetHandler.GetAll)
		budgets.POST("/copy", budgetHandler.CopyFromMonth)
		budgets.GET("/:id", budgetHandler.GetByID)
		budgets.DELETE("/:id", budgetHandler.Delete)
	}

	creditCards := api.Group("/credit-cards")
	creditCards.Use(middleware.AuthMiddleware())
	{
		creditCards.POST("", creditCardHandler.Create)
		creditCards.GET("", creditCardHandler.GetAll)
		creditCards.GET("/:id", creditCardHandler.GetByID)
		creditCards.DELETE("/:id", creditCardHandler.Delete)
	}

	goldProtected := api.Group("/gold")
	goldProtected.Use(middleware.AuthMiddleware())
	{
		goldProtected.POST("/assets", goldHandler.CreateAsset)
		goldProtected.GET("/assets", goldHandler.GetAllAssets)
		goldProtected.GET("/assets/:id", goldHandler.GetAssetByID)
		goldProtected.DELETE("/assets/:id", goldHandler.DeleteAsset)
		goldProtected.GET("/summary", goldHandler.GetSummary)
		// Admin: update today's price
		goldProtected.POST("/price", goldHandler.UpdateTodayPrice)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}

	fmt.Printf("\n🚀 Server starting on port %s\n", port)
	fmt.Println("📊 API Documentation:")
	fmt.Println("   POST   /api/auth/register")
	fmt.Println("   POST   /api/auth/login")
	fmt.Println("   GET    /api/auth/me")
	fmt.Println("   CRUD   /api/accounts (with sub-accounts)")
	fmt.Println("   CRUD   /api/transactions")
	fmt.Println("   CRUD   /api/budgets (month/year based)")
	fmt.Println("   POST   /api/budgets/copy (copy from previous month)")
	fmt.Println("   CRUD   /api/credit-cards")
	fmt.Println("   CRUD   /api/gold/assets")
	fmt.Println("   GET    /api/gold/summary")
	fmt.Println("   GET    /api/gold/price")
	fmt.Println()

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
