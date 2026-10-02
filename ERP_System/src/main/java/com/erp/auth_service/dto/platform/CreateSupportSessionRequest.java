package com.erp.auth_service.dto.platform;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSupportSessionRequest {

    @NotNull(message = "organizationId is required")
    private UUID organizationId;

    @NotNull(message = "companyId is required")
    private UUID companyId;

    @NotBlank(message = "moduleCode is required")
    private String moduleCode;

    @NotBlank(message = "reason is required")
    private String reason;

    private Integer durationMinutes;
}
