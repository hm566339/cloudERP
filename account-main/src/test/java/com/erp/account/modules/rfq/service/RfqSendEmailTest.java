// package com.erp.account.modules.rfq.service;

// import com.erp.account.common.exception.BadRequestException;
// import com.erp.account.common.exception.ResourceNotFoundException;
// import com.erp.account.common.service.EmailService;
// import com.erp.account.modules.company.entity.Company;
// import com.erp.account.modules.company.repository.CompanyRepository;
// import
// com.erp.account.modules.purchaserequisition.repository.PurchaseRequisitionRepository;
// import com.erp.account.modules.rfq.dto.RfqSendResponse;
// import com.erp.account.modules.rfq.entity.*;
// import com.erp.account.modules.rfq.repository.RfqRepository;
// import com.erp.account.modules.rfq.service.impl.RfqServiceImpl;
// import com.erp.account.modules.vendor.entity.Vendor;
// import com.erp.account.modules.vendor.repository.VendorRepository;
// import
// com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
// import com.erp.account.util.TenantUtils;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.DisplayName;
// import org.junit.jupiter.api.Test;
// import org.junit.jupiter.api.extension.ExtendWith;
// import org.mockito.InjectMocks;
// import org.mockito.Mock;
// import org.mockito.MockedStatic;
// import org.mockito.Mockito;
// import org.mockito.junit.jupiter.MockitoExtension;

// import java.time.LocalDate;
// import java.util.ArrayList;
// import java.util.Optional;
// import java.util.UUID;

// import static org.junit.jupiter.api.Assertions.*;
// import static org.mockito.ArgumentMatchers.*;
// import static org.mockito.Mockito.*;

// @ExtendWith(MockitoExtension.class)
// public class RfqSendEmailTest {

// @Mock private RfqRepository repository;
// @Mock private PurchaseRequisitionRepository requisitionRepository;
// @Mock private VendorRepository vendorRepository;
// @Mock private CompanyRepository companyRepository;
// @Mock private VoucherSequenceService sequence;
// @Mock private RfqPdfService rfqPdfService;
// @Mock private EmailService emailService;

// @InjectMocks
// private RfqServiceImpl rfqService;

// private UUID companyId;
// private UUID rfqId;
// private UUID vendorId;
// private Rfq rfq;
// private Vendor vendor;
// private Company company;

// @BeforeEach
// void setUp() {
// companyId = UUID.randomUUID();
// rfqId = UUID.randomUUID();
// vendorId = UUID.randomUUID();

// company = Company.builder()
// .id(companyId)
// .companyName("Acme Corp")
// .email("procurement@acme.com")
// .build();

// vendor = Vendor.builder()
// .id(vendorId)
// .company(company)
// .vendorName("Global Tech Supplies")
// .vendorCode("VEND001")
// .email("contact@globaltech.com")
// .build();

// rfq = Rfq.builder()
// .id(rfqId)
// .companyId(companyId)
// .company(company)
// .rfqNumber("RFQ-2026-09-000001")
// .purchaseRequisitionId(UUID.randomUUID())
// .issueDate(LocalDate.now())
// .status(RfqStatus.DRAFT)
// .items(new ArrayList<>())
// .vendors(new ArrayList<>())
// .build();

// RfqVendor rfqVendor = RfqVendor.builder()
// .id(UUID.randomUUID())
// .companyId(companyId)
// .vendorId(vendorId)
// .rfq(rfq)
// .responseStatus(RfqVendorResponseStatus.INVITED)
// .build();
// rfq.getVendors().add(rfqVendor);
// }

// // ================================================================
// // CASE 1: Valid vendor email → RFQ SENT + emailSent=true
// // ================================================================
// @Test
// @DisplayName("Valid vendor email → RFQ SENT + email sent successfully")
// void testSendRfq_ValidEmail_Success() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// when(repository.findForUpdate(rfqId,
// companyId)).thenReturn(Optional.of(rfq));
// when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId,
// companyId)).thenReturn(Optional.of(vendor));
// when(rfqPdfService.generateRfqPdf(eq(rfq), eq(vendor))).thenReturn(new
// byte[]{1, 2, 3});
// when(repository.save(any(Rfq.class))).thenAnswer(inv -> inv.getArgument(0));

// RfqSendResponse response = rfqService.send(companyId, rfqId);

// assertNotNull(response);
// assertEquals(RfqStatus.SENT, response.getRfq().getStatus());
// assertTrue(response.isEmailSent());
// assertEquals(1, response.getEmailsSentCount());
// assertEquals(0, response.getEmailsFailedCount());
// assertEquals(0, response.getVendorsWithoutEmail());
// assertTrue(response.getMessage().contains("email sent successfully"));

// verify(emailService, times(1)).sendEmailWithPdfAttachment(
// eq("contact@globaltech.com"),
// contains("RFQ-2026-09-000001"),
// contains("Acme Corp"),
// any(byte[].class),
// eq("RFQ-2026-09-000001.pdf")
// );

// assertNotNull(rfq.getVendors().get(0).getInvitedAt());
// }
// }

