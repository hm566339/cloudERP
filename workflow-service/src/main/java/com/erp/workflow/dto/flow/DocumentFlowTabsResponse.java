package com.erp.workflow.dto.flow;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentFlowTabsResponse {
    private UUID companyId;
    private String moduleName;
    private String flowName;
    private boolean isCustomFlow;
    private List<DocumentFlowTabItemDto> tabs;
}
