package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateFeatureRequest {

    @NotBlank(message = "Feature code is required")
    private String code;

    @NotBlank(message = "Feature name is required")
    private String name;

    private String description;

    @NotBlank(message = "Module name is required")
    @com.fasterxml.jackson.annotation.JsonAlias({"module", "module_name", "moduleName"})
    private String moduleName;

    @Builder.Default
    private boolean active = true;
}