// // ================================================================
// // CASE 2: Vendor email null → RFQ SENT + emailSent=false
// // ================================================================
// @Test
// @DisplayName("Vendor email null → RFQ SENT, no email attempted")
// void testSendRfq_NullEmail_StillSent() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// vendor.setEmail(null);

// when(repository.findForUpdate(rfqId,
// companyId)).thenReturn(Optional.of(rfq));
// when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId,
// companyId)).thenReturn(Optional.of(vendor));
// when(repository.save(any(Rfq.class))).thenAnswer(inv -> inv.getArgument(0));

// RfqSendResponse response = rfqService.send(companyId, rfqId);

// assertEquals(RfqStatus.SENT, response.getRfq().getStatus());
// assertFalse(response.isEmailSent());
// assertEquals(0, response.getEmailsSentCount());
// assertEquals(1, response.getVendorsWithoutEmail());
// assertTrue(response.getMessage().contains("not available"));

// verifyNoInteractions(emailService);
// verifyNoInteractions(rfqPdfService);
// }
// }

// // ================================================================
// // CASE 3: Vendor email blank → RFQ SENT + emailSent=false
// // ================================================================
// @Test
// @DisplayName("Vendor email blank → RFQ SENT, no email attempted")
// void testSendRfq_BlankEmail_StillSent() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// vendor.setEmail(" ");

// when(repository.findForUpdate(rfqId,
// companyId)).thenReturn(Optional.of(rfq));
// when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId,
// companyId)).thenReturn(Optional.of(vendor));
// when(repository.save(any(Rfq.class))).thenAnswer(inv -> inv.getArgument(0));

// RfqSendResponse response = rfqService.send(companyId, rfqId);

// assertEquals(RfqStatus.SENT, response.getRfq().getStatus());
// assertFalse(response.isEmailSent());
// assertEquals(0, response.getEmailsSentCount());
// assertEquals(1, response.getVendorsWithoutEmail());

// verifyNoInteractions(emailService);
// }
// }

// // ================================================================
// // CASE 4: Invalid vendor email → RFQ SENT + emailSent=false
// // ================================================================
// @Test
// @DisplayName("Invalid vendor email → RFQ SENT, email skipped")
// void testSendRfq_InvalidEmail_StillSent() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// vendor.setEmail("not-an-email");

// when(repository.findForUpdate(rfqId,
// companyId)).thenReturn(Optional.of(rfq));
// when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId,
// companyId)).thenReturn(Optional.of(vendor));
// when(repository.save(any(Rfq.class))).thenAnswer(inv -> inv.getArgument(0));

// RfqSendResponse response = rfqService.send(companyId, rfqId);

// assertEquals(RfqStatus.SENT, response.getRfq().getStatus());
// assertFalse(response.isEmailSent());
// assertEquals(0, response.getEmailsSentCount());
// assertEquals(1, response.getVendorsWithoutEmail());

// verifyNoInteractions(emailService);
// }
// }

// // ================================================================
// // CASE 5: Email sending failure → RFQ SENT + emailSent=false
// // ================================================================
// @Test
// @DisplayName("Email sending fails → RFQ still SENT, emailSent=false")
// void testSendRfq_EmailFailure_StillSent() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// when(repository.findForUpdate(rfqId,
// companyId)).thenReturn(Optional.of(rfq));
// when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId,
// companyId)).thenReturn(Optional.of(vendor));
// when(rfqPdfService.generateRfqPdf(eq(rfq), eq(vendor))).thenReturn(new
// byte[]{1, 2, 3});
// doThrow(new RuntimeException("SMTP connection refused")).when(emailService)
// .sendEmailWithPdfAttachment(anyString(), anyString(), anyString(),
// any(byte[].class), anyString());
// when(repository.save(any(Rfq.class))).thenAnswer(inv -> inv.getArgument(0));

// RfqSendResponse response = rfqService.send(companyId, rfqId);

// // RFQ must still be SENT
// assertEquals(RfqStatus.SENT, response.getRfq().getStatus());
// assertFalse(response.isEmailSent());
// assertEquals(0, response.getEmailsSentCount());
// assertEquals(1, response.getEmailsFailedCount());
// assertTrue(response.getMessage().contains("could not be sent"));
// }
// }

// // ================================================================
// // CASE 6: Multiple vendors with mixed email availability
// // ================================================================
// @Test
// @DisplayName("Multiple vendors: one valid email, one null, one invalid → RFQ
// SENT, process all")
// void testSendRfq_MultipleVendors_MixedEmails() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// // Vendor 1: valid email
// UUID vendorId1 = UUID.randomUUID();
// Vendor vendor1 = Vendor.builder().id(vendorId1).company(company)
// .vendorName("Vendor One").vendorCode("V1").email("v1@test.com").build();
// RfqVendor rv1 =
// RfqVendor.builder().id(UUID.randomUUID()).companyId(companyId)
// .vendorId(vendorId1).rfq(rfq).responseStatus(RfqVendorResponseStatus.INVITED).build();

