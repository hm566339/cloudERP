package com.erp.account.modules.proformainvoice.dto.response.v2;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProformaInvoiceV2Response extends BaseResponseDto  {
    private UUID id;
    private String piNumber;
    private LocalDate piDate;
    private LocalDate validTill;
    private ProformaInvoiceStatus status;
    private String currency;
    
    private SourceDto source;
    private CustomerDto customer;
    private AdvanceDto advance;
    private AddressesDto addresses;
    private CommercialDto commercial;
    private AmountsDto amounts;
    private List<ItemDto> items;
    private PaymentsDto payments;
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceDto {
        private UUID quotationId;
        private String quotationNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerDto {
        private UUID id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdvanceDto {
        private Boolean required;
        private BigDecimal amount;
        private BigDecimal receivedAmount;
        private BigDecimal remainingAmount;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressDetails {
        private UUID id;
        private String snapshot;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressesDto {
        private AddressDetails billing;
        private AddressDetails delivery;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommercialDto {
        private String paymentCondition;
        private String paymentTerms;
        private String deliveryTerms;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmountsDto {
        private BigDecimal subtotal;
        private BigDecimal discount;
        private BigDecimal tax;
        private BigDecimal freight;
        private BigDecimal otherCharges;
        private BigDecimal roundOff;
        private BigDecimal total;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDto {
        private UUID id;
        private ItemDetails item;
        private QuantityDetails quantity;
        private PricingDetails pricing;
        private TaxDetails taxes;

        private BigDecimal totalAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDetails {
        private UUID id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuantityDetails {
        private BigDecimal ordered;
        private BigDecimal converted;
        private BigDecimal remaining;
        private String unit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PricingDetails {
        private BigDecimal unitPrice;
        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private BigDecimal taxableAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaxDetails {
        private BigDecimal taxAmount;
        private BigDecimal cgstAmount;
        private BigDecimal sgstAmount;
        private BigDecimal igstAmount;
        private BigDecimal cessAmount;
    }



    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentsDto {
        private PaymentSummary summary;
        private List<Object> receipts; // Leaving as object for now or create a specific ReceiptDto
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentSummary {
        private BigDecimal totalPaid;
        private BigDecimal totalDue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditDto {
        private LocalDateTime createdAt;
        private UUID createdBy;
        private LocalDateTime updatedAt;
        private UUID updatedBy;
    }
}
