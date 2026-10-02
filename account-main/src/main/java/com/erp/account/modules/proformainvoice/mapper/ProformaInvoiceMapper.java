package com.erp.account.modules.proformainvoice.mapper;

import com.erp.account.modules.proformainvoice.dto.response.ProformaInvoiceItemResponse;
import com.erp.account.modules.proformainvoice.dto.response.ProformaInvoiceResponse;
import com.erp.account.modules.proformainvoice.dto.response.profile.ProformaInvoiceProfileResponse;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceItem;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
import com.erp.account.modules.quotation.dto.response.QuotationSummaryDTO;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.proformainvoice.dto.request.PIConversionRequest;
import com.erp.account.modules.quotation.entity.QuotationItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.Context;
import org.mapstruct.AfterMapping;
import org.mapstruct.MappingTarget;
import java.util.UUID;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

/**
 * MapStruct mapper for ProformaInvoice entity ↔ response DTOs.
 * MapStruct generates a Spring-managed implementation at compile time.
 */
@Mapper(
    componentModel = "spring", 
    unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE,
    uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class},
    builder = @org.mapstruct.Builder(disableBuilder = true)
)
public interface ProformaInvoiceMapper {

    // -------------------------------------------------------------------------
    // ProformaInvoice → ProformaInvoiceResponse  (list / summary DTO)
    // -------------------------------------------------------------------------

    /**
     * Lightweight summary mapping used in the paginated list API.
     * All fields match by name; only customerName needs a path expression.
     */
    @Mapping(source = "customer.customerName", target = "customerName")
    ProformaInvoiceResponse toResponse(ProformaInvoice pi);

    // -------------------------------------------------------------------------
    // ProformaInvoice → ProformaInvoiceProfileResponse  (detail / profile DTO)
    // -------------------------------------------------------------------------

    /**
     * Full detail mapping used in GET by ID / GET by number.
     * <ul>
     *   <li>status      — enum converted to its .name() String</li>
     *   <li>customerName / customerCode — from nested customer entity</li>
     *   <li>items       — delegated to {@link #toItemResponse(ProformaInvoiceItem)}</li>
     * </ul>
     */
    @Mapping(source = "status",                target = "status",       qualifiedByName = "statusToString")
    @Mapping(source = "customer.customerName", target = "customerName")
    @Mapping(source = "customer.customerCode", target = "customerCode")
    @Mapping(source = "items",                 target = "items")
    ProformaInvoiceProfileResponse toProfileResponse(ProformaInvoice pi);

    @Mapping(source = "customer.customerName", target = "customerName")
    @Mapping(source = "status",                target = "status")
    @Mapping(source = "quotationCurrency",     target = "currency")
    @Mapping(source = "validUntil",            target = "validTill")
    QuotationSummaryDTO toQuotationSummaryDTO(Quotation quotation);

    // -------------------------------------------------------------------------
    // ProformaInvoiceItem → ProformaInvoiceItemResponse
    // -------------------------------------------------------------------------

    /**
     * Maps a single item entity to its response DTO.
     * hsnSacCode is derived from the nested hsnSacMaster.code path.
     */
    @Mapping(source = "hsnSacMaster.code", target = "hsnSacCode")
    ProformaInvoiceItemResponse toItemResponse(ProformaInvoiceItem item);

    /**
     * Null-safe list mapping — returns an empty list when items is null.
     */
    default List<ProformaInvoiceItemResponse> toItemResponseList(List<ProformaInvoiceItem> items) {
        if (items == null) return Collections.emptyList();
        return items.stream().map(this::toItemResponse).toList();
    }

    // -------------------------------------------------------------------------
    // Conversion helpers
    // -------------------------------------------------------------------------

    /**
     * Converts a {@link ProformaInvoiceStatus} enum value to its name() String.
     * Used by {@link #toProfileResponse(ProformaInvoice)}.
     */
    @Named("statusToString")
    default String statusToString(ProformaInvoiceStatus status) {
        return status != null ? status.name() : null;
    }

