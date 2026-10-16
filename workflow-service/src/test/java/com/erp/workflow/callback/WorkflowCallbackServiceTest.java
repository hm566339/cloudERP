package com.erp.workflow.callback;

import com.erp.workflow.dto.response.WorkflowCallbackLogResponse;
import com.erp.workflow.entity.WorkflowCallbackLog;
import com.erp.workflow.entity.WorkflowTransaction;
import com.erp.workflow.exception.ResourceNotFoundException;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.repository.WorkflowCallbackLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowCallbackServiceTest {

    @Mock
    private WorkflowCallbackLogRepository callbackLogRepository;

    private ObjectMapper objectMapper;
    private MeterRegistry meterRegistry;
    private WorkflowCallbackServiceImpl callbackService;

    private UUID companyId;
    private UUID logId;
    private WorkflowTransaction transaction;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        meterRegistry = new SimpleMeterRegistry();
        callbackService = new WorkflowCallbackServiceImpl(
                callbackLogRepository,
                objectMapper,
                Optional.of(meterRegistry)
        );

        companyId = UUID.randomUUID();
        logId = UUID.randomUUID();

        transaction = WorkflowTransaction.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .documentType("STOCK_TRANSFER")
                .documentNumber("ST-1001")
                .build();
    }

    @Test
    @DisplayName("getExhaustedCallbacks queries repository with companyId when provided")
    void testGetExhaustedCallbacksWithCompany() {
        WorkflowCallbackLog logEntry = WorkflowCallbackLog.builder()
                .id(logId)
                .workflowTransaction(transaction)
                .eventType("APPROVED")
                .attemptCount(5)
                .succeeded(false)
                .build();

        when(callbackLogRepository.findExhaustedCallbacksByCompanyId(5, companyId))
                .thenReturn(List.of(logEntry));

        List<WorkflowCallbackLogResponse> result = callbackService.getExhaustedCallbacks(companyId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(logId);
        assertThat(result.get(0).getCompanyId()).isEqualTo(companyId);
        assertThat(result.get(0).getDocumentNumber()).isEqualTo("ST-1001");
    }

    @Test
    @DisplayName("retryCallbackManually throws ResourceNotFoundException if log does not exist")
    void testRetryCallbackNotFound() {
        when(callbackLogRepository.findById(logId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> callbackService.retryCallbackManually(logId, companyId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Workflow callback log not found");
    }

    @Test
    @DisplayName("retryCallbackManually throws AccessDeniedException if caller company does not match")
    void testRetryCallbackCrossCompanyForbidden() {
        UUID otherCompanyId = UUID.randomUUID();
        WorkflowCallbackLog logEntry = WorkflowCallbackLog.builder()
                .id(logId)
                .workflowTransaction(transaction)
                .succeeded(false)
                .attemptCount(5)
                .build();

        when(callbackLogRepository.findById(logId)).thenReturn(Optional.of(logEntry));

        assertThatThrownBy(() -> callbackService.retryCallbackManually(logId, otherCompanyId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("does not belong to the caller company");
    }

    @Test
    @DisplayName("retryCallbackManually throws WorkflowValidationException if callback already succeeded")
    void testRetryCallbackAlreadySucceeded() {
        WorkflowCallbackLog logEntry = WorkflowCallbackLog.builder()
                .id(logId)
                .workflowTransaction(transaction)
                .succeeded(true)
                .attemptCount(1)
                .build();

        when(callbackLogRepository.findById(logId)).thenReturn(Optional.of(logEntry));

        assertThatThrownBy(() -> callbackService.retryCallbackManually(logId, companyId))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("already succeeded");
    }

    @Test
    @DisplayName("retryCallbackManually throws WorkflowValidationException if attempt count reaches or exceeds 10")
    void testRetryCallbackMaxAttemptsExceeded() {
        WorkflowCallbackLog logEntry = WorkflowCallbackLog.builder()
                .id(logId)
                .workflowTransaction(transaction)
                .succeeded(false)
                .attemptCount(10)
                .build();

        when(callbackLogRepository.findById(logId)).thenReturn(Optional.of(logEntry));

        assertThatThrownBy(() -> callbackService.retryCallbackManually(logId, companyId))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("exceeded the maximum allowed retry limit");
    }

    @Test
    @DisplayName("retryCallbackManually throws WorkflowValidationException if retried concurrently or within 10s")
    void testRetryCallbackConcurrentOrRecent() {
        WorkflowCallbackLog logEntry = WorkflowCallbackLog.builder()
                .id(logId)
                .workflowTransaction(transaction)
                .succeeded(false)
                .attemptCount(5)
                .lastAttemptedAt(LocalDateTime.now().minusSeconds(3))
                .build();

        when(callbackLogRepository.findById(logId)).thenReturn(Optional.of(logEntry));

        assertThatThrownBy(() -> callbackService.retryCallbackManually(logId, companyId))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("in progress or was attempted too recently");
    }

    @Test
    @DisplayName("retryCallbackManually executes retry, updates attemptCount, and increments exhaustion metric on failure")
    void testRetryCallbackExecutesAndObservabilityAlert() {
        WorkflowCallbackLog logEntry = WorkflowCallbackLog.builder()
                .id(logId)
                .workflowTransaction(transaction)
                .eventType("APPROVED")
                .callbackUrl("http://localhost:59999/non-existent-endpoint")
                .requestPayload("{\"test\": true}")
                .succeeded(false)
                .attemptCount(4)
                .lastAttemptedAt(LocalDateTime.now().minusMinutes(5))
                .build();

        when(callbackLogRepository.findById(logId)).thenReturn(Optional.of(logEntry));
        when(callbackLogRepository.save(any(WorkflowCallbackLog.class))).thenAnswer(i -> i.getArgument(0));

        WorkflowCallbackLogResponse response = callbackService.retryCallbackManually(logId, companyId);

        assertThat(response).isNotNull();
        assertThat(response.getAttemptCount()).isEqualTo(5);
        assertThat(response.getSucceeded()).isFalse();

        // Verify Micrometer metric was registered and incremented on exhaustion (attempt >= 5)
        assertThat(meterRegistry.find("workflow.callback.exhaustion").counter()).isNotNull();
        assertThat(meterRegistry.find("workflow.callback.exhaustion").counter().count()).isEqualTo(1.0);

        ArgumentCaptor<WorkflowCallbackLog> captor = ArgumentCaptor.forClass(WorkflowCallbackLog.class);
        verify(callbackLogRepository, atLeastOnce()).save(captor.capture());
        assertThat(captor.getValue().getAttemptCount()).isEqualTo(5);
    }

    @Test
    @DisplayName("retryCallbackManually fails closed when WORKFLOW_CALLBACK_SECRET is missing or empty")
    void testRetryCallback_MissingServerSecret_FailsClosed() {
        org.springframework.test.util.ReflectionTestUtils.setField(callbackService, "callbackSecret", "");

        WorkflowCallbackLog logEntry = WorkflowCallbackLog.builder()
                .id(logId)
                .workflowTransaction(transaction)
                .eventType("APPROVED")
                .callbackUrl("http://localhost:8082/api/inventory/workflow/callback")
                .requestPayload("{\"test\": true}")
                .succeeded(false)
                .attemptCount(1)
                .lastAttemptedAt(LocalDateTime.now().minusMinutes(5))
                .build();

        when(callbackLogRepository.findById(logId)).thenReturn(Optional.of(logEntry));
        when(callbackLogRepository.save(any(WorkflowCallbackLog.class))).thenAnswer(i -> i.getArgument(0));

        WorkflowCallbackLogResponse response = callbackService.retryCallbackManually(logId, companyId);

        assertThat(response).isNotNull();
        assertThat(response.getSucceeded()).isFalse();
        assertThat(response.getResponseStatus()).isEqualTo(500);
        assertThat(response.getResponseBody()).contains("not configured");

        ArgumentCaptor<WorkflowCallbackLog> captor = ArgumentCaptor.forClass(WorkflowCallbackLog.class);
        verify(callbackLogRepository).save(captor.capture());
        assertThat(captor.getValue().getResponseBody()).contains("Workflow callback secret is not configured");
    }
}
