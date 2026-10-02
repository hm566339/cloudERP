package com.erp.account.modules.quotation.mapper;

import org.mapstruct.*;
import com.erp.account.modules.quotation.dto.request.QuotationCreateRequest;
import com.erp.account.modules.quotation.dto.request.QuotationUpdateRequest;
import com.erp.account.modules.quotation.dto.response.QuotationResponse;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.company.mapper.CompanyMapper;
import com.erp.account.modules.customer.mapper.CustomerMapper;

@Mapper(componentModel = "spring", uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class, QuotationItemMapper.class, CompanyMapper.class, CustomerMapper.class})
public interface QuotationMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "companyId", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "subtotal", ignore = true)
    @Mapping(target = "discountAmount", ignore = true)
    @Mapping(target = "totalBeforeRoundOff", ignore = true)
    @Mapping(target = "taxAmount", ignore = true)
    @Mapping(target = "roundOff", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedAt", ignore = true)
    @Mapping(target = "salesManagerId", ignore = true)
    @Mapping(target = "quotationItems", ignore = true)
    @Mapping(target = "placeOfSupplyStateCode", ignore = true)
    @Mapping(target = "deliveryAddressId", ignore = true)
    @Mapping(target = "deliveryAddressLine1", ignore = true)
    @Mapping(target = "deliveryAddressLine2", ignore = true)
    @Mapping(target = "deliveryCity", ignore = true)
    @Mapping(target = "deliveryState", ignore = true)
    @Mapping(target = "deliveryPostalCode", ignore = true)
    @Mapping(target = "deliveryCountry", ignore = true)
    @Mapping(target = "billingAddressId", ignore = true)
    @Mapping(target = "billingAddressLine1", ignore = true)
    @Mapping(target = "billingAddressLine2", ignore = true)
    @Mapping(target = "billingCity", ignore = true)
    @Mapping(target = "billingState", ignore = true)
    @Mapping(target = "billingPostalCode", ignore = true)
    @Mapping(target = "billingCountry", ignore = true)
    @Mapping(target = "billingStateCode", ignore = true)
    Quotation toEntity(QuotationCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "companyId", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "subtotal", ignore = true)
    @Mapping(target = "discountAmount", ignore = true)
    @Mapping(target = "totalBeforeRoundOff", ignore = true)
    @Mapping(target = "taxAmount", ignore = true)
    @Mapping(target = "roundOff", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedAt", ignore = true)
    @Mapping(target = "salesManagerId", ignore = true)
    @Mapping(target = "quotationItems", ignore = true)
    @Mapping(target = "placeOfSupplyStateCode", ignore = true)
    @Mapping(target = "deliveryAddressLine1", ignore = true)
    @Mapping(target = "deliveryAddressLine2", ignore = true)
    @Mapping(target = "deliveryCity", ignore = true)
    @Mapping(target = "deliveryState", ignore = true)
    @Mapping(target = "deliveryPostalCode", ignore = true)
    @Mapping(target = "deliveryCountry", ignore = true)
    @Mapping(target = "billingAddressId", ignore = true)
    @Mapping(target = "billingAddressLine1", ignore = true)
    @Mapping(target = "billingAddressLine2", ignore = true)
    @Mapping(target = "billingCity", ignore = true)
    @Mapping(target = "billingState", ignore = true)
    @Mapping(target = "billingPostalCode", ignore = true)
    @Mapping(target = "billingCountry", ignore = true)
    @Mapping(target = "billingStateCode", ignore = true)
    void updateEntity(@MappingTarget Quotation entity, QuotationUpdateRequest request);

    @Mapping(target = "company", source = "company")
    @Mapping(target = "customer", source = "customer")
    @Mapping(target = "items", source = "quotationItems")
    QuotationResponse toResponse(Quotation entity);
}
