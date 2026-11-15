package com.erp.crm.modules.auth.dto.ssoresponse;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A feature as returned by the SSO service. Features are structured objects,
 * for example {@code {"featureCode": "STOCK", "featureName": "Stock",
 * "moduleName": "STOCK", "source": "..."}}. The {@code featureCode} is the
 * value used to derive {@code FEATURE_<code>} authorities.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FeatureResponse {

    private String featureCode;
    private String featureName;
    private String moduleName;
    private String source;
}