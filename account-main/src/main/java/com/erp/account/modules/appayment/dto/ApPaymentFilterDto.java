package com.erp.account.modules.appayment.dto;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApPaymentFilterDto {

    private UUID vendorId;
    private String paymentNo;
    private String voucherNo;
    private String referenceNo;
    private UUID purchaseOrderId;
    private String purchaseOrderNumber;
    private UUID apInvoiceId;

    private UUID companyId;

    private PaymentMode paymentMode;
    private PaymentStatus paymentStatus;
    private PostingStatus glPostingStatus;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fromPaymentDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate toPaymentDate;

    private BigDecimal minPaymentAmount;
    private BigDecimal maxPaymentAmount;

    private BigDecimal minAllocatedAmount;
    private BigDecimal maxAllocatedAmount;

    private UUID glJournalEntryId;
    private UUID createdBy;
    private UUID updatedBy;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime fromCreatedDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime toCreatedDate;

    private Boolean isDeleted;
    private String searchKeyword;
}
