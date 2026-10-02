package com.erp.account.modules.paymentvoucher.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentVoucherAllocationResponse extends BaseResponseDto  implements Serializable {
    private UUID id;
    private UUID apInvoiceId;
    private String invoiceNo;
    private UUID purchaseOrderId;
    private String poNumber;
    private BigDecimal allocatedAmount;
}