// // Vendor 2: null email
// UUID vendorId2 = UUID.randomUUID();
// Vendor vendor2 = Vendor.builder().id(vendorId2).company(company)
// .vendorName("Vendor Two").vendorCode("V2").email(null).build();
// RfqVendor rv2 =
// RfqVendor.builder().id(UUID.randomUUID()).companyId(companyId)
// .vendorId(vendorId2).rfq(rfq).responseStatus(RfqVendorResponseStatus.INVITED).build();

// // Vendor 3: invalid email
// UUID vendorId3 = UUID.randomUUID();
// Vendor vendor3 = Vendor.builder().id(vendorId3).company(company)
// .vendorName("Vendor Three").vendorCode("V3").email("bad-email").build();
// RfqVendor rv3 =
// RfqVendor.builder().id(UUID.randomUUID()).companyId(companyId)
// .vendorId(vendorId3).rfq(rfq).responseStatus(RfqVendorResponseStatus.INVITED).build();

// rfq.getVendors().clear();
// rfq.getVendors().add(rv1);
// rfq.getVendors().add(rv2);
// rfq.getVendors().add(rv3);

// when(repository.findForUpdate(rfqId,
// companyId)).thenReturn(Optional.of(rfq));
// when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId1,
// companyId)).thenReturn(Optional.of(vendor1));
// when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId2,
// companyId)).thenReturn(Optional.of(vendor2));
// when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId3,
// companyId)).thenReturn(Optional.of(vendor3));
// when(rfqPdfService.generateRfqPdf(eq(rfq), eq(vendor1))).thenReturn(new
// byte[]{1});
// when(repository.save(any(Rfq.class))).thenAnswer(inv -> inv.getArgument(0));

// RfqSendResponse response = rfqService.send(companyId, rfqId);

// assertEquals(RfqStatus.SENT, response.getRfq().getStatus());
// assertTrue(response.isEmailSent());
// assertEquals(1, response.getEmailsSentCount());
// assertEquals(0, response.getEmailsFailedCount());
// assertEquals(2, response.getVendorsWithoutEmail());

// // Only vendor1 should have received an email
// verify(emailService, times(1)).sendEmailWithPdfAttachment(
// eq("v1@test.com"), anyString(), anyString(), any(byte[].class), anyString());
// }
// }

// // ================================================================
// // CASE 7: RFQ not found → existing 404 behavior
// // ================================================================
// @Test
// @DisplayName("RFQ not found → ResourceNotFoundException")
// void testSendRfq_RfqNotFound() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// when(repository.findForUpdate(rfqId,
// companyId)).thenReturn(Optional.empty());

// assertThrows(ResourceNotFoundException.class, () ->
// rfqService.send(companyId, rfqId));
// verifyNoInteractions(emailService);
// }
// }

// // ================================================================
// // CASE 8: Non-DRAFT status → existing 400 behavior
// // ================================================================
// @Test
// @DisplayName("Non-DRAFT status → BadRequestException")
// void testSendRfq_NotDraft_ThrowsBadRequest() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// rfq.setStatus(RfqStatus.SENT);
// when(repository.findForUpdate(rfqId,
// companyId)).thenReturn(Optional.of(rfq));

// BadRequestException ex = assertThrows(BadRequestException.class, () ->
// rfqService.send(companyId, rfqId));
// assertTrue(ex.getMessage().contains("Only DRAFT RFQs can be sent"));
// verifyNoInteractions(emailService);
// }
// }

// // ================================================================
// // Additional: No vendors → existing 400 behavior
// // ================================================================
// @Test
// @DisplayName("No vendors → BadRequestException")
// void testSendRfq_NoVendors_ThrowsBadRequest() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// rfq.getVendors().clear();
// when(repository.findForUpdate(rfqId,
// companyId)).thenReturn(Optional.of(rfq));

// BadRequestException ex = assertThrows(BadRequestException.class, () ->
// rfqService.send(companyId, rfqId));
// assertTrue(ex.getMessage().contains("At least one vendor is required"));
// verifyNoInteractions(emailService);
// }
// }

// // ================================================================
// // Additional: PDF generation failure → RFQ still SENT, emailsFailedCount
// incremented
// // ================================================================
// @Test
// @DisplayName("PDF generation fails → RFQ still SENT, emailsFailedCount=1")
// void testSendRfq_PdfGenerationFails_StillSent() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// when(repository.findForUpdate(rfqId,
// companyId)).thenReturn(Optional.of(rfq));
// when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId,
// companyId)).thenReturn(Optional.of(vendor));
// when(rfqPdfService.generateRfqPdf(eq(rfq), eq(vendor))).thenThrow(new
// RuntimeException("Rendering failed"));
// when(repository.save(any(Rfq.class))).thenAnswer(inv -> inv.getArgument(0));

// RfqSendResponse response = rfqService.send(companyId, rfqId);

// // RFQ must still be SENT even when PDF generation fails
// assertEquals(RfqStatus.SENT, response.getRfq().getStatus());
// assertFalse(response.isEmailSent());
// assertEquals(0, response.getEmailsSentCount());
// assertEquals(1, response.getEmailsFailedCount());
// }
// }
// }
