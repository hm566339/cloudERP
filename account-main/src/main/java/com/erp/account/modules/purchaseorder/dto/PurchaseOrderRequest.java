package com.erp.account.modules.purchaseorder.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderRequest {

    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    private String poNumber;

    @NotNull(message = "PO date is required")
    private LocalDate poDate;

    private LocalDate expectedDeliveryDate;

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private BigDecimal exchangeRate = BigDecimal.ONE;

    private UUID placeOfSupplyStateId;

    private String placeOfSupplyStateCode;

    private UUID vendorAddressId;

    private String purchaseAddressLine1;

    private String purchaseAddressLine2;

    private String purchaseCity;

    private String purchaseState;

    private String purchaseCountry;

    private String purchasePostalCode;

    private String shippingAddressSnapshot;

    private String referenceNumber;

    private String paymentTerms;

    private String deliveryTerms;

    private String termsAndConditions;

    private String notes;

    private Boolean advanceRequired;

    private BigDecimal advanceAmount;

    @Builder.Default
    private BigDecimal freightCharges = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal otherCharges = BigDecimal.ZERO;

    @Valid
    @NotEmpty(message = "At least one item is required in the purchase order")
    private List<PurchaseOrderItemRequest> items;
}
