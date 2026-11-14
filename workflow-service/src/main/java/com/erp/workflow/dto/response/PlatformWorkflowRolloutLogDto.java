package com.erp.workflow.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformWorkflowRolloutLogDto {

    private UUID id;
    private UUID platformTemplateId;
    private Integer platformTemplateVersion;
    private String rolloutMode;
    private UUID targetOrganizationId;
    private UUID targetCompanyId;
    private String status;
    private String message;
    private UUID executedBy;
    private String executedByUsername;
    private LocalDateTime createdAt;
}

