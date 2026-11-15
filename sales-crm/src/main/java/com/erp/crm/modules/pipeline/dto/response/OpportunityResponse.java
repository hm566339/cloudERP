package com.erp.crm.modules.pipeline.dto.response;

import com.erp.crm.modules.pipeline.enums.OpportunityDealStatus;
import com.erp.crm.modules.pipeline.enums.OpportunityDealType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpportunityResponse {

    private UUID id;
    private UUID companyId;
    private String opportunityCode;
    private String opportunityName;
    private UUID pipelineId;
    private String pipelineName;
    private UUID currentStageId;
    private String currentStageName;
    private UUID accountId;
    private String accountName;
    private UUID primaryContactId;
    private String contactName;
    private UUID originLeadId;
    private BigDecimal dealValue;
    private String currency;
    private LocalDate expectedCloseDate;
    private Integer probabilityPct;
    private BigDecimal weightedValue;
    private UUID ownerUserId;
    private String ownerUsername;
    private OpportunityDealType dealType;
    private OpportunityDealStatus dealStatus;
    private LocalDateTime wonAt;
    private LocalDateTime lostAt;
    private List<ItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemResponse {
        private UUID id;
        private UUID productId;
        private String productCode;
        private String productName;
        private BigDecimal quantity;
        private String uom;
        private BigDecimal unitPrice;
        private BigDecimal totalAmount;
    }
}

