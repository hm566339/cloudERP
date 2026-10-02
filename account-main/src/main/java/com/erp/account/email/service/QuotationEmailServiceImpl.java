package com.erp.account.email.service;

import com.erp.account.common.service.EmailService;
import com.erp.account.email.dto.QuotationEmailData;
import com.erp.account.email.template.QuotationEmailTemplate;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.quotation.entity.Quotation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.erp.account.modules.quotation.service.QuotationAcceptanceTokenService;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationEmailServiceImpl implements QuotationEmailService {

    private final EmailService emailService;
    private final QuotationAcceptanceTokenService tokenService;

    @Value("${frontend.base}")
    private String frontendUrl;

    @Override
    public void sendQuotationEmail(Quotation quotation, byte[] pdfBytes) {
        if (quotation == null) {
            log.warn("Cannot send email: Quotation is null");
            return;
        }

        Customer customer = quotation.getCustomer();
        if (customer == null || customer.getEmail() == null || customer.getEmail().trim().isEmpty()) {
            log.warn("Customer email is unavailable for quotation {}", quotation.getId());
            return; // Requirements state we should simply log and skip if email is missing
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

        String token = tokenService.generateToken(quotation);
        String acceptUrl = frontendUrl.replaceAll("/$", "") + "/quotation/accept/" + token;
        dataBuilder.acceptUrl(acceptUrl);

        QuotationEmailData emailData = dataBuilder.build();

        String htmlBody = QuotationEmailTemplate.buildHtml(emailData);

        String subject = "Quotation " + quotation.getQuotationNumber() + " from " + companyName;
        String filename = "Quotation-" + quotation.getQuotationNumber() + ".pdf";

        // Send actual email using the generic email service
        emailService.sendHtmlEmailWithPdfAttachment(
                customer.getEmail().trim(),
                subject,
                htmlBody,
                pdfBytes,
                filename);
    }
}
