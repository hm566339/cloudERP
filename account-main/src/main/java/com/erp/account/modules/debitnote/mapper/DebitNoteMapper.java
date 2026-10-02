package com.erp.account.modules.debitnote.mapper;

import com.erp.account.modules.debitnote.dto.response.DebitNoteResponse;
import com.erp.account.modules.debitnote.entity.DebitNote;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface DebitNoteMapper {
    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "apInvoice.id", target = "apInvoiceId")
    @Mapping(source = "apInvoice.invoiceNo", target = "invoiceNo")
    @Mapping(source = "apInvoice.vendor.id", target = "vendorId")
    @Mapping(source = "apInvoice.vendor.vendorName", target = "vendorName")
    DebitNoteResponse toResponse(DebitNote debitNote);
}
