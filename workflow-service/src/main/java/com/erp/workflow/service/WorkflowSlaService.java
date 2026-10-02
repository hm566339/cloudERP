package com.erp.workflow.service;

import com.erp.workflow.entity.WorkflowStage;
import com.erp.workflow.entity.WorkflowTask;

import java.time.LocalDateTime;

public interface WorkflowSlaService {

    LocalDateTime calculateTaskDueDate(WorkflowStage stage);

    void checkAndEscalateOverdueTasks();
}
