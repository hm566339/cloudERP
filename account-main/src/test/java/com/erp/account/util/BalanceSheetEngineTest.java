package com.erp.account.util;


import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class BalanceSheetEngineTest {

    @Test
    public void generateBalanceSheet_balanced() {
        AccountBalance a1 = new AccountBalance();
        a1.setAccountCode("1000"); a1.setAccountName("Cash"); a1.setAccountType("ASSET"); a1.setOpeningBalance(BigDecimal.ZERO); a1.setDebit(new BigDecimal("100.00")); a1.setCredit(BigDecimal.ZERO); a1.setClosingBalance(new BigDecimal("100.00"));

        AccountBalance a2 = new AccountBalance();
        a2.setAccountCode("2000"); a2.setAccountName("Payables"); a2.setAccountType("LIABILITY"); a2.setOpeningBalance(BigDecimal.ZERO); a2.setDebit(BigDecimal.ZERO); a2.setCredit(new BigDecimal("60.00")); a2.setClosingBalance(new BigDecimal("60.00"));

        AccountBalance a3 = new AccountBalance();
        a3.setAccountCode("3000"); a3.setAccountName("Equity"); a3.setAccountType("EQUITY"); a3.setOpeningBalance(BigDecimal.ZERO); a3.setDebit(BigDecimal.ZERO); a3.setCredit(new BigDecimal("40.00")); a3.setClosingBalance(new BigDecimal("40.00"));

        BalanceSheetResult res = BalanceSheetEngine.generateBalanceSheet(
                Arrays.asList(a1,a2,a3),
                new HashMap<>(),
                2026,
                5,
                "C1",
                false,
                Collections.emptySet(),
                false,
                Collections.emptySet()
        );

        assertTrue(res.isBalanced());
    }
}
