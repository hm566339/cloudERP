package com.erp.account.modules.quotation.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QtCustomerInfoDto {
    private java.util.UUID customerId;
    private String customerCode;
    private String customerName;
    private String companyName;
    private String gstin;
    private String pan;
    private String email;
    private String phone;
    private String billingAddress;
    private String shippingAddress;
    private String city;
    private String state;
    private String country;
    private java.math.BigDecimal creditLimit;
    private java.math.BigDecimal outstandingBalance;
    private java.math.BigDecimal availableCredit;
}
