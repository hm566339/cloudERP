-- ==============================================================================
-- Flyway Migration: V2__init_internal_chat.sql
-- Multi-tenant Company Chat and Quotation Request System (Mark2 ERP)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS chat_channel (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'GROUP',
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_channel_company ON chat_channel(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_channel_company_type ON chat_channel(company_id, type);

CREATE TABLE IF NOT EXISTS chat_channel_member (
    id UUID PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES chat_channel(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    last_read_at TIMESTAMP,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_chat_channel_member UNIQUE (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_member_company_user ON chat_channel_member(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_member_channel_user ON chat_channel_member(channel_id, user_id);

CREATE TABLE IF NOT EXISTS chat_message (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    channel_id UUID NOT NULL REFERENCES chat_channel(id) ON DELETE CASCADE,
    sender_id UUID,
    sender_name VARCHAR(255),
    message_type VARCHAR(50) NOT NULL DEFAULT 'TEXT',
    reference_id UUID,
    action_status VARCHAR(50),
    metadata_json TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_comp_chan_created ON chat_message(company_id, channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_msg_comp_action_status ON chat_message(company_id, action_status)
    WHERE action_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_msg_reference_id ON chat_message(reference_id)
    WHERE reference_id IS NOT NULL;
