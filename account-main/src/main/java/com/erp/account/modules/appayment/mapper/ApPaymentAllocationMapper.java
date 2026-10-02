package com.erp.account.modules.appayment.mapper;

import com.erp.account.modules.appayment.entity.ApPaymentAllocation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

import com.erp.account.modules.appayment.dto.ApPaymentAllocationRequest;
import com.erp.account.modules.appayment.dto.ApPaymentAllocationResponse;
import com.erp.account.modules.appayment.entity.ApPayment;


@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface ApPaymentAllocationMapper {

    ApPaymentAllocation requestToEntity(ApPaymentAllocationRequest request);

    @Mapping(source = "apInvoice.id", target = "apInvoiceId")
    @Mapping(source = "apInvoice.invoiceNo", target = "invoiceNo")
    @Mapping(source = "apInvoice.totalAmount", target = "invoiceTotalAmount")
    @Mapping(source = "apInvoice.outstandingAmount", target = "invoiceOutstandingAmount")
    @Mapping(source = "apInvoice.status", target = "invoiceStatus")
    ApPaymentAllocationResponse entityToResponse(ApPaymentAllocation allocation);

    List<ApPaymentAllocationResponse> entityListToResponseList(List<ApPaymentAllocation> allocations);
}
