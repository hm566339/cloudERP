package com.erp.workflow.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowUiDetailsResponse {

    private WorkflowTransactionResponse transaction;
    private WorkflowDefinitionResponse definition;
    private WorkflowDefinitionResponse.StageResponse currentStage;
    private List<WorkflowDefinitionResponse.TransitionResponse> availableTransitions;
    private WorkflowPermittedActions permittedActions;
    private List<WorkflowTaskResponse> tasks;
    private WorkflowTaskResponse currentTask;
    private List<WorkflowCommentResponse> comments;
    private List<WorkflowAttachmentResponse> attachments;
    private List<WorkflowActionResponse> auditTrail;
    private WorkflowFormSchema formSchema;
}
