package com.erp.account.modules.receiptvoucher.mapper;

import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherRequest;
import com.erp.account.modules.receiptvoucher.dto.response.ReceiptVoucherResponse;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import java.util.List;
import org.mapstruct.*;


@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface ReceiptVoucherMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "bankAccount", ignore = true)
    @Mapping(target = "receivableAccount", ignore = true)
    @Mapping(target = "receiptAccount", ignore = true)
    @Mapping(target = "receiptStatus", ignore = true)
    @Mapping(target = "glPostingStatus", ignore = true)
    @Mapping(target = "glJournalEntryId", ignore = true)
    @Mapping(target = "glPostingTime", ignore = true)
    @Mapping(target = "postedBy", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedDate", ignore = true)
    @Mapping(target = "totalAllocatedAmount", ignore = true)
    @Mapping(target = "allocations", ignore = true)
    ReceiptVoucher requestToEntity(ReceiptVoucherRequest req);

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "customer.customerName", target = "customerName")
    @Mapping(source = "bankAccount.id", target = "bankAccountId")
    @Mapping(source = "bankAccount.bankName", target = "bankName")
    @Mapping(source = "bankAccount.accountNumber", target = "bankAccount")
    @Mapping(source = "receivableAccount.id", target = "receivableAccountId")
    @Mapping(source = "receivableAccount.accountCode", target = "receivableAccountCode")
    @Mapping(source = "receivableAccount.accountName", target = "receivableAccountName")
    @Mapping(source = "receiptAccount.id", target = "receiptAccountId")
    @Mapping(source = "receiptAccount.accountCode", target = "receiptAccountCode")
    @Mapping(source = "receiptAccount.accountName", target = "receiptAccountName")
    @Mapping(target = "remainingBalance", ignore = true)
    @Mapping(target = "journalNumber", ignore = true)
    @Mapping(target = "allocations", ignore = true)
    ReceiptVoucherResponse entityToResponse(ReceiptVoucher entity);

    List<ReceiptVoucherResponse> entityListToResponseList(List<ReceiptVoucher> list);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "bankAccount", ignore = true)
    @Mapping(target = "receivableAccount", ignore = true)
    @Mapping(target = "receiptAccount", ignore = true)
    @Mapping(target = "receiptStatus", ignore = true)
    @Mapping(target = "glPostingStatus", ignore = true)
    @Mapping(target = "glJournalEntryId", ignore = true)
    @Mapping(target = "glPostingTime", ignore = true)
    @Mapping(target = "postedBy", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedDate", ignore = true)
    @Mapping(target = "totalAllocatedAmount", ignore = true)
    @Mapping(target = "allocations", ignore = true)
    void updateEntityFromRequest(ReceiptVoucherRequest req, @MappingTarget ReceiptVoucher entity);
}

