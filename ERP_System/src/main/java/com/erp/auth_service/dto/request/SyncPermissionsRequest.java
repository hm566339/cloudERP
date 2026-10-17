package com.erp.auth_service.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncPermissionsRequest {

    @NotEmpty(message = "permissions list must not be empty")
    @Valid
    private List<PermissionSyncItem> permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionSyncItem {
        @NotBlank(message = "featureCode is required")
        private String featureCode;

        @NotBlank(message = "action is required")
        @jakarta.validation.constraints.Pattern(
            regexp = "(?i)^(READ|CREATE|UPDATE|WRITE|DELETE|APPROVE|REJECT|RETURN|DELEGATE|CANCEL|ACTIVATE|DEACTIVATE|EXPORT)$",
            message = "Action must be one of: READ, CREATE, UPDATE, WRITE, DELETE, APPROVE, REJECT, RETURN, DELEGATE, CANCEL, ACTIVATE, DEACTIVATE, EXPORT"
        )
        private String action;

        private boolean enabled;
    }
}
