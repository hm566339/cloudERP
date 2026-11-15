package com.erp.crm.modules.lead.dto.response;

import com.erp.crm.modules.lead.enums.LeadRating;
import com.erp.crm.modules.lead.enums.LeadStage;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadResponse {

    private UUID id;
    private UUID companyId;
    private String leadCode;
    private String salutation;
    private String firstName;
    private String lastName;
    private String displayName;
    private String email;
    private String phone;
    private String organizationName;
    private String designation;
    private String industry;
    private BigDecimal annualRevenue;
    private String gstin;
    private String pan;
    private String city;
    private String state;
    private String stateCode;
    private String country;
    private UUID leadSourceId;
    private String leadSourceName;
    private UUID leadStatusId;
    private String leadStatusName;
    private String leadStatusColor;
    private LeadStage leadStage;
    private Integer leadScore;
    private LeadRating scoreGrade;
    private Boolean isQualified;
    private UUID ownerUserId;
    private String ownerUsername;
    private LocalDateTime nextFollowUpDate;
    private Boolean isConverted;
    private UUID convertedAccountId;
    private UUID convertedContactId;
    private UUID convertedOpportunityId;
    private Boolean isLost;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ProductInterestResponse> inquiredProducts;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductInterestResponse {
        private UUID id;
        private UUID productId;
        private String productName;
        private String productCode;
        private BigDecimal quantity;
        private String uom;
        private BigDecimal estimatedBudget;
        private String currency;
        private String specifications;
    }
}

