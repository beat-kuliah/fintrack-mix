-- Migration 010: Add admin features
-- 1. Add is_admin field to users
-- 2. Create api_configurations table for WhatsApp & AI API management

-- Add is_admin to users
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create API configurations table for storing API credentials
CREATE TABLE IF NOT EXISTS api_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_name VARCHAR(100) NOT NULL UNIQUE,
    api_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'ai_cursor', etc
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default API configurations
INSERT INTO api_configurations (api_name, api_type, config, is_active) VALUES
('whatsapp_business', 'whatsapp', '{"phone_number_id": "", "access_token": "", "verify_token": "", "webhook_url": ""}', false),
('ai_cursor_agent', 'ai_cursor', '{"api_key": "", "model": "gpt-4", "endpoint": ""}', false);

-- Create index
CREATE INDEX idx_api_configurations_type ON api_configurations(api_type);
