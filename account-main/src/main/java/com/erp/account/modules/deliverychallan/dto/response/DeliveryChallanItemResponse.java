package com.erp.account.modules.deliverychallan.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class DeliveryChallanItemResponse extends BaseResponseDto  {

    private UUID id;
    
    private UUID sourceSalesOrderItemId;
    private UUID sourceSalesInvoiceItemId;

    private UUID hsnSacId;
    private String hsnSacCode;

    private UUID itemId;
    private String itemName;
    private String description;

    private BigDecimal quantity;
    private String unit;

    private BigDecimal unitPrice;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal taxableAmount;

    private BigDecimal cgstRate;
    private BigDecimal cgstAmount;
    private BigDecimal sgstRate;
    private BigDecimal sgstAmount;
    private BigDecimal igstRate;
    private BigDecimal igstAmount;
    private BigDecimal cessRate;
    private BigDecimal cessAmount;
    private BigDecimal taxAmount;

    private BigDecimal totalAmount;

    private UUID warehouseId;
    private UUID locationId;

    private String notes;
}
