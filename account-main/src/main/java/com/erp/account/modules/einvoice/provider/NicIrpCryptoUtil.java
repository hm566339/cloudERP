package com.erp.account.modules.einvoice.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * Cryptographic utility conforming strictly to the official National Informatics Centre (NIC)
 * Goods and Services Tax e-Invoice System API v1.03/v1.04 encryption standards.
 *
 * Cryptographic Protocol:
 * 1. Symmetric AppKey: 32 bytes (256-bit) cryptographically secure random AES key.
 * 2. Asymmetric RSA Encryption: AppKey is encrypted with NIC Public Key using RSA/ECB/PKCS1Padding.
 * 3. Symmetric SEK Decryption: Returned Session Encryption Key (SEK) is decrypted using AppKey via AES/ECB/PKCS5Padding.
 * 4. Payload Encryption/Decryption: Request and response JSON payloads are encrypted/decrypted using SEK via AES/ECB/PKCS5Padding.
 */
@Slf4j
public class NicIrpCryptoUtil {

    private static final String AES_ALGORITHM = "AES";
    private static final String AES_CIPHER_TRANSFORMATION = "AES/ECB/PKCS5Padding";
    private static final String RSA_CIPHER_TRANSFORMATION = "RSA/ECB/PKCS1Padding";
    private static final int APP_KEY_LENGTH_BYTES = 32;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * Generates a 256-bit (32-byte) random symmetric AppKey for a session.
     */
    public static byte[] generateAppKey() {
        byte[] appKey = new byte[APP_KEY_LENGTH_BYTES];
        SECURE_RANDOM.nextBytes(appKey);
        return appKey;
    }

    /**
     * Encrypts the 32-byte AppKey using the NIC RSA public key.
     * Returns Base64-encoded encrypted AppKey.
     */
    public static String encryptAppKeyWithRsa(byte[] appKey, PublicKey publicKey) {
        if (appKey == null || appKey.length != APP_KEY_LENGTH_BYTES) {
            throw new IllegalArgumentException("AppKey must be exactly 32 bytes (256-bit)");
        }
        if (publicKey == null) {
            throw new IllegalArgumentException("NIC RSA Public Key must not be null");
        }
        try {
            Cipher cipher = Cipher.getInstance(RSA_CIPHER_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, publicKey);
            byte[] encrypted = cipher.doFinal(appKey);
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt AppKey with RSA public key: " + e.getMessage(), e);
        }
    }

    /**
     * Decrypts the returned Session Encryption Key (SEK) using the generated AppKey.
     * Returned SEK is 32 raw bytes (AES-256).
     */
    public static byte[] decryptSekWithAppKey(String encryptedSekBase64, byte[] appKey) {
        if (encryptedSekBase64 == null || encryptedSekBase64.isBlank()) {
            throw new IllegalArgumentException("Encrypted SEK must not be blank");
        }
        if (appKey == null || appKey.length != APP_KEY_LENGTH_BYTES) {
            throw new IllegalArgumentException("AppKey must be exactly 32 bytes");
        }
        try {
            byte[] cipherBytes = Base64.getDecoder().decode(encryptedSekBase64.trim());
            Cipher cipher = Cipher.getInstance(AES_CIPHER_TRANSFORMATION);
            SecretKeySpec secretKeySpec = new SecretKeySpec(appKey, AES_ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
            return cipher.doFinal(cipherBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt SEK with AppKey: " + e.getMessage(), e);
        }
    }

    /**
     * Encrypts a JSON request payload using decrypted SEK.
     * Returns Base64-encoded ciphertext.
     */
    public static String encryptPayloadWithSek(String jsonPayload, byte[] sekBytes) {
        if (jsonPayload == null) {
            throw new IllegalArgumentException("Payload cannot be null");
        }
        if (sekBytes == null || sekBytes.length != 32) {
            throw new IllegalArgumentException("SEK must be exactly 32 bytes (256-bit)");
        }
        try {
            Cipher cipher = Cipher.getInstance(AES_CIPHER_TRANSFORMATION);
            SecretKeySpec secretKeySpec = new SecretKeySpec(sekBytes, AES_ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec);
            byte[] encrypted = cipher.doFinal(jsonPayload.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt JSON payload with SEK: " + e.getMessage(), e);
        }
    }

    /**
     * Decrypts a Base64-encoded response payload using decrypted SEK.
     * Returns UTF-8 plaintext JSON string.
     */
    public static String decryptPayloadWithSek(String encryptedPayloadBase64, byte[] sekBytes) {
        if (encryptedPayloadBase64 == null || encryptedPayloadBase64.isBlank()) {
            throw new IllegalArgumentException("Encrypted payload cannot be blank");
        }
        if (sekBytes == null || sekBytes.length != 32) {
            throw new IllegalArgumentException("SEK must be exactly 32 bytes (256-bit)");
        }
        try {
            byte[] cipherBytes = Base64.getDecoder().decode(encryptedPayloadBase64.trim());
            Cipher cipher = Cipher.getInstance(AES_CIPHER_TRANSFORMATION);
            SecretKeySpec secretKeySpec = new SecretKeySpec(sekBytes, AES_ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
            byte[] decrypted = cipher.doFinal(cipherBytes);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt payload with SEK: " + e.getMessage(), e);
        }
    }

    /**
     * Loads an RSA PublicKey from a PEM file, X.509 certificate, or resource path.
     */
    public static PublicKey loadPublicKey(String location, ResourceLoader resourceLoader) {
        if (location == null || location.isBlank()) {
            return null;
        }
        try {
            Resource resource = resourceLoader.getResource(location.trim());
            if (!resource.exists()) {
                log.warn("NIC IRP public key resource does not exist at location: {}", location);
                return null;
            }
            try (InputStream is = resource.getInputStream()) {
                byte[] bytes = is.readAllBytes();
                String content = new String(bytes, StandardCharsets.UTF_8);

                if (content.contains("-----BEGIN CERTIFICATE-----")) {
                    CertificateFactory cf = CertificateFactory.getInstance("X.509");
                    try (InputStream certStream = resource.getInputStream()) {
                        X509Certificate cert = (X509Certificate) cf.generateCertificate(certStream);
                        return cert.getPublicKey();
                    }
                } else if (content.contains("-----BEGIN PUBLIC KEY-----")) {
                    String cleanKey = content
                            .replace("-----BEGIN PUBLIC KEY-----", "")
                            .replace("-----END PUBLIC KEY-----", "")
                            .replaceAll("\\s+", "");
                    byte[] keyBytes = Base64.getDecoder().decode(cleanKey);
                    X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
                    KeyFactory keyFactory = KeyFactory.getInstance("RSA");
                    return keyFactory.generatePublic(keySpec);
                } else {
                    // Try parsing as raw DER
                    X509EncodedKeySpec keySpec = new X509EncodedKeySpec(bytes);
                    KeyFactory keyFactory = KeyFactory.getInstance("RSA");
                    return keyFactory.generatePublic(keySpec);
                }
            }
        } catch (Exception e) {
            log.error("Failed to load NIC RSA Public Key from {}: {}", location, e.getMessage());
            return null;
        }
    }

    /**
     * Helper for unit tests to generate an ephemeral RSA KeyPair for local round-trip testing.
     */
    public static KeyPair generateTestRsaKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048, SECURE_RANDOM);
            return generator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("RSA not supported", e);
        }
    }
}
