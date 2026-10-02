package com.erp.account.modules.apinvoice.dto.request;

import com.erp.account.modules.common.dto.BaseResponseDto;

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
public class PurchaseItemInventoryResponse extends BaseResponseDto  {
    private UUID warehouseId;
    private String warehouseName;
    private UUID locationId;
    private String locationName;
    private UUID batchId;
    private String batchCode;
    private BigDecimal stockQuantity;
    private BigDecimal reservedQuantity;
    private BigDecimal availableQuantity;
    private String inventoryFetchStatus;
}
