package com.erp.communication.chat.controller;

import com.erp.communication.chat.dto.*;
import com.erp.communication.chat.model.ChatActionStatus;
import com.erp.communication.chat.model.ChatChannelType;
import com.erp.communication.chat.model.ChatMessageType;
import com.erp.communication.chat.service.ChatService;
import com.erp.communication.exception.GlobalExceptionHandler;
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
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ChatRestControllerTest {

        private MockMvc mockMvc;

        @Mock
        private ChatService chatService;

        private final ObjectMapper objectMapper = new ObjectMapper();
        private final UUID companyId = UUID.randomUUID();
        private final UUID channelId = UUID.randomUUID();
        private final UUID userId = UUID.randomUUID();

        @BeforeEach
        void setUp() {
                ChatRestController controller = new ChatRestController(chatService);
                mockMvc = MockMvcBuilders.standaloneSetup(controller)
                                .setControllerAdvice(new GlobalExceptionHandler())
                                .build();
        }

        @AfterEach
        void tearDown() {
                TenantContext.clear();
        }

        @Test
        @DisplayName("POST /channels creates channel with explicit X-Company-Id")
        void testCreateChannel() throws Exception {
                ChatChannelResponse response = ChatChannelResponse.builder()
                                .id(channelId)
                                .companyId(companyId)
                                .name("Marketing & Sales")
                                .type(ChatChannelType.GROUP)
                                .build();

                when(chatService.createChannel(any(), eq(companyId), eq(userId))).thenReturn(response);

                String json = """
                                {
                                    "name": "Marketing & Sales",
                                    "type": "GROUP"
                                }
                                """;

                mockMvc.perform(post("/api/communication/v1/chat/channels")
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").value(channelId.toString()))
                                .andExpect(jsonPath("$.name").value("Marketing & Sales"));
        }

        @Test
        @DisplayName("POST /channels uses TenantContext companyId when header omitted")
        void testCreateChannelTenantContext() throws Exception {
                TenantContext.setCompanyId(companyId);
                TenantContext.setUserId(userId);

                ChatChannelResponse response = ChatChannelResponse.builder()
                                .id(channelId)
                                .companyId(companyId)
                                .name("Operations")
                                .type(ChatChannelType.GROUP)
                                .build();

                when(chatService.createChannel(any(), eq(companyId), eq(userId))).thenReturn(response);

                String json = """
                                {
                                    "name": "Operations",
                                    "type": "GROUP"
                                }
                                """;

                mockMvc.perform(post("/api/communication/v1/chat/channels")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.name").value("Operations"));
        }

        @Test
        @DisplayName("POST /channels returns 400 when companyId is missing")
        void testCreateChannelMissingCompanyId() throws Exception {
                String json = """
                                {
                                    "name": "Missing Tenant Channel",
                                    "type": "GROUP"
                                }
                                """;

                mockMvc.perform(post("/api/communication/v1/chat/channels")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.errorCode").value("INVALID_REQUEST"))
                                .andExpect(jsonPath("$.message").value(
                                                "Company ID is required (via X-Company-Id header or JWT claim)"));
        }

        @Test
        @DisplayName("GET /channels lists user channels")
        void testListChannels() throws Exception {
                ChatChannelResponse ch = ChatChannelResponse.builder()
                                .id(channelId)
                                .companyId(companyId)
                                .name("General")
                                .type(ChatChannelType.GROUP)
                                .unreadCount(3)
                                .build();

                when(chatService.getUserChannels(eq(companyId), eq(userId))).thenReturn(List.of(ch));

                mockMvc.perform(get("/api/communication/v1/chat/channels")
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].name").value("General"))
                                .andExpect(jsonPath("$[0].unreadCount").value(3));
        }

        @Test
        @DisplayName("GET /channels/{channelId}/messages retrieves paginated history")
        void testGetChannelMessages() throws Exception {
                UUID msgId = UUID.randomUUID();
                ChatMessageResponse msg = ChatMessageResponse.builder()
                                .id(msgId)
                                .companyId(companyId)
                                .channelId(channelId)
                                .content("Hello World")
                                .messageType(ChatMessageType.TEXT)
                                .createdAt(LocalDateTime.now())
                                .build();

                PageImpl<ChatMessageResponse> page = new PageImpl<>(List.of(msg), PageRequest.of(0, 50), 1);
                when(chatService.getChannelMessages(eq(channelId), eq(companyId), eq(userId), any())).thenReturn(page);

                mockMvc.perform(get("/api/communication/v1/chat/channels/{channelId}/messages", channelId)
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString())
                                .param("page", "0")
                                .param("size", "50"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].id").value(msgId.toString()))
                                .andExpect(jsonPath("$.content[0].content").value("Hello World"));
        }

        @Test
        @DisplayName("POST /channels/{channelId}/messages dispatches quotation request card")
        void testSendQuotationRequestMessage() throws Exception {
                UUID msgId = UUID.randomUUID();
                ChatMessageResponse response = ChatMessageResponse.builder()
                                .id(msgId)
                                .companyId(companyId)
                                .channelId(channelId)
                                .messageType(ChatMessageType.QUOTATION_REQUEST)
                                .actionStatus(ChatActionStatus.OPEN)
                                .content("Need quotation for Reliance Retail")
                                .metadata(Map.of("clientName", "Reliance Retail", "amount", 1200000))
                                .build();

                when(chatService.sendMessage(eq(channelId), any(), eq(companyId), eq(userId), eq("John Doe")))
                                .thenReturn(response);

                String json = """
                                {
                                    "content": "Need quotation for Reliance Retail",
                                    "messageType": "QUOTATION_REQUEST",
                                    "actionStatus": "OPEN",
                                    "metadata": {
                                        "clientName": "Reliance Retail",
                                        "amount": 1200000
                                    }
                                }
                                """;

                mockMvc.perform(post("/api/communication/v1/chat/channels/{channelId}/messages", channelId)
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString())
                                .header("X-User-Name", "John Doe")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").value(msgId.toString()))
                                .andExpect(jsonPath("$.messageType").value("QUOTATION_REQUEST"))
                                .andExpect(jsonPath("$.actionStatus").value("OPEN"))
                                .andExpect(jsonPath("$.metadata.clientName").value("Reliance Retail"));
        }

        @Test
        @DisplayName("PUT /channels/{channelId}/messages/{messageId}/status updates status")
        void testUpdateActionStatus() throws Exception {
                UUID msgId = UUID.randomUUID();
                ChatMessageResponse response = ChatMessageResponse.builder()
                                .id(msgId)
                                .companyId(companyId)
                                .channelId(channelId)
                                .messageType(ChatMessageType.QUOTATION_REQUEST)
                                .actionStatus(ChatActionStatus.COMPLETED)
                                .content("Quotation QT-2026-0099 generated")
                                .build();

                when(chatService.updateActionStatus(eq(channelId), eq(msgId), any(), eq(companyId), eq(userId), any()))
                                .thenReturn(response);

                String json = """
                                {
                                    "actionStatus": "COMPLETED",
                                    "comment": "Quotation generated and sent to customer"
                                }
                                """;

                mockMvc.perform(put("/api/communication/v1/chat/channels/{channelId}/messages/{messageId}/status",
                                channelId, msgId)
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.actionStatus").value("COMPLETED"));
        }

        @Test
        @DisplayName("POST /channels/{channelId}/read marks channel as read")
        void testMarkAsRead() throws Exception {
                mockMvc.perform(post("/api/communication/v1/chat/channels/{channelId}/read", channelId)
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString()))
                                .andExpect(status().isNoContent());

                verify(chatService).markChannelAsRead(channelId, companyId, userId);
        }

        @Test
        @DisplayName("POST /events accepts structured QUOTATION_REQUESTED event")
        void testPostQuotationRequestedEvent() throws Exception {
                UUID refId = UUID.randomUUID();
                UUID msgId = UUID.randomUUID();
                ChatMessageResponse response = ChatMessageResponse.builder()
                                .id(msgId)
                                .companyId(companyId)
                                .channelId(channelId)
                                .messageType(ChatMessageType.QUOTATION_REQUEST)
                                .referenceId(refId)
                                .actionStatus(ChatActionStatus.OPEN)
                                .content("Quotation requested: QT-2026-1001")
                                .build();

                when(chatService.handleExternalQuotationEvent(any())).thenReturn(response);

                String json = """
                                {
                                    "companyId": "%s",
                                    "eventType": "QUOTATION_REQUESTED",
                                    "channelName": "Quotations & Sales",
                                    "referenceId": "%s",
                                    "senderName": "Sales Rep",
                                    "content": "Quotation requested: QT-2026-1001",
                                    "metadata": {
                                        "quoteNumber": "QT-2026-1001",
                                        "totalAmount": 50000.00
                                    }
                                }
                                """.formatted(companyId, refId);

                mockMvc.perform(post("/api/communication/v1/chat/events")
                                .header("X-Company-Id", companyId.toString())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").value(msgId.toString()))
                                .andExpect(jsonPath("$.messageType").value("QUOTATION_REQUEST"))
                                .andExpect(jsonPath("$.actionStatus").value("OPEN"));
        }

        @Test
        @DisplayName("POST /events accepts QUOTATION_READY event and resolves companyId from body")
        void testPostQuotationReadyEventWithBodyCompanyId() throws Exception {
                UUID refId = UUID.randomUUID();
                UUID msgId = UUID.randomUUID();
                ChatMessageResponse response = ChatMessageResponse.builder()
                                .id(msgId)
                                .companyId(companyId)
                                .channelId(channelId)
                                .messageType(ChatMessageType.QUOTATION_READY)
                                .referenceId(refId)
                                .actionStatus(ChatActionStatus.COMPLETED)
                                .content("Quotation QT-2026-1001 is ready")
                                .build();

                when(chatService.handleExternalQuotationEvent(any())).thenReturn(response);

                String json = """
                                {
                                    "companyId": "%s",
                                    "eventType": "QUOTATION_READY",
                                    "referenceId": "%s",
                                    "senderName": "Accounts Team",
                                    "content": "Quotation QT-2026-1001 is ready"
                                }
                                """.formatted(companyId, refId);

                mockMvc.perform(post("/api/communication/v1/chat/events")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").value(msgId.toString()))
                                .andExpect(jsonPath("$.messageType").value("QUOTATION_READY"))
                                .andExpect(jsonPath("$.actionStatus").value("COMPLETED"));
        }

        @Test
        @DisplayName("POST /quotations/events alias also successfully dispatches external quotation event")
        void testPostQuotationEventViaAliasRoutes() throws Exception {
                UUID refId = UUID.randomUUID();
                UUID msgId = UUID.randomUUID();
                ChatMessageResponse response = ChatMessageResponse.builder()
                                .id(msgId)
                                .companyId(companyId)
                                .channelId(channelId)
                                .messageType(ChatMessageType.QUOTATION_READY)
                                .referenceId(refId)
                                .actionStatus(ChatActionStatus.COMPLETED)
                                .content("Quotation QT-2026-1002 is ready")
                                .build();

                when(chatService.handleExternalQuotationEvent(any())).thenReturn(response);

                String json = """
                                {
                                    "companyId": "%s",
                                    "eventType": "QUOTATION_READY",
                                    "referenceId": "%s",
                                    "senderName": "Accounts Team",
                                    "content": "Quotation QT-2026-1002 is ready"
                                }
                                """.formatted(companyId, refId);

                mockMvc.perform(post("/api/communication/v1/chat/quotations/events")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").value(msgId.toString()));

                mockMvc.perform(post("/api/communication/v1/chat/quotations/event")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").value(msgId.toString()));
        }

        @Test
        @DisplayName("PUT /channels/{channelId} updates channel name and description")
        void testUpdateChannel() throws Exception {
                ChatChannelResponse response = ChatChannelResponse.builder()
                                .id(channelId)
                                .companyId(companyId)
                                .name("Updated Sales & Marketing")
                                .description("Discussion of quarterly targets")
                                .type(ChatChannelType.GROUP)
                                .build();

                when(chatService.updateChannel(eq(channelId), any(), eq(companyId), eq(userId), any()))
                                .thenReturn(response);

                String json = """
                                {
                                    "name": "Updated Sales & Marketing",
                                    "description": "Discussion of quarterly targets"
                                }
                                """;

                mockMvc.perform(put("/api/communication/v1/chat/channels/{channelId}", channelId)
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(channelId.toString()))
                                .andExpect(jsonPath("$.name").value("Updated Sales & Marketing"))
                                .andExpect(jsonPath("$.description").value("Discussion of quarterly targets"));
        }

        @Test
        @DisplayName("DELETE /channels/{channelId} deletes channel and returns 204")
        void testDeleteChannel() throws Exception {
                mockMvc.perform(delete("/api/communication/v1/chat/channels/{channelId}", channelId)
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString()))
                                .andExpect(status().isNoContent());

                verify(chatService, times(1)).deleteChannel(eq(channelId), eq(companyId), eq(userId), any());
        }

        @Test
        @DisplayName("GET /channels/{channelId}/members returns list of channel members")
        void testGetChannelMembers() throws Exception {
                ChatMemberResponse member = ChatMemberResponse.builder()
                                .id(UUID.randomUUID())
                                .channelId(channelId)
                                .companyId(companyId)
                                .userId(userId)
                                .userName("Rohit Sharma")
                                .role(com.erp.communication.chat.model.ChatMemberRole.ADMIN)
                                .build();

                when(chatService.getChannelMembers(eq(channelId), eq(companyId), eq(userId)))
                                .thenReturn(List.of(member));

                mockMvc.perform(get("/api/communication/v1/chat/channels/{channelId}/members", channelId)
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].userId").value(userId.toString()))
                                .andExpect(jsonPath("$[0].role").value("ADMIN"));
        }

        @Test
        @DisplayName("POST /channels/{channelId}/members adds users and returns 201")
        void testAddChannelMembers() throws Exception {
                UUID newUserId = UUID.randomUUID();
                ChatMemberResponse member = ChatMemberResponse.builder()
                                .id(UUID.randomUUID())
                                .channelId(channelId)
                                .companyId(companyId)
                                .userId(newUserId)
                                .userName("New Member")
                                .role(com.erp.communication.chat.model.ChatMemberRole.MEMBER)
                                .build();

                when(chatService.addChannelMembers(eq(channelId), any(), eq(companyId), eq(userId), any()))
                                .thenReturn(List.of(member));

                String json = """
                                {
                                    "memberUserIds": ["%s"],
                                    "role": "MEMBER"
                                }
                                """.formatted(newUserId);

                mockMvc.perform(post("/api/communication/v1/chat/channels/{channelId}/members", channelId)
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$[0].userId").value(newUserId.toString()))
                                .andExpect(jsonPath("$[0].role").value("MEMBER"));
        }

        @Test
        @DisplayName("DELETE /channels/{channelId}/members/{memberUserId} removes member and returns 204")
        void testRemoveChannelMember() throws Exception {
                UUID targetUserId = UUID.randomUUID();

                mockMvc.perform(delete("/api/communication/v1/chat/channels/{channelId}/members/{memberUserId}",
                                channelId, targetUserId)
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString()))
                                .andExpect(status().isNoContent());

                verify(chatService, times(1)).removeChannelMember(eq(channelId), eq(targetUserId), eq(companyId),
                                eq(userId), any());
        }

        @Test
        @DisplayName("PUT /channels/{channelId}/members/{memberUserId}/role updates member role")
        void testUpdateMemberRole() throws Exception {
                UUID targetUserId = UUID.randomUUID();
                ChatMemberResponse response = ChatMemberResponse.builder()
                                .id(UUID.randomUUID())
                                .channelId(channelId)
                                .companyId(companyId)
                                .userId(targetUserId)
                                .role(com.erp.communication.chat.model.ChatMemberRole.ADMIN)
                                .build();

                when(chatService.updateMemberRole(eq(channelId), eq(targetUserId), any(), eq(companyId), eq(userId),
                                any())).thenReturn(response);

                String json = """
                                {
                                    "role": "ADMIN"
                                }
                                """;

                mockMvc.perform(put("/api/communication/v1/chat/channels/{channelId}/members/{memberUserId}/role",
                                channelId, targetUserId)
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.userId").value(targetUserId.toString()))
                                .andExpect(jsonPath("$.role").value("ADMIN"));
        }

        @Test
        @DisplayName("POST /channels/{channelId}/leave leaves channel and returns 204")
        void testLeaveChannel() throws Exception {
                mockMvc.perform(post("/api/communication/v1/chat/channels/{channelId}/leave", channelId)
                                .header("X-Company-Id", companyId.toString())
                                .header("X-User-Id", userId.toString()))
                                .andExpect(status().isNoContent());

                verify(chatService, times(1)).leaveChannel(eq(channelId), eq(companyId), eq(userId), any());
        }
}
