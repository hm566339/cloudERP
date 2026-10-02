package com.erp.account.modules.rfq.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.service.EmailService;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.purchaserequisition.repository.PurchaseRequisitionRepository;
import com.erp.account.modules.rfq.dto.RfqEmailDispatchResponse;
import com.erp.account.modules.rfq.dto.RfqEmailVendorResult;
import com.erp.account.modules.rfq.entity.Rfq;
import com.erp.account.modules.rfq.entity.RfqStatus;
import com.erp.account.modules.rfq.entity.RfqVendor;
import com.erp.account.modules.rfq.entity.RfqVendorResponseStatus;
import com.erp.account.modules.rfq.repository.RfqRepository;
import com.erp.account.modules.rfq.service.RfqEmailService;
import com.erp.account.modules.rfq.service.RfqPdfService;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class RfqEmailServiceImpl implements RfqEmailService {

    private final RfqRepository rfqRepository;
    private final VendorRepository vendorRepository;
    private final CompanyRepository companyRepository;
    private final PurchaseRequisitionRepository purchaseRequisitionRepository;
    private final RfqPdfService rfqPdfService;
    private final EmailService emailService;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    @Override
    @Transactional
    public RfqEmailDispatchResponse dispatchRfqEmails(UUID companyId, UUID rfqId) {
        log.info("RFQ email dispatch started\nRFQ ID: {}", rfqId);
        UUID company = TenantUtils.resolveCompanyId(companyId);

        Rfq rfq = rfqRepository.findForEmail(rfqId, company)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found: " + rfqId));

        if (rfq.getStatus() == RfqStatus.CLOSED || rfq.getStatus() == RfqStatus.CANCELLED) {
            throw new BadRequestException("Emails cannot be dispatched for " + rfq.getStatus() + " RFQs");
        }

        // Initialize lazy collections inside transaction
        if (rfq.getItems() != null) {
            rfq.getItems().size();
        }
        if (rfq.getVendors() != null) {
            rfq.getVendors().size();
        }

        if (rfq.getVendors() == null || rfq.getVendors().isEmpty()) {
            throw new BadRequestException("At least one vendor is required to send the RFQ");
        }

        // Ensure purchase requisition is loaded on RFQ for template rendering
        if (rfq.getPurchaseRequisition() == null && rfq.getPurchaseRequisitionId() != null) {
            rfq.setPurchaseRequisition(purchaseRequisitionRepository.findById(rfq.getPurchaseRequisitionId()).orElse(null));
        }

        // Ensure company is loaded on RFQ for PDF generation
        if (rfq.getCompany() == null && rfq.getCompanyId() != null) {
            rfq.setCompany(companyRepository.findById(rfq.getCompanyId()).orElse(null));
        }

        String companyName = (rfq.getCompany() != null && rfq.getCompany().getCompanyName() != null)
                ? rfq.getCompany().getCompanyName()
                : "Our Company";

        int emailsSentCount = 0;
        int emailsFailedCount = 0;
        int vendorsWithoutEmail = 0;

        List<RfqEmailVendorResult> vendorResults = new ArrayList<>();

        for (RfqVendor rfqVendor : rfq.getVendors()) {
            Vendor vendor = vendorRepository.findByIdAndCompanyIdAndNotDeleted(rfqVendor.getVendorId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found: " + rfqVendor.getVendorId()));

            String vendorEmail = vendor.getEmail();

            log.info("\nVendor ID: {}\nVendor Name: {}\nVendor Email: {}", vendor.getId(), vendor.getVendorName(), vendorEmail);

            if (vendorEmail == null || vendorEmail.trim().isEmpty() || !EMAIL_PATTERN.matcher(vendorEmail.trim()).matches()) {
                log.info("Vendor '{}' ({}) has no valid email address — skipping email for RFQ {}",
                        vendor.getVendorName(), vendor.getId(), rfq.getRfqNumber());
                vendorsWithoutEmail++;
                vendorResults.add(RfqEmailVendorResult.builder()
                        .vendorId(vendor.getId())
                        .vendorName(vendor.getVendorName())
                        .email(vendorEmail)
                        .status("NO_EMAIL")
                        .error("Vendor email is missing or invalid")
                        .build());
                continue;
            }

            try {
                log.info("PDF generation started");
                byte[] pdfBytes = rfqPdfService.generateRfqPdf(rfq, vendor);
                log.info("PDF generation completed");

                String subject = "Request for Quotation - " + rfq.getRfqNumber();
                
                String quotationDeadlineStr = rfq.getQuotationDeadline() != null ? rfq.getQuotationDeadline().format(DATE_FORMATTER) : "Not Specified";
                String expectedDeliveryStr = rfq.getExpectedDeliveryDate() != null ? rfq.getExpectedDeliveryDate().format(DATE_FORMATTER) : "Not Specified";
                
                String body = String.format(
                        "Dear %s,\n\n" +
                        "Please find attached the Request for Quotation (%s).\n\n" +
                        "Quotation Deadline: %s\n" +
                        "Expected Delivery Date: %s\n\n" +
                        "Please review the RFQ and submit your quotation within the specified deadline.\n\n" +
                        "Regards,\n" +
                        "%s",
                        vendor.getVendorName() != null ? vendor.getVendorName() : "Vendor",
                        rfq.getRfqNumber(),
                        quotationDeadlineStr,
                        expectedDeliveryStr,
                        companyName);
                
                String filename = rfq.getRfqNumber() + ".pdf";
                
                log.info("Email sending started\nRecipient: {}", vendorEmail.trim());
                emailService.sendEmailWithPdfAttachment(vendorEmail.trim(), subject, body, pdfBytes, filename);
                log.info("Email sending completed");

                rfqVendor.setInvitedAt(LocalDateTime.now());
                rfqVendor.setResponseStatus(RfqVendorResponseStatus.INVITED);
                rfqRepository.save(rfq); // Save the timestamp update immediately
                
                emailsSentCount++;
                vendorResults.add(RfqEmailVendorResult.builder()
                        .vendorId(vendor.getId())
                        .vendorName(vendor.getVendorName())
                        .email(vendorEmail.trim())
                        .status("SENT")
                        .build());

            } catch (Exception ex) {
                log.error("RFQ email rendering failed\nRFQ ID: {}\nRFQ Number: {}\nVendor ID: {}\nVendor Email: {}\nTemplate: rfq-template\nReason: {}",
                        rfqId, rfq.getRfqNumber(), vendor.getId(), vendorEmail, ex.getMessage(), ex);
                emailsFailedCount++;
                vendorResults.add(RfqEmailVendorResult.builder()
                        .vendorId(vendor.getId())
                        .vendorName(vendor.getVendorName())
                        .email(vendorEmail.trim())
                        .status("FAILED")
                        .error(ex.getMessage() != null ? ex.getMessage() : "SMTP or PDF generation failed")
                        .build());
            }
        }

        return RfqEmailDispatchResponse.builder()
                .rfqId(rfq.getId())
                .rfqNumber(rfq.getRfqNumber())
                .emailsSentCount(emailsSentCount)
                .emailsFailedCount(emailsFailedCount)
                .vendorsWithoutEmail(vendorsWithoutEmail)
                .emailSent(emailsSentCount > 0)
                .vendors(vendorResults)
                .build();
    }
}
