package com.erp.account.modules.einvoice.service;

import org.springframework.util.StringUtils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility for redacting sensitive authentication tokens, passwords, client secrets,
 * and session keys from logs, HTTP payloads, and database audit entries.
 */
public final class PayloadSanitizer {

    private static final Pattern SENSITIVE_JSON_FIELD_PATTERN = Pattern.compile(
            "\"(client_secret|clientSecret|password|portalPassword|portal_password|auth_token|authToken|token|sek|app_key|sek_key)\"\\s*:\\s*\"([^\"]+)\"",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern AUTH_HEADER_PATTERN = Pattern.compile(
            "(Bearer\\s+|Basic\\s+|Token\\s+)[a-zA-Z0-9_\\-\\.~+/]+=*",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern URL_CREDENTIAL_PATTERN = Pattern.compile(
            "([?&](client_secret|password|token)=)([^&]+)",
            Pattern.CASE_INSENSITIVE
    );

    private PayloadSanitizer() {
        // Utility class
    }

    /**
     * Masks sensitive tokens and secrets in JSON payloads or log messages.
     *
     * @param payload raw text or JSON string
     * @return redacted string with secrets replaced with "********"
     */
    public static String sanitize(String payload) {
        if (!StringUtils.hasText(payload)) {
            return payload;
        }

        // 1. Sanitize JSON fields
        Matcher jsonMatcher = SENSITIVE_JSON_FIELD_PATTERN.matcher(payload);
        StringBuffer sb = new StringBuffer();
        while (jsonMatcher.find()) {
            String fieldName = jsonMatcher.group(1);
            jsonMatcher.appendReplacement(sb, Matcher.quoteReplacement("\"" + fieldName + "\": \"********\""));
        }
        jsonMatcher.appendTail(sb);
        String result = sb.toString();

        // 2. Sanitize Authorization headers
        result = AUTH_HEADER_PATTERN.matcher(result).replaceAll("$1********");

        // 3. Sanitize URL query parameters
        result = URL_CREDENTIAL_PATTERN.matcher(result).replaceAll("$1********");

        return result;
    }
}
