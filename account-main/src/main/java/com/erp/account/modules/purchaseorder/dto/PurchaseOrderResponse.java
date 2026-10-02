package com.erp.account.modules.purchaseorder.dto;

import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderResponse {

    private UUID id;
    private UUID companyId;
    private UUID vendorId;
    private String vendorName;
    private String vendorGstin;
    private String poNumber;
    private LocalDate poDate;
    private LocalDate expectedDeliveryDate;
    private String currency;
    private BigDecimal exchangeRate;
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
    private UUID supplierQuotationId;
    private String supplierQuotationNumber;
    private UUID rfqId;
    private String rfqNumber;
    private UUID purchaseRequisitionId;
    private String purchaseRequisitionNumber;
    private String paymentTerms;
    private String deliveryTerms;
    private String termsAndConditions;
    private String notes;

    private Boolean advanceRequired;
    private BigDecimal advanceAmount;
    private BigDecimal advancePaidAmount;

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxableAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal cessAmount;
    private BigDecimal taxAmount;
    private BigDecimal freightCharges;
    private BigDecimal otherCharges;
    private BigDecimal totalBeforeRoundOff;
    private BigDecimal roundOff;
    private BigDecimal totalAmount;

    private PurchaseOrderStatus status;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private String cancelledReason;

    private LocalDateTime createdAt;
    private UUID createdBy;
    private LocalDateTime updatedAt;
    private UUID updatedBy;

    private List<PurchaseOrderItemResponse> items;
}
