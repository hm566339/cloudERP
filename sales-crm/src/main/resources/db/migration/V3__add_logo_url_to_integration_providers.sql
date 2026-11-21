-- Flyway Migration: Add logo_url to integration_providers
ALTER TABLE integration_providers ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
