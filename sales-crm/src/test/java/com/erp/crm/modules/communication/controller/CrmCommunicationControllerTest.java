package com.erp.crm.modules.communication.controller;

import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.communication.dto.CallLogResponse;
import com.erp.crm.modules.communication.dto.MessageResponse;
import com.erp.crm.modules.communication.service.CrmCommunicationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmCommunicationControllerTest {

    @Mock
    private CrmCommunicationService communicationService;

    @InjectMocks
    private CrmCommunicationController communicationController;

    @Test
    @DisplayName("GET /api/crm/communication/calls with companyId only succeeds without required entityType")
    void testGetCallsCompanyOnly() {
        UUID companyId = UUID.randomUUID();
        CallLogResponse call = CallLogResponse.builder()
                .id(UUID.randomUUID())
                .callerNumber("+919876543210")
                .recipientNumber("+919123456789")
                .build();

        when(communicationService.getCalls(null, null, companyId))
                .thenReturn(List.of(call));

        ResponseEntity<ApiResponse<List<CallLogResponse>>> response = communicationController.getCalls(
                null, null, companyId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        verify(communicationService, times(1)).getCalls(null, null, companyId);
    }

    @Test
    @DisplayName("GET /api/crm/communication/messages with entityType and entityId succeeds without conversationId")
    void testGetMessagesForEntity() {
        UUID companyId = UUID.randomUUID();
        UUID leadId = UUID.randomUUID();
        MessageResponse msg = MessageResponse.builder()
                .id(UUID.randomUUID())
                .recipientIdentifier("+919876543210")
                .subject("Follow up")
                .build();

        when(communicationService.getMessages(null, "LEAD", leadId, companyId))
                .thenReturn(List.of(msg));

        ResponseEntity<ApiResponse<List<MessageResponse>>> response = communicationController.getConversationMessages(
                null, "LEAD", leadId, companyId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        verify(communicationService, times(1)).getMessages(null, "LEAD", leadId, companyId);
    }
}
