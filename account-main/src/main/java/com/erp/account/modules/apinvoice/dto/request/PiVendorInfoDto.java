package com.erp.account.modules.apinvoice.dto.request;

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
public class PiVendorInfoDto {
    private UUID vendorId;
    private String vendorCode;
    private String vendorName;
    private String gstin;
    private String pan;
    private String email;
    private String phone;
    private String billingAddress;
    private String paymentTerms;
    private Integer creditPeriod;
    private BigDecimal outstandingBalance;
    private BigDecimal availableCredit;
}
