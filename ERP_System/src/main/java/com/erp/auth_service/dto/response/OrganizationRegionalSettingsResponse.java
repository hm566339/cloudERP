package com.erp.auth_service.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationRegionalSettingsResponse {
    private String currency;
    private String timezone;
    private String fiscalYearStartMonth;
    private String dateFormat;
    private String timeFormat;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrganizationRegionalSettingsResponse defaultSettings() {
        return OrganizationRegionalSettingsResponse.builder()
                .currency("INR")
                .timezone("Asia/Kolkata (IST)")
                .fiscalYearStartMonth("April")
                .dateFormat("DD/MM/YYYY")
                .timeFormat("12h")
                .build();
    }
}

