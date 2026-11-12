# Mark2 Cloud ERP: CRM Database Entity Catalog & Data Dictionary

**Document Version:** 1.0.0  
**Database:** PostgreSQL 15+ (`crm_db`)  
**Owning Microservice:** `crm-service`  
**Total Tables:** 45  
**Auditing Superclass:** `BaseEntity` (all tenant tables)  

---

## Overview

This catalog provides an exhaustive reference for every table in the CRM database schema. Each entry details the business purpose, critical columns, internal and external relationships, tenant scope, and architectural rationale.

---

## Domain 1: Configuration & Master Data (`CRM_Configuration`)

### 1. `crm_company_setting`
* **Purpose:** Stores tenant-wide configuration parameters, operational defaults, and business rules governing the CRM behavior for a specific company.
* **Important Columns:**
  * `company_id` (UUID): Tenant identifier referencing `sso.company.id`.
  * `default_pipeline_id` (UUID): Default sales pipeline used when creating new opportunities.
  * `default_lead_source_id` (UUID): Fallback lead source when unspecified.
  * `auto_assign_leads` (BOOLEAN): Master toggle for automated round-robin lead routing.
  * `require_discount_approval` (BOOLEAN): Master toggle requiring Workflow Service approval for quotes exceeding discount thresholds.
  * `discount_approval_threshold` (DECIMAL): Discount percentage (e.g. 15.00%) that triggers approval.
  * `enable_deduplication` (BOOLEAN): Toggle for automatic phone/email deduplication.
  * `business_hours_start` / `business_hours_end` (TIME): Operating hours for SLA and round-robin assignment calculations.
* **Relationships:**
  * Logical FK to `sso.company.id`.
  * Logical FK to `crm_sales_pipeline.id` and `crm_lead_source.id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped to single tenant (`UNIQUE(company_id)`).
* **Why Needed:** Eliminates hardcoded business rules, allowing each tenant company in the multi-tenant ERP to configure custom discount gates, SLA thresholds, working hours, and assignment algorithms.

---

### 2. `crm_lead_status`
* **Purpose:** Represents the configurable lifecycle statuses through which a sales lead progresses (e.g., NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST, UNQUALIFIED, RECYCLED).
* **Important Columns:**
  * `status_code` (VARCHAR): Machine-readable immutable key (e.g., `QUALIFIED`).
  * `status_name` (VARCHAR): Human-readable display label.
  * `status_category` (ENUM): High-level bucket (`OPEN`, `QUALIFIED`, `CONVERTED`, `UNQUALIFIED`, `RECYCLED`) for standardized executive dashboard aggregation.
  * `color_code` (VARCHAR): UI badge hexadecimal color.
  * `display_order` (INT): Horizontal sorting index in UI kanban boards.
* **Relationships:**
  * Referenced by `crm_lead.lead_status_id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, status_code)`).
* **Why Needed:** Different industries require unique lead qualification lifecycles (e.g., manufacturing vs. real estate vs. professional services).

---

### 3. `crm_lead_source`
* **Purpose:** Master catalog of acquisition channels and marketing origins through which prospective customers enter the CRM.
* **Important Columns:**
  * `source_code` (VARCHAR): Canonical identifier matching integrations or custom sources (e.g., `INDIAMART`, `META_ADS`, `TRADE_SHOW`).
  * `source_category` (VARCHAR): Channel grouping (`INBOUND`, `OUTBOUND`, `B2B_MARKETPLACE`, `DIGITAL_ADS`, `REFERRAL`, `OFFLINE`).
  * `is_system` (BOOLEAN): Flag protecting built-in system sources from deletion.
* **Relationships:**
  * Referenced by `crm_lead.lead_source_id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, source_code)`).
* **Why Needed:** Critical for marketing attribution, customer acquisition cost (CAC) reporting, and channel ROI analysis.

---

### 4. `crm_lost_reason`
* **Purpose:** Standardized repository of explanations for why a lead was disqualified or an opportunity was lost to competition.
* **Important Columns:**
  * `reason_code` (VARCHAR): Code (e.g., `PRICE_TOO_HIGH`, `COMPETITOR_CHOSEN`, `FEATURE_GAP`, `BUDGET_CANCELLED`).
  * `reason_label` (VARCHAR): Human explanation text displayed in dropdowns.
  * `applicable_to` (VARCHAR): Context flag (`LEAD`, `OPPORTUNITY`, `BOTH`).
* **Relationships:**
  * Referenced by `crm_lead.lost_reason_id` and `crm_opportunity.lost_reason_id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, reason_code)`).
* **Why Needed:** Enables structured lost-opportunity analytics, product gap identification, and win-loss ratio reporting.

---

### 5. `crm_tag`
* **Purpose:** Lightweight, user-defined categorization labels that can be attached across leads, accounts, contacts, and opportunities.
* **Important Columns:**
  * `tag_name` (VARCHAR): Label (e.g., `VIP`, `High Potential`, `Govt Tender`, `Exhibition 2026`).
  * `color_code` (VARCHAR): Hexadecimal badge color.
  * `entity_scope` (VARCHAR): Target entity scope (`GLOBAL`, `LEAD`, `ACCOUNT`, `DEAL`).
* **Relationships:**
  * Linked to leads via `crm_lead_tag_mapping`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, tag_name)`).
