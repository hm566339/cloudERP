package com.erp.account.modules.rfq.entity;

import com.erp.account.enums.ItemType;
import com.erp.account.modules.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "rfq_item", indexes = { @Index(name = "idx_rfqi_rfq", columnList = "rfq_id"),
        @Index(name = "idx_rfqi_company", columnList = "company_id") })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RfqItem extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rfq_id", nullable = false)
    private Rfq rfq;
    @Column(name = "item_id")
    private UUID itemId;
    @Column(name = "item_name", nullable = false)
    private String itemName;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", length = 20)
    private ItemType itemType;
    @Column(name = "quantity", nullable = false, precision = 19, scale = 4)
    private BigDecimal quantity;
    @Column(name = "unit", length = 50)
    private String unit;
    @Column(name = "required_date")
    private LocalDate requiredDate;
    @Column(name = "specifications", columnDefinition = "TEXT")
    private String specifications;
}
