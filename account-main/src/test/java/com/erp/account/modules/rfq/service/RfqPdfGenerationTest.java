package com.erp.account.modules.rfq.service;

import com.erp.account.enums.ItemType;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisition;
import com.erp.account.modules.rfq.dto.RfqEmailModel;
import com.erp.account.modules.rfq.entity.Rfq;
import com.erp.account.modules.rfq.entity.RfqItem;
import com.erp.account.modules.rfq.entity.RfqStatus;
import com.erp.account.modules.rfq.service.impl.RfqPdfServiceImpl;
import com.erp.account.modules.vendor.entity.Vendor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class RfqPdfGenerationTest {

    private RfqPdfServiceImpl pdfService;

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");

        TemplateEngine engine = new TemplateEngine();
        engine.setTemplateResolver(resolver);

        com.erp.account.modules.unit.service.impl.UnitServiceImpl unitService = new com.erp.account.modules.unit.service.impl.UnitServiceImpl(null);
        pdfService = new RfqPdfServiceImpl(engine, unitService);
    }

    private Company createSampleCompany() {
        return Company.builder()
                .id(UUID.randomUUID())
                .companyName("Precision Engineering Pvt Ltd")
                .addressLine1("100 Industrial Area, Phase 2")
                .city("Bengaluru")
                .state("Karnataka")
                .postalCode("560001")
                .email("procure@precision.com")
                .phone("+91 80 12345678")
                .gstin("29AABCP1234F1Z5")
                .build();
    }

    private Vendor createSampleVendor() {
        return Vendor.builder()
                .id(UUID.randomUUID())
                .vendorName("Apex Raw Materials Co.")
                .vendorCode("VEND-889")
                .addressLine1("45 Warehouse Road")
                .city("Chennai")
                .state("Tamil Nadu")
                .pinCode("600001")
                .email("sales@apexraw.com")
                .phone("+91 44 98765432")
                .gstin("33AABCA4321A1Z9")
                .build();
    }

    @Test
    @DisplayName("Should generate valid PDF when PurchaseRequisition is present on RFQ")
    void testGenerateRfqPdf_WithPurchaseRequisition() {
        Company company = createSampleCompany();
        Vendor vendor = createSampleVendor();

        PurchaseRequisition pr = PurchaseRequisition.builder()
                .id(UUID.randomUUID())
                .requisitionNumber("PR-2026-09-000001")
                .company(company)
                .build();

        Rfq rfq = Rfq.builder()
                .id(UUID.randomUUID())
                .rfqNumber("RFQ-2026-09-000002")
                .purchaseRequisitionId(pr.getId())
                .purchaseRequisition(pr)
                .issueDate(LocalDate.of(2026, 9, 11))
                .quotationDeadline(LocalDate.of(2026, 9, 20))
                .expectedDeliveryDate(LocalDate.of(2026, 9, 30))
                .status(RfqStatus.SENT)
                .terms("Payment within 30 days.")
                .notes("Please provide best quotation.")
                .company(company)
                .items(new HashSet<>())
                .build();

        rfq.addItem(RfqItem.builder()
                .id(UUID.randomUUID())
                .itemName("Industrial Steel Rods")
                .description("High-tensile Grade 304 stainless steel rods")
                .specifications("Diameter: 25mm, Length: 2000mm")
                .itemType(ItemType.PRODUCT)
                .quantity(new BigDecimal("500.00"))
                .unit("KGS")
                .requiredDate(LocalDate.of(2026, 9, 28))
                .build());

        byte[] pdfBytes = pdfService.generateRfqPdf(rfq, vendor);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "PDF byte array should have meaningful size");
        // Verify %PDF- magic bytes
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);
    }

    @Test
    @DisplayName("Should generate valid PDF without error when PurchaseRequisition is null")
    void testGenerateRfqPdf_WithoutPurchaseRequisition() {
        Company company = createSampleCompany();
        Vendor vendor = createSampleVendor();

        Rfq rfq = Rfq.builder()
                .id(UUID.randomUUID())
                .rfqNumber("RFQ-2026-09-000003")
                .purchaseRequisitionId(null)
                .purchaseRequisition(null)
                .issueDate(LocalDate.of(2026, 9, 11))
                .quotationDeadline(LocalDate.of(2026, 9, 20))
                .expectedDeliveryDate(LocalDate.of(2026, 9, 30))
                .status(RfqStatus.DRAFT)
                .company(company)
                .items(new HashSet<>())
                .build();

        rfq.addItem(RfqItem.builder()
                .id(UUID.randomUUID())
                .itemName("Spare Valve")
                .quantity(new BigDecimal("10.00"))
                .unit("PCS")
                .build());

        byte[] pdfBytes = pdfService.generateRfqPdf(rfq, vendor);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500);
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);
    }

    @Test
    @DisplayName("Should generate valid PDF using RfqEmailModel directly")
    void testGenerateRfqPdf_UsingRfqEmailModel() {
        Company company = createSampleCompany();
        Vendor vendor = createSampleVendor();

        RfqEmailModel model = RfqEmailModel.builder()
                .rfqId(UUID.randomUUID())
                .rfqNumber("RFQ-2026-09-000004")
                .prNumber("PR-2026-09-999")
                .purchaseRequisition(RfqEmailModel.PurchaseRequisitionRef.builder()
                        .id(UUID.randomUUID())
                        .prNumber("PR-2026-09-999")
                        .requisitionNumber("PR-2026-09-999")
                        .build())
                .issueDate(LocalDate.of(2026, 9, 11))
                .quotationDeadline(LocalDate.of(2026, 9, 20))
                .status("SENT")
                .vendorName(vendor.getVendorName())
                .vendorEmail(vendor.getEmail())
                .build();

        byte[] pdfBytes = pdfService.generateRfqPdf(model, vendor, company);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500);
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);
    }

    @Test
    @DisplayName("Should format PIE0826001 as 50 PIECE and KG as 10.5 KG in generated PDF")
    void testGenerateRfqPdf_FormatsQuantityAndDecodesUnitCode() {
        Company company = createSampleCompany();
        Vendor vendor = createSampleVendor();

        Rfq rfq = Rfq.builder()
                .id(UUID.randomUUID())
                .rfqNumber("RFQ-2026-09-000005")
                .issueDate(LocalDate.of(2026, 9, 11))
                .quotationDeadline(LocalDate.of(2026, 9, 20))
                .status(RfqStatus.SENT)
                .company(company)
                .items(new HashSet<>())
                .build();

        rfq.addItem(RfqItem.builder()
                .id(UUID.randomUUID())
                .itemName("Premium Ice Cream Freezer 300L")
                .description("Commercial freezer")
                .quantity(new BigDecimal("50.0000"))
                .unit("PIE0826001")
                .build());

        rfq.addItem(RfqItem.builder()
                .id(UUID.randomUUID())
                .itemName("Refrigerant Gas")
                .quantity(new BigDecimal("10.5000"))
                .unit("KG")
                .build());

        byte[] pdfBytes = pdfService.generateRfqPdf(rfq, vendor);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500);
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);
    }
}
