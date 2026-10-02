package com.erp.account.modules.paymentvoucher.dto.response.profile;

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
public class InvoiceAllocationProfileDto {
    private UUID allocationId;
    private UUID purchaseInvoiceId;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal invoiceAmount;
    private BigDecimal previouslyPaidAmount;
    private BigDecimal allocatedAmount;
    private BigDecimal remainingOutstanding;
    private String allocationStatus;
}
