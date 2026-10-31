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
public class OrganizationSettingsResponse {

    private UUID organizationId;
    private String companyName;
    private String contactEmail;
    private LocalDateTime updatedAt;

    public static OrganizationSettingsResponse defaultFor(UUID organizationId, String companyName, String contactEmail) {
        return OrganizationSettingsResponse.builder()
                .organizationId(organizationId)
                .companyName(companyName != null ? companyName : "Acme Corporation")
                .contactEmail(contactEmail != null ? contactEmail : "admin@acmecorp.com")
                .updatedAt(LocalDateTime.now())
                .build();
    }
}

