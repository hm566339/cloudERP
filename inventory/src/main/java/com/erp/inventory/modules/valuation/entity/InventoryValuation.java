package com.erp.inventory.modules.valuation.entity;

import com.erp.inventory.common.entity.BaseEntity;
import com.erp.inventory.modules.product.enums.ValuationMethod;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "inventory_valuation")
public class InventoryValuation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "stock_movement_id")
    private UUID stockMovementId;

    @Column(name = "stock_movement_line_id")
    private UUID stockMovementLineId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "quantity")
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "valuation_method")
    private ValuationMethod valuationMethod;

    @Column(name = "inventory_cost")
    private BigDecimal inventoryCost;

    @Column(name = "cogs_amount")
    private BigDecimal cogsAmount;

    @Column(name = "currency_code")
    private String currencyCode;

    @Column(name = "gl_posting_required")
    private Boolean glPostingRequired;

    @Column(name = "gl_posted")
    private Boolean glPosted;

    @Column(name = "gl_journal_entry_id")
    private UUID glJournalEntryId;

    @Column(name = "location_id")
    private UUID locationId;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "average_cost")
    private BigDecimal averageCost;

    @Column(name = "stock_value")
    private BigDecimal stockValue;

    @Column(name = "valuation_date")
    private LocalDate valuationDate;

}
