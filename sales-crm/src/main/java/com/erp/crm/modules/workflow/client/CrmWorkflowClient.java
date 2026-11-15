package com.erp.crm.modules.workflow.client;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;
import java.util.UUID;

public interface CrmWorkflowClient {

    UUID initiateQuotationApproval(UUID companyId, UUID quotationId, String quotationNumber,
                                   UUID initiatedBy, String initiatedByName,
                                   Map<String, Object> variables);

    @Getter
    @Setter
    @Builder
    class InitiateTransactionRequest {
        private UUID companyId;
        private String moduleName;
        private String documentType;
        private UUID documentId;
        private String documentNumber;
        private String entityType;
        private UUID entityId;
        private UUID initiatedBy;
        private String initiatedByName;
        private String callbackUrl;
        private Map<String, Object> variables;
    }
}

