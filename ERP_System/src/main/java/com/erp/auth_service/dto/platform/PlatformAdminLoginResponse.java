package com.erp.auth_service.dto.platform;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformAdminLoginResponse {

    private String accessToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private UUID adminId;

    private String email;

    private String fullName;

    private List<String> roles;

    private List<String> permissions;

    private long expiresIn;
}
