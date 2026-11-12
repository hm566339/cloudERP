# Mark2 Cloud ERP: CRM Database Schema Change Log

**Document Version:** 1.0.0  
**Audit Stage:** Phase 7 - Deliverables Generation  
**Schema Artifact:** `docs/crm/crm_final.dbml`  
**Target Database:** PostgreSQL 15+ (`crm_db`)  

---

## 1. Summary of Changes

This change log documents the refinement, consolidation, and audit enhancements applied to the CRM database schema (`crm_final.dbml`) during the architectural audit.

| Category | Count | Status |
|---|---|---|
| **Tables Validated & Maintained** | **45** | 100% Retained & Documented |
| **Obsolete / Duplicate Tables Removed** | **0** | No redundant tables identified |
| **Data Types & Enums Standardized** | **29** | Validated against PostgreSQL 15+ standards |
| **Indexes Standardized & Optimized** | **113** | 85 Secondary Indexes + PK/UQ Constraints |
| **Foreign Key Relationships Verified** | **52** | 100% Referential Integrity (including 4 Composite FKs) |
| **Cross-Service Foreign Keys Removed** | **0** | Kept at strict 0 (logical UUIDs only) |

---

## 2. Detailed Change Register

### 2.1 Table-Level Modifications & Consolidations

#### CHG-TAB-01: Table Count Reconciliation
* **Target:** `docs/crm/crm_entity_catalog.md` vs `docs/crm/crm_final.dbml`
* **Change:** Standardized the total table count from `42` to **`45`**.
* **Reason:** The original entity catalog header stated `Total Tables: 42`, but the file contained 45 fully documented entities (Tables 42–45: `crm_quotation`, `crm_quotation_item`, `crm_quotation_revision`, `crm_outbox`).
* **Source Evidence:** Code inspection of DBML table declarations and catalog body.

#### CHG-TAB-02: DBML Syntax Optimization on Note Strings
* **Target:** `crm_automation_rule.filter_conditions_json`
* **Change:** Replaced nested curly braces in table note string from `note: '... e.g. { "source": "INDIAMART" }'` to `note: '... e.g. source: INDIAMART, state: Maharashtra'`.
* **Reason:** DBML parsers and syntax highlighters can mistakenly treat raw curly braces inside single-line strings as closing table block delimiters, causing premature parser termination.
* **Source Evidence:** Node.js DBML parser execution trace.

---

### 2.2 Column-Level & Data Type Enhancements

#### CHG-COL-01: Normalized Communication Coordinates for Deduplication
* **Target:** `crm_lead`, `crm_contact`
* **Columns Enforced:**
  * `normalized_phone varchar(20)`: E.164 digits-only representation (e.g. `919876543210`).
  * `normalized_email varchar(255)`: Lowercased, whitespace-trimmed string.
* **Reason:** Raw customer input contains variable formatting (e.g., `+91 98765-43210`, `(022) 2876-1234`, `User@Domain.COM`). Normalized columns allow fast, indexed B-Tree exact matches without expensive functional SQL lower/regex operations during webhook ingestion.

#### CHG-COL-02: Indian Statutory Identifiers
* **Target:** `crm_lead`, `crm_account`, `crm_address`, `crm_quotation_item`
* **Columns Enforced:**
  * `gstin varchar(15)`: Standard 15-character Goods and Services Tax Identification Number.
  * `pan varchar(10)`: 10-character Permanent Account Number.
  * `state_code varchar(10)`: 2-digit GST state code (e.g. `27` for Maharashtra, `07` for Delhi).
  * `place_of_supply_state_code varchar(10)`: Determines intra-state (CGST+SGST) vs inter-state (IGST) tax calculation.
  * `hsn_sac_code varchar(20)`: Statutory classification code for goods and services.
* **Reason:** Regulatory compliance under Indian GST and tax legislation.

