-- V13: Extended Organization Appearance Configuration
-- Supports branding assets (light logo, dark logo, favicon), layout configuration,
-- typography scale, and custom 60-30-10 palette overrides with tenant isolation.

ALTER TABLE organization_appearance
    ADD COLUMN IF NOT EXISTS sidebar_default_state VARCHAR(20) DEFAULT 'expanded',
    ADD COLUMN IF NOT EXISTS content_width VARCHAR(20) DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS border_radius VARCHAR(20) DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS card_shadow BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS table_density VARCHAR(20) DEFAULT 'comfortable',
    ADD COLUMN IF NOT EXISTS base_font_size VARCHAR(20) DEFAULT 'default',
    ADD COLUMN IF NOT EXISTS light_logo_url TEXT,
    ADD COLUMN IF NOT EXISTS dark_logo_url TEXT,
    ADD COLUMN IF NOT EXISTS favicon_url TEXT,
    ADD COLUMN IF NOT EXISTS custom_overrides_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS custom_palette TEXT,
    ADD COLUMN IF NOT EXISTS primary_color VARCHAR(30),
    ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(30),
    ADD COLUMN IF NOT EXISTS accent_color VARCHAR(30);

