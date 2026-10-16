package com.erp.workflow.dto.flow;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentFlowTransitionDto {
    private String sourceDocType;
    private String targetDocType;
    private String actionName;
    private String buttonLabel;
    @Builder.Default
    private boolean isAllowed = true;
    @Builder.Default
    private boolean requiresApproval = false;
    @Builder.Default
    private boolean requiresCustomerAcceptance = false;
    @Builder.Default
    private boolean autoConvert = false;
    private String conversionEndpoint;
    private String requiredPermission;
    private List<String> requiredSourceStatuses;
}
