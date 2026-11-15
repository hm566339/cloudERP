package com.erp.crm.modules.automation.entity;

import com.erp.crm.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_round_robin_member", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_rr_member_pool_user", columnNames = {"pool_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmRoundRobinMember extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pool_id", nullable = false)
    private UUID poolId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Builder.Default
    @Column(name = "weight", nullable = false)
    private Integer weight = 1;

    @Builder.Default
    @Column(name = "max_daily_leads")
    private Integer maxDailyLeads = 50;

    @Builder.Default
    @Column(name = "current_leads_today", nullable = false)
    private Integer currentLeadsToday = 0;

    @Column(name = "last_assigned_at")
    private LocalDateTime lastAssignedAt;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}

