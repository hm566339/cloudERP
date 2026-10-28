package com.erp.account.modules.einvoice.provider;

import com.erp.account.modules.einvoice.config.NicEInvoiceProperties;
import com.erp.account.modules.einvoice.entity.CompanyEInvoiceConfig;
import com.erp.account.modules.einvoice.enums.EInvoiceProviderType;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceCancelResult;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceCanonicalPayload;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceProviderResult;
import com.erp.account.modules.einvoice.repository.CompanyEInvoiceConfigRepository;
import com.erp.account.modules.einvoice.service.EInvoiceCryptoService;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.modules.gst.repository.GstRegistrationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.security.PublicKey;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Map;

/**
 * Concrete production adapter for the official Government of India / National Informatics Centre (NIC)
 * Goods and Services Tax Invoice Registration Portal (IRP) Direct API v1.04.
 *
 * Implements:
 * 1. Mutual Authentication and AuthToken caching with automatic renewal.
 * 2. 256-bit AES symmetric payload encryption and RSA-2048 AppKey asymmetric encryption.
 * 3. IRN generation, statutory cancellation, and reconciliation / status sync.
 * 4. Error classification: Duplicate error (NIC 2150) and network timeout ambiguity.
 * 5. Strict multi-tenant credential isolation with AES-256-GCM encryption at rest.
 */
@Component
@Slf4j
public class NicEInvoiceProvider implements EInvoiceProvider {

    private static final DateTimeFormatter NIC_DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final NicEInvoiceProperties properties;
    private final EInvoiceCryptoService cryptoService;
    private final CompanyEInvoiceConfigRepository configRepository;
    private final GstRegistrationRepository gstRegistrationRepository;
    private final ObjectMapper objectMapper;
    private final ResourceLoader resourceLoader;
    private final HttpClient httpClient;
    private PublicKey testPublicKey; // Hook for unit tests
    private byte[] testAppKey; // Hook for deterministic unit tests

    @Autowired
    public NicEInvoiceProvider(
            NicEInvoiceProperties properties,
            EInvoiceCryptoService cryptoService,
            CompanyEInvoiceConfigRepository configRepository,
            GstRegistrationRepository gstRegistrationRepository,
            ObjectMapper objectMapper,
            ResourceLoader resourceLoader) {
        this(properties, cryptoService, configRepository, gstRegistrationRepository, objectMapper, resourceLoader,
                HttpClient.newBuilder()
                        .connectTimeout(Duration.ofMillis(properties != null ? properties.getConnectTimeoutMs() : 10000))
                        .build());
    }

    public NicEInvoiceProvider(
            NicEInvoiceProperties properties,
            EInvoiceCryptoService cryptoService,
            CompanyEInvoiceConfigRepository configRepository,
            GstRegistrationRepository gstRegistrationRepository,
            ObjectMapper objectMapper,
            ResourceLoader resourceLoader,
            HttpClient httpClient) {
        this.properties = properties;
        this.cryptoService = cryptoService;
        this.configRepository = configRepository;
        this.gstRegistrationRepository = gstRegistrationRepository;
        this.objectMapper = objectMapper;
        this.resourceLoader = resourceLoader;
        this.httpClient = httpClient;
    }

    public void setTestPublicKey(PublicKey testPublicKey) {
        this.testPublicKey = testPublicKey;
    }

    public void setTestAppKey(byte[] testAppKey) {
        this.testAppKey = testAppKey;
    }

    @Override
    public EInvoiceProviderType getProviderType() {
        return EInvoiceProviderType.NIC_DIRECT;
    }

