package com.erp.crm.modules.integration.service.serviceImpl;

import com.erp.crm.modules.integration.dto.WebhookAckResponse;
import com.erp.crm.modules.integration.entity.CrmIntegrationChannel;
import com.erp.crm.modules.integration.entity.CrmIntegrationWebhookLog;
import com.erp.crm.modules.integration.entity.CrmTenantIntegration;
import com.erp.crm.modules.integration.enums.IntegrationProvider;
import com.erp.crm.modules.integration.enums.WebhookProcessingStatus;
import com.erp.crm.modules.integration.repository.CrmIntegrationChannelRepository;
import com.erp.crm.modules.integration.repository.CrmIntegrationWebhookLogRepository;
import com.erp.crm.modules.integration.repository.CrmTenantIntegrationRepository;
import com.erp.crm.modules.lead.dto.request.LeadCreateRequest;
import com.erp.crm.modules.lead.dto.response.LeadResponse;
import com.erp.crm.modules.lead.service.CrmLeadService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmIntegrationServiceImplTest {

    @Mock
    private CrmTenantIntegrationRepository tenantIntegrationRepository;
    @Mock
    private CrmIntegrationWebhookLogRepository webhookLogRepository;
    @Mock
    private CrmIntegrationChannelRepository channelRepository;
    @Mock
    private CrmLeadService leadService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private CrmIntegrationServiceImpl integrationService;

    private UUID companyId;
    private UUID integrationId;
    private String slug;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        integrationId = UUID.randomUUID();
        slug = "indiamart-test-slug";
    }

    @Test
    @DisplayName("Should successfully ingest new webhook lead and acknowledge")
    void testHandleWebhook_Success() {
        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .id(integrationId)
                .webhookSlug(slug)
                .integrationChannelId(UUID.randomUUID())
                .build();
        integration.setCompanyId(companyId);

        when(tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse(slug))
                .thenReturn(Optional.of(integration));
        when(webhookLogRepository.existsByCompanyIdAndIdempotencyHash(eq(companyId), anyString()))
                .thenReturn(false);

        CrmIntegrationChannel channel = CrmIntegrationChannel.builder()
                .providerCode(IntegrationProvider.INDIAMART)
                .build();
        when(channelRepository.findById(any())).thenReturn(Optional.of(channel));

        when(webhookLogRepository.save(any(CrmIntegrationWebhookLog.class))).thenAnswer(inv -> inv.getArgument(0));

        UUID createdLeadId = UUID.randomUUID();
        LeadResponse createdLead = LeadResponse.builder().id(createdLeadId).firstName("Rahul Kumar").build();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId))).thenReturn(createdLead);

        String jsonPayload = "{\"sender_name\":\"Rahul Kumar\",\"sender_mobile\":\"9812345678\",\"sender_email\":\"rahul@example.com\",\"query\":\"Bulk order inquiry\"}";

        WebhookAckResponse ack = integrationService.handleWebhook(slug, jsonPayload, "192.168.1.1", Collections.emptyMap());

        assertNotNull(ack);
        assertEquals("ACCEPTED", ack.getStatus());
        assertEquals("PROCESSED", ack.getProcessingStatus());
        assertEquals(createdLeadId, ack.getLeadId());
        verify(leadService, times(1)).createLead(any(), eq(companyId));
    }

    @Test
    @DisplayName("Should detect duplicate webhook payload and skip duplicate lead creation (Idempotency)")
    void testHandleWebhook_DuplicatePayload_Skipped() {
        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .id(integrationId)
                .webhookSlug(slug)
                .build();
        integration.setCompanyId(companyId);

        when(tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse(slug))
                .thenReturn(Optional.of(integration));

        // Simulate that hash already exists in DB (retry from webhook provider)
        when(webhookLogRepository.existsByCompanyIdAndIdempotencyHash(eq(companyId), anyString()))
                .thenReturn(true);

        String payload = "{\"sender_name\":\"Duplicate Lead\",\"phone\":\"9876543210\"}";

        WebhookAckResponse ack = integrationService.handleWebhook(slug, payload, "192.168.1.1", Collections.emptyMap());

        assertNotNull(ack);
        assertEquals("DUPLICATE_ACKNOWLEDGED", ack.getStatus());
        assertEquals("DUPLICATE_SKIPPED", ack.getProcessingStatus());
        assertNull(ack.getLeadId());

        // Ensure leadService was NEVER called
        verify(leadService, never()).createLead(any(), any());
    }
}

