package com.erp.account.modules.vouchersequence.service.impl;

import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.vouchersequence.entity.VoucherSequence;
import com.erp.account.modules.vouchersequence.repository.VoucherSequenceRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VoucherSequenceServiceImpl implements VoucherSequenceService {

    private final VoucherSequenceRepository voucherSequenceRepository;
    private final CompanyRepository companyRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextReceiptNumber(UUID companyId, LocalDate receiptDate) {
        String voucherType = "RECEIPT";
        // E.g., RV-2026-08-
        String prefix = String.format("RV-%04d-%02d-", receiptDate.getYear(), receiptDate.getMonthValue());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(6)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }



    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextCreditNoteNumber(UUID companyId, String companyCode, LocalDate noteDate) {
        // e.g. ABC-CN-202608-
        String voucherType = "CREDIT_NOTE";
        String prefix = String.format("%s-CN-%04d%02d-", companyCode, noteDate.getYear(), noteDate.getMonthValue());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(6)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextDebitNoteNumber(UUID companyId, String companyCode, LocalDate noteDate) {
        // e.g. ABC-DN-202608-
        String voucherType = "DEBIT_NOTE";
        String prefix = String.format("%s-DN-%04d%02d-", companyCode, noteDate.getYear(), noteDate.getMonthValue());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(6)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextQuotationNumber(UUID companyId, LocalDate quotationDate) {
        String voucherType = "QUOTATION";
        // E.g., QT-2026-08-
        String prefix = String.format("QT-%04d-%02d-", quotationDate.getYear(), quotationDate.getMonthValue());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(6)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextProformaInvoiceNumber(UUID companyId, LocalDate piDate) {
        String voucherType = "PROFORMA_INVOICE";
        // E.g., PI-2026-08-
        String prefix = String.format("PI-%04d-%02d-", piDate.getYear(), piDate.getMonthValue());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(6)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextSalesOrderNumber(UUID companyId, LocalDate soDate) {
        String voucherType = "SALES_ORDER";
        // E.g., SO-2026-08-
        String prefix = String.format("SO-%04d-%02d-", soDate.getYear(), soDate.getMonthValue());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(6)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }

    @Override
    @Transactional
    public String generateNextDeliveryChallanNumber(UUID companyId, LocalDate dcDate) {
        String voucherType = "DELIVERY_CHALLAN";
        // E.g., DC-2026-08-
        String prefix = String.format("DC-%04d-%02d-", dcDate.getYear(), dcDate.getMonthValue());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(6)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextExpenseRequestNumber(UUID companyId, LocalDate requestDate) {
        String voucherType = "EXPENSE_REQUEST";
        String prefix = String.format("ER-%04d-", requestDate.getYear());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(4)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextExpenseClaimNumber(UUID companyId, LocalDate claimDate) {
        String voucherType = "EXPENSE_CLAIM";
        String prefix = String.format("EC-%04d-", claimDate.getYear());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(4)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextReimbursementNumber(UUID companyId, LocalDate reimbursementDate) {
        String voucherType = "REIMBURSEMENT";
        String prefix = String.format("RMB-%04d-", reimbursementDate.getYear());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(3)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextPurchaseOrderNumber(UUID companyId, LocalDate poDate) {
        String voucherType = "PURCHASE_ORDER";
        // E.g., PO-2026-09-
        String prefix = String.format("PO-%04d-%02d-", poDate.getYear(), poDate.getMonthValue());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(6)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextPurchaseRequisitionNumber(UUID companyId, LocalDate requisitionDate) {
        String voucherType = "PURCHASE_REQUISITION";
        String prefix = String.format("PR-%04d-%02d-", requisitionDate.getYear(), requisitionDate.getMonthValue());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(6)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);
        voucherSequenceRepository.save(sequence);
        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextRfqNumber(UUID companyId, LocalDate rfqDate) {
        return nextNumber(companyId, "RFQ", String.format("RFQ-%04d-%02d-", rfqDate.getYear(), rfqDate.getMonthValue()));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextSupplierQuotationNumber(UUID companyId, LocalDate quotationDate) {
        return nextNumber(companyId, "SUPPLIER_QUOTATION", String.format("SQ-%04d-%02d-", quotationDate.getYear(), quotationDate.getMonthValue()));
    }

    private String nextNumber(UUID companyId, String voucherType, String prefix) {
        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder().company(company).voucherType(voucherType).prefix(prefix)
                            .nextNumber(1L).paddingLength(6).isActive(true).build();
                });
        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }
        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);
        voucherSequenceRepository.save(sequence);
        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextGrnNumber(UUID companyId, LocalDate grnDate) {
        String voucherType = "GOODS_RECEIPT";
        // E.g., GRN-2026-09-
        String prefix = String.format("GRN-%04d-%02d-", grnDate.getYear(), grnDate.getMonthValue());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(6)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextPurchaseReturnNumber(UUID companyId, LocalDate returnDate) {
        String voucherType = "PURCHASE_RETURN";
        String prefix = String.format("PR-%04d-%02d-", returnDate.getYear(), returnDate.getMonthValue());

        VoucherSequence sequence = voucherSequenceRepository.findLockedByCompanyIdAndVoucherType(companyId, voucherType)
                .orElseGet(() -> {
                    Company company = companyRepository.findById(companyId)
                            .orElseThrow(() -> new RuntimeException("Company not found"));
                    return VoucherSequence.builder()
                            .company(company)
                            .voucherType(voucherType)
                            .prefix(prefix)
                            .nextNumber(1L)
                            .paddingLength(6)
                            .isActive(true)
                            .build();
                });

        if (!prefix.equals(sequence.getPrefix())) {
            sequence.setPrefix(prefix);
            sequence.setNextNumber(1L);
        }

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);

        voucherSequenceRepository.save(sequence);

        return sequence.getPrefix() + String.format("%0" + sequence.getPaddingLength() + "d", currentNumber);
    }
}
