package com.erp.communication.chat.controller;

import com.erp.communication.chat.dto.ChatMessageResponse;
import com.erp.communication.chat.dto.SendChatMessageRequest;
import com.erp.communication.chat.service.ChatService;
import com.erp.communication.chat.websocket.ChatUserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatService chatService;

    @MessageMapping("/chat.send.{channelId}")
    public void handleIncomingChatMessage(
            @DestinationVariable UUID channelId,
            @Payload SendChatMessageRequest request,
            Principal principal) {

        if (!(principal instanceof ChatUserPrincipal chatUser)) {
            log.warn("Rejected STOMP message: principal is not a ChatUserPrincipal");
            return;
        }

        UUID companyId = chatUser.getCompanyId();
        UUID userId = chatUser.getUserId();
        String userName = chatUser.getName();

        if (companyId == null) {
            log.warn("Rejected STOMP message: user has no companyId associated");
            return;
        }

        chatService.sendMessage(channelId, request, companyId, userId, userName);
    }

    @MessageMapping("/chat.read.{channelId}")
    public void handleIncomingChatRead(
            @DestinationVariable UUID channelId,
            Principal principal) {

        if (!(principal instanceof ChatUserPrincipal chatUser)) {
            return;
        }

        chatService.markChannelAsRead(channelId, chatUser.getCompanyId(), chatUser.getUserId());
    }
}
