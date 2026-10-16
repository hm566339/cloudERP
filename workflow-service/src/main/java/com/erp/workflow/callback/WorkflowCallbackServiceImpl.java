package com.erp.workflow.callback;

import com.erp.workflow.dto.response.WorkflowCallbackLogResponse;
import com.erp.workflow.entity.WorkflowCallbackLog;
import com.erp.workflow.entity.WorkflowTransaction;
import com.erp.workflow.exception.ResourceNotFoundException;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.repository.WorkflowCallbackLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowCallbackServiceImpl implements WorkflowCallbackService {

    public static final int MAX_SCHEDULED_ATTEMPTS = 5;
    public static final int MAX_MANUAL_ATTEMPTS = 10;
    public static final int CONCURRENT_RETRY_WINDOW_SECONDS = 10;

    private final WorkflowCallbackLogRepository callbackLogRepository;
    private final ObjectMapper objectMapper;
    private final Optional<MeterRegistry> meterRegistry;

    private RestClient restClient = RestClient.builder().build();

    @Value("${workflow.callback.retry-enabled:true}")
    private boolean retryEnabled;

    @Value("${workflow.callback.secret:erp-workflow-internal-callback-secret}")
    private String callbackSecret;

    void setRestClient(RestClient restClient) {
        this.restClient = restClient;
    }

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

        executeCallback(transaction, callbackUrl, eventType, payload);
    }

    private void executeCallback(WorkflowTransaction transaction, String callbackUrl, String eventType, WorkflowCallbackPayload payload) {
        String payloadJson = null;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize callback payload", e);
        }

        try {
            WorkflowCallbackLog logEntry = WorkflowCallbackLog.builder()
                    .workflowTransaction(transaction)
                    .eventType(eventType)
                    .callbackUrl(callbackUrl)
                    .requestPayload(payloadJson)
                    .attemptCount(0)
                    .succeeded(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            callbackLogRepository.save(logEntry);
            dispatchCallbackHttp(logEntry);
        } catch (Exception e) {
            log.error("Failed to initialize and dispatch callback", e);
        }
    }

    private boolean dispatchCallbackHttp(WorkflowCallbackLog logEntry) {
        if (logEntry == null || !StringUtils.hasText(logEntry.getCallbackUrl())) {
            return false;
        }

        if (!StringUtils.hasText(callbackSecret)) {
            log.error("Cannot dispatch callback: WORKFLOW_CALLBACK_SECRET is not configured on workflow-service.");
            int newAttemptCount = (logEntry.getAttemptCount() != null ? logEntry.getAttemptCount() : 0) + 1;
            logEntry.setResponseStatus(500);
            logEntry.setResponseBody("Workflow callback secret is not configured on workflow-service");
            logEntry.setSucceeded(false);
            logEntry.setAttemptCount(newAttemptCount);
            logEntry.setLastAttemptedAt(LocalDateTime.now());
            callbackLogRepository.save(logEntry);
            if (newAttemptCount >= MAX_SCHEDULED_ATTEMPTS) {
                recordExhaustionAlert(logEntry);
            }
            return false;
        }

        boolean success = false;
        Integer statusCode = null;
        String responseBody = null;

        try {
            ResponseEntity<String> response = restClient.post()
                    .uri(logEntry.getCallbackUrl())
                    .header("X-Workflow-Secret", callbackSecret)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(logEntry.getRequestPayload())
                    .retrieve()
                    .toEntity(String.class);

            statusCode = response.getStatusCode().value();
            responseBody = response.getBody();
            success = response.getStatusCode().is2xxSuccessful();
            log.info("Callback to {} succeeded with status {}", logEntry.getCallbackUrl(), statusCode);
        } catch (Exception ex) {
            log.warn("Callback to {} failed: {}", logEntry.getCallbackUrl(), ex.getMessage());
            responseBody = ex.getMessage();
            statusCode = 500;
        }

        int newAttemptCount = (logEntry.getAttemptCount() != null ? logEntry.getAttemptCount() : 0) + 1;
        logEntry.setResponseStatus(statusCode);
        logEntry.setResponseBody(responseBody != null && responseBody.length() > 2000 ? responseBody.substring(0, 2000) : responseBody);
        logEntry.setSucceeded(success);
        logEntry.setAttemptCount(newAttemptCount);
        logEntry.setLastAttemptedAt(LocalDateTime.now());

        callbackLogRepository.save(logEntry);

        if (!success && newAttemptCount >= MAX_SCHEDULED_ATTEMPTS) {
            recordExhaustionAlert(logEntry);
        }

        return success;
    }

    private void recordExhaustionAlert(WorkflowCallbackLog logEntry) {
        UUID txnId = logEntry.getWorkflowTransaction() != null ? logEntry.getWorkflowTransaction().getId() : null;
        String docType = logEntry.getWorkflowTransaction() != null ? logEntry.getWorkflowTransaction().getDocumentType() : "UNKNOWN";
        String docNumber = logEntry.getWorkflowTransaction() != null ? logEntry.getWorkflowTransaction().getDocumentNumber() : "UNKNOWN";

        log.error("[CALLBACK_EXHAUSTION_ALERT] Outbound workflow callback permanently failed after {} attempts. Log ID: {}, Transaction ID: {}, Document: {} #{}, URL: {}, Last Status: {}, Last Error: {}",
                logEntry.getAttemptCount(),
                logEntry.getId(),
                txnId,
                docType,
                docNumber,
                logEntry.getCallbackUrl(),
                logEntry.getResponseStatus(),
                logEntry.getResponseBody());

        meterRegistry.ifPresent(registry -> {
            try {
                Counter.builder("workflow.callback.exhaustion")
                        .description("Count of outbound workflow callbacks that failed after reaching maximum retries")
                        .tag("documentType", docType != null ? docType : "UNKNOWN")
                        .tag("eventType", logEntry.getEventType() != null ? logEntry.getEventType() : "UNKNOWN")
                        .register(registry)
                        .increment();
            } catch (Exception e) {
                log.debug("Failed to record metric for exhausted callback", e);
            }
        });
    }

    @Override
    @Scheduled(fixedDelay = 60000)
    public void retryPendingCallbacks() {
        if (!retryEnabled) return;

        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(2);
        List<WorkflowCallbackLog> pending = callbackLogRepository
                .findBySucceededFalseAndAttemptCountLessThanAndLastAttemptedAtBefore(MAX_SCHEDULED_ATTEMPTS, cutoff);

        for (WorkflowCallbackLog logEntry : pending) {
            try {
                WorkflowTransaction txn = logEntry.getWorkflowTransaction();
                if (txn == null || !StringUtils.hasText(logEntry.getCallbackUrl())) continue;

                dispatchCallbackHttp(logEntry);
            } catch (Exception e) {
                log.error("Error executing scheduled callback retry for log ID {}", logEntry.getId(), e);
            }
        }
    }

    @Override
    public List<WorkflowCallbackLogResponse> getExhaustedCallbacks(UUID companyId) {
        List<WorkflowCallbackLog> logs;
        if (companyId != null) {
            logs = callbackLogRepository.findExhaustedCallbacksByCompanyId(MAX_SCHEDULED_ATTEMPTS, companyId);
        } else {
            logs = callbackLogRepository.findExhaustedCallbacks(MAX_SCHEDULED_ATTEMPTS);
        }
        return logs.stream()
                .map(WorkflowCallbackLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public WorkflowCallbackLogResponse retryCallbackManually(UUID logId, UUID companyId) {
        if (logId == null) {
            throw new WorkflowValidationException("Callback log ID is required");
        }

        WorkflowCallbackLog logEntry = callbackLogRepository.findById(logId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow callback log not found with ID: " + logId));

        if (companyId != null && logEntry.getWorkflowTransaction() != null
                && !companyId.equals(logEntry.getWorkflowTransaction().getCompanyId())) {
            throw new AccessDeniedException("Callback log does not belong to the caller company");
        }

        if (Boolean.TRUE.equals(logEntry.getSucceeded())) {
            throw new WorkflowValidationException("Callback has already succeeded. Re-triggering completed callbacks is not permitted.");
        }

        if (logEntry.getAttemptCount() != null && logEntry.getAttemptCount() >= MAX_MANUAL_ATTEMPTS) {
            throw new WorkflowValidationException("Callback has exceeded the maximum allowed retry limit (" + MAX_MANUAL_ATTEMPTS + " attempts). Manual intervention required.");
        }

        if (logEntry.getLastAttemptedAt() != null && logEntry.getLastAttemptedAt().isAfter(LocalDateTime.now().minusSeconds(CONCURRENT_RETRY_WINDOW_SECONDS))) {
            throw new WorkflowValidationException("Callback retry is in progress or was attempted too recently. Please wait before retrying.");
        }

        dispatchCallbackHttp(logEntry);

        return WorkflowCallbackLogResponse.fromEntity(logEntry);
    }
}
