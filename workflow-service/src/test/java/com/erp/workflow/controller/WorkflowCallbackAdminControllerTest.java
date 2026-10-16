package com.erp.workflow.controller;

import com.erp.workflow.callback.WorkflowCallbackService;
import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.response.WorkflowCallbackLogResponse;
import com.erp.workflow.exception.ResourceNotFoundException;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.security.CurrentUserContext;
import com.erp.workflow.security.authorization.AuthenticatedUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowCallbackAdminControllerTest {

    @Mock
    private WorkflowCallbackService callbackService;

    @InjectMocks
    private WorkflowCallbackAdminController controller;

    private UUID companyId;
    private UUID logId;

    @BeforeEach
    void setUp() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
        companyId = UUID.randomUUID();
        logId = UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    private void authenticateWithRole(String role) {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("test.user")
                .organizationId(companyId)
                .roles(List.of(role))
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)))
        );
        CurrentUserContext.setCompanyId(companyId);
    }

    @Test
    @DisplayName("Unauthorized caller without admin role cannot view exhausted callbacks")
    void testUnauthorizedUserCannotAccessExhaustedCallbacks() {
        authenticateWithRole("USER");

        assertThatThrownBy(() -> controller.getExhaustedCallbacks(companyId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Administrative privileges required");

        verifyNoInteractions(callbackService);
    }

    @Test
    @DisplayName("Unauthorized caller without admin role cannot retry callbacks")
    void testUnauthorizedUserCannotRetryCallback() {
        authenticateWithRole("USER");

        assertThatThrownBy(() -> controller.retryCallback(logId, companyId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Administrative privileges required");

        verifyNoInteractions(callbackService);
    }

    @Test
    @DisplayName("WORKFLOW_ADMIN can inspect exhausted callbacks")
    void testAdminCanGetExhaustedCallbacks() {
        authenticateWithRole("WORKFLOW_ADMIN");

        WorkflowCallbackLogResponse item = WorkflowCallbackLogResponse.builder()
                .id(logId)
                .companyId(companyId)
                .documentType("STOCK_TRANSFER")
                .documentNumber("ST-001")
                .eventType("APPROVED")
                .attemptCount(5)
                .succeeded(false)
                .build();

        when(callbackService.getExhaustedCallbacks(companyId)).thenReturn(List.of(item));

        ResponseEntity<ApiResponse<List<WorkflowCallbackLogResponse>>> response =
                controller.getExhaustedCallbacks(companyId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).hasSize(1);
        assertThat(response.getBody().getData().get(0).getId()).isEqualTo(logId);
        verify(callbackService).getExhaustedCallbacks(companyId);
    }

    @Test
    @DisplayName("SYSTEM_ADMIN can retry an eligible failed callback")
    void testAdminCanRetryCallbackSuccessfully() {
        authenticateWithRole("SYSTEM_ADMIN");

        WorkflowCallbackLogResponse retried = WorkflowCallbackLogResponse.builder()
                .id(logId)
                .companyId(companyId)
                .documentType("SALES_INVOICE")
                .documentNumber("SINV-001")
                .eventType("APPROVED")
                .attemptCount(6)
                .succeeded(true)
                .responseStatus(200)
                .lastAttemptedAt(LocalDateTime.now())
                .build();

        when(callbackService.retryCallbackManually(logId, companyId)).thenReturn(retried);

        ResponseEntity<ApiResponse<WorkflowCallbackLogResponse>> response =
                controller.retryCallback(logId, companyId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getSucceeded()).isTrue();
        assertThat(response.getBody().getData().getAttemptCount()).isEqualTo(6);
        verify(callbackService).retryCallbackManually(logId, companyId);
    }

    @Test
    @DisplayName("Retry fails with 404 when callback log is not found")
    void testRetryCallbackWithMissingLogThrowsNotFound() {
        authenticateWithRole("WORKFLOW_ADMIN");

        when(callbackService.retryCallbackManually(logId, companyId))
                .thenThrow(new ResourceNotFoundException("Workflow callback log not found with ID: " + logId));

        assertThatThrownBy(() -> controller.retryCallback(logId, companyId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Workflow callback log not found");
    }

    @Test
    @DisplayName("Retry fails with 403 when callback belongs to a different company")
    void testRetryCallbackCrossCompanyThrowsAccessDenied() {
        authenticateWithRole("WORKFLOW_ADMIN");

        when(callbackService.retryCallbackManually(logId, companyId))
                .thenThrow(new AccessDeniedException("Callback log does not belong to the caller company"));

        assertThatThrownBy(() -> controller.retryCallback(logId, companyId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Callback log does not belong to the caller company");
    }

    @Test
    @DisplayName("Retry fails when callback has already succeeded (duplicate execution prevented)")
    void testRetryCallbackAlreadySucceededThrowsException() {
        authenticateWithRole("WORKFLOW_ADMIN");

        when(callbackService.retryCallbackManually(logId, companyId))
                .thenThrow(new WorkflowValidationException("Callback has already succeeded. Re-triggering completed callbacks is not permitted."));

        assertThatThrownBy(() -> controller.retryCallback(logId, companyId))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("already succeeded");
    }

    @Test
    @DisplayName("Retry fails when callback retry attempts exceeded limit (10 attempts)")
    void testRetryCallbackAttemptLimitExceededThrowsException() {
        authenticateWithRole("WORKFLOW_ADMIN");

        when(callbackService.retryCallbackManually(logId, companyId))
                .thenThrow(new WorkflowValidationException("Callback has exceeded the maximum allowed retry limit (10 attempts). Manual intervention required."));

        assertThatThrownBy(() -> controller.retryCallback(logId, companyId))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("maximum allowed retry limit");
    }

    @Test
    @DisplayName("Retry fails when duplicate/concurrent retry request is made within 10s window")
    void testRetryCallbackConcurrentOrDuplicateThrowsException() {
        authenticateWithRole("WORKFLOW_ADMIN");

        when(callbackService.retryCallbackManually(logId, companyId))
                .thenThrow(new WorkflowValidationException("Callback retry is in progress or was attempted too recently. Please wait before retrying."));

        assertThatThrownBy(() -> controller.retryCallback(logId, companyId))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("in progress or was attempted too recently");
    }
}
