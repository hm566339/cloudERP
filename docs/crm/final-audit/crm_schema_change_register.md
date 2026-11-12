# Mark2 Cloud ERP: CRM Database Schema Change Register

**Document Version:** 2.0.0 (Project-Specific Final Edition)  
**Authoritative Schema:** [`docs/crm/crm_final_corrected.dbml`](file:///d:/final2/finalcode1/finalcode1/deploy-project/docs/crm/crm_final_corrected.dbml)  
**Authoritative DDL:** [`docs/crm/crm_postgres.sql`](file:///d:/final2/finalcode1/finalcode1/deploy-project/docs/crm/crm_postgres.sql)  
**Auditor Roles:** Senior Database Architect, PostgreSQL Engineer, CRM Domain Architect  
**Policy:** Strictly Project-Specific Justification Policy (No generic changes)  
**Date:** November 2026  

---

## 1. Project-Specific Change Policy & Governance

In accordance with enterprise database governance standards, every change recorded in this register is strictly justified by at least one of the following criteria:
1. An explicit project requirement from Mark2 ERP specifications.
2. An API contract or frontend requirement.
3. A documented business workflow (e.g. Workflow Service integration, Quotation-to-Sales-Order conversion).
4. An architectural requirement (Microservices Database-Per-Service, multi-tenant isolation).
5. A verified database integrity issue (foreign key constraint violations, duplicate PKs).
6. A demonstrated query performance requirement (queue polling throughput, B-Tree range scans).

### Classification Taxonomy:
* **REQUIRED:** Critical integrity, security, or constraint defects that prevent correct execution or violate multi-tenant isolation.
* **RECOMMENDED:** Architectural alignment or query performance optimizations supported by project evidence.
* **OPTIONAL:** Scalability enhancements for future high-volume phases (e.g. table partitioning at >10M rows).
* **NEEDS DECISION:** Open architectural or product questions requiring stakeholder confirmation.

---

## 2. Master Schema Change Register Table

| ID | Table | Existing Issue | Proposed Correction | Project Evidence | Risk | API / Workflow Impact | Classification |
|---|---|---|---|---|:---:|---|:---:|
| **CR-01** | `crm_lead_tag_mapping` | Lacked `company_id` and had conflicting/single-tenant primary key `(lead_id, tag_id)`. | Add `company_id uuid NOT NULL`. Establish composite primary key `(company_id, lead_id, tag_id) [pk]`. | Multi-tenant SaaS security requirement. | Low | Enhances tagging API integrity; tag lookups must include `company_id`. | **REQUIRED** |
| **CR-02** | `crm_lead_tag_mapping` | Single-column FKs to `crm_lead.id` and `crm_tag.id` permitted cross-tenant tag linkage. | Enforce composite foreign keys `(company_id, lead_id) -> crm_lead(company_id, id)` and `(company_id, tag_id) -> crm_tag(company_id, id)`. | Database-level tenant boundary isolation requirement. | Low | Transparent to API; prevents invalid cross-tenant tag assignments. | **REQUIRED** |
| **CR-03** | `crm_account_contact_relation` | Unique constraint was global `(account_id, contact_id)` instead of tenant-scoped. | Enforce tenant-scoped composite unique constraint `(company_id, account_id, contact_id) [unique, name: 'uq_crm_acc_contact_rel']`. | Multi-tenant relational integrity model. | Low | Backward-compatible; allows same contact to associate with accounts across tenants if needed. | **REQUIRED** |
| **CR-04** | `crm_account_contact_relation` | Single-column FKs permitted linking Tenant A's account with Tenant B's contact. | Enforce composite foreign keys `(company_id, account_id) -> crm_account(company_id, id)` and `(company_id, contact_id) -> crm_contact(company_id, id)`. | Multi-tenant data integrity audit finding. | Low | Guarantees account-contact associations belong to the same company. | **REQUIRED** |
| **CR-05** | `crm_lead`, `crm_tag`, `crm_account`, `crm_contact` | Parent tables lacked composite unique keys on `(company_id, id)`. | Add `(company_id, id) [unique]` constraints to all 4 parent tables. | PostgreSQL composite foreign key requirement. | Low | Zero negative impact; creates supporting composite unique index in PostgreSQL. | **REQUIRED** |
| **CR-06** | `crm_outbox` | Duplicate `unique` on column and index; global uniqueness prevented tenant-scoped deduplication. | Remove inline `unique`; enforce composite unique constraint `(company_id, idempotency_key) [unique, name: 'uq_crm_outbox_company_idempotency']`. | Parity with `manufacturing_outbox` (`uk_mfg_outbox_company_idempotency`). | Low | Fixes outbox index duplication; prevents cross-tenant idempotency key collisions. | **REQUIRED** |
| **CR-07** | `crm_outbox` | Theoretical proposals to force `company_id` leading on all indexes would break worker polling. | Retain specialized index `(status, next_attempt_at) [name: 'idx_crm_outbox_status_attempt']`. | Cross-tenant RabbitMQ publishing worker polling requirement. | Low | Worker polls `WHERE status = 'PENDING' AND next_attempt_at <= NOW()` across cluster in $O(\log N)$ time. | **REQUIRED** |
| **CR-08** | `crm_opportunity_item`, `crm_quotation_item`, `crm_message` | Relational FK child tables queried during joins on `parent_id` without tenant filter in JOIN clause. | Retain foreign key join indexes (`opportunity_id`, `quotation_id`, `conversation_id`) without forcing `company_id` leading. | Relational join performance and cascade delete efficiency. | Low | Maximizes relational join speeds and avoids index scan degradation. | **RECOMMENDED** |
| **CR-09** | `crm_automation_rule` | Raw curly braces in note string `{ "source": "INDIAMART" }` caused parser truncations. | Cleaned note string syntax to `source: INDIAMART, state: Maharashtra`. | DBML syntax specification & AST parser compatibility. | None | Syntax fix only; zero schema or runtime impact. | **REQUIRED** |
| **CR-10** | `crm_entity_catalog.md` | Header text indicated 42 tables while document body defined 45 tables. | Standardized total table count to 45 across all documents. | `crm_final.dbml` lines 1740-1843 (Tables 42-45: quotation, item, revision, outbox). | None | Resolves documentation ambiguity for migration engineers. | **REQUIRED** |
| **CR-11** | `crm_consent_log` | Absence of `updated_at`/`is_deleted` claimed as statutory compliance without DCL controls. | Clarified operational security blueprint: enforce `REVOKE UPDATE, DELETE` and trigger guards in production. | India's Digital Personal Data Protection (DPDP) Act 2023 Section 8/9. | Low | Ensures legal non-repudiation and prevents unauthorized consent tampering. | **RECOMMENDED** |
| **CR-12** | `crm_activity`, `crm_message`, `crm_outbox` | High-volume operational tables may exceed 20M rows in year 2+. | Architectural roadmap recommendation for range partitioning by `created_at` (monthly). | PostgreSQL VLDB high-volume maintenance guidelines. | Medium | Not needed for initial launch; planned for Phase 2 scaling. | **OPTIONAL** |
| **CR-13** | `gateway_service` | Frontend slices call legacy `/api/leads` while canonical path is `/api/crm/leads`. | Add Gateway rewrite filter: `RewritePath=/api/leads(?<segment>/?.*), /api/crm/leads${segment}`. | Frontend code inspection (`ERP/src/api/sales-crm/crm.api.js`). | Low | Guarantees seamless backward compatibility between frontend and backend. | **RECOMMENDED** |

---

## 3. Detailed Change Impact & Verification

### 3.1 Verification of Applied REQUIRED Changes
1. **CR-01 & CR-02 (`crm_lead_tag_mapping`):**
   - Verified that `company_id uuid NOT NULL` is declared as the first column.
   - Primary key is verified as `(company_id, lead_id, tag_id)`.
   - Reverse lookup index is verified as `(company_id, tag_id)`.
   - Composite foreign keys verified against parent unique constraints on `crm_lead(company_id, id)` and `crm_tag(company_id, id)`.
2. **CR-03 & CR-04 (`crm_account_contact_relation`):**
   - Verified composite unique index `(company_id, account_id, contact_id)`.
   - Reverse lookup index verified as `(company_id, contact_id)`.
   - Composite foreign keys verified against `crm_account(company_id, id)` and `crm_contact(company_id, id)`.
3. **CR-05 (Parent Unique Constraints):**
   - Verified that `crm_lead`, `crm_tag`, `crm_account`, and `crm_contact` all possess an explicit composite unique constraint on `(company_id, id)`.
4. **CR-06 & CR-07 (`crm_outbox`):**
   - Verified that `idempotency_key` has no inline `unique` modifier.
   - Verified composite unique constraint `(company_id, idempotency_key)`.
   - Verified queue worker index `(status, next_attempt_at)` is intact.

### 3.2 Backward-Compatibility & Migration Assessment
* **Schema Additions:** The addition of `company_id` on junction tables and composite unique constraints on parent tables is **100% additive and backward-compatible** for new databases.
* **API Impact:** All CRM APIs transmit `X-Company-Id` in request headers. Service controllers extract this context and populate `company_id` automatically during persistence. No frontend contract breaks occur.
