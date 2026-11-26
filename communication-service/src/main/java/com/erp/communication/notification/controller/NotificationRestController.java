package com.erp.communication.notification.controller;

import com.erp.communication.exception.InvalidRequestException;
import com.erp.communication.notification.dto.CreateNotificationRequest;
import com.erp.communication.notification.dto.UnreadCountResponse;
import com.erp.communication.notification.dto.UserNotificationResponse;
import com.erp.communication.notification.service.NotificationService;
import com.erp.communication.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/communication/v1/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User In-App Notifications", description = "Real-time and persistent notification management for Mark2 ERP users")
public class NotificationRestController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get user notifications", description = "Retrieves paginated notifications for the logged-in user in current tenant")
    public ResponseEntity<Page<UserNotificationResponse>> getUserNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {

        UUID tenantId = resolveCompanyId(headerCompanyId);
        UUID userId = resolveUserId(headerUserId);

        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserNotificationResponse> response = notificationService.getUserNotifications(tenantId, userId, unreadOnly, pageRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notifications count", description = "Returns total count of unread notifications for current user")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {

        UUID tenantId = resolveCompanyId(headerCompanyId);
        UUID userId = resolveUserId(headerUserId);

        UnreadCountResponse response = notificationService.getUnreadCount(tenantId, userId);
        return ResponseEntity.ok(response);
    }

    @RequestMapping(value = "/{id}/read", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @Operation(summary = "Mark single notification as read", description = "Marks specific notification as read when clicked or viewed")
    public ResponseEntity<UserNotificationResponse> markAsRead(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {

        UUID tenantId = resolveCompanyId(headerCompanyId);
        UUID userId = resolveUserId(headerUserId);

        UserNotificationResponse response = notificationService.markAsRead(id, tenantId, userId);
        return ResponseEntity.ok(response);
    }

    @RequestMapping(value = "/read-all", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @Operation(summary = "Mark all notifications as read", description = "Marks all unread notifications for current user in current tenant as read")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {

        UUID tenantId = resolveCompanyId(headerCompanyId);
        UUID userId = resolveUserId(headerUserId);

        int count = notificationService.markAllAsRead(tenantId, userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "markedReadCount", count,
                "message", "All notifications marked as read"
        ));
    }

    @PostMapping
    @Operation(summary = "Create custom notification", description = "Internal endpoint to trigger notifications from other modules (workflows, quotes, system)")
    public ResponseEntity<UserNotificationResponse> createNotification(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @Valid @RequestBody CreateNotificationRequest request) {

        UUID tenantId = request.getTenantId() != null ? request.getTenantId() : resolveCompanyId(headerCompanyId);
        request.setTenantId(tenantId);

        UserNotificationResponse response = notificationService.createAndSendNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private UUID resolveCompanyId(UUID headerCompanyId) {
        if (headerCompanyId != null) {
            return headerCompanyId;
        }
        UUID ctxCompanyId = TenantContext.getCompanyId();
        if (ctxCompanyId != null) {
            return ctxCompanyId;
        }
        throw new InvalidRequestException("Missing required company context. Provide X-Company-Id header or authentic session");
    }

    private UUID resolveUserId(UUID headerUserId) {
        if (headerUserId != null) {
            return headerUserId;
        }
        UUID ctxUserId = TenantContext.getUserId();
        if (ctxUserId != null) {
            return ctxUserId;
        }
        throw new InvalidRequestException("Missing required user context. Provide X-User-Id header or authentic session");
    }
}
