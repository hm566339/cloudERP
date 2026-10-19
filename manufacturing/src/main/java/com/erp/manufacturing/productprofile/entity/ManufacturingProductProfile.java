package com.erp.manufacturing.productprofile.entity;

import com.erp.manufacturing.common.enums.ManufacturingProductType;
import com.erp.manufacturing.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "manufacturing_product_profile")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ManufacturingProductProfile extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @Column(name = "product_id", nullable = false) private UUID productId;
    @Enumerated(EnumType.STRING) @Column(name = "manufacturing_type", nullable = false) private ManufacturingProductType manufacturingType;
    @Column(name = "is_manufactured", nullable = false) private Boolean isManufactured;
    @Column(name = "is_purchasable", nullable = false) private Boolean isPurchasable;
    @Column(name = "is_sellable", nullable = false) private Boolean isSellable;
    @Column(name = "is_active", nullable = false) private Boolean isActive;
}
