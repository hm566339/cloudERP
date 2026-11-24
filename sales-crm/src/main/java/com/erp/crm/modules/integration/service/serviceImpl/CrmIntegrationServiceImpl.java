package com.erp.crm.modules.integration.service.serviceImpl;

import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.security.CurrentUserContext;
import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.integration.dto.SyncTriggerResponse;
import com.erp.crm.modules.integration.dto.TenantIntegrationRequest;
import com.erp.crm.modules.integration.dto.TenantIntegrationResponse;
import com.erp.crm.modules.integration.dto.WebhookAckResponse;
import com.erp.crm.modules.integration.entity.CrmIntegrationChannel;
import com.erp.crm.modules.integration.entity.CrmIntegrationWebhookLog;
import com.erp.crm.modules.integration.entity.CrmTenantIntegration;
import com.erp.crm.modules.integration.entity.TenantIntegrationEntity;
import com.erp.crm.modules.integration.enums.IntegrationProvider;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import com.erp.crm.modules.integration.enums.IntegrationSyncStatus;
import com.erp.crm.modules.integration.enums.TenantIntegrationStatus;
import com.erp.crm.modules.integration.enums.WebhookProcessingStatus;
import com.erp.crm.modules.integration.repository.CrmIntegrationChannelRepository;
import com.erp.crm.modules.integration.repository.CrmIntegrationWebhookLogRepository;
import com.erp.crm.modules.integration.repository.CrmTenantIntegrationRepository;
import com.erp.crm.modules.integration.repository.TenantIntegrationEntityRepository;
import com.erp.crm.modules.integration.service.CrmIntegrationService;
import com.erp.crm.modules.lead.dto.request.LeadCreateRequest;
import com.erp.crm.modules.lead.dto.response.LeadResponse;
import com.erp.crm.modules.lead.repository.CrmLeadRepository;
import com.erp.crm.modules.lead.service.CrmLeadService;
import com.erp.crm.modules.setting.entity.CrmLeadSource;
import com.erp.crm.modules.setting.repository.CrmLeadSourceRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrmIntegrationServiceImpl implements CrmIntegrationService {

    private final CrmTenantIntegrationRepository tenantIntegrationRepository;
    private final TenantIntegrationEntityRepository tenantIntegrationEntityRepository;
    private final CrmLeadRepository leadRepository;
    private final CrmIntegrationWebhookLogRepository webhookLogRepository;
    private final CrmIntegrationChannelRepository channelRepository;
    private final CrmLeadSourceRepository leadSourceRepository;
    private final CrmLeadService leadService;
    private final ObjectMapper objectMapper;

    private CrmTenantIntegration bridgeTwoTierEntity(TenantIntegrationEntity twoTier) {
        IntegrationProvider legacyProvider = switch (twoTier.getProviderCode()) {
            case FACEBOOK -> IntegrationProvider.META_LEAD_ADS;
            case INDIAMART -> IntegrationProvider.INDIAMART;
            case TRADEINDIA -> IntegrationProvider.TRADEINDIA;
            case CUSTOM_WEBHOOK -> IntegrationProvider.WEBHOOK;
            default -> IntegrationProvider.WEBHOOK;
        };
        CrmIntegrationChannel ch = channelRepository.findByProviderCode(legacyProvider).orElse(null);
        CrmTenantIntegration bridged = CrmTenantIntegration.builder()
                .integrationChannelId(ch != null ? ch.getId() : null)
                .webhookSlug(twoTier.getWebhookSlug())
                .connectionName(twoTier.getIntegrationName())
                .isEnabled(twoTier.getStatus() == TenantIntegrationStatus.CONNECTED)
                .syncStatus(IntegrationSyncStatus.ACTIVE)
                .settingsJson(twoTier.getCredentialsJson())
                .build();
        bridged.setId(twoTier.getId());
        bridged.setCompanyId(twoTier.getTenantId());
        return bridged;
    }

    @Override
    @Transactional(readOnly = true)
    public String verifyWebhook(String slug, String mode, String challenge, String verifyToken) {
        log.info("Webhook verification challenge received for slug: {}, mode: {}", slug, mode);

        if ("facebook".equalsIgnoreCase(slug) || "meta".equalsIgnoreCase(slug)) {
            if (mode != null && !"subscribe".equalsIgnoreCase(mode)) {
                log.warn("Invalid webhook subscription mode for Facebook: {}", mode);
                throw new IllegalArgumentException("Invalid mode. Expected 'subscribe'");
            }
            if (challenge == null || challenge.isBlank()) {
                throw new IllegalArgumentException("Missing hub.challenge");
            }
            log.info("Meta Webhook verification challenge accepted for slug [{}]: {}", slug, challenge);
            return challenge;
        }

        CrmTenantIntegration integration = tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse(slug)
                .orElseGet(() -> tenantIntegrationEntityRepository.findByWebhookSlugAndIsDeletedFalse(slug)
                        .map(this::bridgeTwoTierEntity)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "No active integration found for webhook slug: " + slug)));

        if (mode != null && !"subscribe".equalsIgnoreCase(mode)) {
            log.warn("Invalid webhook subscription mode: {}", mode);
            throw new IllegalArgumentException("Invalid mode. Expected 'subscribe'");
        }

        String expectedSecret = extractWebhookSecret(integration);
        if (expectedSecret != null && !expectedSecret.isBlank()) {
            if (verifyToken == null || !expectedSecret.equals(verifyToken)) {
                log.warn("Webhook verification token mismatch for slug: {}", slug);
                throw new SecurityException("Verify token mismatch");
            }
        }

        log.info("Webhook verified successfully for slug: {}", slug);
        return challenge != null ? challenge : "OK";
    }

    @Override
    public WebhookAckResponse handleWebhook(String slug, String payload, String sourceIp, Map<String, String> headers) {
        log.info("Inbound webhook received on slug: {}", slug);

        CrmTenantIntegration integration = tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse(slug)
                .orElseGet(() -> tenantIntegrationEntityRepository.findByWebhookSlugAndIsDeletedFalse(slug)
                        .map(this::bridgeTwoTierEntity)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "No active integration found for webhook slug: " + slug)));

        UUID companyId = integration.getCompanyId();
        String idempotencyHash = computeSha256(companyId + ":" + slug + ":" + payload);

        // Check if duplicate
        if (webhookLogRepository.existsByCompanyIdAndIdempotencyHash(companyId, idempotencyHash)) {
            log.info("Duplicate webhook event skipped [hash: {}]", idempotencyHash);
            return WebhookAckResponse.builder()
                    .status("DUPLICATE_ACKNOWLEDGED")
                    .idempotencyHash(idempotencyHash)
                    .processingStatus("DUPLICATE_SKIPPED")
                    .message("Duplicate event ignored")
                    .build();
        }

        CrmIntegrationChannel channel = null;
        if (integration.getIntegrationChannelId() != null) {
            channel = channelRepository.findById(integration.getIntegrationChannelId()).orElse(null);
        }

        IntegrationProvider providerCode = channel != null && channel.getProviderCode() != null
                ? channel.getProviderCode()
                : resolveProviderFromSettings(integration.getSettingsJson());

        String headersJson = null;
        if (headers != null && !headers.isEmpty()) {
            try {
                headersJson = objectMapper.writeValueAsString(headers);
            } catch (Exception e) {
                headersJson = headers.toString();
            }
        }

        CrmIntegrationWebhookLog webhookLog = CrmIntegrationWebhookLog.builder()
                .companyId(companyId)
                .tenantIntegrationId(integration.getId())
                .providerCode(providerCode)
                .sourceIp(sourceIp)
                .headersJson(headersJson)
                .rawPayload(payload != null ? payload : "")
                .idempotencyHash(idempotencyHash)
                .processingStatus(WebhookProcessingStatus.RECEIVED)
                .retryCount(0)
                .build();
        CrmIntegrationWebhookLog savedLog = webhookLogRepository.save(webhookLog);

        List<UUID> createdLeadIds = new ArrayList<>();
        try {
            // Resolve or seed lead source for this provider
            UUID leadSourceId = getOrCreateLeadSourceId(companyId, providerCode);

            // Extract one or many leads from incoming payload
            List<LeadCreateRequest> leadRequests = extractLeadsFromPayload(payload, providerCode, integration);
            if (leadRequests.isEmpty()) {
                leadRequests.add(LeadCreateRequest.builder()
                        .firstName("Inbound " + formatProviderTitle(providerCode) + " Lead")
                        .rawInquiryText(payload)
                        .tenantIntegrationId(integration.getId())
                        .build());
            }

            CurrentUserContext.setCompanyId(companyId);
            try {
                for (LeadCreateRequest leadReq : leadRequests) {
                    // Deduplicate external leads by externalLeadId (e.g. TradeIndia rfi_id,
                    // IndiaMART queryId)
                    if (leadReq.getExternalLeadId() != null && !leadReq.getExternalLeadId().isBlank()
                            && leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(companyId,
                                    leadReq.getExternalLeadId())) {
                        log.info("Skipping already ingested external lead [externalLeadId: {}] for company [{}]",
                                leadReq.getExternalLeadId(), companyId);
                        continue;
                    }

                    leadReq.setTenantIntegrationId(integration.getId());
                    if (leadReq.getLeadSourceId() == null) {
                        leadReq.setLeadSourceId(leadSourceId);
                    }
                    LeadResponse createdLead = leadService.createLead(leadReq, companyId);
                    if (createdLead != null && createdLead.getId() != null) {
                        createdLeadIds.add(createdLead.getId());
                    }
                }
            } finally {
                CurrentUserContext.clearCompanyId();
            }

            UUID firstLeadId = !createdLeadIds.isEmpty() ? createdLeadIds.get(0) : null;
            savedLog.setProcessingStatus(WebhookProcessingStatus.PROCESSED);
            savedLog.setLeadId(firstLeadId);
            savedLog.setProcessedAt(LocalDateTime.now());

            integration.setLastSyncAt(LocalDateTime.now());
            integration.setSyncStatus(IntegrationSyncStatus.ACTIVE);
            if (tenantIntegrationRepository.existsById(integration.getId())) {
                tenantIntegrationRepository.save(integration);
            }

            tenantIntegrationEntityRepository.findByWebhookSlugAndIsDeletedFalse(slug).ifPresent(entity -> {
                entity.setLastSyncedAt(LocalDateTime.now());
                entity.setStatus(TenantIntegrationStatus.CONNECTED);
                tenantIntegrationEntityRepository.save(entity);
            });

            log.info("Successfully ingested {} leads from webhook slug [{}] provider [{}]",
                    createdLeadIds.size(), slug, providerCode);
        } catch (Exception e) {
            log.error("Failed to process webhook leads: {}", e.getMessage(), e);
            savedLog.setProcessingStatus(WebhookProcessingStatus.FAILED);
            savedLog.setErrorMessage(e.getMessage());
            integration.setLastErrorMessage(e.getMessage());
            tenantIntegrationRepository.save(integration);
        }
        webhookLogRepository.save(savedLog);

        return WebhookAckResponse.builder()
                .status("ACCEPTED")
                .idempotencyHash(idempotencyHash)
                .processingStatus(savedLog.getProcessingStatus().name())
                .leadId(!createdLeadIds.isEmpty() ? createdLeadIds.get(0) : null)
                .leadIds(createdLeadIds)
                .leadsCount(createdLeadIds.size())
                .provider(providerCode != null ? providerCode.name() : "WEBHOOK")
                .message("Successfully processed " + createdLeadIds.size() + " leads")
                .build();
    }

    @Override
    public TenantIntegrationResponse createTenantIntegration(TenantIntegrationRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);

        String name = request.getConnectionName();
        if (name == null || name.isBlank()) {
            name = request.getIntegrationName();
        }
        if (name == null || name.isBlank()) {
            name = (request.getChannelCode() != null ? request.getChannelCode() : "WEBHOOK") + " Integration";
        }

        // Resolve Channel
        CrmIntegrationChannel channel = null;
        if (request.getIntegrationChannelId() != null) {
            channel = channelRepository.findById(request.getIntegrationChannelId()).orElse(null);
        }
        if (channel == null && request.getChannelCode() != null && !request.getChannelCode().isBlank()) {
            IntegrationProvider provider = parseProviderCode(request.getChannelCode());
            channel = channelRepository.findByProviderCode(provider).orElse(null);
        }
        if (channel == null) {
            channel = channelRepository.findByProviderCode(IntegrationProvider.WEBHOOK).orElse(null);
        }
        if (channel == null) {
            // Seed fallback webhook channel if not present
            channel = channelRepository.save(CrmIntegrationChannel.builder()
                    .providerCode(IntegrationProvider.WEBHOOK)
                    .providerName("Custom Generic Webhook")
                    .providerCategory("INBOUND")
                    .supportsPush(true)
                    .supportsPull(false)
                    .isActive(true)
                    .build());
        }

        String slug = request.getWebhookSlug();
        if (slug == null || slug.isBlank()) {
            slug = sanitizeSlug(name) + "-" + UUID.randomUUID().toString().substring(0, 8);
        } else {
            slug = sanitizeSlug(slug);
        }

        // Build settings JSON to preserve apiKey, webhookSecret, autoQualify,
        // roundRobinPoolId
        String settingsJson = request.getSettingsJson();
        if (settingsJson == null || settingsJson.isBlank()) {
            Map<String, Object> settings = new HashMap<>();
            if (request.getApiKey() != null)
                settings.put("apiKey", request.getApiKey());
            if (request.getWebhookSecret() != null)
                settings.put("webhookSecret", request.getWebhookSecret());
            if (request.getAutoQualify() != null)
                settings.put("autoQualify", request.getAutoQualify());
            if (request.getRoundRobinPoolId() != null)
                settings.put("roundRobinPoolId", request.getRoundRobinPoolId().toString());
            if (request.getChannelCode() != null)
                settings.put("channelCode", request.getChannelCode());
            try {
                settingsJson = objectMapper.writeValueAsString(settings);
            } catch (Exception e) {
                settingsJson = "{}";
            }
        }

        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .integrationChannelId(channel.getId())
                .connectionName(name)
                .authType(request.getAuthType() != null ? request.getAuthType() : "API_KEY")
                .credentialVaultRef(request.getCredentialVaultRef())
                .webhookSecretHash(request.getWebhookSecret())
                .webhookSlug(slug)
                .syncFrequencyMinutes(
                        request.getSyncFrequencyMinutes() != null ? request.getSyncFrequencyMinutes() : 15)
                .syncStatus(IntegrationSyncStatus.ACTIVE)
                .settingsJson(settingsJson)
                .isEnabled(true)
                .build();
        integration.setCompanyId(companyId);

        CrmTenantIntegration saved = tenantIntegrationRepository.save(integration);
        return mapToResponse(saved, channel);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantIntegrationResponse> getTenantIntegrations(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        List<CrmTenantIntegration> list = tenantIntegrationRepository.findByCompanyIdAndIsDeletedFalse(companyId);

        Map<UUID, CrmIntegrationChannel> channelMap = new HashMap<>();
        for (CrmTenantIntegration item : list) {
            if (item.getIntegrationChannelId() != null && !channelMap.containsKey(item.getIntegrationChannelId())) {
                channelRepository.findById(item.getIntegrationChannelId())
                        .ifPresent(ch -> channelMap.put(ch.getId(), ch));
            }
        }

        return list.stream().map(t -> mapToResponse(t, channelMap.get(t.getIntegrationChannelId()))).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CrmIntegrationChannel> listAvailableChannels() {
        return channelRepository.findByIsActiveTrue();
    }

    @Override
    @Transactional
    public SyncTriggerResponse triggerSync(UUID integrationId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmTenantIntegration integration = tenantIntegrationRepository
                .findByCompanyIdAndIdAndIsDeletedFalse(companyId, integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found with id: " + integrationId));

        integration.setLastSyncAt(LocalDateTime.now());
        integration.setSyncStatus(IntegrationSyncStatus.ACTIVE);
        tenantIntegrationRepository.save(integration);

        log.info("Triggered manual pull sync for integration [{}] in company [{}]", integrationId, companyId);
        return SyncTriggerResponse.builder()
                .integrationId(integration.getId())
                .syncStatus("TRIGGERED")
                .queuedRecords(0)
                .message("Manual pull sync successfully dispatched")
                .build();
    }

    // =========================================================================
    // Multi-Provider Payload Extraction Logic
    // =========================================================================

    public List<LeadCreateRequest> extractLeadsFromPayload(String payload, IntegrationProvider provider,
            CrmTenantIntegration integration) {
        List<LeadCreateRequest> leads = new ArrayList<>();
        if (payload == null || payload.isBlank()) {
            return leads;
        }

        try {
            JsonNode root = objectMapper.readTree(payload);

            if (provider == IntegrationProvider.INDIAMART) {
                leads.addAll(extractIndiaMartLeads(root));
            } else if (provider == IntegrationProvider.TRADEINDIA) {
                leads.addAll(extractTradeIndiaLeads(root));
            } else if (provider == IntegrationProvider.META_LEAD_ADS) {
                leads.addAll(extractMetaLeadAds(root, integration));
            } else {
                // Generic / Custom Webhook or auto-detection
                if (isIndiaMartFormat(root)) {
                    leads.addAll(extractIndiaMartLeads(root));
                } else if (isTradeIndiaFormat(root)) {
                    leads.addAll(extractTradeIndiaLeads(root));
                } else if (isMetaLeadFormat(root)) {
                    leads.addAll(extractMetaLeadAds(root, integration));
                } else {
                    leads.addAll(extractGenericLeads(root));
                }
            }
        } catch (Exception e) {
            log.warn("Payload is not valid JSON or failed structured parsing, capturing raw text: {}", e.getMessage());
            leads.add(LeadCreateRequest.builder()
                    .firstName("Inbound " + (provider != null ? formatProviderTitle(provider) : "Webhook") + " Lead")
                    .rawInquiryText(payload)
                    .build());
        }

        return leads;
    }

    private List<LeadCreateRequest> extractIndiaMartLeads(JsonNode root) {
        List<LeadCreateRequest> leads = new ArrayList<>();

        // Case A: Wrapped in RESPONSE array: { "RESPONSE": [ { ... } ] }
        if (root.has("RESPONSE") && root.get("RESPONSE").isArray()) {
            for (JsonNode item : root.get("RESPONSE")) {
                leads.add(parseSingleIndiaMartLead(item));
            }
            return leads;
        }

        // Case B: Direct array of leads
        if (root.isArray()) {
            for (JsonNode item : root) {
                leads.add(parseSingleIndiaMartLead(item));
            }
            return leads;
        }

        // Case C: Single JSON object
        leads.add(parseSingleIndiaMartLead(root));
        return leads;
    }

    private LeadCreateRequest parseSingleIndiaMartLead(JsonNode node) {
        String fullName = getFieldIgnoreCase(node, "SENDER_NAME", "SENDERNAME", "sender_name", "name", "contact_name");
        String phone = getFieldIgnoreCase(node, "SENDER_MOBILE", "SENDERMOBILE", "sender_mobile", "mobile", "phone",
                "SENDER_MOBILE_ALT");
        String email = getFieldIgnoreCase(node, "SENDER_EMAIL", "SENDEREMAIL", "sender_email", "email");
        String company = getFieldIgnoreCase(node, "SENDER_COMPANY", "SENDERCOMPANY", "sender_company", "company");
        String city = getFieldIgnoreCase(node, "SENDER_CITY", "SENDER_CITY_NAME", "city");
        String state = getFieldIgnoreCase(node, "SENDER_STATE", "state");
        String country = getFieldIgnoreCase(node, "SENDER_COUNTRY_ISO", "country");
        String address = getFieldIgnoreCase(node, "SENDER_ADDRESS", "address");
        String queryId = getFieldIgnoreCase(node, "UNIQUEQUERYID", "QUERY_ID", "QID", "query_id");
        String productName = getFieldIgnoreCase(node, "QUERY_PRODUCT_NAME", "PRODUCT_NAME", "subject", "product");
        String message = getFieldIgnoreCase(node, "QUERY_MESSAGE", "QUERY_DETAILS", "ENQUIRY_MESSAGE", "message",
                "query");

        String[] names = splitFullName(fullName, "IndiaMART Buyer");

        List<LeadCreateRequest.ProductInterestRequest> products = null;
        if (productName != null && !productName.isBlank()) {
            products = List.of(LeadCreateRequest.ProductInterestRequest.builder()
                    .productName(productName.trim())
                    .specifications(message)
                    .build());
        }

        return LeadCreateRequest.builder()
                .firstName(names[0])
                .lastName(names[1])
                .organizationName(company)
                .phone(phone)
                .email(email)
                .city(city)
                .state(state)
                .country(country != null ? country : "India")
                .addressLine1(address)
                .rawInquiryText(message != null ? message : productName)
                .externalLeadId(queryId)
                .utmSource("IndiaMART")
                .utmMedium("b2b_marketplace")
                .inquiredProducts(products)
                .build();
    }

    private List<LeadCreateRequest> extractTradeIndiaLeads(JsonNode root) {
        List<LeadCreateRequest> leads = new ArrayList<>();

        // Case A: Wrapped in inquiries array
        if (root.has("inquiries") && root.get("inquiries").isArray()) {
            for (JsonNode item : root.get("inquiries")) {
                leads.add(parseSingleTradeIndiaLead(item));
            }
            return leads;
        }

        // Case B: Direct array
        if (root.isArray()) {
            for (JsonNode item : root) {
                leads.add(parseSingleTradeIndiaLead(item));
            }
            return leads;
        }

        // Case C: Single inquiry object
        leads.add(parseSingleTradeIndiaLead(root));
        return leads;
    }

    private LeadCreateRequest parseSingleTradeIndiaLead(JsonNode node) {
        String fullName = getFieldIgnoreCase(node, "sender_name", "senderName", "name", "contact_person");
        String phone = getFieldIgnoreCase(node, "sender_mobile", "senderMobile", "mobile_no", "mobile", "phone");
        String email = getFieldIgnoreCase(node, "sender_email", "senderEmail", "email");
        String company = getFieldIgnoreCase(node, "sender_co", "sender_company", "company_name", "company");
        String city = getFieldIgnoreCase(node, "sender_city", "city");
        String state = getFieldIgnoreCase(node, "sender_state", "state");
        String country = getFieldIgnoreCase(node, "sender_country", "country");
        String address = getFieldIgnoreCase(node, "sender_address", "address");
        String refId = getFieldIgnoreCase(node, "rfi_id", "r_id", "inquiry_id", "id", "rfq_id");
        String subject = getFieldIgnoreCase(node, "product_name", "subject", "product", "item_name");
        String message = getFieldIgnoreCase(node, "message", "query", "description", "details");

        String[] names = splitFullName(fullName, "TradeIndia Buyer");

        List<LeadCreateRequest.ProductInterestRequest> products = null;
        if (subject != null && !subject.isBlank()) {
            String prodName = cleanSubjectToProductName(subject);
            products = List.of(LeadCreateRequest.ProductInterestRequest.builder()
                    .productName(prodName)
                    .specifications(message)
                    .build());
        }

        return LeadCreateRequest.builder()
                .firstName(names[0])
                .lastName(names[1])
                .organizationName(company)
                .phone(phone)
                .email(email)
                .city(city)
                .state(state)
                .country(country != null ? country : "India")
                .addressLine1(address)
                .rawInquiryText(message != null ? message : subject)
                .externalLeadId(refId)
                .utmSource("TradeIndia")
                .utmMedium("b2b_marketplace")
                .inquiredProducts(products)
                .build();
    }

    private List<LeadCreateRequest> extractMetaLeadAds(JsonNode root) {
        return extractMetaLeadAds(root, null);
    }

    private List<LeadCreateRequest> extractMetaLeadAds(JsonNode root, CrmTenantIntegration integration) {
        List<LeadCreateRequest> leads = new ArrayList<>();

        // Case A: Meta Webhook Event Notification: entry[].changes[].value
        if (root.has("entry") && root.get("entry").isArray()) {
            for (JsonNode entry : root.get("entry")) {
                if (entry.has("changes") && entry.get("changes").isArray()) {
                    for (JsonNode change : entry.get("changes")) {
                        JsonNode val = change.path("value");
                        if (!val.isMissingNode()) {
                            String leadgenId = val.path("leadgen_id").asText(null);
                            String pageId = val.path("page_id").asText(entry.path("id").asText(null));

                            // If val doesn't have field_data, fetch from Graph API using integration token
                            if (leadgenId != null && !leadgenId.isBlank() && !val.has("field_data")
                                    && integration != null) {
                                String pageToken = extractPageAccessTokenFromSettings(integration.getSettingsJson(),
                                        pageId);
                                if (pageToken != null && !pageToken.isBlank() && !pageToken.startsWith("mock_")) {
                                    try {
                                        String leadUrl = String.format(
                                                "https://graph.facebook.com/v19.0/%s?fields=created_time,id,ad_id,form_id,field_data&access_token=%s",
                                                leadgenId, URLEncoder.encode(pageToken, StandardCharsets.UTF_8));
                                        log.info("[Meta Webhook] Fetching lead details from Graph API: leadgen_id={}",
                                                leadgenId);
                                        String body = httpGet(leadUrl, 10);
                                        if (body != null && !body.isBlank() && body.contains("field_data")) {
                                            JsonNode leadNode = objectMapper.readTree(body);
                                            leads.add(parseMetaLeadNode(leadNode));
                                            continue;
                                        }
                                    } catch (Exception ex) {
                                        log.warn("[Meta Webhook] Failed to fetch lead from Graph API: {}",
                                                ex.getMessage());
                                    }
                                }
                            }
                            leads.add(parseMetaLeadNode(val));
                        }
                    }
                }
            }
            if (!leads.isEmpty())
                return leads;
        }

        // Case B: Direct Lead Ad object (Zapier / Webhook Partner format)
        leads.add(parseMetaLeadNode(root));
        return leads;
    }

    private String extractPageAccessTokenFromSettings(String settingsJson, String pageId) {
        if (settingsJson == null || settingsJson.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(settingsJson);
            if (root.hasNonNull("pageAccessToken")) {
                return root.get("pageAccessToken").asText();
            }
            if (root.has("pages") && root.get("pages").isArray()) {
                for (JsonNode p : root.get("pages")) {
                    if (pageId == null || pageId.equals(p.path("pageId").asText())) {
                        if (p.hasNonNull("pageAccessToken")) {
                            return p.get("pageAccessToken").asText();
                        }
                    }
                }
            }
            if (root.hasNonNull("userAccessToken")) {
                return root.get("userAccessToken").asText();
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String httpGet(String urlString, int timeoutSeconds) {
        try {
            java.net.URL url = java.net.URI.create(urlString).toURL();
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(timeoutSeconds * 1000);
            conn.setReadTimeout(timeoutSeconds * 1000);
            conn.setRequestProperty("User-Agent", "Mark2-CRM-Connector/1.0");
            conn.connect();
            int status = conn.getResponseCode();
            if (status >= 200 && status < 300) {
                try (java.io.InputStream is = conn.getInputStream()) {
                    return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                }
            } else {
                try (java.io.InputStream es = conn.getErrorStream()) {
                    String err = es != null ? new String(es.readAllBytes(), StandardCharsets.UTF_8) : "";
                    log.warn("HTTP GET [{}] returned non-success status [{}]: {}", urlString, status, err);
                }
            }
        } catch (Exception e) {
            log.warn("HTTP GET [{}] failed: {}", urlString, e.getMessage());
        }
        return null;
    }

    private boolean isMetaPhoneField(String fName) {
        if (fName == null)
            return false;
        String lower = fName.toLowerCase();
        return lower.equals("phone_number") || lower.equals("phone")
                || lower.equals("mobile_number") || lower.equals("mobile")
                || lower.equals("cell_phone") || lower.equals("work_phone")
                || lower.equals("contact_number")
                || lower.contains("phone") || lower.contains("mobile");
    }

    private String cleanMetaPhone(String val) {
        if (val == null)
            return null;
        String trimmed = val.trim();
        if (trimmed.startsWith("<test lead:") || trimmed.contains("dummy data")) {
            String digits = trimmed.replaceAll("[^0-9+]", "");
            String result = digits.length() >= 7 ? digits : "+16505550100";
            return result.length() <= 30 ? result : result.substring(0, 30);
        }
        if (trimmed.length() <= 30) {
            return trimmed;
        }
        return trimmed.substring(0, 30);
    }

    private String cleanMetaPostalCode(String val) {
        if (val == null)
            return null;
        String trimmed = val.trim();
        if (trimmed.startsWith("<test lead:") || trimmed.contains("dummy data")) {
            String digits = trimmed.replaceAll("[^0-9]", "");
            String result = digits.length() >= 3 ? digits : "94025";
            return result.length() <= 20 ? result : result.substring(0, 20);
        }
        if (trimmed.length() <= 20) {
            return trimmed;
        }
        return trimmed.substring(0, 20);
    }

    private String cleanMetaString(String val, int maxLen) {
        if (val == null)
            return null;
        String trimmed = val.trim();
        if (trimmed.length() <= maxLen)
            return trimmed;
        return trimmed.substring(0, maxLen);
    }

    private LeadCreateRequest parseMetaLeadNode(JsonNode node) {
        String leadgenId = getFieldIgnoreCase(node, "leadgen_id", "id");
        String formId = getFieldIgnoreCase(node, "form_id");
        String adId = getFieldIgnoreCase(node, "ad_id");
        String campaignName = getFieldIgnoreCase(node, "campaign_name", "ad_name", "form_name");

        String fullName = null;
        String firstName = null;
        String lastName = null;
        String email = null;
        String phone = null;
        String company = null;
        String city = null;
        String state = null;
        String country = null;
        String postalCode = null;
        String address = null;
        StringBuilder notes = new StringBuilder();

        // Check if field_data array is present
        JsonNode fieldData = node.path("field_data");
        if (fieldData.isArray()) {
            for (JsonNode f : fieldData) {
                String fName = f.path("name").asText("").trim().toLowerCase();
                String fVal = null;
                JsonNode vals = f.path("values");
                if (vals.isArray() && vals.size() > 0) {
                    fVal = vals.get(0).asText();
                } else if (f.hasNonNull("value")) {
                    fVal = f.get("value").asText();
                }

                if (fVal == null || fVal.isBlank())
                    continue;

                fVal = fVal.trim();

                if (fName.contains("first_name") || fName.contains("given_name")) {
                    firstName = cleanMetaString(fVal, 100);
                } else if (fName.contains("last_name") || fName.contains("family_name") || fName.contains("surname")) {
                    lastName = cleanMetaString(fVal, 100);
                } else if (fName.contains("company") || fName.contains("org") || fName.contains("business")) {
                    company = cleanMetaString(fVal, 255);
                } else if (fName.contains("full_name") || fName.equals("name") || fName.equals("contact_name") || fName.equals("person_name") || fName.equals("lead_name")) {
                    fullName = cleanMetaString(fVal, 200);
                } else if (fName.contains("email")) {
                    if (fVal.startsWith("<test lead:") || fVal.contains("dummy data")) {
                        email = "test-lead@facebook-test.com";
                        if (notes.length() > 0) notes.append("; ");
                        notes.append(f.path("name").asText()).append(": ").append(fVal);
                    } else {
                        email = cleanMetaString(fVal, 255);
                    }
                } else if (isMetaPhoneField(fName)) {
                    if (fVal.startsWith("<test lead:") || fVal.contains("dummy data")) {
                        if (notes.length() > 0) notes.append("; ");
                        notes.append(f.path("name").asText()).append(": ").append(fVal);
                    }
                    phone = cleanMetaPhone(fVal);
                } else if (fName.contains("company") || fName.contains("org") || fName.contains("business")) {
                    company = cleanMetaString(fVal, 255);
                } else if (fName.equals("city")) {
                    city = cleanMetaString(fVal, 100);
                } else if (fName.equals("state")) {
                    state = cleanMetaString(fVal, 100);
                } else if (fName.contains("country")) {
                    country = cleanMetaString(fVal, 100);
                } else if (fName.contains("zip") || fName.contains("postal")) {
                    if (fVal.startsWith("<test lead:") || fVal.contains("dummy data")) {
                        if (notes.length() > 0) notes.append("; ");
                        notes.append(f.path("name").asText()).append(": ").append(fVal);
                    }
                    postalCode = cleanMetaPostalCode(fVal);
                } else if (fName.contains("street") || fName.equals("address")) {
                    address = cleanMetaString(fVal, 255);
                } else {
                    if (notes.length() > 0)
                        notes.append("; ");
                    notes.append(f.path("name").asText()).append(": ").append(fVal);
                }
            }
        }

        // Direct fallback fields if field_data was not present
        if (fullName == null && firstName == null) {
            fullName = cleanMetaString(getFieldIgnoreCase(node, "full_name", "name"), 200);
            firstName = cleanMetaString(getFieldIgnoreCase(node, "first_name"), 100);
            lastName = cleanMetaString(getFieldIgnoreCase(node, "last_name"), 100);
        }
        if (email == null) {
            String rawEmail = getFieldIgnoreCase(node, "email");
            if (rawEmail != null && (rawEmail.startsWith("<test lead:") || rawEmail.contains("dummy data"))) {
                email = "test-lead@facebook-test.com";
            } else {
                email = cleanMetaString(rawEmail, 255);
            }
        }
        if (phone == null) {
            String rawPhone = getFieldIgnoreCase(node, "phone_number", "phone", "mobile");
            phone = cleanMetaPhone(rawPhone);
        }
        if (company == null)
            company = cleanMetaString(getFieldIgnoreCase(node, "company_name", "company"), 255);
        if (city == null)
            city = cleanMetaString(getFieldIgnoreCase(node, "city"), 100);
        if (state == null)
            state = cleanMetaString(getFieldIgnoreCase(node, "state"), 100);

        if (firstName == null) {
            String[] split = splitFullName(fullName, "Meta Ad Lead " + (leadgenId != null ? leadgenId : ""));
            firstName = split[0];
            lastName = split[1];
        }

        String inquiryText = notes.length() > 0 ? notes.toString() : "Meta Lead Ad response (Form: " + formId + ")";

        return LeadCreateRequest.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .phone(phone)
                .organizationName(company)
                .city(city)
                .state(state)
                .country(country != null ? country : "India")
                .postalCode(postalCode)
                .addressLine1(address)
                .rawInquiryText(inquiryText)
                .externalLeadId(leadgenId)
                .utmSource("Meta Ads")
                .utmMedium("cpc")
                .utmCampaign(campaignName != null ? campaignName : formId)
                .build();
    }

    private List<LeadCreateRequest> extractGenericLeads(JsonNode root) {
        List<LeadCreateRequest> leads = new ArrayList<>();

        if (root.isArray()) {
            for (JsonNode item : root) {
                leads.add(parseGenericSingleLead(item));
            }
            return leads;
        }

        if (root.has("leads") && root.get("leads").isArray()) {
            for (JsonNode item : root.get("leads")) {
                leads.add(parseGenericSingleLead(item));
            }
            return leads;
        }

        if (root.has("data") && root.get("data").isArray()) {
            for (JsonNode item : root.get("data")) {
                leads.add(parseGenericSingleLead(item));
            }
            return leads;
        }

        leads.add(parseGenericSingleLead(root));
        return leads;
    }

    private LeadCreateRequest parseGenericSingleLead(JsonNode node) {
        String fullName = getFieldIgnoreCase(node, "name", "full_name", "fullName", "customer_name", "customerName",
                "contact_name", "contactName");
        String firstName = getFieldIgnoreCase(node, "first_name", "firstName");
        String lastName = getFieldIgnoreCase(node, "last_name", "lastName");
        String phone = getFieldIgnoreCase(node, "phone", "phone_number", "phoneNumber", "mobile", "mobile_number",
                "mobileNumber", "contact_number");
        String email = getFieldIgnoreCase(node, "email", "email_address", "emailAddress", "work_email");
        String company = getFieldIgnoreCase(node, "company", "company_name", "companyName", "organization",
                "organization_name", "organizationName", "business_name");
        String city = getFieldIgnoreCase(node, "city", "town");
        String state = getFieldIgnoreCase(node, "state", "province");
        String country = getFieldIgnoreCase(node, "country");
        String postalCode = getFieldIgnoreCase(node, "postal_code", "postalCode", "zip", "zipcode", "pincode");
        String address = getFieldIgnoreCase(node, "address", "address_line_1", "addressLine1", "street");
        String message = getFieldIgnoreCase(node, "message", "query", "inquiry", "notes", "comments", "description",
                "requirements");
        String product = getFieldIgnoreCase(node, "product", "product_name", "productName", "subject", "service");
        String extId = getFieldIgnoreCase(node, "id", "lead_id", "leadId", "external_id", "reference_id");

        if (firstName == null && fullName != null) {
            String[] split = splitFullName(fullName, "Inbound Webhook Lead");
            firstName = split[0];
            lastName = split[1];
        }
        if (firstName == null) {
            firstName = "Inbound Webhook Lead";
        }

        List<LeadCreateRequest.ProductInterestRequest> products = null;
        if (product != null && !product.isBlank()) {
            products = List.of(LeadCreateRequest.ProductInterestRequest.builder()
                    .productName(product.trim())
                    .specifications(message)
                    .build());
        }

        return LeadCreateRequest.builder()
                .firstName(firstName)
                .lastName(lastName)
                .phone(phone)
                .email(email)
                .organizationName(company)
                .city(city)
                .state(state)
                .country(country != null ? country : "India")
                .postalCode(postalCode)
                .addressLine1(address)
                .rawInquiryText(message != null ? message : product)
                .externalLeadId(extId)
                .utmSource("Webhook")
                .utmMedium("inbound_api")
                .inquiredProducts(products)
                .build();
    }

    // =========================================================================
    // Format Detection & Helpers
    // =========================================================================

    private boolean isIndiaMartFormat(JsonNode node) {
        return node.has("RESPONSE") || node.has("UNIQUEQUERYID") || node.has("QUERY_ID")
                || node.has("SENDER_NAME") || node.has("SENDER_MOBILE") || node.has("QUERY_PRODUCT_NAME");
    }

    private boolean isTradeIndiaFormat(JsonNode node) {
        return node.has("inquiries") || node.has("rfi_id") || node.has("r_id") || node.has("sender_co")
                || (node.has("sender_name") && node.has("sender_mobile"));
    }

    private boolean isMetaLeadFormat(JsonNode node) {
        return node.has("entry") || node.has("leadgen_id") || node.has("field_data");
    }

    private String getFieldIgnoreCase(JsonNode node, String... candidateKeys) {
        if (node == null || candidateKeys == null)
            return null;
        for (String key : candidateKeys) {
            if (node.hasNonNull(key)) {
                return node.get(key).asText().trim();
            }
        }
        // Case-insensitive iteration fallback
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            for (String candidate : candidateKeys) {
                if (entry.getKey().equalsIgnoreCase(candidate) && !entry.getValue().isNull()) {
                    return entry.getValue().asText().trim();
                }
            }
        }
        return null;
    }

    private String cleanSubjectToProductName(String subject) {
        if (subject == null)
            return "Product Inquiry";
        String s = subject.trim();
        String lower = s.toLowerCase();
        if (lower.startsWith("inquiry for "))
            s = s.substring(12).trim();
        else if (lower.startsWith("enquiry for "))
            s = s.substring(12).trim();
        else if (lower.startsWith("requirement for "))
            s = s.substring(16).trim();
        else if (lower.startsWith("requirement of "))
            s = s.substring(15).trim();
        else if (lower.startsWith("looking for "))
            s = s.substring(12).trim();
        return s.isBlank() ? "Product Inquiry" : s;
    }

    private String[] splitFullName(String fullName, String fallback) {
        if (fullName == null || fullName.isBlank()) {
            return new String[] { fallback, null };
        }
        String clean = fullName.trim();
        int idx = clean.indexOf(' ');
        if (idx > 0) {
            return new String[] { clean.substring(0, idx).trim(), clean.substring(idx + 1).trim() };
        }
        return new String[] { clean, null };
    }

    private UUID getOrCreateLeadSourceId(UUID companyId, IntegrationProvider provider) {
        if (leadSourceRepository == null)
            return null;
        String sourceCode = provider != null ? provider.name() : "WEBHOOK";
        return leadSourceRepository.findByCompanyIdAndSourceCodeAndIsDeletedFalse(companyId, sourceCode)
                .map(CrmLeadSource::getId)
                .orElseGet(() -> {
                    try {
                        CrmLeadSource source = CrmLeadSource.builder()
                                .sourceCode(sourceCode)
                                .sourceName(formatProviderTitle(provider))
                                .sourceCategory("MARKETPLACE")
                                .isActive(true)
                                .isSystem(false)
                                .build();
                        source.setCompanyId(companyId);
                        CrmLeadSource saved = leadSourceRepository.save(source);
                        log.info("Auto-seeded lead source [{}] for company [{}]", sourceCode, companyId);
                        return saved.getId();
                    } catch (Exception e) {
                        log.warn("Could not auto-seed lead source: {}", e.getMessage());
                        return null;
                    }
                });
    }

    private String extractWebhookSecret(CrmTenantIntegration integration) {
        if (integration.getWebhookSecretHash() != null && !integration.getWebhookSecretHash().isBlank()) {
            return integration.getWebhookSecretHash();
        }
        if (integration.getSettingsJson() != null) {
            try {
                JsonNode n = objectMapper.readTree(integration.getSettingsJson());
                if (n.hasNonNull("webhookSecret"))
                    return n.get("webhookSecret").asText();
                if (n.hasNonNull("secret"))
                    return n.get("secret").asText();
                if (n.hasNonNull("verifyToken"))
                    return n.get("verifyToken").asText();
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private IntegrationProvider resolveProviderFromSettings(String settingsJson) {
        if (settingsJson != null && !settingsJson.isBlank()) {
            try {
                JsonNode n = objectMapper.readTree(settingsJson);
                if (n.hasNonNull("channelCode")) {
                    return parseProviderCode(n.get("channelCode").asText());
                }
            } catch (Exception ignored) {
            }
        }
        return IntegrationProvider.WEBHOOK;
    }

    private IntegrationProvider parseProviderCode(String code) {
        if (code == null || code.isBlank())
            return IntegrationProvider.WEBHOOK;
        String normalized = code.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        if (normalized.equals("CUSTOM_WEBHOOK"))
            return IntegrationProvider.WEBHOOK;
        try {
            return IntegrationProvider.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return IntegrationProvider.WEBHOOK;
        }
    }

    private String formatProviderTitle(IntegrationProvider p) {
        if (p == null)
            return "Webhook";
        return switch (p) {
            case INDIAMART -> "IndiaMART B2B";
            case TRADEINDIA -> "TradeIndia";
            case META_LEAD_ADS -> "Meta Ads";
            case JUSTDIAL -> "Justdial";
            case GOOGLE_LEAD_FORMS -> "Google Leads";
            case WEBHOOK -> "Inbound Webhook";
            default -> p.name();
        };
    }

    private String sanitizeSlug(String input) {
        if (input == null)
            return "wh-" + UUID.randomUUID().toString().substring(0, 8);
        String s = input.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        return s.isBlank() ? "wh-" + UUID.randomUUID().toString().substring(0, 8) : s;
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

    private TenantIntegrationResponse mapToResponse(CrmTenantIntegration t, CrmIntegrationChannel channel) {
        String channelCode = channel != null ? channel.getProviderCode().name() : "WEBHOOK";
        String providerName = channel != null ? channel.getProviderName() : "Inbound Webhook";
        String webhookUrl = "/api/crm/integrations/webhook/" + t.getWebhookSlug();

        Boolean autoQualify = true;
        UUID roundRobinPoolId = null;
        if (t.getSettingsJson() != null) {
            try {
                JsonNode n = objectMapper.readTree(t.getSettingsJson());
                if (n.hasNonNull("autoQualify"))
                    autoQualify = n.get("autoQualify").asBoolean();
                if (n.hasNonNull("roundRobinPoolId"))
                    roundRobinPoolId = UUID.fromString(n.get("roundRobinPoolId").asText());
            } catch (Exception ignored) {
            }
        }

        return TenantIntegrationResponse.builder()
                .id(t.getId())
                .companyId(t.getCompanyId())
                .integrationChannelId(t.getIntegrationChannelId())
                .connectionName(t.getConnectionName())
                .integrationName(t.getConnectionName())
                .channelCode(channelCode)
                .providerName(providerName)
                .authType(t.getAuthType())
                .webhookSlug(t.getWebhookSlug())
                .webhookUrl(webhookUrl)
                .syncFrequencyMinutes(t.getSyncFrequencyMinutes())
                .syncStatus(t.getSyncStatus())
                .lastSyncAt(t.getLastSyncAt())
                .autoQualify(autoQualify)
                .roundRobinPoolId(roundRobinPoolId)
                .settingsJson(t.getSettingsJson())
                .isEnabled(t.getIsEnabled())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
