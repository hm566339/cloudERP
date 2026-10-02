package com.erp.account.modules.paymentvoucher.mapper;

import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherRequest;
import com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring", uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class, PaymentVoucherAllocationMapper.class})
public interface PaymentVoucherMapper {
    PaymentVoucherMapper INSTANCE = Mappers.getMapper(PaymentVoucherMapper.class);

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "vendor.id", target = "vendorId")
    @Mapping(source = "vendor.vendorName", target = "vendorName")
    @Mapping(source = "bankAccount.id", target = "bankAccountId")
    @Mapping(source = "bankAccount.bankName", target = "bankName")
    @Mapping(source = "bankAccount.bankName", target = "bankAccountName")
    @Mapping(source = "bankAccount.accountNumber", target = "bankAccountNumber")
    @Mapping(source = "payableAccount.id", target = "payableAccountId")
    @Mapping(source = "payableAccount.accountCode", target = "payableAccountCode")
    @Mapping(source = "payableAccount.accountName", target = "payableAccountName")
    @Mapping(source = "paymentAccount.id", target = "paymentAccountId")
    @Mapping(source = "paymentAccount.accountCode", target = "paymentAccountCode")
    @Mapping(source = "paymentAccount.accountName", target = "paymentAccountName")
    @Mapping(source = "purchaseOrder.id", target = "purchaseOrderId")
    @Mapping(source = "purchaseOrder.poNumber", target = "purchaseOrderNumber")
    @Mapping(target = "remainingBalance", ignore = true)
    @Mapping(target = "journalNumber", ignore = true)
    PaymentVoucherResponse toResponse(PaymentVoucher voucher);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "vendor", ignore = true)
    @Mapping(target = "bankAccount", ignore = true)
    @Mapping(target = "payableAccount", ignore = true)
    @Mapping(target = "paymentAccount", ignore = true)
    @Mapping(target = "purchaseOrder", ignore = true)
    @Mapping(target = "allocations", ignore = true)
    PaymentVoucher toEntity(PaymentVoucherRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "vendor", ignore = true)
    @Mapping(target = "bankAccount", ignore = true)
    @Mapping(target = "payableAccount", ignore = true)
    @Mapping(target = "paymentAccount", ignore = true)
    @Mapping(target = "purchaseOrder", ignore = true)
    @Mapping(target = "allocations", ignore = true)
    @Mapping(target = "paymentStatus", ignore = true)
    @Mapping(target = "glPostingStatus", ignore = true)
    @Mapping(target = "glJournalEntryId", ignore = true)
    @Mapping(target = "glPostingTime", ignore = true)
    @Mapping(target = "postedBy", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedDate", ignore = true)
    void updateEntity(PaymentVoucherRequest request, @MappingTarget PaymentVoucher voucher);
}
