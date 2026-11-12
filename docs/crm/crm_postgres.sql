-- =============================================================================
-- MARK2 ENTERPRISE CLUSTER - CRM SERVICE PRODUCTION DATABASE SCHEMA (POSTGRESQL 15+)
-- Generated from Authoritative DBML: docs/crm/crm_final.dbml
-- Architecture: Multi-Tenant Tenant Isolation, Indian Statutory Compliance (GST/PAN/DPDP)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUM TYPE DEFINITIONS (29 Enums)
-- =============================================================================

CREATE TYPE lead_status_category AS ENUM (
  'OPEN',
  'QUALIFIED',
  'CONVERTED',
  'UNQUALIFIED',
  'RECYCLED'
);

CREATE TYPE lead_stage AS ENUM (
  'RAW',
  'INQUIRY',
  'MQL',
  'SQL',
  'UNQUALIFIED'
);

CREATE TYPE lead_rating AS ENUM (
  'HOT',
  'WARM',
  'COLD'
);

CREATE TYPE account_type AS ENUM (
  'PROSPECT',
  'CUSTOMER',
  'PARTNER',
  'VENDOR',
  'RESELLER'
);

CREATE TYPE business_type AS ENUM (
  'PVT_LTD',
  'PUBLIC_LTD',
  'LLP',
  'PROPRIETORSHIP',
  'PARTNERSHIP',
  'TRUST_NGO',
  'GOVERNMENT',
  'OTHER'
);

CREATE TYPE account_tier AS ENUM (
  'TIER_1',
  'TIER_2',
  'TIER_3'
);

CREATE TYPE decision_maker_role AS ENUM (
  'DECISION_MAKER',
  'INFLUENCER',
  'EVALUATOR',
  'END_USER',
  'GATEKEEPER'
);

CREATE TYPE address_type AS ENUM (
  'BILLING',
  'SHIPPING',
  'REGISTERED_OFFICE',
  'BRANCH_OFFICE',
  'SITE_LOCATION'
);

CREATE TYPE pipeline_stage_category AS ENUM (
  'PROSPECTING',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST'
);

CREATE TYPE opportunity_deal_type AS ENUM (
  'NEW_BUSINESS',
  'EXISTING_UPSELL',
  'RENEWAL'
);

CREATE TYPE opportunity_deal_status AS ENUM (
  'OPEN',
  'WON',
  'LOST',
  'ABANDONED'
);

CREATE TYPE task_type AS ENUM (
  'CALL',
  'MEETING',
  'DEMO',
  'EMAIL',
  'SITE_VISIT',
  'QUOTE_PREP',
  'FOLLOW_UP'
);

CREATE TYPE task_priority AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

CREATE TYPE task_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'OVERDUE'
);

CREATE TYPE communication_channel AS ENUM (
  'WHATSAPP',
  'EMAIL',
  'SMS',
  'PHONE_CALL',
  'WEB_CHAT'
);

CREATE TYPE message_direction AS ENUM (
  'INBOUND',
  'OUTBOUND'
);

CREATE TYPE message_delivery_status AS ENUM (
  'QUEUED',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED'
);

CREATE TYPE call_status AS ENUM (
  'ANSWERED',
  'MISSED',
  'BUSY',
  'NO_ANSWER',
  'FAILED'
);

CREATE TYPE quotation_status AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'DISPATCHED',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'CONVERTED_TO_ORDER'
);

