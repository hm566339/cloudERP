package com.erp.inventory.modules.product.dto.request;

import lombok.Data;
import com.erp.inventory.modules.product.enums.ProductType;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.enums.ValuationMethod;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class ProductFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private String productCode;
    private String sku;
    private String productName;
    private ProductType productType;
    private UUID categoryId;
    private UUID baseUomId;
    private UUID hsnSacId;
    private String barcode;
    private String alternateBarcode;
    private String description;
    private TrackingType trackingType;
    private ValuationMethod valuationMethod;
    private BigDecimal standardCost;
    private BigDecimal minimumStock;
    private BigDecimal maximumStock;
    private BigDecimal reorderLevel;
    private BigDecimal reorderQuantity;
    private UUID inventoryAccountId;
    private UUID cogsAccountId;
    private UUID salesAccountId;
    private UUID purchaseAccountId;
    private String status;
}
