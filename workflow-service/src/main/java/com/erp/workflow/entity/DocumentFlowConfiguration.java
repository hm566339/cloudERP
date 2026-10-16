package com.erp.workflow.entity;

import com.erp.workflow.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Company-specific Document Flow Configuration across all ERP modules.
 * Defines which document types are enabled, their sequence, allowed transitions,
 * and automation rules.
 */
@Entity
@Table(name = "document_flow_config", uniqueConstraints = {
        @UniqueConstraint(name = "uq_doc_flow_company_module_name", columnNames = {"company_id", "module_name", "flow_name"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentFlowConfiguration extends BaseEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "module_name", nullable = false, length = 100)
    private String moduleName;

    @Column(name = "flow_name", nullable = false, length = 150)
    private String flowName;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    /**
     * Serialized JSON containing:
     * - nodes: ordered document types, tabs, permissions
     * - transitions: allowed next documents, conditions, automation flags
     */
    @Column(name = "flow_data", nullable = false, columnDefinition = "text")
    private String flowData;
}
