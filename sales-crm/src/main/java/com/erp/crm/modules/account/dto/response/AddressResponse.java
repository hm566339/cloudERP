package com.erp.crm.modules.account.dto.response;

import com.erp.crm.modules.account.enums.AddressType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressResponse {

    private UUID id;
    private UUID companyId;
    private String entityType;
    private UUID entityId;
    private AddressType addressType;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String stateCode;
    private String postalCode;
    private String country;
    private String gstinForAddress;
    private Boolean isDefault;
    private Boolean isActive;
    private LocalDateTime createdAt;
}

