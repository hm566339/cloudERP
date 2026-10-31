package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
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
public class UpdateGeneralSettingsRequest {

    @Size(min = 2, max = 255, message = "Company name must be between 2 and 255 characters")
    private String companyName;

    @Email(message = "Invalid contact email format")
    @Size(max = 255, message = "Contact email must not exceed 255 characters")
    private String contactEmail;

    @Size(min = 2, max = 10, message = "Default currency must be between 2 and 10 characters")
    private String defaultCurrency;

    @Size(min = 2, max = 80, message = "Timezone must be between 2 and 80 characters")
    private String timezone;

    @Size(min = 4, max = 20, message = "Date format must be between 4 and 20 characters")
    private String dateFormat;

    @Size(min = 2, max = 20, message = "Time format must be between 2 and 20 characters")
    private String timeFormat;

    private UpdateGeneralSettingsRequest data;

    public String resolveCompanyName() {
        if (data != null && data.getCompanyName() != null) {
            return data.getCompanyName();
        }
        return companyName;
    }

    public String resolveContactEmail() {
        if (data != null && data.getContactEmail() != null) {
            return data.getContactEmail();
        }
        return contactEmail;
    }

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

