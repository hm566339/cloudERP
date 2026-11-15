package com.erp.crm.modules.communication.service.serviceImpl;

import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.communication.dto.CallLogRequest;
import com.erp.crm.modules.communication.dto.CallLogResponse;
import com.erp.crm.modules.communication.dto.MessageResponse;
import com.erp.crm.modules.communication.dto.SendMessageRequest;
import com.erp.crm.modules.communication.entity.CrmCallLog;
import com.erp.crm.modules.communication.entity.CrmConversation;
import com.erp.crm.modules.communication.entity.CrmMessage;
import com.erp.crm.modules.communication.enums.MessageDeliveryStatus;
import com.erp.crm.modules.communication.enums.MessageDirection;
import com.erp.crm.modules.communication.repository.CrmCallLogRepository;
import com.erp.crm.modules.communication.repository.CrmConversationRepository;
import com.erp.crm.modules.communication.repository.CrmMessageRepository;
import com.erp.crm.modules.communication.service.CrmCommunicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrmCommunicationServiceImpl implements CrmCommunicationService {

    private final CrmConversationRepository conversationRepository;
    private final CrmMessageRepository messageRepository;
    private final CrmCallLogRepository callLogRepository;

    @Override
    public MessageResponse sendMessage(SendMessageRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Sending message via {} to {} [entity: {}/{}]", request.getChannel(),
                request.getRecipientIdentifier(), request.getEntityType(), request.getEntityId());

        // Find or create conversation thread
        List<CrmConversation> existing = conversationRepository.findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalseOrderByLastMessageAtDesc(
                companyId, request.getEntityType().toUpperCase(), request.getEntityId());

        CrmConversation conversation = existing.stream().findFirst().orElseGet(() -> {
            CrmConversation conv = CrmConversation.builder()
                    .channel(request.getChannel())
                    .entityType(request.getEntityType().toUpperCase())
                    .entityId(request.getEntityId())
                    .customerIdentifier(request.getRecipientIdentifier())
                    .status("OPEN")
                    .assignedAgentId(TenantUtils.getCurrentUserId())
                    .unreadCount(0)
                    .lastMessageAt(LocalDateTime.now())
                    .build();
            conv.setCompanyId(companyId);
            return conversationRepository.save(conv);
        });

        String body = request.getBodyText() != null ? request.getBodyText() : "Notification dispatched from Mark2 CRM";

        CrmMessage message = CrmMessage.builder()
                .companyId(companyId)
                .conversationId(conversation.getId())
                .direction(MessageDirection.OUTBOUND)
                .channel(request.getChannel())
                .senderIdentifier("Mark2 Cloud ERP")
                .recipientIdentifier(request.getRecipientIdentifier())
                .subject(request.getSubject())
                .bodyText(body)
                .deliveryStatus(MessageDeliveryStatus.SENT)
                .sentAt(LocalDateTime.now())
                .build();

        CrmMessage saved = messageRepository.save(message);

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return mapToMessageResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> getConversationMessages(UUID conversationId, UUID requestCompanyId) {
        return getMessages(conversationId, null, null, requestCompanyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(UUID conversationId, String entityType, UUID entityId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        if (conversationId != null) {
            return messageRepository.findByCompanyIdAndConversationIdOrderByCreatedAtAsc(companyId, conversationId)
                    .stream().map(this::mapToMessageResponse).toList();
        }
        if (entityType != null && !entityType.isBlank() && entityId != null) {
            List<CrmConversation> convs = conversationRepository.findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalseOrderByLastMessageAtDesc(
                    companyId, entityType.trim().toUpperCase(), entityId);
            return convs.stream()
                    .flatMap(c -> messageRepository.findByCompanyIdAndConversationIdOrderByCreatedAtAsc(companyId, c.getId()).stream())
                    .map(this::mapToMessageResponse)
                    .toList();
        }
        return messageRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream().map(this::mapToMessageResponse).toList();
    }

    @Override
    public CallLogResponse logCall(CallLogRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Logging Telephony Call from {} to {} [status: {}]", request.getCallerNumber(), request.getRecipientNumber(), request.getCallStatus());

        CrmCallLog call = CrmCallLog.builder()
                .entityType(request.getEntityType() != null ? request.getEntityType().toUpperCase() : "LEAD")
                .entityId(request.getEntityId() != null ? request.getEntityId() : UUID.randomUUID())
                .callDirection(request.getCallDirection())
                .providerName(request.getProviderName())
                .telephonyCallId(request.getTelephonyCallId())
                .callerNumber(request.getCallerNumber())
                .recipientNumber(request.getRecipientNumber())
                .agentUserId(request.getAgentUserId() != null ? request.getAgentUserId() : TenantUtils.getCurrentUserId())
                .callStatus(request.getCallStatus())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .durationSeconds(request.getDurationSeconds() != null ? request.getDurationSeconds() : 0)
                .recordingStorageUrl(request.getRecordingStorageUrl())
                .callNotes(request.getCallNotes())
                .build();
        call.setCompanyId(companyId);

        return mapToCallResponse(callLogRepository.save(call));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CallLogResponse> getCallsForEntity(String entityType, UUID entityId, UUID requestCompanyId) {
        return getCalls(entityType, entityId, requestCompanyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CallLogResponse> getCalls(String entityType, UUID entityId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);

        boolean hasEntityType = entityType != null && !entityType.isBlank();
        boolean hasEntityId = entityId != null;

        List<CrmCallLog> calls;
        if (hasEntityType && hasEntityId) {
            calls = callLogRepository.findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalseOrderByStartTimeDesc(
                    companyId, entityType.trim().toUpperCase(), entityId);
        } else if (hasEntityType) {
            calls = callLogRepository.findByCompanyIdAndEntityTypeAndIsDeletedFalseOrderByStartTimeDesc(
                    companyId, entityType.trim().toUpperCase());
        } else {
            calls = callLogRepository.findByCompanyIdAndIsDeletedFalseOrderByStartTimeDesc(companyId);
        }

        return calls.stream().map(this::mapToCallResponse).toList();
    }

    private MessageResponse mapToMessageResponse(CrmMessage m) {
        return MessageResponse.builder()
                .id(m.getId())
                .companyId(m.getCompanyId())
                .conversationId(m.getConversationId())
                .direction(m.getDirection())
                .channel(m.getChannel())
                .senderIdentifier(m.getSenderIdentifier())
                .recipientIdentifier(m.getRecipientIdentifier())
                .subject(m.getSubject())
                .bodyText(m.getBodyText())
                .deliveryStatus(m.getDeliveryStatus())
                .sentAt(m.getSentAt())
                .deliveredAt(m.getDeliveredAt())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private CallLogResponse mapToCallResponse(CrmCallLog c) {
        return CallLogResponse.builder()
                .id(c.getId())
                .companyId(c.getCompanyId())
                .entityType(c.getEntityType())
                .entityId(c.getEntityId())
                .callDirection(c.getCallDirection())
                .providerName(c.getProviderName())
                .callerNumber(c.getCallerNumber())
                .recipientNumber(c.getRecipientNumber())
                .agentUserId(c.getAgentUserId())
                .callStatus(c.getCallStatus())
                .startTime(c.getStartTime())
                .endTime(c.getEndTime())
                .durationSeconds(c.getDurationSeconds())
                .recordingStorageUrl(c.getRecordingStorageUrl())
                .callNotes(c.getCallNotes())
                .createdAt(c.getCreatedAt())
                .build();
    }
}

