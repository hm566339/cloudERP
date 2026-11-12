# Mark2 Cloud ERP: Enterprise CRM Architecture Analysis & System Blueprint

**Document Version:** 1.0.0  
**Status:** Approved Architecture Blueprint  
**Target Services:** `crm-service`, `workflow-service`, `account-main`, `inventory`, `communication-service`, `ERP_System` (SSO), `gateway_service`  
**Database:** PostgreSQL 15+ (`crm_db`)  

---

## 1. Executive Summary & Architectural Vision

The **Mark2 Cloud ERP** ecosystem is designed on modern distributed microservices principles, implementing domain-driven design (DDD), database-per-service isolation, asynchronous event-driven messaging, and strict multi-tenant data segregation. 

This document defines the architectural blueprint for the **Enterprise Customer Relationship Management (CRM)** module. Rather than building a monolithic or generic CRM, this architecture leverages the existing microservice infrastructure, reusing mature enterprise capabilities—such as the independent **Workflow Service**, the **Accounting & Billing Engine**, the **Inventory Master Catalog**, the **Identity & Access Management (SSO)** system, and the **Communication Service**.

The CRM is purpose-built to address the operational and regulatory realities of B2B and B2C enterprises in India and global markets, supporting multi-marketplace lead acquisition (IndiaMART, TradeIndia, Justdial, Sulekha, ExportersIndia), paid ad platforms (Meta Lead Ads, Google Ads, LinkedIn), cloud telephony (Exotel, Ozonetel), WhatsApp Business API, complex sales pipelines, quotation revisions with GST compliance, and seamless transition to ERP sales orders.

---

## 2. Existing Project Architecture Review

### 2.1 Microservice Landscape

| Microservice | Default Port | Database | Primary Responsibility | Reused in CRM? |
|---|---|---|---|---|
| **`ERP_System` (auth_service)** | `8090` | `sso` | Multi-tenancy (Organizations & Companies), Users, Roles, Dynamic Module Routes, Feature-Based Access Control (FBAC). | **Yes** (Tenant isolation, User identity, RBAC) |
| **`gateway_service`** | `8080` / `8088` | *None* | Spring Cloud Gateway with dynamic route discovery from SSO (`/api/sso/module-routes/internal/routes`). | **Yes** (Routes `/api/crm/**` to CRM service) |
| **`workflow-service`** | `8083` | `workflow_db` | Generic, company-scoped document approval engine, multi-stage approvals, SpEL rules, SLA escalations, immutable audit trails. | **Yes** (Quotation, Discount, and Onboarding approvals) |
| **`account-main`** | `8080` / `8081` | `account` | General Ledger, Chart of Accounts, Invoicing, Customer master, Official ERP Quotations, Sales Orders, GST tax engine. | **Yes** (Customer onboarding sync, ERP Sales Order generation) |
| **`inventory`** | `8082` | `inventory` | Master Product catalog (`product`), price lists (`product_price`), UOMs, stock, serials, batches. | **Yes** (Product lookup for deals & quotation lines) |
| **`communication-service`**| `8084` | `communication_db` | Asynchronous notification worker (RabbitMQ consumers, Thymeleaf HTML templates, SMTP email, WhatsApp Cloud dispatch). | **Yes** (Outbound dispatch of notification templates) |
| **`manufacturing`** | `8085` | `manufacturing` | BOMs, Production Orders, WIP tracking, Transactional Outbox pattern. | *Reference only* (Outbox architectural pattern) |
| **`ERP`** | `3000` / `5173` | *Frontend* | Vite + React + Redux Toolkit + Tailwind UI application. | **Yes** (Consumes CRM REST APIs) |

### 2.2 Core Technical Patterns Identified in Codebase

1. **Multi-Tenancy Convention:**
   - Every tenant-scoped business record contains `company_id UUID NOT NULL`.
   - `organization_id` governs holding/enterprise groups in SSO; each organization contains one or more `company` records.
   - All query predicates, repository lookups, and unique constraints in business services are composite with `company_id` to guarantee tenant isolation.

