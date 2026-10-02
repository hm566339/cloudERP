package com.erp.account.util;


import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class JournalEntryValidatorTest {

    @Test
    public void happyPath_validEntry() {
        JournalLine l1 = new JournalLine("4000", new BigDecimal("100.00"), BigDecimal.ZERO, "ref1");
        JournalLine l2 = new JournalLine("2000", BigDecimal.ZERO, new BigDecimal("100.00"), "ref2");

        JournalEntry entry = new JournalEntry();
        entry.setVoucherNumber("V100");
        entry.setVoucherDate(LocalDate.of(2026,5,1));
        entry.setReferenceNumber("REF-1");
        entry.setLines(Arrays.asList(l1, l2));
        entry.setTotalAmount(new BigDecimal("100.00"));
        entry.setFiscalYear(2026);
        entry.setAccountingPeriod(5);

        ValidationResult res = JournalEntryValidator.validate(
                entry,
                Collections.emptyList(),
                new HashSet<>(Arrays.asList("4000","2000","1000")),
                new HashSet<>(Arrays.asList("4000","2000","1000")),
                Collections.emptySet(),
                Collections.emptySet()
        );

        assertEquals("Success", res.getStatus());
        assertEquals(0, res.getErrors().size());
    }
}
