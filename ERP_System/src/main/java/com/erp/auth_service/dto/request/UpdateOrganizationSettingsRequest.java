package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
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
public class UpdateOrganizationSettingsRequest {

    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 255, message = "Company name must be between 2 and 255 characters")
    private String companyName;

    @NotBlank(message = "Contact email is required")
    @Email(message = "Invalid contact email format")
    @Size(max = 255, message = "Contact email must not exceed 255 characters")
    private String contactEmail;

    /**
     * Optional nested wrapper for compatibility with { data: { companyName, contactEmail } }
     */
    private UpdateOrganizationSettingsRequest data;

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
}

