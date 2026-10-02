package com.erp.account.modules.apinvoice.service.impl;

import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.apinvoice.service.ApInvoicePdfService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;

import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApInvoicePdfServiceImpl implements ApInvoicePdfService {

    private final ApInvoiceRepository apInvoiceRepository;
    private final TemplateEngine templateEngine;
    private final GstStateCodeRepository gstStateCodeRepository;
    private final HsnSacMasterRepository hsnSacMasterRepository;
    private final com.erp.account.modules.gst.repository.GstRegistrationRepository gstRegistrationRepository;


    @Override
    @Transactional(readOnly = true)
    public byte[] generateApInvoicePdf(UUID invoiceId, UUID companyId) {
        ApInvoice invoice = apInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase invoice not found with id: " + invoiceId));
        
        if (!TenantUtils.isSystemAdmin()) {
            UUID resolvedCompanyId = companyId != null ? companyId : TenantUtils.getCurrentCompanyId();
            if (resolvedCompanyId == null || !invoice.getCompany().getId().equals(resolvedCompanyId)) {
                throw new ResourceNotFoundException("Purchase invoice not found with id: " + invoiceId);
            }
        }

        return generatePdf(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generatePublicApInvoicePdf(UUID invoiceId) {
        ApInvoice invoice = apInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase invoice not found with id: " + invoiceId));
        
        // Bypass company security check for public link
        return generatePdf(invoice);
    }

    private byte[] generatePdf(ApInvoice invoice) {

        Company company = invoice.getCompany();
        Vendor vendor = invoice.getVendor();

        Context context = new Context();
        context.setVariable("invoice", invoice);
        context.setVariable("company", company);
        context.setVariable("vendor", vendor);
        context.setVariable("items", invoice.getItems());
        context.setVariable("amountInWords", com.erp.account.util.AmountToWordsConverter.convertAmountToWords(invoice.getTotalAmount()));

        // Resolve Company GST and State Code from GST Registration API (Database)
        String companyStateCode = "";
        String companyGstin = company.getGstin() != null ? company.getGstin() : "";
        
        try {
            java.util.Optional<com.erp.account.modules.gst.entity.GstRegistration> regOpt = gstRegistrationRepository
                    .findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(company.getId());
            
            if (regOpt.isPresent()) {
                com.erp.account.modules.gst.entity.GstRegistration reg = regOpt.get();
                if (reg.getGstin() != null && !reg.getGstin().isEmpty()) {
                    companyGstin = reg.getGstin();
                }
                if (reg.getStateCode() != null && reg.getStateCode().getStateCode() != null) {
                    companyStateCode = reg.getStateCode().getStateCode();
                }
            } else {
                if (companyGstin.length() >= 2) {
                    companyStateCode = companyGstin.substring(0, 2);
                }
            }
        } catch (Exception e) {
            if (companyGstin.length() >= 2) {
                companyStateCode = companyGstin.substring(0, 2);
            }
        }

        context.setVariable("companyStateCode", companyStateCode);
        context.setVariable("companyGstin", companyGstin);

        // Resolve Place of Supply State Name
        String posStateName = null;
        if (invoice.getPlaceOfSupplyStateCode() != null) {
            posStateName = gstStateCodeRepository.findByStateCodeAndIsDeletedFalse(invoice.getPlaceOfSupplyStateCode())
                    .map(state -> state.getStateName())
                    .orElse(null);
        }
        context.setVariable("placeOfSupplyStateName", posStateName);

        // Determine if Intra-State (CGST+SGST) or Inter-State (IGST)
        boolean isIntraState = false;
        if (companyStateCode != null && !companyStateCode.trim().isEmpty() && 
            invoice.getPlaceOfSupplyStateCode() != null && !invoice.getPlaceOfSupplyStateCode().trim().isEmpty()) {
            isIntraState = companyStateCode.equals(invoice.getPlaceOfSupplyStateCode());
        }
        context.setVariable("isIntraState", isIntraState);

        // Resolve HSN Codes
        Map<UUID, String> itemHsnMap = new HashMap<>();
        if (invoice.getItems() != null) {
            for (var item : invoice.getItems()) {
                if (item.getHsnSacId() != null) {
                    hsnSacMasterRepository.findById(item.getHsnSacId()).ifPresent(hsn -> {
                        itemHsnMap.put(item.getId(), hsn.getCode());
                    });
                }
            }
        }
        context.setVariable("itemHsnMap", itemHsnMap);

        
        // Generate QR Code
        String qrData = "Invoice: " + invoice.getInvoiceNo() + ", Date: " + invoice.getInvoiceDate();
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrData, BarcodeFormat.QR_CODE, 150, 150);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            String base64Qr = Base64.getEncoder().encodeToString(pngOutputStream.toByteArray());
            context.setVariable("qrCodeImage", "data:image/png;base64," + base64Qr);
        } catch (Exception e) {
            context.setVariable("qrCodeImage", null);
        }

        String html = templateEngine.process("ap-invoice-template", context);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new com.erp.account.common.exception.BusinessException("Error generating AP Invoice PDF", e);
        }
    }
}
