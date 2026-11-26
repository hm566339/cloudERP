-- ==============================================================================
-- Flyway Migration: V4__chat_channel_description.sql
-- Add description/topic column to chat_channel
-- ==============================================================================

ALTER TABLE chat_channel ADD COLUMN IF NOT EXISTS description VARCHAR(500);
