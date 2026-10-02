package com.erp.inventory.modules.product.dto.request;

import com.erp.inventory.modules.product.enums.ProductStatus;
import com.erp.inventory.modules.product.enums.ProductType;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.enums.ValuationMethod;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class ProductRequest {

    @Size(max = 50, message = "SKU must not exceed 50 characters")
    private String sku;

    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name must not exceed 200 characters")
    private String productName;

    @NotNull(message = "Product type is required")
    private ProductType productType;

    @NotNull(message = "Category ID is required")
    private UUID categoryId;

    @NotNull(message = "Base UOM ID is required")
    private UUID baseUomId;

    private UUID hsnSacId;
    private String hsnSacCode;
    private String hsnSacName;

    private String barcode;
    private String alternateBarcode;
    private String description;

    @NotNull(message = "trackingType is required")
    private TrackingType trackingType;

    @NotNull(message = "valuationMethod is required")
    private ValuationMethod valuationMethod;

    @Min(value = 0, message = "Standard cost cannot be negative")
    private BigDecimal standardCost;

    @Min(value = 0, message = "Selling price cannot be negative")
    private BigDecimal sellingPrice;

    private UUID inventoryAccountId;
    private UUID cogsAccountId;
    private UUID salesAccountId;

    @NotNull(message = "purchaseAccountId is required")
    private UUID purchaseAccountId;

    private ProductStatus status;
}