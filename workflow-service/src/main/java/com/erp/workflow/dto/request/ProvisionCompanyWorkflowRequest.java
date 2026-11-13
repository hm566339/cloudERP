package com.erp.workflow.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProvisionCompanyWorkflowRequest {

    private UUID organizationId;

    @NotNull(message = "companyId is required")
    private UUID companyId;

    /** Specific template ID to provision. If null, the active default template for documentType is used */
    private UUID templateId;

    /** If templateId is null, documentType is used to resolve the organization's default template */
    private String documentType;

    /** Role name-to-company role ID map dynamically resolved by auth service */
    private Map<String, UUID> roleNameToIdMap;

    /** If true, overwrites even if the company workflow has been marked customized */
    @Builder.Default
    private boolean forceUpdateCustomized = false;
}

