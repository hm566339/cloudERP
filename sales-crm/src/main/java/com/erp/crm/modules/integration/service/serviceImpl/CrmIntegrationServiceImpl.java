package com.erp.crm.modules.integration.service.serviceImpl;

import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.integration.dto.TenantIntegrationRequest;
import com.erp.crm.modules.integration.dto.TenantIntegrationResponse;
import com.erp.crm.modules.integration.dto.WebhookAckResponse;
import com.erp.crm.modules.integration.entity.CrmIntegrationChannel;
import com.erp.crm.modules.integration.entity.CrmIntegrationWebhookLog;
import com.erp.crm.modules.integration.entity.CrmTenantIntegration;
import com.erp.crm.modules.integration.enums.IntegrationSyncStatus;
import com.erp.crm.modules.integration.enums.WebhookProcessingStatus;
import com.erp.crm.modules.integration.repository.CrmIntegrationChannelRepository;
import com.erp.crm.modules.integration.repository.CrmIntegrationWebhookLogRepository;
import com.erp.crm.modules.integration.repository.CrmTenantIntegrationRepository;
import com.erp.crm.modules.integration.service.CrmIntegrationService;
import com.erp.crm.modules.lead.dto.request.LeadCreateRequest;
import com.erp.crm.modules.lead.dto.response.LeadResponse;
import com.erp.crm.modules.lead.service.CrmLeadService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrmIntegrationServiceImpl implements CrmIntegrationService {

    private final CrmTenantIntegrationRepository tenantIntegrationRepository;
    private final CrmIntegrationWebhookLogRepository webhookLogRepository;
    private final CrmIntegrationChannelRepository channelRepository;
    private final CrmLeadService leadService;
    private final ObjectMapper objectMapper;

    @Override
    public WebhookAckResponse handleWebhook(String slug, String payload, String sourceIp, Map<String, String> headers) {
        log.info("Inbound webhook received on slug: {}", slug);

        CrmTenantIntegration integration = tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse(slug)
                .orElseThrow(() -> new ResourceNotFoundException("No active integration found for webhook slug: " + slug));

        UUID companyId = integration.getCompanyId();
        String idempotencyHash = computeSha256(companyId + ":" + slug + ":" + payload);

        // Check if duplicate
        if (webhookLogRepository.existsByCompanyIdAndIdempotencyHash(companyId, idempotencyHash)) {
            log.info("Duplicate webhook event skipped [hash: {}]", idempotencyHash);
            return WebhookAckResponse.builder()
                    .status("DUPLICATE_ACKNOWLEDGED")
                    .idempotencyHash(idempotencyHash)
                    .processingStatus("DUPLICATE_SKIPPED")
                    .build();
        }

        var channel = channelRepository.findById(integration.getIntegrationChannelId()).orElse(null);

        CrmIntegrationWebhookLog webhookLog = CrmIntegrationWebhookLog.builder()
                .companyId(companyId)
                .tenantIntegrationId(integration.getId())
                .providerCode(channel != null ? channel.getProviderCode() : null)
                .sourceIp(sourceIp)
                .rawPayload(payload)
                .idempotencyHash(idempotencyHash)
                .processingStatus(WebhookProcessingStatus.RECEIVED)
                .retryCount(0)
                .build();
        CrmIntegrationWebhookLog savedLog = webhookLogRepository.save(webhookLog);

        // Ingest Lead from Webhook payload
        UUID createdLeadId = null;
        try {
            LeadCreateRequest leadReq = extractLeadFromPayload(payload, integration.getId());
            LeadResponse createdLead = leadService.createLead(leadReq, companyId);
            createdLeadId = createdLead.getId();

            savedLog.setProcessingStatus(WebhookProcessingStatus.PROCESSED);
            savedLog.setLeadId(createdLeadId);
            savedLog.setProcessedAt(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Failed to normalize/process lead from webhook: {}", e.getMessage(), e);
            savedLog.setProcessingStatus(WebhookProcessingStatus.FAILED);
            savedLog.setErrorMessage(e.getMessage());
        }
        webhookLogRepository.save(savedLog);

        return WebhookAckResponse.builder()
                .status("ACCEPTED")
                .idempotencyHash(idempotencyHash)
                .processingStatus(savedLog.getProcessingStatus().name())
                .leadId(createdLeadId)
                .build();
    }

    @Override
    public TenantIntegrationResponse createTenantIntegration(TenantIntegrationRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        String slug = "wh-" + UUID.randomUUID().toString().substring(0, 12);

        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .integrationChannelId(request.getIntegrationChannelId())
                .connectionName(request.getConnectionName())
                .authType(request.getAuthType())
                .credentialVaultRef(request.getCredentialVaultRef())
                .webhookSlug(slug)
                .syncFrequencyMinutes(request.getSyncFrequencyMinutes() != null ? request.getSyncFrequencyMinutes() : 15)
                .syncStatus(IntegrationSyncStatus.ACTIVE)
                .settingsJson(request.getSettingsJson())
                .isEnabled(true)
                .build();
        integration.setCompanyId(companyId);

        CrmTenantIntegration saved = tenantIntegrationRepository.save(integration);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantIntegrationResponse> getTenantIntegrations(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return tenantIntegrationRepository.findByCompanyIdAndIsDeletedFalse(companyId)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CrmIntegrationChannel> listAvailableChannels() {
        return channelRepository.findByIsActiveTrue();
    }

    @Override
    @Transactional
    public com.erp.crm.modules.integration.dto.SyncTriggerResponse triggerSync(UUID integrationId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmTenantIntegration integration = tenantIntegrationRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, integrationId)
                .orElseThrow(() -> new com.erp.crm.common.exception.ResourceNotFoundException("Integration not found with id: " + integrationId));

        integration.setLastSyncAt(java.time.LocalDateTime.now());
        integration.setSyncStatus(IntegrationSyncStatus.ACTIVE);
        tenantIntegrationRepository.save(integration);

        log.info("Triggered manual pull sync for integration [{}] in company [{}]", integrationId, companyId);
        return com.erp.crm.modules.integration.dto.SyncTriggerResponse.builder()
                .integrationId(integration.getId())
                .syncStatus("TRIGGERED")
                .queuedRecords(0)
                .message("Manual pull sync successfully dispatched")
                .build();
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private LeadCreateRequest extractLeadFromPayload(String payload, UUID tenantIntegrationId) {
        String name = "Inbound Webhook Lead";
        String phone = null;
        String email = null;
        String inquiry = payload;
        String orgName = null;

        if (payload != null && !payload.isBlank()) {
            try {
                JsonNode root = objectMapper.readTree(payload);
                if (root.hasNonNull("name")) name = root.get("name").asText();
                else if (root.hasNonNull("sender_name")) name = root.get("sender_name").asText();
                else if (root.hasNonNull("first_name")) name = root.get("first_name").asText();

                if (root.hasNonNull("phone")) phone = root.get("phone").asText();
                else if (root.hasNonNull("mobile")) phone = root.get("mobile").asText();
                else if (root.hasNonNull("sender_mobile")) phone = root.get("sender_mobile").asText();

                if (root.hasNonNull("email")) email = root.get("email").asText();
                else if (root.hasNonNull("sender_email")) email = root.get("sender_email").asText();

                if (root.hasNonNull("company")) orgName = root.get("company").asText();
                else if (root.hasNonNull("sender_company")) orgName = root.get("sender_company").asText();

                if (root.hasNonNull("query")) inquiry = root.get("query").asText();
                else if (root.hasNonNull("subject")) inquiry = root.get("subject").asText();
            } catch (Exception e) {
                log.warn("Payload is not valid JSON, using raw payload as inquiry text: {}", e.getMessage());
            }
        }

        return LeadCreateRequest.builder()
                .firstName(name != null ? name : "Inbound Lead")
                .organizationName(orgName)
                .phone(phone)
                .email(email)
                .tenantIntegrationId(tenantIntegrationId)
                .rawInquiryText(inquiry)
                .build();
    }

    private TenantIntegrationResponse mapToResponse(CrmTenantIntegration t) {
        return TenantIntegrationResponse.builder()
                .id(t.getId())
                .companyId(t.getCompanyId())
                .integrationChannelId(t.getIntegrationChannelId())
                .connectionName(t.getConnectionName())
                .authType(t.getAuthType())
                .webhookSlug(t.getWebhookSlug())
                .syncFrequencyMinutes(t.getSyncFrequencyMinutes())
                .syncStatus(t.getSyncStatus())
                .lastSyncAt(t.getLastSyncAt())
                .isEnabled(t.getIsEnabled())
                .createdAt(t.getCreatedAt())
                .build();
    }
}

