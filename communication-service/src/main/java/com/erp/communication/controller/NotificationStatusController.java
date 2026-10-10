package com.erp.communication.controller;

import com.erp.communication.dto.response.NotificationStatusResponse;
import com.erp.communication.service.NotificationQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/communication/v1/messages")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notification Status", description = "Query notification status and delivery attempt history")
public class NotificationStatusController {

    private final NotificationQueryService queryService;

    @GetMapping("/{notificationId}")
    @Operation(summary = "Get notification status", description = "Retrieves delivery status and attempt history for a specific notification ID, with tenant isolation.")
    public ResponseEntity<NotificationStatusResponse> getStatus(
            @PathVariable UUID notificationId,
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId) {
        log.info("REST: Querying notification status | id={}", notificationId);
        NotificationStatusResponse response = queryService.getNotificationStatus(notificationId, headerCompanyId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/company/{companyId}")
    @Operation(summary = "List company notifications", description = "Retrieves pageable notifications for a specific company.")
    public ResponseEntity<Page<NotificationStatusResponse>> getCompanyNotifications(
            @PathVariable UUID companyId,
            Pageable pageable) {
        log.info("REST: Querying company notifications | companyId={}", companyId);
        Page<NotificationStatusResponse> page = queryService.getCompanyNotifications(companyId, pageable);
        return ResponseEntity.ok(page);
    }
}
