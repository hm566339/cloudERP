package com.erp.workflow.dto.response;

import com.erp.workflow.entity.WorkflowCallbackLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowCallbackLogResponse {

    private UUID id;
    private UUID transactionId;
    private UUID companyId;
    private String moduleName;
    private String documentType;
    private String documentNumber;
    private String eventType;
    private String callbackUrl;
    private String requestPayload;
    private Integer responseStatus;
    private String responseBody;
    private Integer attemptCount;
    private LocalDateTime lastAttemptedAt;
    private Boolean succeeded;
    private LocalDateTime createdAt;

    public static WorkflowCallbackLogResponse fromEntity(WorkflowCallbackLog logEntry) {
        if (logEntry == null) return null;
        UUID transactionId = null;
        UUID companyId = null;
        String moduleName = null;
        String documentType = null;
        String documentNumber = null;
        if (logEntry.getWorkflowTransaction() != null) {
            transactionId = logEntry.getWorkflowTransaction().getId();
            companyId = logEntry.getWorkflowTransaction().getCompanyId();
            moduleName = logEntry.getWorkflowTransaction().getModuleName();
            documentType = logEntry.getWorkflowTransaction().getDocumentType();
            documentNumber = logEntry.getWorkflowTransaction().getDocumentNumber();
        }
        return WorkflowCallbackLogResponse.builder()
                .id(logEntry.getId())
                .transactionId(transactionId)
                .companyId(companyId)
                .moduleName(moduleName)
                .documentType(documentType)
                .documentNumber(documentNumber)
                .eventType(logEntry.getEventType())
                .callbackUrl(logEntry.getCallbackUrl())
                .requestPayload(logEntry.getRequestPayload())
                .responseStatus(logEntry.getResponseStatus())
                .responseBody(logEntry.getResponseBody())
                .attemptCount(logEntry.getAttemptCount())
                .lastAttemptedAt(logEntry.getLastAttemptedAt())
                .succeeded(logEntry.getSucceeded())
                .createdAt(logEntry.getCreatedAt())
                .build();
    }
}
