package repository

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/financial-tracker/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	user.ID = uuid.New()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	query := `
		INSERT INTO users (id, email, password_hash, full_name, is_admin, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.Exec(query, user.ID, user.Email, user.PasswordHash, user.FullName, user.IsAdmin, user.CreatedAt, user.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	query := `SELECT id, email, password_hash, full_name, is_admin, created_at, updated_at FROM users WHERE email = $1`
	err := r.db.Get(&user, query, email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	query := `SELECT id, email, password_hash, full_name, is_admin, created_at, updated_at FROM users WHERE id = $1`
	err := r.db.Get(&user, query, id)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Admin functions

func (r *UserRepository) GetAll() ([]models.User, error) {
	var users []models.User
	query := `SELECT id, email, full_name, is_admin, created_at, updated_at FROM users ORDER BY created_at DESC`
	err := r.db.Select(&users, query)
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (r *UserRepository) Update(user *models.User) error {
	user.UpdatedAt = time.Now()
	query := `UPDATE users SET full_name = $1, is_admin = $2, updated_at = $3 WHERE id = $4`
	_, err := r.db.Exec(query, user.FullName, user.IsAdmin, user.UpdatedAt, user.ID)
	return err
}

func (r *UserRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *UserRepository) SetAdmin(id uuid.UUID, isAdmin bool) error {
	query := `UPDATE users SET is_admin = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.Exec(query, isAdmin, time.Now(), id)
	return err
}

// API Configuration Repository

type APIConfigRepository struct {
	db *sqlx.DB
}

func NewAPIConfigRepository(db *sqlx.DB) *APIConfigRepository {
	return &APIConfigRepository{db: db}
}

func (r *APIConfigRepository) GetAll() ([]models.APIConfiguration, error) {
	rows, err := r.db.Query(`SELECT id, api_name, api_type, config, is_active, created_at, updated_at FROM api_configurations ORDER BY api_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []models.APIConfiguration
	for rows.Next() {
		var cfg models.APIConfiguration
		var configJSON []byte
		err := rows.Scan(&cfg.ID, &cfg.APIName, &cfg.APIType, &configJSON, &cfg.IsActive, &cfg.CreatedAt, &cfg.UpdatedAt)
		if err != nil {
			return nil, err
		}
		json.Unmarshal(configJSON, &cfg.Config)
		configs = append(configs, cfg)
	}
	return configs, nil
}

func (r *APIConfigRepository) GetByName(name string) (*models.APIConfiguration, error) {
	row := r.db.QueryRow(`SELECT id, api_name, api_type, config, is_active, created_at, updated_at FROM api_configurations WHERE api_name = $1`, name)
	
	var cfg models.APIConfiguration
	var configJSON []byte
	err := row.Scan(&cfg.ID, &cfg.APIName, &cfg.APIType, &configJSON, &cfg.IsActive, &cfg.CreatedAt, &cfg.UpdatedAt)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(configJSON, &cfg.Config)
	return &cfg, nil
}

func (r *APIConfigRepository) GetByID(id uuid.UUID) (*models.APIConfiguration, error) {
	row := r.db.QueryRow(`SELECT id, api_name, api_type, config, is_active, created_at, updated_at FROM api_configurations WHERE id = $1`, id)
	
	var cfg models.APIConfiguration
	var configJSON []byte
	err := row.Scan(&cfg.ID, &cfg.APIName, &cfg.APIType, &configJSON, &cfg.IsActive, &cfg.CreatedAt, &cfg.UpdatedAt)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(configJSON, &cfg.Config)
	return &cfg, nil
}

func (r *APIConfigRepository) Update(id uuid.UUID, config map[string]interface{}, isActive *bool) error {
	now := time.Now()
	
	if config != nil && isActive != nil {
		configJSON, _ := json.Marshal(config)
		query := `UPDATE api_configurations SET config = $1, is_active = $2, updated_at = $3 WHERE id = $4`
		_, err := r.db.Exec(query, configJSON, *isActive, now, id)
		return err
	} else if config != nil {
		configJSON, _ := json.Marshal(config)
		query := `UPDATE api_configurations SET config = $1, updated_at = $2 WHERE id = $3`
		_, err := r.db.Exec(query, configJSON, now, id)
		return err
	} else if isActive != nil {
		query := `UPDATE api_configurations SET is_active = $1, updated_at = $2 WHERE id = $3`
		_, err := r.db.Exec(query, *isActive, now, id)
		return err
	}
	return nil
}