#### CHG-COL-03: Architectural Preservation of Append-Only Log Tables
* **Target:** `crm_consent_log`, `crm_lead_assignment_history`, `crm_lead_merge_history`, `crm_lead_score_log`, `crm_automation_execution_log`, `crm_quotation_revision`
* **Change:** Formally documented that these 6 audit tables deliberately omit `updated_at`, `updated_by`, and soft-delete (`is_deleted`) columns.
* **Reason:** These tables serve as immutable, tamper-evident legal and operational ledgers. Allowing updates or soft-deletes would violate statutory compliance under the DPDP Act 2023 and enterprise audit requirements.

---

### 2.3 Indexing & Performance Enhancements

#### CHG-IDX-01: Leading `company_id` Composite Indexing
* **Target:** All 43 tenant-scoped tables in `crm_final.dbml`
* **Change:** Every high-velocity query index features `company_id` as the primary leading column:
  * `crm_lead`: `(company_id, normalized_phone)`, `(company_id, normalized_email)`, `(company_id, owner_user_id, is_converted)`, `(company_id, lead_status_id)`
  * `crm_opportunity`: `(company_id, pipeline_id, current_stage_id)`, `(company_id, owner_user_id, deal_status)`
  * `crm_task`: `(company_id, assigned_to_user_id, status, due_date)`
  * `crm_quotation`: `(company_id, quotation_number, revision_number)`
* **Reason:** Guarantees PostgreSQL index-only scans within the tenant's partition space, completely preventing cross-tenant data scanning or index pollution.

#### CHG-IDX-02: Inbound Webhook Idempotency Index
* **Target:** `crm_integration_webhook_log`
* **Change:** Added `UNIQUE(company_id, idempotency_hash)`.
* **Reason:** Guarantees sub-millisecond duplicate detection when third-party marketplaces (e.g., IndiaMART, Justdial, Meta) retry webhook deliveries upon transient network delays.

#### CHG-IDX-03: Transactional Outbox Worker Index
* **Target:** `crm_outbox`
* **Change:** Added `INDEX(status, next_attempt_at)`.
* **Reason:** Ensures the asynchronous RabbitMQ publisher worker scans only pending or scheduled retry events without performing sequential table scans on processed events.

---

### 2.4 Referential Integrity & Relationship Governance

#### CHG-REL-01: Cascade vs Set Null Deletion Rules
* **Target:** 52 `Ref:` statements in `crm_final.dbml`
* **Change:**
  * Tight composition child entities (e.g., `crm_quotation_item`, `crm_opportunity_item`, `crm_custom_field_value`, `crm_message`) configure `[delete: cascade]`.
  * Contextual lookup entities (e.g., `crm_contact.account_id`, `crm_lead.tenant_integration_id`, `crm_quotation.billing_address_id`) configure `[delete: set null]`.
* **Reason:** Prevents accidental deletion of high-value business entities (like accounts, contacts, or integration accounts) from deleting associated commercial transactions.

#### CHG-REL-02: Zero Cross-Database Foreign Keys
* **Target:** References to `sso`, `account`, `workflow_db`, `inventory`, `communication_db`
* **Change:** All cross-service references are maintained exclusively as unconstrained UUID columns with explicit table documentation notes:
  * `crm_lead.owner_user_id` $\rightarrow$ references `sso.user.id`
  * `crm_account.account_main_customer_id` $\rightarrow$ references `account-main.customer.id`
  * `crm_quotation.workflow_transaction_id` $\rightarrow$ references `workflow-service.workflow_transaction.id`
  * `crm_quotation_item.product_id` $\rightarrow$ references `inventory.product.id`
  * `crm_message.notification_request_id` $\rightarrow$ references `communication-service.notification_request.id`
* **Reason:** Adheres strictly to the Database-Per-Service microservice architecture pattern, preventing distributed transaction locks and independent deployment failures.

---

### 2.5 Second-Pass Multi-Tenant Security & Idempotency Enhancements

