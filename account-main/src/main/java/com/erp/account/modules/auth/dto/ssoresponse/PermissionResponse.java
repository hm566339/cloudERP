package com.erp.account.modules.auth.dto.ssoresponse;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A permission as returned by the SSO verification endpoint.
 * <p>
 * Field names mirror the SSO contract ({@code permissionCode}, {@code action},
 * {@code featureCode}, {@code moduleName}, {@code active}, {@code allowed}).
 * Authorization is only derived from entries where {@code active == true} AND
 * {@code allowed == true}. A null flag is treated as {@code false} (fail closed).
 * <p>
 * The permission code is deliberately NOT assumed to encode a module-action
 * pair. Keying is done through the explicit {@code action} + {@code moduleName} /
 * {@code featureCode} fields instead.
 * <p>
 * {@link JsonAlias} variants tolerate common SSO-side naming differences
 * ({@code module} for {@code moduleName}, {@code feature} for {@code featureCode},
 * boolean-prefixed flags) without ever failing closed on a null unknown field.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PermissionResponse extends BaseResponseDto {

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