2. **Universal Auditing (`BaseEntity`):**
   Across `account-main`, `workflow-service`, and `manufacturing`, all JPA entities inherit the standard audit superclass:
   - `created_at` (`timestamp`, default `CURRENT_TIMESTAMP`)
   - `updated_at` (`timestamp`, default `CURRENT_TIMESTAMP`)
   - `created_by` (`uuid`)
   - `created_by_username` (`varchar(255)`)
   - `updated_by` (`uuid`)
   - `updated_by_username` (`varchar(255)`)
   - `is_deleted` (`boolean`, default `false`)
   - `deleted_by` (`uuid`)
   - `deleted_by_username` (`varchar(255)`)
   - `deleted_at` (`timestamp`)

3. **Decoupled Cross-Service Integration:**
   - Microservices maintain **zero foreign keys across database boundaries**.
   - Foreign services are referenced via UUID identifiers (e.g. `owner_user_id`, `product_id`, `workflow_transaction_id`) and logical codes.
   - Cross-service transactions are orchestrated via REST APIs and asynchronous RabbitMQ events using the **Transactional Outbox Pattern**.

4. **Dynamic Gateway Routing:**
   - The Spring Cloud Gateway does not hardcode static routing tables in `application.yml`.
   - `ModuleBootstrap.java` registers modules and route patterns in `ERP_System`. CRM is pre-registered as:
     `bootstrapModuleIfMissing("CRM", "crm-service.local", "/api/crm/**", "http://crm-service:8084");`
     *(Note: in production docker-compose, `crm-service` is assigned dedicated port `8086` to avoid collision with `communication-service`).*

---

## 3. CRM Microservice Boundaries & Responsibilities

The CRM module is encapsulated within a dedicated microservice: `crm-service`.

```
               ┌────────────────────────────────────────────────────────┐
               │                   API GATEWAY (:8080)                  │
               │               Route Pattern: /api/crm/**               │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CRM-SERVICE (:8086)                                         │
│                                                                                               │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌───────────────────────────────┐  │
│  │   Lead Ingestion Engine │  │   Lead Management Core  │  │  Account & Contact Management │  │
│  │  • IndiaMART, Justdial  │  │  • Deduplication Engine │  │  • B2B Accounts, Hierarchy    │  │
│  │  • Meta, Google, IVR    │  │  • Scoring & Assignment │  │  • Multi-contact, GSTIN/PAN   │  │
│  │  • Webhook Idempotency  │  │  • Round-Robin Pool     │  │  • Multiple Addresses         │  │
│  └─────────────────────────┘  └─────────────────────────┘  └───────────────────────────────┘  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌───────────────────────────────┐  │
│  │  Sales Pipeline & Deals │  │   Activity & Task Engine│  │  Omnichannel Communication    │  │
│  │  • Multiple Pipelines   │  │  • Follow-ups, Demos    │  │  • WhatsApp & Email Threads   │  │
│  │  • Stages & Rotting SLA │  │  • Activity Timelines   │  │  • Cloud Telephony Call Logs  │  │
│  │  • Weighted Forecasting │  │  • S3 Object Attachments│  │  • DPDP Consent Tracking      │  │
│  └─────────────────────────┘  └─────────────────────────┘  └───────────────────────────────┘  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌───────────────────────────────┐  │
│  │  Marketing & Attribution│  │   Automation Engine     │  │  Quotation & Sales Operations │  │
│  │  • Multi-touch (W-model)│  │  • Event Triggers       │  │  • GST Computation & Revisions│  │
│  │  • Campaign Budgets/ROI │  │  • Scheduled Delays     │  │  • Workflow Service Client    │  │
│  │  • UTM Parameter Tracking│ │  • Automated Actions    │  │  • ERP Sales Order Converter  │  │
│  └─────────────────────────┘  └─────────────────────────┘  └───────────────────────────────┘  │
│                                                                                               │
│                                   TRANSACTIONAL OUTBOX                                        │
│                                 Table: crm_outbox (JSONB)                                     │
└──────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                           │ RabbitMQ
                                           ▼
 ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
 │   ERP_System      │    │  workflow-service │    │   account-main    │    │communication-serv.│
 │  (IAM / SSO DB)   │    │  (workflow_db)    │    │   (account DB)    │    │(communication_db) │
 └───────────────────┘    └───────────────────┘    └───────────────────┘    └───────────────────┘
```

