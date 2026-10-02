package com.erp.auth_service.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CompanyRequest {

    @Size(max = 100, message = "Company code must not exceed 100 characters")
    private String companyCode;

    @NotBlank(message = "Company name is required")
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

    @Email(message = "Invalid email format")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone number must contain 10 to 15 digits")
    private String phone;

    @Size(max = 255, message = "Website must not exceed 255 characters")
    private String website;

    @Size(max = 255, message = "Address Line 1 must not exceed 255 characters")
    private String addressLine1;

    @Size(max = 255, message = "Address Line 2 must not exceed 255 characters")
    private String addressLine2;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State must not exceed 100 characters")
    private String state;

    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;

    @NotBlank(message = "Base currency is required")
    @Size(max = 3, message = "Base currency must not exceed 3 characters")
    private String baseCurrency;

    @Size(max = 20, message = "Postal code must not exceed 20 characters")
    private String postalCode;

    private Boolean active = true;
}