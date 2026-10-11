package com.erp.communication.channel.email;

import com.erp.communication.config.SmtpProperties;
import com.erp.communication.model.Attachment;
import com.erp.communication.model.CommunicationResult;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class SmtpEmailProvider implements EmailProvider {

    private final JavaMailSender mailSender;
    private final SmtpProperties smtpProperties;

    @Override
    public String getProviderName() {
        return "SMTP";
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public CommunicationResult sendEmail(EmailMessage message) {
        long startTime = System.currentTimeMillis();
        String maskedRecipient = maskEmail(message.getRecipient());

        log.info("Dispatching email via SMTP | notificationId={} | to={} | subject='{}'",
                message.getNotificationId(), maskedRecipient, sanitizeLog(message.getSubject()));

        try {
            validateRecipient(message.getRecipient());

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            boolean hasAttachments = message.getAttachments() != null && !message.getAttachments().isEmpty();

            // Always initialize MimeMessageHelper with multipart mode (true) so that:
            // 1. Alternative body parts (both plain-text and HTML) can be set via helper.setText(plainText, html)
            // 2. Inline elements and file attachments are supported without throwing "Not in multipart mode"
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    true,
                    StandardCharsets.UTF_8.name()
            );

            // 1. Explicit Configured From Address and Display Name
            String fromAddress = smtpProperties.getFromAddress();
            String fromName = smtpProperties.getFromName();
            if (fromAddress == null || fromAddress.isBlank()) {
                fromAddress = "noreply@mark2.in";
            }
            if (fromName != null && !fromName.isBlank()) {
                helper.setFrom(new InternetAddress(fromAddress.trim(), fromName.trim(), StandardCharsets.UTF_8.name()));
            } else {
                helper.setFrom(fromAddress.trim());
            }

            // 2. Reply-To if configured
            if (smtpProperties.getReplyTo() != null && !smtpProperties.getReplyTo().isBlank()) {
                helper.setReplyTo(smtpProperties.getReplyTo().trim());
            }

            // 3. Recipient and Subject
            helper.setTo(message.getRecipient().trim());
            helper.setSubject(message.getSubject() != null ? message.getSubject() : "");

            // 4. HTML and Plain Text Alternative Handling
            String htmlBody = message.getHtmlBody();
            String textBody = message.getTextBody();

            if (htmlBody != null && !htmlBody.isBlank() && textBody != null && !textBody.isBlank()) {
                // First parameter is plain-text alternative, second is HTML body
                helper.setText(textBody, htmlBody);
            } else if (htmlBody != null && !htmlBody.isBlank()) {
                helper.setText(htmlBody, true);
            } else if (textBody != null) {
                helper.setText(textBody, false);
            } else {
                helper.setText("", false);
            }

            // 5. Attachments
            if (hasAttachments) {
                for (Attachment att : message.getAttachments()) {
                    if (att != null && att.getData() != null && att.getFilename() != null) {
                        String contentType = (att.getContentType() != null && !att.getContentType().isBlank())
                                ? att.getContentType()
                                : "application/octet-stream";
                        helper.addAttachment(att.getFilename(), new ByteArrayResource(att.getData()), contentType);
                    }
                }
            }

            // 6. Send through SMTP socket
            mimeMessage.saveChanges();
            mailSender.send(mimeMessage);

            long duration = System.currentTimeMillis() - startTime;
            String messageId = mimeMessage.getMessageID() != null ? mimeMessage.getMessageID() : "smtp-" + message.getNotificationId();

            log.info("Email accepted by SMTP server | notificationId={} | to={} | durationMs={}",
                    message.getNotificationId(), maskedRecipient, duration);

            return CommunicationResult.success(getProviderName(), messageId, duration);

        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - startTime;
            String sanitizedError = sanitizeError(ex.getMessage());
            boolean retryable = !isPermanentError(ex);

            log.error("SMTP dispatch failed | notificationId={} | to={} | error={} | retryable={} | durationMs={}",
                    message.getNotificationId(), maskedRecipient, sanitizedError, retryable, duration);
            return CommunicationResult.failure(getProviderName(), sanitizedError, retryable, duration);
        }
    }

    private void validateRecipient(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Recipient email address cannot be null or empty");
        }
        String trimmed = email.trim();
        if (!trimmed.contains("@") || trimmed.startsWith("@") || trimmed.endsWith("@")) {
            throw new IllegalArgumentException("Invalid recipient email address format: " + maskEmail(trimmed));
        }
    }

    private boolean isPermanentError(Exception ex) {
        if (ex instanceof IllegalArgumentException || ex instanceof IllegalStateException) {
            return true;
        }
        String msg = ex.getMessage();
        if (msg == null) return false;
        String lower = msg.toLowerCase(Locale.ROOT);
        return lower.contains("invalid recipient")
                || lower.contains("not in multipart mode")
                || lower.contains("address syntax")
                || lower.contains("550")
                || lower.contains("501")
                || lower.contains("553")
                || lower.contains("500")
                || lower.contains("502")
                || lower.contains("503")
                || lower.contains("504");
    }

    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "[empty]";
        }
        int atIdx = email.indexOf('@');
        if (atIdx <= 1) {
            return "***" + email.substring(Math.max(0, atIdx));
        }
        String local = email.substring(0, atIdx);
        String domain = email.substring(atIdx);
        return local.charAt(0) + "***" + local.charAt(local.length() - 1) + domain;
    }

    private String sanitizeLog(String input) {
        if (input == null) return "";
        return input.replaceAll("[\r\n]", " ").trim();
    }

    private String sanitizeError(String rawError) {
        if (rawError == null) return "Unknown SMTP error";
        // Scrub potential passwords, tokens, or sensitive setup links
        return rawError
                .replaceAll("(?i)(password|token|secret|authorization|key|auth)=[^\\s,]+", "$1=***")
                .replaceAll("https?://[^\\s]+token=[^\\s]+", "https://...[REDACTED_LINK]");
    }
}
