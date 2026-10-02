package com.erp.account.util;

import com.erp.account.util.AutoGlPostingEngine;
import com.erp.account.util.Invoice;
import com.erp.account.util.InvoiceLine;
import com.erp.account.util.PostingResult;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class AutoGlPostingEngineTest {

    @Test
    public void postSalesInvoice_happyPath() {
        InvoiceLine l1 = new InvoiceLine("C100","Item A", new BigDecimal("100.00"), new BigDecimal("18"), new BigDecimal("18.00"), new BigDecimal("118.00"), "ref1");
        Invoice inv = new Invoice();
        inv.setInvoiceNumber("INV-2000");
        inv.setInvoiceDate(LocalDate.now());
        inv.setCustomerAccountCode("C100");
        inv.setLines(Collections.singletonList(l1));
        inv.setTotalAmount(new BigDecimal("118.00"));
        inv.setAccountingPeriod(5);

        Map<String,String> mapping = new HashMap<>();
        mapping.put("SALES","4000");
        mapping.put("AR","C100");
        mapping.put("GST_OUTPUT","2200");
        mapping.put("ROUNDOFF","9999");

        Set<String> active = new HashSet<>(Arrays.asList("4000","C100","2200","9999"));
        Set<String> posted = new HashSet<>();
        Set<Integer> closed = new HashSet<>();

        AutoGlPostingEngine engine = new AutoGlPostingEngine();
        PostingResult res = engine.postSalesInvoice(inv, mapping, active, posted, closed, "system", "INR", "INR", BigDecimal.ONE);

        assertEquals("Success", res.getStatus());
        // expect 3 entries: Debit AR, Credit Sales, Credit GST_OUTPUT (or ROUNDOFF if unbalanced)
        assertEquals(3, res.getGl_entries().size());
    }
}
