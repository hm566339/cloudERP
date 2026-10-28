package com.erp.account.modules.einvoice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Enterprise-grade cryptographic service for e-Invoice API credentials, secrets, and auth tokens.
 *
 * Implements AES-256-GCM (Galois/Counter Mode) authenticated encryption:
 * - 256-bit symmetric key externally supplied via environment or secret manager (never hardcoded)
 * - 12-byte (96-bit) cryptographically secure random IV per encryption operation
 * - 128-bit GCM authentication tag for tamper resistance
 * - Formatted as: "ENC:v1:<Base64(IV + CipherText + Tag)>"
 */
@Service
@Slf4j
public class EInvoiceCryptoService {

    private static final String ALGORITHM = "AES";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final String CIPHER_PREFIX_V1 = "ENC:v1:";

    private final SecretKey masterKey;
    private final SecureRandom secureRandom;
    private final boolean configured;

    public EInvoiceCryptoService(@Value("${erp.einvoice.security.master-key:}") String masterKeyProperty) {
        this.secureRandom = new SecureRandom();
        if (StringUtils.hasText(masterKeyProperty)) {
            this.masterKey = resolveKey(masterKeyProperty.trim());
            this.configured = true;
            log.info("EInvoiceCryptoService successfully initialized with externally configured AES-256 master key.");
        } else {
            this.masterKey = null;
            this.configured = false;
            log.warn("EInvoiceCryptoService: No master encryption key configured ('erp.einvoice.security.master-key' is empty). " +
                    "Production secrets cannot be encrypted. Only MOCK mode is permitted until master key is supplied.");
        }
    }

    /**
     * Package-private constructor for unit testing with explicit key.
     */
    EInvoiceCryptoService(byte[] rawKeyBytes) {
        this.secureRandom = new SecureRandom();
        if (rawKeyBytes != null && rawKeyBytes.length == 32) {
            this.masterKey = new SecretKeySpec(rawKeyBytes, ALGORITHM);
            this.configured = true;
        } else {
            this.masterKey = null;
            this.configured = false;
        }
    }

    public boolean isMasterKeyConfigured() {
        return configured && masterKey != null;
    }

    /**
     * Encrypts sensitive plaintext (client secrets, passwords, auth tokens, SEK).
     *
     * @param plaintext sensitive string to protect
     * @return version-tagged base64 string "ENC:v1:<base64-payload>"
     */
    public String encrypt(String plaintext) {
        if (!StringUtils.hasText(plaintext)) {
            return plaintext;
        }

        if (!isMasterKeyConfigured()) {
            throw new IllegalStateException(
                    "Cannot encrypt credential: e-Invoice master key is not configured. " +
                    "Supply 'erp.einvoice.security.master-key' via environment variable or secret manager."
            );
        }

        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, masterKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return CIPHER_PREFIX_V1 + Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            log.error("Failed to encrypt sensitive e-Invoice credential: {}", e.getMessage());
            throw new SecurityException("Cryptographic encryption failure", e);
        }
    }

    /**
     * Decrypts encrypted credential. If the string is not encrypted (legacy or unconfigured),
     * returns safely or validates appropriately.
     *
     * @param cipherText version-tagged string
     * @return original plaintext
     */
    public String decrypt(String cipherText) {
        if (!StringUtils.hasText(cipherText)) {
            return cipherText;
        }

        if (!cipherText.startsWith(CIPHER_PREFIX_V1)) {
            // Not encrypted with v1 prefix (e.g. legacy plain record or unencrypted test fixture)
            log.warn("Attempting to read credential without ENC:v1: prefix. Treating as legacy unencrypted string.");
            return cipherText;
        }

        if (!isMasterKeyConfigured()) {
            throw new IllegalStateException(
                    "Cannot decrypt credential: e-Invoice master key is not configured. " +
                    "Supply 'erp.einvoice.security.master-key' to decrypt credentials."
            );
        }

        try {
            String base64Payload = cipherText.substring(CIPHER_PREFIX_V1.length());
            byte[] decoded = Base64.getDecoder().decode(base64Payload);

            if (decoded.length < GCM_IV_LENGTH_BYTES + (GCM_TAG_LENGTH_BITS / 8)) {
                throw new IllegalArgumentException("Invalid cipher payload length");
            }

            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            byteBuffer.get(iv);

            byte[] encryptedBytes = new byte[byteBuffer.remaining()];
            byteBuffer.get(encryptedBytes);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, masterKey, parameterSpec);

            byte[] decrypted = cipher.doFinal(encryptedBytes);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to decrypt e-Invoice credential: {}", e.getMessage());
            throw new SecurityException("Cryptographic decryption failure or key mismatch", e);
        }
    }

    /**
     * Masks sensitive credential for safe logging or DTO presentation.
     */
    public String mask(String secret) {
        if (!StringUtils.hasText(secret)) {
            return "";
        }
        if (secret.length() <= 4) {
            return "********";
        }
        return "********" + secret.substring(secret.length() - 4);
    }

    private SecretKey resolveKey(String keyString) {
        try {
            // Check Base64 (32 bytes = 44 base64 chars)
            if (keyString.length() == 44) {
                byte[] decoded = Base64.getDecoder().decode(keyString);
                if (decoded.length == 32) {
                    return new SecretKeySpec(decoded, ALGORITHM);
                }
            }
            // Check 64-char Hexadecimal
            if (keyString.length() == 64) {
                byte[] hexBytes = HexFormat.of().parseHex(keyString);
                if (hexBytes.length == 32) {
                    return new SecretKeySpec(hexBytes, ALGORITHM);
                }
            }
            // Check raw UTF-8 32-character key
            byte[] rawBytes = keyString.getBytes(StandardCharsets.UTF_8);
            if (rawBytes.length == 32) {
                return new SecretKeySpec(rawBytes, ALGORITHM);
            }

            // Derive 32-byte key via SHA-256 hash if raw string is not exactly 32 bytes
            java.security.MessageDigest sha256 = java.security.MessageDigest.getInstance("SHA-256");
            byte[] derived = sha256.digest(rawBytes);
            return new SecretKeySpec(derived, ALGORITHM);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to initialize AES-256 key from master key property: " + e.getMessage(), e);
        }
    }
}
