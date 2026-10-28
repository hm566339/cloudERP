package com.erp.account.modules.einvoice;

import com.erp.account.modules.einvoice.config.NicEInvoiceProperties;
import com.erp.account.modules.einvoice.entity.CompanyEInvoiceConfig;
import com.erp.account.modules.einvoice.enums.EInvoiceProviderType;
import com.erp.account.modules.einvoice.provider.NicEInvoiceProvider;
import com.erp.account.modules.einvoice.provider.NicIrpCryptoUtil;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceCancelResult;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceCanonicalPayload;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceProviderResult;
import com.erp.account.modules.einvoice.repository.CompanyEInvoiceConfigRepository;
import com.erp.account.modules.einvoice.service.EInvoiceCryptoService;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.modules.gst.repository.GstRegistrationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ResourceLoader;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NicEInvoiceProviderTest {

    @Mock
    private CompanyEInvoiceConfigRepository configRepository;

    @Mock
    private GstRegistrationRepository gstRegistrationRepository;

    @Mock
    private ResourceLoader resourceLoader;

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    private NicEInvoiceProperties properties;
    private EInvoiceCryptoService cryptoService;
    private ObjectMapper objectMapper;
    private NicEInvoiceProvider provider;
    private KeyPair testRsaKeyPair;

    private static final String MASTER_KEY = "TestMasterKeyForEinvoice2026AES"; // 32 chars
    private static final String TEST_SELLER_GSTIN = "27AABCU9603R1ZM";

    @BeforeEach
    void setUp() {
        properties = new NicEInvoiceProperties();
        properties.setSandboxBaseUrl("https://einv-apisandbox.nic.in");
        properties.setConnectTimeoutMs(5000);
        properties.setReadTimeoutMs(10000);

        cryptoService = new EInvoiceCryptoService(MASTER_KEY);
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();

        testRsaKeyPair = NicIrpCryptoUtil.generateTestRsaKeyPair();

        provider = new NicEInvoiceProvider(
                properties,
                cryptoService,
                configRepository,
                gstRegistrationRepository,
                objectMapper,
                resourceLoader,
                httpClient
        );
        provider.setTestPublicKey(testRsaKeyPair.getPublic());
    }

    @Test
    @DisplayName("1. Provider reports correct type NIC_DIRECT")
    void testGetProviderType() {
        assertEquals(EInvoiceProviderType.NIC_DIRECT, provider.getProviderType());
    }

    @Test
    @DisplayName("2. Missing master key configuration returns graceful failure")
    void testGenerateIrn_MissingMasterKey_ReturnsFailure() {
        EInvoiceCryptoService unconfiguredCrypto = new EInvoiceCryptoService("");
        NicEInvoiceProvider unconfiguredProvider = new NicEInvoiceProvider(
                properties, unconfiguredCrypto, configRepository, gstRegistrationRepository, objectMapper, resourceLoader, httpClient
        );

        CompanyEInvoiceConfig config = createValidConfig();
        EInvoiceCanonicalPayload payload = createSamplePayload();

        EInvoiceProviderResult result = unconfiguredProvider.generateIrn(config, payload);

        assertFalse(result.isSuccess());
        assertEquals("MISSING_MASTER_KEY", result.getErrorCode());
        assertFalse(result.isMock());
    }

    @Test
    @DisplayName("3. Missing credentials returns graceful failure without throwing exception")
    void testGenerateIrn_MissingCredentials_ReturnsFailure() {
        CompanyEInvoiceConfig config = CompanyEInvoiceConfig.builder()
                .companyId(UUID.randomUUID())
                .gstRegistrationId(UUID.randomUUID())
                .providerName(EInvoiceProviderType.NIC_DIRECT)
                .clientId(null) // missing
                .portalUsername("user")
                .build();

        EInvoiceCanonicalPayload payload = createSamplePayload();
        EInvoiceProviderResult result = provider.generateIrn(config, payload);

        assertFalse(result.isSuccess());
        assertEquals("MISSING_CREDENTIALS", result.getErrorCode());
    }

    @Test
    @DisplayName("4. Full successful IRN generation: Mutual auth, AppKey RSA encryption, SEK AES encryption, and response parsing")
    @SuppressWarnings("unchecked")
    void testGenerateIrn_Success() throws Exception {
        CompanyEInvoiceConfig config = createValidConfig();
        EInvoiceCanonicalPayload payload = createSamplePayload();

        byte[] simulatedAppKey = new byte[32];
        for (int i = 0; i < 32; i++) simulatedAppKey[i] = (byte) (i + 10);
        provider.setTestAppKey(simulatedAppKey);

        byte[] simulatedSek = new byte[32];
        for (int i = 0; i < 32; i++) simulatedSek[i] = (byte) (i + 1);

        // Encrypt simulatedSek with simulatedAppKey using AES-256
        Cipher aesCipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        aesCipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(simulatedAppKey, "AES"));
        String mockSekBase64 = Base64.getEncoder().encodeToString(aesCipher.doFinal(simulatedSek));

        // Configure mock HTTP client for two sequential calls: 1. Auth, 2. Invoice Generation
        HttpResponse<String> authResponse = mock(HttpResponse.class);
        HttpResponse<String> genResponse = mock(HttpResponse.class);

        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenAnswer(invocation -> {
                    HttpRequest req = invocation.getArgument(0);
                    String uri = req.uri().toString();

                    if (uri.endsWith("/api/v1/authenticate")) {
                        String authJson = String.format(
                                "{\"Status\": 1, \"Data\": {\"ClientId\": \"test_client\", \"UserName\": \"test_user\", \"AuthToken\": \"mock_jwt_auth_token_xyz\", \"Sek\": \"%s\", \"TokenExpiry\": \"2026-10-28 23:59:59\"}}",
                                mockSekBase64
                        );
                        when(authResponse.body()).thenReturn(authJson);
                        return authResponse;
                    } else if (uri.endsWith("/api/v1/invoice")) {
                        // Return simulated NIC invoice generation response encrypted with simulated SEK
                        String decryptedRespJson = "{\n" +
                                "  \"AckNo\": 122610280001234,\n" +
                                "  \"AckDt\": \"2026-10-28 14:30:00\",\n" +
                                "  \"Irn\": \"a1b2c3d4e5f67890123456789012345678901234567890123456789012345678\",\n" +
                                "  \"SignedInvoice\": \"NIC_SIGNED_INVOICE_JWT_PAYLOAD\",\n" +
                                "  \"SignedQRCode\": \"NIC_OFFICIAL_SIGNED_QR_CODE_JWT\",\n" +
                                "  \"Status\": \"ACT\"\n" +
                                "}";
                        String encryptedRespData = NicIrpCryptoUtil.encryptPayloadWithSek(decryptedRespJson, simulatedSek);
                        String genJson = "{\"Status\": 1, \"Data\": \"" + encryptedRespData + "\"}";
                        when(genResponse.body()).thenReturn(genJson);
                        return genResponse;
                    }
                    throw new IllegalArgumentException("Unexpected URI: " + uri);
                });

        EInvoiceProviderResult result = provider.generateIrn(config, payload);

        assertTrue(result.isSuccess());
        assertFalse(result.isMock());
        assertEquals("a1b2c3d4e5f67890123456789012345678901234567890123456789012345678", result.getIrn());
        assertEquals("122610280001234", result.getAckNumber());
        assertEquals(LocalDateTime.of(2026, 10, 28, 14, 30, 0), result.getAckDate());
        assertEquals("NIC_SIGNED_INVOICE_JWT_PAYLOAD", result.getSignedInvoice());
        assertEquals("NIC_OFFICIAL_SIGNED_QR_CODE_JWT", result.getSignedQrCode());

        // Verify session was persisted in config
        verify(configRepository, atLeastOnce()).save(config);
        assertNotNull(config.getEncryptedAuthToken());
        assertNotNull(config.getEncryptedSek());
    }

    @Test
    @DisplayName("5. Duplicate IRN error 2150 is cleanly classified with isDuplicate=true")
    @SuppressWarnings("unchecked")
    void testGenerateIrn_DuplicateError2150_MappedToDuplicateFlag() throws Exception {
        CompanyEInvoiceConfig config = createValidConfigWithSession();
        EInvoiceCanonicalPayload payload = createSamplePayload();

        when(httpResponse.body()).thenReturn("{\n" +
                "  \"Status\": 0,\n" +
                "  \"ErrorDetails\": [\n" +
                "    {\n" +
                "      \"ErrorCode\": \"2150\",\n" +
                "      \"ErrorMessage\": \"Duplicate IRN: IRN is already generated for this invoice\"\n" +
                "    }\n" +
                "  ]\n" +
                "}");

        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenReturn(httpResponse);

        EInvoiceProviderResult result = provider.generateIrn(config, payload);

        assertFalse(result.isSuccess());
        assertEquals("2150", result.getErrorCode());
        assertTrue(result.isDuplicate(), "NIC Error 2150 must set isDuplicate=true");
        assertFalse(result.isTimeoutAmbiguous());
    }

    @Test
    @DisplayName("6. Read timeout is mapped to isTimeoutAmbiguous=true for reconciliation safety")
    @SuppressWarnings("unchecked")
    void testGenerateIrn_ReadTimeout_MappedToAmbiguousTimeoutFlag() throws Exception {
        CompanyEInvoiceConfig config = createValidConfigWithSession();
        EInvoiceCanonicalPayload payload = createSamplePayload();

        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenThrow(new HttpTimeoutException("Request timed out after 10000ms"));

        EInvoiceProviderResult result = provider.generateIrn(config, payload);

        assertFalse(result.isSuccess());
        assertEquals("TIMEOUT", result.getErrorCode());
        assertTrue(result.isTimeoutAmbiguous(), "Gateway read timeout must set isTimeoutAmbiguous=true");
        assertFalse(result.isDuplicate());
    }

    @Test
    @DisplayName("7. IRN cancellation parses statutory cancel date and returns success")
    @SuppressWarnings("unchecked")
    void testCancelIrn_Success() throws Exception {
        CompanyEInvoiceConfig config = createValidConfigWithSession();
        byte[] simulatedSek = getSessionSek(config);

        String decryptedCancelResp = "{\"Irn\":\"test-irn\",\"CancelDate\":\"2026-10-28 15:00:00\"}";
        String encryptedData = NicIrpCryptoUtil.encryptPayloadWithSek(decryptedCancelResp, simulatedSek);
        String cancelJson = "{\"Status\": 1, \"Data\": \"" + encryptedData + "\"}";

        when(httpResponse.body()).thenReturn(cancelJson);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenReturn(httpResponse);

        EInvoiceCancelResult result = provider.cancelIrn(config, "test-irn", "1", "Duplicate entry");

        assertTrue(result.isSuccess());
        assertEquals("test-irn", result.getIrn());
        assertEquals(LocalDateTime.of(2026, 10, 28, 15, 0, 0), result.getCancelDate());
    }

    @Test
    @DisplayName("8. Query IRN details retrieves reconciled status and official signed QR")
    @SuppressWarnings("unchecked")
    void testGetIrnDetails_Success() throws Exception {
        CompanyEInvoiceConfig config = createValidConfigWithSession();
        byte[] simulatedSek = getSessionSek(config);

        String decryptedDetailsResp = "{\n" +
                "  \"AckNo\": 122610280009999,\n" +
                "  \"AckDt\": \"2026-10-28 12:00:00\",\n" +
                "  \"Irn\": \"reconciled-irn-64-character-hash-value-here-000000000000000000000000\",\n" +
                "  \"SignedInvoice\": \"RECONCILED_JWT_INVOICE\",\n" +
                "  \"SignedQRCode\": \"RECONCILED_SIGNED_QR_CODE\",\n" +
                "  \"Status\": \"ACT\"\n" +
                "}";
        String encryptedData = NicIrpCryptoUtil.encryptPayloadWithSek(decryptedDetailsResp, simulatedSek);
        String detailsJson = "{\"Status\": 1, \"Data\": \"" + encryptedData + "\"}";

        when(httpResponse.body()).thenReturn(detailsJson);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenReturn(httpResponse);

        EInvoiceProviderResult result = provider.getIrnDetails(config, "reconciled-irn");

        assertTrue(result.isSuccess());
        assertEquals("122610280009999", result.getAckNumber());
        assertEquals("RECONCILED_SIGNED_QR_CODE", result.getSignedQrCode());
        assertEquals("RECONCILED_JWT_INVOICE", result.getSignedInvoice());
    }

    @Test
    @DisplayName("9. Cryptographic utility: AppKey RSA encryption & SEK AES decryption round trip")
    void testCryptoUtil_AppKeyAndSek_RoundTrip() throws Exception {
        byte[] appKey = NicIrpCryptoUtil.generateAppKey();
        assertEquals(32, appKey.length);

        String encryptedAppKey = NicIrpCryptoUtil.encryptAppKeyWithRsa(appKey, testRsaKeyPair.getPublic());
        assertNotNull(encryptedAppKey);

        // Decrypt AppKey using RSA private key to verify
        Cipher rsaCipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        rsaCipher.init(Cipher.DECRYPT_MODE, testRsaKeyPair.getPrivate());
        byte[] decryptedAppKey = rsaCipher.doFinal(Base64.getDecoder().decode(encryptedAppKey));
        assertArrayEquals(appKey, decryptedAppKey);

        // Encrypt SEK using AppKey with AES-256
        byte[] sampleSek = new byte[32];
        for (int i = 0; i < 32; i++) sampleSek[i] = (byte) (i * 3);

        Cipher aesCipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        aesCipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(appKey, "AES"));
        String encryptedSekBase64 = Base64.getEncoder().encodeToString(aesCipher.doFinal(sampleSek));

        byte[] decryptedSek = NicIrpCryptoUtil.decryptSekWithAppKey(encryptedSekBase64, appKey);
        assertArrayEquals(sampleSek, decryptedSek);

        // Payload encryption and decryption with SEK
        String jsonPayload = "{\"test\": \"payload\", \"amount\": 12500.50}";
        String encryptedPayload = NicIrpCryptoUtil.encryptPayloadWithSek(jsonPayload, decryptedSek);
        String decryptedPayload = NicIrpCryptoUtil.decryptPayloadWithSek(encryptedPayload, decryptedSek);
        assertEquals(jsonPayload, decryptedPayload);
    }

    // --- Helper Methods ---

    private CompanyEInvoiceConfig createValidConfig() {
        UUID companyId = UUID.randomUUID();
        UUID gstId = UUID.randomUUID();
        GstRegistration reg = GstRegistration.builder()
                .id(gstId)
                .companyId(companyId)
                .gstin(TEST_SELLER_GSTIN)
                .build();

        return CompanyEInvoiceConfig.builder()
                .companyId(companyId)
                .gstRegistrationId(gstId)
                .gstRegistration(reg)
                .providerName(EInvoiceProviderType.NIC_DIRECT)
                .environment("SANDBOX")
                .clientId("nic_test_client_id")
                .encryptedClientSecret(cryptoService.encrypt("nic_test_client_secret"))
                .portalUsername("nic_portal_user")
                .encryptedPortalPassword(cryptoService.encrypt("nic_portal_password#123"))
                .isActive(true)
                .build();
    }

    private CompanyEInvoiceConfig createValidConfigWithSession() {
        CompanyEInvoiceConfig config = createValidConfig();
        byte[] sek = new byte[32];
        for (int i = 0; i < 32; i++) sek[i] = (byte) (i + 1);

        config.setEncryptedAuthToken(cryptoService.encrypt("cached_active_jwt_auth_token"));
        config.setEncryptedSek(cryptoService.encrypt(Base64.getEncoder().encodeToString(sek)));
        config.setTokenExpiresAt(LocalDateTime.now().plusHours(4)); // valid session
        return config;
    }

    private byte[] getSessionSek(CompanyEInvoiceConfig config) {
        String base64Sek = cryptoService.decrypt(config.getEncryptedSek());
        return Base64.getDecoder().decode(base64Sek);
    }

    private EInvoiceCanonicalPayload createSamplePayload() {
        return EInvoiceCanonicalPayload.builder()
                .version("1.04")
                .docType("INV")
                .docNumber("INV-2026-001")
                .docDate(LocalDate.of(2026, 10, 28))
                .seller(EInvoiceCanonicalPayload.SellerDetails.builder()
                        .gstin(TEST_SELLER_GSTIN)
                        .legalName("Enterprise Seller Pvt Ltd")
                        .build())
                .buyer(EInvoiceCanonicalPayload.BuyerDetails.builder()
                        .gstin("29AABCU9603R1ZM")
                        .legalName("Karnataka Buyer Corp")
                        .build())
                .build();
    }
}
