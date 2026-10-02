package com.erp.account.util;


import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class GLPostingEngineTest {

    @Test
    public void postVoucher_balanced() {
        GLEntry e1 = new GLEntry("1000", new BigDecimal("100.00"), BigDecimal.ZERO, "INR", "Payment from cust");
        GLEntry e2 = new GLEntry("4000", BigDecimal.ZERO, new BigDecimal("100.00"), "INR", "Sales revenue");

        GLStore store = new GLStore();
        GLPostingEngine engine = new GLPostingEngine();

        PostingResult res = engine.postVoucher(
                null,
                "Receipt",
                LocalDate.now(),
                Arrays.asList(e1,e2),
                "REF-1",
                "system",
                "INR",
                "INR",
                BigDecimal.ONE,
                new HashSet<>(Arrays.asList("1000","4000")),
                new HashSet<>(Arrays.asList("1000","4000")),
                new HashSet<>(),
                new HashSet<>(),
                2026,
                5,
                store
        );

        assertEquals("Success", res.getStatus());
        assertEquals(2, res.getGl_entries().size());
    }
}
