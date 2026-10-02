package com.erp.account.modules.paymentvoucher.dto.response.profile;

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
public class VendorProfileDto {
    private UUID vendorId;
    private String vendorCode;
    private String vendorName;
    private String gstin;
    private String pan;
    private String email;
    private String phone;
    private String address;
    private String paymentTerms;
    private BigDecimal outstandingBalance;
    private BigDecimal creditLimit;
}
