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
public class PlatformWorkflowRolloutResultDto {

    private UUID platformTemplateId;
    private Integer platformTemplateVersion;
    private String rolloutMode;
    private int totalOrganizationsTargeted;
    private int organizationsUpdated;
    private int organizationsSkippedCustomized;
    private int organizationsFailed;
    private int totalCompaniesPropagated;

    @Builder.Default
    private List<String> details = new ArrayList<>();
}