* **Why Needed:** Provides agile, ad-hoc tagging without altering database schemas or custom field definitions.

---

### 6. `crm_custom_field_definition`
* **Purpose:** Schema definitions for dynamic, tenant-specific custom fields on core CRM entities (Lead, Account, Contact, Opportunity, Quotation).
* **Important Columns:**
  * `entity_name` (VARCHAR): Target object (`LEAD`, `ACCOUNT`, `CONTACT`, `OPPORTUNITY`, `QUOTATION`).
  * `field_key` (VARCHAR): Snake_case attribute identifier (e.g., `fabric_requirement_meters`, `project_capacity_kw`).
  * `data_type` (ENUM): Data type (`TEXT`, `NUMBER`, `DECIMAL`, `DATE`, `DATETIME`, `BOOLEAN`, `SELECT`, `MULTI_SELECT`, `URL`).
  * `options_json` (TEXT): JSON array of permissible options for `SELECT` and `MULTI_SELECT` types.
  * `is_required` / `is_searchable` (BOOLEAN): Validation flags.
* **Relationships:**
  * Parent to `crm_custom_field_value`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, entity_name, field_key)`).
* **Why Needed:** Allows manufacturing, healthcare, EPC, and trading enterprises to record specialized business attributes without code modifications.

---

### 7. `crm_custom_field_value`
* **Purpose:** Stores the actual data values for dynamic custom fields using a typed Entity-Attribute-Value (EAV) structure.
* **Important Columns:**
  * `custom_field_id` (UUID): FK to `crm_custom_field_definition.id`.
  * `entity_type` (VARCHAR): Object type.
  * `entity_id` (UUID): Primary key of the specific entity instance.
  * `value_text`, `value_number`, `value_decimal`, `value_date`, `value_json`: Dedicated typed columns preventing type corruption.
* **Relationships:**
  * FK to `crm_custom_field_definition.id` (ON DELETE CASCADE).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company with composite index `(company_id, entity_type, entity_id)`.
* **Why Needed:** Efficient, queryable storage of custom attributes with type safety, avoiding unbounded JSONB bloat in core transaction tables.

---

## Domain 2: Lead Acquisition & Integrations (`CRM_Lead_Integrations`)

### 8. `crm_integration_channel`
* **Purpose:** System-wide catalog of all supported lead generation connectors, ad networks, cloud telephony systems, and communication gateways.
* **Important Columns:**
  * `provider_code` (ENUM): Canonical provider code (e.g., `INDIAMART`, `TRADEINDIA`, `JUSTDIAL`, `META_LEAD_ADS`, `GOOGLE_LEAD_FORMS`, `EXOTEL_IVR`).
  * `supports_push` / `supports_pull` (BOOLEAN): Ingestion capabilities.
  * `supports_oauth` (BOOLEAN): Authentication mechanism.
* **Relationships:**
  * Referenced by `crm_tenant_integration.integration_channel_id`.
* **Owning Service / Tenant Scope:** `crm-service` / Global system catalog.
* **Why Needed:** Establishes a standardized capability matrix for external connector handlers.

---

### 9. `crm_tenant_integration`
* **Purpose:** Stores a company's specific account connection, credentials reference, webhook slug, and polling parameters for an integration channel.
* **Important Columns:**
  * `company_id` (UUID): Tenant identifier.
  * `integration_channel_id` (UUID): FK to `crm_integration_channel`.
  * `credential_vault_ref` (VARCHAR): Secure reference ID in AWS Secrets Manager / HashiCorp Vault / encrypted database vault. **Never stores plaintext secrets.**
  * `webhook_slug` (VARCHAR): Unique URL path component (e.g. `/api/crm/integrations/webhook/im-98a7c2`) for routing incoming push webhooks.
  * `sync_status` (ENUM): Operational state (`ACTIVE`, `PAUSED`, `ERROR`, `AUTH_EXPIRED`).
  * `settings_json` (TEXT): Tenant-specific payload mapping and routing rules.
* **Relationships:**
  * FK to `crm_integration_channel.id`.
  * Referenced by `crm_lead.tenant_integration_id` and `crm_integration_webhook_log`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(webhook_slug)`).
* **Why Needed:** Allows multiple independent vendor accounts (e.g., North India vs. South India IndiaMART accounts) per tenant with encrypted credentials.

---

### 10. `crm_integration_webhook_log`
* **Purpose:** High-throughput raw webhook ingestion log ensuring non-blocking reception, exact payload preservation, and guaranteed idempotency.
* **Important Columns:**
  * `company_id` (UUID): Tenant identifier.
  * `provider_code` (ENUM): Marketplace or ad platform code.
  * `idempotency_hash` (VARCHAR): SHA-256 hash of `company_id + provider_code + external_event_id + raw_payload`.
  * `raw_payload` (TEXT): Unmodified JSON/XML payload as received over HTTP.
  * `processing_status` (ENUM): State (`RECEIVED`, `NORMALIZED`, `PROCESSED`, `DUPLICATE_SKIPPED`, `FAILED`, `DEAD_LETTER`).
  * `lead_id` (UUID): Reference to created `crm_lead.id` once normalized.
