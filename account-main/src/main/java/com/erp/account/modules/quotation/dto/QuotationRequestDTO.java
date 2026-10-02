package com.erp.account.modules.quotation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationRequestDTO {

    @NotNull(message = "Company ID is mandatory")
    private UUID companyId;

    @NotNull(message = "Customer ID is mandatory")
    private UUID customerId;

    @NotNull(message = "Quotation date is mandatory")
    private LocalDate quotationDate;

    @NotNull(message = "Valid until date is mandatory")
    @FutureOrPresent(message = "Valid until must be in the present or future")
    private LocalDate validUntil;

    private String referenceNumber;
    private String quotationCurrency;

    // Delivery Address
    private UUID deliveryAddressId;
    private String deliveryAddressLine1;
    private String deliveryAddressLine2;
    private String deliveryCity;
    private String deliveryState;
    private String deliveryPostalCode;
    private String deliveryCountry;

    // Billing Address
    private UUID billingAddressId;
    private String billingAddressLine1;
    private String billingAddressLine2;
    private String billingCity;
    private String billingState;
    private String billingPostalCode;
    private String billingCountry;
    private String billingStateCode;

    private UUID paymentTermId;
    private String paymentTerms;
    private UUID deliveryTermId;
    private String deliveryTerms;
    private UUID warrantyTermId;
    private String warrantyTerms;
    private UUID termsConditionId;
    private String termsAndConditions;
    private String notes;

    private UUID salesManagerId;

    @Valid
    @NotEmpty(message = "Quotation must have at least one item")
    private List<QuotationItemRequestDTO> quotationItems;

}
