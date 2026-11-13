package com.erp.workflow.entity;

import com.erp.workflow.common.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Organization-level default workflow template.
 * Scoped to an organization. When configured, all companies under the organization
 * automatically receive their own workflow instance based on this template.
 */
@Entity
@Table(name = "organization_workflow_template")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationWorkflowTemplate extends BaseEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "template_code", nullable = false, length = 100)
    private String templateCode;

    @Column(name = "template_name", nullable = false)
    private String templateName;

    @Column(name = "module_name", length = 100)
    private String moduleName;

    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Builder.Default
    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = true;

    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;

    @Column(name = "initiated_by_role_name", length = 100)
    private String initiatedByRoleName;

    @Builder.Default
    @Column(name = "customer_scope", length = 50)
    private String customerScope = "all";

    @Column(name = "approval_threshold", precision = 19, scale = 4)
    private BigDecimal approvalThreshold;

    @Builder.Default
    @Column(name = "is_approval_required")
    private Boolean isApprovalRequired = true;

    @Builder.Default
    @Column(name = "customer_acceptance")
    private Boolean customerAcceptance = false;

    @Builder.Default
    @Column(name = "auto_create_order")
    private Boolean autoCreateOrder = false;

    @Builder.Default
    @Column(name = "email_notifications")
    private Boolean emailNotifications = true;

    @Column(name = "internal_notes", columnDefinition = "text")
    private String internalNotes;

    @Builder.Default
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<OrgWorkflowTemplateStage> stages = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<OrgWorkflowTemplateTransition> transitions = new ArrayList<>();
}

