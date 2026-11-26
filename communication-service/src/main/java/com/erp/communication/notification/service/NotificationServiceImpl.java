package com.erp.communication.notification.service;

import com.erp.communication.exception.InvalidRequestException;
import com.erp.communication.notification.dto.CreateNotificationRequest;
import com.erp.communication.notification.dto.UnreadCountResponse;
import com.erp.communication.notification.dto.UserNotificationResponse;
import com.erp.communication.notification.entity.UserNotification;
import com.erp.communication.notification.repository.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final UserNotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional(readOnly = true)
    public Page<UserNotificationResponse> getUserNotifications(UUID tenantId, UUID recipientUserId, boolean unreadOnly, Pageable pageable) {
        if (tenantId == null) {
            throw new InvalidRequestException("tenantId is required");
        }
        if (recipientUserId == null) {
            throw new InvalidRequestException("recipientUserId is required");
        }

        Page<UserNotification> page = unreadOnly
                ? notificationRepository.findByTenantIdAndRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(tenantId, recipientUserId, pageable)
                : notificationRepository.findByTenantIdAndRecipientUserIdOrderByCreatedAtDesc(tenantId, recipientUserId, pageable);

        return page.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(UUID tenantId, UUID recipientUserId) {
        if (tenantId == null || recipientUserId == null) {
            return new UnreadCountResponse(0);
        }
        long count = notificationRepository.countByTenantIdAndRecipientUserIdAndIsReadFalse(tenantId, recipientUserId);
        return new UnreadCountResponse(count);
    }

    @Override
    @Transactional
    public UserNotificationResponse markAsRead(UUID id, UUID tenantId, UUID recipientUserId) {
        if (id == null) {
            throw new InvalidRequestException("Notification ID is required");
        }
        if (tenantId == null || recipientUserId == null) {
            throw new InvalidRequestException("tenantId and recipientUserId are required");
        }

        UserNotification notification = notificationRepository.findByIdAndTenantIdAndRecipientUserId(id, tenantId, recipientUserId)
                .orElseThrow(() -> new InvalidRequestException("Notification not found: " + id));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification = notificationRepository.save(notification);
        }

        return mapToResponse(notification);
    }

    @Override
    @Transactional
    public int markAllAsRead(UUID tenantId, UUID recipientUserId) {
        if (tenantId == null || recipientUserId == null) {
            return 0;
        }
        return notificationRepository.markAllAsRead(tenantId, recipientUserId);
    }

    @Override
    @Transactional
    public UserNotificationResponse createAndSendNotification(CreateNotificationRequest request) {
        if (request == null || request.getTenantId() == null || request.getRecipientUserId() == null) {
            throw new InvalidRequestException("Invalid notification request");
        }

        UserNotification notification = UserNotification.builder()
                .id(UUID.randomUUID())
                .tenantId(request.getTenantId())
                .recipientUserId(request.getRecipientUserId())
                .type(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .referenceId(request.getReferenceId())
                .referenceType(request.getReferenceType())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        UserNotification saved = notificationRepository.save(notification);
        UserNotificationResponse response = mapToResponse(saved);

        // Real-Time STOMP Push to recipient
        broadcastNotification(saved.getTenantId(), saved.getRecipientUserId(), response);

        return response;
    }

    private void broadcastNotification(UUID tenantId, UUID recipientUserId, UserNotificationResponse response) {
        try {
            // 1. Multi-tenant company user topic
            String companyUserTopic = String.format("/topic/company.%s.user.%s.notifications", tenantId, recipientUserId);
            messagingTemplate.convertAndSend(companyUserTopic, response);

            // 2. User specific destination queue
            messagingTemplate.convertAndSendToUser(recipientUserId.toString(), "/queue/notifications", response);

            log.debug("Real-time notification pushed to user {} on topic {}", recipientUserId, companyUserTopic);
        } catch (Exception ex) {
            log.warn("Failed to push real-time STOMP notification for user {}: {}", recipientUserId, ex.getMessage());
        }
    }

    private UserNotificationResponse mapToResponse(UserNotification n) {
        return UserNotificationResponse.builder()
                .id(n.getId())
                .tenantId(n.getTenantId())
                .recipientUserId(n.getRecipientUserId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
