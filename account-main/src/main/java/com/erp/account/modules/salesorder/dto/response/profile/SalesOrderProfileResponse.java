package com.erp.account.modules.salesorder.dto.response.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Complete Sales Order Details Response")
public class SalesOrderProfileResponse extends BaseResponseDto implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "Sales Order ID")
    private UUID id;

    @Schema(description = "Sales Order Number (e.g. SO-2026-09-000001)")
    private String soNumber;

    @Schema(description = "Sales Order Date")
    private LocalDate soDate;

    @Schema(description = "Sales Order Status (DRAFT, CONFIRMED, COMPLETED, CANCELLED)")
    private String status;

    @Schema(description = "Fulfillment Status (UNFULFILLED, PARTIALLY_DISPATCHED, FULLY_DISPATCHED)")
    private String fulfillmentStatus;

    @Schema(description = "Currency Code (e.g. INR, USD)")
    private String currency;

    @Schema(description = "Resolved Customer Details including structured addresses")
    private SalesOrderCustomerDto customer;

    // Top-level customer identification
    @Schema(description = "Customer ID")
    private UUID customerId;

    @Schema(description = "Customer Name")
    private String customerName;

    @Schema(description = "Customer Code")
    private String customerCode;

    @Schema(description = "Raw billing address snapshot preserved from creation")
    private String billingAddressSnapshot;

    @Schema(description = "Raw delivery address snapshot preserved from creation")
    private String deliveryAddressSnapshot;

    @Schema(description = "Sales Order Line Items")
    @Builder.Default
    private List<SalesOrderItemDto> items = new ArrayList<>();

    @Schema(description = "Subtotal / Taxable Amount")
    private BigDecimal subtotal;

    @Schema(description = "Total Discount Amount")
    private BigDecimal discountAmount;

    @Schema(description = "Total Tax Amount")
    private BigDecimal taxAmount;

    @Schema(description = "Freight Charges")
    private BigDecimal freightCharges;

    @Schema(description = "Other Charges")
    private BigDecimal otherCharges;

    @Schema(description = "Round Off Amount")
    private BigDecimal roundOff;

    @Schema(description = "Total Grand Amount")
    private BigDecimal totalAmount;

    @Schema(description = "Payment Term ID")
    private UUID paymentTermId;

    @Schema(description = "Payment Terms Text")
    private String paymentTerms;

    @Schema(description = "Terms and Conditions ID")
    private UUID termsConditionId;

    @Schema(description = "Terms and Conditions Text")
    private String termsAndConditions;

    @Schema(description = "Delivery Terms Text")
    private String deliveryTerms;

    @Schema(description = "Notes / Remarks")
    private String notes;

    @Schema(description = "Raw bank details snapshot")
    private String bankDetailsSnapshot;

    @Schema(description = "Source Proforma Invoice ID if converted from PI")
    private UUID sourceProformaInvoiceId;

    @Schema(description = "Source Proforma Invoice Number")
    private String sourceProformaInvoiceNumber;

    @Schema(description = "Source Quotation ID if converted from Quotation")
    private UUID sourceQuotationId;

    @Schema(description = "Source Quotation Number")
    private String sourceQuotationNumber;

    @Schema(description = "Place of Supply State ID")
    private UUID placeOfSupplyStateId;

    @Schema(description = "Place of Supply State Code")
    private String placeOfSupplyStateCode;

    @Schema(description = "Place of Supply State Name / Code formatted")
    private String placeOfSupply;

    @Schema(description = "Reference Number")
    private String referenceNumber;

    @Schema(description = "Exchange Rate")
    private BigDecimal exchangeRate;

    @Schema(description = "Created At")
    private LocalDateTime createdAt;

    @Schema(description = "Created By User ID")
    private UUID createdBy;

    @Schema(description = "Updated At")
    private LocalDateTime updatedAt;

    @Schema(description = "Updated By User ID")
    private UUID updatedBy;

    // Convenience getters for frontend compatibility
    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getSubTotal() {
        return subtotal;
    }

    public BigDecimal getTotalTaxAmount() {
        return taxAmount;
    }

    public BigDecimal getGrandTotal() {
        return totalAmount;
    }

    public String getShippingAddress() {
        if (customer != null && customer.getDeliveryAddress() != null) {
            SalesOrderAddressDto addr = customer.getDeliveryAddress();
            List<String> parts = new ArrayList<>();
            if (addr.getAddressLine1() != null) parts.add(addr.getAddressLine1());
            if (addr.getAddressLine2() != null) parts.add(addr.getAddressLine2());
            if (addr.getCity() != null) parts.add(addr.getCity());
            if (addr.getState() != null) parts.add(addr.getState());
            if (addr.getPostalCode() != null) parts.add(addr.getPostalCode());
            if (addr.getCountry() != null) parts.add(addr.getCountry());
            if (!parts.isEmpty()) return String.join(", ", parts);
        }
        return deliveryAddressSnapshot;
    }

    public String getBillingAddress() {
        if (customer != null && customer.getBillingAddress() != null) {
            SalesOrderAddressDto addr = customer.getBillingAddress();
            List<String> parts = new ArrayList<>();
            if (addr.getAddressLine1() != null) parts.add(addr.getAddressLine1());
            if (addr.getAddressLine2() != null) parts.add(addr.getAddressLine2());
            if (addr.getCity() != null) parts.add(addr.getCity());
            if (addr.getState() != null) parts.add(addr.getState());
            if (addr.getPostalCode() != null) parts.add(addr.getPostalCode());
            if (addr.getCountry() != null) parts.add(addr.getCountry());
            if (!parts.isEmpty()) return String.join(", ", parts);
        }
        return billingAddressSnapshot;
    }
}
