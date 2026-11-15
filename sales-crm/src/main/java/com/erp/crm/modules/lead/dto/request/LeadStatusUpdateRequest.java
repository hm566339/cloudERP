package com.erp.crm.modules.lead.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadStatusUpdateRequest {

    @NotNull(message = "Status ID is required")
    private UUID statusId;

    private UUID reasonId;

    private String notes;
}

