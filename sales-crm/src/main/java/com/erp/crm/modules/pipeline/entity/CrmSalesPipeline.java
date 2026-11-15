package com.erp.crm.modules.pipeline.entity;

import com.erp.crm.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "crm_sales_pipeline", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_pipeline_company_code", columnNames = {"company_id", "pipeline_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmSalesPipeline extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pipeline_code", nullable = false, length = 50)
    private String pipelineCode;

    @Column(name = "pipeline_name", nullable = false, length = 100)
    private String pipelineName;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;
}

