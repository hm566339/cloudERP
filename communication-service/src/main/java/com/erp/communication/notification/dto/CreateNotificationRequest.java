package com.erp.communication.notification.dto;

import com.erp.communication.notification.model.UserNotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateNotificationRequest {

    @NotNull(message = "tenantId is required")
    private UUID tenantId;

    @NotNull(message = "recipientUserId is required")
    private UUID recipientUserId;

    @NotNull(message = "Notification type is required")
    private UserNotificationType type;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message content is required")
    private String message;

    private UUID referenceId;
    private String referenceType;
}
