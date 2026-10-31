package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.util.StringUtils;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateOrganizationProfileRequest {

    @Size(max = 255, message = "Organization name must not exceed 255 characters")
    private String name;

    @Size(max = 255, message = "Organization name must not exceed 255 characters")
    private String organizationName;

    @Email(message = "Primary organization email must be a valid email address")
    @Size(max = 255, message = "Primary organization email must not exceed 255 characters")
    private String primaryEmail;

    @Email(message = "Contact email must be a valid email address")
    @Size(max = 255, message = "Contact email must not exceed 255 characters")
    private String email;

    @Email(message = "Contact email must be a valid email address")
    @Size(max = 255, message = "Contact email must not exceed 255 characters")
    private String contactEmail;

    private UpdateOrganizationProfileRequest data;

    public String resolveName() {
        if (StringUtils.hasText(name)) {
            return name.trim();
        }
        if (StringUtils.hasText(organizationName)) {
            return organizationName.trim();
        }
        if (data != null) {
            return data.resolveName();
        }
        return null;
    }

    public String resolvePrimaryEmail() {
        if (StringUtils.hasText(primaryEmail)) {
            return primaryEmail.trim();
        }
        if (StringUtils.hasText(contactEmail)) {
            return contactEmail.trim();
        }
        if (StringUtils.hasText(email)) {
            return email.trim();
        }
        if (data != null) {
            return data.resolvePrimaryEmail();
        }
        return null;
    }
}

