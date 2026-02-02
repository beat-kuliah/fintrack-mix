package repository

import (
	"fmt"
	"time"

	"github.com/financial-tracker/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type GoldRepository struct {
	db *sqlx.DB
}

func NewGoldRepository(db *sqlx.DB) *GoldRepository {
	return &GoldRepository{db: db}
}

// Gold Assets

func (r *GoldRepository) CreateAsset(asset *models.GoldAsset) error {
	asset.ID = uuid.New()
	asset.CreatedAt = time.Now()
	asset.UpdatedAt = time.Now()

	query := `
		INSERT INTO gold_assets (id, user_id, name, gold_type, weight_gram, purchase_price_per_gram, purchase_date, storage_location, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := r.db.Exec(query, asset.ID, asset.UserID, asset.Name, asset.GoldType, asset.WeightGram, asset.PurchasePricePerGram, asset.PurchaseDate, asset.StorageLocation, asset.Notes, asset.CreatedAt, asset.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create gold asset: %w", err)
	}

	return nil
}

func (r *GoldRepository) GetAssetsByUserID(userID uuid.UUID) ([]models.GoldAsset, error) {
	var assets []models.GoldAsset
	query := `SELECT id, user_id, name, gold_type, weight_gram, purchase_price_per_gram, purchase_date, storage_location, notes, created_at, updated_at 
		FROM gold_assets WHERE user_id = $1 ORDER BY purchase_date DESC`
	err := r.db.Select(&assets, query, userID)
	if err != nil {
		return nil, err
	}

	// Get current price and calculate values
	currentPrice, _ := r.GetLatestPrice()
	for i := range assets {
		r.calculateAssetValues(&assets[i], currentPrice)
	}

	return assets, nil
}

func (r *GoldRepository) GetAssetByID(id uuid.UUID) (*models.GoldAsset, error) {
	var asset models.GoldAsset
	query := `SELECT id, user_id, name, gold_type, weight_gram, purchase_price_per_gram, purchase_date, storage_location, notes, created_at, updated_at FROM gold_assets WHERE id = $1`
	err := r.db.Get(&asset, query, id)
	if err != nil {
		return nil, err
	}

	// Calculate values
	currentPrice, _ := r.GetLatestPrice()
	r.calculateAssetValues(&asset, currentPrice)

	return &asset, nil
}

func (r *GoldRepository) UpdateAsset(asset *models.GoldAsset) error {
	asset.UpdatedAt = time.Now()
	query := `UPDATE gold_assets SET name = $1, gold_type = $2, weight_gram = $3, purchase_price_per_gram = $4, storage_location = $5, notes = $6, updated_at = $7 WHERE id = $8`
	_, err := r.db.Exec(query, asset.Name, asset.GoldType, asset.WeightGram, asset.PurchasePricePerGram, asset.StorageLocation, asset.Notes, asset.UpdatedAt, asset.ID)
	return err
}

func (r *GoldRepository) DeleteAsset(id uuid.UUID) error {
	query := `DELETE FROM gold_assets WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *GoldRepository) calculateAssetValues(asset *models.GoldAsset, currentPrice *models.GoldPrice) {
	asset.PurchaseValue = asset.WeightGram * asset.PurchasePricePerGram
	
	if currentPrice != nil {
		asset.CurrentPricePerGram = currentPrice.PricePerGram
		asset.CurrentValue = asset.WeightGram * currentPrice.PricePerGram
		asset.ProfitLoss = asset.CurrentValue - asset.PurchaseValue
		if asset.PurchaseValue > 0 {
			asset.ProfitLossPercent = (asset.ProfitLoss / asset.PurchaseValue) * 100
		}
	}
}

// Gold Prices

func (r *GoldRepository) GetLatestPrice() (*models.GoldPrice, error) {
	var price models.GoldPrice
	query := `SELECT id, price_date, price_per_gram, source, created_at, updated_at FROM gold_prices ORDER BY price_date DESC LIMIT 1`
	err := r.db.Get(&price, query)
	if err != nil {
		return nil, err
	}
	return &price, nil
}

func (r *GoldRepository) GetPriceHistory(limit int) ([]models.GoldPrice, error) {
	var prices []models.GoldPrice
	query := `SELECT id, price_date, price_per_gram, source, created_at, updated_at FROM gold_prices ORDER BY price_date DESC LIMIT $1`
	err := r.db.Select(&prices, query, limit)
	if err != nil {
		return nil, err
	}
	return prices, nil
}

func (r *GoldRepository) UpsertPrice(priceDate time.Time, pricePerGram float64, source string) error {
	query := `
		INSERT INTO gold_prices (id, price_date, price_per_gram, source, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (price_date) 
		DO UPDATE SET price_per_gram = $3, source = $4, updated_at = $6
	`
	now := time.Now()
	_, err := r.db.Exec(query, uuid.New(), priceDate, pricePerGram, source, now, now)
	return err
}

// GetSummary returns total weight and value of all gold assets
func (r *GoldRepository) GetSummary(userID uuid.UUID) (totalWeight, totalPurchaseValue, totalCurrentValue, totalProfitLoss float64, err error) {
	assets, err := r.GetAssetsByUserID(userID)
	if err != nil {
		return
	}

	for _, a := range assets {
		totalWeight += a.WeightGram
		totalPurchaseValue += a.PurchaseValue
		totalCurrentValue += a.CurrentValue
		totalProfitLoss += a.ProfitLoss
	}

	return
}
