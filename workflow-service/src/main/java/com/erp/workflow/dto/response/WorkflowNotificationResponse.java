package com.erp.workflow.dto.response;

import com.erp.workflow.enums.WorkflowChannel;
import com.erp.workflow.enums.WorkflowNotificationType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowNotificationResponse {

    private UUID id;
    private UUID companyId;
    private UUID workflowTransactionId;
    private UUID workflowTaskId;
    private UUID recipientUserId;
    private WorkflowNotificationType notificationType;
    private String title;
    private String message;
    private Boolean isRead;
    private LocalDateTime readAt;
    private WorkflowChannel channel;
    private String deliveryStatus;
    private LocalDateTime createdAt;
}
