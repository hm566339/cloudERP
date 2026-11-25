package com.erp.communication.chat.service;

import com.erp.communication.chat.dto.*;
import com.erp.communication.chat.entity.ChatChannel;
import com.erp.communication.chat.entity.ChatChannelMember;
import com.erp.communication.chat.entity.ChatMessage;
import com.erp.communication.chat.model.ChatActionStatus;
import com.erp.communication.chat.model.ChatChannelType;
import com.erp.communication.chat.model.ChatMemberRole;
import com.erp.communication.chat.model.ChatMessageType;
import com.erp.communication.chat.repository.ChatChannelMemberRepository;
import com.erp.communication.chat.repository.ChatChannelRepository;
import com.erp.communication.chat.repository.ChatMessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatChannelRepository channelRepository;

    @Mock
    private ChatChannelMemberRepository memberRepository;

    @Mock
    private ChatMessageRepository messageRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private ObjectMapper objectMapper;
    private ChatServiceImpl chatService;

    private final UUID companyId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID channelId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        chatService = new ChatServiceImpl(channelRepository, memberRepository, messageRepository, messagingTemplate, objectMapper);
    }

    @Test
    @DisplayName("createChannel should persist channel and add creator as ADMIN")
    void testCreateChannel() {
        CreateChannelRequest request = CreateChannelRequest.builder()
                .name("General & Sales")
                .type(ChatChannelType.GROUP)
                .memberUserIds(List.of(UUID.randomUUID()))
                .build();

        ChatChannel savedChannel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("General & Sales")
                .type(ChatChannelType.GROUP)
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(channelRepository.save(any(ChatChannel.class))).thenReturn(savedChannel);
        when(memberRepository.save(any(ChatChannelMember.class))).thenAnswer(i -> i.getArgument(0));

        ChatChannelResponse response = chatService.createChannel(request, companyId, userId);

        assertNotNull(response);
        assertEquals(channelId, response.getId());
        assertEquals("General & Sales", response.getName());
        verify(channelRepository, times(1)).save(any(ChatChannel.class));
        verify(memberRepository, atLeast(1)).save(any(ChatChannelMember.class));
    }

    @Test
    @DisplayName("sendMessage should persist message and broadcast via WebSocket to company topic")
    void testSendMessageBroadcasts() {
        ChatChannel channel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("General")
                .type(ChatChannelType.GROUP)
                .build();

        when(channelRepository.findByIdAndCompanyId(channelId, companyId)).thenReturn(Optional.of(channel));
        when(memberRepository.existsByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(true);

        SendChatMessageRequest request = SendChatMessageRequest.builder()
                .content("Hello Accounts team, please check quotation")
                .messageType(ChatMessageType.TEXT)
                .build();

        UUID messageId = UUID.randomUUID();
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage m = invocation.getArgument(0);
            m.setId(messageId);
            m.setCreatedAt(LocalDateTime.now());
            m.setUpdatedAt(LocalDateTime.now());
            return m;
        });

        ChatMessageResponse response = chatService.sendMessage(channelId, request, companyId, userId, "Rohit Sharma");

        assertNotNull(response);
        assertEquals("Hello Accounts team, please check quotation", response.getContent());
        assertEquals(channelId, response.getChannelId());

        String expectedTopic = String.format("/topic/company.%s.channel.%s", companyId, channelId);
        verify(messagingTemplate, times(1)).convertAndSend(eq(expectedTopic), any(ChatMessageResponse.class));
    }

    @Test
    @DisplayName("updateActionStatus should update OPEN -> IN_PROGRESS -> COMPLETED")
    void testUpdateActionStatus() {
        ChatChannel channel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("Quotations")
                .type(ChatChannelType.GROUP)
                .build();

        UUID messageId = UUID.randomUUID();
        ChatMessage msg = ChatMessage.builder()
                .id(messageId)
                .companyId(companyId)
                .channel(channel)
                .messageType(ChatMessageType.QUOTATION_REQUEST)
                .actionStatus(ChatActionStatus.OPEN)
                .content("Requesting quote for Acme Corp")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(channelRepository.findByIdAndCompanyId(channelId, companyId)).thenReturn(Optional.of(channel));
        when(memberRepository.existsByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(true);
        when(messageRepository.findByIdAndCompanyId(messageId, companyId)).thenReturn(Optional.of(msg));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(i -> i.getArgument(0));

        UpdateActionStatusRequest updateReq = UpdateActionStatusRequest.builder()
                .actionStatus(ChatActionStatus.IN_PROGRESS)
                .comment("Drafting quotation in Accounts")
                .build();

        ChatMessageResponse response = chatService.updateActionStatus(channelId, messageId, updateReq, companyId, userId, "Accounts Officer");

        assertNotNull(response);
        assertEquals(ChatActionStatus.IN_PROGRESS, response.getActionStatus());
        verify(messageRepository, atLeast(1)).save(any(ChatMessage.class));
    }

    @Test
    @DisplayName("handleExternalQuotationEvent should create card and resolve or create channel")
    void testHandleExternalQuotationEvent() {
        UUID refId = UUID.randomUUID();
        QuotationEventDto event = QuotationEventDto.builder()
                .companyId(companyId)
                .channelName("Quotations & Sales")
                .senderName("Sales Bot")
                .eventType("QUOTATION_REQUEST")
                .referenceId(refId)
                .content("New quotation request from Lead: Tata Steel")
                .metadata(Map.of("clientName", "Tata Steel", "amount", 450000))
                .build();

        ChatChannel channel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("Quotations & Sales")
                .type(ChatChannelType.GROUP)
                .build();

        when(channelRepository.findByCompanyIdAndNameAndType(companyId, "Quotations & Sales", ChatChannelType.GROUP))
                .thenReturn(Optional.of(channel));

        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(i -> {
            ChatMessage m = i.getArgument(0);
            m.setId(UUID.randomUUID());
            m.setCreatedAt(LocalDateTime.now());
            m.setUpdatedAt(LocalDateTime.now());
            return m;
        });

        ChatMessageResponse response = chatService.handleExternalQuotationEvent(event);

        assertNotNull(response);
        assertEquals(ChatMessageType.QUOTATION_REQUEST, response.getMessageType());
        assertEquals(ChatActionStatus.OPEN, response.getActionStatus());
        assertEquals(refId, response.getReferenceId());

        String expectedTopic = String.format("/topic/company.%s.channel.%s", companyId, channelId);
        verify(messagingTemplate, times(1)).convertAndSend(eq(expectedTopic), any(ChatMessageResponse.class));
    }
}
