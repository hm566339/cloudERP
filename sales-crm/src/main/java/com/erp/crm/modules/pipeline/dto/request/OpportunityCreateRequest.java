package com.erp.crm.modules.pipeline.dto.request;

import com.erp.crm.modules.pipeline.enums.OpportunityDealType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpportunityCreateRequest {

    @NotBlank(message = "Opportunity name is required")
    private String opportunityName;

    @NotNull(message = "Pipeline ID is required")
    private UUID pipelineId;

    private UUID currentStageId;

    private UUID accountId;

    private UUID primaryContactId;

    private UUID originLeadId;

    @NotNull(message = "Deal value is required")
    private BigDecimal dealValue;

    @Builder.Default
    private String currency = "INR";

    @NotNull(message = "Expected close date is required")
    private LocalDate expectedCloseDate;

    private Integer probabilityPct;

    private UUID ownerUserId;

    private UUID assignedTeamId;

    @Builder.Default
    private OpportunityDealType dealType = OpportunityDealType.NEW_BUSINESS;

    private List<ItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemRequest {
        private UUID productId;
        private String productCode;
        @NotBlank(message = "Product name is required")
        private String productName;
        private String description;
        private BigDecimal quantity;
        private String uom;
        private BigDecimal unitPrice;
        private BigDecimal discountPct;
        private BigDecimal taxPct;
    }
}

