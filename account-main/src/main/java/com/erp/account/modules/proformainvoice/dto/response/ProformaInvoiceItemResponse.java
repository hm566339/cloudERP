package com.erp.account.modules.proformainvoice.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProformaInvoiceItemResponse extends BaseResponseDto  {
    private UUID id;
    private UUID sourceQuotationItemId;
    private UUID itemId;
    private String itemName;
    private String description;
    
    private BigDecimal quantity;
    private BigDecimal convertedQuantity;
    private BigDecimal remainingQuantity;
    private String unit;
    private BigDecimal unitPrice;
    
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    
    private String hsnSacCode;
    
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
    

    private String notes;
}
