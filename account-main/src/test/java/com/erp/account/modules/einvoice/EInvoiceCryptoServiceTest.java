package com.erp.account.modules.einvoice;

import com.erp.account.modules.einvoice.service.EInvoiceCryptoService;
import com.erp.account.modules.einvoice.service.PayloadSanitizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class EInvoiceCryptoServiceTest {

    private EInvoiceCryptoService cryptoService;
    private static final String MASTER_KEY_32 = "MySecretMasterKeyForEinvoice2026"; // 32 chars

    @BeforeEach
    void setUp() {
        cryptoService = new EInvoiceCryptoService(MASTER_KEY_32);
    }

    @Test
    @DisplayName("1. AES-256-GCM encryption and decryption round-trip succeeds")
    void testEncryptDecrypt_RoundTrip_Success() {
        String sensitiveSecret = "gst_portal_super_secret_password_#2026!";

        String encrypted = cryptoService.encrypt(sensitiveSecret);

        assertNotNull(encrypted);
        assertTrue(encrypted.startsWith("ENC:v1:"));
        assertNotEquals(sensitiveSecret, encrypted);

        String decrypted = cryptoService.decrypt(encrypted);
        assertEquals(sensitiveSecret, decrypted);
    }

    @Test
    @DisplayName("2. AES-256-GCM uses unique random IV per invocation (same plaintext produces distinct ciphertexts)")
    void testEncrypt_RandomIv_ProducesDifferentOutputs() {
        String secret = "constant_secret_value";

        String enc1 = cryptoService.encrypt(secret);
        String enc2 = cryptoService.encrypt(secret);

        assertNotEquals(enc1, enc2, "Each AES-GCM encryption must use a cryptographically distinct random IV");
        assertEquals(secret, cryptoService.decrypt(enc1));
        assertEquals(secret, cryptoService.decrypt(enc2));
    }

    @Test
    @DisplayName("3. Tampered ciphertext or tag fails GCM authentication check")
    void testDecrypt_TamperedCiphertext_ThrowsSecurityException() {
        String secret = "sensitive_data_block";
        String encrypted = cryptoService.encrypt(secret);

        // Tamper with payload by modifying a character in base64 string
        String base64Payload = encrypted.substring("ENC:v1:".length());
        byte[] bytes = Base64.getDecoder().decode(base64Payload);
        bytes[bytes.length - 1] ^= 0x01; // flip last bit of authentication tag
        String tampered = "ENC:v1:" + Base64.getEncoder().encodeToString(bytes);

        assertThrows(SecurityException.class, () -> cryptoService.decrypt(tampered),
                "GCM authentication tag mismatch must throw SecurityException");
    }

    @Test
    @DisplayName("4. Missing master key configuration prevents secret encryption")
    void testUnconfiguredKey_ThrowsIllegalStateException() {
        EInvoiceCryptoService unconfiguredService = new EInvoiceCryptoService("");
        assertFalse(unconfiguredService.isMasterKeyConfigured());

        assertThrows(IllegalStateException.class, () ->
                unconfiguredService.encrypt("plaintext_secret"));
    }

    @Test
    @DisplayName("5. Secret masking utility produces safe redacted output")
    void testMask_ProducesRedactedString() {
        assertEquals("********", cryptoService.mask("1234"));
        assertEquals("********pass", cryptoService.mask("portal_user_pass"));
        assertEquals("", cryptoService.mask(null));
        assertEquals("", cryptoService.mask(""));
    }

    @Test
    @DisplayName("6. PayloadSanitizer masks passwords, client secrets, auth tokens, and SEK from JSON")
    void testPayloadSanitizer_MasksSensitiveFieldsInJson() {
        String rawJson = "{\n" +
                "  \"clientId\": \"client_999\",\n" +
                "  \"clientSecret\": \"super_secret_token_123\",\n" +
                "  \"portalPassword\": \"GstPortal#Password\",\n" +
                "  \"authToken\": \"jwt.eyJhbGciOiJIUzI1NiJ9.test\",\n" +
                "  \"sek\": \"asymmetric_encrypted_sek_key\",\n" +
                "  \"totalAmount\": 150000.00\n" +
                "}";

        String sanitized = PayloadSanitizer.sanitize(rawJson);

        assertFalse(sanitized.contains("super_secret_token_123"));
        assertFalse(sanitized.contains("GstPortal#Password"));
        assertFalse(sanitized.contains("jwt.eyJhbGciOiJIUzI1NiJ9.test"));
        assertFalse(sanitized.contains("asymmetric_encrypted_sek_key"));
        assertTrue(sanitized.contains("\"clientSecret\": \"********\""));
        assertTrue(sanitized.contains("\"portalPassword\": \"********\""));
        assertTrue(sanitized.contains("\"authToken\": \"********\""));
        assertTrue(sanitized.contains("\"sek\": \"********\""));
        assertTrue(sanitized.contains("client_999"));
        assertTrue(sanitized.contains("150000.00"));
    }

    @Test
    @DisplayName("7. PayloadSanitizer masks HTTP Authorization Bearer tokens")
    void testPayloadSanitizer_MasksAuthorizationHeaders() {
        String traceLog = "GET /api/v1/einvoice/status HTTP/1.1\n" +
                "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.secret\n" +
                "Host: einv-apisandbox.nic.in";

        String sanitized = PayloadSanitizer.sanitize(traceLog);

        assertFalse(sanitized.contains("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.secret"));
        assertTrue(sanitized.contains("Bearer ********"));
    }

    @Test
    @DisplayName("8. Fallback no-arg constructor instantiates unconfigured safe state")
    void testNoArgConstructor_InstantiatesSafely() {
        class TestSubclass extends EInvoiceCryptoService {
            public TestSubclass() {
                super();
            }
        }
        TestSubclass instance = new TestSubclass();
        assertNotNull(instance);
        assertFalse(instance.isMasterKeyConfigured());
    }

    @Test
    @DisplayName("9. Primary DI constructor with valid property initializes master key")
    void testPrimaryConstructor_InitializesMasterKey() {
        EInvoiceCryptoService service = new EInvoiceCryptoService(MASTER_KEY_32);
        assertTrue(service.isMasterKeyConfigured());
    }
}
