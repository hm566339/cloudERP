package com.erp.account.modules.invoicetax.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceTaxFilterDto {

    private UUID gstSlabId;

    private UUID companyId;
    
    private String gstSlabName;
    
    private Boolean isDeleted;
    
    private BigDecimal minTaxableAmount;
    private BigDecimal maxTaxableAmount;
    
    private LocalDate createdFrom;
    private LocalDate createdTo;
}
