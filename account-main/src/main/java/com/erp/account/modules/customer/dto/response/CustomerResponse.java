package com.erp.account.modules.customer.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;
    private UUID companyId;
    private String companyName;
    private String customerCode;
    private String customerName;
    private String gstin;
    private String panNo;
    private String email;
    private String phone;
    private List<CustomerAddressResponse> addresses;
    private BigDecimal creditLimit;
    private Boolean isActive;
    private BigDecimal outstandingBalance;
    private BigDecimal availableCredit;
    private Long totalInvoices;
    private Long totalReceipts;
    private UUID createdBy;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    private UUID updatedBy;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
