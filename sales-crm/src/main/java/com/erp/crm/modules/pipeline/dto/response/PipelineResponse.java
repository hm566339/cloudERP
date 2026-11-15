package com.erp.crm.modules.pipeline.dto.response;

import com.erp.crm.modules.pipeline.enums.PipelineStageCategory;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PipelineResponse {

    private UUID id;
    private UUID companyId;
    private String pipelineCode;
    private String pipelineName;
    private String description;
    private Boolean isDefault;
    private Boolean isActive;
    private Integer displayOrder;
    private List<StageResponse> stages;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StageResponse {
        private UUID id;
        private String stageCode;
        private String stageName;
        private Integer stageOrder;
        private PipelineStageCategory stageCategory;
        private Integer winProbabilityPct;
        private Integer rottingDays;
        private Integer slaDays;
        private String colorCode;
        private Boolean isActive;
    }
}