CREATE TYPE quotation_approval_status AS ENUM (
  'NONE',
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE discount_type AS ENUM (
  'PERCENTAGE',
  'FIXED_AMOUNT'
);

CREATE TYPE integration_provider AS ENUM (
  'INDIAMART',
  'TRADEINDIA',
  'JUSTDIAL',
  'SULEKHA',
  'EXPORTERSINDIA',
  'META_LEAD_ADS',
  'GOOGLE_LEAD_FORMS',
  'LINKEDIN_GEN',
  'EXOTEL_IVR',
  'OZONETEL',
  'KNOWLARITY',
  'MCUBE',
  'WHATSAPP_CLOUD',
  'WEBHOOK',
  'WEBSITE_FORM',
  'CSV_IMPORT',
  'REST_API'
);

CREATE TYPE integration_sync_status AS ENUM (
  'ACTIVE',
  'PAUSED',
  'ERROR',
  'AUTH_EXPIRED'
);

CREATE TYPE webhook_processing_status AS ENUM (
  'RECEIVED',
  'NORMALIZED',
  'PROCESSED',
  'DUPLICATE_SKIPPED',
  'FAILED',
  'DEAD_LETTER'
);

CREATE TYPE custom_field_data_type AS ENUM (
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DECIMAL',
  'DATE',
  'DATETIME',
  'BOOLEAN',
  'SELECT',
  'MULTI_SELECT',
  'URL'
);

CREATE TYPE automation_trigger AS ENUM (
  'LEAD_CREATED',
  'LEAD_SCORE_CHANGED',
  'LEAD_STATUS_CHANGED',
  'OPPORTUNITY_STAGE_CHANGED',
  'TASK_OVERDUE',
  'INACTIVITY_TIMEOUT',
  'WEBHOOK_RECEIVED'
);

CREATE TYPE automation_action_type AS ENUM (
  'AUTO_ASSIGN_ROUND_ROBIN',
  'SEND_NOTIFICATION',
  'DISPATCH_WHATSAPP',
  'DISPATCH_EMAIL',
  'CREATE_TASK',
  'UPDATE_FIELD',
  'CALL_WEBHOOK',
  'INITIATE_WORKFLOW_APPROVAL'
);

CREATE TYPE round_robin_strategy AS ENUM (
  'ROUND_ROBIN',
  'WEIGHTED_CAPACITY',
  'AVAILABILITY_BASED'
);

CREATE TYPE outbox_status AS ENUM (
  'PENDING',
  'PROCESSED',
  'FAILED'
);

-- =============================================================================
-- TABLE DEFINITIONS (45 Tables)
-- =============================================================================

-- Table: crm_company_setting
CREATE TABLE crm_company_setting (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL UNIQUE,
  default_pipeline_id uuid,
  default_lead_source_id uuid,
  auto_assign_leads boolean DEFAULT true NOT NULL,
  round_robin_strategy round_robin_strategy DEFAULT 'ROUND_ROBIN' NOT NULL,
  quotation_validity_days int DEFAULT 30 NOT NULL,
  require_discount_approval boolean DEFAULT true NOT NULL,
  discount_approval_threshold decimal(5,2) DEFAULT 15.00 NOT NULL,
  enable_deduplication boolean DEFAULT true NOT NULL,
  dedup_match_fields varchar(255) DEFAULT 'PHONE,EMAIL',
  base_currency varchar(3) DEFAULT 'INR' NOT NULL,
  business_hours_start time DEFAULT '09:30:00',
  business_hours_end time DEFAULT '18:30:00',
  working_days varchar(50) DEFAULT 'MON,TUE,WED,THU,FRI,SAT',
  sla_first_response_hours int DEFAULT 4,
  enable_ai_scoring boolean DEFAULT false NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_setting_company UNIQUE (company_id)
);

COMMENT ON TABLE crm_company_setting IS 'Company-specific CRM operational settings, rules, and governance thresholds.';

-- Table: crm_lead_status
CREATE TABLE crm_lead_status (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  status_code varchar(50) NOT NULL,
  status_name varchar(100) NOT NULL,
  status_category lead_status_category DEFAULT 'OPEN' NOT NULL,
  display_order int DEFAULT 0 NOT NULL,
  color_code varchar(20) DEFAULT '#3B82F6',
  is_default boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_lead_status_company_code UNIQUE (company_id, status_code)
);

COMMENT ON TABLE crm_lead_status IS 'Configurable lead statuses representing the qualification and sales lifecycle.';

-- Table: crm_lead_source
CREATE TABLE crm_lead_source (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  source_code varchar(50) NOT NULL,
  source_name varchar(100) NOT NULL,
  source_category varchar(50) DEFAULT 'DIGITAL',
  is_active boolean DEFAULT true NOT NULL,
  is_system boolean DEFAULT false NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_lead_source_company_code UNIQUE (company_id, source_code)
);

COMMENT ON TABLE crm_lead_source IS 'Configurable lead acquisition sources for multi-channel tracking and attribution.';

-- Table: crm_lost_reason
CREATE TABLE crm_lost_reason (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  reason_code varchar(50) NOT NULL,
  reason_label varchar(200) NOT NULL,
  applicable_to varchar(30) DEFAULT 'BOTH' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_lost_reason_company_code UNIQUE (company_id, reason_code)
);

COMMENT ON TABLE crm_lost_reason IS 'Standardized loss reasons for disqualified leads and lost pipeline deals.';

-- Table: crm_tag
CREATE TABLE crm_tag (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  tag_name varchar(50) NOT NULL,
  color_code varchar(20) DEFAULT '#10B981',
  entity_scope varchar(50) DEFAULT 'GLOBAL',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_tag_company_name UNIQUE (company_id, tag_name),
  CONSTRAINT uq_crm_tag_company_id UNIQUE (company_id, id)
);

COMMENT ON TABLE crm_tag IS 'Tenant-scoped labels for cross-cutting classification of CRM entities.';

-- Table: crm_custom_field_definition
CREATE TABLE crm_custom_field_definition (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  entity_name varchar(50) NOT NULL,
  field_key varchar(50) NOT NULL,
  field_label varchar(100) NOT NULL,
  data_type custom_field_data_type DEFAULT 'TEXT' NOT NULL,
  options_json text,
  default_value text,
  is_required boolean DEFAULT false NOT NULL,
  is_searchable boolean DEFAULT false NOT NULL,
  validation_regex varchar(255),
  display_order int DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_cf_def_company_entity_key UNIQUE (company_id, entity_name, field_key)
);

COMMENT ON TABLE crm_custom_field_definition IS 'Schema definition for dynamic tenant-level custom attributes across CRM entities.';

-- Table: crm_custom_field_value
CREATE TABLE crm_custom_field_value (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  custom_field_id uuid NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  value_text text,
  value_number bigint,
  value_decimal decimal(19,4),
  value_date TIMESTAMP WITHOUT TIME ZONE,
  value_json text,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_cf_val_field_entity UNIQUE (custom_field_id, entity_id)
);

COMMENT ON TABLE crm_custom_field_value IS 'EAV attribute value storage for dynamic custom fields.';

-- Table: crm_integration_channel
CREATE TABLE crm_integration_channel (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  provider_code integration_provider NOT NULL UNIQUE,
  provider_name varchar(100) NOT NULL,
  provider_category varchar(50) NOT NULL,
  supports_pull boolean DEFAULT false NOT NULL,
  supports_push boolean DEFAULT true NOT NULL,
  supports_oauth boolean DEFAULT false NOT NULL,
  auth_instructions text,
  documentation_url varchar(500),
  icon_url varchar(500),
  is_active boolean DEFAULT true NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE crm_integration_channel IS 'Master registry of external lead channels supported by the CRM platform.';

-- Table: crm_tenant_integration
CREATE TABLE crm_tenant_integration (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  integration_channel_id uuid NOT NULL,
  connection_name varchar(150) NOT NULL,
  auth_type varchar(30) DEFAULT 'API_KEY' NOT NULL,
  credential_vault_ref varchar(255),
  webhook_secret_hash varchar(255),
  webhook_slug varchar(120) NOT NULL UNIQUE,
  sync_frequency_minutes int DEFAULT 15,
  sync_status integration_sync_status DEFAULT 'ACTIVE' NOT NULL,
  last_sync_at TIMESTAMP WITHOUT TIME ZONE,
  last_error_message text,
  consecutive_failures int DEFAULT 0 NOT NULL,
  settings_json text,
  is_enabled boolean DEFAULT true NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_tint_webhook_slug UNIQUE (webhook_slug)
);

COMMENT ON TABLE crm_tenant_integration IS 'Tenant-specific configuration and credentials for external lead sources.';

-- Table: crm_integration_webhook_log
CREATE TABLE crm_integration_webhook_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  tenant_integration_id uuid,
  provider_code integration_provider NOT NULL,
  external_event_id varchar(255),
  source_ip varchar(64),
  headers_json text,
  raw_payload text NOT NULL,
  idempotency_hash varchar(64) NOT NULL,
  processing_status webhook_processing_status DEFAULT 'RECEIVED' NOT NULL,
  retry_count int DEFAULT 0 NOT NULL,
  max_retries int DEFAULT 3 NOT NULL,
  next_retry_at TIMESTAMP WITHOUT TIME ZONE,
  lead_id uuid,
  error_message text,
  processed_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_crm_webhook_company_idempotency UNIQUE (company_id, idempotency_hash)
);

COMMENT ON TABLE crm_integration_webhook_log IS 'High-volume raw inbound event audit log for integrations with guaranteed idempotency.';

-- Table: crm_lead_import_batch
CREATE TABLE crm_lead_import_batch (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  file_name varchar(255) NOT NULL,
  file_storage_url varchar(500) NOT NULL,
  total_records int DEFAULT 0 NOT NULL,
  imported_count int DEFAULT 0 NOT NULL,
  duplicate_count int DEFAULT 0 NOT NULL,
  failed_count int DEFAULT 0 NOT NULL,
  status varchar(30) DEFAULT 'PENDING' NOT NULL,
  mapping_config_json text NOT NULL,
  error_report_url varchar(500),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE crm_lead_import_batch IS 'Batch tracking for manual CSV/Excel lead imports with column mapping.';

-- Table: crm_lead
CREATE TABLE crm_lead (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  lead_code varchar(50) NOT NULL,
  salutation varchar(20),
  first_name varchar(100) NOT NULL,
  last_name varchar(100),
  display_name varchar(200) NOT NULL,
  email varchar(255),
  normalized_email varchar(255),
  phone varchar(30),
  normalized_phone varchar(20),
  alternate_phone varchar(30),
  website varchar(255),
  organization_name varchar(255),
  designation varchar(100),
  industry varchar(100),
  annual_revenue decimal(19,4),
  company_size varchar(50),
  gstin varchar(15),
  pan varchar(10),
  address_line1 varchar(255),
  address_line2 varchar(255),
  city varchar(100),
  state varchar(100),
  state_code varchar(10),
  postal_code varchar(20),
  country varchar(100) DEFAULT 'India',
  lead_source_id uuid,
  tenant_integration_id uuid,
  external_lead_id varchar(255),
  external_lead_url varchar(500),
  campaign_id uuid,
  utm_source varchar(100),
  utm_medium varchar(100),
  utm_campaign varchar(100),
  utm_content varchar(100),
  utm_term varchar(100),
  raw_inquiry_text text,
  lead_status_id uuid NOT NULL,
  lead_stage lead_stage DEFAULT 'RAW' NOT NULL,
  lead_score int DEFAULT 0 NOT NULL,
  score_grade lead_rating DEFAULT 'COLD',
  is_qualified boolean DEFAULT false NOT NULL,
  qualified_at TIMESTAMP WITHOUT TIME ZONE,
  qualified_by_user_id uuid,
  owner_user_id uuid,
  assigned_team_id uuid,
  assigned_at TIMESTAMP WITHOUT TIME ZONE,
  last_contacted_at TIMESTAMP WITHOUT TIME ZONE,
  next_follow_up_date TIMESTAMP WITHOUT TIME ZONE,
  is_converted boolean DEFAULT false NOT NULL,
  converted_at TIMESTAMP WITHOUT TIME ZONE,
  converted_by_user_id uuid,
  converted_account_id uuid,
  converted_contact_id uuid,
  converted_opportunity_id uuid,
  is_lost boolean DEFAULT false NOT NULL,
  lost_reason_id uuid,
  lost_details text,
  lost_at TIMESTAMP WITHOUT TIME ZONE,
  is_recycled boolean DEFAULT false NOT NULL,
  recycled_at TIMESTAMP WITHOUT TIME ZONE,
  is_duplicate boolean DEFAULT false NOT NULL,
  primary_lead_id uuid,
  dedup_fingerprint varchar(64),
  consent_given boolean DEFAULT false NOT NULL,
  consent_timestamp TIMESTAMP WITHOUT TIME ZONE,
  consent_source varchar(100),
  opt_out_email boolean DEFAULT false NOT NULL,
  opt_out_whatsapp boolean DEFAULT false NOT NULL,
  opt_out_sms boolean DEFAULT false NOT NULL,
  opt_out_call boolean DEFAULT false NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_lead_company_code UNIQUE (company_id, lead_code),
  CONSTRAINT uq_crm_lead_company_id UNIQUE (company_id, id)
);

COMMENT ON TABLE crm_lead IS 'Primary lead table representing prospective business inquiries and lifecycle management.';

-- Table: crm_lead_assignment_history
CREATE TABLE crm_lead_assignment_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  from_user_id uuid,
  to_user_id uuid NOT NULL,
  assigned_by_user_id uuid,
  assignment_method varchar(50) DEFAULT 'MANUAL' NOT NULL,
  reason text,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE crm_lead_assignment_history IS 'Audit log of every ownership transition for accountability and performance tracking.';

-- Table: crm_lead_merge_history
CREATE TABLE crm_lead_merge_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  primary_lead_id uuid NOT NULL,
  merged_lead_id uuid NOT NULL,
  merged_lead_snapshot_json text NOT NULL,
  merged_by_user_id uuid NOT NULL,
  merge_reason text,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE crm_lead_merge_history IS 'Immutable history of merged duplicate leads with data preservation snapshot.';

-- Table: crm_lead_score_log
CREATE TABLE crm_lead_score_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  rule_code varchar(100) NOT NULL,
  score_delta int NOT NULL,
  previous_score int NOT NULL,
  new_score int NOT NULL,
  trigger_event varchar(100) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE crm_lead_score_log IS 'Transparent audit breakdown of points awarded to calculate lead qualification score.';

-- Table: crm_lead_tag_mapping
CREATE TABLE crm_lead_tag_mapping (
  company_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  CONSTRAINT pk_crm_lead_tag_mapping PRIMARY KEY (company_id, lead_id, tag_id)
);

COMMENT ON TABLE crm_lead_tag_mapping IS 'Tenant-isolated many-to-many junction between leads and descriptive tags.';

-- Table: crm_lead_product_interest
CREATE TABLE crm_lead_product_interest (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  product_id uuid,
  product_name varchar(255) NOT NULL,
  product_code varchar(100),
  quantity decimal(19,4) DEFAULT 1.0000,
  uom varchar(50) DEFAULT 'PCS',
  estimated_budget decimal(19,4),
  currency varchar(3) DEFAULT 'INR',
  specifications text,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE crm_lead_product_interest IS 'Products, materials, or services that a prospective lead has inquired about.';

-- Table: crm_account
CREATE TABLE crm_account (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  account_code varchar(50) NOT NULL,
  account_name varchar(255) NOT NULL,
  account_type account_type DEFAULT 'PROSPECT' NOT NULL,
  parent_account_id uuid,
  industry varchar(100),
  business_type business_type DEFAULT 'PVT_LTD',
  tier account_tier DEFAULT 'TIER_2',
  gstin varchar(15),
  pan varchar(10),
  website varchar(255),
  phone varchar(30),
  email varchar(255),
  annual_revenue decimal(19,4),
  employee_count int,
  credit_rating varchar(50),
  owner_user_id uuid,
  billing_address_id uuid,
  shipping_address_id uuid,
  is_active boolean DEFAULT true NOT NULL,
  account_main_customer_id uuid,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_account_company_code UNIQUE (company_id, account_code),
  CONSTRAINT uq_crm_account_company_id UNIQUE (company_id, id)
);

COMMENT ON TABLE crm_account IS 'B2B Client Company Accounts with hierarchy, GSTIN/PAN compliance, and ERP customer linkage.';

-- Table: crm_contact
CREATE TABLE crm_contact (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  account_id uuid,
  contact_code varchar(50) NOT NULL,
  salutation varchar(20),
  first_name varchar(100) NOT NULL,
  last_name varchar(100),
  display_name varchar(200) NOT NULL,
  designation varchar(100),
  department_name varchar(100),
  email varchar(255),
  normalized_email varchar(255),
  phone varchar(30),
  normalized_phone varchar(20),
  mobile varchar(30),
  is_primary_contact boolean DEFAULT false NOT NULL,
  decision_maker_role decision_maker_role DEFAULT 'EVALUATOR',
  linkedin_url varchar(255),
  owner_user_id uuid,
  is_active boolean DEFAULT true NOT NULL,
  consent_given boolean DEFAULT false NOT NULL,
  opt_out_email boolean DEFAULT false NOT NULL,
  opt_out_whatsapp boolean DEFAULT false NOT NULL,
  opt_out_sms boolean DEFAULT false NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_contact_company_code UNIQUE (company_id, contact_code),
  CONSTRAINT uq_crm_contact_company_id UNIQUE (company_id, id)
);

COMMENT ON TABLE crm_contact IS 'Individual persons associated with accounts or independent business relationships.';

-- Table: crm_address
CREATE TABLE crm_address (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  address_type address_type DEFAULT 'BILLING' NOT NULL,
  address_line1 varchar(255) NOT NULL,
  address_line2 varchar(255),
  city varchar(100) NOT NULL,
  state varchar(100) NOT NULL,
  state_code varchar(10) NOT NULL,
  postal_code varchar(20) NOT NULL,
  country varchar(100) DEFAULT 'India' NOT NULL,
  gstin_for_address varchar(15),
  is_default boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE crm_address IS 'Normalized multi-address storage with GST state codes for tax determination.';

-- Table: crm_account_contact_relation
CREATE TABLE crm_account_contact_relation (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  account_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  relationship_title varchar(100),
  is_active boolean DEFAULT true NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_crm_acc_contact_rel UNIQUE (company_id, account_id, contact_id)
);

COMMENT ON TABLE crm_account_contact_relation IS 'Tenant-isolated many-to-many relationship supporting contacts representing multiple accounts.';

-- Table: crm_sales_pipeline
CREATE TABLE crm_sales_pipeline (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  pipeline_code varchar(50) NOT NULL,
  pipeline_name varchar(100) NOT NULL,
  description text,
  is_default boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  display_order int DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_pipeline_company_code UNIQUE (company_id, pipeline_code)
);

COMMENT ON TABLE crm_sales_pipeline IS 'Multiple distinct sales funnels per company (e.g., Domestic, Export, Tender).';

-- Table: crm_pipeline_stage
CREATE TABLE crm_pipeline_stage (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  pipeline_id uuid NOT NULL,
  stage_code varchar(50) NOT NULL,
  stage_name varchar(100) NOT NULL,
  stage_order int DEFAULT 1 NOT NULL,
  stage_category pipeline_stage_category DEFAULT 'PROSPECTING' NOT NULL,
  win_probability_pct int DEFAULT 10 NOT NULL,
  rotting_days int DEFAULT 14,
  sla_days int DEFAULT 7,
  color_code varchar(20) DEFAULT '#6366F1',
  is_active boolean DEFAULT true NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_stage_pipeline_code UNIQUE (pipeline_id, stage_code)
);

COMMENT ON TABLE crm_pipeline_stage IS 'Customizable sequential stages within a sales pipeline with weighted win probabilities.';

-- Table: crm_opportunity
CREATE TABLE crm_opportunity (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  opportunity_code varchar(50) NOT NULL,
  opportunity_name varchar(255) NOT NULL,
  pipeline_id uuid NOT NULL,
  current_stage_id uuid NOT NULL,
  account_id uuid,
  primary_contact_id uuid,
  origin_lead_id uuid,
  deal_value decimal(19,4) DEFAULT 0.0000 NOT NULL,
  currency varchar(3) DEFAULT 'INR' NOT NULL,
  expected_close_date date NOT NULL,
  probability_pct int DEFAULT 10 NOT NULL,
  weighted_value decimal(19,4) DEFAULT 0.0000 NOT NULL,
  owner_user_id uuid NOT NULL,
  assigned_team_id uuid,
  deal_type opportunity_deal_type DEFAULT 'NEW_BUSINESS' NOT NULL,
  deal_status opportunity_deal_status DEFAULT 'OPEN' NOT NULL,
  won_at TIMESTAMP WITHOUT TIME ZONE,
  lost_at TIMESTAMP WITHOUT TIME ZONE,
  lost_reason_id uuid,
  lost_notes text,
  win_notes text,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_opp_company_code UNIQUE (company_id, opportunity_code)
);

COMMENT ON TABLE crm_opportunity IS 'Sales deals / opportunities tracking revenue forecast and pipeline velocity.';

-- Table: crm_opportunity_item
CREATE TABLE crm_opportunity_item (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  opportunity_id uuid NOT NULL,
  product_id uuid,
  product_code varchar(100),
  product_name varchar(255) NOT NULL,
  description text,
  quantity decimal(19,4) DEFAULT 1.0000 NOT NULL,
  uom varchar(50) DEFAULT 'PCS',
  unit_price decimal(19,4) DEFAULT 0.0000 NOT NULL,
  discount_pct decimal(5,2) DEFAULT 0.00,
  discount_amount decimal(19,4) DEFAULT 0.0000,
  tax_pct decimal(5,2) DEFAULT 18.00,
  total_amount decimal(19,4) DEFAULT 0.0000 NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE crm_opportunity_item IS 'Products or services bundled into an opportunity.';

-- Table: crm_opportunity_competitor
CREATE TABLE crm_opportunity_competitor (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  opportunity_id uuid NOT NULL,
  competitor_name varchar(200) NOT NULL,
  strengths text,
  weaknesses text,
  pricing_comparison varchar(50),
  threat_level varchar(30) DEFAULT 'MEDIUM',
  is_winner boolean DEFAULT false NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE crm_opportunity_competitor IS 'Market competitors competing for a specific sales opportunity.';

-- Table: crm_opportunity_stage_history
CREATE TABLE crm_opportunity_stage_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  opportunity_id uuid NOT NULL,
  from_stage_id uuid,
  to_stage_id uuid NOT NULL,
  stage_entry_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  stage_exit_at TIMESTAMP WITHOUT TIME ZONE,
  duration_seconds bigint,
  changed_by_user_id uuid NOT NULL,
  reason_for_change text
);

COMMENT ON TABLE crm_opportunity_stage_history IS 'Historical transition logs measuring velocity, cycle time, and bottleneck stages.';

-- Table: crm_activity
CREATE TABLE crm_activity (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  activity_type varchar(50) NOT NULL,
  subject varchar(255) NOT NULL,
  description text,
  activity_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  performed_by_user_id uuid NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE crm_activity IS 'Unified chronological activity stream and notes across all CRM business objects.';

-- Table: crm_task
CREATE TABLE crm_task (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  task_type task_type DEFAULT 'FOLLOW_UP' NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  priority task_priority DEFAULT 'MEDIUM' NOT NULL,
  status task_status DEFAULT 'PENDING' NOT NULL,
  due_date date NOT NULL,
  due_time time,
  completed_at TIMESTAMP WITHOUT TIME ZONE,
  assigned_to_user_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL,
  reminder_at TIMESTAMP WITHOUT TIME ZONE,
  reminder_sent boolean DEFAULT false NOT NULL,
  is_recurring boolean DEFAULT false NOT NULL,
  recurrence_pattern varchar(50),
  calendar_event_id varchar(255),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE crm_task IS 'Actionable follow-up tasks, calls, demos, and calendar meetings with reminders.';

-- Table: crm_attachment
CREATE TABLE crm_attachment (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  file_name varchar(255) NOT NULL,
  file_type varchar(100),
  file_size_bytes bigint NOT NULL,
  storage_provider varchar(50) DEFAULT 'S3' NOT NULL,
  storage_path_url varchar(1000) NOT NULL,
  mime_type varchar(100) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE crm_attachment IS 'Object-storage metadata references for customer RFPs, quotes, and legal documents.';

-- Table: crm_conversation
CREATE TABLE crm_conversation (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  channel communication_channel DEFAULT 'WHATSAPP' NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  customer_identifier varchar(255) NOT NULL,
  external_thread_id varchar(255),
  subject varchar(255),
  status varchar(30) DEFAULT 'OPEN' NOT NULL,
  assigned_agent_id uuid,
  unread_count int DEFAULT 0 NOT NULL,
  last_message_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE crm_conversation IS 'Unified customer conversation thread across WhatsApp, Email, SMS, and Webchat.';

-- Table: crm_message
CREATE TABLE crm_message (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  direction message_direction NOT NULL,
  channel communication_channel NOT NULL,
  sender_identifier varchar(255) NOT NULL,
  recipient_identifier varchar(255) NOT NULL,
  subject varchar(500),
  body_text text NOT NULL,
  body_html text,
  media_storage_url varchar(1000),
  delivery_status message_delivery_status DEFAULT 'QUEUED' NOT NULL,
  external_message_id varchar(255),
  error_code varchar(100),
  error_message text,
  sent_at TIMESTAMP WITHOUT TIME ZONE,
  delivered_at TIMESTAMP WITHOUT TIME ZONE,
  read_at TIMESTAMP WITHOUT TIME ZONE,
  notification_request_id uuid,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE crm_message IS 'Granular inbound and outbound messages with delivery receipts.';

-- Table: crm_call_log
CREATE TABLE crm_call_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  call_direction message_direction DEFAULT 'OUTBOUND' NOT NULL,
  provider_name varchar(50) DEFAULT 'EXOTEL' NOT NULL,
  telephony_call_id varchar(255),
  caller_number varchar(30) NOT NULL,
  recipient_number varchar(30) NOT NULL,
  agent_user_id uuid,
  call_status call_status DEFAULT 'ANSWERED' NOT NULL,
  start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  end_time TIMESTAMP WITHOUT TIME ZONE,
  duration_seconds int DEFAULT 0 NOT NULL,
  recording_storage_url varchar(1000),
  call_notes text,
  sentiment varchar(30),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE crm_call_log IS 'Cloud telephony call CDRs, duration, and object-storage recording references.';

-- Table: crm_consent_log
CREATE TABLE crm_consent_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  channel communication_channel NOT NULL,
  consent_action varchar(30) NOT NULL,
  consent_source varchar(100) NOT NULL,
  consent_text_snapshot text,
  ip_address varchar(64),
  user_agent varchar(255),
  captured_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE crm_consent_log IS 'DPDP Act 2023 & GDPR compliant immutable audit log of customer communication consents.';

-- Table: crm_campaign
CREATE TABLE crm_campaign (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  campaign_code varchar(50) NOT NULL,
  campaign_name varchar(200) NOT NULL,
  channel communication_channel,
  status varchar(30) DEFAULT 'ACTIVE' NOT NULL,
  start_date date NOT NULL,
  end_date date,
  budget_currency varchar(3) DEFAULT 'INR' NOT NULL,
  allocated_budget decimal(19,4) DEFAULT 0.0000 NOT NULL,
  actual_spend decimal(19,4) DEFAULT 0.0000 NOT NULL,
  target_leads int DEFAULT 0,
  actual_leads_count int DEFAULT 0 NOT NULL,
  actual_conversions_count int DEFAULT 0 NOT NULL,
  actual_revenue_won decimal(19,4) DEFAULT 0.0000 NOT NULL,
  utm_campaign_param varchar(100),
  owner_user_id uuid,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_campaign_company_code UNIQUE (company_id, campaign_code)
);

COMMENT ON TABLE crm_campaign IS 'Marketing campaigns tracking budgets, lead generation volume, and return on investment.';

-- Table: crm_lead_attribution
CREATE TABLE crm_lead_attribution (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  campaign_id uuid,
  touchpoint_type varchar(50) NOT NULL,
  touchpoint_timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  channel communication_channel NOT NULL,
  utm_source varchar(100),
  utm_medium varchar(100),
  utm_campaign varchar(100),
  utm_content varchar(100),
  attribution_weight decimal(5,4) DEFAULT 1.0000 NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE crm_lead_attribution IS 'Multi-touch attribution log mapping marketing spend to pipeline revenue generation.';

-- Table: crm_automation_rule
CREATE TABLE crm_automation_rule (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  rule_name varchar(150) NOT NULL,
  rule_code varchar(100) NOT NULL,
  description text,
  trigger_event automation_trigger NOT NULL,
  entity_type varchar(50) NOT NULL,
  filter_conditions_json text NOT NULL,
  execution_order int DEFAULT 10 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_auto_rule_code UNIQUE (company_id, rule_code)
);

COMMENT ON TABLE crm_automation_rule IS 'Event-driven automation rules triggering actions based on configurable conditions.';

-- Table: crm_automation_action
CREATE TABLE crm_automation_action (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  rule_id uuid NOT NULL,
  action_order int DEFAULT 1 NOT NULL,
  action_type automation_action_type NOT NULL,
  action_payload_json text NOT NULL,
  delay_minutes int DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE crm_automation_action IS 'Ordered action steps (notifications, assignments, webhooks, tasks) executed by a rule.';

-- Table: crm_automation_execution_log
CREATE TABLE crm_automation_execution_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  rule_id uuid NOT NULL,
  action_id uuid,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  status varchar(30) DEFAULT 'SUCCESS' NOT NULL,
  executed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  duration_ms bigint DEFAULT 0 NOT NULL,
  error_message text,
  execution_context_json text
);

COMMENT ON TABLE crm_automation_execution_log IS 'Audit execution logs of automation actions with error diagnostics and latency tracking.';

-- Table: crm_round_robin_pool
CREATE TABLE crm_round_robin_pool (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  pool_name varchar(100) NOT NULL,
  pool_code varchar(50) NOT NULL,
  routing_strategy round_robin_strategy DEFAULT 'ROUND_ROBIN' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_rr_pool_company_code UNIQUE (company_id, pool_code)
);

COMMENT ON TABLE crm_round_robin_pool IS 'Sales rep distribution pool definitions for automated lead assignment.';

-- Table: crm_round_robin_member
CREATE TABLE crm_round_robin_member (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  pool_id uuid NOT NULL,
  user_id uuid NOT NULL,
  weight int DEFAULT 1 NOT NULL,
  max_daily_leads int DEFAULT 50,
  current_leads_today int DEFAULT 0 NOT NULL,
  last_assigned_at TIMESTAMP WITHOUT TIME ZONE,
  is_active boolean DEFAULT true NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_rr_member_pool_user UNIQUE (pool_id, user_id)
);

COMMENT ON TABLE crm_round_robin_member IS 'Sales representatives participating in automated lead distribution with capacity limits.';

-- Table: crm_quotation
CREATE TABLE crm_quotation (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  quotation_number varchar(50) NOT NULL,
  quotation_date date NOT NULL,
  valid_until date NOT NULL,
  opportunity_id uuid,
  account_id uuid NOT NULL,
  contact_id uuid,
  revision_number int DEFAULT 1 NOT NULL,
  parent_quotation_id uuid,
  currency varchar(3) DEFAULT 'INR' NOT NULL,
  exchange_rate decimal(19,6) DEFAULT 1.000000 NOT NULL,
  subtotal decimal(19,4) DEFAULT 0.0000 NOT NULL,
  discount_type discount_type DEFAULT 'PERCENTAGE' NOT NULL,
  discount_pct decimal(5,2) DEFAULT 0.00 NOT NULL,
  discount_amount decimal(19,4) DEFAULT 0.0000 NOT NULL,
  tax_amount decimal(19,4) DEFAULT 0.0000 NOT NULL,
  freight_charges decimal(19,4) DEFAULT 0.0000,
  other_charges decimal(19,4) DEFAULT 0.0000,
  round_off decimal(19,4) DEFAULT 0.0000,
  total_amount decimal(19,4) DEFAULT 0.0000 NOT NULL,
  place_of_supply_state_code varchar(10) NOT NULL,
  billing_address_id uuid,
  shipping_address_id uuid,
  payment_terms text,
  delivery_terms text,
  warranty_terms text,
  terms_and_conditions text,
  internal_notes text,
  customer_notes text,
  status quotation_status DEFAULT 'DRAFT' NOT NULL,
  owner_user_id uuid NOT NULL,
  workflow_transaction_id uuid,
  approval_status quotation_approval_status DEFAULT 'NONE' NOT NULL,
  discount_approval_required boolean DEFAULT false NOT NULL,
  approved_by_user_id uuid,
  approved_at TIMESTAMP WITHOUT TIME ZONE,
  account_main_quotation_id uuid,
  account_main_sales_order_id uuid,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT uq_crm_quote_comp_num_rev UNIQUE (company_id, quotation_number, revision_number)
);

COMMENT ON TABLE crm_quotation IS 'Commercial sales quotations with Indian GST compliance, revisions, and Workflow Service approvals.';

-- Table: crm_quotation_item
CREATE TABLE crm_quotation_item (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  quotation_id uuid NOT NULL,
  item_order int DEFAULT 1 NOT NULL,
  product_id uuid,
  product_code varchar(100),
  product_name varchar(255) NOT NULL,
  hsn_sac_code varchar(20) NOT NULL,
  description text,
  quantity decimal(19,4) DEFAULT 1.0000 NOT NULL,
  uom varchar(50) DEFAULT 'PCS' NOT NULL,
  unit_price decimal(19,4) DEFAULT 0.0000 NOT NULL,
  discount_pct decimal(5,2) DEFAULT 0.00 NOT NULL,
  discount_amount decimal(19,4) DEFAULT 0.0000 NOT NULL,
  taxable_amount decimal(19,4) DEFAULT 0.0000 NOT NULL,
  cgst_rate decimal(5,2) DEFAULT 0.00,
  cgst_amount decimal(19,4) DEFAULT 0.0000,
  sgst_rate decimal(5,2) DEFAULT 0.00,
  sgst_amount decimal(19,4) DEFAULT 0.0000,
  igst_rate decimal(5,2) DEFAULT 0.00,
  igst_amount decimal(19,4) DEFAULT 0.0000,
  cess_rate decimal(5,2) DEFAULT 0.00,
  cess_amount decimal(19,4) DEFAULT 0.0000,
  total_amount decimal(19,4) DEFAULT 0.0000 NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by uuid,
  created_by_username varchar(255),
  updated_by uuid,
  updated_by_username varchar(255),
  is_deleted boolean DEFAULT false NOT NULL,
  deleted_by uuid,
  deleted_by_username varchar(255),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE crm_quotation_item IS 'Line items within quotation with statutory HSN/SAC codes and GST breakdown.';

-- Table: crm_quotation_revision
CREATE TABLE crm_quotation_revision (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  quotation_id uuid NOT NULL,
  revision_number int NOT NULL,
  revision_notes text,
  snapshot_json text NOT NULL,
  revised_by_user_id uuid NOT NULL,
  revised_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_crm_quote_rev_quote_num UNIQUE (quotation_id, revision_number)
);

COMMENT ON TABLE crm_quotation_revision IS 'Immutable historical audit revisions of quotations throughout price negotiations.';

-- Table: crm_outbox
CREATE TABLE crm_outbox (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL,
  aggregate_type varchar(100) NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type varchar(100) NOT NULL,
  idempotency_key varchar(255) NOT NULL,
  payload text NOT NULL,
  status outbox_status DEFAULT 'PENDING' NOT NULL,
  retry_count int DEFAULT 0 NOT NULL,
  next_attempt_at TIMESTAMP WITHOUT TIME ZONE,
  last_error text,
  processed_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_crm_outbox_company_idempotency UNIQUE (company_id, idempotency_key)
);

COMMENT ON TABLE crm_outbox IS 'Guaranteed at-least-once asynchronous event publishing to RabbitMQ broker.';

-- =============================================================================
-- SECONDARY INDEX DEFINITIONS
-- =============================================================================

CREATE INDEX idx_crm_lead_status_company_order ON crm_lead_status (company_id, is_active, display_order);
CREATE INDEX idx_crm_lead_source_company_active ON crm_lead_source (company_id, is_active);
CREATE INDEX idx_crm_cf_def_company_entity ON crm_custom_field_definition (company_id, entity_name, is_active);
CREATE INDEX idx_crm_cf_val_company_entity ON crm_custom_field_value (company_id, entity_type, entity_id);
CREATE INDEX idx_crm_tint_company_channel ON crm_tenant_integration (company_id, integration_channel_id);
CREATE INDEX idx_crm_tint_status_enabled ON crm_tenant_integration (sync_status, is_enabled);
CREATE INDEX idx_crm_webhook_status_retry ON crm_integration_webhook_log (processing_status, next_retry_at);
CREATE INDEX idx_crm_webhook_company_created ON crm_integration_webhook_log (company_id, created_at);
CREATE INDEX idx_crm_webhook_lead ON crm_integration_webhook_log (lead_id);
CREATE INDEX idx_crm_import_company_created ON crm_lead_import_batch (company_id, created_at);
CREATE INDEX idx_crm_lead_company_phone ON crm_lead (company_id, normalized_phone);
CREATE INDEX idx_crm_lead_company_email ON crm_lead (company_id, normalized_email);
CREATE INDEX idx_crm_lead_external_id ON crm_lead (company_id, external_lead_id);
CREATE INDEX idx_crm_lead_owner_converted ON crm_lead (company_id, owner_user_id, is_converted);
CREATE INDEX idx_crm_lead_status ON crm_lead (company_id, lead_status_id);
CREATE INDEX idx_crm_lead_score ON crm_lead (company_id, lead_score);
CREATE INDEX idx_crm_lead_followup ON crm_lead (company_id, next_follow_up_date);
CREATE INDEX idx_crm_lead_created ON crm_lead (company_id, created_at);
CREATE INDEX idx_crm_lead_assign_lead ON crm_lead_assignment_history (lead_id);
CREATE INDEX idx_crm_lead_assign_user ON crm_lead_assignment_history (company_id, to_user_id);
CREATE INDEX idx_crm_lead_merge_primary ON crm_lead_merge_history (primary_lead_id);
CREATE INDEX idx_crm_lead_merge_merged ON crm_lead_merge_history (merged_lead_id);
CREATE INDEX idx_crm_lead_score_lead ON crm_lead_score_log (lead_id);
CREATE INDEX idx_crm_lead_tag_company_tag ON crm_lead_tag_mapping (company_id, tag_id);
CREATE INDEX idx_crm_lead_prod_lead ON crm_lead_product_interest (lead_id);
CREATE INDEX idx_crm_lead_prod_company_product ON crm_lead_product_interest (company_id, product_id);
CREATE INDEX idx_crm_account_gstin ON crm_account (company_id, gstin);
CREATE INDEX idx_crm_account_pan ON crm_account (company_id, pan);
CREATE INDEX idx_crm_account_owner ON crm_account (company_id, owner_user_id);
CREATE INDEX idx_crm_account_customer_ref ON crm_account (account_main_customer_id);
CREATE INDEX idx_crm_contact_account ON crm_contact (company_id, account_id);
CREATE INDEX idx_crm_contact_phone ON crm_contact (company_id, normalized_phone);
CREATE INDEX idx_crm_contact_email ON crm_contact (company_id, normalized_email);
CREATE INDEX idx_crm_address_entity ON crm_address (company_id, entity_type, entity_id);
CREATE INDEX idx_crm_address_state_code ON crm_address (company_id, state_code);
CREATE INDEX idx_crm_acc_contact_rel_contact ON crm_account_contact_relation (company_id, contact_id);
CREATE INDEX idx_crm_pipeline_active ON crm_sales_pipeline (company_id, is_active);
CREATE INDEX idx_crm_stage_pipeline_order ON crm_pipeline_stage (pipeline_id, stage_order);
CREATE INDEX idx_crm_opp_pipeline_stage ON crm_opportunity (company_id, pipeline_id, current_stage_id);
CREATE INDEX idx_crm_opp_owner_status ON crm_opportunity (company_id, owner_user_id, deal_status);
CREATE INDEX idx_crm_opp_close_date ON crm_opportunity (company_id, expected_close_date);
CREATE INDEX idx_crm_opp_account ON crm_opportunity (company_id, account_id);
CREATE INDEX idx_crm_opp_item_opp ON crm_opportunity_item (opportunity_id);
CREATE INDEX idx_crm_opp_item_product ON crm_opportunity_item (company_id, product_id);
CREATE INDEX idx_crm_opp_comp_opp ON crm_opportunity_competitor (opportunity_id);
CREATE INDEX idx_crm_opp_hist_opp ON crm_opportunity_stage_history (opportunity_id);
CREATE INDEX idx_crm_opp_hist_stage ON crm_opportunity_stage_history (company_id, to_stage_id);
CREATE INDEX idx_crm_activity_timeline ON crm_activity (company_id, entity_type, entity_id, activity_at);
CREATE INDEX idx_crm_activity_user ON crm_activity (company_id, performed_by_user_id);
CREATE INDEX idx_crm_task_user_status_due ON crm_task (company_id, assigned_to_user_id, status, due_date);
CREATE INDEX idx_crm_task_entity ON crm_task (company_id, entity_type, entity_id);
CREATE INDEX idx_crm_task_reminder ON crm_task (status, reminder_at, reminder_sent);
CREATE INDEX idx_crm_attach_entity ON crm_attachment (company_id, entity_type, entity_id);
CREATE INDEX idx_crm_conv_company_channel_id ON crm_conversation (company_id, channel, customer_identifier);
CREATE INDEX idx_crm_conv_entity ON crm_conversation (company_id, entity_type, entity_id);
CREATE INDEX idx_crm_conv_agent_status ON crm_conversation (company_id, assigned_agent_id, status);
CREATE INDEX idx_crm_conv_last_msg ON crm_conversation (company_id, last_message_at);
CREATE INDEX idx_crm_msg_conv ON crm_message (conversation_id);
CREATE INDEX idx_crm_msg_ext_id ON crm_message (company_id, external_message_id);
CREATE INDEX idx_crm_msg_delivery_status ON crm_message (delivery_status, created_at);
CREATE INDEX idx_crm_msg_notif_req ON crm_message (notification_request_id);
CREATE INDEX idx_crm_call_entity ON crm_call_log (company_id, entity_type, entity_id);
CREATE INDEX idx_crm_call_agent_time ON crm_call_log (company_id, agent_user_id, start_time);
CREATE INDEX idx_crm_call_telephony_id ON crm_call_log (company_id, telephony_call_id);
CREATE INDEX idx_crm_consent_entity ON crm_consent_log (company_id, entity_type, entity_id);
CREATE INDEX idx_crm_consent_channel ON crm_consent_log (company_id, channel, consent_action);
CREATE INDEX idx_crm_campaign_utm ON crm_campaign (company_id, utm_campaign_param);
CREATE INDEX idx_crm_campaign_status ON crm_campaign (company_id, status);
CREATE INDEX idx_crm_attrib_lead ON crm_lead_attribution (lead_id);
CREATE INDEX idx_crm_attrib_campaign ON crm_lead_attribution (company_id, campaign_id);
CREATE INDEX idx_crm_auto_rule_eval ON crm_automation_rule (company_id, trigger_event, is_active, execution_order);
CREATE INDEX idx_crm_auto_action_rule ON crm_automation_action (rule_id);
CREATE INDEX idx_crm_auto_log_company_time ON crm_automation_execution_log (company_id, executed_at);
CREATE INDEX idx_crm_auto_log_rule_status ON crm_automation_execution_log (rule_id, status);
CREATE INDEX idx_crm_auto_log_entity ON crm_automation_execution_log (entity_type, entity_id);
CREATE INDEX idx_crm_rr_member_rotation ON crm_round_robin_member (pool_id, is_active, last_assigned_at);
CREATE INDEX idx_crm_quote_opp ON crm_quotation (company_id, opportunity_id);
CREATE INDEX idx_crm_quote_account ON crm_quotation (company_id, account_id);
CREATE INDEX idx_crm_quote_status ON crm_quotation (company_id, status);
CREATE INDEX idx_crm_quote_workflow_txn ON crm_quotation (workflow_transaction_id);
CREATE INDEX idx_crm_quote_so_ref ON crm_quotation (account_main_sales_order_id);
CREATE INDEX idx_crm_quote_item_quote ON crm_quotation_item (quotation_id);
CREATE INDEX idx_crm_quote_item_product ON crm_quotation_item (company_id, product_id);
CREATE INDEX idx_crm_outbox_status_attempt ON crm_outbox (status, next_attempt_at);
CREATE INDEX idx_crm_outbox_aggregate ON crm_outbox (company_id, aggregate_type, aggregate_id);

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS (52 References)
-- =============================================================================

ALTER TABLE crm_custom_field_value
  ADD CONSTRAINT fk_crm_custom_field_value_custom_field_id_1
  FOREIGN KEY (custom_field_id)
  REFERENCES crm_custom_field_definition (id)
  ON DELETE CASCADE;

ALTER TABLE crm_tenant_integration
  ADD CONSTRAINT fk_crm_tenant_integration_integration_channel_id_2
  FOREIGN KEY (integration_channel_id)
  REFERENCES crm_integration_channel (id)
;

ALTER TABLE crm_integration_webhook_log
  ADD CONSTRAINT fk_crm_integration_webhook_log_tenant_integration_id_3
  FOREIGN KEY (tenant_integration_id)
  REFERENCES crm_tenant_integration (id)
  ON DELETE SET NULL;

ALTER TABLE crm_lead
  ADD CONSTRAINT fk_crm_lead_lead_source_id_4
  FOREIGN KEY (lead_source_id)
  REFERENCES crm_lead_source (id)
;

ALTER TABLE crm_lead
  ADD CONSTRAINT fk_crm_lead_tenant_integration_id_5
  FOREIGN KEY (tenant_integration_id)
  REFERENCES crm_tenant_integration (id)
  ON DELETE SET NULL;

ALTER TABLE crm_lead
  ADD CONSTRAINT fk_crm_lead_campaign_id_6
  FOREIGN KEY (campaign_id)
  REFERENCES crm_campaign (id)
  ON DELETE SET NULL;

ALTER TABLE crm_lead
  ADD CONSTRAINT fk_crm_lead_lead_status_id_7
  FOREIGN KEY (lead_status_id)
  REFERENCES crm_lead_status (id)
;

ALTER TABLE crm_lead
  ADD CONSTRAINT fk_crm_lead_lost_reason_id_8
  FOREIGN KEY (lost_reason_id)
  REFERENCES crm_lost_reason (id)
;

ALTER TABLE crm_lead
  ADD CONSTRAINT fk_crm_lead_primary_lead_id_9
  FOREIGN KEY (primary_lead_id)
  REFERENCES crm_lead (id)
;

ALTER TABLE crm_lead
  ADD CONSTRAINT fk_crm_lead_converted_account_id_10
  FOREIGN KEY (converted_account_id)
  REFERENCES crm_account (id)
;

ALTER TABLE crm_lead
  ADD CONSTRAINT fk_crm_lead_converted_contact_id_11
  FOREIGN KEY (converted_contact_id)
  REFERENCES crm_contact (id)
;

ALTER TABLE crm_lead
  ADD CONSTRAINT fk_crm_lead_converted_opportunity_id_12
  FOREIGN KEY (converted_opportunity_id)
  REFERENCES crm_opportunity (id)
;

ALTER TABLE crm_lead_assignment_history
  ADD CONSTRAINT fk_crm_lead_assignment_history_lead_id_13
  FOREIGN KEY (lead_id)
  REFERENCES crm_lead (id)
  ON DELETE CASCADE;

ALTER TABLE crm_lead_merge_history
  ADD CONSTRAINT fk_crm_lead_merge_history_primary_lead_id_14
  FOREIGN KEY (primary_lead_id)
  REFERENCES crm_lead (id)
;

ALTER TABLE crm_lead_merge_history
  ADD CONSTRAINT fk_crm_lead_merge_history_merged_lead_id_15
  FOREIGN KEY (merged_lead_id)
  REFERENCES crm_lead (id)
;

ALTER TABLE crm_lead_score_log
  ADD CONSTRAINT fk_crm_lead_score_log_lead_id_16
  FOREIGN KEY (lead_id)
  REFERENCES crm_lead (id)
  ON DELETE CASCADE;

ALTER TABLE crm_lead_tag_mapping
  ADD CONSTRAINT fk_crm_lead_tag_mapping_company_id_lead_id_17
  FOREIGN KEY (company_id, lead_id)
  REFERENCES crm_lead (company_id, id)
  ON DELETE CASCADE;

ALTER TABLE crm_lead_tag_mapping
  ADD CONSTRAINT fk_crm_lead_tag_mapping_company_id_tag_id_18
  FOREIGN KEY (company_id, tag_id)
  REFERENCES crm_tag (company_id, id)
  ON DELETE CASCADE;

ALTER TABLE crm_lead_product_interest
  ADD CONSTRAINT fk_crm_lead_product_interest_lead_id_19
  FOREIGN KEY (lead_id)
  REFERENCES crm_lead (id)
  ON DELETE CASCADE;

ALTER TABLE crm_account
  ADD CONSTRAINT fk_crm_account_parent_account_id_20
  FOREIGN KEY (parent_account_id)
  REFERENCES crm_account (id)
;

ALTER TABLE crm_account
  ADD CONSTRAINT fk_crm_account_billing_address_id_21
  FOREIGN KEY (billing_address_id)
  REFERENCES crm_address (id)
  ON DELETE SET NULL;

ALTER TABLE crm_account
  ADD CONSTRAINT fk_crm_account_shipping_address_id_22
  FOREIGN KEY (shipping_address_id)
  REFERENCES crm_address (id)
  ON DELETE SET NULL;

ALTER TABLE crm_contact
  ADD CONSTRAINT fk_crm_contact_account_id_23
  FOREIGN KEY (account_id)
  REFERENCES crm_account (id)
  ON DELETE SET NULL;

ALTER TABLE crm_account_contact_relation
  ADD CONSTRAINT fk_crm_account_contact_relation_company_id_account_id_24
  FOREIGN KEY (company_id, account_id)
  REFERENCES crm_account (company_id, id)
  ON DELETE CASCADE;

ALTER TABLE crm_account_contact_relation
  ADD CONSTRAINT fk_crm_account_contact_relation_company_id_contact_id_25
  FOREIGN KEY (company_id, contact_id)
  REFERENCES crm_contact (company_id, id)
  ON DELETE CASCADE;

ALTER TABLE crm_pipeline_stage
  ADD CONSTRAINT fk_crm_pipeline_stage_pipeline_id_26
  FOREIGN KEY (pipeline_id)
  REFERENCES crm_sales_pipeline (id)
  ON DELETE CASCADE;

ALTER TABLE crm_opportunity
  ADD CONSTRAINT fk_crm_opportunity_pipeline_id_27
  FOREIGN KEY (pipeline_id)
  REFERENCES crm_sales_pipeline (id)
;

ALTER TABLE crm_opportunity
  ADD CONSTRAINT fk_crm_opportunity_current_stage_id_28
  FOREIGN KEY (current_stage_id)
  REFERENCES crm_pipeline_stage (id)
;

ALTER TABLE crm_opportunity
  ADD CONSTRAINT fk_crm_opportunity_account_id_29
  FOREIGN KEY (account_id)
  REFERENCES crm_account (id)
;

ALTER TABLE crm_opportunity
  ADD CONSTRAINT fk_crm_opportunity_primary_contact_id_30
  FOREIGN KEY (primary_contact_id)
  REFERENCES crm_contact (id)
;

ALTER TABLE crm_opportunity
  ADD CONSTRAINT fk_crm_opportunity_origin_lead_id_31
  FOREIGN KEY (origin_lead_id)
  REFERENCES crm_lead (id)
;

ALTER TABLE crm_opportunity
  ADD CONSTRAINT fk_crm_opportunity_lost_reason_id_32
  FOREIGN KEY (lost_reason_id)
  REFERENCES crm_lost_reason (id)
;

ALTER TABLE crm_opportunity_item
  ADD CONSTRAINT fk_crm_opportunity_item_opportunity_id_33
  FOREIGN KEY (opportunity_id)
  REFERENCES crm_opportunity (id)
  ON DELETE CASCADE;

ALTER TABLE crm_opportunity_competitor
  ADD CONSTRAINT fk_crm_opportunity_competitor_opportunity_id_34
  FOREIGN KEY (opportunity_id)
  REFERENCES crm_opportunity (id)
  ON DELETE CASCADE;

ALTER TABLE crm_opportunity_stage_history
  ADD CONSTRAINT fk_crm_opportunity_stage_history_opportunity_id_35
  FOREIGN KEY (opportunity_id)
  REFERENCES crm_opportunity (id)
  ON DELETE CASCADE;

ALTER TABLE crm_opportunity_stage_history
  ADD CONSTRAINT fk_crm_opportunity_stage_history_from_stage_id_36
  FOREIGN KEY (from_stage_id)
  REFERENCES crm_pipeline_stage (id)
;

ALTER TABLE crm_opportunity_stage_history
  ADD CONSTRAINT fk_crm_opportunity_stage_history_to_stage_id_37
  FOREIGN KEY (to_stage_id)
  REFERENCES crm_pipeline_stage (id)
;

ALTER TABLE crm_message
  ADD CONSTRAINT fk_crm_message_conversation_id_38
  FOREIGN KEY (conversation_id)
  REFERENCES crm_conversation (id)
  ON DELETE CASCADE;

ALTER TABLE crm_lead_attribution
  ADD CONSTRAINT fk_crm_lead_attribution_lead_id_39
  FOREIGN KEY (lead_id)
  REFERENCES crm_lead (id)
  ON DELETE CASCADE;

ALTER TABLE crm_lead_attribution
  ADD CONSTRAINT fk_crm_lead_attribution_campaign_id_40
  FOREIGN KEY (campaign_id)
  REFERENCES crm_campaign (id)
  ON DELETE SET NULL;

ALTER TABLE crm_automation_action
  ADD CONSTRAINT fk_crm_automation_action_rule_id_41
  FOREIGN KEY (rule_id)
  REFERENCES crm_automation_rule (id)
  ON DELETE CASCADE;

ALTER TABLE crm_automation_execution_log
  ADD CONSTRAINT fk_crm_automation_execution_log_rule_id_42
  FOREIGN KEY (rule_id)
  REFERENCES crm_automation_rule (id)
  ON DELETE CASCADE;

ALTER TABLE crm_automation_execution_log
  ADD CONSTRAINT fk_crm_automation_execution_log_action_id_43
  FOREIGN KEY (action_id)
  REFERENCES crm_automation_action (id)
  ON DELETE SET NULL;

ALTER TABLE crm_round_robin_member
  ADD CONSTRAINT fk_crm_round_robin_member_pool_id_44
  FOREIGN KEY (pool_id)
  REFERENCES crm_round_robin_pool (id)
  ON DELETE CASCADE;

ALTER TABLE crm_quotation
  ADD CONSTRAINT fk_crm_quotation_opportunity_id_45
  FOREIGN KEY (opportunity_id)
  REFERENCES crm_opportunity (id)
  ON DELETE SET NULL;

ALTER TABLE crm_quotation
  ADD CONSTRAINT fk_crm_quotation_account_id_46
  FOREIGN KEY (account_id)
  REFERENCES crm_account (id)
;

ALTER TABLE crm_quotation
  ADD CONSTRAINT fk_crm_quotation_contact_id_47
  FOREIGN KEY (contact_id)
  REFERENCES crm_contact (id)
;

ALTER TABLE crm_quotation
  ADD CONSTRAINT fk_crm_quotation_parent_quotation_id_48
  FOREIGN KEY (parent_quotation_id)
  REFERENCES crm_quotation (id)
;

ALTER TABLE crm_quotation
  ADD CONSTRAINT fk_crm_quotation_billing_address_id_49
  FOREIGN KEY (billing_address_id)
  REFERENCES crm_address (id)
  ON DELETE SET NULL;

ALTER TABLE crm_quotation
  ADD CONSTRAINT fk_crm_quotation_shipping_address_id_50
  FOREIGN KEY (shipping_address_id)
  REFERENCES crm_address (id)
  ON DELETE SET NULL;

ALTER TABLE crm_quotation_item
  ADD CONSTRAINT fk_crm_quotation_item_quotation_id_51
  FOREIGN KEY (quotation_id)
  REFERENCES crm_quotation (id)
  ON DELETE CASCADE;

ALTER TABLE crm_quotation_revision
  ADD CONSTRAINT fk_crm_quotation_revision_quotation_id_52
  FOREIGN KEY (quotation_id)
  REFERENCES crm_quotation (id)
  ON DELETE CASCADE;

