package com.erp.account.modules.integration.manufacturing.dto;

import com.erp.account.modules.gljournal.enums.SourceModule;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class ManufacturingJournalRequest {
    @NotNull private UUID companyId;
    @NotNull private SourceModule sourceModule;
    @NotNull private UUID sourceId;
    @NotBlank private String eventType;
    private String referenceNo;
    @NotNull @PastOrPresent private LocalDate voucherDate;
    @NotBlank private String narration;
    @NotBlank private String currencyCode;
    @NotBlank private String idempotencyKey;
    @NotNull @DecimalMin(value = "0.0", inclusive = false) private BigDecimal amount;
}
