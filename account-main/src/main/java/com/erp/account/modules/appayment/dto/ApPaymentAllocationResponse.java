package com.erp.account.modules.appayment.dto;

import com.erp.account.modules.common.dto.BaseResponseDto;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;
import com.erp.account.modules.appayment.entity.ApPayment;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApPaymentAllocationResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;
    private UUID apInvoiceId;
    private String invoiceNo;
    private BigDecimal allocatedAmount;
    private BigDecimal invoiceTotalAmount;
    private BigDecimal invoiceOutstandingAmount;
    private String invoiceStatus;
    private UUID purchaseOrderId;
    private String purchaseOrderNumber;
    private String poNumber;

    public String getPoNumber() {
        return poNumber != null ? poNumber : purchaseOrderNumber;
    }

    public String getPurchaseOrderNumber() {
        return purchaseOrderNumber != null ? purchaseOrderNumber : poNumber;
    }
}
