package com.erp.account.modules.einvoice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for the official National Informatics Centre (NIC)
 * Goods and Services Tax e-Invoice System (IRP) Direct API.
 *
 * All non-secret properties are configurable via application.yml or environment variables.
 * Sensitive secrets (passwords, secrets) are NEVER stored in this configuration;
 * they are stored encrypted at rest in PostgreSQL per tenant/GSTIN.
 */
@Data
@Component
@ConfigurationProperties(prefix = "erp.einvoice.nic")
public class NicEInvoiceProperties {

    /**
     * Official NIC Sandbox Base URL.
     * Default: https://einv-apisandbox.nic.in
     */
    private String sandboxBaseUrl = "https://einv-apisandbox.nic.in";

    /**
     * Official NIC Production Base URL (e.g., IRP-1 to IRP-6).
     * Default: https://einvoice6.gst.gov.in
     */
    private String productionBaseUrl = "https://einvoice6.gst.gov.in";

    /**
     * HTTP connection timeout in milliseconds.
     */
    private int connectTimeoutMs = 10000;

    /**
     * HTTP read / response timeout in milliseconds.
     */
    private int readTimeoutMs = 30000;

    /**
     * Path to the official NIC RSA public key certificate (.pem or .cer)
     * used to encrypt the session AppKey during authentication.
     */
    private String publicKeyPath = "";

    /**
     * Endpoint path for authentication.
     */
    private String authPath = "/api/v1/authenticate";

    /**
     * Endpoint path for generating IRN.
     */
    private String generatePath = "/api/v1/invoice";

    /**
     * Endpoint path for cancelling IRN.
     */
    private String cancelPath = "/api/v1/invoice/cancel";

    /**
     * Endpoint path for querying IRN details.
     */
    private String detailsPath = "/api/v1/invoice/irn";

    /**
     * Resolves the base URL according to the environment string (SANDBOX or PRODUCTION).
     */
    public String resolveBaseUrl(String environment) {
        if ("PRODUCTION".equalsIgnoreCase(environment)) {
            return productionBaseUrl;
        }
        return sandboxBaseUrl;
    }
}
