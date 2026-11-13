package com.erp.workflow.dto.response;

import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgWorkflowProvisionResultDto {

    private UUID organizationId;
    private UUID templateId;
    private Integer templateVersion;
    private int totalCompanies;
    private int provisionedCount;
    private int skippedCustomizedCount;
    private int failedCount;

    @Builder.Default
    private List<OrgWorkflowProvisionLogDto> logs = new ArrayList<>();
}