* **Relationships:**
  * FK to `crm_tenant_integration.id`.
  * Logical reference to `crm_lead.id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company with `UNIQUE(company_id, idempotency_hash)`.
* **Why Needed:** Guarantees zero data loss during network spikes, prevents duplicate leads when marketplaces retry webhooks, and allows payload re-processing if field mappings change.

---

### 11. `crm_lead_import_batch`
* **Purpose:** Manages asynchronous batch imports of leads from CSV and Excel spreadsheets.
* **Important Columns:**
  * `file_name` / `file_storage_url` (VARCHAR): Uploaded file location in object storage.
  * `total_records`, `imported_count`, `duplicate_count`, `failed_count` (INT): Batch execution metrics.
  * `mapping_config_json` (TEXT): JSON column-to-field mapping applied during import.
  * `error_report_url` (VARCHAR): S3 link to downloadable error CSV detailing invalid rows.
* **Relationships:**
  * Audited batch entity.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Essential for enterprise migrations and importing legacy databases, trade show attendee lists, or distributor rosters without UI timeouts.

---

## Domain 3: Lead Management Core (`CRM_Lead_Management`)

### 12. `crm_lead`
* **Purpose:** The central operational entity representing prospective customers, inquiries, and inbound commercial opportunities.
* **Important Columns:**
  * `lead_code` (VARCHAR): Human-readable reference (e.g. `LD-2026-00389`).
  * `display_name`, `email`, `phone`: Primary identity details.
  * `normalized_email` / `normalized_phone`: Sanitized representations (lowercase email, E.164 digits-only phone) for indexing and deduplication.
  * `organization_name`, `industry`, `designation`: B2B commercial context.
  * `gstin` (VARCHAR(15)), `pan` (VARCHAR(10)): Indian statutory business identifiers.
  * `lead_source_id` / `external_lead_id`: Acquisition source tracking.
  * `lead_status_id`, `lead_stage`, `lead_score`, `score_grade`: Qualification metrics.
  * `owner_user_id` (UUID): Assigned sales representative (`sso.user.id`).
  * `is_converted`, `converted_account_id`, `converted_contact_id`, `converted_opportunity_id`: Conversion traceability.
  * `consent_given`, `opt_out_whatsapp`, `opt_out_email`: DPDP Act 2023 compliance.
* **Relationships:**
  * FK to `crm_lead_status.id`, `crm_lead_source.id`, `crm_tenant_integration.id`, `crm_campaign.id`, `crm_lost_reason.id`.
  * Self-reference `primary_lead_id` for merged duplicates.
  * FK to converted `crm_account.id`, `crm_contact.id`, `crm_opportunity.id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, lead_code)`).
* **Why Needed:** Foundation of the entire sales acquisition pipeline.

---

### 13. `crm_lead_assignment_history`
* **Purpose:** Audit log capturing every change in lead ownership, whether executed manually, by round-robin pools, or via SLA escalations.
* **Important Columns:**
  * `lead_id` (UUID): FK to `crm_lead.id`.
  * `from_user_id` / `to_user_id` (UUID): Previous and newly assigned sales reps (`sso.user.id`).
  * `assignment_method` (VARCHAR): `MANUAL`, `ROUND_ROBIN`, `RULE_BASED`, `ESCALATION`.
  * `reason` (TEXT): Justification for ownership transfer.
* **Relationships:**
  * FK to `crm_lead.id` (ON DELETE CASCADE).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Accountability, dispute resolution, sales performance audits, and commission attribution.

---

### 14. `crm_lead_merge_history`
* **Purpose:** Maintains an immutable historical record when two duplicate leads are consolidated into one primary lead.
* **Important Columns:**
  * `primary_lead_id` (UUID): Surviving lead record.
  * `merged_lead_id` (UUID): Retired duplicate record.
  * `merged_lead_snapshot_json` (TEXT): Full snapshot of the retired lead's data.
  * `merged_by_user_id` (UUID): User who performed the merge.
* **Relationships:**
  * FK to `crm_lead.id` (both primary and merged).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Data preservation. Guarantees historical inquiries and notes from merged leads can always be audited or restored.

---

### 15. `crm_lead_score_log`
* **Purpose:** Transparent log of point adjustments contributing to a lead's qualification score.
* **Important Columns:**
  * `lead_id` (UUID): FK to `crm_lead.id`.
  * `rule_code` (VARCHAR): Rule applied (e.g. `HAS_VALID_GSTIN`, `ANNUAL_TURNOVER_GT_1CR`, `EMAIL_LINK_CLICKED`).
  * `score_delta` (INT): Positive or negative score change (+20, -10).
  * `previous_score` / `new_score` (INT): Score progression.
* **Relationships:**
  * FK to `crm_lead.id` (ON DELETE CASCADE).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Explainable lead scoring. Sales reps understand exactly why a lead is graded HOT or COLD.

---

### 16. `crm_lead_tag_mapping`
* **Purpose:** Many-to-many junction table associating leads with tags.
* **Important Columns:**
  * `lead_id` (UUID): FK to `crm_lead.id`.
  * `tag_id` (UUID): FK to `crm_tag.id`.
* **Relationships:**
  * Composite PK `(lead_id, tag_id)` with cascading deletes.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Flexible multi-tag querying and filtering on leads.

---

### 17. `crm_lead_product_interest`
* **Purpose:** Details specific products or services inquired about by a lead during initial intake.
* **Important Columns:**
  * `lead_id` (UUID): FK to `crm_lead.id`.
  * `product_id` (UUID): Logical reference to `inventory.product.id` (no cross-DB FK).
  * `product_name` / `product_code` (VARCHAR): Captured product title and SKU.
  * `quantity` (DECIMAL): Inquired quantity.
  * `estimated_budget` (DECIMAL): Customer's indicated budget.
  * `specifications` (TEXT): Technical notes from customer inquiry.
* **Relationships:**
  * FK to `crm_lead.id` (ON DELETE CASCADE).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Critical for B2B industrial inquiries where customers inquire about specific technical catalog items before a formal deal is created.

---

## Domain 4: Account & Contact Management (`CRM_Account_Contact`)

### 18. `crm_account`
* **Purpose:** B2B client company accounts representing current or prospective corporate entities.
* **Important Columns:**
  * `account_code` (VARCHAR): Unique code (e.g. `ACC-2026-00104`).
  * `account_name` (VARCHAR): Legal entity name.
  * `account_type` (ENUM): `PROSPECT`, `CUSTOMER`, `PARTNER`, `VENDOR`, `RESELLER`.
  * `parent_account_id` (UUID): Self-reference supporting corporate hierarchies (holding companies, regional divisions, branch offices).
  * `gstin` (VARCHAR(15)), `pan` (VARCHAR(10)): Indian statutory tax numbers.
  * `industry`, `business_type`, `tier`: Segmentation criteria.
  * `owner_user_id` (UUID): Account Manager (`sso.user.id`).
  * `account_main_customer_id` (UUID): Logical reference to `account-main.customer.id` once onboarded as an ERP customer.
* **Relationships:**
  * Self-reference `parent_account_id`.
  * FK to `crm_address` (billing and shipping).
  * Logical reference to `account-main.customer.id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, account_code)`).
* **Why Needed:** Core B2B account master managing commercial terms, multi-branch hierarchies, and ERP customer linkage.

---

### 19. `crm_contact`
* **Purpose:** Individual business persons, decision makers, and influencers belonging to an account or acting independently in B2C transactions.
* **Important Columns:**
  * `account_id` (UUID): FK to `crm_account.id` (nullable for B2C individuals).
  * `contact_code` (VARCHAR): Unique identifier (e.g. `CON-2026-00451`).
  * `first_name`, `last_name`, `display_name`: Name details.
  * `designation`, `department_name`: Professional role.
  * `normalized_email` / `normalized_phone`: Normalized communication coordinates.
  * `is_primary_contact` (BOOLEAN): Main contact for account notifications.
  * `decision_maker_role` (ENUM): `DECISION_MAKER`, `INFLUENCER`, `EVALUATOR`, `END_USER`, `GATEKEEPER`.
* **Relationships:**
  * FK to `crm_account.id` (ON DELETE SET NULL).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, contact_code)`).
