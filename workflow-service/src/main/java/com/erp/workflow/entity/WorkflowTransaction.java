package com.erp.workflow.entity;

import com.erp.workflow.common.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * A running workflow instance for a specific business document.
 *
 * Key design rules:
 *  - No foreign keys to any business service database.
 *  - Business entity is identified generically via:
 *      module_name    e.g. ACCOUNT, INVENTORY, CRM
 *      entity_type    e.g. FISCAL_YEAR, STOCK_ADJUSTMENT, CUSTOMER
 *      entity_id      UUID of business entity in business DB
 *      document_type  same as entity type (or more specific)
 *      document_id    UUID of business document in business DB
 *  - callback_url: When workflow completes, Workflow Service POSTs event to this URL.
 *
 * Status flow: PENDING → IN_PROGRESS → APPROVED | REJECTED | CANCELLED | RETURNED
 */
@Entity
@Table(name = "workflow_transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTransaction extends BaseEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_definition_id", nullable = false)
    private WorkflowDefinition workflowDefinition;

    // ---- Generic business entity fields (NO FK to business DBs) ----

    /** ERP module: ACCOUNT, INVENTORY, CRM, PURCHASE, SALES, MANUFACTURING, HR */
    @Column(name = "module_name", length = 100)
    private String moduleName;

    /** Business entity type: FISCAL_YEAR, STOCK_ADJUSTMENT, PURCHASE_ORDER, CUSTOMER */
    @Column(name = "entity_type", length = 100)
    private String entityType;

    /** UUID of the business entity in the business service's database */
    @Column(name = "entity_id")
    private UUID entityId;

    /** Document type (usually same as entityType, kept for backward compat) */
    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType;

    /** UUID of the document in the business service's database */
    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    /** Human-readable document reference number, e.g. SA-2026-001 */
    @Column(name = "document_number", length = 100)
    private String documentNumber;

    /**
     * Callback URL that the originating business service registered.
     * Workflow service POSTs workflow events here (APPROVED, REJECTED, etc.)
     * e.g. http://account-service:8081/api/internal/workflow/callback
     */
    @Column(name = "callback_url", length = 500)
    private String callbackUrl;

    // ---- Workflow state ----

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_stage_id")
    private WorkflowStage currentStage;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "PENDING";

    @Column(name = "initiated_by", nullable = false)
    private UUID initiatedBy;

    @Column(name = "initiated_by_name")
    private String initiatedByName;

    @Column(name = "initiated_at")
    private LocalDateTime initiatedAt;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    /** Optimistic lock — prevents concurrent approval conflicts */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @OneToMany(mappedBy = "workflowTransaction", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<WorkflowTask> tasks;

    @OneToMany(mappedBy = "workflowTransaction", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<WorkflowAction> actions;
}
