package com.erp.crm.modules.lead.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadMergeRequest {

    @NotNull(message = "Primary lead ID is required")
    private UUID primaryLeadId;

    @NotEmpty(message = "At least one duplicate lead ID is required")
    private List<UUID> duplicateLeadIds;

    private String mergeReason;
}

