package com.erp.crm.modules.setting.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.setting.enums.LeadStatusCategory;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.util.UUID;

@Entity
@Table(name = "crm_lead_status", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_lead_status_company_code", columnNames = {"company_id", "status_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLeadStatus extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "status_code", nullable = false, length = 50)
    private String statusCode;

    @Column(name = "status_name", nullable = false, length = 100)
    private String statusName;

    @Enumerated(EnumType.STRING)
        @Column(name = "status_category", nullable = false)
    @Builder.Default
    private LeadStatusCategory statusCategory = LeadStatusCategory.OPEN;

    @Builder.Default
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Builder.Default
    @Column(name = "color_code", length = 20)
    private String colorCode = "#3B82F6";

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
