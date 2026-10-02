package com.erp.account.modules.creditnote.mapper;

import com.erp.account.modules.creditnote.dto.request.CreditNoteRequest;
import com.erp.account.modules.creditnote.dto.response.CreditNoteResponse;
import com.erp.account.modules.creditnote.entity.CreditNote;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class}, builder = @org.mapstruct.Builder(disableBuilder = true))
public interface CreditNoteMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "salesInvoice", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "glPostingStatus", ignore = true)
    @Mapping(target = "glJournalEntryId", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedDate", ignore = true)
    @Mapping(target = "postedBy", ignore = true)
    @Mapping(target = "postingTime", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    CreditNote toEntity(CreditNoteRequest request);

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "salesInvoice.id", target = "salesInvoiceId")
    @Mapping(source = "salesInvoice.invoiceNumber", target = "invoiceNo")
    @Mapping(source = "salesInvoice.customer.id", target = "customerId")
    @Mapping(source = "salesInvoice.customer.customerName", target = "customerName")
    @Mapping(source = "receivableAccountId", target = "receivableAccountId")
    @Mapping(source = "revenueAdjustmentAccountId", target = "revenueAdjustmentAccountId")
    @Mapping(source = "glPostingStatus", target = "postingStatus")
    CreditNoteResponse toResponse(CreditNote creditNote);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "salesInvoice", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "glPostingStatus", ignore = true)
    @Mapping(target = "glJournalEntryId", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedDate", ignore = true)
    @Mapping(target = "postedBy", ignore = true)
    @Mapping(target = "postingTime", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    void updateEntity(CreditNoteRequest request, @MappingTarget CreditNote entity);
}
