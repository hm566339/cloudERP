-- ==============================================================================
-- Flyway Migration: V5__user_inbox_notifications.sql
-- Real-Time and Persistent In-App Notifications for Mark2 ERP
-- ==============================================================================

CREATE TABLE IF NOT EXISTS user_notification (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    recipient_user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_notif_tenant_recipient_read ON user_notification(tenant_id, recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notif_tenant_recipient_created ON user_notification(tenant_id, recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notif_reference ON user_notification(reference_id)
    WHERE reference_id IS NOT NULL;
