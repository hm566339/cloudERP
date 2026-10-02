package com.erp.account.modules.gstslab.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GstLinkedItemDto {
    private UUID itemId;
    private String itemCode;
    private String itemName;
    private String hsnSacCode;
    private String unit;
    private BigDecimal sellingPrice;
    private BigDecimal purchasePrice;
    private String status;
}