* **Why Needed:** Accurate stakeholder mapping for complex enterprise sales cycles.

---

### 20. `crm_address`
* **Purpose:** Normalized multi-address repository for accounts, contacts, and quotations.
* **Important Columns:**
  * `entity_type` (VARCHAR): `ACCOUNT`, `CONTACT`, `QUOTATION`.
  * `entity_id` (UUID): Owning record ID.
  * `address_type` (ENUM): `BILLING`, `SHIPPING`, `REGISTERED_OFFICE`, `BRANCH_OFFICE`, `SITE_LOCATION`.
  * `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`: Standard address fields.
  * `state_code` (VARCHAR(10)): 2-digit Indian GST State Code (e.g., `27` for Maharashtra, `29` for Karnataka) required for intra-state vs. inter-state tax splitting.
  * `gstin_for_address` (VARCHAR(15)): Multi-state GSTIN for enterprises with state-level registrations.
* **Relationships:**
  * Polymorphic association to accounts, contacts, and quotations.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Enterprises frequently operate distinct billing entities, manufacturing plants, and delivery warehouses across different GST states.

---

### 21. `crm_account_contact_relation`
* **Purpose:** Many-to-many junction enabling a single business person (e.g., an external procurement consultant or board director) to be mapped to multiple accounts.
* **Important Columns:**
  * `account_id` (UUID): FK to `crm_account.id`.
  * `contact_id` (UUID): FK to `crm_contact.id`.
  * `relationship_title` (VARCHAR): Role description (e.g., `External Technical Advisor`).
* **Relationships:**
  * Composite PK `(account_id, contact_id)` with cascading deletes.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Supports real-world matrix business relationships where consultants represent multiple corporate accounts.

---

## Domain 5: Sales Pipeline & Opportunity Management (`CRM_Sales_Pipeline`)

### 22. `crm_sales_pipeline`
* **Purpose:** Represents discrete sales funnels with distinct progression stages (e.g. Domestic Sales vs. Export Sales vs. Tender Bidding).
* **Important Columns:**
  * `pipeline_code` (VARCHAR): Canonical code (`DOMESTIC_SALES`).
  * `pipeline_name` (VARCHAR): Display name.
  * `is_default` (BOOLEAN): Fallback pipeline for converted leads.
* **Relationships:**
  * Parent to `crm_pipeline_stage`.
  * Referenced by `crm_opportunity.pipeline_id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, pipeline_code)`).
* **Why Needed:** Large enterprises operate multiple business units with completely different sales cycle durations and milestones.

---

