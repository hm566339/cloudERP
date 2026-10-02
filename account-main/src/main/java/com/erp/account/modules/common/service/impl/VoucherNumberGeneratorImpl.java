package com.erp.account.modules.common.service.impl;

import com.erp.account.common.exception.ValidationException;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.util.JournalConstants;
import com.erp.account.modules.common.service.VoucherNumberGenerator;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@AllArgsConstructor
public class VoucherNumberGeneratorImpl implements VoucherNumberGenerator {

    private final GlJournalEntryRepository journalEntryRepository;

    private static final DateTimeFormatter YEAR_FMT = DateTimeFormatter.ofPattern("yyyy");

    @Override
    @Transactional
    public synchronized String generateVoucherNo(UUID companyId, LocalDate voucherDate) {
        if (voucherDate == null) {
            throw new ValidationException("Voucher date is required to generate voucher number");
        }
        String year = YEAR_FMT.format(voucherDate);
        String prefix = String.format("%s-%s", JournalConstants.JOURNAL_VOUCHER_PREFIX, year);

        Long maxSeq = journalEntryRepository.getMaxVoucherSequence(companyId, prefix);
        long next = (maxSeq == null ? 0L : maxSeq) + 1L;

        return String.format(JournalConstants.VOUCHER_NO_FORMAT, JournalConstants.JOURNAL_VOUCHER_PREFIX,
                year, next);
    }
}
