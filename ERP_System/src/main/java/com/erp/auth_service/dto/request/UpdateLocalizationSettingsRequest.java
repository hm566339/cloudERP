package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateLocalizationSettingsRequest {

    @NotBlank(message = "Default currency is required")
    @Size(min = 2, max = 10, message = "Default currency must be between 2 and 10 characters")
    private String defaultCurrency;

    @NotBlank(message = "Timezone is required")
    @Size(min = 2, max = 80, message = "Timezone must be between 2 and 80 characters")
    private String timezone;

    @NotBlank(message = "Date format is required")
    @Size(min = 4, max = 20, message = "Date format must be between 4 and 20 characters")
    private String dateFormat;

    @NotBlank(message = "Time format is required")
    @Size(min = 2, max = 20, message = "Time format must be between 2 and 20 characters")
    private String timeFormat;

    private UpdateLocalizationSettingsRequest data;

    public String resolveDefaultCurrency() {
        if (data != null && data.getDefaultCurrency() != null) {
            return data.getDefaultCurrency();
        }
        return defaultCurrency;
    }

    public String resolveTimezone() {
        if (data != null && data.getTimezone() != null) {
            return data.getTimezone();
        }
        return timezone;
    }

    public String resolveDateFormat() {
        if (data != null && data.getDateFormat() != null) {
            return data.getDateFormat();
        }
        return dateFormat;
    }

    public String resolveTimeFormat() {
        if (data != null && data.getTimeFormat() != null) {
            return data.getTimeFormat();
        }
        return timeFormat;
    }
}

