package com.erp.communication.notification.service;

import com.erp.communication.notification.dto.CreateNotificationRequest;
import com.erp.communication.notification.dto.UnreadCountResponse;
import com.erp.communication.notification.dto.UserNotificationResponse;
import com.erp.communication.notification.entity.UserNotification;
import com.erp.communication.notification.model.UserNotificationType;
import com.erp.communication.notification.repository.UserNotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private UserNotificationRepository notificationRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private NotificationServiceImpl notificationService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID recipientUserId = UUID.randomUUID();
    private final UUID notificationId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(notificationRepository, messagingTemplate);
    }

    @Test
    @DisplayName("createAndSendNotification should save entity and push to STOMP destinations")
    void testCreateAndSendNotificationSuccess() {
        CreateNotificationRequest request = CreateNotificationRequest.builder()
                .tenantId(tenantId)
                .recipientUserId(recipientUserId)
                .type(UserNotificationType.CHAT_MESSAGE)
                .title("New Message")
                .message("Alice: Hello!")
                .referenceId(UUID.randomUUID())
                .referenceType("DIRECT")
                .build();

        when(notificationRepository.save(any(UserNotification.class))).thenAnswer(invocation -> {
            UserNotification entity = invocation.getArgument(0);
            entity.setId(notificationId);
            entity.setCreatedAt(LocalDateTime.now());
            return entity;
        });

        UserNotificationResponse response = notificationService.createAndSendNotification(request);

        assertNotNull(response);
        assertEquals(notificationId, response.getId());
        assertEquals(tenantId, response.getTenantId());
        assertEquals(recipientUserId, response.getRecipientUserId());
        assertEquals(UserNotificationType.CHAT_MESSAGE, response.getType());
        assertEquals("New Message", response.getTitle());
        assertFalse(response.isRead());

        // Verify STOMP broadcast
        String expectedTopic = String.format("/topic/company.%s.user.%s.notifications", tenantId, recipientUserId);
        verify(messagingTemplate, times(1)).convertAndSend(eq(expectedTopic), any(UserNotificationResponse.class));
        verify(messagingTemplate, times(1)).convertAndSendToUser(eq(recipientUserId.toString()), eq("/queue/notifications"), any(UserNotificationResponse.class));
    }

    @Test
    @DisplayName("getUserNotifications should return paginated list")
    void testGetUserNotifications() {
        PageRequest pageRequest = PageRequest.of(0, 10);
        UserNotification notification = UserNotification.builder()
                .id(notificationId)
                .tenantId(tenantId)
                .recipientUserId(recipientUserId)
                .type(UserNotificationType.GROUP_ADDED)
                .title("Added to Group")
                .message("You were added to Sales")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationRepository.findByTenantIdAndRecipientUserIdOrderByCreatedAtDesc(tenantId, recipientUserId, pageRequest))
                .thenReturn(new PageImpl<>(List.of(notification)));

        Page<UserNotificationResponse> result = notificationService.getUserNotifications(tenantId, recipientUserId, false, pageRequest);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(notificationId, result.getContent().get(0).getId());
    }

    @Test
    @DisplayName("getUnreadCount should return unread notification count")
    void testGetUnreadCount() {
        when(notificationRepository.countByTenantIdAndRecipientUserIdAndIsReadFalse(tenantId, recipientUserId)).thenReturn(5L);

        UnreadCountResponse result = notificationService.getUnreadCount(tenantId, recipientUserId);

        assertNotNull(result);
        assertEquals(5L, result.getUnreadCount());
    }

    @Test
    @DisplayName("markAsRead should update isRead to true")
    void testMarkAsRead() {
        UserNotification notification = UserNotification.builder()
                .id(notificationId)
                .tenantId(tenantId)
                .recipientUserId(recipientUserId)
                .type(UserNotificationType.CHAT_MESSAGE)
                .title("Title")
                .message("Message")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationRepository.findByIdAndTenantIdAndRecipientUserId(notificationId, tenantId, recipientUserId))
                .thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(UserNotification.class))).thenAnswer(i -> i.getArgument(0));

        UserNotificationResponse result = notificationService.markAsRead(notificationId, tenantId, recipientUserId);

        assertNotNull(result);
        assertTrue(result.isRead());
        verify(notificationRepository, times(1)).save(notification);
    }

    @Test
    @DisplayName("markAllAsRead should call repository batch update")
    void testMarkAllAsRead() {
        when(notificationRepository.markAllAsRead(tenantId, recipientUserId)).thenReturn(3);

        int updatedCount = notificationService.markAllAsRead(tenantId, recipientUserId);

        assertEquals(3, updatedCount);
        verify(notificationRepository, times(1)).markAllAsRead(tenantId, recipientUserId);
    }
}
