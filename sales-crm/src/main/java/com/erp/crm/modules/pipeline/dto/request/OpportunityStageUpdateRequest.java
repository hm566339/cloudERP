package com.erp.crm.modules.pipeline.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpportunityStageUpdateRequest {

    @NotNull(message = "Target stage ID is required")
    private UUID targetStageId;

    private String reason;
}

