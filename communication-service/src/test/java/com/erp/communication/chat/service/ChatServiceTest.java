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

    @Test
    @DisplayName("getChannel should query countByCompanyIdAndChannelId when lastReadAt is null")
    void testGetChannelUnreadCountWhenLastReadIsNull() {
        ChatChannel channel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("Support")
                .type(ChatChannelType.GROUP)
                .build();

        when(channelRepository.findByIdAndCompanyId(channelId, companyId)).thenReturn(Optional.of(channel));
        when(memberRepository.existsByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(true);

        // Member exists but has null lastReadAt (e.g. freshly created or never opened)
        ChatChannelMember member = ChatChannelMember.builder()
                .channel(channel)
                .userId(userId)
                .companyId(companyId)
                .role(ChatMemberRole.MEMBER)
                .lastReadAt(null)
                .build();
        when(memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(Optional.of(member));
        when(messageRepository.countByCompanyIdAndChannelId(companyId, channelId)).thenReturn(7L);

        ChatChannelResponse response = chatService.getChannel(channelId, companyId, userId);

        assertNotNull(response);
        assertEquals(7L, response.getUnreadCount());
        verify(messageRepository, times(1)).countByCompanyIdAndChannelId(companyId, channelId);
        verify(messageRepository, never()).countByCompanyIdAndChannelIdAndCreatedAtAfter(any(), any(), any());
    }

    @Test
    @DisplayName("getChannel should query countByCompanyIdAndChannelIdAndCreatedAtAfter when lastReadAt is present")
    void testGetChannelUnreadCountWhenLastReadIsPresent() {
        ChatChannel channel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("Support")
                .type(ChatChannelType.GROUP)
                .build();

        LocalDateTime lastRead = LocalDateTime.now().minusHours(2);
        when(channelRepository.findByIdAndCompanyId(channelId, companyId)).thenReturn(Optional.of(channel));
        when(memberRepository.existsByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(true);

        ChatChannelMember member = ChatChannelMember.builder()
                .channel(channel)
                .userId(userId)
                .companyId(companyId)
                .role(ChatMemberRole.MEMBER)
                .lastReadAt(lastRead)
                .build();
        when(memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(Optional.of(member));
        when(messageRepository.countByCompanyIdAndChannelIdAndCreatedAtAfter(companyId, channelId, lastRead)).thenReturn(3L);

        ChatChannelResponse response = chatService.getChannel(channelId, companyId, userId);

        assertNotNull(response);
        assertEquals(3L, response.getUnreadCount());
        verify(messageRepository, times(1)).countByCompanyIdAndChannelIdAndCreatedAtAfter(companyId, channelId, lastRead);
        verify(messageRepository, never()).countByCompanyIdAndChannelId(any(), any());
    }

    @Test
    @DisplayName("updateChannel should update name and description and broadcast alert when user is admin")
    void testUpdateChannelSuccess() {
        ChatChannel channel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("Old Name")
                .type(ChatChannelType.GROUP)
                .createdBy(userId)
                .build();

        when(channelRepository.findByIdAndCompanyId(channelId, companyId)).thenReturn(Optional.of(channel));
        when(memberRepository.existsByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(true);
        when(channelRepository.save(any(ChatChannel.class))).thenAnswer(i -> i.getArgument(0));

        UpdateChannelRequest request = UpdateChannelRequest.builder()
                .name("New Marketing Group")
                .description("Q4 Strategy and leads")
                .build();

        ChatChannelResponse response = chatService.updateChannel(channelId, request, companyId, userId, "Rohit Sharma");

        assertNotNull(response);
        assertEquals("New Marketing Group", response.getName());
        assertEquals("Q4 Strategy and leads", response.getDescription());
        verify(channelRepository, times(1)).save(channel);
        verify(messagingTemplate, atLeast(1)).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    @DisplayName("deleteChannel should delete members, messages, and channel when caller is admin/creator")
    void testDeleteChannelSuccess() {
        ChatChannel channel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("Temp Group")
                .type(ChatChannelType.GROUP)
                .createdBy(userId)
                .build();

        when(channelRepository.findByIdAndCompanyId(channelId, companyId)).thenReturn(Optional.of(channel));

        chatService.deleteChannel(channelId, companyId, userId, "Rohit Sharma");

        verify(memberRepository, times(1)).deleteByCompanyIdAndChannelId(companyId, channelId);
        verify(messageRepository, times(1)).deleteByCompanyIdAndChannelId(companyId, channelId);
        verify(channelRepository, times(1)).delete(channel);
    }

    @Test
    @DisplayName("getChannelMembers should list all channel members")
    void testGetChannelMembers() {
        ChatChannel channel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("Sales")
                .build();

        ChatChannelMember member = ChatChannelMember.builder()
                .id(UUID.randomUUID())
                .channel(channel)
                .companyId(companyId)
                .userId(userId)
                .role(ChatMemberRole.ADMIN)
                .joinedAt(LocalDateTime.now())
                .build();

        when(channelRepository.findByIdAndCompanyId(channelId, companyId)).thenReturn(Optional.of(channel));
        when(memberRepository.existsByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(true);
        when(memberRepository.findByCompanyIdAndChannelId(companyId, channelId)).thenReturn(List.of(member));

        List<ChatMemberResponse> result = chatService.getChannelMembers(channelId, companyId, userId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(userId, result.get(0).getUserId());
        assertEquals(ChatMemberRole.ADMIN, result.get(0).getRole());
    }

    @Test
    @DisplayName("addChannelMembers should skip existing members and add new ones")
    void testAddChannelMembers() {
        ChatChannel channel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("Sales")
                .createdBy(userId)
                .build();

        UUID newUser1 = UUID.randomUUID();
        UUID newUser2 = UUID.randomUUID();

        when(channelRepository.findByIdAndCompanyId(channelId, companyId)).thenReturn(Optional.of(channel));
        when(memberRepository.existsByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(true);

        // newUser1 already exists, newUser2 is new
        when(memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, newUser1))
                .thenReturn(Optional.of(ChatChannelMember.builder().userId(newUser1).build()));
        when(memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, newUser2))
                .thenReturn(Optional.empty());

        AddChannelMembersRequest request = AddChannelMembersRequest.builder()
                .memberUserIds(List.of(newUser1, newUser2))
                .role(ChatMemberRole.MEMBER)
                .build();

        chatService.addChannelMembers(channelId, request, companyId, userId, "Admin User");

        // Verify only newUser2 was saved
        ArgumentCaptor<ChatChannelMember> captor = ArgumentCaptor.forClass(ChatChannelMember.class);
        verify(memberRepository, times(1)).save(captor.capture());
        assertEquals(newUser2, captor.getValue().getUserId());
    }

    @Test
    @DisplayName("updateMemberRole should update role and prevent demoting last admin")
    void testUpdateMemberRolePreventsDemotingLastAdmin() {
        ChatChannel channel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("Sales")
                .createdBy(userId)
                .build();

        UUID targetUserId = UUID.randomUUID();
        ChatChannelMember targetMember = ChatChannelMember.builder()
                .id(UUID.randomUUID())
                .channel(channel)
                .companyId(companyId)
                .userId(targetUserId)
                .role(ChatMemberRole.ADMIN)
                .build();

        when(channelRepository.findByIdAndCompanyId(channelId, companyId)).thenReturn(Optional.of(channel));
        when(memberRepository.existsByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(true);
        when(memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, targetUserId))
                .thenReturn(Optional.of(targetMember));
        // Only 1 admin in the channel
        when(memberRepository.countByCompanyIdAndChannelIdAndRole(companyId, channelId, ChatMemberRole.ADMIN)).thenReturn(1L);

        UpdateMemberRoleRequest request = UpdateMemberRoleRequest.builder()
                .role(ChatMemberRole.MEMBER)
                .build();

        assertThrows(com.erp.communication.exception.InvalidRequestException.class, () ->
                chatService.updateMemberRole(channelId, targetUserId, request, companyId, userId, "Super Admin"));
    }

    @Test
    @DisplayName("leaveChannel should remove user and promote next member if leaving member was last admin")
    void testLeaveChannelPromotesNextAdmin() {
        ChatChannel channel = ChatChannel.builder()
                .id(channelId)
                .companyId(companyId)
                .name("Sales")
                .createdBy(userId)
                .build();

        ChatChannelMember adminMember = ChatChannelMember.builder()
                .id(UUID.randomUUID())
                .channel(channel)
                .companyId(companyId)
                .userId(userId)
                .role(ChatMemberRole.ADMIN)
                .build();

        UUID colleagueId = UUID.randomUUID();
        ChatChannelMember colleague = ChatMemberResponse.builder() != null ? ChatChannelMember.builder()
                .id(UUID.randomUUID())
                .channel(channel)
                .companyId(companyId)
                .userId(colleagueId)
                .role(ChatMemberRole.MEMBER)
                .build() : null;

        when(channelRepository.findByIdAndCompanyId(channelId, companyId)).thenReturn(Optional.of(channel));
        when(memberRepository.existsByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(true);
        when(memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(Optional.of(adminMember));
        when(memberRepository.countByCompanyIdAndChannelIdAndRole(companyId, channelId, ChatMemberRole.ADMIN)).thenReturn(1L);
        when(memberRepository.findByCompanyIdAndChannelId(companyId, channelId)).thenReturn(List.of(adminMember, colleague));

        chatService.leaveChannel(channelId, companyId, userId, "Leaving Admin");

        verify(memberRepository, times(1)).delete(adminMember);
        // Verify colleague promoted to ADMIN
        verify(memberRepository, times(1)).save(colleague);
        assertEquals(ChatMemberRole.ADMIN, colleague.getRole());
    }
}
