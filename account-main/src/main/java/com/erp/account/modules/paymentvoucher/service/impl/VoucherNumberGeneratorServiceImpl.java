package com.erp.account.modules.paymentvoucher.service.impl;

import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.paymentvoucher.service.VoucherNumberGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherNumberGeneratorServiceImpl implements VoucherNumberGeneratorService {

    private final PaymentVoucherRepository paymentVoucherRepository;
    private final CompanyRepository companyRepository;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final String PREFIX_TEMPLATE = "PV-%s-";
    private static final String NUMBER_FORMAT = "%06d";

    @Override
    @Transactional
    public String generateNextVoucherNo(UUID companyId, LocalDate voucherDate) {
        log.debug("Generating voucher number for company: {} and date: {}", companyId, voucherDate);

        // 1. Acquire pessimistic write lock on the company to prevent concurrent sequence generation
        companyRepository.findByIdForUpdate(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found: " + companyId));

        // 2. Format the prefix: PV-YYYY-MM-
        String yearMonth = voucherDate.format(MONTH_FORMATTER);
        String prefix = String.format(PREFIX_TEMPLATE, yearMonth);

        // 3. Find the latest voucher for this prefix
        Optional<PaymentVoucher> latestVoucherOpt = paymentVoucherRepository
                .findFirstByCompanyIdAndVoucherNoStartingWithOrderByVoucherNoDesc(companyId, prefix);

        long nextSequence = 1L;

        if (latestVoucherOpt.isPresent()) {
            String latestVoucherNo = latestVoucherOpt.get().getVoucherNo();
            try {
                String numericPart = latestVoucherNo.substring(prefix.length());
                long latestSequence = Long.parseLong(numericPart);
                nextSequence = latestSequence + 1;
            } catch (Exception e) {
                log.warn("Failed to parse voucher number numeric part from {}, resetting sequence.", latestVoucherNo);
                nextSequence = 1L; // Fallback, though ideally this shouldn't happen with strict format
            }
        }

        // 4. Format and return the next voucher number
        String generatedNo = prefix + String.format(NUMBER_FORMAT, nextSequence);
        log.debug("Generated voucher number: {}", generatedNo);
        return generatedNo;
    }
}
