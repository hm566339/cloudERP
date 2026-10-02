package com.erp.account.modules.receiptvoucher.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptAllocationResponse extends BaseResponseDto  {
    private UUID id;
    private UUID salesInvoiceId;
    private String invoiceNumber;
    private UUID proformaInvoiceId;
    private String proformaInvoiceNumber;
    private BigDecimal allocatedAmount;
}

