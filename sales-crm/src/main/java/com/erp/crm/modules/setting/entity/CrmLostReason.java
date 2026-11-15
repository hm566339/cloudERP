package com.erp.crm.modules.setting.entity;

import com.erp.crm.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "crm_lost_reason", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_lost_reason_company_code", columnNames = {"company_id", "reason_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLostReason extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reason_code", nullable = false, length = 50)
    private String reasonCode;

    @Column(name = "reason_label", nullable = false, length = 200)
    private String reasonLabel;

    @Builder.Default
    @Column(name = "applicable_to", nullable = false, length = 30)
    private String applicableTo = "BOTH";

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}

