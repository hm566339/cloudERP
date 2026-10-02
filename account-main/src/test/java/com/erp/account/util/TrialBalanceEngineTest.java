package com.erp.account.util;


import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class TrialBalanceEngineTest {

    @Test
    public void generateTrialBalance_balanced() {
        GLTransaction t1 = new GLTransaction();
        t1.setId("1");
        t1.setAccountCode("4000");
        t1.setAccountName("Sales");
        t1.setDate(LocalDate.of(2026,5,1));
        t1.setDebit(BigDecimal.ZERO);
        t1.setCredit(new BigDecimal("100.00"));
        t1.setPosted(true);
        t1.setFiscalYear(2026);
        t1.setAccountingPeriod(5);
        t1.setCompany("C1");

        GLTransaction t2 = new GLTransaction();
        t2.setId("2");
        t2.setAccountCode("1000");
        t2.setAccountName("AR");
        t2.setDate(LocalDate.of(2026,5,1));
        t2.setDebit(new BigDecimal("100.00"));
        t2.setCredit(BigDecimal.ZERO);
        t2.setPosted(true);
        t2.setFiscalYear(2026);
        t2.setAccountingPeriod(5);
        t2.setCompany("C1");

        TrialBalanceResult res = TrialBalanceEngine.generateTrialBalance(
                Arrays.asList(t1,t2),
                2026,
                5,
                LocalDate.of(2026,5,1),
                LocalDate.of(2026,5,31),
                "C1",
                false,
                new HashSet<>(),
                false,
                false,
                Collections.emptySet()
        );

        assertTrue(res.isBalanced());
    }
}