### 23. `crm_pipeline_stage`
* **Purpose:** Sequential milestones within a sales pipeline with custom win probabilities and SLA thresholds.
* **Important Columns:**
  * `pipeline_id` (UUID): FK to `crm_sales_pipeline.id`.
  * `stage_code` (VARCHAR): Code (`DISCOVERY`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`).
  * `stage_order` (INT): Horizontal progression position.
  * `stage_category` (ENUM): High-level classification (`PROSPECTING`, `QUALIFICATION`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`).
  * `win_probability_pct` (INT): Probability percentage (0 - 100) for weighted revenue forecasting.
  * `rotting_days` (INT): Days of inactivity before a deal turns red in kanban.
  * `sla_days` (INT): Target days to progress past this stage.
* **Relationships:**
  * FK to `crm_sales_pipeline.id` (ON DELETE CASCADE).
  * Referenced by `crm_opportunity.current_stage_id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(pipeline_id, stage_code)`).
* **Why Needed:** Provides the structure for visual kanban deal boards, SLA enforcement, and pipeline health monitoring.

---

### 24. `crm_opportunity`
* **Purpose:** The core commercial deal entity tracking value, probability, expected closing dates, and competitive dynamics.
* **Important Columns:**
  * `opportunity_code` (VARCHAR): Deal reference (e.g. `OPP-2026-00912`).
  * `opportunity_name` (VARCHAR): Title of commercial proposal.
  * `deal_value` (DECIMAL): Contract monetary value.
  * `currency` (VARCHAR(3)): ISO currency (default `INR`).
  * `probability_pct` (INT): Win probability (derived from stage or overridden by sales rep).
  * `weighted_value` (DECIMAL): `deal_value * probability_pct / 100` for financial forecasting.
  * `expected_close_date` (DATE): Target closing date.
  * `owner_user_id` (UUID): Deal owner (`sso.user.id`).
  * `deal_status` (ENUM): `OPEN`, `WON`, `LOST`, `ABANDONED`.
* **Relationships:**
  * FK to `crm_sales_pipeline.id`, `crm_pipeline_stage.id`, `crm_account.id`, `crm_contact.id`, `crm_lead.id`, `crm_lost_reason.id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, opportunity_code)`).
* **Why Needed:** Essential for sales pipeline visualization, revenue forecasting, quota tracking, and conversion analytics.

---

### 25. `crm_opportunity_item`
* **Purpose:** Line items and products bundled into a sales opportunity.
* **Important Columns:**
  * `opportunity_id` (UUID): FK to `crm_opportunity.id`.
  * `product_id` (UUID): Logical reference to `inventory.product.id`.
  * `product_name` / `product_code`: Snapshot of product details.
  * `quantity`, `unit_price`, `discount_pct`, `tax_pct`, `total_amount`: Line-item commercial figures.
* **Relationships:**
  * FK to `crm_opportunity.id` (ON DELETE CASCADE).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Allows deal values to be calculated bottom-up from inventory products rather than guessed.

---

### 26. `crm_opportunity_competitor`
* **Purpose:** Tracks competitive intelligence on competing vendors pitching for the same deal.
* **Important Columns:**
  * `opportunity_id` (UUID): FK to `crm_opportunity.id`.
  * `competitor_name` (VARCHAR): Competitor company.
  * `threat_level` (VARCHAR): `LOW`, `MEDIUM`, `HIGH`.
  * `is_winner` (BOOLEAN): Set to true if the client awarded the project to this competitor.
* **Relationships:**
  * FK to `crm_opportunity.id` (ON DELETE CASCADE).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Strategic market intelligence to refine pricing, battlecards, and sales positioning.

---

### 27. `crm_opportunity_stage_history`
* **Purpose:** Audit trail tracking every stage movement of an opportunity for pipeline velocity calculations.
* **Important Columns:**
  * `opportunity_id` (UUID): FK to `crm_opportunity.id`.
  * `from_stage_id` / `to_stage_id` (UUID): Source and destination stages.
  * `stage_entry_at` / `stage_exit_at` (TIMESTAMP): Timeline in stage.
  * `duration_seconds` (BIGINT): Total dwell time in stage.
* **Relationships:**
  * FK to `crm_opportunity.id` (ON DELETE CASCADE).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Measures sales velocity, stage conversion rates, and pinpoint sales bottlenecks.

---

## Domain 6: Activity, Tasks & Follow-up Management (`CRM_Activity_Tasks`)

### 28. `crm_activity`
* **Purpose:** Unified chronological activity stream capturing touchpoints, call notes, status changes, and meetings across any CRM object.
* **Important Columns:**
  * `entity_type` (VARCHAR): `LEAD`, `ACCOUNT`, `CONTACT`, `OPPORTUNITY`, `QUOTATION`.
  * `entity_id` (UUID): Target record identifier.
  * `activity_type` (VARCHAR): `CALL`, `MEETING`, `EMAIL`, `NOTE`, `TASK`, `WHATSAPP`, `STATUS_CHANGE`.
  * `subject` / `description`: Activity summary and detailed notes.
  * `performed_by_user_id` (UUID): User who logged the activity (`sso.user.id`).
* **Relationships:**
  * Polymorphic association to CRM entities.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Provides sales reps and management with a complete chronological history of every interaction with a customer.

---