### 3.1 Domain Ownership Matrix

| Functional Domain | Owning Service | Database | Key Tables Owned |
|---|---|---|---|
| **Lead Ingestion & Connectors** | `crm-service` | `crm_db` | `crm_integration_channel`, `crm_tenant_integration`, `crm_integration_webhook_log`, `crm_lead_import_batch` |
| **Lead Qualification & Lifecycle** | `crm-service` | `crm_db` | `crm_lead`, `crm_lead_assignment_history`, `crm_lead_merge_history`, `crm_lead_score_log`, `crm_lead_tag_mapping`, `crm_lead_product_interest` |
| **Accounts & Contacts** | `crm-service` | `crm_db` | `crm_account`, `crm_contact`, `crm_address`, `crm_account_contact_relation` |
| **Sales Pipelines & Deals** | `crm-service` | `crm_db` | `crm_sales_pipeline`, `crm_pipeline_stage`, `crm_opportunity`, `crm_opportunity_item`, `crm_opportunity_competitor`, `crm_opportunity_stage_history` |
| **Tasks, Follow-ups & S3 Files** | `crm-service` | `crm_db` | `crm_activity`, `crm_task`, `crm_attachment` |
| **Omnichannel Messaging** | `crm-service` | `crm_db` | `crm_conversation`, `crm_message`, `crm_call_log`, `crm_consent_log` |
| **Marketing Attribution** | `crm-service` | `crm_db` | `crm_campaign`, `crm_lead_attribution` |
| **Automation Rules & Pool** | `crm-service` | `crm_db` | `crm_automation_rule`, `crm_automation_action`, `crm_automation_execution_log`, `crm_round_robin_pool`, `crm_round_robin_member` |
| **Quotation Operations** | `crm-service` | `crm_db` | `crm_quotation`, `crm_quotation_item`, `crm_quotation_revision` |
| **Event Outbox** | `crm-service` | `crm_db` | `crm_outbox` |
| **Approval Workflows** | `workflow-service` | `workflow_db` | `workflow_definition`, `workflow_stage`, `workflow_transaction`, `workflow_task` *(CRM does NOT duplicate these)* |
| **Customer Master & Billing** | `account-main` | `account` | `customer`, `customer_address`, `sales_order`, `sales_invoice`, `hsn_sac_master` |
| **Inventory & Products** | `inventory` | `inventory` | `product`, `product_price`, `product_category`, `unit_of_measure` |
| **Notification Dispatch** | `communication-service`| `communication_db` | `notification_request`, `notification_delivery` |

---

## 4. Reusing the Existing Workflow Service

The project's `workflow-service` is an independent, configuration-driven business approval engine. It exposes a generic **External Document Linkage** architecture:

```
workflow_transaction {
  module_name:     'CRM'
  entity_type:     'QUOTATION' | 'DISCOUNT_APPROVAL' | 'CUSTOMER_ONBOARDING'
  entity_id:       <CRM UUID>
  document_type:   'QUOTATION'
  document_id:     crm_quotation.id
  document_number: crm_quotation.quotation_number
  callback_url:    'http://crm-service:8086/api/crm/workflows/callback'
}
```

### 4.1 Strict Boundaries: CRM Automation Engine vs. Workflow Service

A critical design requirement is avoiding overlap between CRM Automation and the Workflow Service:

1. **CRM Automation Engine (`crm_automation_rule`):**
   - **Purpose:** Fast, internal, non-blocking operational automations.
   - **Examples:**
     - When an IndiaMART lead arrives from Maharashtra, auto-assign it via Round Robin to the Pune sales team.
     - When a lead score reaches 80, automatically create a high-priority "Schedule Technical Demo" task.
     - When a lead is marked "Lost", automatically queue an educational nurture email in 30 days.
   - **Characteristics:** Rule-based, immediate or delayed actions, no multi-level human approval gates.

2. **Workflow Service (`workflow-service`):**
   - **Purpose:** Formal multi-level governance, financial compliance, and approval hierarchies.
   - **Examples:**
     - Quotation discount exceeds 15% (requires Sales Manager and Financial Controller approval).
     - Commercial quotation total exceeds ₹50,00,000 (requires VP Sales and MD sign-off).
     - Converting an enterprise prospect into an official credit-approved ERP customer account.
   - **Characteristics:** Sequential/parallel human tasks, SpEL permission evaluation, SLA escalation, return to initiator, delegation, legal/audit sign-offs.

