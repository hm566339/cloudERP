package com.erp.account.modules.debitnote.dto.request;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DebitNoteRequest implements Serializable {
    private UUID apInvoiceId;
    private String debitNoteNo;
    private LocalDate noteDate;
    private BigDecimal amount;
    private BigDecimal gstAmount;
    private String referenceNo;
    private String reason;
    private UUID payableAccountId;
    private UUID purchaseReturnAccountId;
}