### 29. `crm_task`
* **Purpose:** Actionable follow-up tasks, calls, demos, site inspections, and calendar reminders.
* **Important Columns:**
  * `entity_type` / `entity_id`: Associated business record.
  * `task_type` (ENUM): `CALL`, `MEETING`, `DEMO`, `EMAIL`, `SITE_VISIT`, `QUOTE_PREP`, `FOLLOW_UP`.
  * `priority` (ENUM): `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  * `status` (ENUM): `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `OVERDUE`.
  * `due_date` (DATE) / `due_time` (TIME): Deadline.
  * `assigned_to_user_id` (UUID): Assignee sales rep (`sso.user.id`).
  * `reminder_at` (TIMESTAMP): Alarm trigger.
  * `calendar_event_id` (VARCHAR): Sync ID with Google / Outlook calendar.
* **Relationships:**
  * Polymorphic association to CRM entities.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Drives daily sales rep execution, follow-up discipline, and prevents inquiries from going cold.

---

### 30. `crm_attachment`
* **Purpose:** Metadata and secure presigned storage URLs for uploaded files (RFPs, NDAs, drawings, purchase orders).
* **Important Columns:**
  * `entity_type` / `entity_id`: Associated business record.
  * `file_name`, `mime_type`, `file_size_bytes`: File metadata.
  * `storage_provider` (VARCHAR): `S3`, `MINIO`, `LOCAL`.
  * `storage_path_url` (VARCHAR): Secure object key / URL in cloud storage. **Never stores binary BLOBs in PostgreSQL.**
* **Relationships:**
  * Polymorphic association to CRM entities.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Document management without bloating relational database storage or degrading database cache performance.

---

## Domain 7: Omnichannel Communication & Conversations (`CRM_Communication`)

### 31. `crm_conversation`
* **Purpose:** Aggregates multi-message communication threads with a prospect or customer across WhatsApp, Email, SMS, or Webchat.
* **Important Columns:**
  * `channel` (ENUM): `WHATSAPP`, `EMAIL`, `SMS`, `PHONE_CALL`, `WEB_CHAT`.
  * `entity_type` / `entity_id`: Customer record.
  * `customer_identifier` (VARCHAR): Customer's phone number or email address.
  * `external_thread_id` (VARCHAR): External platform conversation/thread ID.
  * `assigned_agent_id` (UUID): Rep currently responding to thread.
  * `unread_count` (INT): Unread message badge counter.
* **Relationships:**
  * Parent to `crm_message`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Unified inbox allowing sales reps to converse across multiple channels from a single UI.

---

### 32. `crm_message`
* **Purpose:** Stores individual messages (inbound customer replies or outbound sales responses) within a conversation.
* **Important Columns:**
  * `conversation_id` (UUID): FK to `crm_conversation.id`.
  * `direction` (ENUM): `INBOUND` or `OUTBOUND`.
  * `body_text` / `body_html`: Content representations.
  * `media_storage_url` (VARCHAR): Object storage URL for voice notes, images, or PDFs.
  * `delivery_status` (ENUM): `QUEUED`, `SENT`, `DELIVERED`, `READ`, `FAILED`.
  * `notification_request_id` (UUID): Logical reference to `communication-service.notification_request.id` when dispatched via the communication microservice.
