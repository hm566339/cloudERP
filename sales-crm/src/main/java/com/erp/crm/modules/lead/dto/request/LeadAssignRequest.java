package com.erp.crm.modules.lead.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadAssignRequest {

    @NotNull(message = "Target User ID is required")
    private UUID targetUserId;

    private String reason;
}

