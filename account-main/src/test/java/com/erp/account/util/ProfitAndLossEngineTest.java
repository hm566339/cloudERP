package com.erp.account.util;


import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ProfitAndLossEngineTest {

    @Test
    public void generatePnL_basic() {
        AccountBalance rev = new AccountBalance();
        rev.setAccountCode("4000"); rev.setAccountName("Sales"); rev.setAccountType("REVENUE"); rev.setClosingBalance(new BigDecimal("200.00"));

        AccountBalance cogs = new AccountBalance();
        cogs.setAccountCode("5000"); cogs.setAccountName("COGS"); cogs.setAccountType("COGS"); cogs.setClosingBalance(new BigDecimal("80.00"));

        AccountBalance exp = new AccountBalance();
        exp.setAccountCode("6000"); exp.setAccountName("Expenses"); exp.setAccountType("EXPENSE"); exp.setClosingBalance(new BigDecimal("50.00"));

        PnLResult res = ProfitAndLossEngine.generatePnL(Arrays.asList(rev,cogs,exp), Collections.emptyMap(), 2026, 5, false, Collections.emptySet(), false, Collections.emptySet());

        assertEquals(new BigDecimal("200.00"), res.getTotalRevenue());
        assertEquals(new BigDecimal("80.00"), res.getTotalCOGS());
        assertEquals(new BigDecimal("50.00"), res.getTotalExpenses());
        assertEquals(new BigDecimal("120.00"), res.getGrossProfit());
        assertEquals(new BigDecimal("70.00"), res.getNetProfit());
    }
}
