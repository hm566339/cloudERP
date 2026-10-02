package com.erp.workflow.controller;

import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.response.WorkflowNotificationResponse;
import com.erp.workflow.security.SecurityUtils;
import com.erp.workflow.service.WorkflowNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflow/notifications")
@RequiredArgsConstructor
@Tag(name = "Workflow Notifications", description = "User notification feed and read status management")
public class WorkflowNotificationController {

    private final WorkflowNotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get user workflow notifications")
    public ResponseEntity<ApiResponse<Page<WorkflowNotificationResponse>>> getNotifications(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            Pageable pageable) {
        UUID effectiveCompanyId = companyId != null ? companyId : SecurityUtils.getCurrentCompanyId().orElse(null);
        UUID effectiveUserId = userId != null ? userId : SecurityUtils.getCurrentUserId().orElse(null);

        Page<WorkflowNotificationResponse> page = notificationService.getUserNotifications(
                effectiveCompanyId, effectiveUserId, unreadOnly, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read for current user")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveCompanyId = companyId != null ? companyId : SecurityUtils.getCurrentCompanyId().orElse(null);
        UUID effectiveUserId = userId != null ? userId : SecurityUtils.getCurrentUserId().orElse(null);

        notificationService.markAllAsRead(effectiveCompanyId, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notifications count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveCompanyId = companyId != null ? companyId : SecurityUtils.getCurrentCompanyId().orElse(null);
        UUID effectiveUserId = userId != null ? userId : SecurityUtils.getCurrentUserId().orElse(null);

        long count = notificationService.getUnreadCount(effectiveCompanyId, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
