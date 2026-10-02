package com.erp.account.integration.workflow;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.integration.workflow.controller.WorkflowCallbackController;
import com.erp.account.integration.workflow.dto.WorkflowCallbackEventDto;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowCallbackControllerTest {

    @Mock
    private WorkflowDocumentRegistry documentRegistry;

    @Mock
    private WorkflowDocument mockDocument;

    @InjectMocks
    private WorkflowCallbackController callbackController;

    @Test
    void testCallback_WorkflowApproved_TriggersOnWorkflowApproved() {
        UUID docId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("SALES_INVOICE")
                .documentId(docId)
                .companyId(companyId)
                .status("APPROVED")
                .build();

        when(documentRegistry.load("SALES_INVOICE", docId, companyId)).thenReturn(mockDocument);

        ResponseEntity<ApiResponse<Void>> response = callbackController.handleWorkflowCallback(event);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        verify(mockDocument, times(1)).onWorkflowApproved();
    }

    @Test
    void testCallback_WorkflowRejected_TriggersOnWorkflowRejected() {
        UUID docId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_REJECTED")
                .documentType("SALES_INVOICE")
                .documentId(docId)
                .companyId(companyId)
                .status("REJECTED")
                .build();

        when(documentRegistry.load("SALES_INVOICE", docId, companyId)).thenReturn(mockDocument);

        ResponseEntity<ApiResponse<Void>> response = callbackController.handleWorkflowCallback(event);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        verify(mockDocument, times(1)).onWorkflowRejected();
    }
}
