package com.erp.account.modules.purchaserequisition.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisitionRequest {
    private UUID requesterId;
    private String requisitionName;
    private UUID departmentId;
    private UUID costCenterId;
    @NotNull
    private LocalDate requiredDate;
    private String priority;
    private String purpose;
    private String remarks;
    @Valid
    @NotEmpty
    private List<PurchaseRequisitionItemRequest> items;
}
