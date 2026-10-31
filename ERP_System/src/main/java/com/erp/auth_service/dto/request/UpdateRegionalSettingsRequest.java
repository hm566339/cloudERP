package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.util.StringUtils;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateRegionalSettingsRequest {

    @Size(max = 10, message = "Currency must not exceed 10 characters")
    private String currency;

    @Size(max = 10, message = "Default currency must not exceed 10 characters")
    private String defaultCurrency;

    @Size(max = 80, message = "Timezone must not exceed 80 characters")
    private String timezone;

    @Size(max = 30, message = "Fiscal year start month must not exceed 30 characters")
    private String fiscalYearStartMonth;

    @Size(max = 30, message = "Fiscal year start must not exceed 30 characters")
    private String fiscalYearStart;

    @Size(max = 20, message = "Date format must not exceed 20 characters")
    private String dateFormat;

    @Size(max = 20, message = "Time format must not exceed 20 characters")
    private String timeFormat;

    private UpdateRegionalSettingsRequest data;

    public String resolveCurrency() {
        if (StringUtils.hasText(currency)) return currency.trim();
        if (StringUtils.hasText(defaultCurrency)) return defaultCurrency.trim();
        if (data != null) return data.resolveCurrency();
        return null;
    }

    public String resolveTimezone() {
        if (StringUtils.hasText(timezone)) return timezone.trim();
        if (data != null) return data.resolveTimezone();
        return null;
    }

    public String resolveFiscalYearStartMonth() {
        if (StringUtils.hasText(fiscalYearStartMonth)) return fiscalYearStartMonth.trim();
        if (StringUtils.hasText(fiscalYearStart)) return fiscalYearStart.trim();
        if (data != null) return data.resolveFiscalYearStartMonth();
        return null;
    }

    public String resolveDateFormat() {
        if (StringUtils.hasText(dateFormat)) return dateFormat.trim();
        if (data != null) return data.resolveDateFormat();
        return null;
    }

    public String resolveTimeFormat() {
        if (StringUtils.hasText(timeFormat)) return timeFormat.trim();
        if (data != null) return data.resolveTimeFormat();
        return null;
    }
}

