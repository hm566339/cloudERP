package com.erp.workflow.service.impl;

import com.erp.workflow.dto.response.WorkflowNotificationResponse;
import com.erp.workflow.entity.WorkflowNotification;
import com.erp.workflow.entity.WorkflowTask;
import com.erp.workflow.entity.WorkflowTransaction;
import com.erp.workflow.enums.WorkflowChannel;
import com.erp.workflow.enums.WorkflowNotificationType;
import com.erp.workflow.exception.ResourceNotFoundException;
import com.erp.workflow.repository.WorkflowNotificationRepository;
import com.erp.workflow.service.WorkflowNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowNotificationServiceImpl implements WorkflowNotificationService {

    private final WorkflowNotificationRepository notificationRepository;

    @Override
    @Async
    public void sendNotification(UUID companyId,
                                  WorkflowTransaction transaction,
                                  WorkflowTask task,
                                  UUID recipientUserId,
                                  WorkflowNotificationType type,
                                  String title,
                                  String message,
                                  WorkflowChannel channel) {
        if (recipientUserId == null) return;

        try {
            WorkflowChannel effectiveChannel = channel != null ? channel : WorkflowChannel.IN_APP;
            String deliveryStatus = (effectiveChannel == WorkflowChannel.IN_APP) ? "SENT" : "QUEUED";

            WorkflowNotification notif = WorkflowNotification.builder()
                    .companyId(companyId)
                    .workflowTransaction(transaction)
                    .workflowTask(task)
                    .recipientUserId(recipientUserId)
                    .notificationType(type)
                    .title(title)
                    .message(message)
                    .channel(effectiveChannel)
                    .deliveryStatus(deliveryStatus)
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build();

            notificationRepository.save(notif);
            log.info("Saved workflow notification for user: {} with channel {} and status {}", recipientUserId, effectiveChannel, deliveryStatus);
        } catch (Exception ex) {
            log.error("Failed to persist notification", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowNotificationResponse> getUserNotifications(UUID companyId, UUID userId, boolean unreadOnly, Pageable pageable) {
        Page<WorkflowNotification> page = unreadOnly
                ? notificationRepository.findByCompanyIdAndRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(companyId, userId, pageable)
                : notificationRepository.findByCompanyIdAndRecipientUserIdOrderByCreatedAtDesc(companyId, userId, pageable);

        return page.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId) {
        WorkflowNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID companyId, UUID userId) {
        // Implementation can update all unread notifications for user
        Page<WorkflowNotification> unread = notificationRepository
                .findByCompanyIdAndRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(companyId, userId, Pageable.unpaged());
        unread.forEach(n -> {
            n.setIsRead(true);
            n.setReadAt(LocalDateTime.now());
        });
        notificationRepository.saveAll(unread);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID companyId, UUID userId) {
        return notificationRepository.countByCompanyIdAndRecipientUserIdAndIsReadFalse(companyId, userId);
    }

    private WorkflowNotificationResponse mapToResponse(WorkflowNotification entity) {
        return WorkflowNotificationResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompanyId())
                .workflowTransactionId(entity.getWorkflowTransaction() != null ? entity.getWorkflowTransaction().getId() : null)
                .workflowTaskId(entity.getWorkflowTask() != null ? entity.getWorkflowTask().getId() : null)
                .recipientUserId(entity.getRecipientUserId())
                .notificationType(entity.getNotificationType())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .isRead(entity.getIsRead())
                .readAt(entity.getReadAt())
                .channel(entity.getChannel())
                .deliveryStatus(entity.getDeliveryStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
