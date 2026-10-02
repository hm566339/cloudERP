package com.erp.account.modules.quotation.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QtTermsAndConditionsDto {
    private java.util.UUID paymentTermId;
    private String paymentTerms;
    private java.util.UUID deliveryTermId;
    private String deliveryTerms;
    private java.util.UUID warrantyTermId;
    private String warrantyTerms;
    private java.util.UUID termsConditionId;
    private String termsAndConditions;
    private String notes;
}
