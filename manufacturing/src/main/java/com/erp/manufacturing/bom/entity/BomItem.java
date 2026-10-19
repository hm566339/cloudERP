package com.erp.manufacturing.bom.entity;

import com.erp.manufacturing.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bom_item")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BomItem extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "bom_revision_id", nullable = false) private BomRevision bomRevision;
    @Column(name = "component_product_id", nullable = false) private UUID componentProductId;
    @Column(nullable = false, precision = 19, scale = 6) private BigDecimal quantity;
    @Column(name = "uom_id", nullable = false) private UUID uomId;
    @Column(name = "scrap_percentage", nullable = false, precision = 9, scale = 4) private BigDecimal scrapPercentage;
    @Column(name = "wastage_percentage", nullable = false, precision = 9, scale = 4) private BigDecimal wastagePercentage;
    @Column(name = "sequence_no", nullable = false) private Integer sequenceNo;
    @Column(name = "is_optional", nullable = false) private Boolean isOptional;
    @Column(name = "is_active", nullable = false) private Boolean isActive;
    @Column(columnDefinition = "text") private String notes;
}
