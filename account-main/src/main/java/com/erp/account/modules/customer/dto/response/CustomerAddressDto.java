package com.erp.account.modules.customer.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerAddressDto extends BaseResponseDto  implements Serializable {
    private static final long serialVersionUID = 1L;
    private UUID id;
    private String addressType;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String country;
    private String postalCode;
    private Boolean isDefault;
    private Boolean isActive;
    private UUID gstStateId;
    private String gstStateCode;
    private String gstStateName;
}