* **Relationships:**
  * FK to `crm_conversation.id` (ON DELETE CASCADE).
  * Logical reference to `communication-service.notification_request.id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Full message audit trail with delivery and read receipts.

---

### 33. `crm_call_log`
* **Purpose:** Call Detail Records (CDRs) for inbound inquiries, click-to-call outbound touches, and IVR interactions.
* **Important Columns:**
  * `provider_name` (VARCHAR): `EXOTEL`, `OZONETEL`, `KNOWLARITY`, `MCUBE`, `MANUAL`.
  * `caller_number` / `recipient_number`: Phone coordinates.
  * `call_status` (ENUM): `ANSWERED`, `MISSED`, `BUSY`, `NO_ANSWER`, `FAILED`.
  * `start_time` / `end_time` / `duration_seconds`: Dwell metrics.
  * `recording_storage_url` (VARCHAR): S3 link to audio file.
  * `call_notes`, `sentiment`: Rep analysis.
* **Relationships:**
  * Polymorphic association to CRM entities.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Telephony auditing, rep quality assurance, and missed-call lead generation.

---

### 34. `crm_consent_log`
* **Purpose:** Immutable compliance ledger capturing customer consent, opt-ins, and opt-outs in accordance with India's Digital Personal Data Protection (DPDP) Act 2023.
* **Important Columns:**
  * `entity_type` / `entity_id`: Customer entity.
  * `channel` (ENUM): `WHATSAPP`, `EMAIL`, `SMS`, `CALL`.
  * `consent_action` (VARCHAR): `OPT_IN`, `OPT_OUT`, `EXPLICIT_WITHDRAWAL`.
  * `consent_source` (VARCHAR): Form, checkbox, or SMS keyword origin.
  * `consent_text_snapshot` (TEXT): Exact disclosure text shown when consent was obtained.
  * `ip_address` / `user_agent`: Technical proof of consent.
* **Relationships:**
  * Polymorphic association to leads and contacts.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Mandatory regulatory compliance under DPDP Act 2023, protecting the enterprise from statutory penalties.

---

## Domain 8: Marketing Campaigns & Attribution (`CRM_Marketing_Attribution`)

### 35. `crm_campaign`
* **Purpose:** Marketing campaign master tracking budgets, channels, actual spend, and revenue generation.
* **Important Columns:**
  * `campaign_code` (VARCHAR): Unique code (e.g. `CMP-2026-DIWALI`).
  * `campaign_name` (VARCHAR): Campaign title.
  * `allocated_budget` / `actual_spend` (DECIMAL): Cost tracking.
  * `actual_leads_count`, `actual_conversions_count`, `actual_revenue_won`: Return metrics.
  * `utm_campaign_param` (VARCHAR): UTM parameter for automated URL attribution.
* **Relationships:**
  * Referenced by `crm_lead.campaign_id` and `crm_lead_attribution.campaign_id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, campaign_code)`).
* **Why Needed:** Connects top-of-funnel marketing investments directly to bottom-line closed revenue.

---

### 36. `crm_lead_attribution`
* **Purpose:** Multi-touch attribution model attributing pipeline value across multiple marketing interactions.
* **Important Columns:**
  * `lead_id` (UUID): FK to `crm_lead.id`.
  * `campaign_id` (UUID): FK to `crm_campaign.id`.
  * `touchpoint_type` (VARCHAR): `FIRST_TOUCH`, `LEAD_CREATION`, `MID_NURTURE`, `OPPORTUNITY_CREATION`, `LAST_TOUCH`.
  * `attribution_weight` (DECIMAL(5,4)): Fractional credit (e.g. 0.40 for first-touch, 0.40 for last-touch, 0.20 for linear).
* **Relationships:**
  * FK to `crm_lead.id` (ON DELETE CASCADE).
  * FK to `crm_campaign.id` (ON DELETE SET NULL).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Avoids biased "first-click" or "last-click" reporting, giving an accurate multi-touch picture of what marketing channels drive enterprise deals.

---

## Domain 9: Configuration-Driven Automation Engine (`CRM_Automation_Engine`)

### 37. `crm_automation_rule`
* **Purpose:** Declarative, event-driven automation rules defining triggers, conditions, and actions within the CRM.
* **Important Columns:**
  * `rule_code` (VARCHAR): Unique code.
  * `trigger_event` (ENUM): `LEAD_CREATED`, `LEAD_SCORE_CHANGED`, `LEAD_STATUS_CHANGED`, `OPPORTUNITY_STAGE_CHANGED`, `TASK_OVERDUE`, `INACTIVITY_TIMEOUT`.
  * `filter_conditions_json` (TEXT): JSON declarative criteria (e.g., `{ "source": "INDIAMART", "state": "MH" }`).
  * `execution_order` (INT): Rule priority.
  * `is_active` (BOOLEAN): Master toggle.
* **Relationships:**
  * Parent to `crm_automation_action`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, rule_code)`).
* **Why Needed:** Replaces hardcoded logic with tenant-configurable operational workflows without touching source code.

---

### 38. `crm_automation_action`
* **Purpose:** Specific execution steps (notifications, assignments, task creation, webhook dispatch) triggered by an automation rule.
* **Important Columns:**
  * `rule_id` (UUID): FK to `crm_automation_rule.id`.
  * `action_order` (INT): Execution sequence.
  * `action_type` (ENUM): `AUTO_ASSIGN_ROUND_ROBIN`, `SEND_NOTIFICATION`, `DISPATCH_WHATSAPP`, `DISPATCH_EMAIL`, `CREATE_TASK`, `UPDATE_FIELD`, `CALL_WEBHOOK`, `INITIATE_WORKFLOW_APPROVAL`.
  * `action_payload_json` (TEXT): Parameters for the action (template ID, pool ID, task attributes).
  * `delay_minutes` (INT): Delay before action fires (e.g. 120 minutes).
* **Relationships:**
  * FK to `crm_automation_rule.id` (ON DELETE CASCADE).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Modular, composable action chaining supporting multi-step automations.

---

### 39. `crm_automation_execution_log`
* **Purpose:** Diagnostic execution audit trail recording rule evaluation, latency, errors, and outcomes.
* **Important Columns:**
  * `rule_id` (UUID): FK to `crm_automation_rule.id`.
  * `status` (VARCHAR): `SUCCESS`, `FAILED`, `SKIPPED`, `RETRYING`.
  * `duration_ms` (BIGINT): Execution latency.
  * `error_message` (TEXT): Stack trace or rejection reason if failed.
* **Relationships:**
  * FK to `crm_automation_rule.id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Operational monitoring, debugging failed webhooks, and preventing infinite automation loops.

---

### 40. `crm_round_robin_pool`
* **Purpose:** Defines sales representative pools for automated lead distribution.
* **Important Columns:**
  * `pool_code` (VARCHAR): Canonical pool identifier (e.g. `INBOUND_SOLAR_REPS`).
  * `routing_strategy` (ENUM): `ROUND_ROBIN`, `WEIGHTED_CAPACITY`, `AVAILABILITY_BASED`.
* **Relationships:**
  * Parent to `crm_round_robin_member`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, pool_code)`).
* **Why Needed:** Routes leads to the right team based on territory, language, or product specialization.

---

