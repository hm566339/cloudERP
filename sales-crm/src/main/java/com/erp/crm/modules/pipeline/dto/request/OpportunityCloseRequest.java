package com.erp.crm.modules.pipeline.dto.request;

import com.erp.crm.modules.pipeline.enums.OpportunityDealStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpportunityCloseRequest {

    @NotNull(message = "Deal status is required (WON or LOST)")
    private OpportunityDealStatus status;

    private UUID lostReasonId;

    private String lostNotes;

    private String winNotes;
}

