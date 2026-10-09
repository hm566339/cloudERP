package com.erp.workflow.security.dto.sso;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PermissionResponse {
    @JsonAlias("code")
    private String permissionCode;
    private String action;
    @JsonAlias("feature")
    private String featureCode;
    @JsonAlias("module")
    private String moduleName;
    private String source;
    @JsonAlias("isActive")
    private Boolean active;
    @JsonAlias("isAllowed")
    private Boolean allowed;
}
