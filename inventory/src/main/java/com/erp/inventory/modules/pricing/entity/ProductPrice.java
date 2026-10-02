package com.erp.inventory.modules.pricing.entity;

import com.erp.inventory.common.entity.BaseEntity;
import com.erp.inventory.modules.product.enums.PriceType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "product_price")
public class ProductPrice extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "product_id")
    private UUID productId;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_type")
    private PriceType priceType;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "currency_code")
    private String currencyCode;

    @Column(name = "min_quantity")
    private BigDecimal minQuantity;

    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;

    @Column(name = "status")
    private String status;

}
