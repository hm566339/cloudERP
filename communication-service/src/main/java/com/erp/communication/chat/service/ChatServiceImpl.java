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
import com.erp.communication.exception.InvalidRequestException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ChatChannelRepository channelRepository;
    private final ChatChannelMemberRepository memberRepository;
    private final ChatMessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public ChatServiceImpl(ChatChannelRepository channelRepository,
                           ChatChannelMemberRepository memberRepository,
                           ChatMessageRepository messageRepository,
                           SimpMessagingTemplate messagingTemplate,
                           @org.springframework.beans.factory.annotation.Autowired(required = false) ObjectMapper objectMapper) {
        this.channelRepository = channelRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.messagingTemplate = messagingTemplate;
        if (objectMapper != null) {
            this.objectMapper = objectMapper;
        } else {
            ObjectMapper om = new ObjectMapper();
            om.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            this.objectMapper = om;
        }
    }

    @Override
    @Transactional
    public ChatChannelResponse createChannel(CreateChannelRequest request, UUID companyId, UUID currentUserId) {
        if (companyId == null) {
            throw new InvalidRequestException("companyId is required to create a channel");
        }
        if (request == null || !StringUtils.hasText(request.getName())) {
            throw new InvalidRequestException("Channel name is required");
        }

        ChatChannel channel = ChatChannel.builder()
                .companyId(companyId)
                .name(request.getName().trim())
                .description(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : null)
                .type(request.getType() != null ? request.getType() : ChatChannelType.GROUP)
                .createdBy(currentUserId)
                .build();

        ChatChannel savedChannel = channelRepository.save(channel);

        // Add creator as ADMIN member
        if (currentUserId != null) {
            ChatChannelMember creatorMember = ChatChannelMember.builder()
                    .channel(savedChannel)
                    .companyId(companyId)
                    .userId(currentUserId)
                    .role(ChatMemberRole.ADMIN)
                    .lastReadAt(LocalDateTime.now())
                    .build();
            memberRepository.save(creatorMember);
        }

        // Add initial members
        if (request.getMemberUserIds() != null) {
            for (UUID memberUserId : request.getMemberUserIds()) {
                if (memberUserId != null && !memberUserId.equals(currentUserId)) {
                    ChatChannelMember member = ChatChannelMember.builder()
                            .channel(savedChannel)
                            .companyId(companyId)
                            .userId(memberUserId)
                            .role(ChatMemberRole.MEMBER)
                            .build();
                    memberRepository.save(member);
                }
            }
        }

        // Optional initial message
        if (StringUtils.hasText(request.getInitialMessage())) {
            ChatMessage initialMsg = ChatMessage.builder()
                    .companyId(companyId)
                    .channel(savedChannel)
                    .senderId(currentUserId)
                    .senderName("System")
                    .messageType(ChatMessageType.SYSTEM_ALERT)
                    .content(request.getInitialMessage().trim())
                    .build();
            messageRepository.save(initialMsg);
        }

        return mapToChannelResponse(savedChannel, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatChannelResponse> getUserChannels(UUID companyId, UUID currentUserId) {
        if (companyId == null) {
            throw new InvalidRequestException("companyId is required");
        }

        List<ChatChannel> channels;
        if (currentUserId != null) {
            channels = channelRepository.findChannelsForUser(companyId, currentUserId);
            // If user has no specific channels yet, fallback to all company channels
            if (channels.isEmpty()) {
                channels = channelRepository.findByCompanyIdOrderByUpdatedAtDesc(companyId);
            }
        } else {
            channels = channelRepository.findByCompanyIdOrderByUpdatedAtDesc(companyId);
        }

        return channels.stream()
                .map(ch -> mapToChannelResponse(ch, currentUserId))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ChatChannelResponse getChannel(UUID channelId, UUID companyId, UUID currentUserId) {
        ChatChannel channel = validateChannelAccess(channelId, companyId, currentUserId);
        return mapToChannelResponse(channel, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getChannelMessages(UUID channelId, UUID companyId, UUID currentUserId, Pageable pageable) {
        validateChannelAccess(channelId, companyId, currentUserId);
        Page<ChatMessage> page = messageRepository.findByCompanyIdAndChannelIdOrderByCreatedAtDesc(companyId, channelId, pageable);
        return page.map(this::mapToMessageResponse);
    }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(UUID channelId, SendChatMessageRequest request, UUID companyId, UUID currentUserId, String currentUserName) {
        ChatChannel channel = validateChannelAccess(channelId, companyId, currentUserId);

        if (!StringUtils.hasText(request.getContent())) {
            throw new InvalidRequestException("Message content cannot be blank");
        }

        String metadataJson = serializeMetadata(request.getMetadata());

        ChatMessage message = ChatMessage.builder()
                .companyId(companyId)
                .channel(channel)
                .senderId(currentUserId)
                .senderName(StringUtils.hasText(currentUserName) ? currentUserName : "User")
                .messageType(request.getMessageType() != null ? request.getMessageType() : ChatMessageType.TEXT)
                .referenceId(request.getReferenceId())
                .actionStatus(request.getActionStatus())
                .metadataJson(metadataJson)
                .content(request.getContent().trim())
                .build();

        ChatMessage saved = messageRepository.save(message);

        // Update channel last update timestamp
        channel.setUpdatedAt(LocalDateTime.now());
        channelRepository.save(channel);

        // Update sender's last read timestamp
        if (currentUserId != null) {
            memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, currentUserId)
                    .ifPresent(m -> {
                        m.setLastReadAt(LocalDateTime.now());
                        memberRepository.save(m);
                    });
        }

        ChatMessageResponse response = mapToMessageResponse(saved);

        // Real-time WebSocket Broadcast
        broadcastToChannel(companyId, channelId, response);

        return response;
    }

    @Override
    @Transactional
    public void markChannelAsRead(UUID channelId, UUID companyId, UUID currentUserId) {
        if (companyId == null || channelId == null || currentUserId == null) {
            return;
        }
        memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, currentUserId)
                .ifPresent(member -> {
                    member.setLastReadAt(LocalDateTime.now());
                    memberRepository.save(member);
                });
    }

    @Override
    @Transactional
    public ChatMessageResponse updateActionStatus(UUID channelId, UUID messageId, UpdateActionStatusRequest request,
                                                 UUID companyId, UUID currentUserId, String currentUserName) {
        validateChannelAccess(channelId, companyId, currentUserId);

        ChatMessage message = messageRepository.findByIdAndCompanyId(messageId, companyId)
                .orElseThrow(() -> new InvalidRequestException("Chat message not found: " + messageId));

        if (!message.getChannel().getId().equals(channelId)) {
            throw new InvalidRequestException("Message does not belong to specified channel");
        }

        message.setActionStatus(request.getActionStatus());

        // Update metadata if provided
        if (request.getMetadata() != null && !request.getMetadata().isEmpty()) {
            Map<String, Object> existingMeta = deserializeMetadata(message.getMetadataJson());
            existingMeta.putAll(request.getMetadata());
            message.setMetadataJson(serializeMetadata(existingMeta));
        }

        if (request.getReferenceId() != null) {
            message.setReferenceId(request.getReferenceId());
        }

        ChatMessage saved = messageRepository.save(message);

        // Optionally post a status change audit message in the channel
        if (StringUtils.hasText(request.getComment())) {
            ChatMessage commentMsg = ChatMessage.builder()
                    .companyId(companyId)
                    .channel(message.getChannel())
                    .senderId(currentUserId)
                    .senderName(StringUtils.hasText(currentUserName) ? currentUserName : "Operator")
                    .messageType(ChatMessageType.SYSTEM_ALERT)
                    .referenceId(message.getId())
                    .content("Status updated to [" + request.getActionStatus() + "]: " + request.getComment().trim())
                    .build();
            ChatMessage savedComment = messageRepository.save(commentMsg);
            broadcastToChannel(companyId, channelId, mapToMessageResponse(savedComment));
        }

        ChatMessageResponse response = mapToMessageResponse(saved);
        broadcastToChannel(companyId, channelId, response);

        return response;
    }

    @Override
    @Transactional
    public ChatMessageResponse handleExternalQuotationEvent(QuotationEventDto event) {
        if (event == null || event.getCompanyId() == null) {
            throw new InvalidRequestException("Invalid quotation event: companyId is required");
        }

        UUID companyId = event.getCompanyId();
        String channelName = StringUtils.hasText(event.getChannelName()) ? event.getChannelName().trim() : "Quotations & Sales";

        // Find or create company-wide quotation channel
        ChatChannel channel;
        if (event.getChannelId() != null) {
            channel = channelRepository.findByIdAndCompanyId(event.getChannelId(), companyId)
                    .orElseGet(() -> resolveOrCreateQuotationChannel(companyId, channelName));
        } else {
            channel = resolveOrCreateQuotationChannel(companyId, channelName);
        }

        ChatMessageType msgType;
        ChatActionStatus actionStatus;

        String rawEventType = event.getEventType() != null ? event.getEventType().trim().toUpperCase(Locale.ROOT) : "";

        if ("QUOTATION_READY".equals(rawEventType) || "QUOTATION_COMPLETED".equals(rawEventType)) {
            msgType = ChatMessageType.QUOTATION_READY;
            actionStatus = ChatActionStatus.COMPLETED;

            // Also mark previous QUOTATION_REQUEST message as COMPLETED if reference matches
            if (event.getReferenceId() != null) {
                messageRepository.findByCompanyIdAndReferenceIdAndMessageType(companyId, event.getReferenceId(), ChatMessageType.QUOTATION_REQUEST)
                        .ifPresent(existingReq -> {
                            existingReq.setActionStatus(ChatActionStatus.COMPLETED);
                            messageRepository.save(existingReq);
                            broadcastToChannel(companyId, channel.getId(), mapToMessageResponse(existingReq));
                        });
            }
        } else {
            // "QUOTATION_REQUEST", "QUOTATION_REQUESTED", or general request event
            msgType = ChatMessageType.QUOTATION_REQUEST;
            actionStatus = ChatActionStatus.OPEN;
        }

        String metadataJson = serializeMetadata(event.getMetadata());

        ChatMessage message = ChatMessage.builder()
                .companyId(companyId)
                .channel(channel)
                .senderId(event.getSenderId())
                .senderName(StringUtils.hasText(event.getSenderName()) ? event.getSenderName() : "CRM System")
                .messageType(msgType)
                .referenceId(event.getReferenceId())
                .actionStatus(actionStatus)
                .metadataJson(metadataJson)
                .content(StringUtils.hasText(event.getContent()) ? event.getContent() : "Quotation event dispatched from ERP")
                .build();

        ChatMessage saved = messageRepository.save(message);
        channel.setUpdatedAt(LocalDateTime.now());
        channelRepository.save(channel);

        ChatMessageResponse response = mapToMessageResponse(saved);
        broadcastToChannel(companyId, channel.getId(), response);

        log.info("Handled external quotation event | type={} | companyId={} | channelId={} | messageId={}",
                event.getEventType(), companyId, channel.getId(), saved.getId());

        return response;
    }

    @Override
    @Transactional
    public ChatChannelResponse updateChannel(UUID channelId, UpdateChannelRequest request, UUID companyId, UUID currentUserId, String currentUserName) {
        ChatChannel channel = validateChannelAccess(channelId, companyId, currentUserId);

        if (currentUserId != null && !isChannelAdminOrCreator(channel, companyId, currentUserId)) {
            throw new AccessDeniedException("Only channel administrators or the creator can update channel details");
        }

        boolean updated = false;
        if (request != null) {
            if (StringUtils.hasText(request.getName())) {
                channel.setName(request.getName().trim());
                updated = true;
            }
            if (request.getDescription() != null) {
                channel.setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : null);
                updated = true;
            }
        }

        if (updated) {
            channel.setUpdatedAt(LocalDateTime.now());
            channel = channelRepository.save(channel);

            String authorName = StringUtils.hasText(currentUserName) ? currentUserName : "An administrator";
            postAndBroadcastSystemMessage(channel, currentUserId, authorName,
                    authorName + " updated channel details", Map.of("action", "CHANNEL_UPDATED"));
        }

        return mapToChannelResponse(channel, currentUserId);
    }

    @Override
    @Transactional
    public void deleteChannel(UUID channelId, UUID companyId, UUID currentUserId, String currentUserName) {
        ChatChannel channel = channelRepository.findByIdAndCompanyId(channelId, companyId)
                .orElseThrow(() -> new InvalidRequestException("Channel not found: " + channelId));

        if (currentUserId != null && !isChannelAdminOrCreator(channel, companyId, currentUserId)) {
            throw new AccessDeniedException("Only channel administrators or the creator can delete this channel");
        }

        String authorName = StringUtils.hasText(currentUserName) ? currentUserName : "An administrator";
        postAndBroadcastSystemMessage(channel, currentUserId, authorName,
                authorName + " deleted the channel", Map.of("action", "CHANNEL_DELETED", "channelId", channelId.toString()));

        memberRepository.deleteByCompanyIdAndChannelId(companyId, channelId);
        messageRepository.deleteByCompanyIdAndChannelId(companyId, channelId);
        channelRepository.delete(channel);

        log.info("Deleted channel | channelId={} | companyId={} | deletedBy={}", channelId, companyId, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMemberResponse> getChannelMembers(UUID channelId, UUID companyId, UUID currentUserId) {
        validateChannelAccess(channelId, companyId, currentUserId);
        List<ChatChannelMember> members = memberRepository.findByCompanyIdAndChannelId(companyId, channelId);
        return members.stream()
                .map(this::mapToMemberResponse)
                .toList();
    }

    @Override
    @Transactional
    public List<ChatMemberResponse> addChannelMembers(UUID channelId, AddChannelMembersRequest request, UUID companyId, UUID currentUserId, String currentUserName) {
        ChatChannel channel = validateChannelAccess(channelId, companyId, currentUserId);

        if (request == null || request.getMemberUserIds() == null || request.getMemberUserIds().isEmpty()) {
            throw new InvalidRequestException("memberUserIds list cannot be empty");
        }

        int addedCount = 0;
        ChatMemberRole role = request.getRole() != null ? request.getRole() : ChatMemberRole.MEMBER;

        for (UUID memberUserId : request.getMemberUserIds()) {
            if (memberUserId == null) continue;

            Optional<ChatChannelMember> existing = memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, memberUserId);
            if (existing.isEmpty()) {
                ChatChannelMember newMember = ChatChannelMember.builder()
                        .channel(channel)
                        .companyId(companyId)
                        .userId(memberUserId)
                        .role(role)
                        .lastReadAt(LocalDateTime.now())
                        .build();
                memberRepository.save(newMember);
                addedCount++;
            }
        }

        if (addedCount > 0) {
            channel.setUpdatedAt(LocalDateTime.now());
            channelRepository.save(channel);

            String authorName = StringUtils.hasText(currentUserName) ? currentUserName : "An administrator";
            postAndBroadcastSystemMessage(channel, currentUserId, authorName,
                    authorName + " added " + addedCount + " member(s) to the channel",
                    Map.of("action", "MEMBERS_ADDED", "count", addedCount));
        }

        return getChannelMembers(channelId, companyId, currentUserId);
    }

    @Override
    @Transactional
    public void removeChannelMember(UUID channelId, UUID memberUserId, UUID companyId, UUID currentUserId, String currentUserName) {
        ChatChannel channel = validateChannelAccess(channelId, companyId, currentUserId);

        if (memberUserId == null) {
            throw new InvalidRequestException("memberUserId is required");
        }

        if (memberUserId.equals(currentUserId)) {
            leaveChannel(channelId, companyId, currentUserId, currentUserName);
            return;
        }

        if (currentUserId != null && !isChannelAdminOrCreator(channel, companyId, currentUserId)) {
            throw new AccessDeniedException("Only channel administrators can remove members");
        }

        ChatChannelMember member = memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, memberUserId)
                .orElseThrow(() -> new InvalidRequestException("User is not a member of this channel"));

        memberRepository.delete(member);
        channel.setUpdatedAt(LocalDateTime.now());
        channelRepository.save(channel);

        String authorName = StringUtils.hasText(currentUserName) ? currentUserName : "An administrator";
        postAndBroadcastSystemMessage(channel, currentUserId, authorName,
                authorName + " removed a member from the channel",
                Map.of("action", "MEMBER_REMOVED", "removedUserId", memberUserId.toString()));

        log.info("Removed member from channel | channelId={} | removedUserId={} | removedBy={}",
                channelId, memberUserId, currentUserId);
    }

    @Override
    @Transactional
    public ChatMemberResponse updateMemberRole(UUID channelId, UUID memberUserId, UpdateMemberRoleRequest request, UUID companyId, UUID currentUserId, String currentUserName) {
        ChatChannel channel = validateChannelAccess(channelId, companyId, currentUserId);

        if (memberUserId == null || request == null || request.getRole() == null) {
            throw new InvalidRequestException("memberUserId and role are required");
        }

        if (currentUserId != null && !isChannelAdminOrCreator(channel, companyId, currentUserId)) {
            throw new AccessDeniedException("Only channel administrators can change member roles");
        }

        ChatChannelMember member = memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, memberUserId)
                .orElseThrow(() -> new InvalidRequestException("User is not a member of this channel"));

        // Demoting an admin: verify not the last admin
        if (member.getRole() == ChatMemberRole.ADMIN && request.getRole() == ChatMemberRole.MEMBER) {
            long adminCount = memberRepository.countByCompanyIdAndChannelIdAndRole(companyId, channelId, ChatMemberRole.ADMIN);
            if (adminCount <= 1) {
                throw new InvalidRequestException("Cannot demote the last administrator of the channel");
            }
        }

        member.setRole(request.getRole());
        ChatChannelMember saved = memberRepository.save(member);

        String authorName = StringUtils.hasText(currentUserName) ? currentUserName : "An administrator";
        postAndBroadcastSystemMessage(channel, currentUserId, authorName,
                authorName + " updated member role to " + request.getRole(),
                Map.of("action", "ROLE_UPDATED", "targetUserId", memberUserId.toString(), "newRole", request.getRole().name()));

        return mapToMemberResponse(saved);
    }

    @Override
    @Transactional
    public void leaveChannel(UUID channelId, UUID companyId, UUID currentUserId, String currentUserName) {
        if (currentUserId == null) {
            throw new InvalidRequestException("Authentication is required to leave channel");
        }

        ChatChannel channel = validateChannelAccess(channelId, companyId, currentUserId);

        ChatChannelMember member = memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channelId, currentUserId)
                .orElseThrow(() -> new InvalidRequestException("You are not a member of this channel"));

        // If member is ADMIN and leaving, check if there are other members needing promotion
        if (member.getRole() == ChatMemberRole.ADMIN) {
            long adminCount = memberRepository.countByCompanyIdAndChannelIdAndRole(companyId, channelId, ChatMemberRole.ADMIN);
            if (adminCount <= 1) {
                List<ChatChannelMember> otherMembers = memberRepository.findByCompanyIdAndChannelId(companyId, channelId)
                        .stream()
                        .filter(m -> !m.getUserId().equals(currentUserId))
                        .toList();
                if (!otherMembers.isEmpty()) {
                    ChatChannelMember promotee = otherMembers.get(0);
                    promotee.setRole(ChatMemberRole.ADMIN);
                    memberRepository.save(promotee);
                }
            }
        }

        memberRepository.delete(member);
        channel.setUpdatedAt(LocalDateTime.now());
        channelRepository.save(channel);

        String authorName = StringUtils.hasText(currentUserName) ? currentUserName : "A member";
        postAndBroadcastSystemMessage(channel, currentUserId, authorName,
                authorName + " left the channel",
                Map.of("action", "MEMBER_LEFT", "userId", currentUserId.toString()));

        log.info("User left channel | channelId={} | userId={}", channelId, currentUserId);
    }

    private boolean isChannelAdminOrCreator(ChatChannel channel, UUID companyId, UUID userId) {
        if (userId == null) {
            return false;
        }
        if (userId.equals(channel.getCreatedBy())) {
            return true;
        }
        return memberRepository.findByCompanyIdAndChannelIdAndUserId(companyId, channel.getId(), userId)
                .map(m -> m.getRole() == ChatMemberRole.ADMIN)
                .orElse(false);
    }

    private ChatMemberResponse mapToMemberResponse(ChatChannelMember m) {
        return ChatMemberResponse.builder()
                .id(m.getId())
                .channelId(m.getChannel().getId())
                .companyId(m.getCompanyId())
                .userId(m.getUserId())
                .userName("User")
                .role(m.getRole())
                .joinedAt(m.getJoinedAt())
                .lastReadAt(m.getLastReadAt())
                .build();
    }

    private void postAndBroadcastSystemMessage(ChatChannel channel, UUID senderId, String senderName, String content, Map<String, Object> metadata) {
        try {
            ChatMessage msg = ChatMessage.builder()
                    .companyId(channel.getCompanyId())
                    .channel(channel)
                    .senderId(senderId)
                    .senderName(senderName)
                    .messageType(ChatMessageType.SYSTEM_ALERT)
                    .content(content)
                    .metadataJson(serializeMetadata(metadata))
                    .build();
            ChatMessage saved = messageRepository.save(msg);
            broadcastToChannel(channel.getCompanyId(), channel.getId(), mapToMessageResponse(saved));
        } catch (Exception ex) {
            log.warn("Failed to broadcast system message for channel {}: {}", channel.getId(), ex.getMessage());
        }
    }

    private ChatChannel resolveOrCreateQuotationChannel(UUID companyId, String channelName) {
        return channelRepository.findByCompanyIdAndNameAndType(companyId, channelName, ChatChannelType.GROUP)
                .orElseGet(() -> {
                    ChatChannel ch = ChatChannel.builder()
                            .companyId(companyId)
                            .name(channelName)
                            .type(ChatChannelType.GROUP)
                            .build();
                    return channelRepository.save(ch);
                });
    }

    private void broadcastToChannel(UUID companyId, UUID channelId, ChatMessageResponse response) {
        String topicDestination = String.format("/topic/company.%s.channel.%s", companyId, channelId);
        try {
            messagingTemplate.convertAndSend(topicDestination, response);
            log.debug("Broadcasted chat message to WebSocket topic: {}", topicDestination);
        } catch (Exception ex) {
            log.error("Failed to broadcast chat message to WebSocket destination {}: {}", topicDestination, ex.getMessage());
        }
    }

    private ChatChannel validateChannelAccess(UUID channelId, UUID companyId, UUID currentUserId) {
        if (companyId == null || channelId == null) {
            throw new InvalidRequestException("companyId and channelId are required");
        }

        ChatChannel channel = channelRepository.findByIdAndCompanyId(channelId, companyId)
                .orElseThrow(() -> new InvalidRequestException("Channel not found or does not belong to your company: " + channelId));

        if (currentUserId != null) {
            boolean isMember = memberRepository.existsByCompanyIdAndChannelIdAndUserId(companyId, channelId, currentUserId);
            if (!isMember) {
                // Auto-join if channel is GROUP
                if (channel.getType() == ChatChannelType.GROUP) {
                    ChatChannelMember member = ChatChannelMember.builder()
                            .channel(channel)
                            .companyId(companyId)
                            .userId(currentUserId)
                            .role(ChatMemberRole.MEMBER)
                            .lastReadAt(LocalDateTime.now())
                            .build();
                    memberRepository.save(member);
                } else {
                    throw new AccessDeniedException("Access denied: You are not a member of this direct chat");
                }
            }
        }

        return channel;
    }

    private ChatChannelResponse mapToChannelResponse(ChatChannel ch, UUID currentUserId) {
        long unreadCount = 0;
        if (currentUserId != null) {
            Optional<ChatChannelMember> member = memberRepository.findByCompanyIdAndChannelIdAndUserId(ch.getCompanyId(), ch.getId(), currentUserId);
            LocalDateTime lastRead = member.map(ChatChannelMember::getLastReadAt).orElse(null);
            if (lastRead == null) {
                unreadCount = messageRepository.countByCompanyIdAndChannelId(ch.getCompanyId(), ch.getId());
            } else {
                unreadCount = messageRepository.countByCompanyIdAndChannelIdAndCreatedAtAfter(ch.getCompanyId(), ch.getId(), lastRead);
            }
        }

        Optional<ChatMessage> lastMsg = messageRepository.findFirstByChannelIdOrderByCreatedAtDesc(ch.getId());
        long memberCount = memberRepository.countByChannelId(ch.getId());

        return ChatChannelResponse.builder()
                .id(ch.getId())
                .companyId(ch.getCompanyId())
                .name(ch.getName())
                .description(ch.getDescription())
                .type(ch.getType())
                .createdBy(ch.getCreatedBy())
                .unreadCount(unreadCount)
                .lastMessageContent(lastMsg.map(ChatMessage::getContent).orElse(null))
                .lastMessageAt(lastMsg.map(ChatMessage::getCreatedAt).orElse(ch.getUpdatedAt()))
                .memberCount(memberCount)
                .createdAt(ch.getCreatedAt())
                .updatedAt(ch.getUpdatedAt())
                .build();
    }

    private ChatMessageResponse mapToMessageResponse(ChatMessage m) {
        return ChatMessageResponse.builder()
                .id(m.getId())
                .companyId(m.getCompanyId())
                .channelId(m.getChannel().getId())
                .channelName(m.getChannel().getName())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .messageType(m.getMessageType())
                .referenceId(m.getReferenceId())
                .actionStatus(m.getActionStatus())
                .metadata(deserializeMetadata(m.getMetadataJson()))
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }

    private String serializeMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            log.error("Failed to serialize chat metadata: {}", e.getMessage());
            return null;
        }
    }

    private Map<String, Object> deserializeMetadata(String json) {
        if (!StringUtils.hasText(json)) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("Failed to deserialize chat metadata: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
