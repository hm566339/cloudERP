package com.erp.crm.modules.setting.entity;

import com.erp.crm.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "crm_tag", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_tag_company_name", columnNames = {"company_id", "tag_name"}),
        @UniqueConstraint(name = "uq_crm_tag_company_id", columnNames = {"company_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmTag extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tag_name", nullable = false, length = 50)
    private String tagName;

    @Builder.Default
    @Column(name = "color_code", length = 20)
    private String colorCode = "#10B981";

    @Builder.Default
    @Column(name = "entity_scope", length = 50)
    private String entityScope = "GLOBAL";
}

