package com.erp.crm.modules.quotation.dto.response;

import com.erp.crm.modules.quotation.enums.DiscountType;
import com.erp.crm.modules.quotation.enums.QuotationApprovalStatus;
import com.erp.crm.modules.quotation.enums.QuotationStatus;
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
public class QuotationResponse {

    private UUID id;
    private UUID companyId;
    private String quotationNumber;
    private LocalDate quotationDate;
    private LocalDate validUntil;
    private UUID opportunityId;
    private UUID accountId;
    private String accountName;
    private UUID contactId;
    private String contactName;
    private Integer revisionNumber;
    private String currency;
    private BigDecimal subtotal;
    private DiscountType discountType;
    private BigDecimal discountPct;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal freightCharges;
    private BigDecimal otherCharges;
    private BigDecimal totalAmount;
    private String placeOfSupplyStateCode;
    private QuotationStatus status;
    private QuotationApprovalStatus approvalStatus;
    private Boolean discountApprovalRequired;
    private UUID workflowTransactionId;
    private UUID accountMainSalesOrderId;
    private List<ItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemResponse {
        private UUID id;
        private Integer itemOrder;
        private UUID productId;
        private String productCode;
        private String productName;
        private String hsnSacCode;
        private BigDecimal quantity;
        private String uom;
        private BigDecimal unitPrice;
        private BigDecimal discountPct;
        private BigDecimal discountAmount;
        private BigDecimal taxableAmount;
        private BigDecimal cgstRate;
        private BigDecimal cgstAmount;
        private BigDecimal sgstRate;
        private BigDecimal sgstAmount;
        private BigDecimal igstRate;
        private BigDecimal igstAmount;
        private BigDecimal totalAmount;
    }
}

