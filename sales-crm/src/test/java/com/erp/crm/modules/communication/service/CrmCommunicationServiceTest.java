package com.erp.crm.modules.communication.service;

import com.erp.crm.modules.communication.dto.CallLogResponse;
import com.erp.crm.modules.communication.dto.MessageResponse;
import com.erp.crm.modules.communication.entity.CrmCallLog;
import com.erp.crm.modules.communication.entity.CrmConversation;
import com.erp.crm.modules.communication.entity.CrmMessage;
import com.erp.crm.modules.communication.enums.CommunicationChannel;
import com.erp.crm.modules.communication.enums.MessageDirection;
import com.erp.crm.modules.communication.repository.CrmCallLogRepository;
import com.erp.crm.modules.communication.repository.CrmConversationRepository;
import com.erp.crm.modules.communication.repository.CrmMessageRepository;
import com.erp.crm.modules.communication.service.serviceImpl.CrmCommunicationServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmCommunicationServiceTest {

    @Mock
    private CrmConversationRepository conversationRepository;

    @Mock
    private CrmMessageRepository messageRepository;

    @Mock
    private CrmCallLogRepository callLogRepository;

    @InjectMocks
    private CrmCommunicationServiceImpl communicationService;

    private UUID companyId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        userId = UUID.randomUUID();
        com.erp.crm.common.security.CurrentUserContext.setCompanyId(companyId);
        com.erp.crm.common.security.CurrentUserContext.setUserId(userId);
    }

    @AfterEach
    void tearDown() {
        com.erp.crm.common.security.CurrentUserContext.clear();
    }

    @Test
    @DisplayName("Get Calls with companyId only returns all company call records")
    void testGetCallsCompanyOnly() {
        CrmCallLog call = CrmCallLog.builder()
                .id(UUID.randomUUID())
                .entityType("LEAD")
                .entityId(UUID.randomUUID())
                .callerNumber("+919876543210")
                .recipientNumber("+919123456789")
                .startTime(LocalDateTime.now())
                .build();
        call.setCompanyId(companyId);

        when(callLogRepository.findByCompanyIdAndIsDeletedFalseOrderByStartTimeDesc(eq(companyId)))
                .thenReturn(List.of(call));

        List<CallLogResponse> calls = communicationService.getCalls(null, null, companyId);

        assertNotNull(calls);
        assertEquals(1, calls.size());
        assertEquals("+919876543210", calls.get(0).getCallerNumber());
        verify(callLogRepository, times(1)).findByCompanyIdAndIsDeletedFalseOrderByStartTimeDesc(eq(companyId));
    }

    @Test
    @DisplayName("Get Messages with entityType and entityId finds thread messages")
    void testGetMessagesForEntity() {
        UUID leadId = UUID.randomUUID();
        UUID convId = UUID.randomUUID();

        CrmConversation conv = CrmConversation.builder()
                .id(convId)
                .entityType("LEAD")
                .entityId(leadId)
                .channel(CommunicationChannel.WHATSAPP)
                .build();
        conv.setCompanyId(companyId);

        CrmMessage msg = CrmMessage.builder()
                .id(UUID.randomUUID())
                .conversationId(convId)
                .direction(MessageDirection.OUTBOUND)
                .channel(CommunicationChannel.WHATSAPP)
                .recipientIdentifier("+919876543210")
                .bodyText("Hello from Mark2 CRM")
                .build();
        msg.setCompanyId(companyId);

        when(conversationRepository.findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalseOrderByLastMessageAtDesc(
                eq(companyId), eq("LEAD"), eq(leadId)))
                .thenReturn(List.of(conv));

        when(messageRepository.findByCompanyIdAndConversationIdOrderByCreatedAtAsc(eq(companyId), eq(convId)))
                .thenReturn(List.of(msg));

        List<MessageResponse> messages = communicationService.getMessages(null, "LEAD", leadId, companyId);

        assertNotNull(messages);
        assertEquals(1, messages.size());
        assertEquals("Hello from Mark2 CRM", messages.get(0).getBodyText());
    }
}

