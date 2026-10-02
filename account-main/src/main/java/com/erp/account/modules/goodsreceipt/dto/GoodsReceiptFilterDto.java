package com.erp.account.modules.goodsreceipt.dto;

import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptFilterDto {

    private GoodsReceiptStatus status;
    private UUID purchaseOrderId;
    private UUID vendorId;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String search;
}
