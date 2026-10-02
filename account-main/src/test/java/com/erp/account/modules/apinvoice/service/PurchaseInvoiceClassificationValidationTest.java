package com.erp.account.modules.apinvoice.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.enums.ItcEligibility;
import com.erp.account.enums.PurchaseDocumentType;
import com.erp.account.enums.PurchaseSource;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;

class PurchaseInvoiceClassificationValidationTest {

    private final PurchaseInvoiceValidationService validationService =
            new PurchaseInvoiceValidationService(null, null);

    @Test
    void rejectsDirectPurchaseWithPurchaseOrderReference() {
        ApInvoiceRequest request = new ApInvoiceRequest();
        request.setPurchaseSource(PurchaseSource.DIRECT_LOCAL_PURCHASE);
        request.setPurchaseOrderId(UUID.randomUUID());

        assertThrows(BadRequestException.class,
                () -> validationService.normalizeAndValidateClassification(request));
    }

    @Test
    void rejectsNoInvoiceAsItcEligible() {
        ApInvoiceRequest request = new ApInvoiceRequest();
        request.setDocumentType(PurchaseDocumentType.NO_INVOICE);
        request.setItcEligibility(ItcEligibility.ITC_ELIGIBLE);
        request.setTaxAmount(BigDecimal.TEN);

        assertThrows(BadRequestException.class,
                () -> validationService.normalizeAndValidateClassification(request));
    }
}
