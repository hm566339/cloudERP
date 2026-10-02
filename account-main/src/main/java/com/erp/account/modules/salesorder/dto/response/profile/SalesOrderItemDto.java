package com.erp.account.modules.salesorder.dto.response.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Sales Order Line Item Details")
public class SalesOrderItemDto extends BaseResponseDto implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "Sales Order Item ID")
    private UUID id;

    @Schema(description = "Product/Item ID")
    private UUID productId;

    @Schema(description = "Product Code")
    private String productCode;

    @Schema(description = "Product Name")
    private String productName;

    @Schema(description = "Item Description")
    private String description;

    @Schema(description = "HSN/SAC Code")
    private String hsnSac;

    @Schema(description = "Quantity")
    private BigDecimal quantity;

    @Schema(description = "Dispatched or reserved quantity across active Delivery Challans")
    private BigDecimal dispatchedQuantity;

    @Schema(description = "Delivered / Dispatched quantity")
    private BigDecimal deliveredQuantity;

    @Schema(description = "Remaining open quantity available for dispatch")
    private BigDecimal remainingQuantity;

    @Schema(description = "Unit of Measurement")
    private String unit;

    @Schema(description = "Unit Price")
    private BigDecimal unitPrice;

    @Schema(description = "Discount Percentage")
    private BigDecimal discountPercent;

    @Schema(description = "Discount Amount")
    private BigDecimal discountAmount;

    @Schema(description = "Effective Tax Percentage")
    private BigDecimal taxPercent;

    @Schema(description = "Tax Amount")
    private BigDecimal taxAmount;

    @Schema(description = "CGST Percentage")
    private BigDecimal cgstPercent;

    @Schema(description = "CGST Amount")
    private BigDecimal cgstAmount;

    @Schema(description = "SGST Percentage")
    private BigDecimal sgstPercent;

    @Schema(description = "SGST Amount")
    private BigDecimal sgstAmount;

    @Schema(description = "IGST Percentage")
    private BigDecimal igstPercent;

    @Schema(description = "IGST Amount")
    private BigDecimal igstAmount;

    @Schema(description = "Subtotal (Taxable Amount)")
    private BigDecimal subtotal;

    @Schema(description = "Line Total Amount (including taxes)")
    private BigDecimal totalAmount;

    // Supplementary & compatibility fields
    @Schema(description = "CESS Percentage")
    private BigDecimal cessRate;

    @Schema(description = "CESS Amount")
    private BigDecimal cessAmount;

    @Schema(description = "Warehouse ID")
    private UUID warehouseId;

    @Schema(description = "Location ID")
    private UUID locationId;

    @Schema(description = "Line Item Notes")
    private String notes;

    // Compatibility getters for frontend consumers
    public UUID getItemId() {
        return productId;
    }

    public String getItemName() {
        return productName;
    }

    public String getItemCode() {
        return productCode;
    }

    public String getHsnSacCode() {
        return hsnSac;
    }

    public BigDecimal getTaxableAmount() {
        return subtotal;
    }

    public BigDecimal getCgstRate() {
        return cgstPercent;
    }

    public BigDecimal getSgstRate() {
        return sgstPercent;
    }

    public BigDecimal getIgstRate() {
        return igstPercent;
    }

    public BigDecimal getRemainingOpenQuantity() {
        return remainingQuantity != null ? remainingQuantity : (quantity != null ? quantity : BigDecimal.ZERO);
    }

    public BigDecimal getOpenQuantity() {
        return getRemainingOpenQuantity();
    }
}
