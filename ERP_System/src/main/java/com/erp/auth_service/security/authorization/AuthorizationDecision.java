package com.erp.auth_service.security.authorization;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorizationDecision {

    private boolean allowed;
    private String featureCode;
    private String action;
    private String permissionCode;
    private String reason;

    public static AuthorizationDecision allow(String reason) {
        return AuthorizationDecision.builder()
                .allowed(true)
                .reason(reason)
                .build();
    }

    public static AuthorizationDecision allow(String featureCode, String action, String permissionCode, String reason) {
        return AuthorizationDecision.builder()
                .allowed(true)
                .featureCode(featureCode)
                .action(action)
                .permissionCode(permissionCode)
                .reason(reason)
                .build();
    }

    public static AuthorizationDecision deny(String reason) {
        return AuthorizationDecision.builder()
                .allowed(false)
                .reason(reason)
                .build();
    }

    public static AuthorizationDecision deny(String featureCode, String action, String permissionCode, String reason) {
        return AuthorizationDecision.builder()
                .allowed(false)
                .featureCode(featureCode)
                .action(action)
                .permissionCode(permissionCode)
                .reason(reason)
                .build();
    }
}
