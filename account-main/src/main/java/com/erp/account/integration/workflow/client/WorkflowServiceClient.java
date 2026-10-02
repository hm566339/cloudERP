package com.erp.account.integration.workflow.client;

import com.erp.account.common.dto.request.ApiRequest;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.integration.workflow.dto.WorkflowActionRequestDto;
import com.erp.account.integration.workflow.dto.WorkflowSubmitRequestDto;
import com.erp.account.integration.workflow.dto.WorkflowTaskDto;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@FeignClient(
    name = "workflow-service",
    url = "${workflow.service.base-url:http://localhost:8083}"
)
public interface WorkflowServiceClient {

    @PostMapping("/api/v1/workflow/transactions/submit")
    ApiResponse<WorkflowTransactionDto> submitWorkflow(
            @RequestBody ApiRequest<WorkflowSubmitRequestDto> request);

    @GetMapping("/api/v1/workflow/transactions/{id}")
    ApiResponse<WorkflowTransactionDto> getTransaction(
            @PathVariable("id") UUID id,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @GetMapping("/api/v1/workflow/transactions/document")
    ApiResponse<WorkflowTransactionDto> getTransactionByDocument(
            @RequestParam(value = "companyId", required = false) UUID companyId,
            @RequestParam("documentType") String documentType,
            @RequestParam("documentId") UUID documentId);

    @PostMapping("/api/v1/workflow/tasks/{id}/approve")
    ApiResponse<WorkflowTaskDto> approveTask(
            @PathVariable("id") UUID id,
            @RequestBody ApiRequest<WorkflowActionRequestDto> request);

    @PostMapping("/api/v1/workflow/tasks/{id}/reject")
    ApiResponse<WorkflowTaskDto> rejectTask(
            @PathVariable("id") UUID id,
            @RequestBody ApiRequest<WorkflowActionRequestDto> request);

    @PostMapping("/api/v1/workflow/tasks/{id}/return")
    ApiResponse<WorkflowTaskDto> returnTask(
            @PathVariable("id") UUID id,
            @RequestBody ApiRequest<WorkflowActionRequestDto> request);

    @PostMapping("/api/v1/workflow/tasks/{id}/delegate")
    ApiResponse<WorkflowTaskDto> delegateTask(
            @PathVariable("id") UUID id,
            @RequestBody ApiRequest<WorkflowActionRequestDto> request);

    @PostMapping("/api/v1/workflow/transactions/{id}/cancel")
    ApiResponse<WorkflowTransactionDto> cancelWorkflow(
            @PathVariable("id") UUID id,
            @RequestBody ApiRequest<WorkflowActionRequestDto> request);

    @GetMapping("/api/v1/workflow/tasks/my-tasks")
    ApiResponse<Object> getMyTasks(
            @RequestParam(value = "userId", required = false) UUID userId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size);
}
