package com.erp.auth_service.dto.platform;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePlatformAdminRoleRequest {

    @NotEmpty(message = "At least one role code is required")
    private List<String> roleCodes;
}
