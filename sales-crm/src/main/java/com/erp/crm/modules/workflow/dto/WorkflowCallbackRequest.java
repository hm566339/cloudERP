package com.erp.crm.modules.workflow.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowCallbackRequest {

    private UUID transactionId;
    private String moduleName;
    private String documentType;
    private UUID documentId;
    private String documentNumber;
    private String action; // APPROVE, REJECT, RETURN
    private String status; // APPROVED, REJECTED
    private UUID resolvedByUserId;
    private String resolvedByUserName;
    private String comments;
}

