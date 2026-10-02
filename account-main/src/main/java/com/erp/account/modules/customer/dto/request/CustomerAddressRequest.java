package com.erp.account.modules.customer.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerAddressRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Address type is required")
    @Size(max = 50, message = "Address type cannot exceed 50 characters")
    private String addressType;

    @NotBlank(message = "Address Line 1 is required")
    @Size(max = 255, message = "Address Line 1 cannot exceed 255 characters")
    private String addressLine1;

    @Size(max = 255, message = "Address Line 2 cannot exceed 255 characters")
    private String addressLine2;

    @NotBlank(message = "City is required")
    @Size(max = 255, message = "City cannot exceed 255 characters")
    private String city;

    private UUID gstStateId;

    @NotBlank(message = "Country is required")
    @Size(max = 255, message = "Country cannot exceed 255 characters")
    private String country;

    @Size(max = 20, message = "Postal code cannot exceed 20 characters")
    private String postalCode;

    private Boolean isDefault = false;

    private Boolean isActive = true;
}
