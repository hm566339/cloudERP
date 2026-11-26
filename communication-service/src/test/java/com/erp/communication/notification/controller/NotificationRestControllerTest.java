package com.erp.communication.notification.controller;

import com.erp.communication.exception.GlobalExceptionHandler;
import com.erp.communication.notification.dto.CreateNotificationRequest;
import com.erp.communication.notification.dto.UnreadCountResponse;
import com.erp.communication.notification.dto.UserNotificationResponse;
import com.erp.communication.notification.model.UserNotificationType;
import com.erp.communication.notification.service.NotificationService;
import com.erp.communication.security.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NotificationRestControllerTest {

    private MockMvc mockMvc;

    @Mock
    private NotificationService notificationService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UUID tenantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID notificationId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        NotificationRestController controller = new NotificationRestController(notificationService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("GET /notifications returns paginated list with X-Company-Id and X-User-Id")
    void testGetNotifications() throws Exception {
        UserNotificationResponse response = UserNotificationResponse.builder()
                .id(notificationId)
                .tenantId(tenantId)
                .recipientUserId(userId)
                .type(UserNotificationType.CHAT_MESSAGE)
                .title("New Direct Message")
                .message("Hello there!")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationService.getUserNotifications(eq(tenantId), eq(userId), eq(false), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(response), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/communication/v1/notifications")
                        .header("X-Company-Id", tenantId.toString())
                        .header("X-User-Id", userId.toString())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(notificationId.toString()))
                .andExpect(jsonPath("$.content[0].title").value("New Direct Message"));
    }

    @Test
    @DisplayName("GET /notifications/unread-count returns unread count")
    void testGetUnreadCount() throws Exception {
        when(notificationService.getUnreadCount(tenantId, userId))
                .thenReturn(new UnreadCountResponse(4L));

        mockMvc.perform(get("/api/communication/v1/notifications/unread-count")
                        .header("X-Company-Id", tenantId.toString())
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(4));
    }

    @Test
    @DisplayName("PATCH /notifications/{id}/read marks notification as read")
    void testMarkAsRead() throws Exception {
        UserNotificationResponse response = UserNotificationResponse.builder()
                .id(notificationId)
                .tenantId(tenantId)
                .recipientUserId(userId)
                .type(UserNotificationType.CHAT_MESSAGE)
                .title("Title")
                .message("Msg")
                .isRead(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationService.markAsRead(eq(notificationId), eq(tenantId), eq(userId)))
                .thenReturn(response);

        mockMvc.perform(patch("/api/communication/v1/notifications/{id}/read", notificationId)
                        .header("X-Company-Id", tenantId.toString())
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(notificationId.toString()))
                .andExpect(jsonPath("$.read").value(true));
    }

    @Test
    @DisplayName("PATCH /notifications/read-all marks all notifications as read")
    void testMarkAllAsRead() throws Exception {
        when(notificationService.markAllAsRead(tenantId, userId)).thenReturn(7);

        mockMvc.perform(patch("/api/communication/v1/notifications/read-all")
                        .header("X-Company-Id", tenantId.toString())
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.markedReadCount").value(7));
    }

    @Test
    @DisplayName("POST /notifications creates and dispatches custom notification")
    void testCreateNotification() throws Exception {
        CreateNotificationRequest request = CreateNotificationRequest.builder()
                .tenantId(tenantId)
                .recipientUserId(userId)
                .type(UserNotificationType.SYSTEM)
                .title("System Maintenance")
                .message("Scheduled maintenance at 11 PM")
                .build();

        UserNotificationResponse response = UserNotificationResponse.builder()
                .id(notificationId)
                .tenantId(tenantId)
                .recipientUserId(userId)
                .type(UserNotificationType.SYSTEM)
                .title("System Maintenance")
                .message("Scheduled maintenance at 11 PM")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationService.createAndSendNotification(any(CreateNotificationRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/communication/v1/notifications")
                        .header("X-Company-Id", tenantId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(notificationId.toString()))
                .andExpect(jsonPath("$.type").value("SYSTEM"));
    }
}
