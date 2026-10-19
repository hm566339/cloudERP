package com.erp.manufacturing.workflow;

import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.workflow.controller.WorkflowCallbackController;
import com.erp.manufacturing.workflow.document.WorkflowDocument;
import com.erp.manufacturing.workflow.document.WorkflowDocumentRegistry;
import com.erp.manufacturing.workflow.dto.WorkflowCallbackEventDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowCallbackControllerTest {

    private static final String VALID_SECRET = "test-workflow-secret-123";

    @Mock
    private WorkflowDocumentRegistry documentRegistry;

    @Mock
    private WorkflowDocument workflowDocument;

    @InjectMocks
    private WorkflowCallbackController controller;

    private UUID documentId;
    private UUID companyId;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();
        companyId = UUID.randomUUID();
        ReflectionTestUtils.setField(controller, "expectedSecret", VALID_SECRET);
    }

    @Test
    void handleWorkflowCallback_ValidSecret_ApprovedEvent_CallsOnWorkflowApproved() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("PRODUCTION_ORDER")
                .documentId(documentId)
                .companyId(companyId)
                .status("APPROVED")
                .metadata(Map.of("approver", "manager1"))
                .build();

        when(documentRegistry.load("PRODUCTION_ORDER", documentId, companyId)).thenReturn(workflowDocument);

        ResponseEntity<InventoryApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        verify(workflowDocument).onWorkflowApproved(any());
    }

    @Test
    void handleWorkflowCallback_ValidSecret_RejectedEvent_CallsOnWorkflowRejected() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_REJECTED")
                .documentType("PRODUCTION_ORDER")
                .documentId(documentId)
                .companyId(companyId)
                .status("REJECTED")
                .build();

        when(documentRegistry.load("PRODUCTION_ORDER", documentId, companyId)).thenReturn(workflowDocument);

        ResponseEntity<InventoryApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        verify(workflowDocument).onWorkflowRejected();
    }

    @Test
    void handleWorkflowCallback_ValidSecret_ReturnedEvent_CallsOnWorkflowReturned() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_RETURNED")
                .documentType("PRODUCTION_ORDER")
                .documentId(documentId)
                .companyId(companyId)
                .status("RETURNED")
                .build();

        when(documentRegistry.load("PRODUCTION_ORDER", documentId, companyId)).thenReturn(workflowDocument);

        ResponseEntity<InventoryApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        verify(workflowDocument).onWorkflowReturned();
    }

    @Test
    void handleWorkflowCallback_ValidSecret_CancelledEvent_CallsOnWorkflowCancelled() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_CANCELLED")
                .documentType("PRODUCTION_ORDER")
                .documentId(documentId)
                .companyId(companyId)
                .status("CANCELLED")
                .build();

        when(documentRegistry.load("PRODUCTION_ORDER", documentId, companyId)).thenReturn(workflowDocument);

        ResponseEntity<InventoryApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        verify(workflowDocument).onWorkflowCancelled();
    }

    @Test
    void handleWorkflowCallback_Bom_ApprovedEvent_CallsOnWorkflowApproved() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("BOM")
                .documentId(documentId)
                .companyId(companyId)
                .status("APPROVED")
                .build();

        when(documentRegistry.load("BOM", documentId, companyId)).thenReturn(workflowDocument);

        ResponseEntity<InventoryApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        verify(workflowDocument).onWorkflowApproved(any());
    }

    @Test
    void handleWorkflowCallback_InvalidSecret_ReturnsUnauthorized() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("PRODUCTION_ORDER")
                .documentId(documentId)
                .companyId(companyId)
                .build();

        ResponseEntity<InventoryApiResponse<Void>> response = controller.handleWorkflowCallback("wrong-secret", event);

        assertNotNull(response);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        verifyNoInteractions(documentRegistry);
        verifyNoInteractions(workflowDocument);
    }

    @Test
    void handleWorkflowCallback_MissingSecretHeader_ReturnsUnauthorized() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("PRODUCTION_ORDER")
                .documentId(documentId)
                .companyId(companyId)
                .build();

        ResponseEntity<InventoryApiResponse<Void>> response = controller.handleWorkflowCallback(null, event);

        assertNotNull(response);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        verifyNoInteractions(documentRegistry);
    }

    @Test
    void handleWorkflowCallback_MissingRequiredFields_ReturnsBadRequest() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("PRODUCTION_ORDER")
                .build();

        ResponseEntity<InventoryApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        verifyNoInteractions(documentRegistry);
    }

    @Test
    void handleWorkflowCallback_DocumentNotFound_IgnoredGracefully() {
        WorkflowCallbackEventDto event = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("PRODUCTION_ORDER")
                .documentId(documentId)
                .companyId(companyId)
                .status("APPROVED")
                .build();

        when(documentRegistry.load("PRODUCTION_ORDER", documentId, companyId)).thenReturn(null);

        ResponseEntity<InventoryApiResponse<Void>> response = controller.handleWorkflowCallback(VALID_SECRET, event);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Document not found, ignored", response.getBody().getMessage());
        verifyNoInteractions(workflowDocument);
    }
}
