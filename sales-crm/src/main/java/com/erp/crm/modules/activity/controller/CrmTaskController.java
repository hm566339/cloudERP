package com.erp.crm.modules.activity.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.activity.dto.request.TaskRequest;
import com.erp.crm.modules.activity.dto.response.TaskResponse;
import com.erp.crm.modules.activity.service.CrmTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crm/tasks")
@RequiredArgsConstructor
@Tag(name = "Task & Follow-up Management", description = "Endpoints for Actionable Tasks, Demos & Reminders")
public class CrmTaskController {

    private final CrmTaskService taskService;

    @PostMapping
    @Operation(summary = "Schedule Follow-up Task / Call / Demo")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @RequestBody @Valid ApiRequest<TaskRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        TaskResponse response = taskService.createTask(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Task created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Task by ID")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        TaskResponse response = taskService.getTaskById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "List Tasks")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasks(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        if (entityType != null && entityId != null) {
            List<TaskResponse> list = taskService.getTasksForEntity(entityType, entityId, companyId);
            return ResponseEntity.ok(ApiResponse.success(list));
        }
        Page<TaskResponse> page = taskService.getAllTasks(companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Tasks fetched successfully"));
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Mark Task as Completed")
    public ResponseEntity<ApiResponse<TaskResponse>> completeTask(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        TaskResponse response = taskService.completeTask(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Task marked completed successfully"));
    }
}

