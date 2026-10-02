package com.erp.account.modules.quotation.mapper;

import org.mapstruct.*;
import com.erp.account.modules.quotation.dto.request.QuotationItemRequest;
import com.erp.account.modules.quotation.dto.response.QuotationItemResponse;
import com.erp.account.modules.quotation.entity.QuotationItem;
import com.erp.account.modules.hsnsacmaster.mapper.HsnSacMasterMapper;

@Mapper(componentModel = "spring", uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class, HsnSacMasterMapper.class})
public interface QuotationItemMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "companyId", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "quotation", ignore = true)
    @Mapping(target = "hsnSacMaster", ignore = true)
    @Mapping(target = "discountAmount", ignore = true)
    @Mapping(target = "taxableAmount", ignore = true)
    @Mapping(target = "cgstRate", ignore = true)
    @Mapping(target = "cgstAmount", ignore = true)
    @Mapping(target = "sgstRate", ignore = true)
    @Mapping(target = "sgstAmount", ignore = true)
    @Mapping(target = "igstRate", ignore = true)
    @Mapping(target = "igstAmount", ignore = true)
    @Mapping(target = "cessRate", ignore = true)
    @Mapping(target = "cessAmount", ignore = true)
    @Mapping(target = "taxAmount", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    QuotationItem toEntity(QuotationItemRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "companyId", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "quotation", ignore = true)
    @Mapping(target = "hsnSacMaster", ignore = true)
    @Mapping(target = "discountAmount", ignore = true)
    @Mapping(target = "taxableAmount", ignore = true)
    @Mapping(target = "cgstRate", ignore = true)
    @Mapping(target = "cgstAmount", ignore = true)
    @Mapping(target = "sgstRate", ignore = true)
    @Mapping(target = "sgstAmount", ignore = true)
    @Mapping(target = "igstRate", ignore = true)
    @Mapping(target = "igstAmount", ignore = true)
    @Mapping(target = "cessRate", ignore = true)
    @Mapping(target = "cessAmount", ignore = true)
    @Mapping(target = "taxAmount", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    void updateEntity(@MappingTarget QuotationItem entity, QuotationItemRequest request);

    @Mapping(target = "quotationId", source = "quotation.id")
    QuotationItemResponse toResponse(QuotationItem entity);
}
