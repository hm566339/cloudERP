package com.erp.account.modules.paymentvoucher.mapper;

import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherAllocationRequest;
import com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherAllocationResponse;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface PaymentVoucherAllocationMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paymentVoucher", ignore = true)
    @Mapping(target = "apInvoice", ignore = true)
    @Mapping(target = "purchaseOrder", ignore = true)
    PaymentVoucherAllocation toEntity(PaymentVoucherAllocationRequest request);

    @Mapping(source = "apInvoice.id", target = "apInvoiceId")
    @Mapping(source = "apInvoice.invoiceNo", target = "invoiceNo")
    @Mapping(source = "purchaseOrder.id", target = "purchaseOrderId")
    @Mapping(source = "purchaseOrder.poNumber", target = "poNumber")
    PaymentVoucherAllocationResponse toResponse(PaymentVoucherAllocation allocation);
}
