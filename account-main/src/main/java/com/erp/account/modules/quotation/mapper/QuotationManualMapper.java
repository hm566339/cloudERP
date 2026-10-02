package com.erp.account.modules.quotation.mapper;

import com.erp.account.modules.quotation.dto.QuotationItemRequestDTO;
import com.erp.account.modules.quotation.dto.QuotationItemResponseDTO;
import com.erp.account.modules.quotation.dto.QuotationRequestDTO;
import com.erp.account.modules.quotation.dto.QuotationResponseDTO;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class QuotationManualMapper {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.erp.account.common.service.WarehouseLookupService warehouseLookupService;

    public void setWarehouseLookupService(com.erp.account.common.service.WarehouseLookupService warehouseLookupService) {
        this.warehouseLookupService = warehouseLookupService;
    }

    public Quotation toEntity(QuotationRequestDTO dto) {
        if (dto == null) {
            return null;
        }

        Quotation quotation = Quotation.builder()
                .companyId(dto.getCompanyId())
                .customerId(dto.getCustomerId())
                .quotationDate(dto.getQuotationDate())
                .validUntil(dto.getValidUntil())
                .referenceNumber(dto.getReferenceNumber())
                .quotationCurrency(dto.getQuotationCurrency())
                .deliveryAddressId(dto.getDeliveryAddressId())
                .deliveryAddressLine1(dto.getDeliveryAddressLine1())
                .deliveryAddressLine2(dto.getDeliveryAddressLine2())
                .deliveryCity(dto.getDeliveryCity())
                .deliveryState(dto.getDeliveryState())
                .deliveryPostalCode(dto.getDeliveryPostalCode())
                .deliveryCountry(dto.getDeliveryCountry())
                .billingAddressId(dto.getBillingAddressId())
                .billingAddressLine1(dto.getBillingAddressLine1())
                .billingAddressLine2(dto.getBillingAddressLine2())
                .billingCity(dto.getBillingCity())
                .billingState(dto.getBillingState())
                .billingPostalCode(dto.getBillingPostalCode())
                .billingCountry(dto.getBillingCountry())
                .billingStateCode(dto.getBillingStateCode())
                .paymentTermId(dto.getPaymentTermId())
                .paymentTerms(dto.getPaymentTerms())
                .deliveryTermId(dto.getDeliveryTermId())
                .deliveryTerms(dto.getDeliveryTerms())
                .warrantyTermId(dto.getWarrantyTermId())
                .warrantyTerms(dto.getWarrantyTerms())
                .termsConditionId(dto.getTermsConditionId())
                .termsAndConditions(dto.getTermsAndConditions())
                .notes(dto.getNotes())
                .salesManagerId(dto.getSalesManagerId())
                .build();

        if (dto.getQuotationItems() != null) {
            List<QuotationItem> items = dto.getQuotationItems().stream()
                    .map(itemDto -> toItemEntity(itemDto, quotation))
                    .collect(Collectors.toList());
            items.forEach(quotation::addQuotationItem);
        }

        return quotation;
    }

    public QuotationItem toItemEntity(QuotationItemRequestDTO dto, Quotation quotation) {
        if (dto == null) {
            return null;
        }

        return QuotationItem.builder()
                .quotation(quotation)
                .companyId(quotation.getCompanyId()) // Inherit company
                .itemId(dto.getItemId())
                .itemName(dto.getItemName())
                .description(dto.getDescription())
                .quantity(dto.getQuantity())
                .unit(dto.getUnit())
                .unitPrice(dto.getUnitPrice())
                .discountPercent(dto.getDiscountPercent())
                .cgstRate(dto.getCgstRate())
                .sgstRate(dto.getSgstRate())
                .igstRate(dto.getIgstRate())
                .cessRate(dto.getCessRate())
                .notes(dto.getNotes())
                .build();
    }

    public QuotationResponseDTO toResponseDto(Quotation entity) {
        if (entity == null) {
            return null;
        }

        List<QuotationItemResponseDTO> items = null;
        if (entity.getQuotationItems() != null) {
            items = entity.getQuotationItems().stream()
                    .map(this::toItemResponseDto)
                    .collect(Collectors.toList());
        }

        return QuotationResponseDTO.builder()
                .id(entity.getId())
                .version(entity.getVersion())
                .companyId(entity.getCompanyId())
                .customerId(entity.getCustomerId())
                .quotationNumber(entity.getQuotationNumber())
                .quotationDate(entity.getQuotationDate())
                .validUntil(entity.getValidUntil())
                .referenceNumber(entity.getReferenceNumber())
                .quotationCurrency(entity.getQuotationCurrency())
                .exchangeRate(entity.getExchangeRate())
                .subtotal(entity.getSubtotal())
                .discountAmount(entity.getDiscountAmount())
                .freightCharges(entity.getFreightCharges())
                .otherCharges(entity.getOtherCharges())
                .totalBeforeRoundOff(entity.getTotalBeforeRoundOff())
                .taxAmount(entity.getTaxAmount())
                .roundOff(entity.getRoundOff())
                .totalAmount(entity.getTotalAmount())
                .placeOfSupplyStateId(entity.getPlaceOfSupplyStateId())
                .placeOfSupplyStateCode(entity.getPlaceOfSupplyStateCode())
                .deliveryAddressId(entity.getDeliveryAddressId())
                .deliveryAddressLine1(entity.getDeliveryAddressLine1())
                .deliveryAddressLine2(entity.getDeliveryAddressLine2())
                .deliveryCity(entity.getDeliveryCity())
                .deliveryState(entity.getDeliveryState())
                .deliveryPostalCode(entity.getDeliveryPostalCode())
                .deliveryCountry(entity.getDeliveryCountry())
                .billingAddressId(entity.getBillingAddressId())
                .billingAddressLine1(entity.getBillingAddressLine1())
                .billingAddressLine2(entity.getBillingAddressLine2())
                .billingCity(entity.getBillingCity())
                .billingState(entity.getBillingState())
                .billingPostalCode(entity.getBillingPostalCode())
                .billingCountry(entity.getBillingCountry())
                .billingStateCode(entity.getBillingStateCode())
                .paymentTermId(entity.getPaymentTermId())
                .paymentTerms(entity.getPaymentTerms())
                .deliveryTermId(entity.getDeliveryTermId())
                .deliveryTerms(entity.getDeliveryTerms())
                .warrantyTermId(entity.getWarrantyTermId())
                .warrantyTerms(entity.getWarrantyTerms())
                .termsConditionId(entity.getTermsConditionId())
                .termsAndConditions(entity.getTermsAndConditions())
                .notes(entity.getNotes())
                .salesManagerId(entity.getSalesManagerId())
                .status(entity.getStatus())
                .approvedBy(entity.getApprovedBy())
                .approvedAt(entity.getApprovedAt())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedAt(entity.getUpdatedAt())
                .quotationItems(items)
                .build();
    }

    public QuotationItemResponseDTO toItemResponseDto(QuotationItem entity) {
        if (entity == null) {
            return null;
        }

        return QuotationItemResponseDTO.builder()
                .id(entity.getId())
                .companyId(entity.getCompanyId())
                .itemId(entity.getItemId())
                .itemName(entity.getItemName())
                .description(entity.getDescription())
                .quantity(entity.getQuantity())
                .unit(entity.getUnit())
                .unitPrice(entity.getUnitPrice())
                .discountPercent(entity.getDiscountPercent())
                .discountAmount(entity.getDiscountAmount())
                .taxableAmount(entity.getTaxableAmount())
                .cgstRate(entity.getCgstRate())
                .cgstAmount(entity.getCgstAmount())
                .sgstRate(entity.getSgstRate())
                .sgstAmount(entity.getSgstAmount())
                .igstRate(entity.getIgstRate())
                .igstAmount(entity.getIgstAmount())
                .cessRate(entity.getCessRate())
                .cessAmount(entity.getCessAmount())
                .taxAmount(entity.getTaxAmount())
                .notes(entity.getNotes())
                .build();
    }
}
