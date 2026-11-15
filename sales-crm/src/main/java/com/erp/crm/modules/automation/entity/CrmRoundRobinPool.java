package com.erp.crm.modules.automation.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.automation.enums.RoundRobinStrategy;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.util.UUID;

@Entity
@Table(name = "crm_round_robin_pool", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_rr_pool_company_code", columnNames = {"company_id", "pool_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmRoundRobinPool extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pool_name", nullable = false, length = 100)
    private String poolName;

    @Column(name = "pool_code", nullable = false, length = 50)
    private String poolCode;

    @Enumerated(EnumType.STRING)
        @Column(name = "routing_strategy", nullable = false)
    @Builder.Default
    private RoundRobinStrategy routingStrategy = RoundRobinStrategy.ROUND_ROBIN;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
