package com.erp.auth_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateFeatureRequest {

    private String code;

    private String name;

    private String description;

    @com.fasterxml.jackson.annotation.JsonAlias({"module", "module_name", "moduleName"})
    private String moduleName;

    private Boolean active;
}