### 41. `crm_round_robin_member`
* **Purpose:** Maps individual sales representatives to a round-robin pool with weighting and daily quotas.
* **Important Columns:**
  * `pool_id` (UUID): FK to `crm_round_robin_pool.id`.
  * `user_id` (UUID): Sales representative (`sso.user.id`).
  * `weight` (INT): Capacity weighting.
  * `max_daily_leads` / `current_leads_today` (INT): Quota guardrails.
  * `last_assigned_at` (TIMESTAMP): Rotation cursor.
  * `is_active` (BOOLEAN): Temporary disable flag for reps on leave.
* **Relationships:**
  * FK to `crm_round_robin_pool.id` (ON DELETE CASCADE).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(pool_id, user_id)`).
* **Why Needed:** Fair and predictable lead distribution that respects rep capacity and leaves.

---

## Domain 10: Quotation & Sales Operations (`CRM_Quotation_Operations`)

### 42. `crm_quotation`
* **Purpose:** Commercial sales quotations generated during negotiations with statutory GST calculation, revisions, and Workflow Service approvals.
* **Important Columns:**
  * `quotation_number` (VARCHAR): Reference (e.g. `QT-2026-00452`).
  * `revision_number` (INT): Revision index (1, 2, 3...).
  * `parent_quotation_id` (UUID): Self-reference to initial quote if amended.
  * `opportunity_id` / `account_id` / `contact_id`: Context linkage.
  * `subtotal`, `discount_amount`, `tax_amount`, `total_amount`: Financial summary.
  * `place_of_supply_state_code` (VARCHAR(10)): GST 2-digit state code determining tax splitting (CGST+SGST vs. IGST).
  * `status` (ENUM): `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `DISPATCHED`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `CANCELLED`, `CONVERTED_TO_ORDER`.
  * `workflow_transaction_id` (UUID): Reference to `workflow-service.workflow_transaction.id`.
  * `account_main_sales_order_id` (UUID): Reference to `account-main.sales_order.id` once converted to an ERP Sales Order.
* **Relationships:**
  * FK to `crm_opportunity.id`, `crm_account.id`, `crm_contact.id`, `crm_address.id`.
  * Self-reference `parent_quotation_id`.
  * Logical reference to `workflow-service.workflow_transaction.id`.
  * Logical reference to `account-main.sales_order.id`.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(company_id, quotation_number, revision_number)`).
* **Why Needed:** Core commercial document bridging sales negotiations to financial ERP billing.

---

### 43. `crm_quotation_item`
* **Purpose:** Line items within a quotation with HSN/SAC statutory codes, quantities, and GST breakdowns.
* **Important Columns:**
  * `quotation_id` (UUID): FK to `crm_quotation.id`.
  * `product_id` (UUID): Logical reference to `inventory.product.id`.
  * `product_name`, `hsn_sac_code`: Product and tax master snapshot.
  * `quantity`, `unit_price`, `discount_amount`, `taxable_amount`: Line figures.
  * `cgst_rate`, `cgst_amount`, `sgst_rate`, `sgst_amount`, `igst_rate`, `igst_amount`: Detailed GST calculation.
  * `total_amount` (DECIMAL): Final line total.
* **Relationships:**
  * FK to `crm_quotation.id` (ON DELETE CASCADE).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company.
* **Why Needed:** Required for tax compliance and accurate quotation PDF generation.

---

### 44. `crm_quotation_revision`
* **Purpose:** Immutable snapshot history of previous revisions created when commercial terms are renegotiated.
* **Important Columns:**
  * `quotation_id` (UUID): FK to `crm_quotation.id`.
  * `revision_number` (INT): Revision counter.
  * `revision_notes` (TEXT): Explanation of changes.
  * `snapshot_json` (TEXT): Full immutable JSON snapshot of headers, items, taxes, and terms.
* **Relationships:**
  * FK to `crm_quotation.id` (ON DELETE CASCADE).
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(quotation_id, revision_number)`).
* **Why Needed:** Protects against price tampering, preserves audit trail during negotiations, and allows side-by-side comparison of revision proposals.

---

## Domain 11: Transactional Outbox & Event Architecture (`CRM_Outbox`)

### 45. `crm_outbox`
* **Purpose:** Implements the Transactional Outbox Pattern matching `manufacturing_outbox`, guaranteeing reliable event publication to RabbitMQ without distributed transaction dual-write inconsistencies.
* **Important Columns:**
  * `aggregate_type` (VARCHAR): `LEAD`, `OPPORTUNITY`, `QUOTATION`, `ACCOUNT`, `INTEGRATION`.
  * `aggregate_id` (UUID): Primary key of the aggregate root entity.
  * `event_type` (VARCHAR): Canonical event name (`LEAD_CREATED`, `LEAD_CONVERTED`, `QUOTATION_SUBMITTED`, `QUOTATION_APPROVED`, `QUOTATION_CONVERTED_TO_ORDER`).
  * `idempotency_key` (VARCHAR): Unique GUID ensuring consumer deduplication.
  * `payload` (TEXT): Serialized JSON event body.
  * `status` (ENUM): `PENDING`, `PROCESSED`, `FAILED`.
  * `retry_count`, `next_attempt_at`, `last_error`: Retry orchestration.
* **Relationships:**
  * Standalone outbox table.
* **Owning Service / Tenant Scope:** `crm-service` / Scoped per company (`UNIQUE(idempotency_key)`).
* **Why Needed:** Eliminates the dual-write problem. Ensures that when a business record is committed to PostgreSQL, the corresponding RabbitMQ event is guaranteed to be dispatched.

