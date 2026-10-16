package com.erp.workflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitWorkflowRequest {

    @NotNull(message = "companyId is required")
    private UUID companyId;

    /** ERP module name: ACCOUNT, INVENTORY, CRM, PURCHASE, SALES, MANUFACTURING, HR */
    private String moduleName;

    /** Business entity type: e.g. STOCK_ADJUSTMENT, FISCAL_YEAR, PURCHASE_ORDER */
    private String entityType;

    /** Business entity primary key */
    private UUID entityId;

    /** Document type mapped to workflow definition */
    @NotBlank(message = "documentType is required")
    private String documentType;

    /** Document ID */
    @NotNull(message = "documentId is required")
    private UUID documentId;

    /** Human readable identifier (e.g. FY-2026, SA-001) */
    private String documentNumber;

    /** Specific workflow definition ID (optional — will resolve default by documentType if null) */
    private UUID workflowDefinitionId;

    /** Outbound webhook callback URL to notify business service when workflow completes/rejects */
    private String callbackUrl;

    /** Initiator user ID */
    @NotNull(message = "initiatedBy is required")
    private UUID initiatedBy;

    /** Initiator display name */
    private String initiatedByName;

    /** Initial submission comment */
    private String comments;

    /** Monetary amount of the document (used for threshold validation) */
    private java.math.BigDecimal amount;

    /** Customer ID associated with document (used for customer scope validation) */
    private UUID customerId;

    /** Optional custom metadata (JSON) */
    private Map<String, Object> metadata;
}
