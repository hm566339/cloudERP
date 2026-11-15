package com.erp.crm.modules.workflow.controller;

import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.quotation.service.CrmQuotationService;
import com.erp.crm.modules.workflow.dto.WorkflowCallbackRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmWorkflowControllerTest {

    @Mock
    private CrmQuotationService quotationService;

    @InjectMocks
    private CrmWorkflowController workflowController;

    private static final String TEST_SECRET = "crm-workflow-callback-secret";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(workflowController, "expectedSecret", TEST_SECRET);
    }

    @Test
    @DisplayName("Should accept callback with valid X-Workflow-Secret header")
    void testCallback_ValidSecret_Success() {
        WorkflowCallbackRequest callback = WorkflowCallbackRequest.builder()
                .documentId(UUID.randomUUID())
                .documentType("QUOTATION")
                .action("APPROVE")
                .status("APPROVED")
                .build();

        ResponseEntity<ApiResponse<Void>> response = workflowController.handleCallback(
                TEST_SECRET, null, callback);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(quotationService, times(1)).handleWorkflowCallback(callback);
    }

    @Test
    @DisplayName("Should accept callback with valid X-Internal-Service header")
    void testCallback_ValidInternalService_Success() {
        WorkflowCallbackRequest callback = WorkflowCallbackRequest.builder()
                .documentId(UUID.randomUUID())
                .documentType("QUOTATION")
                .action("APPROVE")
                .status("APPROVED")
                .build();

        ResponseEntity<ApiResponse<Void>> response = workflowController.handleCallback(
                null, "workflow-service", callback);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(quotationService, times(1)).handleWorkflowCallback(callback);
    }

    @Test
    @DisplayName("Should reject callback with invalid secret header (401 Unauthorized)")
    void testCallback_InvalidSecret_Unauthorized() {
        WorkflowCallbackRequest callback = WorkflowCallbackRequest.builder()
                .documentId(UUID.randomUUID())
                .documentType("QUOTATION")
                .action("APPROVE")
                .status("APPROVED")
                .build();

        ResponseEntity<ApiResponse<Void>> response = workflowController.handleCallback(
                "wrong-secret-token", null, callback);

        assertNotNull(response);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(quotationService, never()).handleWorkflowCallback(any());
    }

    @Test
    @DisplayName("Should reject callback with missing authentication headers (401 Unauthorized)")
    void testCallback_MissingHeaders_Unauthorized() {
        WorkflowCallbackRequest callback = WorkflowCallbackRequest.builder()
                .documentId(UUID.randomUUID())
                .documentType("QUOTATION")
                .action("APPROVE")
                .status("APPROVED")
                .build();

        ResponseEntity<ApiResponse<Void>> response = workflowController.handleCallback(
                null, null, callback);

        assertNotNull(response);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(quotationService, never()).handleWorkflowCallback(any());
    }
}