    @Override
    public EInvoiceProviderResult generateIrn(CompanyEInvoiceConfig config, EInvoiceCanonicalPayload payload) {
        long startTime = System.currentTimeMillis();

        if (config == null) {
            return EInvoiceProviderResult.failure("MISSING_CONFIG", "e-Invoice configuration is missing for this tenant", false, false, "{}", "No Config", 0);
        }

        String sellerGstin = (payload != null && payload.getSeller() != null) ? payload.getSeller().getGstin() : resolveGstin(config);
        if (!StringUtils.hasText(sellerGstin)) {
            return EInvoiceProviderResult.failure("MISSING_GSTIN", "Supplier GSTIN is required to initiate IRP request", false, false, "{}", "Missing GSTIN", 0);
        }

        // Validate master encryption key
        if (!cryptoService.isMasterKeyConfigured()) {
            long duration = System.currentTimeMillis() - startTime;
            return EInvoiceProviderResult.failure(
                    "MISSING_MASTER_KEY",
                    "Master encryption key ('erp.einvoice.security.master-key') is not configured in environment.",
                    false, false, "{}", "Master key missing", duration
            );
        }

        // Validate credentials presence
        if (!StringUtils.hasText(config.getClientId()) || !StringUtils.hasText(config.getPortalUsername())
                || !StringUtils.hasText(config.getEncryptedClientSecret()) || !StringUtils.hasText(config.getEncryptedPortalPassword())) {
            long duration = System.currentTimeMillis() - startTime;
            return EInvoiceProviderResult.failure(
                    "MISSING_CREDENTIALS",
                    "NIC Client ID, Client Secret, Portal Username, or Portal Password is not configured in database for GSTIN " + sellerGstin,
                    false, false, "{}", "Missing credentials", duration
            );
        }

        String decryptedClientSecret;
        try {
            decryptedClientSecret = cryptoService.decrypt(config.getEncryptedClientSecret());
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            return EInvoiceProviderResult.failure("DECRYPTION_ERROR", "Failed to decrypt client secret: " + e.getMessage(), false, false, "{}", e.getMessage(), duration);
        }

        // Authenticate or retrieve cached session
        SessionCredentials session;
        try {
            session = getOrRenewSession(config, sellerGstin);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("[NIC IRP] Authentication failed for GSTIN {}", sellerGstin, e);
            return EInvoiceProviderResult.failure("AUTH_FAILURE", e.getMessage(), false, false, "{}", e.getMessage(), duration);
        }

        // Build and Encrypt JSON Payload
        String rawJsonPayload;
        String encryptedData;
        try {
            rawJsonPayload = objectMapper.writeValueAsString(payload);
            encryptedData = NicIrpCryptoUtil.encryptPayloadWithSek(rawJsonPayload, session.sekBytes);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("[NIC IRP] Payload encryption failed for GSTIN {}", sellerGstin, e);
            return EInvoiceProviderResult.failure("ENCRYPTION_ERROR", "Failed to encrypt request payload with SEK: " + e.getMessage(), false, false, "{}", e.getMessage(), duration);
        }

        String requestBody = "{\"Data\":\"" + encryptedData + "\"}";
        String baseUrl = properties.resolveBaseUrl(config.getEnvironment());
        String url = baseUrl + properties.getGeneratePath();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(properties.getReadTimeoutMs()))
                .header("Content-Type", "application/json")
                .header("client-id", config.getClientId())
                .header("client-secret", decryptedClientSecret)
                .header("Gstin", sellerGstin)
                .header("user_name", config.getPortalUsername())
                .header("AuthToken", session.authToken)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long duration = System.currentTimeMillis() - startTime;
            String responseBody = response.body();

