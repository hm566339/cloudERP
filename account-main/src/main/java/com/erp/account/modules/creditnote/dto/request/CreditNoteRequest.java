package com.erp.account.modules.creditnote.dto.request;

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
public class CreditNoteRequest implements Serializable {
    private UUID salesInvoiceId;
    private String creditNoteNo;
    private LocalDate noteDate;
    private BigDecimal amount;
    private BigDecimal gstAmount;
    private String referenceNo;
    private String reason;
    private UUID receivableAccountId;
    private UUID revenueAdjustmentAccountId;
}
