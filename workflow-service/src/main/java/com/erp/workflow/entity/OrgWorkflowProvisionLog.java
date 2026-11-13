package com.erp.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Immutable audit log for default workflow provisioning and propagation.
 */
@Entity
@Table(name = "org_workflow_provision_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgWorkflowProvisionLog {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(name = "template_version", nullable = false)
    private Integer templateVersion;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "workflow_definition_id")
    private UUID workflowDefinitionId;

    @Column(name = "status", nullable = false, length = 50)
    private String status; // SUCCESS, SKIPPED_CUSTOMIZED, FAILED, RETRY_SUCCESS

    @Column(name = "message", columnDefinition = "text")
    private String message;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

