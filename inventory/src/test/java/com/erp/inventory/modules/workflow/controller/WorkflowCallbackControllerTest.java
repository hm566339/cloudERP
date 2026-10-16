package com.erp.inventory.modules.workflow.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.workflow.document.WorkflowDocument;
import com.erp.inventory.modules.workflow.document.WorkflowDocumentRegistry;
import com.erp.inventory.modules.workflow.dto.WorkflowCallbackEventDto;
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
    private WorkflowDocument workflowDocument;

    @InjectMocks
    private WorkflowCallbackController controller;

    private final UUID companyId = UUID.randomUUID();
    private final UUID documentId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(controller, "expectedSecret", VALID_SECRET);
    }

    @Test
    void handleWorkflowCallback_InvalidSecret_ReturnsUnauthorized() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("STOCK_TRANSFER")
                .documentId(documentId)
                .companyId(companyId)
                .status("APPROVED")
                .build();

        ResponseEntity<ApiResponse<Void>> response = controller.handleWorkflowCallback("bad-secret", event);

        assertNotNull(response);
        assertEquals(401, response.getStatusCode().value());
        assertFalse(response.getBody().isSuccess());
        verifyNoInteractions(documentRegistry);
    }

    @Test
    void handleWorkflowCallback_MissingServerSecret_Returns500ConfigurationError() {
        ReflectionTestUtils.setField(controller, "expectedSecret", "");

        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("STOCK_TRANSFER")
                .documentId(documentId)
                .companyId(companyId)
                .status("APPROVED")
                .build();

        ResponseEntity<ApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(500, response.getStatusCode().value());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("Server configuration error"));
        verifyNoInteractions(documentRegistry);
    }

    @Test
    void handleWorkflowCallback_MissingSecretHeader_ReturnsUnauthorized() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("STOCK_TRANSFER")
                .documentId(documentId)
                .companyId(companyId)
                .status("APPROVED")
                .build();

        ResponseEntity<ApiResponse<Void>> response = controller.handleWorkflowCallback(null, event);

        assertNotNull(response);
        assertEquals(401, response.getStatusCode().value());
        assertFalse(response.getBody().isSuccess());
        verifyNoInteractions(documentRegistry);
    }

    @Test
    void handleWorkflowCallback_MissingFields_ReturnsBadRequest() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType(null)
                .documentId(documentId)
                .companyId(null)
                .build();

        ResponseEntity<ApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(400, response.getStatusCode().value());
        assertFalse(response.getBody().isSuccess());
        verifyNoInteractions(documentRegistry);
    }

    @Test
    void handleWorkflowCallback_ApprovedEvent_CallsOnWorkflowApproved() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("STOCK_TRANSFER")
                .documentId(documentId)
                .companyId(companyId)
                .status("APPROVED")
                .build();

        when(documentRegistry.load("STOCK_TRANSFER", documentId, companyId)).thenReturn(workflowDocument);

        ResponseEntity<ApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertTrue(response.getBody().isSuccess());
        verify(workflowDocument).onWorkflowApproved(any());
    }

    @Test
    void handleWorkflowCallback_RejectedEvent_CallsOnWorkflowRejected() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_REJECTED")
                .documentType("STOCK_ADJUSTMENT")
                .documentId(documentId)
                .companyId(companyId)
                .status("REJECTED")
                .build();

        when(documentRegistry.load("STOCK_ADJUSTMENT", documentId, companyId)).thenReturn(workflowDocument);

        ResponseEntity<ApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertTrue(response.getBody().isSuccess());
        verify(workflowDocument).onWorkflowRejected();
    }

    @Test
    void handleWorkflowCallback_CancelledEvent_CallsOnWorkflowCancelled() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_CANCELLED")
                .documentType("STOCK_TRANSFER")
                .documentId(documentId)
                .companyId(companyId)
                .status("CANCELLED")
                .build();

        when(documentRegistry.load("STOCK_TRANSFER", documentId, companyId)).thenReturn(workflowDocument);

        ResponseEntity<ApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertTrue(response.getBody().isSuccess());
        verify(workflowDocument).onWorkflowCancelled();
    }

    @Test
    void handleWorkflowCallback_ReturnedEvent_CallsOnWorkflowReturned() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_RETURNED")
                .documentType("STOCK_ADJUSTMENT")
                .documentId(documentId)
                .companyId(companyId)
                .status("RETURNED")
                .build();

        when(documentRegistry.load("STOCK_ADJUSTMENT", documentId, companyId)).thenReturn(workflowDocument);

        ResponseEntity<ApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertTrue(response.getBody().isSuccess());
        verify(workflowDocument).onWorkflowReturned();
    }

    @Test
    void handleWorkflowCallback_OpeningStock_CallsOnWorkflowApproved() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("OPENING_STOCK")
                .documentId(documentId)
                .companyId(companyId)
                .status("APPROVED")
                .build();

        when(documentRegistry.load("OPENING_STOCK", documentId, companyId)).thenReturn(workflowDocument);

        ResponseEntity<ApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertTrue(response.getBody().isSuccess());
        verify(workflowDocument).onWorkflowApproved(any());
    }

    @Test
    void handleWorkflowCallback_DocumentNotFound_IgnoredGracefully() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("STOCK_TRANSFER")
                .documentId(documentId)
                .companyId(companyId)
                .status("APPROVED")
                .build();

        when(documentRegistry.load("STOCK_TRANSFER", documentId, companyId)).thenReturn(null);

        ResponseEntity<ApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertTrue(response.getBody().isSuccess());
        assertEquals("Document not found, ignored", response.getBody().getMessage());
        verifyNoInteractions(workflowDocument);
    }
}
