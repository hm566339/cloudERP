package com.erp.account.modules.proformainvoice.mapper;

import com.erp.account.modules.proformainvoice.dto.response.v2.ProformaInvoiceV2Response;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceItem;
import com.erp.account.modules.customer.entity.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface ProformaInvoiceV2Mapper {

    // -----------------------------------------------------------------------
    // ProformaInvoice  →  ProformaInvoiceV2Response
    // -----------------------------------------------------------------------

    @Mapping(target = "piDate",    source = "piDate")
    @Mapping(target = "validTill", source = "piValidTill")

    @Mapping(target = "source.quotationId",     source = "sourceQuotationId")
    @Mapping(target = "source.quotationNumber", source = "sourceQuotationNumber")

    @Mapping(target = "customer", expression = "java(mapCustomer(proformaInvoice))")

    @Mapping(target = "advance.required",        source = "advanceRequired")
    @Mapping(target = "advance.amount",          source = "advanceAmount")
    @Mapping(target = "advance.receivedAmount",  expression = "java(java.math.BigDecimal.ZERO)")
    @Mapping(target = "advance.remainingAmount", expression = "java(calculateRemainingAdvance(proformaInvoice))")

    @Mapping(target = "addresses.billing.id",        source = "billingAddressId")
    @Mapping(target = "addresses.billing.snapshot",  source = "billingAddressSnapshot")
    @Mapping(target = "addresses.delivery.id",       source = "deliveryAddressId")
    @Mapping(target = "addresses.delivery.snapshot", source = "deliveryAddressSnapshot")

    @Mapping(target = "commercial.paymentTerms",  source = "paymentTerms")
    @Mapping(target = "commercial.deliveryTerms", source = "deliveryTerms")

    @Mapping(target = "amounts.subtotal",     source = "subtotal")
    @Mapping(target = "amounts.discount",     source = "discountAmount")
    @Mapping(target = "amounts.tax",          source = "taxAmount")
    @Mapping(target = "amounts.freight",      source = "freightCharges")
    @Mapping(target = "amounts.otherCharges", source = "otherCharges")
    @Mapping(target = "amounts.roundOff",     source = "roundOff")
    @Mapping(target = "amounts.total",        source = "totalAmount")

    @Mapping(target = "payments.summary.totalPaid", expression = "java(java.math.BigDecimal.ZERO)")
    @Mapping(target = "payments.summary.totalDue",  expression = "java(calculateTotalDue(proformaInvoice))")



    @Mapping(target = "items", expression = "java(mapItems(proformaInvoice))")
    ProformaInvoiceV2Response toResponse(ProformaInvoice proformaInvoice);

    // -----------------------------------------------------------------------
    // ProformaInvoiceItem  →  ItemDto
    // -----------------------------------------------------------------------

    @Mapping(target = "item.id",   source = "itemId")
    @Mapping(target = "item.name", source = "itemName")

    @Mapping(target = "quantity", expression = "java(mapQuantity(item))")

    // PricingDetails: unitPrice, discountPercent, discountAmount, taxableAmount
    @Mapping(target = "pricing.unitPrice",       source = "unitPrice")
    @Mapping(target = "pricing.discountPercent", source = "discountPercent")
    @Mapping(target = "pricing.discountAmount",  source = "discountAmount")
    @Mapping(target = "pricing.taxableAmount",   source = "taxableAmount")

    // TaxDetails: flat fields matching TaxDetails DTO exactly
    @Mapping(target = "taxes.taxAmount",  source = "taxAmount")
    @Mapping(target = "taxes.cgstAmount", source = "cgstAmount")
    @Mapping(target = "taxes.sgstAmount", source = "sgstAmount")
    @Mapping(target = "taxes.igstAmount", source = "igstAmount")
    @Mapping(target = "taxes.cessAmount", source = "cessAmount")

    @Mapping(target = "totalAmount", source = "totalAmount")

    ProformaInvoiceV2Response.ItemDto toItemDto(ProformaInvoiceItem item);

    // -----------------------------------------------------------------------
    // Helper: manually map items list so MapStruct doesn't infer incorrectly
    // -----------------------------------------------------------------------
    default List<ProformaInvoiceV2Response.ItemDto> mapItems(ProformaInvoice entity) {
        if (entity == null || entity.getItems() == null) return List.of();
        return entity.getItems().stream()
                .map(this::toItemDto)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // Computation helpers
    // -----------------------------------------------------------------------

    @Named("calculateRemainingAdvance")
    default BigDecimal calculateRemainingAdvance(ProformaInvoice entity) {
        if (entity == null || entity.getAdvanceAmount() == null) return BigDecimal.ZERO;
        BigDecimal paid = BigDecimal.ZERO; // wire receipt service here if needed
        return entity.getAdvanceAmount().subtract(paid).max(BigDecimal.ZERO);
    }

    @Named("calculateTotalDue")
    default BigDecimal calculateTotalDue(ProformaInvoice entity) {
        if (entity == null || entity.getTotalAmount() == null) return BigDecimal.ZERO;
        BigDecimal paid = BigDecimal.ZERO; // wire receipt service here if needed
        return entity.getTotalAmount().subtract(paid).max(BigDecimal.ZERO);
    }

    @Named("calculateRemainingQuantity")
    default BigDecimal calculateRemainingQuantity(ProformaInvoiceItem item) {
        if (item == null || item.getQuantity() == null) return BigDecimal.ZERO;
        BigDecimal converted = item.getConvertedQuantity() != null ? item.getConvertedQuantity() : BigDecimal.ZERO;
        return item.getQuantity().subtract(converted).max(BigDecimal.ZERO);
    }
    
    default ProformaInvoiceV2Response.CustomerDto mapCustomer(ProformaInvoice entity) {
        if (entity == null) return null;
        return ProformaInvoiceV2Response.CustomerDto.builder()
                .id(entity.getCustomerId())
                .name(entity.getCustomer() != null ? entity.getCustomer().getCustomerName() : null)
                .code(entity.getCustomer() != null ? entity.getCustomer().getCustomerCode() : null)
                .build();
    }

    default ProformaInvoiceV2Response.QuantityDetails mapQuantity(ProformaInvoiceItem item) {
        if (item == null) return null;
        BigDecimal remaining = calculateRemainingQuantity(item);
        return ProformaInvoiceV2Response.QuantityDetails.builder()
                .ordered(item.getQuantity())
                .converted(item.getConvertedQuantity())
                .remaining(remaining)
                .unit(item.getUnit())
                .build();
    }
}
