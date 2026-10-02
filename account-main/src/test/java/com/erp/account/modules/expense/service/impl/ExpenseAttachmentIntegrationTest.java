package com.erp.account.modules.expense.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.enums.PaymentType;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.expense.dto.*;
import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.expense.repository.ExpenseCategoryRepository;
import com.erp.account.modules.expense.service.ExpenseAttachmentStorageService;
import com.erp.account.modules.expense.service.ExpenseClaimService;
import com.erp.account.security.CurrentUserContext;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ExpenseAttachmentIntegrationTest {

    @Autowired
    private ExpenseAttachmentStorageService storageService;

    @Autowired
    private ExpenseClaimService expenseClaimService;

    @Autowired
    private ExpenseCategoryRepository expenseCategoryRepository;

    @Autowired
    private CompanyRepository companyRepository;

    private static final UUID COMPANY_A = UUID.fromString("11111111-aaaa-bbbb-cccc-111111111111");
    private static final UUID COMPANY_B = UUID.fromString("22222222-aaaa-bbbb-cccc-222222222222");
    private static final UUID EMPLOYEE_ID = UUID.fromString("33333333-aaaa-bbbb-cccc-333333333333");

    private static ExpenseCategory categoryCompanyA;
    private static String uploadedPdfUrl;
    private static String uploadedJpgUrl;

    @BeforeEach
    void setupContext() {
        CurrentUserContext.setUserId(EMPLOYEE_ID);
        CurrentUserContext.setUsername("rahul_kumar");
        CurrentUserContext.setUserFullName("Rahul Kumar");
        CurrentUserContext.setUserRole("EMPLOYEE");
        CurrentUserContext.setCompanyId(COMPANY_A);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                EMPLOYEE_ID.toString(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @Order(1)
    void setupCompanyAndCategories() {
        Company compA = new Company();
        compA.setId(COMPANY_A);
        compA.setCompanyName("Company A Logistics");
        compA.setBaseCurrency("INR");
        compA.setActive(true);
        companyRepository.saveAndFlush(compA);

        Company compB = new Company();
        compB.setId(COMPANY_B);
        compB.setCompanyName("Company B Transport");
        compB.setBaseCurrency("INR");
        compB.setActive(true);
        companyRepository.saveAndFlush(compB);

        categoryCompanyA = ExpenseCategory.builder()
                .company(compA)
                .categoryName("Travel & Hotel")
                .categoryCode("EXP-HOTEL")
                .isActive(true)
                .build();
        categoryCompanyA = expenseCategoryRepository.saveAndFlush(categoryCompanyA);
    }

    @Test
    @Order(2)
    void testUploadValidFiles_JPG_JPEG_PNG_PDF() {
        // 1. JPG
        MockMultipartFile jpgFile = new MockMultipartFile(
                "file", "receipt.jpg", "image/jpeg", "dummy jpg bytes".getBytes(StandardCharsets.UTF_8)
        );
        ExpenseAttachmentUploadResponse resJpg = storageService.store(jpgFile, COMPANY_A);
        assertNotNull(resJpg);
        assertTrue(resJpg.getFileUrl().startsWith("/api/account/v1/expenses/attachments/"));
        assertTrue(resJpg.getFileUrl().endsWith(".jpg"));
        assertEquals("image/jpeg", resJpg.getContentType());
        assertEquals("receipt.jpg", resJpg.getFileName());
        uploadedJpgUrl = resJpg.getFileUrl();

        // 2. JPEG
        MockMultipartFile jpegFile = new MockMultipartFile(
                "file", "hotel_invoice.jpeg", "image/jpeg", "dummy jpeg bytes".getBytes(StandardCharsets.UTF_8)
        );
        ExpenseAttachmentUploadResponse resJpeg = storageService.store(jpegFile, COMPANY_A);
        assertNotNull(resJpeg);
        assertTrue(resJpeg.getFileUrl().endsWith(".jpeg"));

        // 3. PNG
        MockMultipartFile pngFile = new MockMultipartFile(
                "file", "ticket.png", "image/png", "dummy png bytes".getBytes(StandardCharsets.UTF_8)
        );
        ExpenseAttachmentUploadResponse resPng = storageService.store(pngFile, COMPANY_A);
        assertNotNull(resPng);
        assertTrue(resPng.getFileUrl().endsWith(".png"));
        assertEquals("image/png", resPng.getContentType());

        // 4. PDF
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "flight_booking.pdf", "application/pdf", "%PDF-1.4 dummy pdf bytes".getBytes(StandardCharsets.UTF_8)
        );
        ExpenseAttachmentUploadResponse resPdf = storageService.store(pdfFile, COMPANY_A);
        assertNotNull(resPdf);
        assertTrue(resPdf.getFileUrl().endsWith(".pdf"));
        assertEquals("application/pdf", resPdf.getContentType());
        uploadedPdfUrl = resPdf.getFileUrl();
    }

    @Test
    @Order(3)
    void testUploadInvalidFiles_EXE_HTML_SVG_Empty_Oversized() {
        // 1. EXE
        MockMultipartFile exeFile = new MockMultipartFile(
                "file", "virus.exe", "application/octet-stream", "evil executable".getBytes()
        );
        assertThrows(BadRequestException.class, () -> storageService.store(exeFile, COMPANY_A));

        // 2. HTML
        MockMultipartFile htmlFile = new MockMultipartFile(
                "file", "phish.html", "text/html", "<html>malicious</html>".getBytes()
        );
        assertThrows(BadRequestException.class, () -> storageService.store(htmlFile, COMPANY_A));

        // 3. SVG
        MockMultipartFile svgFile = new MockMultipartFile(
                "file", "image.svg", "image/svg+xml", "<svg></svg>".getBytes()
        );
        assertThrows(BadRequestException.class, () -> storageService.store(svgFile, COMPANY_A));

        // 4. Empty file
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.pdf", "application/pdf", new byte[0]
        );
        assertThrows(BadRequestException.class, () -> storageService.store(emptyFile, COMPANY_A));

        // 5. Oversized file (>10MB)
        byte[] oversizedBytes = new byte[11 * 1024 * 1024]; // 11MB
        MockMultipartFile oversizedFile = new MockMultipartFile(
                "file", "huge.pdf", "application/pdf", oversizedBytes
        );
        assertThrows(BadRequestException.class, () -> storageService.store(oversizedFile, COMPANY_A));
    }

    @Test
    @Order(4)
    void testLoadFileAndCompanyIsolation() {
        assertNotNull(uploadedPdfUrl);
        String fileName = uploadedPdfUrl.substring(uploadedPdfUrl.lastIndexOf('/') + 1);

        // Load as Company A (owner) -> Should succeed
        CurrentUserContext.setCompanyId(COMPANY_A);
        Resource resource = storageService.load(fileName, COMPANY_A);
        assertNotNull(resource);
        assertTrue(resource.exists());
        assertTrue(resource.isReadable());

        // Switch authenticated user context to Company B -> Must fail with ResourceNotFoundException (Tenant Isolation)
        CurrentUserContext.setCompanyId(COMPANY_B);
        assertThrows(ResourceNotFoundException.class, () -> storageService.load(fileName, COMPANY_B));
        assertThrows(ResourceNotFoundException.class, () -> storageService.load(fileName, COMPANY_A));

        // Restore context to Company A
        CurrentUserContext.setCompanyId(COMPANY_A);
    }

    @Test
    @Order(5)
    void testClaimCreationWithUploadedAttachment() {
        ExpenseClaimCreateRequest request = new ExpenseClaimCreateRequest();
        request.setEmployeeId(EMPLOYEE_ID);
        request.setEmployeeName("Rahul Kumar");
        request.setEmployeeRole("EMPLOYEE");
        request.setClaimDate(LocalDate.now());

        // Item 1 with PDF attachment
        ExpenseClaimItemRequest item1 = new ExpenseClaimItemRequest();
        item1.setExpenseCategoryId(categoryCompanyA.getId());
        item1.setAmount(new BigDecimal("500.00"));
        item1.setExpenseDate(LocalDate.now());
        item1.setPaymentType(PaymentType.CASH);
        item1.setDescription("Hotel booking");
        item1.setBillAttachmentUrl(uploadedPdfUrl);

        // Item 2 with JPG attachment
        ExpenseClaimItemRequest item2 = new ExpenseClaimItemRequest();
        item2.setExpenseCategoryId(categoryCompanyA.getId());
        item2.setAmount(new BigDecimal("300.00"));
        item2.setExpenseDate(LocalDate.now());
        item2.setPaymentType(PaymentType.CASH);
        item2.setDescription("Dinner receipt");
        item2.setBillAttachmentUrl(uploadedJpgUrl);

        request.setItems(List.of(item1, item2));

        ExpenseClaimResponse response = expenseClaimService.createExpenseClaim(COMPANY_A, request);
        assertNotNull(response);
        assertEquals(2, response.getItems().size());

        ExpenseClaimItemResponse itResp1 = response.getItems().get(0);
        assertEquals(uploadedPdfUrl, itResp1.getBillAttachmentUrl());

        ExpenseClaimItemResponse itResp2 = response.getItems().get(1);
        assertEquals(uploadedJpgUrl, itResp2.getBillAttachmentUrl());
    }

    @Test
    @Order(6)
    void testClaimCreationRejectsExternalArbitraryUrl() {
        ExpenseClaimCreateRequest request = new ExpenseClaimCreateRequest();
        request.setEmployeeId(EMPLOYEE_ID);
        request.setEmployeeName("Rahul Kumar");
        request.setEmployeeRole("EMPLOYEE");
        request.setClaimDate(LocalDate.now());

        ExpenseClaimItemRequest item = new ExpenseClaimItemRequest();
        item.setExpenseCategoryId(categoryCompanyA.getId());
        item.setAmount(new BigDecimal("100.00"));
        item.setExpenseDate(LocalDate.now());
        item.setPaymentType(PaymentType.CASH);
        item.setDescription("External fake bill");
        item.setBillAttachmentUrl("https://external-hacker.com/malicious-bill.pdf");

        request.setItems(List.of(item));

        // Must reject external URL
        assertThrows(BadRequestException.class, () -> expenseClaimService.createExpenseClaim(COMPANY_A, request));
    }
}
