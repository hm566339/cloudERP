package com.erp.account.modules.vendor.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorResponse extends BaseResponseDto  {
    private UUID id;
    private UUID companyId;
    private String companyName;
    private String vendorCode;
    private String vendorName;
    private String gstin;
    private String panNo;
    private String email;
    private String phone;
    private String addressLine1;
    private String city;
    private String state;
    private String country;
    private String pinCode;
    private BigDecimal creditLimit;
    private UUID payableAccountId;
    private String payableAccountCode;
    private String payableAccountName;
    private BigDecimal openingBalance;
    private LocalDate openingBalanceDate;
    private Integer paymentTermDays;
    private String paymentTerm;
    private String currencyCode;
    private String currencyName;
    private Boolean tdsApplicable;
    private String tdsSection;
    private BigDecimal tdsRate;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;

    private BigDecimal outstandingBalance;
    private BigDecimal availableCredit;
    private Long totalInvoices;
    private Long totalPayments;
}
