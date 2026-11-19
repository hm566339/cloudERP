package com.erp.crm.modules.integration.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * JPA AttributeConverter that encrypts sensitive JSON data at rest using AES-256-GCM.
 * Prepends a 12-byte cryptographic nonce (IV) and includes an authentication tag (128-bit)
 * to ensure confidentiality and integrity.
 */
@Slf4j
@Converter
@Component
public class Aes256EncryptionConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 96 bits recommended for GCM
    private static final int GCM_TAG_LENGTH = 128; // bits
    private static final String ENCRYPTION_PREFIX = "ENC::";

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final SecretKeySpec secretKeySpec;

    public Aes256EncryptionConverter(
            @Value("${crm.security.encryption-key:${jwt.secret:defaultSecretKeyWithAtLeast32CharactersForHmacSha256}}")
            String rawSecretKey) {
        this.secretKeySpec = deriveSecretKey(rawSecretKey);
    }

    private static SecretKeySpec deriveSecretKey(String rawKey) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha256.digest((rawKey != null && !rawKey.isBlank() ? rawKey : "mark2-crm-default-key-seed")
                    .getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, ALGORITHM);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize AES-256 secret key", e);
        }
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        if (attribute.isBlank()) {
            return attribute;
        }

        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            SECURE_RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, parameterSpec);

            byte[] cipherText = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return ENCRYPTION_PREFIX + Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            log.error("Failed to encrypt sensitive CRM integration field: {}", e.getMessage());
            throw new RuntimeException("Encryption error occurred during persistence", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        if (dbData.isBlank()) {
            return dbData;
        }

        // If not encrypted or legacy plaintext, return as is
        if (!dbData.startsWith(ENCRYPTION_PREFIX)) {
            return dbData;
        }

        try {
            String payload = dbData.substring(ENCRYPTION_PREFIX.length());
            byte[] decoded = Base64.getDecoder().decode(payload);

            if (decoded.length < GCM_IV_LENGTH) {
                log.warn("Corrupted encrypted data encountered (length too short)");
                return dbData;
            }

            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);

            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, parameterSpec);

            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Failed to decrypt data, returning raw payload: {}", e.getMessage());
            return dbData;
        }
    }
}
