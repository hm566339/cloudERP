package com.erp.account.modules.quotation.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponse;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotationItemResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;
    private UUID quotationId;
    
    private UUID itemId;
    private String itemName;
    private String description;
    
    private HsnSacMasterResponse hsnSacMaster;
    
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
    
    private String notes;
}
