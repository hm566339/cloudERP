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
public class LocalizationSettingsResponse {

    private UUID organizationId;
    private String defaultCurrency;
    private String timezone;
    private String dateFormat;
    private String timeFormat;
    private LocalDateTime updatedAt;

    public static LocalizationSettingsResponse defaultFor(UUID organizationId, String defaultCurrency, String timezone) {
        return LocalizationSettingsResponse.builder()
                .organizationId(organizationId)
                .defaultCurrency(defaultCurrency != null ? defaultCurrency : "INR")
                .timezone(timezone != null ? timezone : "IST")
                .dateFormat("DD/MM/YYYY")
                .timeFormat("12h")
                .updatedAt(LocalDateTime.now())
                .build();
    }
}

