package com.erp.workflow.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowPermittedActions {

    private boolean canSubmit;
    private boolean canApprove;
    private boolean canReject;
    private boolean canReturn;
    private boolean canDelegate;
    private boolean canCancel;
    private boolean canAddComment;
    private boolean canUploadAttachment;
    private boolean isApprover;
    private boolean isInitiator;
    private boolean isSystemAdmin;
    private List<String> availableActions;
}
