package com.erp.workflow.callback;

import com.erp.workflow.dto.response.WorkflowCallbackLogResponse;
import com.erp.workflow.entity.WorkflowTransaction;

import java.util.List;
import java.util.UUID;

public interface WorkflowCallbackService {

    void triggerCallback(WorkflowTransaction transaction, String eventType, String comments, UUID actionByUserId, String actionByUserName);

    void retryPendingCallbacks();

    List<WorkflowCallbackLogResponse> getExhaustedCallbacks(UUID companyId);

    WorkflowCallbackLogResponse retryCallbackManually(UUID logId, UUID companyId);
}
