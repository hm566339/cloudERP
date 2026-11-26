package com.erp.communication.notification.dto;

import com.erp.communication.notification.model.UserNotificationType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationResponse {
    private UUID id;
    private UUID tenantId;
    private UUID recipientUserId;
    private UserNotificationType type;
    private String title;
    private String message;
    private UUID referenceId;
    private String referenceType;
    private boolean isRead;
    private LocalDateTime createdAt;
}
