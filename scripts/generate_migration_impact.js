const fs = require('fs');

const md = `# Mark2 Cloud ERP: CRM Database Migration Impact & Deployment Guide

**Document Version:** 2.0.0 (Project-Specific Final Edition)  
**Authoritative Schema:** [\`docs/crm/crm_final_corrected.dbml\`](file:///d:/final2/finalcode1/finalcode1/deploy-project/docs/crm/crm_final_corrected.dbml)  
**Authoritative DDL:** [\`docs/crm/crm_postgres.sql\`](file:///d:/final2/finalcode1/finalcode1/deploy-project/docs/crm/crm_postgres.sql)  
**Target Database:** PostgreSQL 15+ (\`crm_db\`)  
**Auditor Roles:** Senior Database Architect, PostgreSQL Engineer, CRM Domain Architect  
**Date:** November 2026  

---

## 1. Executive Overview

This migration impact document provides the technical roadmap, migration sequencing, risk mitigation protocols, and rollback procedures required to instantiate and maintain the corrected Mark2 CRM database schema in staging and production environments.

The migration encompasses **45 tables**, **29 enums**, **113 indexes** (including **85 secondary indexes**), and **52 foreign key constraints** (including **4 composite foreign keys** enforcing multi-tenant isolation).

---

## 2. Phased Migration Architecture (Flyway / Liquibase)

To prevent circular dependency deadlocks, table locking spikes, and transactional timeouts, the monolithic DDL ([\`docs/crm/crm_postgres.sql\`](file:///d:/final2/finalcode1/finalcode1/deploy-project/docs/crm/crm_postgres.sql)) must be decomposed into phased versioned migration scripts:

\`\`\`
db/migration/crm/
â”œâ”€â”€ V1_0__create_extensions_and_enums.sql
â”œâ”€â”€ V1_1__create_independent_master_tables.sql
â”œâ”€â”€ V1_2__create_core_crm_tables.sql
â”œâ”€â”€ V1_3__create_junction_and_log_tables.sql
â”œâ”€â”€ V1_4__create_parent_composite_unique_constraints.sql
â”œâ”€â”€ V1_5__create_secondary_and_worker_indexes.sql
â””â”€â”€ V1_6__create_foreign_key_constraints.sql
\`\`\`

### Phase Breakdown:
1. **Phase 1: Extensions & Enums (\`V1_0\`):**
   Instantiates \`uuid-ossp\`, \`pgcrypto\`, and all 29 custom PostgreSQL enum types (\`lead_stage\`, \`communication_channel\`, \`deal_status\`, \`outbox_status\`, etc.).
2. **Phase 2: Master & Config Tables (\`V1_1\`):**
   Creates standalone root tables: \`crm_integration_channel\` (global master), \`crm_company_setting\`, \`crm_lead_status\`, \`crm_lead_source\`, \`crm_lost_reason\`, \`crm_tag\`, \`crm_custom_field_definition\`.
3. **Phase 3: Core Domain Entities (\`V1_2\`):**
   Creates \`crm_tenant_integration\`, \`crm_lead\`, \`crm_account\`, \`crm_contact\`, \`crm_address\`, \`crm_sales_pipeline\`, \`crm_pipeline_stage\`, \`crm_opportunity\`, \`crm_campaign\`, \`crm_round_robin_pool\`, \`crm_quotation\`.
4. **Phase 4: Junction, Child & Log Tables (\`V1_3\`):**
   Creates \`crm_lead_tag_mapping\`, \`crm_account_contact_relation\`, \`crm_opportunity_item\`, \`crm_quotation_item\`, \`crm_quotation_revision\`, \`crm_activity\`, \`crm_task\`, \`crm_conversation\`, \`crm_message\`, \`crm_call_log\`, \`crm_consent_log\`, \`crm_outbox\`, and history tables.
5. **Phase 5: Parent Composite Unique Constraints (\`V1_4\`):**
   Enforces \`(company_id, id)\` unique constraints on \`crm_lead\`, \`crm_tag\`, \`crm_account\`, and \`crm_contact\`. This step must precede foreign key creation to satisfy PostgreSQL's composite FK requirement.
6. **Phase 6: Secondary Indexes (\`V1_5\`):**
   Creates all 85 secondary B-Tree indexes, including worker polling indexes (\`idx_crm_outbox_status_attempt\`, \`idx_crm_webhook_status_retry\`), chronological timeline indexes, and search indexes.
7. **Phase 7: Foreign Key Constraints (\`V1_6\`):**
   Adds all 52 foreign keys via \`ALTER TABLE ... ADD CONSTRAINT\` with explicit \`ON DELETE CASCADE\` and \`ON DELETE SET NULL\` actions.

---

## 3. Data Migration Procedures (For Existing Staging Databases)

If migrating an existing staging or developer database that contains legacy CRM records:

### 3.1 Backfilling \`company_id\` on \`crm_lead_tag_mapping\`
In legacy schemas where \`crm_lead_tag_mapping\` contained only \`(lead_id, tag_id)\`:
\`\`\`sql
-- Step 1: Add nullable column
ALTER TABLE crm_lead_tag_mapping ADD COLUMN IF NOT EXISTS company_id uuid;

-- Step 2: Backfill company_id from parent lead
UPDATE crm_lead_tag_mapping m
SET company_id = l.company_id
FROM crm_lead l
WHERE m.lead_id = l.id
  AND m.company_id IS NULL;

-- Step 3: Delete orphaned mappings with invalid lead references
DELETE FROM crm_lead_tag_mapping WHERE company_id IS NULL;

-- Step 4: Enforce NOT NULL
ALTER TABLE crm_lead_tag_mapping ALTER COLUMN company_id SET NOT NULL;

-- Step 5: Replace primary key
ALTER TABLE crm_lead_tag_mapping DROP CONSTRAINT IF EXISTS pk_crm_lead_tag_mapping;
ALTER TABLE crm_lead_tag_mapping ADD CONSTRAINT pk_crm_lead_tag_mapping PRIMARY KEY (company_id, lead_id, tag_id);
\`\`\`

### 3.2 Migrating \`crm_outbox\` Idempotency Constraint
\`\`\`sql
-- Step 1: Drop legacy global unique constraint if present
ALTER TABLE crm_outbox DROP CONSTRAINT IF EXISTS uq_crm_outbox_idempotency;
DROP INDEX IF EXISTS uq_crm_outbox_idempotency;

-- Step 2: Create tenant-scoped unique index concurrently
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_crm_outbox_company_idempotency
  ON crm_outbox (company_id, idempotency_key);
\`\`\`

### 3.3 Migrating \`crm_account_contact_relation\` Constraints
\`\`\`sql
-- Step 1: Drop old global unique constraint
ALTER TABLE crm_account_contact_relation DROP CONSTRAINT IF EXISTS uq_crm_acc_contact_rel;

-- Step 2: Add tenant-scoped composite unique constraint
ALTER TABLE crm_account_contact_relation
  ADD CONSTRAINT uq_crm_acc_contact_rel UNIQUE (company_id, account_id, contact_id);
\`\`\`

---

## 4. Backend & API Code Implementation Impact

### 4.1 Spring Boot / JPA Entity Mapping
Backend engineers implementing \`crm-service\` must configure composite keys and joint foreign key mappings:

#### 1. \`CrmLeadTagMapping\` Composite ID:
\`\`\`java
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeadTagMappingId implements Serializable {
    private UUID companyId;
    private UUID leadId;
    private UUID tagId;
}

@Entity
@Table(name = "crm_lead_tag_mapping")
public class CrmLeadTagMapping {
    @EmbeddedId
    private LeadTagMappingId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
        @JoinColumn(name = "company_id", referencedColumnName = "company_id", insertable = false, updatable = false),
        @JoinColumn(name = "lead_id", referencedColumnName = "id", insertable = false, updatable = false)
    })
    private CrmLead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
        @JoinColumn(name = "company_id", referencedColumnName = "company_id", insertable = false, updatable = false),
        @JoinColumn(name = "tag_id", referencedColumnName = "id", insertable = false, updatable = false)
    })
    private CrmTag tag;
}
\`\`\`

#### 2. \`CrmOutbox\` Entity:
\`\`\`java
@Entity
@Table(name = "crm_outbox", uniqueConstraints = {
    @UniqueConstraint(name = "uq_crm_outbox_company_idempotency", columnNames = {"company_id", "idempotency_key"})
})
public class CrmOutbox {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "idempotency_key", nullable = false, length = 255)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OutboxStatus status = OutboxStatus.PENDING;

    @Column(name = "next_attempt_at")
    private LocalDateTime nextAttemptAt;
    // ...
}
\`\`\`

### 4.2 Gateway Routing & Backward Compatibility
* In \`gateway_service/src/main/resources/application.yml\`, ensure route rewrite filters accommodate existing frontend calls:
\`\`\`yaml
spring:
  cloud:
    gateway:
      routes:
        - id: crm-service-canonical
          uri: http://crm-service:8086
          predicates:
            - Path=/api/crm/**
        - id: crm-service-legacy-leads
          uri: http://crm-service:8086
          predicates:
            - Path=/api/leads/**
          filters:
            - RewritePath=/api/leads(?<segment>/?.*), /api/crm/leads\${segment}
\`\`\`

---

## 5. Deployment Risks & Mitigation Protocols

| Risk Scenario | Probability | Impact | Mitigation Protocol |
|---|:---:|:---:|---|
| **Circular Reference Deadlock on Initial Bootstrap** | Low | High | Separate table definitions from foreign key additions (Phases \`V1_1\`–\`V1_3\` vs \`V1_6\`). |
| **Outbox Worker Polling Latency** | Low | High | Retain specialized index \`(status, next_attempt_at)\` without tenant prefix. Worker executes with \`SKIP LOCKED\` to prevent row-level lock contention. |
| **Cross-Tenant Data Leak in Tag Assignment** | Zero (Remediated) | Critical | Guaranteed eliminated by composite primary key and composite foreign keys on \`crm_lead_tag_mapping\`. |
| **Third-Party Webhook Retry Floods** | Medium | Medium | Webhooks pass through \`crm_integration_webhook_log\` with SHA-256 idempotency check on \`(company_id, idempotency_hash)\` before invoking entity creation pipelines. |
| **High Disk Bloat from Telephony / Attachments** | Low | High | Architecture strictly mandates zero binary BLOB storage in PostgreSQL. Storage columns persist S3/MinIO presigned URLs only. |

---

## 6. Rollback Procedures

If an unrecoverable failure occurs during database migration deployment, execute the reverse DDL scripts:

\`\`\`sql
-- Rollback Phase 1: Drop Foreign Key Constraints
ALTER TABLE crm_quotation_revision DROP CONSTRAINT IF EXISTS fk_crm_quotation_revision_quotation_id_52;
ALTER TABLE crm_quotation_item DROP CONSTRAINT IF EXISTS fk_crm_quotation_item_quotation_id_51;
-- ... [Drop remaining 50 FKs]

-- Rollback Phase 2: Drop Indexes & Tables
DROP TABLE IF EXISTS crm_outbox CASCADE;
DROP TABLE IF EXISTS crm_quotation_revision CASCADE;
DROP TABLE IF EXISTS crm_quotation_item CASCADE;
DROP TABLE IF EXISTS crm_quotation CASCADE;
-- ... [Drop remaining 41 tables]

-- Rollback Phase 3: Drop Custom Enum Types
DROP TYPE IF EXISTS outbox_status CASCADE;
DROP TYPE IF EXISTS quotation_status CASCADE;
-- ... [Drop remaining 27 enums]
\`\`\`

All application services can safely revert to the previous container image versions without lingering partial schema locks.
`;

fs.writeFileSync('docs/crm/crm_migration_impact.md', md, 'utf8');
fs.writeFileSync('docs/crm/final-audit/crm_migration_impact.md', md, 'utf8');
console.log('Successfully written crm_migration_impact.md');

