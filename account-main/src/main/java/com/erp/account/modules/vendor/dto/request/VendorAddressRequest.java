package com.erp.account.modules.vendor.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorAddressRequest {

    @NotBlank(message = "Address type is mandatory")
    @Size(max = 50, message = "Address type cannot exceed 50 characters")
    private String addressType;

    @NotBlank(message = "Address line 1 is mandatory")
    @Size(max = 255, message = "Address line 1 cannot exceed 255 characters")
    private String addressLine1;

    @Size(max = 255, message = "Address line 2 cannot exceed 255 characters")
    private String addressLine2;

    @NotBlank(message = "City is mandatory")
    @Size(max = 255, message = "City cannot exceed 255 characters")
    private String city;

    @NotNull(message = "GST State ID is mandatory")
    private UUID gstStateId;

    @NotBlank(message = "Country is mandatory")
    @Size(max = 255, message = "Country cannot exceed 255 characters")
    private String country;

    @Size(max = 20, message = "Postal code cannot exceed 20 characters")
    private String postalCode;

    private Boolean isDefault = false;
    
    private Boolean isActive = true;
}
