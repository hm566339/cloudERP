package com.erp.auth_service.dto.platform;

import com.erp.auth_service.model.platform.PlatformAdminStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePlatformAdminStatusRequest {

    @NotNull(message = "Status is required")
    private PlatformAdminStatus status;
}
