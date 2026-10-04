package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignPlanModulesRequest {

    @NotNull(message = "Module IDs list cannot be null")
    private List<UUID> moduleIds;
}
