package com.erp.account.modules.salesorder.dto.response.v2;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderV2Response extends BaseResponseDto  {
    
    private UUID id;
    private String soNumber;
    private LocalDate soDate;
    private SalesOrderStatus status;
    private String currency;
    private String fulfillmentStatus;

    private SourceDto source;
    private CustomerDto customer;
    private AddressesDto addresses;
    private String bankDetailsSnapshot;
    private AmountsDto amounts;
    private CommercialDto commercial;
    private List<ItemDto> items;
    public enum SalesOrderSourceType {
        PROFORMA_INVOICE,
        QUOTATION,
        MANUAL
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceDto {
        private SalesOrderSourceType type;
        private ProformaInvoiceRef proformaInvoice;
        private QuotationRef quotation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProformaInvoiceRef {
        private UUID id;
        private String number;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuotationRef {
        private UUID id;
        private String number;
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
    public static class AddressesDto {
        private String billing;
        private String delivery;
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
    public static class CommercialDto {
        private String paymentTerms;
        private String deliveryTerms;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDto {
        private UUID id;
        private UUID sourceProformaInvoiceItemId;
        private ItemDetails item;
        private String description;
        private BigDecimal quantity;
        private BigDecimal dispatchedQuantity;
        private BigDecimal deliveredQuantity;
        private BigDecimal remainingQuantity;
        private String unit;
        private PricingDetails pricing;
        private TaxDetails taxes;
        private BigDecimal totalAmount;
        private FulfillmentDetails fulfillment;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDetails {
        private UUID id;
        private String name;
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
    public static class FulfillmentDetails {
        private UUID warehouseId;
        private UUID locationId;
        private BigDecimal dispatchedQuantity;
        private BigDecimal deliveredQuantity;
        private BigDecimal remainingQuantity;
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
