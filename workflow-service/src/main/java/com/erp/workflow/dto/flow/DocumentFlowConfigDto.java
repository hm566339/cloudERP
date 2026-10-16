package com.erp.workflow.dto.flow;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentFlowConfigDto {
    private UUID id;
    private UUID companyId;
    private String moduleName;
    private String flowName;
    private String description;
    @Builder.Default
    private Boolean isActive = true;
    @Builder.Default
    private Boolean isDefault = false;
    private DocumentFlowDataDto flowData;
}
