package com.erp.workflow.callback;

import com.erp.workflow.entity.WorkflowTransaction;

public interface WorkflowCallbackService {

    void triggerCallback(WorkflowTransaction transaction, String eventType, String comments, java.util.UUID actionByUserId, String actionByUserName);

    void retryPendingCallbacks();
}
