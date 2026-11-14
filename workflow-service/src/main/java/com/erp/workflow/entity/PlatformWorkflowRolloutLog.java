package com.erp.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Immutable audit log for platform workflow template rollouts across organizations.
 */
@Entity
@Table(name = "platform_workflow_rollout_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformWorkflowRolloutLog {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "platform_template_id", nullable = false)
    private UUID platformTemplateId;

    @Column(name = "platform_template_version", nullable = false)
    private Integer platformTemplateVersion;

    @Column(name = "rollout_mode", nullable = false, length = 50)
    private String rolloutMode; // NEW_ORGS_ONLY, NON_CUSTOMIZED, FORCE_ALL

    @Column(name = "target_organization_id")
    private UUID targetOrganizationId;

    @Column(name = "target_company_id")
    private UUID targetCompanyId;

    @Column(name = "status", nullable = false, length = 50)
    private String status; // SUCCESS, SKIPPED_CUSTOMIZED, FAILED, RETRY_SUCCESS

    @Column(name = "message", columnDefinition = "text")
    private String message;

    @Column(name = "executed_by")
    private UUID executedBy;

    @Column(name = "executed_by_username")
    private String executedByUsername;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

