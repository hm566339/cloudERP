package com.erp.workflow.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgWorkflowProvisionLogDto {

    private UUID id;
    private UUID organizationId;
    private UUID templateId;
    private Integer templateVersion;
    private UUID companyId;
    private UUID workflowDefinitionId;
    private String status; // SUCCESS, SKIPPED_CUSTOMIZED, FAILED, RETRY_SUCCESS
    private String message;
    private LocalDateTime createdAt;
}

