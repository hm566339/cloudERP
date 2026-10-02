package com.erp.workflow.callback;

import com.erp.workflow.entity.WorkflowCallbackLog;
import com.erp.workflow.entity.WorkflowTransaction;
import com.erp.workflow.repository.WorkflowCallbackLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowCallbackServiceImpl implements WorkflowCallbackService {

    private final WorkflowCallbackLogRepository callbackLogRepository;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.builder().build();

    @Value("${workflow.callback.retry-enabled:true}")
    private boolean retryEnabled;

    @Override
    @Async
    public void triggerCallback(WorkflowTransaction transaction, String eventType, String comments, UUID actionByUserId, String actionByUserName) {
        String callbackUrl = transaction.getCallbackUrl();
        if (!StringUtils.hasText(callbackUrl)) {
            log.debug("No callback URL defined for workflow transaction {}", transaction.getId());
            return;
        }

        WorkflowCallbackPayload payload = WorkflowCallbackPayload.builder()
                .transactionId(transaction.getId())
                .companyId(transaction.getCompanyId())
                .moduleName(transaction.getModuleName())
                .entityType(transaction.getEntityType())
                .entityId(transaction.getEntityId())
                .documentType(transaction.getDocumentType())
                .documentId(transaction.getDocumentId())
                .documentNumber(transaction.getDocumentNumber())
                .eventType(eventType)
                .status(transaction.getStatus())
                .stageCode(transaction.getCurrentStage() != null ? transaction.getCurrentStage().getStageCode() : null)
                .stageName(transaction.getCurrentStage() != null ? transaction.getCurrentStage().getStageName() : null)
                .actionByUserId(actionByUserId)
                .actionByUserName(actionByUserName)
                .comments(comments)
                .timestamp(LocalDateTime.now())
                .build();

        executeCallback(transaction, callbackUrl, eventType, payload, 1);
    }

    private void executeCallback(WorkflowTransaction transaction, String callbackUrl, String eventType, WorkflowCallbackPayload payload, int attemptCount) {
        String payloadJson = null;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize callback payload", e);
        }

        boolean success = false;
        Integer statusCode = null;
        String responseBody = null;

        try {
            ResponseEntity<String> response = restClient.post()
                    .uri(callbackUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toEntity(String.class);

            statusCode = response.getStatusCode().value();
            responseBody = response.getBody();
            success = response.getStatusCode().is2xxSuccessful();
            log.info("Callback to {} succeeded with status {}", callbackUrl, statusCode);
        } catch (Exception ex) {
            log.warn("Callback to {} failed: {}", callbackUrl, ex.getMessage());
            responseBody = ex.getMessage();
            statusCode = 500;
        }

        try {
            WorkflowCallbackLog logEntry = WorkflowCallbackLog.builder()
                    .workflowTransaction(transaction)
                    .eventType(eventType)
                    .callbackUrl(callbackUrl)
                    .requestPayload(payloadJson)
                    .responseStatus(statusCode)
                    .responseBody(responseBody != null && responseBody.length() > 2000 ? responseBody.substring(0, 2000) : responseBody)
                    .attemptCount(attemptCount)
                    .lastAttemptedAt(LocalDateTime.now())
                    .succeeded(success)
                    .createdAt(LocalDateTime.now())
                    .build();

            callbackLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Failed to save callback log", e);
        }
    }

    @Override
    @Scheduled(fixedDelay = 60000)
    public void retryPendingCallbacks() {
        if (!retryEnabled) return;

        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(2);
        List<WorkflowCallbackLog> pending = callbackLogRepository
                .findBySucceededFalseAndAttemptCountLessThanAndLastAttemptedAtBefore(5, cutoff);

        for (WorkflowCallbackLog logEntry : pending) {
            try {
                WorkflowTransaction txn = logEntry.getWorkflowTransaction();
                if (txn == null || !StringUtils.hasText(logEntry.getCallbackUrl())) continue;

                ResponseEntity<String> response = restClient.post()
                        .uri(logEntry.getCallbackUrl())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(logEntry.getRequestPayload())
                        .retrieve()
                        .toEntity(String.class);

                logEntry.setResponseStatus(response.getStatusCode().value());
                logEntry.setResponseBody(response.getBody());
                logEntry.setSucceeded(response.getStatusCode().is2xxSuccessful());
                logEntry.setAttemptCount(logEntry.getAttemptCount() + 1);
                logEntry.setLastAttemptedAt(LocalDateTime.now());
                callbackLogRepository.save(logEntry);
            } catch (Exception e) {
                logEntry.setAttemptCount(logEntry.getAttemptCount() + 1);
                logEntry.setLastAttemptedAt(LocalDateTime.now());
                logEntry.setResponseBody(e.getMessage());
                callbackLogRepository.save(logEntry);
            }
        }
    }
}
