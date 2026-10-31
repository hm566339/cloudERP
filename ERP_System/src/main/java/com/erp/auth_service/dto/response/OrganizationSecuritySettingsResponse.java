package com.erp.auth_service.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationSecuritySettingsResponse {
    private Boolean enforce2FA;
    private Integer sessionTimeoutMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrganizationSecuritySettingsResponse defaultSettings() {
        return OrganizationSecuritySettingsResponse.builder()
                .enforce2FA(false)
                .sessionTimeoutMinutes(60)
                .build();
    }
}

