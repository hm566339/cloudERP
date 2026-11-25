package com.erp.communication.chat.service;

import com.erp.communication.chat.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ChatService {

    ChatChannelResponse createChannel(CreateChannelRequest request, UUID companyId, UUID currentUserId);

    List<ChatChannelResponse> getUserChannels(UUID companyId, UUID currentUserId);

    ChatChannelResponse getChannel(UUID channelId, UUID companyId, UUID currentUserId);

    Page<ChatMessageResponse> getChannelMessages(UUID channelId, UUID companyId, UUID currentUserId, Pageable pageable);

    ChatMessageResponse sendMessage(UUID channelId, SendChatMessageRequest request, UUID companyId, UUID currentUserId, String currentUserName);

    void markChannelAsRead(UUID channelId, UUID companyId, UUID currentUserId);

    ChatMessageResponse updateActionStatus(UUID channelId, UUID messageId, UpdateActionStatusRequest request, UUID companyId, UUID currentUserId, String currentUserName);

    ChatMessageResponse handleExternalQuotationEvent(QuotationEventDto event);
}
