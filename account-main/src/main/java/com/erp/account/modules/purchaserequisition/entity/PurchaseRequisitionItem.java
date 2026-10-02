package com.erp.account.modules.purchaserequisition.entity;

import com.erp.account.enums.ItemType;
import com.erp.account.modules.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "purchase_requisition_item", indexes = {
        @Index(name = "idx_prqi_requisition", columnList = "purchase_requisition_id"),
        @Index(name = "idx_prqi_company", columnList = "company_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseRequisitionItem extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false) private UUID id;
    @Column(name = "company_id", nullable = false, updatable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_requisition_id", nullable = false) private PurchaseRequisition purchaseRequisition;
    @Column(name = "item_id") private UUID itemId;
    @Column(name = "item_name", nullable = false, length = 255) private String itemName;
    @Column(name = "description", columnDefinition = "TEXT") private String description;
    @Enumerated(EnumType.STRING) @Column(name = "item_type", length = 20)
    @Builder.Default private ItemType itemType = ItemType.PRODUCT;
    @Column(name = "requested_quantity", nullable = false, precision = 19, scale = 4) private BigDecimal requestedQuantity;
    @Column(name = "unit", length = 50) private String unit;
    @Column(name = "estimated_unit_price", precision = 19, scale = 4) private BigDecimal estimatedUnitPrice;
    @Column(name = "estimated_amount", precision = 19, scale = 4) private BigDecimal estimatedAmount;
    @Column(name = "required_date") private LocalDate requiredDate;
    @Column(name = "warehouse_id") private UUID warehouseId;
    @Column(name = "location_id") private UUID locationId;
    @Column(name = "remarks", columnDefinition = "TEXT") private String remarks;
}
