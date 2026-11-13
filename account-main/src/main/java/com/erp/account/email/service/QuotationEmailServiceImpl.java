package com.erp.account.email.service;

import com.erp.account.common.service.EmailService;
import com.erp.account.email.dto.QuotationEmailData;
import com.erp.account.email.template.QuotationEmailTemplate;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.service.QuotationAcceptanceTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationEmailServiceImpl implements QuotationEmailService {

    private final EmailService emailService;
    private final QuotationAcceptanceTokenService tokenService;

    @Value("${frontend.base:${frontend.url:http://localhost:5173}}")
    private String frontendUrl;

    @Override
    public void sendQuotationEmail(Quotation quotation, byte[] pdfBytes) {
        sendQuotationEmail(quotation, pdfBytes, null);
    }

    @Override
    public void sendQuotationEmail(Quotation quotation, byte[] pdfBytes, String rawToken) {
        if (quotation == null) {
            log.warn("Cannot send email: Quotation is null");
            return;
        }

        Customer customer = quotation.getCustomer();
        if (customer == null || customer.getEmail() == null || customer.getEmail().trim().isEmpty()) {
            log.warn("Customer email is unavailable for quotation {}", quotation.getId());
            return;
        }

        Company company = quotation.getCompany();
        String companyName = (company != null && company.getCompanyName() != null) ? company.getCompanyName()
                : "Our Company";
        String customerName = (customer.getCustomerName() != null) ? customer.getCustomerName() : "Customer";

        QuotationEmailData.QuotationEmailDataBuilder dataBuilder = QuotationEmailData.builder()
                .customerName(customerName)
                .quotationNumber(quotation.getQuotationNumber())
                .quotationDate(quotation.getQuotationDate())
                .validUntil(quotation.getValidUntil())
                .totalAmount(quotation.getTotalAmount())
                .companyName(companyName);

        if (company != null) {
            dataBuilder.companyEmail(company.getEmail());
            dataBuilder.companyPhone(company.getPhone());
            dataBuilder.companyAddress(company.getAddressLine1());
            dataBuilder.companyLogo(company.getLogoUrl());
            dataBuilder.gstin(company.getGstin());
        }

        dataBuilder.referenceNumber(quotation.getReferenceNumber());
        dataBuilder.currency("INR");

        String token = StringUtils.hasText(rawToken) ? rawToken : tokenService.getOrCreateToken(quotation);
        String baseUrl = StringUtils.hasText(frontendUrl) ? frontendUrl.replaceAll("/$", "") : "http://localhost:5173";
        String acceptUrl = baseUrl + "/quotation/accept/" + token;
        dataBuilder.acceptUrl(acceptUrl);

        QuotationEmailData emailData = dataBuilder.build();

        String htmlBody = QuotationEmailTemplate.buildHtml(emailData);

        String subject = "Quotation " + quotation.getQuotationNumber() + " from " + companyName;
        String filename = "Quotation-" + quotation.getQuotationNumber() + ".pdf";

        emailService.sendHtmlEmailWithPdfAttachment(
                customer.getEmail().trim(),
                subject,
                htmlBody,
                pdfBytes,
                filename);
    }
}
