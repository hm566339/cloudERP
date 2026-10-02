package com.erp.inventory.modules.product.entity;

import com.erp.inventory.common.entity.BaseEntity;
import com.erp.inventory.modules.product.enums.ProductType;
import com.erp.inventory.modules.product.enums.ProductStatus;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.enums.ValuationMethod;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "product", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "company_id", "sku" }),
        @UniqueConstraint(columnNames = { "company_id", "product_code" })
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String productCode;
    private String sku;
    private String productName;

    @Enumerated(EnumType.STRING)
    private ProductType productType;

    private UUID categoryId;
    private UUID baseUomId;

    private UUID hsnSacId;
    private String hsnSacCode;
    private String hsnSacName;

    private String barcode;
    private String alternateBarcode;
    private String description;

    @Enumerated(EnumType.STRING)
    private TrackingType trackingType;

    @Enumerated(EnumType.STRING)
    private ValuationMethod valuationMethod;

    private BigDecimal standardCost;
    private BigDecimal sellingPrice;

    private UUID inventoryAccountId;
    private UUID cogsAccountId;
    private UUID salesAccountId;
    private UUID purchaseAccountId;

    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    @Version
    private Long version;
}