package com.erp.account.modules.deliverychallan.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryChallanUpdateRequest {

    private UUID deliveryAddressId;

    @Size(max = 100, message = "Reference number cannot exceed 100 characters")
    private String referenceNumber;

    private LocalDate dispatchDate;
    private UUID transporterId;

    @Size(max = 50, message = "Vehicle number cannot exceed 50 characters")
    private String vehicleNumber;

    @Size(max = 100, message = "LR number cannot exceed 100 characters")
    private String lrNumber;

    private String notes;

    @Valid
    private List<DeliveryChallanItemUpdateRequest> items;
}
