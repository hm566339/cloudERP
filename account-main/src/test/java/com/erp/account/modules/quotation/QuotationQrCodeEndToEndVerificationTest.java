package com.erp.account.modules.quotation;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.quotation.dto.response.QuotationAcceptResponse;
import com.erp.account.modules.quotation.dto.response.QuotationPublicViewResponse;
import com.erp.account.modules.quotation.dto.response.QuotationRejectResponse;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationAcceptanceToken;
import com.erp.account.modules.quotation.entity.QuotationItem;
import com.erp.account.modules.quotation.entity.QuotationStatus;
import com.erp.account.modules.quotation.repository.QuotationAcceptanceTokenRepository;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import com.erp.account.modules.quotation.service.impl.QuotationAcceptanceTokenServiceImpl;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import com.google.zxing.qrcode.QRCodeWriter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class QuotationQrCodeEndToEndVerificationTest {

    @Mock
    private QuotationAcceptanceTokenRepository tokenRepository;

    @Mock
    private QuotationRepository quotationRepository;

    @Mock
    private com.erp.account.modules.salesorder.service.SalesOrderService salesOrderService;

    @Mock
    private com.erp.account.modules.salesorder.repository.SalesOrderRepository salesOrderRepository;

    @Mock
    private com.erp.account.integration.workflow.client.WorkflowServiceClient workflowServiceClient;

    @InjectMocks
    private QuotationAcceptanceTokenServiceImpl tokenService;

    private static final String CONFIGURED_FRONTEND_URL = "https://erp.example.com";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(tokenService, "expiryDays", 7);
    }

    @Test
    @DisplayName("1 & 2. Programmatic ZXing QR Code Scanner Verification: Decodes URL correctly")
    void verifyQrCodeDecodedViaZxingMatchesConfiguredUrl() throws Exception {
        UUID quotationId = UUID.randomUUID();
        Quotation quotation = Quotation.builder()
                .quotationNumber("QTN-2026-VERIFY-1")
                .validUntil(LocalDate.now().plusDays(10))
                .status(QuotationStatus.SENT)
                .build();
        quotation.setId(quotationId);

        String rawToken = tokenService.generateToken(quotation);
        assertNotNull(rawToken);

        // Generate the exact QR Code using ZXing as done in QuotationPdfServiceImpl
        String qrData = CONFIGURED_FRONTEND_URL + "/quotation/accept/" + rawToken;
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(qrData, BarcodeFormat.QR_CODE, 150, 150);

        ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
        byte[] qrPngBytes = pngOutputStream.toByteArray();

        // Decode the generated QR Code image using ZXing QRCodeReader (simulating mobile device scan)
        BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(qrPngBytes));
        BufferedImageLuminanceSource luminanceSource = new BufferedImageLuminanceSource(bufferedImage);
        BinaryBitmap binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

        QRCodeReader qrCodeReader = new QRCodeReader();
        com.google.zxing.Result result = qrCodeReader.decode(binaryBitmap);

        assertNotNull(result);
        assertEquals(qrData, result.getText());
        assertTrue(result.getText().startsWith("https://erp.example.com/quotation/accept/"));
        assertTrue(result.getText().contains(rawToken));
    }

    @Test
    @DisplayName("3. Email & PDF Token Identity Verification: Both share exact same raw token")
    void verifyEmailAndPdfShareExactSameRawToken() {
        UUID quotationId = UUID.randomUUID();
        Quotation quotation = Quotation.builder()
                .quotationNumber("QTN-2026-SHARED-TOKEN")
                .validUntil(LocalDate.now().plusDays(10))
                .status(QuotationStatus.SENT)
                .build();
        quotation.setId(quotationId);

        // First issuance for the quotation
        String tokenForPdf = tokenService.generateToken(quotation);

        // Simulate getOrCreateToken called by email/pdf pipeline
        QuotationAcceptanceToken activeDbToken = QuotationAcceptanceToken.builder()
                .quotationId(quotationId)
                .expiresAt(LocalDateTime.now().plusDays(10))
                .build();
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(activeDbToken));

        String tokenForEmail = tokenService.getOrCreateToken(quotation);

        assertEquals(tokenForPdf, tokenForEmail, "Email link and PDF QR code must contain the exact same token");
    }

    @Test
    @DisplayName("4. Dynamic Update Verification: Updating quotation details reflects latest data on the same token")
    void verifyDynamicQuotationUpdateReflectedOnSameToken() {
        UUID quotationId = UUID.randomUUID();
        Quotation quotation = Quotation.builder()
                .quotationNumber("QTN-2026-DYNAMIC")
                .quotationDate(LocalDate.now())
                .validUntil(LocalDate.now().plusDays(14))
                .status(QuotationStatus.SENT)
                .subtotal(new BigDecimal("1000.00"))
                .totalAmount(new BigDecimal("1180.00"))
                .build();
        quotation.setId(quotationId);

        QuotationAcceptanceToken token = QuotationAcceptanceToken.builder()
                .id(UUID.randomUUID())
                .quotationId(quotationId)
                .quotation(quotation)
                .expiresAt(LocalDateTime.now().plusDays(14))
                .build();

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        // Initial view
        QuotationPublicViewResponse initialView = tokenService.getPublicQuotation("dummyRawToken");
        assertEquals(new BigDecimal("1180.00"), initialView.getTotalAmount());

        // Now modify the quotation (e.g. price change)
        quotation.setTotalAmount(new BigDecimal("2360.00"));
        quotation.setSubtotal(new BigDecimal("2000.00"));

        // Second view using the same token
        QuotationPublicViewResponse updatedView = tokenService.getPublicQuotation("dummyRawToken");
        assertEquals(new BigDecimal("2360.00"), updatedView.getTotalAmount(), "QR URL must reflect latest updated quotation data");
    }

    @Test
    @DisplayName("5. Server Restart Simulation: Database hash validation works even when memory cache is wiped")
    void verifyTokenValidationAfterServerRestartSimulation() {
        UUID quotationId = UUID.randomUUID();
        Quotation quotation = Quotation.builder()
                .quotationNumber("QTN-2026-RESTART")
                .validUntil(LocalDate.now().plusDays(7))
                .status(QuotationStatus.SENT)
                .build();
        quotation.setId(quotationId);

        String rawToken = tokenService.generateToken(quotation);

        // Simulate server restart: Wipe the in-memory tokenCache
        @SuppressWarnings("unchecked")
        Map<UUID, Object> cache = (Map<UUID, Object>) ReflectionTestUtils.getField(tokenService, "tokenCache");
        assertNotNull(cache);
        cache.clear();
        assertTrue(cache.isEmpty(), "Memory cache should be empty after restart");

        // Token acceptance must still work because hash exists in DB
        QuotationAcceptanceToken tokenFromDb = QuotationAcceptanceToken.builder()
                .id(UUID.randomUUID())
                .quotationId(quotationId)
                .quotation(quotation)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        when(tokenRepository.findByTokenHashWithLock(anyString())).thenReturn(Optional.of(tokenFromDb));

        QuotationAcceptResponse response = tokenService.acceptQuotation(rawToken);
        assertTrue(response.isSuccess(), "Token acceptance must succeed even after memory cache is cleared");
        assertEquals(QuotationStatus.ACCEPTED, quotation.getStatus());
    }

    @Test
    @DisplayName("7. Multiple PDF Downloads: Cache prevents redundant token creation")
    void verifyMultiplePdfGenerationsDoNotCreateRedundantTokens() {
        UUID quotationId = UUID.randomUUID();
        Quotation quotation = Quotation.builder()
                .quotationNumber("QTN-2026-MULTIPLE-DOWNLOADS")
                .validUntil(LocalDate.now().plusDays(5))
                .status(QuotationStatus.SENT)
                .build();
        quotation.setId(quotationId);

        // Call 1
        String t1 = tokenService.generateToken(quotation);

        QuotationAcceptanceToken activeToken = QuotationAcceptanceToken.builder()
                .quotationId(quotationId)
                .expiresAt(LocalDateTime.now().plusDays(5))
                .build();
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(activeToken));

        // Call 2 & 3 (e.g. repeated downloads or print)
        String t2 = tokenService.getOrCreateToken(quotation);
        String t3 = tokenService.getOrCreateToken(quotation);

        assertEquals(t1, t2);
        assertEquals(t2, t3);
        verify(tokenRepository, times(1)).save(any(QuotationAcceptanceToken.class));
    }

    @Test
    @DisplayName("9. Repeat Acceptance Protection: Idempotent 200 response when already accepted")
    void verifyRepeatAcceptanceHandledIdempotently() {
        Quotation quotation = new Quotation();
        quotation.setId(UUID.randomUUID());
        quotation.setStatus(QuotationStatus.ACCEPTED);
        quotation.setApprovedAt(LocalDateTime.now().minusHours(1));

        QuotationAcceptanceToken token = QuotationAcceptanceToken.builder()
                .quotationId(quotation.getId())
                .quotation(quotation)
                .usedAt(LocalDateTime.now().minusHours(1))
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();

        when(tokenRepository.findByTokenHashWithLock(anyString())).thenReturn(Optional.of(token));

        QuotationAcceptResponse response = tokenService.acceptQuotation("alreadyUsedToken");
        assertFalse(response.isSuccess());
        assertEquals("Quotation has already been accepted", response.getMessage());
    }

    @Test
    @DisplayName("10. Terminal State Protection: Cannot accept expired or cancelled quotation")
    void verifyExpiredOrCancelledQuotationCannotBeAccepted() {
        // Expired
        QuotationAcceptanceToken expiredToken = QuotationAcceptanceToken.builder()
                .expiresAt(LocalDateTime.now().minusDays(1))
                .build();
        when(tokenRepository.findByTokenHashWithLock(anyString())).thenReturn(Optional.of(expiredToken));

        assertThrows(BadRequestException.class, () -> tokenService.acceptQuotation("expiredToken"));

        // Cancelled
        Quotation cancelledQuotation = new Quotation();
        cancelledQuotation.setStatus(QuotationStatus.CANCELLED);
        QuotationAcceptanceToken tokenForCancelled = QuotationAcceptanceToken.builder()
                .quotation(cancelledQuotation)
                .expiresAt(LocalDateTime.now().plusDays(5))
                .build();
        when(tokenRepository.findByTokenHashWithLock(anyString())).thenReturn(Optional.of(tokenForCancelled));

        assertThrows(BadRequestException.class, () -> tokenService.acceptQuotation("cancelledToken"));
    }

    @Test
    @DisplayName("11. Public Sanitization: Excludes internal IDs, margins, and hash data")
    void verifyNoInternalInformationExposedInPublicResponse() {
        UUID quotationId = UUID.randomUUID();
        Quotation quotation = Quotation.builder()
                .quotationNumber("QTN-2026-PUBLIC-CHECK")
                .quotationDate(LocalDate.now())
                .validUntil(LocalDate.now().plusDays(10))
                .status(QuotationStatus.SENT)
                .notes("Standard commercial terms")
                .subtotal(new BigDecimal("100.00"))
                .taxAmount(new BigDecimal("18.00"))
                .totalAmount(new BigDecimal("118.00"))
                .build();
        quotation.setId(quotationId);

        QuotationAcceptanceToken token = QuotationAcceptanceToken.builder()
                .id(UUID.randomUUID())
                .quotationId(quotationId)
                .quotation(quotation)
                .tokenHash("super-secret-sha256-hash-value")
                .expiresAt(LocalDateTime.now().plusDays(10))
                .build();

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        QuotationPublicViewResponse publicDto = tokenService.getPublicQuotation("rawToken");

        // Verify public DTO contains only allowed public fields
        assertNotNull(publicDto.getQuotationNumber());
        assertNotNull(publicDto.getTotalAmount());
        assertEquals("Standard commercial terms", publicDto.getNotes());

        // Reflection check: Confirm QuotationPublicViewResponse class does NOT contain sensitive fields
        java.lang.reflect.Field[] fields = QuotationPublicViewResponse.class.getDeclaredFields();
        for (java.lang.reflect.Field f : fields) {
            String name = f.getName().toLowerCase();
            assertFalse(name.contains("tokenhash"), "Token hash must not exist in public response");
            assertFalse(name.contains("margin"), "Profit margin must not exist in public response");
            assertFalse(name.contains("cost"), "Internal cost must not exist in public response");
            assertFalse(name.contains("createdby"), "Audit user IDs must not exist in public response");
            assertFalse(name.contains("approvedby"), "Audit user IDs must not exist in public response");
        }
    }
}
