package com.erp.account.modules.customer.dto.response;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerContactDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private String contactPerson;
    private String email;
    private String phone;
}