### 4.2 Quotation Approval Lifecycle via Workflow Service

```
┌─────────────┐               ┌─────────────┐               ┌──────────────────┐
│ Sales Rep   │               │ crm-service │               │ workflow-service │
└──────┬──────┘               └──────┬──────┘               └────────┬─────────┘
       │                             │                               │
       │ 1. Submit Quote (Discount >15%)                             │
       ├────────────────────────────>│                               │
       │                             │ 2. Set status PENDING_APPROVAL│
       │                             │ 3. POST /api/v1/workflow/transactions
       │                             ├──────────────────────────────>│
       │                             │                               │ 4. Evaluate Stage Approvers
       │                             │                               │ 5. Assign Task to Manager
       │                             │ 6. Return transaction_id      │
       │                             │<──────────────────────────────┤
       │                             │                               │
       │ 7. UI displays "Pending Approval"                           │
       │<────────────────────────────┤                               │
       │                             │                               │
       │                             │                               │ 8. Approver clicks "Approve"
       │                             │ 9. POST callback_url          │
       │                             │    { status: 'APPROVED' }     │
       │                             │<──────────────────────────────┤
       │                             │                               │
       │                             │ 10. Set status 'APPROVED'     │
       │                             │ 11. Allow quote dispatch      │
       │                             │ 12. Publish CRM Outbox Event  │
```

---

## 5. Multi-Tenant Architecture & Data Isolation

### 5.1 Partitioning and Tenant Scoping Strategy

Every entity in `crm_db` strictly enforces tenant isolation:

1. **Mandatory Tenant Foreign Key:**
   All tables containing enterprise data feature `company_id uuid not null`. This matches the exact `company.id` from `ERP_System` (SSO).
2. **Tenant-Scoped Unique Constraints:**
   All natural keys and unique identifiers are composite with `company_id`. For example:
   - `crm_lead`: `UNIQUE(company_id, lead_code)`
   - `crm_lead`: `UNIQUE(company_id, normalized_phone)` (where dedup is strictly enforced)
   - `crm_account`: `UNIQUE(company_id, account_code)`
   - `crm_quotation`: `UNIQUE(company_id, quotation_number, revision_number)`
   - `crm_sales_pipeline`: `UNIQUE(company_id, pipeline_code)`
3. **Index Optimization for Multi-Tenant Queries:**
   All performance-critical B-Tree indexes place `company_id` as the leading column:
   - `CREATE INDEX idx_crm_lead_owner ON crm_lead(company_id, owner_user_id, is_converted);`
   - `CREATE INDEX idx_crm_opp_stage ON crm_opportunity(company_id, pipeline_id, current_stage_id);`
   - `CREATE INDEX idx_crm_task_due ON crm_task(company_id, assigned_to_user_id, status, due_date);`
4. **Security Filter Context:**
   The `crm-service` will incorporate a tenant resolution filter (identical to `OrganizationContextFilter` in `ERP_System`) that extracts `X-Company-Id` from HTTP headers or validated JWT claims and binds it to thread-local `RequestContext`. All JPA queries automatically inject `WHERE company_id = :currentCompanyId`.

---

## 6. Lead Ingestion & Integration Engine

### 6.1 Multi-Marketplace Ingestion Architecture

Indian B2B marketplaces and global ad platforms operate with varying delivery mechanisms:

