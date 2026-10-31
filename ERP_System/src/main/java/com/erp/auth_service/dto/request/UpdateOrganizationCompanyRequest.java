package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateOrganizationCompanyRequest {

    @Size(max = 255, message = "Company name must not exceed 255 characters")
    private String companyName;

    @Size(max = 255, message = "Legal name must not exceed 255 characters")
    private String legalName;

    @Size(max = 50, message = "Company type must not exceed 50 characters")
    private String companyType;

    @Size(max = 15, message = "GSTIN must not exceed 15 characters")
    private String gstin;

    @Size(max = 10, message = "PAN must not exceed 10 characters")
    private String pan;

    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;

    @Size(max = 255, message = "Website must not exceed 255 characters")
    private String website;

    @Size(max = 255, message = "Address line 1 must not exceed 255 characters")
    private String addressLine1;

    @Size(max = 255, message = "Address line 2 must not exceed 255 characters")
    private String addressLine2;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State must not exceed 100 characters")
    private String state;

    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;

    @Size(max = 20, message = "Postal code must not exceed 20 characters")
    private String postalCode;

    @Size(max = 3, message = "Base currency must be 3 characters")
    private String baseCurrency;

    private Boolean active;

    private UpdateOrganizationCompanyRequest data;

    public UpdateOrganizationCompanyRequest resolve() {
        return data != null ? data : this;
    }
}

