package com.erp.account.modules.deliverychallan.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class DeliveryChallanResponse extends BaseResponseDto  {

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

    private UUID billingAddressId;
    private String billingAddressSnapshot;
    private String billingStateCode;

    private UUID deliveryAddressId;
    private String deliveryAddressSnapshot;

    private LocalDate dispatchDate;
    private UUID transporterId;
    private String vehicleNumber;
    private String lrNumber;

    private String referenceNumber;

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;

    private String notes;
    private DeliveryChallanStatus status;

    private UUID invoiceId;
    private String invoiceNumber;

    private List<DeliveryChallanItemResponse> items;

    private UUID createdBy;
    private LocalDateTime createdAt;
    private UUID updatedBy;
    private LocalDateTime updatedAt;
}
