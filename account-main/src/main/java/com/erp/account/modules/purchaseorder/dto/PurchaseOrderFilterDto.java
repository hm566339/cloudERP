package com.erp.account.modules.purchaseorder.dto;

import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderFilterDto {

    private PurchaseOrderStatus status;
    private UUID vendorId;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String search;
}
