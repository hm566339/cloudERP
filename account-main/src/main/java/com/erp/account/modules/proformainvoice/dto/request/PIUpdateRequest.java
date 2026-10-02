package com.erp.account.modules.proformainvoice.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class PIUpdateRequest {
    @NotNull(message = "PI date is required")
    private LocalDate piDate;

    @NotNull(message = "Valid till date is required")
    private LocalDate piValidTill;

    private Boolean advanceRequired;

    private BigDecimal advanceAmount;
    
    private UUID bankAccountId;
    
    private UUID paymentTermId;
    private String paymentTerms;
    
    private UUID termsConditionId;
    private String termsAndConditions;
    
    private String deliveryTerms;
    
    private String notes;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<PIItemRequest> items;
}
