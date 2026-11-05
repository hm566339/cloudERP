package com.erp.auth_service.dto.role_template;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyTemplateRequest {

    @NotEmpty(message = "At least one company must be selected")
    @Builder.Default
    private List<UUID> companyIds = new ArrayList<>();

    @Builder.Default
    private boolean overwriteExisting = false;
}

