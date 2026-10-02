package com.erp.account.modules.appayment.service;

import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.appayment.dto.ApPaymentAllocationRequest;
import com.erp.account.modules.appayment.entity.ApPayment;
import com.erp.account.modules.appayment.entity.ApPaymentAllocation;
import com.erp.account.modules.appayment.mapper.ApPaymentAllocationMapper;
import com.erp.account.modules.vendor.entity.Vendor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentAllocationService {

    private final ApInvoiceRepository apInvoiceRepository;
    private final ApPaymentAllocationMapper apPaymentAllocationMapper;
    private final PaymentValidationService paymentValidationService;

    public List<ApPaymentAllocation> buildAllocations(ApPayment payment,
            List<ApPaymentAllocationRequest> requests, Vendor vendor, UUID companyId) {
        List<ApPaymentAllocation> allocations = new ArrayList<>();
        for (ApPaymentAllocationRequest request : requests) {
            ApInvoice invoice = paymentValidationService.validateInvoiceAllocation(
                request.getApInvoiceId(), vendor, companyId, request.getAllocatedAmount());
            ApPaymentAllocation allocation = apPaymentAllocationMapper.requestToEntity(request);
            allocation.setApPayment(payment);
            allocation.setApInvoice(invoice);
            allocations.add(allocation);
        }
        return allocations;
    }

    public BigDecimal sumAllocatedAmount(List<ApPaymentAllocationRequest> allocations) {
        return allocations.stream()
            .map(ApPaymentAllocationRequest::getAllocatedAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void applyPaymentToInvoices(ApPayment payment) {
        Map<UUID, BigDecimal> amountsByInvoice = new LinkedHashMap<>();
        for (ApPaymentAllocation allocation : payment.getAllocations()) {
            amountsByInvoice.merge(allocation.getApInvoice().getId(), allocation.getAllocatedAmount(), BigDecimal::add);
        }
        UUID companyId = payment.getCompany().getId();
        for (Map.Entry<UUID, BigDecimal> entry : amountsByInvoice.entrySet()) {
            ApInvoice invoice = apInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalseForUpdate(entry.getKey(), companyId)
                    .orElseThrow(() -> new IllegalStateException("Invoice not found while posting payment: " + entry.getKey()));
            BigDecimal allocationAmount = entry.getValue();
            BigDecimal outstandingBefore = amountOrZero(invoice.getOutstandingAmount());
            if (allocationAmount.compareTo(outstandingBefore) > 0) {
                throw new PaymentValidationException("Allocation exceeds current outstanding balance for invoice: " + invoice.getInvoiceNo());
            }
            BigDecimal paidAmount = amountOrZero(invoice.getPaidAmount()).add(allocationAmount);
            BigDecimal outstanding = amountOrZero(invoice.getTotalAmount()).subtract(paidAmount);

            invoice.setPaidAmount(paidAmount);
            invoice.setOutstandingAmount(outstanding.max(BigDecimal.ZERO));
            invoice.setStatus(resolveInvoiceStatus(invoice));
            apInvoiceRepository.save(invoice);
            log.info("Applied AP payment {} to invoice {} amount {}",
                payment.getPaymentNo(), invoice.getInvoiceNo(), allocationAmount);
        }
    }

    public void reversePaymentFromInvoices(ApPayment payment) {
        for (ApPaymentAllocation allocation : payment.getAllocations()) {
            ApInvoice invoice = allocation.getApInvoice();
            BigDecimal paidAmount = amountOrZero(invoice.getPaidAmount()).subtract(allocation.getAllocatedAmount());
            BigDecimal outstanding = amountOrZero(invoice.getTotalAmount()).subtract(paidAmount);

            invoice.setPaidAmount(paidAmount.max(BigDecimal.ZERO));
            invoice.setOutstandingAmount(outstanding.min(amountOrZero(invoice.getTotalAmount())));
            invoice.setStatus(resolveInvoiceStatus(invoice));
            apInvoiceRepository.save(invoice);
            log.info("Reversed AP payment {} from invoice {} amount {}",
                payment.getPaymentNo(), invoice.getInvoiceNo(), allocation.getAllocatedAmount());
        }
    }

    private InvoiceStatus resolveInvoiceStatus(ApInvoice invoice) {
        BigDecimal outstanding = amountOrZero(invoice.getOutstandingAmount());
        BigDecimal total = amountOrZero(invoice.getTotalAmount());
        if (outstanding.compareTo(total) == 0) {
            return InvoiceStatus.POSTED;
        }
        return outstanding.signum() > 0 ? InvoiceStatus.PARTIALLY_PAID : InvoiceStatus.PAID;
    }

    private BigDecimal amountOrZero(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }
}
