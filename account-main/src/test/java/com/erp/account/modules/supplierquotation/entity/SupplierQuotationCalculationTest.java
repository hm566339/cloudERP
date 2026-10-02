package com.erp.account.modules.supplierquotation.entity;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;

class SupplierQuotationCalculationTest {
    @Test
    void recalculatesLineAndQuotationTotalsFromServerSideInputs() {
        SupplierQuotationItem item = SupplierQuotationItem.builder()
                .quantity(new BigDecimal("2"))
                .unitPrice(new BigDecimal("100"))
                .discount(new BigDecimal("10"))
                .cgstRate(new BigDecimal("9"))
                .sgstRate(new BigDecimal("9"))
                .build();
        SupplierQuotation quotation = SupplierQuotation.builder()
                .freight(new BigDecimal("20"))
                .discount(BigDecimal.ZERO)
                .build();
        quotation.addItem(item);
        quotation.calculateTotals();

        assertEquals(new BigDecimal("190.0000"), item.getTaxableAmount());
        assertEquals(new BigDecimal("17.1000"), item.getCgstAmount());
        assertEquals(new BigDecimal("17.1000"), item.getSgstAmount());
        assertEquals(new BigDecimal("244.2000"), quotation.getGrandTotal());
    }
}
