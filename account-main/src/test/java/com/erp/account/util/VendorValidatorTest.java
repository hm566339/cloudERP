package com.erp.account.util;


import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class VendorValidatorTest {

    @Test
    public void happyPath_validVendor() {
        Vendor v = new Vendor("V100","Vendor A","27ABCDE1234F2Z5","Some Address","a@example.com","+919876543210",true,false);

        ValidationResult res = VendorValidator.validate(v, Collections.emptyList());

        assertEquals("Success", res.getStatus());
    }
}
