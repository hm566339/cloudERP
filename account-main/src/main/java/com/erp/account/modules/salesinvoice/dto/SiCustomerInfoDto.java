package com.erp.account.modules.salesinvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiCustomerInfoDto {
    private UUID customerId;
    private String customerCode;
    private String customerName;
    private String gstin;
    private String pan;
    private String email;
    private String phone;
    private String billingAddress;
    private String shippingAddress;
    private BigDecimal creditLimit;
    private BigDecimal outstandingBalance;
    private BigDecimal availableCredit;
    private String paymentTerms;
}
