package com.erp.account;

import com.erp.account.modules.proformainvoice.dto.request.PIConversionRequest;
import com.erp.account.modules.proformainvoice.dto.response.ProformaInvoiceResponse;
import com.erp.account.modules.proformainvoice.service.ProformaInvoiceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.UUID;

@SpringBootTest
@ActiveProfiles("test")
public class PiCreationTest {

    @Autowired
    private ProformaInvoiceService proformaInvoiceService;

    @Test
    public void testCreatePi() {
        UUID companyId = UUID.fromString("8794358f-3b1a-40be-9d13-afb51b449862");
        UUID quotationId = UUID.fromString("ac27cee0-5db6-4c75-9b11-130e77e947e5");

        PIConversionRequest request = new PIConversionRequest();
        request.setPiDate(LocalDate.now());
        request.setPiValidTill(LocalDate.now().plusDays(30));

        try {
            ProformaInvoiceResponse response = proformaInvoiceService.createFromQuotation(companyId, quotationId, request);
            System.out.println("--- PI CREATION SUCCESS ---");
            System.out.println("Created PI ID: " + response.getId());
        } catch (Exception e) {
            System.out.println("--- PI CREATION FAILED ---");
            e.printStackTrace();
        }
    }
}
