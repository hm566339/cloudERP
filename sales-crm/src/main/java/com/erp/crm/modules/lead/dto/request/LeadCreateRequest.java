package com.erp.crm.modules.lead.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadCreateRequest {

    private String salutation;

    @NotBlank(message = "First name is required")
    private String firstName;

    private String lastName;

    private String email;

    private String phone;

    private String alternatePhone;

    private String website;

    private String organizationName;

    private String designation;

    private String industry;

    private BigDecimal annualRevenue;

    private String companySize;

    private String gstin;

    private String pan;

    private String addressLine1;

    private String addressLine2;

    private String city;

    private String state;

    private String stateCode;

    private String postalCode;

    private String country;

    private UUID leadSourceId;

    private UUID tenantIntegrationId;

    private String externalLeadId;

    private String externalLeadUrl;

    private UUID campaignId;

    private String utmSource;

    private String utmMedium;

    private String utmCampaign;

    private String utmContent;

    private String utmTerm;

    private String rawInquiryText;

    private UUID leadStatusId;

    private UUID ownerUserId;

    private UUID assignedTeamId;

    private List<ProductInterestRequest> inquiredProducts;

    private List<UUID> tagIds;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductInterestRequest {
        private UUID productId;
        @NotBlank(message = "Product name is required")
        private String productName;
        private String productCode;
        private BigDecimal quantity;
        private String uom;
        private BigDecimal estimatedBudget;
        private String specifications;
    }
}

