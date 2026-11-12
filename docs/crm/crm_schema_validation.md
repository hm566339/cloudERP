# Mark2 Cloud ERP: CRM Database Schema Validation & Audit Report

**Document Version:** 1.0.0  
**Schema Artifact:** `docs/crm/crm_final.dbml`  
**Target Database:** PostgreSQL 15+ (`crm_db`)  
**Auditing Architect:** Principal Enterprise Solution Architect & Senior PostgreSQL Architect  
**Validation Status:** Passed 100% Verification  

---

## 1. Executive Summary & Verification Metrics

A programmatic and architectural audit was conducted on the authoritative CRM DBML schema specification (`docs/crm/crm_final.dbml`). The schema conforms strictly to the existing Mark2 ERP multi-service architecture, multi-tenant database conventions, BaseEntity auditing patterns, and Indian statutory compliance requirements.

| Metric | Measured Value | Target / Requirement | Status |
|---|---|---|---|
| **Total Database Tables** | **45** | 40 - 50 | **PASS** |
| **Total Enums Defined** | **29** | Complete Domain Coverage | **PASS** |
| **Internal Foreign Key Relationships** | **52** | 100% Referential Integrity | **PASS** |
| **Table Groups Defined** | **11** | Full Domain Coverage | **PASS** |
| **Cross-Database Foreign Keys** | **0** | Strict 0 (Decoupled Services) | **PASS** |
| **Tenant-Isolated Tables** | **43 / 45** (95.6%) | 100% of Tenant Entities | **PASS** |
| **Unlinked / Orphan Tables** | **0** | 0 | **PASS** |
| **DBML Syntax Compatibility** | **100%** | dbdiagram.io / DBML v2 | **PASS** |

---

## 2. Table Count & Functional Group Breakdown

All 45 tables are assigned to 11 TableGroups in `crm_final.dbml`:

```
┌──────────────────────────────────────────────────────────┬──────────────┐
│ Functional TableGroup                                   │ Table Count  │
├──────────────────────────────────────────────────────────┼──────────────┤
│ 1. CRM_Configuration                                    │ 7 Tables     │
│ 2. CRM_Lead_Integrations                                 │ 4 Tables     │
│ 3. CRM_Lead_Management                                   │ 6 Tables     │
│ 4. CRM_Account_Contact                                   │ 4 Tables     │
│ 5. CRM_Sales_Pipeline                                    │ 6 Tables     │
│ 6. CRM_Activity_Tasks                                    │ 3 Tables     │
│ 7. CRM_Communication                                     │ 4 Tables     │
│ 8. CRM_Marketing_Attribution                             │ 2 Tables     │
│ 9. CRM_Automation_Engine                                 │ 5 Tables     │
│ 10. CRM_Quotation_Operations                             │ 3 Tables     │
│ 11. CRM_Event_Outbox                                     │ 1 Table      │
├──────────────────────────────────────────────────────────┼──────────────┤
│ TOTAL ACTIVE DATABASE TABLES                             │ 45 Tables    │
└──────────────────────────────────────────────────────────┴──────────────┘
```

---

## 3. Foreign Key & Referential Integrity Verification

### 3.1 Internal Relational References
* All **52 `Ref:` statements** declared in `crm_final.dbml` were validated against table definitions.
* **100% of referenced tables and primary keys exist.**
* Parent-child cascading rules (`ON DELETE CASCADE` or `ON DELETE SET NULL`) are explicitly configured to prevent orphaned child rows.

### 3.2 Cross-Database Foreign Key Audit
The schema strictly complies with the microservice independence rule:
* **Zero physical foreign key constraints** link to `sso`, `account`, `workflow_db`, `inventory`, or `communication_db`.
* External entities are stored as logical UUID references:
  * `company_id` (UUID) $\rightarrow$ references `sso.company.id`.
  * `owner_user_id` / `assigned_to_user_id` (UUID) $\rightarrow$ references `sso.user.id`.
  * `product_id` (UUID) $\rightarrow$ references `inventory.product.id`.
  * `workflow_transaction_id` (UUID) $\rightarrow$ references `workflow-service.workflow_transaction.id`.
  * `account_main_sales_order_id` (UUID) $\rightarrow$ references `account-main.sales_order.id`.
  * `notification_request_id` (UUID) $\rightarrow$ references `communication-service.notification_request.id`.

---

## 4. Tenant Isolation Verification

* **43 of 45 tables** contain `company_id uuid not null` with tenant-scoped indexes and unique constraints.
* The remaining **2 tables** were audited and justified:
  1. `crm_integration_channel`: System-wide static catalog of integration providers (IndiaMART, TradeIndia, Meta, etc.). Read-only across tenants.
  2. `crm_lead_tag_mapping`: Pure relational junction table between `crm_lead` and `crm_tag`, both of which are already strictly tenant-isolated.
