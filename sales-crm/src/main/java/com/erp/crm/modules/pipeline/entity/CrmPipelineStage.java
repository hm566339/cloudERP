package com.erp.crm.modules.pipeline.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.pipeline.enums.PipelineStageCategory;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.util.UUID;

@Entity
@Table(name = "crm_pipeline_stage", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_stage_pipeline_code", columnNames = {"pipeline_id", "stage_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmPipelineStage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pipeline_id", nullable = false)
    private UUID pipelineId;

    @Column(name = "stage_code", nullable = false, length = 50)
    private String stageCode;

    @Column(name = "stage_name", nullable = false, length = 100)
    private String stageName;

    @Builder.Default
    @Column(name = "stage_order", nullable = false)
    private Integer stageOrder = 1;

    @Enumerated(EnumType.STRING)
        @Column(name = "stage_category", nullable = false)
    @Builder.Default
    private PipelineStageCategory stageCategory = PipelineStageCategory.PROSPECTING;

    @Builder.Default
    @Column(name = "win_probability_pct", nullable = false)
    private Integer winProbabilityPct = 10;

    @Builder.Default
    @Column(name = "rotting_days")
    private Integer rottingDays = 14;

    @Builder.Default
    @Column(name = "sla_days")
    private Integer slaDays = 7;

    @Builder.Default
    @Column(name = "color_code", length = 20)
    private String colorCode = "#6366F1";

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
