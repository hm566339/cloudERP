package com.erp.account.modules.rfq.service.impl;

import com.erp.account.common.exception.InternalServerException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.rfq.entity.Rfq;
import com.erp.account.modules.rfq.service.RfqPdfService;
import com.erp.account.modules.vendor.entity.Vendor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;

import com.erp.account.modules.unit.service.UnitService;
import org.springframework.beans.factory.annotation.Autowired;

@Slf4j
@Service
public class RfqPdfServiceImpl implements RfqPdfService {

    private final TemplateEngine templateEngine;
    private final UnitService unitService;

    @Autowired
    public RfqPdfServiceImpl(TemplateEngine templateEngine, UnitService unitService) {
        this.templateEngine = templateEngine;
        this.unitService = unitService;
    }

    public RfqPdfServiceImpl(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
        this.unitService = null;
    }

    @Override
    public byte[] generateRfqPdf(Rfq rfq, Vendor vendor) {
        if (rfq == null) {
            throw new IllegalArgumentException("RFQ cannot be null for PDF generation");
        }
        if (vendor == null) {
            throw new IllegalArgumentException("Vendor cannot be null for PDF generation");
        }

        Company company = rfq.getCompany();
        com.erp.account.modules.rfq.dto.RfqEmailModel model = com.erp.account.modules.rfq.dto.RfqEmailModel.from(rfq, vendor, company, unitService);
        return generateRfqPdf(model, vendor, company);
    }

    @Override
    public byte[] generateRfqPdf(com.erp.account.modules.rfq.dto.RfqEmailModel model, Vendor vendor, Company company) {
        if (model == null) {
            throw new IllegalArgumentException("RFQ model cannot be null for PDF generation");
        }
        if (vendor == null) {
            throw new IllegalArgumentException("Vendor cannot be null for PDF generation");
        }

        Context context = new Context();
        context.setVariable("rfq", model);
        context.setVariable("vendor", vendor);
        context.setVariable("company", company);

        String html;
        try {
            html = templateEngine.process("rfq-template", context);
        } catch (Exception e) {
            log.error("RFQ email rendering failed\nRFQ ID: {}\nRFQ Number: {}\nVendor ID: {}\nVendor Email: {}\nTemplate: rfq-template\nReason: {}",
                    model.getRfqId(), model.getRfqNumber(), vendor.getId(), vendor.getEmail(), e.getMessage(), e);
            throw new InternalServerException("Failed to render RFQ template: " + e.getMessage(), e);
        }

        if (html == null || html.trim().isEmpty()) {
            log.error("Generated HTML was empty for RFQ {}", model.getRfqNumber());
            throw new InternalServerException("Generated RFQ HTML is empty");
        }

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(outputStream);

            byte[] pdfBytes = outputStream.toByteArray();
            if (pdfBytes == null || pdfBytes.length == 0) {
                log.error("Generated PDF byte array was empty for RFQ {}", model.getRfqNumber());
                throw new InternalServerException("Generated RFQ PDF is empty");
            }

            log.info("Successfully generated RFQ PDF for RFQ: {}, vendor: {}, size: {} bytes",
                    model.getRfqNumber(), vendor.getVendorName(), pdfBytes.length);
            return pdfBytes;
        } catch (Exception e) {
            log.error("Error generating RFQ PDF via ITextRenderer for RFQ {}: {}", model.getRfqNumber(), e.getMessage(), e);
            throw new InternalServerException("Error generating RFQ PDF: " + e.getMessage(), e);
        }
    }
}