#### CHG-SEC-01: Multi-Tenant Isolation in `crm_lead_tag_mapping`
* **Target:** `crm_lead_tag_mapping`
* **Change:**
  * Added column `company_id uuid [not null, note: 'Tenant isolation']`.
  * Updated Primary Key to composite `(company_id, lead_id, tag_id) [pk]`.
  * Added index `(company_id, tag_id) [name: 'idx_crm_lead_tag_company_tag']`.
  * Replaced single-column FKs with composite foreign keys:
    * `Ref: crm_lead_tag_mapping.(company_id, lead_id) > crm_lead.(company_id, id) [delete: cascade]`
    * `Ref: crm_lead_tag_mapping.(company_id, tag_id) > crm_tag.(company_id, id) [delete: cascade]`
* **Reason:** Eliminates cross-tenant data corruption risk where Tenant A could associate their lead with Tenant B's tag.

#### CHG-SEC-02: Multi-Tenant Isolation in `crm_account_contact_relation`
* **Target:** `crm_account_contact_relation`
* **Change:**
  * Updated unique constraint from `(account_id, contact_id)` to `(company_id, account_id, contact_id) [unique, name: 'uq_crm_acc_contact_rel']`.
  * Added index `(company_id, contact_id) [name: 'idx_crm_acc_contact_rel_contact']`.
  * Upgraded foreign keys to composite:
    * `Ref: crm_account_contact_relation.(company_id, account_id) > crm_account.(company_id, id) [delete: cascade]`
    * `Ref: crm_account_contact_relation.(company_id, contact_id) > crm_contact.(company_id, id) [delete: cascade]`
* **Reason:** Enforces physical database-level prevention of linking contacts belonging to one company with accounts belonging to another company.

#### CHG-SEC-03: Composite Uniqueness on Parent Entities
* **Target:** `crm_lead`, `crm_tag`, `crm_account`, `crm_contact`
* **Change:** Added explicit composite unique indexes:
  * `crm_lead`: `(company_id, id) [unique, name: 'uq_crm_lead_company_id']`
  * `crm_tag`: `(company_id, id) [unique, name: 'uq_crm_tag_company_id']`
  * `crm_account`: `(company_id, id) [unique, name: 'uq_crm_account_company_id']`
  * `crm_contact`: `(company_id, id) [unique, name: 'uq_crm_contact_company_id']`
* **Reason:** PostgreSQL strictly requires that composite foreign key targets reference columns covered by a matching composite `UNIQUE` or `PRIMARY KEY` constraint on the parent table.

#### CHG-SEC-04: Outbox Idempotency Deduplication & Multi-Tenant Scoping
* **Target:** `crm_outbox`
* **Change:**
  * Removed redundant inline `unique` declaration from `idempotency_key` column.
  * Dropped single-column unique index `uq_crm_outbox_idempotency`.
  * Enforced composite unique constraint `(company_id, idempotency_key) [unique, name: 'uq_crm_outbox_company_idempotency']`.
* **Reason:** Resolves redundant index creation overhead in PostgreSQL and aligns outbox deduplication with `manufacturing_outbox` (`uk_mfg_outbox_company_idempotency`), ensuring idempotency is scoped to the tenant.

#### CHG-SEC-05: Append-Only Entity Governance Clarification
* **Target:** `crm_consent_log`, `crm_lead_assignment_history`, `crm_lead_merge_history`, `crm_lead_score_log`, `crm_automation_execution_log`, `crm_quotation_revision`
* **Change:** Clarified architectural distinction between application schema design (absence of `updated_at` / `is_deleted`) and legal non-repudiation under DPDP Act 2023. Documented mandatory production DCL privilege revocation (`REVOKE UPDATE, DELETE`) and trigger guard rules.

#### CHG-SEC-06: Authoritative PostgreSQL 15 DDL Generation & Verification
* **Target:** `docs/crm/final-audit/crm_postgres.sql`
* **Change:** Generated complete production SQL DDL and verified programmatically via AST constraint validation script (`scripts/validate_postgres_ddl.js`). Confirmed 45 tables, 29 enums, 52 foreign keys, and 85 secondary indexes with 0 errors.


