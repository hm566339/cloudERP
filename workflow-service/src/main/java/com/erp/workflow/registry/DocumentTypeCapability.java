package com.erp.workflow.registry;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentTypeCapability {
    private String documentType;
    private String displayName;
    private String primaryModule;
    private List<String> compatibleModules;
    private boolean supportsWorkflowDefinition;
    private boolean supportsSubmission;
    private boolean supportsApproval;
    private boolean supportsRejection;
    private boolean supportsReturn;
    private boolean supportsCancellation;
    private boolean supportsCallbacks;
    private boolean supportsAutomation;
    private String defaultTargetDocType;
    private List<String> allowedTargetDocTypes;
}
