package com.erp.crm.modules.lead.dto.request;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadUpdateRequest {

    private String salutation;
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
    private UUID leadStatusId;
    private UUID ownerUserId;
    private String rawInquiryText;
    private List<LeadCreateRequest.ProductInterestRequest> inquiredProducts;
    private List<UUID> tagIds;
}

