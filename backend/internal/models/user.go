package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `db:"id" json:"id"`
	Email        string    `db:"email" json:"email"`
	Username     *string   `db:"username" json:"username"`
	PasswordHash string    `db:"password_hash" json:"-"`
	FullName     string    `db:"full_name" json:"full_name"`
	IsAdmin      bool      `db:"is_admin" json:"is_admin"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
}

type LoginRequest struct {
	UsernameOrEmail string `json:"username_or_email" binding:"required"`
	Password        string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// Admin models
type UpdateUserRequest struct {
	FullName string `json:"full_name"`
	IsAdmin  *bool  `json:"is_admin"`
}

type APIConfiguration struct {
	ID        uuid.UUID              `db:"id" json:"id"`
	APIName   string                 `db:"api_name" json:"api_name"`
	APIType   string                 `db:"api_type" json:"api_type"`
	Config    map[string]interface{} `db:"config" json:"config"`
	IsActive  bool                   `db:"is_active" json:"is_active"`
	CreatedAt time.Time              `db:"created_at" json:"created_at"`
	UpdatedAt time.Time              `db:"updated_at" json:"updated_at"`
}

type UpdateAPIConfigRequest struct {
	Config   map[string]interface{} `json:"config"`
	IsActive *bool                  `json:"is_active"`
}
