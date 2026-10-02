package com.erp.account.modules.salesinvoice.dto;

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
public class SiCreditNoteDto {
    private UUID creditNoteId;
    private String creditNoteNumber;
    private LocalDate date;
    private BigDecimal amount;
    private String reason;
}
