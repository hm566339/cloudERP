package com.erp.inventory.modules.product.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProductDetailResponse {
    private UUID id;
    private UUID companyId;

    private ProductInfo product;
    private CategoryInfo category;
    private UomInfo uom;
    private HsnSacInfo hsnSac;
    private PricingInfo pricing;
    private InventorySettings inventorySettings;
    private StockSummary stockSummary;
    private List<WarehouseInventory> warehouses;
    private AccountingInfo accounting;
    private List<SupplierInfo> suppliers;
    private List<TransactionSummary> recentTransactions;
    private Metadata metadata;

    @Data
    @Builder
    public static class ProductInfo {
        private String productCode;
        private String sku;
        private String productName;
        private String productType;
        private String description;
        private String barcode;
        private String alternateBarcode;
        private String status;
    }

    @Data
    @Builder
    public static class CategoryInfo {
        private UUID id;
        private String name;
        private String code;
    }

    @Data
    @Builder
    public static class UomInfo {
        private UUID id;
        private String code;
        private String name;
        private String symbol;
    }

    @Data
    @Builder
    public static class HsnSacInfo {
        private UUID id;
        private String code;
        private String description;
        private String taxRate;
    }

    @Data
    @Builder
    public static class PricingInfo {
        private BigDecimal standardCost;
        private BigDecimal sellingPrice;
        private String currency;
    }

    @Data
    @Builder
    public static class InventorySettings {
        private String trackingType;
        private String valuationMethod;
        private BigDecimal minimumStock;
        private BigDecimal maximumStock;
        private BigDecimal reorderLevel;
        private BigDecimal reorderQuantity;
    }

    @Data
    @Builder
    public static class StockSummary {
        private BigDecimal totalQuantity;
        private BigDecimal availableQuantity;
        private BigDecimal reservedQuantity;
        private BigDecimal committedQuantity;
        private BigDecimal totalStockValue;
        private int warehouseCount;
    }

    @Data
    @Builder
    public static class WarehouseInventory {
        private UUID warehouseId;
        private String warehouseCode;
        private String warehouseName;
        private LocationInfo location;
        private InventoryDetail inventory;
    }

    @Data
    @Builder
    public static class LocationInfo {
        private UUID id;
        private String name;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String state;
        private String country;
        private String postalCode;
        private Double latitude;
        private Double longitude;
    }

    @Data
    @Builder
    public static class InventoryDetail {
        private BigDecimal quantity;
        private BigDecimal availableQuantity;
        private BigDecimal reservedQuantity;
        private BigDecimal committedQuantity;
        private BigDecimal minimumStock;
        private BigDecimal maximumStock;
        private BigDecimal reorderLevel;
        private BigDecimal reorderQuantity;
        private BigDecimal stockValue;
    }

    @Data
    @Builder
    public static class AccountingInfo {
        private AccountInfo inventoryAccount;
        private AccountInfo cogsAccount;
        private AccountInfo salesAccount;
        private AccountInfo purchaseAccount;
    }

    @Data
    @Builder
    public static class AccountInfo {
        private UUID id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    public static class SupplierInfo {
        private UUID id;
        private String name;
    }

    @Data
    @Builder
    public static class TransactionSummary {
        private UUID transactionId;
        private String transactionType;
        private LocalDateTime transactionDate;
        private UUID warehouseId;
        private String warehouseName;
        private BigDecimal quantity;
        private BigDecimal unitCost;
        private BigDecimal totalValue;
        private String referenceNumber;
    }

    @Data
    @Builder
    public static class Metadata {
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private UUID createdBy;
        private UUID updatedBy;
        private Long version;
    }
}
