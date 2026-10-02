package com.erp.account.util;


import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class InvoiceValidatorTest {

    @Test
    public void happyPath_validInvoice() {
        InvoiceLine l1 = new InvoiceLine("C100","Item A", new BigDecimal("100.00"), new BigDecimal("18"), new BigDecimal("18.00"), new BigDecimal("118.00"), "ref1");
        InvoiceLine l2 = new InvoiceLine("C100","Item B", new BigDecimal("50.00"), new BigDecimal("18"), new BigDecimal("9.00"), new BigDecimal("59.00"), "ref2");

        Invoice inv = new Invoice();
        inv.setInvoiceNumber("INV-1000");
        inv.setInvoiceDate(LocalDate.of(2026,5,10));
        inv.setCustomerAccountCode("C100");
        inv.setLines(Arrays.asList(l1,l2));
        inv.setTotalAmount(new BigDecimal("177.00"));
        inv.setPaidAmount(new BigDecimal("77.00"));
        inv.setOutstandingAmount(new BigDecimal("100.00"));
        inv.setAccountingPeriod(5);

        ValidationResult res = InvoiceValidator.validate(inv, Collections.emptyList(), new HashSet<>(Collections.singletonList("C100")), new HashSet<>(Collections.singletonList(5)));

        assertEquals("Success", res.getStatus());
        assertEquals(0, res.getErrors().size());
    }
}
