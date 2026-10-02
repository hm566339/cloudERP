package com.erp.workflow.service;

import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.response.WorkflowNotificationResponse;
import com.erp.workflow.entity.WorkflowTask;
import com.erp.workflow.entity.WorkflowTransaction;
import com.erp.workflow.enums.WorkflowChannel;
import com.erp.workflow.enums.WorkflowNotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WorkflowNotificationService {

    void sendNotification(UUID companyId,
                          WorkflowTransaction transaction,
                          WorkflowTask task,
                          UUID recipientUserId,
                          WorkflowNotificationType type,
                          String title,
                          String message,
                          WorkflowChannel channel);

    Page<WorkflowNotificationResponse> getUserNotifications(UUID companyId, UUID userId, boolean unreadOnly, Pageable pageable);

    void markAsRead(UUID notificationId);

    void markAllAsRead(UUID companyId, UUID userId);

    long getUnreadCount(UUID companyId, UUID userId);
}