```
               INBOUND WEBHOOKS                              SCHEDULED PULL WORKERS
    ┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐
    │ • IndiaMART Push API                │         │ • TradeIndia Polling API            │
    │ • Justdial Lead Push                │         │ • Sulekha Inquiries API             │
    │ • Meta Lead Ads Webhook             │         │ • ExportersIndia Poller             │
    │ • Google Lead Form Webhook          │         │ • Google Ads Form Asset Sync        │
    │ • Exotel IVR / Missed Call Webhook  │         │                                     │
    └──────────────────┬──────────────────┘         └──────────────────┬──────────────────┘
                       │                                               │
                       ▼                                               ▼
     POST /api/crm/integrations/webhook/{slug}             CrmIntegrationScheduledJob
                       │                                               │
                       └───────────────────────┬───────────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │    Raw Webhook Capture Table     │
                              │   crm_integration_webhook_log    │
                              │  • Exact payload preserved       │
                              │  • SHA-256 Idempotency Hash      │
                              │  • Immediate 200 OK Response     │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼ (Async Ingestion Worker)
                              ┌──────────────────────────────────┐
                              │      Normalization Engine        │
                              │  • Maps provider JSON to CRM DTO │
                              │  • Normalizes Phone (E.164)      │
                              │  • Normalizes Email (lowercase)  │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │       Deduplication Engine       │
                              │  • Check company + norm_phone    │
                              │  • Check company + norm_email    │
                              │  • If duplicate: link or update  │
                              │  • If unique: INSERT crm_lead    │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │   Qualification & Auto-Assign    │
                              │  • Calculate Lead Score          │
                              │  • Evaluate Automation Rules     │
                              │  • Round-Robin Pool Assignment   │
                              │  • Emit RabbitMQ Outbox Event    │
                              └──────────────────────────────────┘
```

### 6.2 Guaranteed Idempotency & Fault Tolerance

1. **SHA-256 Payload Hash:**
   Before processing any incoming lead event, the system computes a SHA-256 hash of `company_id + provider_code + external_event_id + raw_payload`.
   `crm_integration_webhook_log` enforces `UNIQUE(company_id, idempotency_hash)`.
2. **Duplicate Detection:**
   If a marketplace re-sends an identical lead query (common with IndiaMART retry policies), the webhook endpoint immediately returns `HTTP 200 OK {"status": "DUPLICATE_ACKNOWLEDGED"}` without creating duplicate lead records or skewing analytics.
3. **Dead Letter & Retry:**
   Failed payload normalizations are logged with `processing_status = 'FAILED'`, preserving the raw payload for administrative inspection, schema mapping adjustments, and re-processing.

---

## 7. Quotation to ERP Sales Order Synchronization

A major strength of this CRM design is its seamless bridge into `account-main` without data duplication:

1. **CRM Quotation Drafting:**
   - The sales representative crafts the quotation in `crm-service`, pulling product items, prices, and HSN codes from `inventory`.
   - GST calculations (CGST, SGST, IGST) are calculated based on `place_of_supply_state_code` vs. the selling company's state.
2. **Workflow Governance:**
   - If the quotation discount exceeds the configured threshold (e.g. 15%), it is routed through `workflow-service`.
3. **Conversion to ERP Sales Order:**
   - Once the client accepts the quote, the user clicks **"Convert to Sales Order"**.
   - `crm-service` publishes a `QUOTATION_CONVERTED_TO_ORDER` event to the `crm_outbox`.
   - `account-main` consumes the event, verifies customer master status (auto-onboarding the customer if not already present in `account-main.customer`), creates `sales_order` and `sales_order_item`, and returns the created `so_number` and `so_id`.
   - `crm-service` updates `crm_quotation.account_main_sales_order_id` and transitions the quotation status to `CONVERTED_TO_ORDER`.

---

## 8. Summary of Architectural Guarantees

| Requirement | Implementation Mechanism |
|---|---|
| **Zero Monolithic Bloat** | Standalone `crm_db` database; independent microservice container. |
| **Zero FK Violations** | Cross-service entities linked solely via UUID identifiers and event contracts. |
| **No Duplicate Approval Engines**| Reuses existing `workflow-service` for multi-stage human approval hierarchies. |
| **No Large Files in Postgres** | `crm_attachment` stores secure S3/MinIO presigned URLs and metadata. |
| **At-Least-Once Delivery** | Reliable RabbitMQ publishing via `crm_outbox` transactional outbox table. |
| **Statutory Indian Compliance**| Full support for 15-digit GSTIN, 10-digit PAN, HSN/SAC codes, and 2-digit state tax splitting. |
| **Data Privacy (DPDP Act 2023)**| Dedicated `crm_consent_log` capturing opt-in/opt-out across WhatsApp, Email, SMS, and Voice. |

