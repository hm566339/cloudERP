package com.erp.manufacturing.security.dto.sso;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TokenVerifyResponse {

    private boolean valid;
    private UserResponse user;
    private String message;

    @JsonAlias({ "activeFeatures", "featureCodes" })
    private List<FeatureResponse> features;

    private List<PermissionResponse> permissions;
}
