package com.erp.account.modules.vendor.dto.response;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorContactDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private String contactPerson;
    private String email;
    private String phone;
    private String mobile;
}
