package com.erp.account.modules.apinvoice.dto.request;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.util.Invoice;


/**
 * DTO for AP Invoice Line Item Response
 * 
 * Contains line item details for API responses
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ApInvoiceItemResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Line item ID
     */
    private UUID id;

    /**
     * Item Master ID
     */
    private UUID itemId;

    private com.erp.account.enums.ItemType itemType;

    private UUID warehouseId;

    private UUID locationId;

    private String unit;

    /**
     * Line item description
     */
    private String description;

    /**
     * Quantity of the item
     */
    private BigDecimal quantity;

    /**
     * Unit price of the item
     */
    private BigDecimal unitPrice;

    /**
     * Taxable amount
     */
    private BigDecimal taxableAmount;

    /**
     * Tax amount
     */
    private BigDecimal taxAmount;

    /**
     * Total line amount (taxable + tax)
     */
    private BigDecimal totalAmount;

    /**
     * Expense account selected for the line item
     */
    private UUID expenseAccountId;

    /**
     * HSN/SAC ID
     */
    private UUID hsnSacId;

    private String hsnSacCode;

    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal cessAmount;

    /**
     * Item creation timestamp
     */
    private String createdAt;

    /**
     * Item last update timestamp
     */
    private String updatedAt;
}
