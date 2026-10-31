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
public class GeneralSettingsResponse {

    private UUID organizationId;
    private String companyName;
    private String contactEmail;
    private String defaultCurrency;
    private String timezone;
    private String dateFormat;
    private String timeFormat;
    private LocalDateTime updatedAt;

    public static GeneralSettingsResponse defaultFor(
            UUID organizationId,
            String companyName,
            String contactEmail,
            String defaultCurrency,
            String timezone) {
        return GeneralSettingsResponse.builder()
                .organizationId(organizationId)
                .companyName(companyName != null ? companyName : "Acme Corporation")
                .contactEmail(contactEmail != null ? contactEmail : "admin@acmecorp.com")
                .defaultCurrency(defaultCurrency != null ? defaultCurrency : "INR")
                .timezone(timezone != null ? timezone : "IST")
                .dateFormat("DD/MM/YYYY")
                .timeFormat("12h")
                .updatedAt(LocalDateTime.now())
                .build();
    }
}

