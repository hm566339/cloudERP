package com.erp.workflow.dto.flow;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentFlowTabItemDto {
    private String key;
    private String label;
    private String documentType;
    private String path;
    private String icon;
    private int order;
    private boolean enabled;
    private String requiredFeature;
    private String requiredPermission;
    private List<String> allowedRoles;
    private List<String> aliases;
    private List<DocumentFlowTransitionDto> allowedNextTransitions;
}
