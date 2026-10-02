package com.erp.workflow.entity;

import com.erp.workflow.common.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Defines a workflow type (e.g., STOCK_ADJUSTMENT_APPROVAL).
 * Scoped to a company. A workflow_code + version must be unique per company.
 * module_name identifies which ERP module owns this definition.
 */
@Entity
@Table(name = "workflow_definition")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowDefinition extends BaseEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    /** Unique code for this workflow type, e.g. FISCAL_YEAR_APPROVAL */
    @Column(name = "workflow_code", nullable = false, length = 100)
    private String workflowCode;

    @Column(name = "workflow_name", nullable = false)
    private String workflowName;

    /**
     * The ERP module that owns this definition.
     * e.g. ACCOUNT, INVENTORY, CRM, PURCHASE, SALES, MANUFACTURING, HR
     * Informational only — no FK constraint.
     */
    @Column(name = "module_name", length = 100)
    private String moduleName;

    /**
     * The type of business document this workflow handles.
     * e.g. FISCAL_YEAR, STOCK_ADJUSTMENT, CUSTOMER, PURCHASE_ORDER
     */
    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;

    @OneToMany(mappedBy = "workflowDefinition", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<WorkflowStage> stages;

    @OneToMany(mappedBy = "workflowDefinition", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<WorkflowTransition> transitions;
}
