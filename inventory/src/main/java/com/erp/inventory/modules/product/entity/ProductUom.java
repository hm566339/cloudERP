package com.erp.inventory.modules.product.entity;

import com.erp.inventory.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "product_uom")
public class ProductUom extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "uom_id")
    private UUID uomId;

    @Column(name = "conversion_factor")
    private BigDecimal conversionFactor;

    @Column(name = "is_purchase_uom")
    private Boolean isPurchaseUom;

    @Column(name = "is_sales_uom")
    private Boolean isSalesUom;

    @Column(name = "is_stock_uom")
    private Boolean isStockUom;

}
