package com.erp.crm.modules.activity.service;

import com.erp.crm.modules.activity.dto.request.TaskRequest;
import com.erp.crm.modules.activity.dto.response.TaskResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CrmTaskService {

    TaskResponse createTask(TaskRequest request, UUID requestCompanyId);

    TaskResponse getTaskById(UUID id, UUID requestCompanyId);

    Page<TaskResponse> getAllTasks(UUID requestCompanyId, Pageable pageable);

    List<TaskResponse> getTasksForEntity(String entityType, UUID entityId, UUID requestCompanyId);

    TaskResponse completeTask(UUID id, UUID requestCompanyId);
}

