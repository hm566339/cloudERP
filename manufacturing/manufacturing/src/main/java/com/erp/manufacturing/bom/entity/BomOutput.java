package com.erp.manufacturing.bom.entity;

import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.BomOutputType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bom_output")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BomOutput extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "bom_revision_id", nullable = false) private BomRevision bomRevision;
    @Column(name = "product_id", nullable = false) private UUID productId;
    @Column(nullable = false, precision = 19, scale = 6) private BigDecimal quantity;
    @Column(name = "uom_id", nullable = false) private UUID uomId;
    @Enumerated(EnumType.STRING) @Column(name = "output_type", nullable = false) private BomOutputType outputType;
    @Column(name = "is_primary", nullable = false) private Boolean isPrimary;
    @Column(name = "sequence_no", nullable = false) private Integer sequenceNo;
}