            return processGenerateResponse(responseBody, session.sekBytes, rawJsonPayload, duration);
        } catch (HttpTimeoutException e) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("[NIC IRP] Read timeout while generating IRN for doc {}. Marking TIMEOUT_AMBIGUOUS.", payload.getDocNumber());
            return EInvoiceProviderResult.failure("TIMEOUT", "IRP gateway connection/read timeout. Ambiguous status - reconciliation required before re-attempting.", false, true, rawJsonPayload, e.getMessage(), duration);
        } catch (IOException e) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("[NIC IRP] Network I/O exception while communicating with IRP: {}", e.getMessage());
            return EInvoiceProviderResult.failure("NETWORK_ERROR", "Failed to connect to IRP endpoint: " + e.getMessage(), false, true, rawJsonPayload, e.getMessage(), duration);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("[NIC IRP] Unexpected error during IRN generation", e);
            return EInvoiceProviderResult.failure("UNEXPECTED_ERROR", e.getMessage(), false, false, rawJsonPayload, e.getMessage(), duration);
        }
    }

    @Override
    public EInvoiceCancelResult cancelIrn(CompanyEInvoiceConfig config, String irn, String cancelReason, String remarks) {
        long startTime = System.currentTimeMillis();

        if (config == null || !StringUtils.hasText(irn)) {
            return EInvoiceCancelResult.failure(irn, "INVALID_ARGS", "Config and IRN are required for cancellation", "{}", "Invalid Args", 0);
        }

        String gstin = resolveGstin(config);
        if (!StringUtils.hasText(gstin)) {
            return EInvoiceCancelResult.failure(irn, "MISSING_GSTIN", "Supplier GSTIN could not be resolved from configuration", "{}", "Missing GSTIN", 0);
        }
        String decryptedClientSecret;
        try {
            decryptedClientSecret = cryptoService.decrypt(config.getEncryptedClientSecret());
        } catch (Exception e) {
            return EInvoiceCancelResult.failure(irn, "DECRYPTION_ERROR", "Failed to decrypt client secret", "{}", e.getMessage(), 0);
        }

        SessionCredentials session;
        try {
            session = getOrRenewSession(config, gstin);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            return EInvoiceCancelResult.failure(irn, "AUTH_FAILURE", e.getMessage(), "{}", e.getMessage(), duration);
        }

        String cancelJson = String.format("{\"Irn\":\"%s\",\"CnlRsn\":\"%s\",\"CnlRem\":\"%s\"}", irn, cancelReason, remarks);
        String encryptedData;
        try {
            encryptedData = NicIrpCryptoUtil.encryptPayloadWithSek(cancelJson, session.sekBytes);
        } catch (Exception e) {
            return EInvoiceCancelResult.failure(irn, "ENCRYPTION_ERROR", "Failed to encrypt cancel payload: " + e.getMessage(), cancelJson, e.getMessage(), 0);
        }

        String requestBody = "{\"Data\":\"" + encryptedData + "\"}";
        String baseUrl = properties.resolveBaseUrl(config.getEnvironment());
        String url = baseUrl + properties.getCancelPath();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(properties.getReadTimeoutMs()))
                .header("Content-Type", "application/json")
                .header("client-id", config.getClientId())
                .header("client-secret", decryptedClientSecret)
                .header("Gstin", gstin)
                .header("user_name", config.getPortalUsername())
                .header("AuthToken", session.authToken)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long duration = System.currentTimeMillis() - startTime;
            String responseBody = response.body();

            JsonNode root = objectMapper.readTree(responseBody);
            int status = root.path("Status").asInt(0);

            if (status == 1 && root.has("Data")) {
                String decryptedResp = NicIrpCryptoUtil.decryptPayloadWithSek(root.path("Data").asText(), session.sekBytes);
                JsonNode respData = objectMapper.readTree(decryptedResp);
                String cancelDateStr = respData.path("CancelDate").asText(null);
                LocalDateTime cancelDate = parseDateTime(cancelDateStr);

                return EInvoiceCancelResult.success(irn, cancelDate, cancelJson, decryptedResp, duration);
            } else {
                String errCode = "CANCEL_FAILED";
                String errMsg = "Cancellation rejected by IRP";
                if (root.has("ErrorDetails") && root.path("ErrorDetails").isArray() && root.path("ErrorDetails").size() > 0) {
                    JsonNode err = root.path("ErrorDetails").get(0);
                    errCode = err.path("ErrorCode").asText(errCode);
                    errMsg = err.path("ErrorMessage").asText(errMsg);
                }
                return EInvoiceCancelResult.failure(irn, errCode, errMsg, cancelJson, responseBody, duration);
            }
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            return EInvoiceCancelResult.failure(irn, "CANCEL_EXCEPTION", e.getMessage(), cancelJson, e.getMessage(), duration);
        }
    }

    @Override
    public EInvoiceProviderResult getIrnDetails(CompanyEInvoiceConfig config, String irn) {
        long startTime = System.currentTimeMillis();

        if (config == null || !StringUtils.hasText(irn)) {
            return EInvoiceProviderResult.failure("INVALID_ARGS", "Config and IRN are required to query details", false, false, "{}", "Invalid Args", 0);
        }

        String gstin = resolveGstin(config);
        if (!StringUtils.hasText(gstin)) {
            return EInvoiceProviderResult.failure("MISSING_GSTIN", "Supplier GSTIN could not be resolved from configuration", false, false, "{}", "Missing GSTIN", 0);
        }
        String decryptedClientSecret;
        try {
            decryptedClientSecret = cryptoService.decrypt(config.getEncryptedClientSecret());
        } catch (Exception e) {
            return EInvoiceProviderResult.failure("DECRYPTION_ERROR", "Failed to decrypt client secret", false, false, "{}", e.getMessage(), 0);
        }

        SessionCredentials session;
        try {
            session = getOrRenewSession(config, gstin);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            return EInvoiceProviderResult.failure("AUTH_FAILURE", e.getMessage(), false, false, "{}", e.getMessage(), duration);
        }

        String baseUrl = properties.resolveBaseUrl(config.getEnvironment());
        String url = baseUrl + properties.getDetailsPath() + "?irn=" + irn;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(properties.getReadTimeoutMs()))
                .header("client-id", config.getClientId())
                .header("client-secret", decryptedClientSecret)
                .header("Gstin", gstin)
                .header("user_name", config.getPortalUsername())
                .header("AuthToken", session.authToken)
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long duration = System.currentTimeMillis() - startTime;
            String responseBody = response.body();

            JsonNode root = objectMapper.readTree(responseBody);
            int status = root.path("Status").asInt(0);

            if (status == 1 && root.has("Data")) {
                String decryptedResp = NicIrpCryptoUtil.decryptPayloadWithSek(root.path("Data").asText(), session.sekBytes);
                JsonNode respData = objectMapper.readTree(decryptedResp);

                String resolvedIrn = respData.path("Irn").asText(irn);
                String ackNo = respData.path("AckNo").asText(null);
                String ackDtStr = respData.path("AckDt").asText(null);
                LocalDateTime ackDate = parseDateTime(ackDtStr);
                String signedInvoice = respData.path("SignedInvoice").asText(null);
                String signedQrCode = respData.path("SignedQRCode").asText(null);

                return EInvoiceProviderResult.success(resolvedIrn, ackNo, ackDate, signedInvoice, signedQrCode, false, "GET " + url, decryptedResp, duration);
            } else {
                String errCode = "DETAILS_LOOKUP_FAILED";
                String errMsg = "Failed to query IRN details from IRP";
                if (root.has("ErrorDetails") && root.path("ErrorDetails").isArray() && root.path("ErrorDetails").size() > 0) {
                    JsonNode err = root.path("ErrorDetails").get(0);
                    errCode = err.path("ErrorCode").asText(errCode);
                    errMsg = err.path("ErrorMessage").asText(errMsg);
                }
                return EInvoiceProviderResult.failure(errCode, errMsg, false, false, "GET " + url, responseBody, duration);
            }
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            return EInvoiceProviderResult.failure("LOOKUP_EXCEPTION", e.getMessage(), false, false, "GET " + url, e.getMessage(), duration);
        }
    }

    private EInvoiceProviderResult processGenerateResponse(String responseBody, byte[] sekBytes, String rawRequest, long duration) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            int status = root.path("Status").asInt(0);

            if (status == 1 && root.has("Data")) {
                String encryptedData = root.path("Data").asText();
                String decryptedResp = NicIrpCryptoUtil.decryptPayloadWithSek(encryptedData, sekBytes);
                JsonNode respData = objectMapper.readTree(decryptedResp);

                String irn = respData.path("Irn").asText(null);
                String ackNo = respData.path("AckNo").asText(null);
                String ackDtStr = respData.path("AckDt").asText(null);
                LocalDateTime ackDate = parseDateTime(ackDtStr);
                String signedInvoice = respData.path("SignedInvoice").asText(null);
                String signedQrCode = respData.path("SignedQRCode").asText(null);

                return EInvoiceProviderResult.success(
                        irn,
                        ackNo,
                        ackDate,
                        signedInvoice,
                        signedQrCode,
                        false, // Real NIC provider, never mock
                        rawRequest,
                        decryptedResp,
                        duration
                );
            } else {
                String errCode = "IRP_ERROR";
                String errMsg = "Unknown error returned by IRP";
                boolean isDuplicate = false;

                if (root.has("ErrorDetails") && root.path("ErrorDetails").isArray() && root.path("ErrorDetails").size() > 0) {
                    JsonNode firstErr = root.path("ErrorDetails").get(0);
                    errCode = firstErr.path("ErrorCode").asText(errCode);
                    errMsg = firstErr.path("ErrorMessage").asText(errMsg);

                    // NIC Error 2150: Duplicate IRN already exists
                    if ("2150".equals(errCode) || errMsg.toLowerCase().contains("already generated")) {
                        isDuplicate = true;
                    }
                }

                return EInvoiceProviderResult.failure(errCode, errMsg, isDuplicate, false, rawRequest, responseBody, duration);
            }
        } catch (Exception e) {
            log.error("[NIC IRP] Failed to parse or decrypt response payload", e);
            return EInvoiceProviderResult.failure("DECRYPT_RESPONSE_FAILED", e.getMessage(), false, false, rawRequest, responseBody, duration);
        }
    }

    private synchronized SessionCredentials getOrRenewSession(CompanyEInvoiceConfig config, String gstin) throws Exception {
        // Check if existing token is valid for at least another 10 minutes
        if (StringUtils.hasText(config.getEncryptedAuthToken())
                && StringUtils.hasText(config.getEncryptedSek())
                && config.getTokenExpiresAt() != null
                && config.getTokenExpiresAt().isAfter(LocalDateTime.now().plusMinutes(10))) {

            String authToken = cryptoService.decrypt(config.getEncryptedAuthToken());
            String sekBase64 = cryptoService.decrypt(config.getEncryptedSek());
            byte[] sekBytes = Base64.getDecoder().decode(sekBase64);
            return new SessionCredentials(authToken, sekBytes);
        }

        // Perform mutual authentication
        log.info("[NIC IRP] Authenticating with IRP for GSTIN {}", gstin);

        PublicKey publicKey = resolvePublicKey();
        if (publicKey == null) {
            throw new IllegalStateException("NIC RSA Public Key certificate is not configured or could not be loaded. Please configure 'erp.einvoice.nic.public-key-path'.");
        }

        String decryptedClientSecret = cryptoService.decrypt(config.getEncryptedClientSecret());
        String decryptedPortalPassword = cryptoService.decrypt(config.getEncryptedPortalPassword());

        byte[] appKey = testAppKey != null ? testAppKey : NicIrpCryptoUtil.generateAppKey();
        String encryptedAppKey = NicIrpCryptoUtil.encryptAppKeyWithRsa(appKey, publicKey);

        Map<String, Object> authPayload = Map.of(
                "UserName", config.getPortalUsername(),
                "Password", decryptedPortalPassword,
                "AppKey", encryptedAppKey,
                "ForceRefreshAccessToken", false
        );

        String authJson = objectMapper.writeValueAsString(authPayload);
        String baseUrl = properties.resolveBaseUrl(config.getEnvironment());
        String authUrl = baseUrl + properties.getAuthPath();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(authUrl))
                .timeout(Duration.ofMillis(properties.getReadTimeoutMs()))
                .header("Content-Type", "application/json")
                .header("client-id", config.getClientId())
                .header("client-secret", decryptedClientSecret)
                .header("Gstin", gstin)
                .POST(HttpRequest.BodyPublishers.ofString(authJson))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode root = objectMapper.readTree(response.body());

        int status = root.path("Status").asInt(0);
        if (status != 1 || !root.has("Data")) {
            String errCode = "AUTH_FAILED";
            String errMsg = "IRP Authentication failed";
            if (root.has("ErrorDetails") && root.path("ErrorDetails").isArray() && root.path("ErrorDetails").size() > 0) {
                JsonNode err = root.path("ErrorDetails").get(0);
                errCode = err.path("ErrorCode").asText(errCode);
                errMsg = err.path("ErrorMessage").asText(errMsg);
            }
            throw new IllegalStateException(String.format("NIC IRP Authentication rejected [%s]: %s", errCode, errMsg));
        }

        JsonNode data = root.path("Data");
        String authToken = data.path("AuthToken").asText();
        String encryptedSekBase64 = data.path("Sek").asText();
        String tokenExpiryStr = data.path("TokenExpiry").asText(null);

        byte[] sekBytes = NicIrpCryptoUtil.decryptSekWithAppKey(encryptedSekBase64, appKey);

        LocalDateTime expiresAt = parseDateTime(tokenExpiryStr);
        if (expiresAt == null) {
            expiresAt = LocalDateTime.now().plusHours(6); // Default NIC token lifetime
        }

        // Persist session credentials encrypted at rest
        config.setEncryptedAuthToken(cryptoService.encrypt(authToken));
        config.setEncryptedSek(cryptoService.encrypt(Base64.getEncoder().encodeToString(sekBytes)));
        config.setTokenExpiresAt(expiresAt);
        configRepository.save(config);

        log.info("[NIC IRP] Successfully authenticated with IRP for GSTIN {}. Token valid until {}", gstin, expiresAt);
        return new SessionCredentials(authToken, sekBytes);
    }

    private PublicKey resolvePublicKey() {
        if (testPublicKey != null) {
            return testPublicKey;
        }
        return NicIrpCryptoUtil.loadPublicKey(properties.getPublicKeyPath(), resourceLoader);
    }

    private String resolveGstin(CompanyEInvoiceConfig config) {
        if (config.getGstRegistration() != null && StringUtils.hasText(config.getGstRegistration().getGstin())) {
            return config.getGstRegistration().getGstin();
        }
        if (config.getGstRegistrationId() != null) {
            return gstRegistrationRepository.findById(config.getGstRegistrationId())
                    .map(GstRegistration::getGstin)
                    .orElse(null);
        }
        return null;
    }

    private LocalDateTime parseDateTime(String dtStr) {
        if (!StringUtils.hasText(dtStr)) {
            return null;
        }
        try {
            return LocalDateTime.parse(dtStr.trim(), NIC_DATETIME_FORMATTER);
        } catch (Exception e1) {
            try {
                return LocalDateTime.parse(dtStr.trim());
            } catch (Exception e2) {
                return null;
            }
        }
    }

    private static class SessionCredentials {
        final String authToken;
        final byte[] sekBytes;

        SessionCredentials(String authToken, byte[] sekBytes) {
            this.authToken = authToken;
            this.sekBytes = sekBytes;
        }
    }
}
