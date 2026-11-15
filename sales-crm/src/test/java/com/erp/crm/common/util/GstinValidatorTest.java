package com.erp.crm.common.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GstinValidatorTest {

    @Test
    @DisplayName("Should validate correct 15-character Indian GSTIN")
    void testValidGstin() {
        String validGstin = "27ABCDE1234F1Z5";
        assertTrue(GstinValidator.isValidGstin(validGstin));
        assertEquals("ABCDE1234F", GstinValidator.extractPanFromGstin(validGstin));
        assertEquals("27", GstinValidator.extractStateCodeFromGstin(validGstin));
    }

    @Test
    @DisplayName("Should reject invalid GSTIN format")
    void testInvalidGstin() {
        assertFalse(GstinValidator.isValidGstin(null));
        assertFalse(GstinValidator.isValidGstin(""));
        assertFalse(GstinValidator.isValidGstin("27ABCDE1234F1")); // too short
        assertFalse(GstinValidator.isValidGstin("XXABCDE1234F1Z5")); // invalid state code digits
    }

    @Test
    @DisplayName("Should validate correct PAN format")
    void testValidPan() {
        assertTrue(GstinValidator.isValidPan("ABCDE1234F"));
        assertFalse(GstinValidator.isValidPan("12CDE1234F"));
        assertFalse(GstinValidator.isValidPan("ABCDE12345"));
    }
}

