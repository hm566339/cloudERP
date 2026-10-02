package com.erp.account.modules.paymentvoucher.dto.request;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
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
public class PaymentVoucherFilterDto {

    private String searchKey;
    
    private UUID companyId;
    private String voucherNo;
    private String referenceNo;
    
    private UUID vendorId;
    private UUID bankAccountId;
    private UUID createdBy;
    private UUID updatedBy;
    private UUID approvedBy;
    private Boolean deleted;
    
    private List<PaymentMode> paymentModes;
    private List<PaymentStatus> paymentStatuses;
    private List<PostingStatus> glPostingStatuses;
    private PaymentStatus voucherStatus;
    private PostingStatus postingStatus;
    private PaymentMode paymentMode;
    
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    
    private LocalDate voucherDateFrom;
    private LocalDate voucherDateTo;
}
