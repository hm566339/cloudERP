-- ==============================================================================
-- V14: Ensure organization_appearance custom_palette and extended appearance columns exist
-- Resolves production issue: column oa1_0.custom_palette does not exist
-- Idempotent and non-destructive: Safe to run on existing production data.
-- ==============================================================================

DO $$
BEGIN
    -- Ensure base table exists
    CREATE TABLE IF NOT EXISTS organization_appearance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL UNIQUE REFERENCES organization(id) ON DELETE CASCADE,
        active_theme VARCHAR(50) NOT NULL DEFAULT 'sage',
        appearance_mode VARCHAR(20) NOT NULL DEFAULT 'system',
        layout_density VARCHAR(20) NOT NULL DEFAULT 'comfortable',
        font_family VARCHAR(50) NOT NULL DEFAULT 'default',
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 1. Custom palette column (TEXT allows storing serialized JSON color palette)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'custom_palette'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN custom_palette TEXT;
    END IF;

    -- 2. Custom overrides enabled flag
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'custom_overrides_enabled'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN custom_overrides_enabled BOOLEAN DEFAULT false;
    END IF;

    -- 3. Primary color override
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'primary_color'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN primary_color VARCHAR(30);
    END IF;

    -- 4. Secondary color override
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'secondary_color'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN secondary_color VARCHAR(30);
    END IF;

    -- 5. Accent color override
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'accent_color'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN accent_color VARCHAR(30);
    END IF;

    -- 6. Sidebar default state
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'sidebar_default_state'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN sidebar_default_state VARCHAR(20) DEFAULT 'expanded';
    END IF;

    -- 7. Content width
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'content_width'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN content_width VARCHAR(20) DEFAULT 'standard';
    END IF;

    -- 8. Border radius
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'border_radius'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN border_radius VARCHAR(20) DEFAULT 'medium';
    END IF;

    -- 9. Card shadow
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'card_shadow'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN card_shadow BOOLEAN DEFAULT true;
    END IF;

    -- 10. Table density
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'table_density'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN table_density VARCHAR(20) DEFAULT 'comfortable';
    END IF;

    -- 11. Base font size
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'base_font_size'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN base_font_size VARCHAR(20) DEFAULT 'default';
    END IF;

    -- 12. Light logo URL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'light_logo_url'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN light_logo_url TEXT;
    END IF;

    -- 13. Dark logo URL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'dark_logo_url'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN dark_logo_url TEXT;
    END IF;

    -- 14. Favicon URL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_appearance' AND column_name = 'favicon_url'
    ) THEN
        ALTER TABLE organization_appearance ADD COLUMN favicon_url TEXT;
    END IF;
END $$;

-- 15. Unique index on organization_id
CREATE UNIQUE INDEX IF NOT EXISTS uk_org_appearance_organization ON organization_appearance (organization_id);

