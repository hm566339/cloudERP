package com.erp.communication.chat.controller;

import com.erp.communication.chat.dto.*;
import com.erp.communication.chat.service.ChatService;
import com.erp.communication.exception.InvalidRequestException;
import com.erp.communication.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/communication/v1/chat")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Internal Chat & Quotation API", description = "Multi-tenant company chat channels and quotation request management")
public class ChatRestController {

    private final ChatService chatService;

    @PostMapping("/channels")
    @Operation(summary = "Create a chat channel", description = "Creates a new GROUP or DIRECT channel for the authenticated company")
    public ResponseEntity<ChatChannelResponse> createChannel(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId,
            @Valid @RequestBody CreateChannelRequest request) {

        UUID companyId = resolveCompanyId(headerCompanyId);
        UUID currentUserId = resolveUserId(headerUserId);

        ChatChannelResponse response = chatService.createChannel(request, companyId, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/channels")
    @Operation(summary = "List company chat channels", description = "Retrieves all chat channels for current user/company with unread count")
    public ResponseEntity<List<ChatChannelResponse>> listChannels(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {

        UUID companyId = resolveCompanyId(headerCompanyId);
        UUID currentUserId = resolveUserId(headerUserId);

        List<ChatChannelResponse> list = chatService.getUserChannels(companyId, currentUserId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/channels/{channelId}")
    @Operation(summary = "Get channel by ID", description = "Retrieves specific chat channel details")
    public ResponseEntity<ChatChannelResponse> getChannel(
            @PathVariable UUID channelId,
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {

        UUID companyId = resolveCompanyId(headerCompanyId);
        UUID currentUserId = resolveUserId(headerUserId);

        ChatChannelResponse response = chatService.getChannel(channelId, companyId, currentUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/channels/{channelId}/messages")
    @Operation(summary = "Fetch message history", description = "Retrieves paginated messages in reverse-chronological order")
    public ResponseEntity<Page<ChatMessageResponse>> getChannelMessages(
            @PathVariable UUID channelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {

        UUID companyId = resolveCompanyId(headerCompanyId);
        UUID currentUserId = resolveUserId(headerUserId);

        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100), Sort.by("createdAt").descending());
        Page<ChatMessageResponse> messages = chatService.getChannelMessages(channelId, companyId, currentUserId, pageRequest);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/channels/{channelId}/messages")
    @Operation(summary = "Send a chat message", description = "Posts a message (TEXT or QUOTATION_REQUEST) and broadcasts over WebSocket")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @PathVariable UUID channelId,
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId,
            @RequestHeader(value = "X-User-Name", required = false) String headerUserName,
            @Valid @RequestBody SendChatMessageRequest request) {

        UUID companyId = resolveCompanyId(headerCompanyId);
        UUID currentUserId = resolveUserId(headerUserId);
        String currentUserName = resolveUserName(headerUserName);

        ChatMessageResponse response = chatService.sendMessage(channelId, request, companyId, currentUserId, currentUserName);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/channels/{channelId}/read")
    @Operation(summary = "Mark channel as read", description = "Updates the current user's read cursor for the channel")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID channelId,
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {

        UUID companyId = resolveCompanyId(headerCompanyId);
        UUID currentUserId = resolveUserId(headerUserId);

        chatService.markChannelAsRead(channelId, companyId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/channels/{channelId}/messages/{messageId}/status")
    @Operation(summary = "Update action status", description = "Updates QUOTATION_REQUEST status (OPEN -> IN_PROGRESS -> COMPLETED)")
    public ResponseEntity<ChatMessageResponse> updateActionStatus(
            @PathVariable UUID channelId,
            @PathVariable UUID messageId,
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId,
            @RequestHeader(value = "X-User-Name", required = false) String headerUserName,
            @Valid @RequestBody UpdateActionStatusRequest request) {

        UUID companyId = resolveCompanyId(headerCompanyId);
        UUID currentUserId = resolveUserId(headerUserId);
        String currentUserName = resolveUserName(headerUserName);

        ChatMessageResponse response = chatService.updateActionStatus(channelId, messageId, request, companyId, currentUserId, currentUserName);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/events", "/quotations/event", "/quotations/events"})
    @Operation(summary = "Post external chat / quotation event", description = "Common internal API used by CRM or Accounts service to post quotation request/ready cards")
    public ResponseEntity<ChatMessageResponse> postQuotationEvent(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @Valid @RequestBody QuotationEventDto event) {

        if (event == null) {
            throw new InvalidRequestException("Event payload cannot be null");
        }

        UUID companyId = event.getCompanyId() != null
                ? event.getCompanyId()
                : resolveCompanyId(headerCompanyId);
        event.setCompanyId(companyId);
        if (TenantContext.getCompanyId() == null) {
            TenantContext.setCompanyId(companyId);
        }

        ChatMessageResponse response = chatService.handleExternalQuotationEvent(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private UUID resolveCompanyId(UUID headerCompanyId) {
        if (headerCompanyId != null) {
            return headerCompanyId;
        }
        UUID contextCompanyId = TenantContext.getCompanyId();
        if (contextCompanyId != null) {
            return contextCompanyId;
        }
        throw new InvalidRequestException("Company ID is required (via X-Company-Id header or JWT claim)");
    }

    private UUID resolveUserId(UUID headerUserId) {
        if (headerUserId != null) {
            return headerUserId;
        }
        return TenantContext.getUserId();
    }

    private String resolveUserName(String headerUserName) {
        if (StringUtils.hasText(headerUserName)) {
            return headerUserName.trim();
        }
        String contextUserName = TenantContext.getUserName();
        if (StringUtils.hasText(contextUserName)) {
            return contextUserName;
        }
        return "User";
    }
}
