package com.erp.crm.modules.pipeline.dto.request;

import com.erp.crm.modules.pipeline.enums.PipelineStageCategory;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PipelineRequest {

    @NotBlank(message = "Pipeline name is required")
    private String pipelineName;

    private String description;

    @Builder.Default
    private Boolean isDefault = false;

    private List<StageRequest> stages;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StageRequest {
        @NotBlank(message = "Stage name is required")
        private String stageName;
        private String stageCode;
        private Integer stageOrder;
        private PipelineStageCategory stageCategory;
        private Integer winProbabilityPct;
        private Integer rottingDays;
        private Integer slaDays;
        private String colorCode;
    }
}

