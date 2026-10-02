package com.erp.account.modules.apinvoice.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApInvoiceRequestValidationTest {

    private final Validator validator;

    ApInvoiceRequestValidationTest() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void shouldRejectDueDateBeforeInvoiceDate() {
        ApInvoiceRequest request = ApInvoiceRequest.builder()
            .vendorId(UUID.randomUUID())
            .invoiceNo("INV-001")
            .invoiceDate(LocalDate.of(2024, 1, 10))
            .dueDate(LocalDate.of(2024, 1, 5))
            .subtotal(BigDecimal.TEN)
            .taxAmount(BigDecimal.ZERO)
            .totalAmount(BigDecimal.TEN)
            .paidAmount(BigDecimal.ZERO)
            .items(java.util.List.of())
            .build();

        Set<ConstraintViolation<ApInvoiceRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Due date must be on or after invoice date")));
    }
}
