package com.erp.account.modules.vendor.dto.response;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorAddressDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private String type; // BILLING, SHIPPING
    private String addressLine1;
    private String city;
    private String state;
    private String country;
    private String pinCode;
}
