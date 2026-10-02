package com.erp.account.modules.receiptvoucher.dto.request;

import com.erp.account.enums.PostingStatus;
import com.erp.account.enums.ReceiptVoucherStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptVoucherFilterDto {

    private String searchKey;
    
    private String receiptNo;
    private String referenceNo;

    private UUID companyId;
    
    private UUID customerId;
    private UUID arInvoiceId;
    private UUID salesInvoiceId;
    
    private String paymentMode;

    private List<ReceiptVoucherStatus> receiptStatuses;
    private List<PostingStatus> postingStatuses;
    
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    
    private LocalDate receiptDateFrom;
    private LocalDate receiptDateTo;
}

