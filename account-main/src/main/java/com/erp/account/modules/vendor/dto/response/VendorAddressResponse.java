package com.erp.account.modules.vendor.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorAddressResponse extends BaseResponseDto  implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private UUID id;
    private UUID vendorId;
    private String addressType;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private UUID gstStateId;
    private String country;
    private String postalCode;
    private Boolean isDefault;
    private Boolean isActive;
}
