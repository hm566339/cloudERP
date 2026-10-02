package com.erp.account.modules.salesorder.mapper;

import com.erp.account.modules.salesorder.dto.response.v2.SalesOrderV2Response;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.entity.SalesOrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface SalesOrderV2Mapper {

    @Mapping(target = "source", expression = "java(mapSource(salesOrder))")

    // Customer mapping
    @Mapping(target = "customer", expression = "java(mapCustomer(salesOrder))")

    // Addresses
    @Mapping(target = "addresses.billing", source = "billingAddressSnapshot")
    @Mapping(target = "addresses.delivery", source = "deliveryAddressSnapshot")

    // Amounts
    @Mapping(target = "amounts.subtotal", source = "subtotal")
    @Mapping(target = "amounts.discount", source = "discountAmount")
    @Mapping(target = "amounts.tax", source = "taxAmount")
    @Mapping(target = "amounts.freight", source = "freightCharges")
    @Mapping(target = "amounts.otherCharges", source = "otherCharges")
    @Mapping(target = "amounts.roundOff", source = "roundOff")
    @Mapping(target = "amounts.total", source = "totalAmount")

    // Commercial
    @Mapping(target = "commercial.paymentTerms", source = "paymentTerms")
    @Mapping(target = "commercial.deliveryTerms", source = "deliveryTerms")
    @Mapping(target = "commercial.notes", source = "notes")



    @Mapping(target = "items", expression = "java(mapItems(salesOrder))")
    SalesOrderV2Response toResponse(SalesOrder salesOrder);

    @Mapping(target = "item.id", source = "itemId")
    @Mapping(target = "item.name", source = "itemName")
    
    @Mapping(target = "pricing.unitPrice", source = "unitPrice")
    @Mapping(target = "pricing.discountPercent", source = "discountPercent")
    @Mapping(target = "pricing.discountAmount", source = "discountAmount")
    @Mapping(target = "pricing.taxableAmount", source = "taxableAmount")

    @Mapping(target = "taxes.taxAmount", source = "taxAmount")
    @Mapping(target = "taxes.cgstAmount", source = "cgstAmount")
    @Mapping(target = "taxes.sgstAmount", source = "sgstAmount")
    @Mapping(target = "taxes.igstAmount", source = "igstAmount")
    @Mapping(target = "taxes.cessAmount", source = "cessAmount")

    @Mapping(target = "fulfillment.warehouseId", source = "warehouseId")
    @Mapping(target = "fulfillment.locationId", source = "locationId")
    SalesOrderV2Response.ItemDto toItemDto(SalesOrderItem item);

    default List<SalesOrderV2Response.ItemDto> mapItems(SalesOrder entity) {
        if (entity == null || entity.getItems() == null) return List.of();
        return entity.getItems().stream()
                .map(this::toItemDto)
                .collect(Collectors.toList());
    }

    @Named("determineSourceType")
    default SalesOrderV2Response.SalesOrderSourceType determineSourceType(SalesOrder entity) {
        if (entity == null) return SalesOrderV2Response.SalesOrderSourceType.MANUAL;
        if (entity.getSourceProformaInvoiceId() != null) return SalesOrderV2Response.SalesOrderSourceType.PROFORMA_INVOICE;
        if (entity.getSourceQuotationId() != null) return SalesOrderV2Response.SalesOrderSourceType.QUOTATION;
        return SalesOrderV2Response.SalesOrderSourceType.MANUAL;
    }
    
    default SalesOrderV2Response.SourceDto mapSource(SalesOrder entity) {
        if (entity == null) return null;
        
        SalesOrderV2Response.SalesOrderSourceType type = determineSourceType(entity);
        
        SalesOrderV2Response.ProformaInvoiceRef piRef = null;
        if (entity.getSourceProformaInvoiceId() != null) {
            piRef = SalesOrderV2Response.ProformaInvoiceRef.builder()
                    .id(entity.getSourceProformaInvoiceId())
                    .number(entity.getSourceProformaInvoiceNumber())
                    .build();
        }
        
        SalesOrderV2Response.QuotationRef qRef = null;
        if (entity.getSourceQuotationId() != null) {
            qRef = SalesOrderV2Response.QuotationRef.builder()
                    .id(entity.getSourceQuotationId())
                    .number(entity.getSourceQuotationNumber())
                    .build();
        }
        
        return SalesOrderV2Response.SourceDto.builder()
                .type(type)
                .proformaInvoice(piRef)
                .quotation(qRef)
                .build();
    }

    default SalesOrderV2Response.CustomerDto mapCustomer(SalesOrder entity) {
        if (entity == null) return null;
        return SalesOrderV2Response.CustomerDto.builder()
                .id(entity.getCustomerId())
                .name(entity.getCustomer() != null ? entity.getCustomer().getCustomerName() : null)
                .code(entity.getCustomer() != null ? entity.getCustomer().getCustomerCode() : null)
                .build();
    }
}
