package com.erp.crm.modules.account.dto.request;

import com.erp.crm.modules.account.enums.AddressType;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressRequest {

    private AddressType addressType;

    @NotBlank(message = "Address Line 1 is required")
    private String addressLine1;

    private String addressLine2;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "State code is required")
    private String stateCode;

    @NotBlank(message = "Postal code is required")
    private String postalCode;

    @Builder.Default
    private String country = "India";

    private String gstinForAddress;

    private Boolean isDefault;
}

