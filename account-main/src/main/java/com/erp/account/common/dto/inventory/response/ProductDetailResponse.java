package com.erp.account.common.dto.inventory.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductDetailResponse extends BaseResponseDto  {
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
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
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
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CategoryInfo {
        private UUID id;
        private String name;
        private String code;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UomInfo {
        private UUID id;
        private String code;
        private String name;
        private String symbol;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class HsnSacInfo {
        private UUID id;
        private String code;
        private String description;
        private String taxRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PricingInfo {
        private BigDecimal standardCost;
        private BigDecimal sellingPrice;
        private String currency;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
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
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
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
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WarehouseInventory {
        private UUID warehouseId;
        private String warehouseCode;
        private String warehouseName;
        private LocationInfo location;
        private InventoryDetail inventory;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
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
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
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
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AccountingInfo {
        private AccountInfo inventoryAccount;
        private AccountInfo cogsAccount;
        private AccountInfo salesAccount;
        private AccountInfo purchaseAccount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AccountInfo {
        private UUID id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SupplierInfo {
        private UUID id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
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
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Metadata {
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private UUID createdBy;
        private UUID updatedBy;
        private Long version;
    }
}
