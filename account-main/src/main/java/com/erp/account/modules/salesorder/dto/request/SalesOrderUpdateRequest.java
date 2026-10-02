package com.erp.account.modules.salesorder.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderUpdateRequest {

    private UUID billingAddressId;
    private UUID deliveryAddressId;

    @Size(max = 100, message = "Reference number cannot exceed 100 characters")
    private String referenceNumber;

    private UUID paymentTermId;
    private String paymentTerms;
    
    private UUID termsConditionId;
    private String termsAndConditions;
    private String deliveryTerms;
    private String notes;

    @Valid
    private List<SalesOrderItemUpdateRequest> items;
}
