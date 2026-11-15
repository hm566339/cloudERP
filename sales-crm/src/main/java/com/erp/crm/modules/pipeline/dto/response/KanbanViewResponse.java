package com.erp.crm.modules.pipeline.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KanbanViewResponse {

    private UUID pipelineId;
    private String pipelineName;
    private List<KanbanStage> stages;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KanbanStage {
        private UUID stageId;
        private String stageName;
        private Integer stageOrder;
        private Integer winProbabilityPct;
        private BigDecimal totalValue;
        private Integer dealCount;
        private List<KanbanDeal> deals;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KanbanDeal {
        private UUID id;
        private String opportunityCode;
        private String opportunityName;
        private String accountName;
        private BigDecimal dealValue;
        private BigDecimal weightedValue;
        private LocalDate expectedCloseDate;
        private Boolean isRotting;
    }
}

