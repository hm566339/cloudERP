package com.erp.account.modules.deliverychallan.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class DeliveryChallanProfileResponse extends BaseResponseDto  {
    
    private UUID id;
    private String dcNumber;
    private LocalDate dcDate;

    private UUID sourceSalesOrderId;
    private String sourceSalesOrderNumber;

    private UUID sourceSalesInvoiceId;
    private String sourceSalesInvoiceNumber;

    private UUID sourceReceiptVoucherId;
    private String sourceReceiptVoucherNumber;

    private UUID customerId;
    private String customerName;

    private LocalDate dispatchDate;
    
    private String referenceNumber;
    private BigDecimal totalAmount;

    private DeliveryChallanStatus status;

    private UUID invoiceId;
    private String invoiceNumber;

    private LocalDateTime createdAt;
    private UUID createdBy;
}
