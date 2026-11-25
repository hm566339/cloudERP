package com.erp.communication.service;

import com.erp.communication.channel.CommunicationChannel;
import com.erp.communication.channel.ProviderRegistry;
import com.erp.communication.channel.email.EmailMessage;
import com.erp.communication.channel.email.SmtpEmailProvider;
import com.erp.communication.channel.whatsapp.MockWhatsAppProvider;
import com.erp.communication.channel.whatsapp.WhatsAppMessage;
import com.erp.communication.dto.request.EmailAttachmentDto;
import com.erp.communication.dto.request.SendChannelMessageRequest;
import com.erp.communication.dto.request.SendEmailRequest;
import com.erp.communication.dto.response.CommunicationResponse;
import com.erp.communication.entity.NotificationDelivery;
import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.exception.InvalidRequestException;
import com.erp.communication.model.Attachment;
import com.erp.communication.model.CommunicationResult;
import com.erp.communication.model.DeliveryStatus;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.repository.NotificationDeliveryRepository;
import com.erp.communication.repository.NotificationRequestRepository;
import com.erp.communication.template.RenderedEmail;
import com.erp.communication.template.TemplateCode;
import com.erp.communication.template.TemplateEngineService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.Executor;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommunicationDispatchService {

    private final NotificationRequestRepository requestRepository;
    private final NotificationDeliveryRepository deliveryRepository;
    private final ProviderRegistry providerRegistry;
    private final TemplateEngineService templateEngineService;
    private final Executor communicationTaskExecutor;

    @Autowired(required = false)
    private ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public CommunicationResponse dispatchEmail(SendEmailRequest request) {
        validateEmailRequest(request);

        // 1. Idempotency Check (Within Company Scope)
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<NotificationRequest> existing = requestRepository.findByCompanyIdAndIdempotencyKey(
                    request.getCompanyId(), request.getIdempotencyKey().trim());
            if (existing.isPresent()) {
                NotificationRequest nr = existing.get();
                log.info("Idempotent email request detected | notificationId={} | companyId={} | key={}",
                        nr.getId(), nr.getCompanyId(), nr.getIdempotencyKey());
                return mapToResponse(nr, "Duplicate request recognized via idempotency key; returned previous dispatch status");
            }
        }

        // 2. Render Template or Use Direct Content
        RenderedEmail rendered;
        String eventCode;
        if (request.getTemplateCode() != null) {
            Map<String, Object> templateData = request.getTemplateData() != null
                    ? new HashMap<>(request.getTemplateData())
                    : new HashMap<>();
            if (!templateData.containsKey("email") && request.getRecipient() != null) {
                templateData.put("email", request.getRecipient().trim());
            }
            if (!templateData.containsKey("recipient") && request.getRecipient() != null) {
                templateData.put("recipient", request.getRecipient().trim());
            }
            rendered = templateEngineService.render(request.getTemplateCode(), request.getSubject(), templateData);
            eventCode = request.getTemplateCode().name();
        } else {
            if ((request.getHtmlContent() == null || request.getHtmlContent().isBlank()) &&
                (request.getPlainTextContent() == null || request.getPlainTextContent().isBlank())) {
                throw new InvalidRequestException("Either templateCode or htmlContent/plainTextContent must be provided");
            }
            rendered = RenderedEmail.builder()
                    .subject(request.getSubject() != null ? request.getSubject().trim() : "Notification")
                    .htmlContent(request.getHtmlContent())
                    .plainTextContent(request.getPlainTextContent())
                    .build();
            eventCode = "CUSTOM_EMAIL";
        }

        // 3. Decode Attachments
        List<Attachment> attachments = decodeAttachments(request.getAttachments());

        // 4. Persist NotificationRequest
        UUID notificationId = UUID.randomUUID();
        String maskedRecipient = SmtpEmailProvider.maskEmail(request.getRecipient());

        NotificationRequest entity = NotificationRequest.builder()
                .id(notificationId)
                .companyId(request.getCompanyId())
                .eventCode(eventCode)
                .channel(CommunicationChannel.EMAIL)
                .recipient(request.getRecipient().trim())
                .recipientMasked(maskedRecipient)
                .subject(rendered.getSubject())
                .idempotencyKey(request.getIdempotencyKey() != null ? request.getIdempotencyKey().trim() : null)
                .status(Boolean.TRUE.equals(request.getAsync()) ? NotificationStatus.PENDING : NotificationStatus.PROCESSING)
                .retryCount(0)
                .maxRetries(3)
                .nextRetryAt(Boolean.TRUE.equals(request.getAsync()) ? LocalDateTime.now() : null)
                .payloadJson(sanitizePayloadForLogging(request.getTemplateData()))
                .build();

        NotificationRequest savedRequest = requestRepository.save(entity);

        // 5. Synchronous vs Asynchronous Delivery
        if (Boolean.TRUE.equals(request.getAsync())) {
            log.info("Queued async email request | notificationId={} | companyId={}", notificationId, request.getCompanyId());
            communicationTaskExecutor.execute(() -> executeEmailDelivery(savedRequest.getId(), rendered, attachments));
            return mapToResponse(savedRequest, "Email notification accepted and queued for asynchronous processing");
        } else {
            return executeEmailDelivery(savedRequest.getId(), rendered, attachments);
        }
    }

    @Transactional
    public CommunicationResponse dispatchChannelMessage(SendChannelMessageRequest request) {
        if (request.getChannel() == null) {
            throw new InvalidRequestException("Channel is required");
        }

        // Validate supported channel via registry (throws UnsupportedChannelException for unimplemented channels)
        providerRegistry.getProvider(request.getChannel());

        if (request.getChannel() == CommunicationChannel.WHATSAPP) {
            return dispatchWhatsApp(request);
        }

        // Handle EMAIL channel
        TemplateCode templateCode = null;
        if (request.getTemplateCode() != null && !request.getTemplateCode().isBlank()) {
            try {
                templateCode = TemplateCode.valueOf(request.getTemplateCode().trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                templateCode = TemplateCode.CUSTOM;
            }
        }

        SendEmailRequest emailReq = SendEmailRequest.builder()
                .companyId(request.getCompanyId())
                .recipient(request.getRecipient())
                .subject(request.getSubject())
                .templateCode(templateCode)
                .templateData(request.getTemplateData())
                .idempotencyKey(request.getIdempotencyKey())
                .async(request.getAsync())
                .build();

        return dispatchEmail(emailReq);
    }

    @Transactional
    public CommunicationResponse dispatchWhatsApp(SendChannelMessageRequest request) {
        if (request == null) {
            throw new InvalidRequestException("Request cannot be null");
        }
        if (request.getCompanyId() == null) {
            throw new InvalidRequestException("companyId is required");
        }
        if (request.getRecipient() == null || request.getRecipient().isBlank()) {
            throw new InvalidRequestException("recipient phone number is required");
        }

        // 1. Idempotency Check
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<NotificationRequest> existing = requestRepository.findByCompanyIdAndIdempotencyKey(
                    request.getCompanyId(), request.getIdempotencyKey().trim());
            if (existing.isPresent()) {
                NotificationRequest nr = existing.get();
                log.info("Idempotent WhatsApp request detected | notificationId={} | companyId={} | key={}",
                        nr.getId(), nr.getCompanyId(), nr.getIdempotencyKey());
                return mapToResponse(nr, "Duplicate request recognized via idempotency key; returned previous dispatch status",
                        providerRegistry.getWhatsAppProvider().getProviderName(), null);
            }
        }

        // 2. Extract Message Text
        String messageText;
        if (request.getTemplateData() != null && request.getTemplateData().containsKey("messageText")) {
            messageText = String.valueOf(request.getTemplateData().get("messageText"));
        } else if (request.getSubject() != null && !request.getSubject().isBlank()) {
            messageText = request.getSubject().trim();
        } else {
            messageText = "Notification from Mark2 ERP";
        }

        // 3. Persist NotificationRequest
        UUID notificationId = UUID.randomUUID();
        String maskedRecipient = MockWhatsAppProvider.maskPhoneNumber(request.getRecipient());

        NotificationRequest entity = NotificationRequest.builder()
                .id(notificationId)
                .companyId(request.getCompanyId())
                .eventCode(request.getTemplateCode() != null && !request.getTemplateCode().isBlank() ? request.getTemplateCode().trim() : "WHATSAPP_MESSAGE")
                .channel(CommunicationChannel.WHATSAPP)
                .recipient(request.getRecipient().trim())
                .recipientMasked(maskedRecipient)
                .subject(request.getSubject())
                .idempotencyKey(request.getIdempotencyKey() != null ? request.getIdempotencyKey().trim() : null)
                .status(Boolean.TRUE.equals(request.getAsync()) ? NotificationStatus.PENDING : NotificationStatus.PROCESSING)
                .retryCount(0)
                .maxRetries(3)
                .nextRetryAt(Boolean.TRUE.equals(request.getAsync()) ? LocalDateTime.now() : null)
                .payloadJson(sanitizePayloadForLogging(request.getTemplateData()))
                .build();

        NotificationRequest savedRequest = requestRepository.save(entity);

        // 4. Synchronous vs Asynchronous Delivery
        if (Boolean.TRUE.equals(request.getAsync())) {
            log.info("Queued async WhatsApp request | notificationId={} | companyId={}", notificationId, request.getCompanyId());
            communicationTaskExecutor.execute(() -> executeWhatsAppDelivery(savedRequest.getId(), messageText, request.getTemplateData()));
            return mapToResponse(savedRequest, "WhatsApp notification accepted and queued for asynchronous processing",
                    providerRegistry.getWhatsAppProvider().getProviderName(), null);
        } else {
            return executeWhatsAppDelivery(savedRequest.getId(), messageText, request.getTemplateData());
        }
    }

    @Transactional
    public CommunicationResponse executeWhatsAppDelivery(UUID notificationId, String messageText) {
        return executeWhatsAppDelivery(notificationId, messageText, Collections.emptyMap());
    }

    @Transactional
    public CommunicationResponse executeWhatsAppDelivery(UUID notificationId, String messageText, Map<String, Object> templateData) {
        NotificationRequest request = requestRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalStateException("Notification request not found: " + notificationId));

        Map<String, Object> effectiveTemplateData = (templateData != null && !templateData.isEmpty())
                ? templateData
                : parsePayloadJson(request.getPayloadJson());

        WhatsAppMessage message = WhatsAppMessage.builder()
                .notificationId(request.getId())
                .companyId(request.getCompanyId())
                .recipientPhone(request.getRecipient())
                .templateCode(request.getEventCode())
                .messageText(messageText)
                .templateData(effectiveTemplateData != null ? effectiveTemplateData : Collections.emptyMap())
                .build();

        CommunicationResult result = providerRegistry.getWhatsAppProvider().sendWhatsApp(message);

        int nextAttemptNumber = request.getRetryCount() + 1;
        request.setRetryCount(nextAttemptNumber);

        NotificationDelivery delivery = NotificationDelivery.builder()
                .id(UUID.randomUUID())
                .notificationRequest(request)
                .providerName(result.getProviderName())
                .attemptNumber(nextAttemptNumber)
                .status(result.isSuccess() ? DeliveryStatus.SUBMITTED : DeliveryStatus.FAILED)
                .providerMessageId(result.getProviderMessageId())
                .durationMs(result.getDurationMs())
                .errorDetails(result.getErrorMessage())
                .build();

        deliveryRepository.save(delivery);

        if (result.isSuccess()) {
            request.setStatus(NotificationStatus.ACCEPTED_BY_PROVIDER);
            request.setErrorSummary(null);
            request.setNextRetryAt(null);
        } else {
            request.setErrorSummary(result.getErrorMessage());
            boolean shouldRetry = result.isRetryable() && (request.getRetryCount() < request.getMaxRetries());

            if (shouldRetry) {
                request.setStatus(NotificationStatus.PENDING);
                long delaySeconds = (long) Math.pow(2, request.getRetryCount()) * 30L;
                request.setNextRetryAt(LocalDateTime.now().plusSeconds(delaySeconds));
                log.info("WhatsApp scheduled for retry #{} in {} seconds | notificationId={}",
                        nextAttemptNumber, delaySeconds, request.getId());
            } else {
                request.setStatus(NotificationStatus.FAILED);
                request.setNextRetryAt(null);
                log.warn("WhatsApp permanently failed | notificationId={} | error={}",
                        request.getId(), result.getErrorMessage());
            }
        }

        NotificationRequest updated = requestRepository.save(request);
        String messageResult = result.isSuccess()
                ? "WhatsApp notification accepted by provider"
                : "WhatsApp notification failed: " + result.getErrorMessage();

        return mapToResponse(updated, messageResult, result.getProviderName(), result.getProviderMessageId());
    }

    @Transactional
    public CommunicationResponse executeEmailDelivery(UUID notificationId, RenderedEmail rendered, List<Attachment> attachments) {
        NotificationRequest request = requestRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalStateException("Notification request not found: " + notificationId));

        EmailMessage message = EmailMessage.builder()
                .notificationId(request.getId())
                .companyId(request.getCompanyId())
                .recipient(request.getRecipient())
                .subject(rendered.getSubject())
                .htmlBody(rendered.getHtmlContent())
                .textBody(rendered.getPlainTextContent())
                .attachments(attachments)
                .build();

        CommunicationResult result = providerRegistry.getEmailProvider().sendEmail(message);

        int nextAttemptNumber = request.getRetryCount() + 1;
        request.setRetryCount(nextAttemptNumber);

        NotificationDelivery delivery = NotificationDelivery.builder()
                .id(UUID.randomUUID())
                .notificationRequest(request)
                .providerName(result.getProviderName())
                .attemptNumber(nextAttemptNumber)
                .status(result.isSuccess() ? DeliveryStatus.SUBMITTED : DeliveryStatus.FAILED)
                .providerMessageId(result.getProviderMessageId())
                .durationMs(result.getDurationMs())
                .errorDetails(result.getErrorMessage())
                .build();

        deliveryRepository.save(delivery);

        if (result.isSuccess()) {
            request.setStatus(NotificationStatus.ACCEPTED_BY_PROVIDER);
            request.setErrorSummary(null);
            request.setNextRetryAt(null);
        } else {
            request.setErrorSummary(result.getErrorMessage());
            boolean shouldRetry = result.isRetryable()
                    && !isPermanentFailure(result.getErrorMessage())
                    && (request.getRetryCount() < request.getMaxRetries());

            if (shouldRetry) {
                request.setStatus(NotificationStatus.PENDING);
                // Exponential backoff: 30s, 120s, 600s
                long delaySeconds = (long) Math.pow(2, request.getRetryCount()) * 30L;
                request.setNextRetryAt(LocalDateTime.now().plusSeconds(delaySeconds));
                log.info("Email scheduled for retry #{} in {} seconds | notificationId={}",
                        nextAttemptNumber, delaySeconds, request.getId());
            } else {
                request.setStatus(NotificationStatus.FAILED);
                request.setNextRetryAt(null);
                if (!result.isRetryable() || isPermanentFailure(result.getErrorMessage())) {
                    log.warn("Email marked permanently FAILED (non-retryable error) | notificationId={} | error={}",
                            request.getId(), result.getErrorMessage());
                } else {
                    log.warn("Email permanently failed after reaching max attempts ({}) | notificationId={}",
                            request.getMaxRetries(), request.getId());
                }
            }
        }

        NotificationRequest updated = requestRepository.save(request);
        String messageText = result.isSuccess()
                ? "Email accepted by mail provider for delivery"
                : "Email delivery attempt failed: " + result.getErrorMessage();

        return mapToResponse(updated, messageText, result.getProviderName(), result.getProviderMessageId());
    }

    private boolean isPermanentFailure(String errorMessage) {
        if (errorMessage == null) return false;
        String lower = errorMessage.toLowerCase(Locale.ROOT);
        return lower.contains("invalid recipient")
                || lower.contains("not in multipart mode")
                || lower.contains("syntax error")
                || lower.contains("address syntax");
    }

    private void validateEmailRequest(SendEmailRequest request) {
        if (request == null) {
            throw new InvalidRequestException("SendEmailRequest cannot be null");
        }
        if (request.getCompanyId() == null) {
            throw new InvalidRequestException("companyId is required");
        }
        if (request.getRecipient() == null || request.getRecipient().isBlank()) {
            throw new InvalidRequestException("recipient is required");
        }
    }

    private List<Attachment> decodeAttachments(List<EmailAttachmentDto> attachmentDtos) {
        if (attachmentDtos == null || attachmentDtos.isEmpty()) {
            return Collections.emptyList();
        }
        List<Attachment> list = new ArrayList<>();
        for (EmailAttachmentDto dto : attachmentDtos) {
            if (dto != null && dto.getDataBase64() != null && !dto.getDataBase64().isBlank()) {
                try {
                    byte[] data = Base64.getDecoder().decode(dto.getDataBase64().trim());
                    list.add(Attachment.builder()
                            .filename(dto.getFilename())
                            .contentType(dto.getContentType())
                            .data(data)
                            .build());
                } catch (IllegalArgumentException e) {
                    throw new InvalidRequestException("Invalid Base64 attachment data for file: " + dto.getFilename());
                }
            }
        }
        return list;
    }

    private String sanitizePayloadForLogging(Map<String, Object> data) {
        if (data == null || data.isEmpty()) return null;
        Map<String, Object> copy = new HashMap<>();
        data.forEach((k, v) -> {
            String lower = k.toLowerCase(Locale.ROOT);
            if (lower.contains("password") || lower.contains("token") || lower.contains("secret")
                    || lower.contains("key") || lower.contains("url") || lower.contains("link")) {
                copy.put(k, "[REDACTED]");
            } else {
                copy.put(k, v);
            }
        });
        try {
            if (objectMapper != null) {
                return objectMapper.writeValueAsString(copy);
            }
        } catch (Exception e) {
            log.debug("Could not serialize sanitized payload to JSON: {}", e.getMessage());
        }
        return copy.toString();
    }

    private Map<String, Object> parsePayloadJson(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            if (objectMapper != null) {
                return objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
            }
        } catch (Exception e) {
            log.debug("Could not parse payloadJson with Jackson: {}", e.getMessage());
        }
        // Fallback parser for Map.toString() representation: {key=val, key2=val2}
        Map<String, Object> fallback = new HashMap<>();
        String trimmed = payloadJson.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
            String[] pairs = trimmed.split(",");
            for (String pair : pairs) {
                int eqIdx = pair.indexOf('=');
                if (eqIdx > 0) {
                    String k = pair.substring(0, eqIdx).trim();
                    String v = pair.substring(eqIdx + 1).trim();
                    fallback.put(k, v);
                }
            }
        }
        return fallback;
    }

    private CommunicationResponse mapToResponse(NotificationRequest nr, String message) {
        return mapToResponse(nr, message, "SMTP", null);
    }

    private CommunicationResponse mapToResponse(NotificationRequest nr, String message, String providerName, String providerMsgId) {
        return CommunicationResponse.builder()
                .notificationId(nr.getId())
                .companyId(nr.getCompanyId())
                .channel(nr.getChannel())
                .recipientMasked(nr.getRecipientMasked())
                .status(nr.getStatus())
                .idempotencyKey(nr.getIdempotencyKey())
                .providerName(providerName)
                .providerMessageId(providerMsgId)
                .createdAt(nr.getCreatedAt())
                .message(message)
                .build();
    }
}
