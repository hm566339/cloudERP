package com.erp.account.modules.salesinvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiEinvoiceEwayBillDto {
    private String irn;
    private String ackNumber;
    private LocalDateTime ackDate;
    private String qrCode;
    private String eWayBillNumber;
    private LocalDateTime eWayBillValidity;
}
