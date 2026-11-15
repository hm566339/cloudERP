package com.erp.crm.modules.setting.entity;

import com.erp.crm.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "crm_lead_source", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_lead_source_company_code", columnNames = {"company_id", "source_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLeadSource extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "source_code", nullable = false, length = 50)
    private String sourceCode;

    @Column(name = "source_name", nullable = false, length = 100)
    private String sourceName;

    @Builder.Default
    @Column(name = "source_category", length = 50)
    private String sourceCategory = "DIGITAL";

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_system", nullable = false)
    private Boolean isSystem = false;
}

