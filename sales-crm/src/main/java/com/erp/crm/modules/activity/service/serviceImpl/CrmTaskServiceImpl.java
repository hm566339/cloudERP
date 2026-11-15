package com.erp.crm.modules.activity.service.serviceImpl;

import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.activity.dto.request.TaskRequest;
import com.erp.crm.modules.activity.dto.response.TaskResponse;
import com.erp.crm.modules.activity.entity.CrmTask;
import com.erp.crm.modules.activity.enums.TaskStatus;
import com.erp.crm.modules.activity.repository.CrmTaskRepository;
import com.erp.crm.modules.activity.service.CrmTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrmTaskServiceImpl implements CrmTaskService {

    private final CrmTaskRepository taskRepository;

    @Override
    public TaskResponse createTask(TaskRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Creating Task: {} for {}/{}", request.getTitle(), request.getEntityType(), request.getEntityId());

        UUID assignedUser = request.getAssignedToUserId() != null ? request.getAssignedToUserId() : TenantUtils.getCurrentUserId();

        CrmTask task = CrmTask.builder()
                .entityType(request.getEntityType().toUpperCase())
                .entityId(request.getEntityId())
                .taskType(request.getTaskType())
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(TaskStatus.PENDING)
                .dueDate(request.getDueDate())
                .dueTime(request.getDueTime())
                .assignedToUserId(assignedUser)
                .createdByUserId(TenantUtils.getCurrentUserId())
                .reminderAt(request.getReminderAt())
                .reminderSent(false)
                .build();
        task.setCompanyId(companyId);

        return mapToResponse(taskRepository.save(task));
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmTask task = taskRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return mapToResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskResponse> getAllTasks(UUID requestCompanyId, Pageable pageable) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return taskRepository.findByCompanyIdAndIsDeletedFalse(companyId, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksForEntity(String entityType, UUID entityId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return taskRepository.findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalse(
                companyId, entityType.toUpperCase(), entityId)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    public TaskResponse completeTask(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmTask task = taskRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedAt(LocalDateTime.now());
        return mapToResponse(taskRepository.save(task));
    }

    private TaskResponse mapToResponse(CrmTask t) {
        return TaskResponse.builder()
                .id(t.getId())
                .companyId(t.getCompanyId())
                .entityType(t.getEntityType())
                .entityId(t.getEntityId())
                .taskType(t.getTaskType())
                .title(t.getTitle())
                .description(t.getDescription())
                .priority(t.getPriority())
                .status(t.getStatus())
                .dueDate(t.getDueDate())
                .dueTime(t.getDueTime())
                .completedAt(t.getCompletedAt())
                .assignedToUserId(t.getAssignedToUserId())
                .createdByUserId(t.getCreatedByUserId())
                .reminderAt(t.getReminderAt())
                .reminderSent(t.getReminderSent())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}

