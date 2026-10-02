package com.erp.account.integration.workflow.client;

import com.erp.account.common.dto.request.ApiRequest;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.integration.workflow.dto.WorkflowActionRequestDto;
import com.erp.account.integration.workflow.dto.WorkflowSubmitRequestDto;
import com.erp.account.integration.workflow.dto.WorkflowTaskDto;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowClientImpl implements WorkflowClient {

    private final WorkflowServiceClient feignClient;

    @Value("${account.service.callback-base-url:http://account-service:8081}")
    private String callbackBaseUrl;

    @Override
    public WorkflowTransactionDto submitWorkflow(UUID companyId, String documentType, UUID documentId, String documentNumber, String comments) {
        UUID effectiveCompanyId = companyId != null ? companyId : TenantUtils.getCurrentCompanyId();
        UUID userId = CurrentUserContext.getUserId();
        String username = CurrentUserContext.getUsername();

        WorkflowSubmitRequestDto payload = WorkflowSubmitRequestDto.builder()
                .companyId(effectiveCompanyId)
                .moduleName("ACCOUNT")
                .entityType(documentType)
                .entityId(documentId)
                .documentType(documentType)
                .documentId(documentId)
                .documentNumber(documentNumber)
                .callbackUrl(callbackBaseUrl + "/api/v1/account/workflow/callback")
                .initiatedBy(userId)
                .initiatedByName(username)
                .comments(comments)
                .build();

        ApiResponse<WorkflowTransactionDto> response = feignClient.submitWorkflow(new ApiRequest<>(payload));
        if (response == null || !response.isSuccess() || response.getData() == null) {
            String errorMsg = response != null ? response.getMessage() : "Unknown error";
            log.error("Failed to submit workflow to workflow-service: {}", errorMsg);
            throw new BadRequestException("Failed to initiate workflow: " + errorMsg);
        }
        return response.getData();
    }

    @Override
    public WorkflowTransactionDto getWorkflow(UUID transactionId) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        ApiResponse<WorkflowTransactionDto> response = feignClient.getTransaction(transactionId, companyId);
        return response != null ? response.getData() : null;
    }

    @Override
    public WorkflowTransactionDto getWorkflowByDocument(UUID companyId, String documentType, UUID documentId) {
        UUID effectiveCompanyId = companyId != null ? companyId : TenantUtils.getCurrentCompanyId();
        ApiResponse<WorkflowTransactionDto> response = feignClient.getTransactionByDocument(effectiveCompanyId, documentType, documentId);
        return response != null ? response.getData() : null;
    }

    @Override
    public WorkflowTaskDto approveTask(UUID taskId, String comments) {
        WorkflowActionRequestDto payload = WorkflowActionRequestDto.builder()
                .taskId(taskId)
                .comments(comments)
                .build();

        ApiResponse<WorkflowTaskDto> response = feignClient.approveTask(taskId, new ApiRequest<>(payload));
        if (response == null || !response.isSuccess()) {
            throw new BadRequestException("Failed to approve task: " + (response != null ? response.getMessage() : "error"));
        }
        return response.getData();
    }

    @Override
    public WorkflowTaskDto rejectTask(UUID taskId, String comments) {
        WorkflowActionRequestDto payload = WorkflowActionRequestDto.builder()
                .taskId(taskId)
                .comments(comments)
                .reason(comments)
                .build();

        ApiResponse<WorkflowTaskDto> response = feignClient.rejectTask(taskId, new ApiRequest<>(payload));
        if (response == null || !response.isSuccess()) {
            throw new BadRequestException("Failed to reject task: " + (response != null ? response.getMessage() : "error"));
        }
        return response.getData();
    }

    @Override
    public WorkflowTaskDto returnTask(UUID taskId, String comments) {
        WorkflowActionRequestDto payload = WorkflowActionRequestDto.builder()
                .taskId(taskId)
                .comments(comments)
                .reason(comments)
                .build();

        ApiResponse<WorkflowTaskDto> response = feignClient.returnTask(taskId, new ApiRequest<>(payload));
        if (response == null || !response.isSuccess()) {
            throw new BadRequestException("Failed to return task: " + (response != null ? response.getMessage() : "error"));
        }
        return response.getData();
    }

    @Override
    public WorkflowTaskDto delegateTask(UUID taskId, UUID targetUserId, String comments) {
        WorkflowActionRequestDto payload = WorkflowActionRequestDto.builder()
                .taskId(taskId)
                .targetUserId(targetUserId)
                .comments(comments)
                .build();

        ApiResponse<WorkflowTaskDto> response = feignClient.delegateTask(taskId, new ApiRequest<>(payload));
        if (response == null || !response.isSuccess()) {
            throw new BadRequestException("Failed to delegate task: " + (response != null ? response.getMessage() : "error"));
        }
        return response.getData();
    }

    @Override
    public WorkflowTransactionDto cancelWorkflow(UUID transactionId, String reason) {
        WorkflowActionRequestDto payload = WorkflowActionRequestDto.builder()
                .reason(reason)
                .build();

        ApiResponse<WorkflowTransactionDto> response = feignClient.cancelWorkflow(transactionId, new ApiRequest<>(payload));
        if (response == null || !response.isSuccess()) {
            throw new BadRequestException("Failed to cancel workflow: " + (response != null ? response.getMessage() : "error"));
        }
        return response.getData();
    }
}
