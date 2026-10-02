package com.erp.account.modules.vendor.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorFilterDto {

    private String searchKey;
    private String vendorCode;
    private String vendorName;
    private String email;
    private String phone;
    private String gstin;
    private String pan;
    private String city;
    private String state;
    private String country;
    private String pinCode;
    private BigDecimal minCreditLimit;
    private BigDecimal maxCreditLimit;
    private Boolean isActive;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
}
