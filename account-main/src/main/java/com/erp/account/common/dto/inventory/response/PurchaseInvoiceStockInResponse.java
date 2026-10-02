package com.erp.account.common.dto.inventory.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import java.io.Serializable;
import java.util.UUID;
import lombok.Data;

@Data
public class PurchaseInvoiceStockInResponse extends BaseResponseDto  implements Serializable {
    private UUID transactionId;
    private String status;
    private String message;
}
