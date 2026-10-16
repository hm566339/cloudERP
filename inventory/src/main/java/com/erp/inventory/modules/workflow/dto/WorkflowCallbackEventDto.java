package com.erp.inventory.modules.workflow.dto;

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
public class WorkflowCallbackEventDto {
    private UUID eventId;
    private UUID transactionId;
    private String eventType;
    private String documentType;
    private UUID documentId;
    private UUID companyId;
    private String status;
    private String reason;
    private UUID performedBy;
    private String performedByName;
    private LocalDateTime timestamp;
}