    // -------------------------------------------------------------------------
    // PI Creation from Quotation
    // -------------------------------------------------------------------------

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedByUsername", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "deletedBy", ignore = true)
    @Mapping(target = "deletedByUsername", ignore = true)
    @Mapping(target = "createdByUsername", ignore = true)
    @Mapping(target = "bankDetailsSnapshot", ignore = true)
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "company", source = "company")
    @Mapping(target = "piNumber", source = "piNumber")
    @Mapping(target = "status", constant = "DRAFT")
    @Mapping(target = "isDeleted", constant = "false")
    @Mapping(target = "piDate", source = "request.piDate")
    @Mapping(target = "piValidTill", source = "request.piValidTill")
    @Mapping(target = "sourceQuotationId", source = "quotation.id")
    @Mapping(target = "sourceQuotation", source = "quotation")
    @Mapping(target = "sourceQuotationNumber", source = "quotation.quotationNumber")
    @Mapping(target = "customerId", source = "quotation.customerId")
    @Mapping(target = "customer", source = "quotation.customer")
    @Mapping(target = "billingAddressId", source = "quotation.billingAddressId")
    @Mapping(target = "billingAddressSnapshot", expression = "java(buildAddressSnapshot(quotation.getBillingAddressLine1(), quotation.getBillingAddressLine2(), quotation.getBillingCity(), quotation.getBillingState(), quotation.getBillingPostalCode(), quotation.getBillingCountry()))")
    @Mapping(target = "billingStateCode", source = "quotation.billingStateCode")
    @Mapping(target = "deliveryAddressId", source = "quotation.deliveryAddressId")
    @Mapping(target = "deliveryAddressSnapshot", expression = "java(buildAddressSnapshot(quotation.getDeliveryAddressLine1(), quotation.getDeliveryAddressLine2(), quotation.getDeliveryCity(), quotation.getDeliveryState(), quotation.getDeliveryPostalCode(), quotation.getDeliveryCountry()))")
    @Mapping(target = "advanceRequired", source = "request.advanceRequired", defaultValue = "false")
    @Mapping(target = "advanceAmount", source = "request.advanceAmount", defaultValue = "0")
    @Mapping(target = "bankAccountId", source = "request.bankAccountId")
    @Mapping(target = "referenceNumber", source = "quotation.referenceNumber")
    @Mapping(target = "currency", source = "quotation.quotationCurrency", defaultValue = "INR")
    @Mapping(target = "exchangeRate", source = "quotation.exchangeRate", defaultValue = "1")
    @Mapping(target = "placeOfSupplyStateId", source = "quotation.placeOfSupplyStateId")
    @Mapping(target = "placeOfSupplyStateCode", source = "quotation.placeOfSupplyStateCode")
    @Mapping(target = "subtotal", source = "quotation.subtotal", defaultValue = "0")
    @Mapping(target = "discountAmount", source = "quotation.discountAmount", defaultValue = "0")
    @Mapping(target = "taxAmount", source = "quotation.taxAmount", defaultValue = "0")
    @Mapping(target = "freightCharges", source = "quotation.freightCharges", defaultValue = "0")
    @Mapping(target = "otherCharges", source = "quotation.otherCharges", defaultValue = "0")
    @Mapping(target = "totalBeforeRoundOff", source = "quotation.totalBeforeRoundOff", defaultValue = "0")
    @Mapping(target = "roundOff", source = "quotation.roundOff", defaultValue = "0")
    @Mapping(target = "totalAmount", source = "quotation.totalAmount", defaultValue = "0")
    @Mapping(target = "paymentTerms", source = "quotation.paymentTerms")
    @Mapping(target = "deliveryTerms", source = "quotation.deliveryTerms")
    @Mapping(target = "notes", expression = "java(request != null && request.getPaymentCondition() != null ? request.getPaymentCondition() : quotation.getNotes())")
    @Mapping(target = "createdBy", source = "currentUserId")
    @Mapping(target = "items", expression = "java(mapItems(quotation, company, currentUserId))")
    ProformaInvoice toProformaInvoiceEntity(Quotation quotation, PIConversionRequest request, String piNumber, Company company, UUID currentUserId);

    default List<ProformaInvoiceItem> mapItems(Quotation quotation, Company company, UUID currentUserId) {
        if (quotation == null || quotation.getQuotationItems() == null || quotation.getQuotationItems().isEmpty()) {
            return Collections.emptyList();
        }
        return quotation.getQuotationItems().stream()
                .map(qItem -> toProformaInvoiceItemEntity(qItem, company, currentUserId))
                .toList();
    }

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedByUsername", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "deletedBy", ignore = true)
    @Mapping(target = "deletedByUsername", ignore = true)
    @Mapping(target = "createdByUsername", ignore = true)
    @Mapping(target = "proformaInvoice", ignore = true)
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "company", source = "company")
    @Mapping(target = "sourceQuotationItemId", source = "qItem.id")
    @Mapping(target = "sourceQuotationItem", source = "qItem")
    @Mapping(target = "isDeleted", constant = "false")
    @Mapping(target = "discountAmount", source = "qItem.discountAmount", defaultValue = "0")
    @Mapping(target = "taxableAmount", source = "qItem.taxableAmount", defaultValue = "0")
    @Mapping(target = "taxAmount", source = "qItem.taxAmount", defaultValue = "0")
    @Mapping(target = "totalAmount", source = "qItem.totalAmount", defaultValue = "0")
    @Mapping(target = "convertedQuantity", constant = "0")
    @Mapping(target = "remainingQuantity", source = "qItem.quantity", defaultValue = "0")
    @Mapping(target = "createdBy", source = "currentUserId")
    ProformaInvoiceItem toProformaInvoiceItemEntity(QuotationItem qItem, Company company, UUID currentUserId);

    @AfterMapping
    default void linkItems(@MappingTarget ProformaInvoice pi) {
        if (pi.getItems() != null) {
            for (ProformaInvoiceItem item : pi.getItems()) {
                item.setProformaInvoice(pi);
            }
        }
    }

    default String buildAddressSnapshot(String line1, String line2, String city, String state, String zip, String country) {
        StringBuilder sb = new StringBuilder();
        if (line1 != null && !line1.trim().isEmpty()) sb.append(line1.trim()).append(", ");
        if (line2 != null && !line2.trim().isEmpty()) sb.append(line2.trim()).append(", ");
        if (city != null && !city.trim().isEmpty()) sb.append(city.trim()).append(", ");
        if (state != null && !state.trim().isEmpty()) sb.append(state.trim()).append(" ");
        if (zip != null && !zip.trim().isEmpty()) sb.append(zip.trim()).append(", ");
        if (country != null && !country.trim().isEmpty()) sb.append(country.trim());

        String result = sb.toString().trim();
        if (result.endsWith(",")) {
            result = result.substring(0, result.length() - 1).trim();
        }
        return result.isEmpty() ? null : result;
    }
}
