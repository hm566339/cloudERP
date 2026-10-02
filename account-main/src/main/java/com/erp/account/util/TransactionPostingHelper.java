package com.erp.account.util;

import com.erp.account.modules.banktransaction.entity.BankTransaction;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Transaction Posting Helper
 * 
 * Generates and manages GL posting for bank transactions.
 * 
 * Implements double-entry accounting:
 * - For Credit Transactions: DR Bank, CR Counter Account
 * - For Debit Transactions: DR Counter Account, CR Bank
 * 
 * @author ERP System
 * @version 1.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionPostingHelper {

    private final GlJournalEntryRepository glJournalEntryRepository;
    private final GlJournalLineRepository glJournalLineRepository;

    /**
     * Create GL posting for a bank transaction
     * 
     * Implements double-entry accounting principles:
     * - Credit Transaction (credit amount positive):
     *   DR: Bank Account (debit)
     *   CR: Counter Account (credit)
     * 
     * - Debit Transaction (debit amount positive):
     *   DR: Counter Account (debit)
     *   CR: Bank Account (credit)
     * 
     * @param transaction the bank transaction
     * @return GL journal entry ID
     */
    public UUID createGlPosting(BankTransaction transaction) {
        log.info("Creating GL posting for transaction: {}", transaction.getId());

        BigDecimal debitAmount = transaction.getDebitAmount() != null 
                ? transaction.getDebitAmount() 
                : BigDecimal.ZERO;
        BigDecimal creditAmount = transaction.getCreditAmount() != null 
                ? transaction.getCreditAmount() 
                : BigDecimal.ZERO;

        // Create journal entry
        GlJournalEntry journalEntry = GlJournalEntry.builder()
                .company(transaction.getCompany())
                .voucherNo(generateVoucherNo("BT"))
                .voucherDate(LocalDate.now())
                .referenceNo(transaction.getReferenceNo())
                .sourceModule(com.erp.account.modules.gljournal.enums.SourceModule.BANK)
                .sourceId(transaction.getId())
                .narration(String.format(
                        BankTransactionConstants.GL_NARRATION_FORMAT,
                        transaction.getTransactionType(),
                        transaction.getReferenceNo()
                ))
                .status(PostingStatus.DRAFT)
                .totalDebit(debitAmount)
                .totalCredit(creditAmount)
                .build();

        GlJournalEntry savedEntry = glJournalEntryRepository.save(journalEntry);
        log.info("GL Journal entry created: {}", savedEntry.getId());

        // Create journal lines based on transaction direction
        if (creditAmount.compareTo(BigDecimal.ZERO) > 0) {
            // Credit transaction: DR Bank, CR Counter
            createJournalLines(savedEntry, transaction, creditAmount, true);
        } else if (debitAmount.compareTo(BigDecimal.ZERO) > 0) {
            // Debit transaction: DR Counter, CR Bank
            createJournalLines(savedEntry, transaction, debitAmount, false);
        }

        return savedEntry.getId();
    }

    /**
     * Reverse GL posting for a bank transaction
     * 
     * Creates reversal journal entry with opposite amounts.
     * 
     * @param transaction the bank transaction
     */
    public void reverseGlPosting(BankTransaction transaction) {
        log.info("Reversing GL posting for transaction: {}", transaction.getId());

        // Find original journal entry
        GlJournalEntry originalEntry = glJournalEntryRepository
                .findBySourceIdAndSourceModule(transaction.getId(), com.erp.account.modules.gljournal.enums.SourceModule.BANK)
                .orElseThrow(() -> new RuntimeException("Original GL entry not found for transaction: " + transaction.getId()));

        // Create reversal entry
        GlJournalEntry reversalEntry = GlJournalEntry.builder()
                .company(transaction.getCompany())
                .voucherNo(generateVoucherNo("RV"))
                .voucherDate(LocalDate.now())
                .referenceNo(originalEntry.getReferenceNo() + "-REV")
                .sourceModule(com.erp.account.modules.gljournal.enums.SourceModule.BANK)
                .sourceId(transaction.getId())
                .narration("Reversal of: " + originalEntry.getNarration())
                .status(PostingStatus.DRAFT)
                .totalDebit(originalEntry.getTotalCredit())
                .totalCredit(originalEntry.getTotalDebit())
                .build();

        glJournalEntryRepository.save(reversalEntry);
        log.info("GL reversal entry created");
    }

    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * Create journal lines for double-entry posting.
     * Account mapping is left null for auto-generated bank transaction postings
     * and should be assigned during manual review/posting.
     */
    private void createJournalLines(
            GlJournalEntry journalEntry,
            BankTransaction transaction,
            BigDecimal amount,
            boolean isCreditTransaction) {
        
        if (isCreditTransaction) {
            // DR: Bank Account
            GlJournalLine debitLine = GlJournalLine.builder()
                    .company(transaction.getCompany())
                    .journalEntry(journalEntry)
                    .debitAmount(amount)
                    .creditAmount(BigDecimal.ZERO)
                    .lineDescription("Bank transaction debit - " + transaction.getReferenceNo())
                    .build();
            glJournalLineRepository.save(debitLine);

            // CR: Counter Account (to be mapped based on business rules)
            GlJournalLine creditLine = GlJournalLine.builder()
                    .company(transaction.getCompany())
                    .journalEntry(journalEntry)
                    .debitAmount(BigDecimal.ZERO)
                    .creditAmount(amount)
                    .lineDescription("Bank transaction credit - " + transaction.getReferenceNo())
                    .build();
            glJournalLineRepository.save(creditLine);
        } else {
            // DR: Counter Account
            GlJournalLine debitLine = GlJournalLine.builder()
                    .company(transaction.getCompany())
                    .journalEntry(journalEntry)
                    .debitAmount(amount)
                    .creditAmount(BigDecimal.ZERO)
                    .lineDescription("Bank transaction debit - " + transaction.getReferenceNo())
                    .build();
            glJournalLineRepository.save(debitLine);

            // CR: Bank Account
            GlJournalLine creditLine = GlJournalLine.builder()
                    .company(transaction.getCompany())
                    .journalEntry(journalEntry)
                    .debitAmount(BigDecimal.ZERO)
                    .creditAmount(amount)
                    .lineDescription("Bank transaction credit - " + transaction.getReferenceNo())
                    .build();
            glJournalLineRepository.save(creditLine);
        }

        log.debug("GL journal lines created for entry: {}", journalEntry.getId());
    }

    /**
     * Generate a unique voucher number that fits within varchar(20).
     * Format: {prefix}-{yyyyMMddHHmmssSSS} e.g. BT-20260611235046494
     *
     * @param prefix the voucher prefix (e.g. "BT", "RV")
     * @return voucher number string (max 20 chars)
     */
    private String generateVoucherNo(String prefix) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        return prefix + "-" + timestamp;
    }
}
