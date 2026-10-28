package com.erp.account.modules.salesinvoice.service.impl;

import com.erp.account.common.exception.SalesInvoiceNotFoundException;
import com.erp.account.modules.bankaccount.service.BankAccountService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.entity.CustomerAddress;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.modules.gst.entity.GstStateCode;
import com.erp.account.modules.gst.repository.GstRegistrationRepository;
import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.salesinvoice.service.SalesInvoicePdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.erp.account.util.AmountToWordsConverter;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.bankaccount.dto.response.InvoiceBankDetailsDto;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalesInvoicePdfServiceImpl implements SalesInvoicePdfService {

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final TemplateEngine templateEngine;
    private final GstStateCodeRepository gstStateCodeRepository;
    private final GstRegistrationRepository gstRegistrationRepository;
    private final BankAccountService bankAccountService;
    private final com.erp.account.common.service.GstCalculationService gstCalculationService;

    @Override
    @Transactional(readOnly = true)
    public byte[] generateSalesInvoicePdf(UUID invoiceId, UUID companyId) {
        SalesInvoice invoice = salesInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> SalesInvoiceNotFoundException.ofId(invoiceId));

        if (!TenantUtils.isSystemAdmin()) {
            UUID resolvedCompanyId = companyId != null ? companyId : TenantUtils.getCurrentCompanyId();
            if (resolvedCompanyId == null || !invoice.getCompanyId().equals(resolvedCompanyId)) {
                throw SalesInvoiceNotFoundException.ofId(invoiceId);
            }
        }

        return generatePdf(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generatePublicSalesInvoicePdf(UUID invoiceId) {
        SalesInvoice invoice = salesInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> SalesInvoiceNotFoundException.ofId(invoiceId));

        // Bypass company security check for public link
        return generatePdf(invoice);
    }

    private byte[] generatePdf(SalesInvoice invoice) {

        Company company = invoice.getCompany();
        Customer customer = invoice.getCustomer();

        // Resolve Company GST and State Code from GST Registration API (Database)
        String companyStateCode = "";
        String companyGstin = company.getGstin() != null ? company.getGstin() : "";

        try {
            Optional<GstRegistration> regOpt = gstRegistrationRepository
                    .findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(company.getId());

            if (regOpt.isPresent()) {
                GstRegistration reg = regOpt.get();
                if (reg.getGstin() != null && !reg.getGstin().isEmpty()) {
                    companyGstin = reg.getGstin();
                }
                if (reg.getStateCode() != null && reg.getStateCode().getStateCode() != null) {
                    companyStateCode = reg.getStateCode().getStateCode().trim();
                } else if (reg.getGstin() != null && reg.getGstin().length() >= 2) {
                    companyStateCode = reg.getGstin().substring(0, 2);
                }
            } else {
                // Fallback to extraction if no registration found
                if (companyGstin.length() >= 2) {
                    companyStateCode = companyGstin.substring(0, 2);
                }
            }
        } catch (Exception e) {
            if (companyGstin.length() >= 2) {
                companyStateCode = companyGstin.substring(0, 2);
            }
        }

        // Calculate and set isIntraState based on Company State Code and Place of Supply State Code
        boolean isIntraState = false;
        if (companyStateCode != null && !companyStateCode.isEmpty() && invoice.getPlaceOfSupplyStateCode() != null) {
            isIntraState = companyStateCode.equalsIgnoreCase(invoice.getPlaceOfSupplyStateCode().trim());
        }

        // Dynamically ensure item-level tax amounts are calculated for every line item
        if (invoice.getSalesInvoiceItems() != null) {
            final String finalCompanyStateCode = companyStateCode;
            for (SalesInvoiceItem item : invoice.getSalesInvoiceItems()) {
                if (!Boolean.TRUE.equals(item.getIsDeleted())) {
                    try {
                        gstCalculationService.calculateItemTaxes(item, company, invoice,
                                item.getHsnSacMaster(), finalCompanyStateCode);
                    } catch (Exception ex) {
                        log.warn("[PDF] Failed to recalculate tax for item {}: {}", item.getId(), ex.getMessage());
                    }
                }
            }
        }

        // Log every item's values as requested for debug verification
        if (invoice.getSalesInvoiceItems() != null) {
            for (SalesInvoiceItem item : invoice.getSalesInvoiceItems()) {
                if (!Boolean.TRUE.equals(item.getIsDeleted())) {
                    log.info("[PDF Item Verification] Item: id={}, Name='{}', HSN={}, Taxable Amount={}, CGST Rate={}, CGST Amount={}, SGST Rate={}, SGST Amount={}, IGST Rate={}, IGST Amount={}, Total={}",
                            item.getId(),
                            item.getItemName(),
                            item.getHsnSacMaster() != null ? item.getHsnSacMaster().getCode() : "null",
                            item.getTaxableAmount(),
                            item.getHsnSacMaster() != null && item.getHsnSacMaster().getGstSlab() != null ? item.getHsnSacMaster().getGstSlab().getCgstRate() : "0",
                            item.getCgstAmount(),
                            item.getHsnSacMaster() != null && item.getHsnSacMaster().getGstSlab() != null ? item.getHsnSacMaster().getGstSlab().getSgstRate() : "0",
                            item.getSgstAmount(),
                            item.getHsnSacMaster() != null && item.getHsnSacMaster().getGstSlab() != null ? item.getHsnSacMaster().getGstSlab().getIgstRate() : "0",
                            item.getIgstAmount(),
                            item.getTotalAmount());
                }
            }
        }

        Context context = new Context();
        context.setVariable("invoice", invoice);
        context.setVariable("company", company);
        context.setVariable("customer", customer);
        context.setVariable("items", invoice.getSalesInvoiceItems());

        BigDecimal totalQty = invoice.getSalesInvoiceItems().stream()
                .map(item -> item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        context.setVariable("totalQuantity", totalQty);

        context.setVariable("amountInWords",
                AmountToWordsConverter.convertAmountToWords(invoice.getTotalAmount()));

        context.setVariable("companyStateCode", companyStateCode);
        context.setVariable("companyGstin", companyGstin);
        context.setVariable("isIntraState", isIntraState);

        // Resolve Customer State Code from billing snapshot or customer address
        String customerStateCode = invoice.getBillingStateCode();
        if (customerStateCode == null || customerStateCode.trim().isEmpty()) {
            // Fallback to customer address GstState (NOT GSTIN prefix)
            if (customer.getAddresses() != null && !customer.getAddresses().isEmpty()) {
                CustomerAddress defaultAddr = customer.getAddresses().stream()
                        .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                        .findFirst()
                        .orElse(customer.getAddresses().get(0));
                customerStateCode = defaultAddr.getGstState() != null ? defaultAddr.getGstState().getStateCode() : "";
            } else {
                customerStateCode = "";
            }
        }
        context.setVariable("customerStateCode", customerStateCode);

        // Resolve Place of Supply Name
        String placeOfSupplyName = "";
        if (invoice.getPlaceOfSupplyStateId() != null) {
            GstStateCode posState = gstStateCodeRepository
                    .findById(invoice.getPlaceOfSupplyStateId()).orElse(null);
            if (posState != null) {
                placeOfSupplyName = posState.getStateName();
            }
        }
        context.setVariable("placeOfSupplyName", placeOfSupplyName);

        // Pre-compute per-tax-type totals from items (guaranteed = SUM of item amounts)
        BigDecimal totalCgst = invoice.getSalesInvoiceItems().stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .map(item -> item.getCgstAmount() != null ? item.getCgstAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSgst = invoice.getSalesInvoiceItems().stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .map(item -> item.getSgstAmount() != null ? item.getSgstAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalIgst = invoice.getSalesInvoiceItems().stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .map(item -> item.getIgstAmount() != null ? item.getIgstAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        context.setVariable("totalCgst", totalCgst);
        context.setVariable("totalSgst", totalSgst);
        context.setVariable("totalIgst", totalIgst);

        log.info("[PDF Summary] invoiceId={} isIntraState={} totalCgst={} totalSgst={} totalIgst={}",
                invoice.getId(), isIntraState, totalCgst, totalSgst, totalIgst);

        // Bill To Resolution
        String billAddress = invoice.getBillingAddressLine1() != null
                && !invoice.getBillingAddressLine1().trim().isEmpty() ? invoice.getBillingAddressLine1()
                        : com.erp.account.util.CustomerAddressUtils.getAddressLine1(customer);
        String billCity = invoice.getBillingCity() != null && !invoice.getBillingCity().trim().isEmpty()
                ? invoice.getBillingCity()
                : com.erp.account.util.CustomerAddressUtils.getCity(customer);
        String billState = invoice.getBillingState() != null && !invoice.getBillingState().trim().isEmpty()
                ? invoice.getBillingState()
                : com.erp.account.util.CustomerAddressUtils.getState(customer);
        String billCountry = invoice.getBillingCountry() != null && !invoice.getBillingCountry().trim().isEmpty()
                ? invoice.getBillingCountry()
                : com.erp.account.util.CustomerAddressUtils.getCountry(customer);

        // Ship To Resolution
        String shipAddress = invoice.getDeliveryAddressLine1() != null
                && !invoice.getDeliveryAddressLine1().trim().isEmpty() ? invoice.getDeliveryAddressLine1()
                        : com.erp.account.util.CustomerAddressUtils.getAddressLine1(customer);
        String shipCity = invoice.getDeliveryCity() != null && !invoice.getDeliveryCity().trim().isEmpty()
                ? invoice.getDeliveryCity()
                : com.erp.account.util.CustomerAddressUtils.getCity(customer);
        String shipState = invoice.getDeliveryState() != null && !invoice.getDeliveryState().trim().isEmpty()
                ? invoice.getDeliveryState()
                : com.erp.account.util.CustomerAddressUtils.getState(customer);
        String shipCountry = invoice.getDeliveryCountry() != null && !invoice.getDeliveryCountry().trim().isEmpty()
                ? invoice.getDeliveryCountry()
                : com.erp.account.util.CustomerAddressUtils.getCountry(customer);

        String shipPostalCode = invoice.getDeliveryPostalCode();
        if (customer.getAddresses() != null && !customer.getAddresses().isEmpty()) {
            CustomerAddress defaultAddr = customer.getAddresses().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                    .findFirst()
                    .orElse(customer.getAddresses().get(0));
            if (shipPostalCode == null || shipPostalCode.trim().isEmpty()) {
                shipPostalCode = defaultAddr.getPostalCode();
            }
            if (billState == null || billState.trim().isEmpty()) {
                billState = defaultAddr.getGstState() != null ? defaultAddr.getGstState().getStateName() : null;
            }
            if (shipState == null || shipState.trim().isEmpty()) {
                shipState = defaultAddr.getGstState() != null ? defaultAddr.getGstState().getStateName() : null;
            }
        }

        context.setVariable("billAddress", billAddress);
        context.setVariable("billCity", billCity);
        context.setVariable("billState", billState);
        context.setVariable("billCountry", billCountry);

        context.setVariable("shipAddress", shipAddress);
        context.setVariable("shipCity", shipCity);
        context.setVariable("shipState", shipState);
        context.setVariable("shipCountry", shipCountry);
        context.setVariable("shipPostalCode", shipPostalCode);

        // E-Invoice attributes and QR Code (Rule 48(4))
        String qrData;
        boolean hasGenuineIrn = StringUtils.hasText(invoice.getIrn());
        boolean isMock = Boolean.TRUE.equals(invoice.getIsMockEinvoice());

        if (StringUtils.hasText(invoice.getSignedQrCode())) {
            qrData = invoice.getSignedQrCode();
        } else {
            qrData = "Invoice: " + invoice.getInvoiceNumber() + ", Date: " + invoice.getInvoiceDate();
        }

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

        context.setVariable("irn", invoice.getIrn());
        context.setVariable("ackNo", invoice.getAckNo());
        context.setVariable("ackDate", invoice.getAckDate());
        context.setVariable("hasGenuineIrn", hasGenuineIrn);
        context.setVariable("isMockEinvoice", isMock);
        context.setVariable("einvoiceStatus", invoice.getEinvoiceStatus() != null ? invoice.getEinvoiceStatus().name() : null);

        // Fetch Bank Details
        try {
            InvoiceBankDetailsDto bankDetails = bankAccountService
                    .getInvoiceBankDetails(company.getId());
            context.setVariable("bankAccount", bankDetails);
        } catch (Exception e) {
            context.setVariable("bankAccount", null);
        }

        String html = templateEngine.process("invoice-template", context);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }
}
