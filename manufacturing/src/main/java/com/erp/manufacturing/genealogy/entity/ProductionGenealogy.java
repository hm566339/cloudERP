package com.erp.manufacturing.genealogy.entity;

import com.erp.manufacturing.common.enums.GenealogyRelationshipType;
import com.erp.manufacturing.completion.entity.ProductionCompletion;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "production_genealogy")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductionGenealogy {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_order_id", nullable = false) private ProductionOrder productionOrder;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "production_completion_id") private ProductionCompletion productionCompletion;
    @Column(name = "input_product_id") private UUID inputProductId;
    @Column(name = "input_batch_id") private UUID inputBatchId;
    @Column(name = "input_serial_id") private UUID inputSerialId;
    @Column(name = "input_quantity", precision = 19, scale = 6) private BigDecimal inputQuantity;
    @Column(name = "input_uom_id") private UUID inputUomId;
    @Column(name = "output_product_id") private UUID outputProductId;
    @Column(name = "output_batch_id") private UUID outputBatchId;
    @Column(name = "output_serial_id") private UUID outputSerialId;
    @Column(name = "output_quantity", precision = 19, scale = 6) private BigDecimal outputQuantity;
    @Column(name = "output_uom_id") private UUID outputUomId;
    @Enumerated(EnumType.STRING) @Column(name = "relationship_type", nullable = false) private GenealogyRelationshipType relationshipType;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "created_by") private UUID createdBy;
}
