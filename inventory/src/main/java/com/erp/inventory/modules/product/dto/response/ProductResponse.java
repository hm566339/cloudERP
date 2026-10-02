package com.erp.inventory.modules.product.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.erp.inventory.modules.product.enums.ProductType;
import com.erp.inventory.modules.product.enums.ProductStatus;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.enums.ValuationMethod;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private String productCode;
    private String sku;
    private String productName;
    private ProductType productType;
    private UUID categoryId;
    private UUID baseUomId;
    private UUID hsnSacId;
    private String hsnSacCode;
    private String hsnSacName;
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
    private ProductStatus status;

    private String baseUomCode;
    private BigDecimal sellingPrice;
}
