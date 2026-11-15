package com.erp.crm.common.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PhoneUtilsTest {

    @Test
    @DisplayName("Should normalize 10-digit Indian numbers to E.164 +91 format")
    void testNormalizeIndianNumber() {
        assertEquals("+919876543210", PhoneUtils.normalizePhone("9876543210"));
        assertEquals("+919876543210", PhoneUtils.normalizePhone("09876543210"));
        assertEquals("+919876543210", PhoneUtils.normalizePhone("919876543210"));
        assertEquals("+919876543210", PhoneUtils.normalizePhone("+91-9876543210"));
        assertEquals("+919876543210", PhoneUtils.normalizePhone("+91 98765 43210"));
    }

    @Test
    @DisplayName("Should handle already formatted E.164 numbers")
    void testNormalizeInternationalNumber() {
        assertEquals("+14155552671", PhoneUtils.normalizePhone("+14155552671"));
        assertEquals("+442071838750", PhoneUtils.normalizePhone("+44 20 7183 8750"));
    }

    @Test
    @DisplayName("Should return null or raw on null/blank input")
    void testNullOrBlank() {
        assertNull(PhoneUtils.normalizePhone(null));
        assertNull(PhoneUtils.normalizePhone(""));
        assertNull(PhoneUtils.normalizePhone(" "));
    }
}
