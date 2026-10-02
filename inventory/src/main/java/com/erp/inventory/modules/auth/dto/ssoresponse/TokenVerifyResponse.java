package com.erp.inventory.modules.auth.dto.ssoresponse;

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

    /**
     * Active features granted to the user by SSO, as structured objects. Mirrors the same
     * key on {@link UserResponse}; populated either at the verify-response root or nested
     * under the user, whichever the SSO service actually returns.
     */
    @JsonAlias({ "activeFeatures", "featureCodes" })
    private List<FeatureResponse> features;

    /**
     * Structured permissions granted to the user by SSO. Like {@link #features},
     * accepted at the verify-response root or nested under the user.
     */
    private List<PermissionResponse> permissions;
}
