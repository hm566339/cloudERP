package com.erp.auth_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationAppearanceResponse {

    private UUID organizationId;
    private String organizationCode;
    private String activeTheme;
    private String appearanceMode;
    private String layoutDensity;
    private String fontFamily;
    private LocalDateTime updatedAt;

    public static OrganizationAppearanceResponse defaultFor(UUID organizationId, String organizationCode) {
        return OrganizationAppearanceResponse.builder()
                .organizationId(organizationId)
                .organizationCode(organizationCode)
                .activeTheme("sage")
                .appearanceMode("system")
                .layoutDensity("comfortable")
                .fontFamily("default")
                .updatedAt(LocalDateTime.now())
                .build();
    }
}

