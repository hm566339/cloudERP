package com.erp.crm.modules.lead.entity;

import com.erp.crm.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "crm_lead_product_interest")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLeadProductInterest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "product_code", length = 100)
    private String productCode;

    @Builder.Default
    @Column(name = "quantity", precision = 19, scale = 4)
    private BigDecimal quantity = new BigDecimal("1.0000");

    @Builder.Default
    @Column(name = "uom", length = 50)
    private String uom = "PCS";

    @Column(name = "estimated_budget", precision = 19, scale = 4)
    private BigDecimal estimatedBudget;

    @Builder.Default
    @Column(name = "currency", length = 3)
    private String currency = "INR";

    @Column(name = "specifications", columnDefinition = "text")
    private String specifications;
}

