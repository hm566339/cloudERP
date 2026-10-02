package com.erp.inventory.modules.pricing.dto.request;

import lombok.Data;
import com.erp.inventory.modules.product.enums.PriceType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class ProductPriceFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private UUID productId;
    private PriceType priceType;
    private BigDecimal price;
    private String currencyCode;
    private BigDecimal minQuantity;
    private LocalDateTime effectiveFrom;
    private LocalDateTime effectiveTo;
    private String status;
}
