package com.erp.communication.notification.service;

import com.erp.communication.notification.dto.CreateNotificationRequest;
import com.erp.communication.notification.dto.UnreadCountResponse;
import com.erp.communication.notification.dto.UserNotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    Page<UserNotificationResponse> getUserNotifications(UUID tenantId, UUID recipientUserId, boolean unreadOnly, Pageable pageable);

    UnreadCountResponse getUnreadCount(UUID tenantId, UUID recipientUserId);

    UserNotificationResponse markAsRead(UUID id, UUID tenantId, UUID recipientUserId);

    int markAllAsRead(UUID tenantId, UUID recipientUserId);

    UserNotificationResponse createAndSendNotification(CreateNotificationRequest request);
}