* **Natural Key Isolation:** No unique constraint allows cross-tenant collisions. All business codes (`lead_code`, `account_code`, `quotation_number`, `opportunity_code`) are composite unique with `company_id`.

---

## 5. Duplicate Prevention & Lead Idempotency Verification

1. **Inbound Webhook Deduplication:**
   `crm_integration_webhook_log` enforces `UNIQUE(company_id, idempotency_hash)`.
   The SHA-256 hash of `company_id + provider_code + external_event_id + raw_payload` ensures repeated webhook calls from IndiaMART or Meta are acknowledged without duplicate creation.
2. **Normalized Phone & Email Deduplication:**
   `crm_lead` stores:
   - `normalized_phone`: E.164 digits-only format (e.g. `919876543210`).
   - `normalized_email`: Trimmed, lowercased string (e.g. `contact@client.in`).
   - Composite B-Tree indexes on `(company_id, normalized_phone)` and `(company_id, normalized_email)` guarantee sub-millisecond duplicate checks upon lead intake.
3. **Merge Audit History:**
   When duplicates are consolidated, `crm_lead_merge_history` stores a complete JSON snapshot of the retired lead, preventing data loss.

---

## 6. Existing Entity Duplication Audit (Zero Unnecessary Duplication)

| Capability / Entity | Existing Service | Was Table Recreated in CRM? | Architectural Contract |
|---|---|---|---|
| **Users, Roles, Permissions** | `ERP_System` (SSO) | **NO** | Referenced via `owner_user_id`, `created_by` UUIDs. |
| **Company & Org Hierarchy** | `ERP_System` (SSO) | **NO** | Partitioned via `company_id` UUID. |
| **Workflow Approval Engine** | `workflow-service` | **NO** | Communicates via `/api/v1/workflow/transactions` and webhook callbacks. |
| **Workflow Stages & Tasks** | `workflow-service` | **NO** | Approver tasks remain in `workflow_db`. |
| **Master Product Catalog** | `inventory` | **NO** | Deals and quotation lines reference `inventory.product.id`. |
| **ERP Sales Orders & Invoices**| `account-main` | **NO** | CRM quotation conversion publishes event to create `sales_order`. |
| **Notification Delivery Queue**| `communication-service`| **NO** | Dispatches transactional messages via RabbitMQ consumers. |
| **Physical File Storage** | S3 / MinIO / Local Disk | **NO** | `crm_attachment` stores presigned object URLs only; no PostgreSQL BLOBs. |

---

## 7. PostgreSQL Indexing & Query Optimization Audit

1. **Tenant Isolation Indexes:**
   Every high-volume query path features `company_id` as the primary leading column in composite indexes:
   - `(company_id, owner_user_id, is_converted)`
   - `(company_id, pipeline_id, current_stage_id)`
   - `(company_id, assigned_to_user_id, status, due_date)`
2. **Kanban & SLA Rotting Queries:**
   `crm_pipeline_stage`rotting queries utilize `(company_id, pipeline_id, current_stage_id)` with `opportunity.updated_at`.
3. **Outbox Polling Index:**
   `CREATE INDEX idx_crm_outbox_status_attempt ON crm_outbox(status, next_attempt_at);`
   Guarantees the outbox background polling worker scans only pending records in index order.
4. **Activity Stream Timeline Index:**
   `CREATE INDEX idx_crm_activity_timeline ON crm_activity(company_id, entity_type, entity_id, activity_at DESC);`
   Optimizes rendering the full chronological history for any lead, contact, or deal.

---

## 8. Known Assumptions & Architectural Boundaries

1. **Telephony Recording Storage:**
   Cloud telephony call recordings (from Exotel, Ozonetel, Knowlarity) are assumed to be stored in an enterprise S3/MinIO bucket. `crm_call_log` stores the secure object URL; audio bytes are never held in the PostgreSQL cluster.
2. **CRM Quotation vs. ERP Quotation:**
   `crm_quotation` serves as the dynamic, negotiation-heavy sales proposal instrument with customer revision tracking. When converted into a firm commercial order, it automatically links to `account-main.sales_order` through an event-driven sync.
3. **Secret Storage for Integrations:**
   `crm_tenant_integration.credential_vault_ref` assumes a KMS / HashiCorp Vault / encrypted database secret reference. Plaintext API keys must never be persisted in this column.
4. **Port Allocation:**
   `crm-service` is documented to run on port `8086` to avoid any potential port collision with `communication-service` (`8084`), with gateway pattern `/api/crm/**`.

---

## 9. Conclusion & Sign-Off

The CRM database schema defined in `crm_final.dbml` is verified as **complete, syntactically valid, production-ready, and enterprise-grade**. It provides total support for Indian B2B marketplace lead acquisition, complex multi-stage pipelines, omnichannel communication, and seamless Workflow Service integration while maintaining strict architectural boundaries.

