package com.erp.crm.modules.quotation.dto.request;

import com.erp.crm.modules.quotation.enums.DiscountType;
import jakarta.validation.constraints.NotBlank;
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
public class QuotationCreateRequest {

    private UUID opportunityId;

    @NotNull(message = "Account ID is required")
    private UUID accountId;

    private UUID contactId;

    private String title;

    private Integer validityDays;

    private Boolean isInterState;

    private LocalDate quotationDate;

    private LocalDate validUntil;

    private String placeOfSupplyStateCode;

    @Builder.Default
    private DiscountType discountType = DiscountType.PERCENTAGE;

    @Builder.Default
    private BigDecimal discountPct = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    private BigDecimal freightCharges;
    private BigDecimal otherCharges;

    private String paymentTerms;
    private String deliveryTerms;
    private String warrantyTerms;
    private String termsAndConditions;
    private String internalNotes;
    private String customerNotes;

    @NotEmpty(message = "At least one quotation line item is required")
    private List<ItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemRequest {
        private UUID productId;
        private String productCode;

        private String productName;

        private String hsnSacCode;

        private String description;

        private Integer lineNumber;

        @NotNull(message = "Quantity is required")
        private BigDecimal quantity;

        @Builder.Default
        private String uom = "PCS";

        @NotNull(message = "Unit price is required")
        private BigDecimal unitPrice;

        @Builder.Default
        private BigDecimal discountPct = BigDecimal.ZERO;

        private BigDecimal discountPercent;

        private BigDecimal taxRatePercent;

        @Builder.Default
        private BigDecimal cgstRate = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal sgstRate = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal igstRate = BigDecimal.ZERO;
    }
}

