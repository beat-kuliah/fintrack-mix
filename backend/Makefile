.PHONY: migrate-up migrate-down migrate-create run build

# Load environment variables
include .env
export

# Database URL
DATABASE_URL := postgresql://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)

# Run migrations up
migrate-up:
	@echo "Running migrations up..."
	migrate -path migrations -database "$(DATABASE_URL)" up

# Run migrations down
migrate-down:
	@echo "Running migrations down..."
	migrate -path migrations -database "$(DATABASE_URL)" down

# Create new migration
migrate-create:
	@read -p "Enter migration name: " name; \
	migrate create -ext sql -dir migrations -seq $$name

# Run the application
run:
	@echo "Starting server..."
	go run cmd/main.go

# Build the application
build:
	@echo "Building application..."
	go build -o bin/server cmd/main.go

# Install dependencies
deps:
	@echo "Installing dependencies..."
	go mod download
	go mod tidy
