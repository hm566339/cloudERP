package com.erp.account.modules.appayment.mapper;

import com.erp.account.modules.appayment.dto.ApPaymentAllocationResponse;
import com.erp.account.modules.appayment.dto.ApPaymentRequest;
import com.erp.account.modules.appayment.dto.ApPaymentResponse;
import com.erp.account.modules.appayment.entity.ApPayment;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.MappingTarget;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Mapper(componentModel = "spring", uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class, ApPaymentAllocationMapper.class}, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ApPaymentMapper {

    @Mapping(source = "vendor.id", target = "vendorId")
    @Mapping(source = "vendor.vendorName", target = "vendorName")
    @Mapping(source = "vendor.vendorCode", target = "vendorCode")
    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "company.companyName", target = "companyName")
    @Mapping(source = "bankAccount.id", target = "bankAccountId")
    @Mapping(source = "bankAccount.bankName", target = "bankName")
    @Mapping(source = "bankAccount.accountNumber", target = "bankAccountNumber")
    @Mapping(source = "allocations", target = "allocations")
    ApPaymentResponse entityToResponse(ApPayment payment);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "vendor", ignore = true)
    @Mapping(target = "bankAccount", ignore = true)
    @Mapping(target = "allocations", ignore = true)
    ApPayment requestToEntity(ApPaymentRequest request);

    void updateEntityFromRequest(ApPaymentRequest request, @MappingTarget ApPayment payment);

    default ApPaymentResponse voucherToResponse(PaymentVoucher voucher) {
        if (voucher == null) {
            return null;
        }

        ApPaymentResponse response = new ApPaymentResponse();
        response.setId(voucher.getId());
        response.setPaymentVoucherId(voucher.getId());
        response.setVoucherNo(voucher.getVoucherNo());
        response.setPaymentNo(voucher.getVoucherNo());
        response.setVoucherDate(voucher.getVoucherDate());
        response.setPaymentDate(voucher.getVoucherDate());

        if (voucher.getCompany() != null) {
            response.setCompanyId(voucher.getCompany().getId());
            response.setCompanyName(voucher.getCompany().getCompanyName());
        }

        if (voucher.getVendor() != null) {
            response.setVendorId(voucher.getVendor().getId());
            response.setVendorName(voucher.getVendor().getVendorName());
            response.setVendorCode(voucher.getVendor().getVendorCode());
        }

        if (voucher.getBankAccount() != null) {
            response.setBankAccountId(voucher.getBankAccount().getId());
            response.setBankName(voucher.getBankAccount().getBankName());
            response.setBankAccountNumber(voucher.getBankAccount().getAccountNumber());
        }

        if (voucher.getPayableAccount() != null) {
            response.setPayableAccountId(voucher.getPayableAccount().getId());
        }

        if (voucher.getPaymentAccount() != null) {
            response.setPaymentAccountId(voucher.getPaymentAccount().getId());
        }

        response.setPaymentAmount(voucher.getPaymentAmount());
        response.setPaymentMode(voucher.getPaymentMode());
        response.setPaymentStatus(voucher.getPaymentStatus());
        if (voucher.getGlPostingStatus() != null) {
            response.setGlPostingStatus(voucher.getGlPostingStatus().name());
        }
        response.setGlJournalEntryId(voucher.getGlJournalEntryId());
        response.setGlPostingTime(voucher.getGlPostingTime());
        response.setReferenceNo(voucher.getReferenceNo());
        response.setRemarks(voucher.getRemarks());
        response.setChequeNumber(voucher.getChequeNumber());
        response.setChequeDate(voucher.getChequeDate());
        response.setTotalAllocatedAmount(voucher.getTotalAllocatedAmount());
        response.setCreatedBy(voucher.getCreatedBy());
        response.setCreatedAt(voucher.getCreatedAt());
        response.setUpdatedBy(voucher.getUpdatedBy());
        response.setUpdatedAt(voucher.getUpdatedAt());

        UUID poId = voucher.getPurchaseOrderId();
        String poNumber = voucher.getPurchaseOrder() != null ? voucher.getPurchaseOrder().getPoNumber() : null;
        UUID firstApInvoiceId = null;
        String firstInvoiceNo = null;

        List<ApPaymentAllocationResponse> allocationResponses = new ArrayList<>();
        if (voucher.getAllocations() != null) {
            for (PaymentVoucherAllocation alloc : voucher.getAllocations()) {
                ApPaymentAllocationResponse allocResp = new ApPaymentAllocationResponse();
                allocResp.setId(alloc.getId());
                allocResp.setAllocatedAmount(alloc.getAllocatedAmount());

                if (alloc.getApInvoice() != null) {
                    allocResp.setApInvoiceId(alloc.getApInvoice().getId());
                    allocResp.setInvoiceNo(alloc.getApInvoice().getInvoiceNo());
                    allocResp.setInvoiceTotalAmount(alloc.getApInvoice().getTotalAmount());
                    allocResp.setInvoiceOutstandingAmount(alloc.getApInvoice().getOutstandingAmount());
                    if (alloc.getApInvoice().getStatus() != null) {
                        allocResp.setInvoiceStatus(alloc.getApInvoice().getStatus().name());
                    }
                    if (firstApInvoiceId == null) {
                        firstApInvoiceId = alloc.getApInvoice().getId();
                        firstInvoiceNo = alloc.getApInvoice().getInvoiceNo();
                    }
                }

                if (alloc.getPurchaseOrder() != null) {
                    allocResp.setPurchaseOrderId(alloc.getPurchaseOrder().getId());
                    allocResp.setPurchaseOrderNumber(alloc.getPurchaseOrder().getPoNumber());
                    allocResp.setPoNumber(alloc.getPurchaseOrder().getPoNumber());
                    if (poId == null) {
                        poId = alloc.getPurchaseOrder().getId();
                    }
                    if (poNumber == null) {
                        poNumber = alloc.getPurchaseOrder().getPoNumber();
                    }
                }

                allocationResponses.add(allocResp);
            }
        }

        response.setAllocations(allocationResponses);
        response.setApInvoiceId(firstApInvoiceId);
        response.setInvoiceNo(firstInvoiceNo);
        response.setPurchaseOrderId(poId);
        response.setPurchaseOrderNumber(poNumber);

        return response;
    }
}
