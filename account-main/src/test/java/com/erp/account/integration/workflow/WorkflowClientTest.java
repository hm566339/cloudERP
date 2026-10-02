package com.erp.account.integration.workflow;

import com.erp.account.common.dto.request.ApiRequest;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.integration.workflow.client.WorkflowClientImpl;
import com.erp.account.integration.workflow.client.WorkflowServiceClient;
import com.erp.account.integration.workflow.dto.WorkflowActionRequestDto;
import com.erp.account.integration.workflow.dto.WorkflowSubmitRequestDto;
import com.erp.account.integration.workflow.dto.WorkflowTaskDto;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowClientTest {

    @Mock
    private WorkflowServiceClient feignClient;

    @InjectMocks
    private WorkflowClientImpl workflowClient;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(workflowClient, "callbackBaseUrl", "http://account-service:8081");
    }

    @Test
    void testSubmitWorkflow_Success() {
        UUID companyId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        UUID txnId = UUID.randomUUID();

        WorkflowTransactionDto responseDto = WorkflowTransactionDto.builder()
                .id(txnId)
                .companyId(companyId)
                .documentType("SALES_INVOICE")
                .documentId(docId)
                .status("PENDING")
                .build();

        when(feignClient.submitWorkflow(any())).thenReturn(ApiResponse.success(responseDto));

        WorkflowTransactionDto result = workflowClient.submitWorkflow(
                companyId, "SALES_INVOICE", docId, "INV-001", "Please approve");

        assertNotNull(result);
        assertEquals(txnId, result.getId());
        assertEquals("PENDING", result.getStatus());
        verify(feignClient, times(1)).submitWorkflow(any());
    }

    @Test
    void testApproveTask_Success() {
        UUID taskId = UUID.randomUUID();

        WorkflowTaskDto responseDto = WorkflowTaskDto.builder()
                .id(taskId)
                .taskStatus("APPROVED")
                .comments("Looks good")
                .build();

        when(feignClient.approveTask(eq(taskId), any())).thenReturn(ApiResponse.success(responseDto));

        WorkflowTaskDto result = workflowClient.approveTask(taskId, "Looks good");

        assertNotNull(result);
        assertEquals("APPROVED", result.getTaskStatus());
        verify(feignClient, times(1)).approveTask(eq(taskId), any());
    }

    @Test
    void testRejectTask_Success() {
        UUID taskId = UUID.randomUUID();

        WorkflowTaskDto responseDto = WorkflowTaskDto.builder()
                .id(taskId)
                .taskStatus("REJECTED")
                .comments("Incorrect amount")
                .build();

        when(feignClient.rejectTask(eq(taskId), any())).thenReturn(ApiResponse.success(responseDto));

        WorkflowTaskDto result = workflowClient.rejectTask(taskId, "Incorrect amount");

        assertNotNull(result);
        assertEquals("REJECTED", result.getTaskStatus());
        verify(feignClient, times(1)).rejectTask(eq(taskId), any());
    }
}
