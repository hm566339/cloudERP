package com.erp.account.modules.invoicetax.mapper;

import com.erp.account.modules.invoicetax.dto.InvoiceTaxRequest;
import com.erp.account.modules.invoicetax.dto.InvoiceTaxResponse;
import com.erp.account.modules.invoicetax.entity.InvoiceTax;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface InvoiceTaxMapper {

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "salesInvoice.id", target = "salesInvoiceId")
    @Mapping(source = "salesInvoice.invoiceNumber", target = "salesInvoiceNumber")
    @Mapping(source = "gstSlab.id", target = "gstSlabId")
    @Mapping(source = "gstSlab.slabName", target = "gstSlabName")
    InvoiceTaxResponse entityToResponse(InvoiceTax entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "salesInvoice", ignore = true)
    @Mapping(target = "gstSlab", ignore = true)
    InvoiceTax requestToEntity(InvoiceTaxRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "salesInvoice", ignore = true)
    @Mapping(target = "gstSlab", ignore = true)
    void updateEntityFromRequest(InvoiceTaxRequest request, @MappingTarget InvoiceTax entity);

    List<InvoiceTaxResponse> entityListToResponseList(List<InvoiceTax> entities);
}
