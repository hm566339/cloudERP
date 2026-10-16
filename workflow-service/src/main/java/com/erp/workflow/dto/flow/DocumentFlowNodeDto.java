package com.erp.workflow.dto.flow;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class DocumentFlowNodeDto {
    private String documentType;
    private String displayName;
    private String tabKey;
    private String routePath;
    private String iconName;
    private Integer orderIndex;
    @Builder.Default
    @JsonAlias({"isEnabled", "enabled"})
    @JsonProperty("enabled")
    private boolean isEnabled = true;
    private String requiredFeature;
    private String requiredPermission;
    private List<String> allowedRoles;
}
