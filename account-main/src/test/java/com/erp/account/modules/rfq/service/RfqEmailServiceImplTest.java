package com.erp.account.modules.rfq.service;

import com.erp.account.common.service.EmailService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisition;
import com.erp.account.modules.purchaserequisition.repository.PurchaseRequisitionRepository;
import com.erp.account.modules.rfq.dto.RfqEmailDispatchResponse;
import com.erp.account.modules.rfq.entity.*;
import com.erp.account.modules.rfq.repository.RfqRepository;
import com.erp.account.modules.rfq.service.impl.RfqEmailServiceImpl;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RfqEmailServiceImplTest {

    @Mock
    private RfqRepository rfqRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private PurchaseRequisitionRepository purchaseRequisitionRepository;

    @Mock
    private RfqPdfService rfqPdfService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private RfqEmailServiceImpl rfqEmailService;

    private UUID companyId;
    private UUID rfqId;
    private UUID vendorId;
    private UUID prId;
    private Rfq rfq;
    private Vendor vendor;
    private Company company;
    private PurchaseRequisition pr;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        rfqId = UUID.randomUUID();
        vendorId = UUID.randomUUID();
        prId = UUID.randomUUID();

        company = Company.builder()
                .id(companyId)
                .companyName("Test Enterprise")
                .email("info@testcorp.com")
                .build();

        pr = PurchaseRequisition.builder()
                .id(prId)
                .requisitionNumber("PR-2026-09-000001")
                .build();

        vendor = Vendor.builder()
                .id(vendorId)
                .vendorName("Mohit kumar")
                .email("hm566339@gmail.com")
                .company(company)
                .build();

        rfq = Rfq.builder()
                .id(rfqId)
                .companyId(companyId)
                .rfqNumber("RFQ-2026-09-000002")
                .purchaseRequisitionId(prId)
                .purchaseRequisition(pr)
                .company(company)
                .status(RfqStatus.SENT)
                .issueDate(LocalDate.now())
                .quotationDeadline(LocalDate.now().plusDays(10))
                .vendors(new HashSet<>())
                .items(new HashSet<>())
                .build();

        RfqVendor rfqVendor = RfqVendor.builder()
                .id(UUID.randomUUID())
                .rfq(rfq)
                .vendorId(vendorId)
                .companyId(companyId)
                .responseStatus(RfqVendorResponseStatus.INVITED)
                .build();
        rfq.getVendors().add(rfqVendor);
    }

    @Test
    @DisplayName("Should successfully dispatch RFQ email with PurchaseRequisition and return emailsSentCount=1")
    void testDispatchRfqEmails_Success() {
        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

            when(rfqRepository.findForEmail(rfqId, companyId)).thenReturn(Optional.of(rfq));
            when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, companyId)).thenReturn(Optional.of(vendor));
            when(rfqPdfService.generateRfqPdf(eq(rfq), eq(vendor))).thenReturn(new byte[]{1, 2, 3});

            RfqEmailDispatchResponse response = rfqEmailService.dispatchRfqEmails(companyId, rfqId);

            assertNotNull(response);
            assertEquals(1, response.getEmailsSentCount());
            assertEquals(0, response.getEmailsFailedCount());
            assertEquals(0, response.getVendorsWithoutEmail());
            assertTrue(response.isEmailSent());
            assertEquals("SENT", response.getVendors().get(0).getStatus());

            verify(emailService, times(1)).sendEmailWithPdfAttachment(
                    eq("hm566339@gmail.com"),
                    contains("RFQ-2026-09-000002"),
                    anyString(),
                    any(byte[].class),
                    eq("RFQ-2026-09-000002.pdf")
            );
        }
    }

    @Test
    @DisplayName("Should fallback to load PurchaseRequisition via repository if null on entity")
    void testDispatchRfqEmails_FallbackLoadPurchaseRequisition() {
        rfq.setPurchaseRequisition(null);

        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

            when(rfqRepository.findForEmail(rfqId, companyId)).thenReturn(Optional.of(rfq));
            when(purchaseRequisitionRepository.findById(prId)).thenReturn(Optional.of(pr));
            when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, companyId)).thenReturn(Optional.of(vendor));
            when(rfqPdfService.generateRfqPdf(eq(rfq), eq(vendor))).thenReturn(new byte[]{1, 2, 3});

            RfqEmailDispatchResponse response = rfqEmailService.dispatchRfqEmails(companyId, rfqId);

            assertNotNull(response);
            assertEquals(1, response.getEmailsSentCount());
            assertEquals(0, response.getEmailsFailedCount());
            assertEquals(pr, rfq.getPurchaseRequisition());
            verify(purchaseRequisitionRepository, times(1)).findById(prId);
        }
    }

    @Test
    @DisplayName("Should capture failure and record emailsFailedCount=1 when template rendering or PDF generation fails")
    void testDispatchRfqEmails_WhenRenderingFails() {
        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

            when(rfqRepository.findForEmail(rfqId, companyId)).thenReturn(Optional.of(rfq));
            when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, companyId)).thenReturn(Optional.of(vendor));
            when(rfqPdfService.generateRfqPdf(eq(rfq), eq(vendor)))
                    .thenThrow(new RuntimeException("Failed to render RFQ template: Exception evaluating SpringEL expression"));

            RfqEmailDispatchResponse response = rfqEmailService.dispatchRfqEmails(companyId, rfqId);

            assertNotNull(response);
            assertEquals(0, response.getEmailsSentCount());
            assertEquals(1, response.getEmailsFailedCount());
            assertFalse(response.isEmailSent());
            assertEquals("FAILED", response.getVendors().get(0).getStatus());
            assertTrue(response.getVendors().get(0).getError().contains("Failed to render RFQ template"));

            verify(emailService, never()).sendEmailWithPdfAttachment(anyString(), anyString(), anyString(), any(byte[].class), anyString());
        }
    }
}
