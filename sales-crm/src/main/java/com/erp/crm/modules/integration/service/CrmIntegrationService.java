package com.erp.crm.modules.integration.service;

import com.erp.crm.modules.integration.dto.TenantIntegrationRequest;
import com.erp.crm.modules.integration.dto.TenantIntegrationResponse;
import com.erp.crm.modules.integration.dto.WebhookAckResponse;
import com.erp.crm.modules.integration.entity.CrmIntegrationChannel;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface CrmIntegrationService {

    WebhookAckResponse handleWebhook(String slug, String payload, String sourceIp, Map<String, String> headers);

    String verifyWebhook(String slug, String mode, String challenge, String verifyToken);

    TenantIntegrationResponse createTenantIntegration(TenantIntegrationRequest request, UUID requestCompanyId);

    List<TenantIntegrationResponse> getTenantIntegrations(UUID requestCompanyId);

    List<CrmIntegrationChannel> listAvailableChannels();

    com.erp.crm.modules.integration.dto.SyncTriggerResponse triggerSync(UUID integrationId, UUID requestCompanyId);
}

