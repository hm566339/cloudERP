package com.erp.account.modules.company.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CompanyRequest {

    @NotBlank(message = "Company code is required")
    @Pattern(
            regexp = "^[A-Za-z0-9]+$",
            message = "Company code must not contain spaces or special characters")
    private String companyCode;

    @NotBlank(message = "Company name is required")
    @Size(
            min = 2,
            max = 255,
            message = "Company name must be between 2 and 255 characters")
    private String companyName;

    @NotBlank(message = "GSTIN is required")
    @Pattern(
            regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$",
            message = "Invalid GSTIN format")
    private String gstin;

    @NotBlank(message = "Base currency is required")
    @Pattern(
            regexp = "^[A-Z]{3}$",
            message = "Base currency must be a 3-letter currency code")
    private String baseCurrency;

    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^(\\+91|91)?[6-9][0-9]{9}$",
            message = "Invalid phone number")
    private String phone;

    @Size(max = 255, message = "Address line 1 cannot exceed 255 characters")
    private String addressLine1;

    @Size(max = 255, message = "Address line 2 cannot exceed 255 characters")
    private String addressLine2;

    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State cannot exceed 100 characters")
    private String state;

    @Size(max = 100, message = "Country cannot exceed 100 characters")
    private String country;

    @Size(max = 20, message = "Postal code cannot exceed 20 characters")
    private String postalCode;

    @Size(max = 100, message = "Company type cannot exceed 100 characters")
    private String companyType;

    @Size(max = 255, message = "Legal name cannot exceed 255 characters")
    private String legalName;

    @Size(max = 500, message = "Logo URL cannot exceed 500 characters")
    private String logoUrl;

    @Size(max = 20, message = "PAN cannot exceed 20 characters")
    private String pan;

    @Size(max = 255, message = "Website cannot exceed 255 characters")
    private String website;

    @Builder.Default
    private Boolean active = true;
}