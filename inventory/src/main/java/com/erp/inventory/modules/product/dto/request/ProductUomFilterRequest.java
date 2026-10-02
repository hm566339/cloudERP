package com.erp.inventory.modules.product.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class ProductUomFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private UUID productId;
    private UUID uomId;
    private BigDecimal conversionFactor;
    private Boolean isPurchaseUom;
    private Boolean isSalesUom;
    private Boolean isStockUom;
}
