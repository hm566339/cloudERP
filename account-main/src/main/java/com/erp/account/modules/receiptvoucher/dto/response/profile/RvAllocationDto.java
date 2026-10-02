package com.erp.account.modules.receiptvoucher.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RvAllocationDto {
    private UUID allocationId;
    private UUID salesInvoiceId;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal invoiceAmount;
    private BigDecimal previouslyReceivedAmount;
    private BigDecimal allocatedAmount;
    private BigDecimal remainingOutstanding;
    private String allocationStatus;
    private UUID proformaInvoiceId;
    private String proformaInvoiceNumber;
}
