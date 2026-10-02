package com.erp.account.modules.appayment.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import com.erp.account.modules.appayment.entity.ApPayment;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentLedgerLine implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate transactionDate;
    private UUID invoiceId;
    private String invoiceNo;
    private BigDecimal invoiceAmount;
    private BigDecimal paymentAmount;
    private BigDecimal balance;
    private String narration;
}
