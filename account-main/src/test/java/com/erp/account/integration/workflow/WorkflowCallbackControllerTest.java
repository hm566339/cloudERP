package com.erp.account.integration.workflow;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.integration.workflow.controller.WorkflowCallbackController;
import com.erp.account.integration.workflow.dto.WorkflowCallbackEventDto;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowCallbackControllerTest {

    private static final String VALID_SECRET = "erp-workflow-internal-callback-secret";

    @Mock
    private WorkflowDocumentRegistry documentRegistry;

    @Mock
    private WorkflowDocument mockDocument;

    @InjectMocks
    private WorkflowCallbackController callbackController;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(callbackController, "expectedSecret", VALID_SECRET);
    }

    @Test
    void testCallback_InvalidSecret_ReturnsUnauthorized() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("SALES_INVOICE")
                .documentId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .status("APPROVED")
                .build();

        ResponseEntity<ApiResponse<Void>> response = callbackController.handleWorkflowCallback("wrong-secret", event);

        assertNotNull(response);
        assertEquals(401, response.getStatusCode().value());
        assertFalse(response.getBody().isSuccess());
        verifyNoInteractions(documentRegistry);
    }

    @Test
    void testCallback_MissingServerSecret_Returns500ConfigurationError() {
        ReflectionTestUtils.setField(callbackController, "expectedSecret", "");

        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("SALES_INVOICE")
                .documentId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .status("APPROVED")
                .build();

        ResponseEntity<ApiResponse<Void>> response = callbackController.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(500, response.getStatusCode().value());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("Server configuration error"));
        verifyNoInteractions(documentRegistry);
    }

    @Test
    void testCallback_MissingSecretHeader_ReturnsUnauthorized() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("SALES_INVOICE")
                .documentId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .status("APPROVED")
                .build();

        ResponseEntity<ApiResponse<Void>> response = callbackController.handleWorkflowCallback(null, event);

        assertNotNull(response);
        assertEquals(401, response.getStatusCode().value());
        assertFalse(response.getBody().isSuccess());
        verifyNoInteractions(documentRegistry);
    }

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

        ResponseEntity<ApiResponse<Void>> response = callbackController.handleWorkflowCallback(VALID_SECRET, event);

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

        ResponseEntity<ApiResponse<Void>> response = callbackController.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        verify(mockDocument, times(1)).onWorkflowRejected();
    }

    @Test
    void testCallback_WorkflowCancelled_TriggersOnWorkflowCancelled() {
        UUID docId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_CANCELLED")
                .documentType("PURCHASE_ORDER")
                .documentId(docId)
                .companyId(companyId)
                .status("CANCELLED")
                .build();

        when(documentRegistry.load("PURCHASE_ORDER", docId, companyId)).thenReturn(mockDocument);

        ResponseEntity<ApiResponse<Void>> response = callbackController.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        verify(mockDocument, times(1)).onWorkflowCancelled();
    }

    @Test
    void testCallback_WorkflowReturned_TriggersOnWorkflowReturned() {
        UUID docId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_RETURNED")
                .documentType("AP_INVOICE")
                .documentId(docId)
                .companyId(companyId)
                .status("RETURNED")
                .build();

        when(documentRegistry.load("AP_INVOICE", docId, companyId)).thenReturn(mockDocument);

        ResponseEntity<ApiResponse<Void>> response = callbackController.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        verify(mockDocument, times(1)).onWorkflowReturned();
    }

    @Test
    void testCallback_MissingRequiredFields_ReturnsBadRequest() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType(null)
                .documentId(UUID.randomUUID())
                .companyId(null)
                .build();

        ResponseEntity<ApiResponse<Void>> response = callbackController.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(400, response.getStatusCode().value());
        assertFalse(response.getBody().isSuccess());
        verifyNoInteractions(documentRegistry);
    }

    @Test
    void testCallback_RegistryThrowsException_ReturnsInternalServerError() {
        UUID docId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("PURCHASE_ORDER")
                .documentId(docId)
                .companyId(companyId)
                .status("APPROVED")
                .build();

        when(documentRegistry.load("PURCHASE_ORDER", docId, companyId))
                .thenThrow(new RuntimeException("Database error loading document"));

        ResponseEntity<ApiResponse<Void>> response = callbackController.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(500, response.getStatusCode().value());
        assertFalse(response.getBody().isSuccess());
    }
}
