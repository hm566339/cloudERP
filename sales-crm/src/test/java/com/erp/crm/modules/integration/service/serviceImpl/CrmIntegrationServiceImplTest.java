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
import com.erp.crm.modules.integration.repository.TenantIntegrationEntityRepository;
import com.erp.crm.modules.lead.dto.request.LeadCreateRequest;
import com.erp.crm.modules.lead.dto.response.LeadResponse;
import com.erp.crm.modules.lead.repository.CrmLeadRepository;
import com.erp.crm.modules.lead.service.CrmLeadService;
import com.erp.crm.modules.setting.entity.CrmLeadSource;
import com.erp.crm.modules.setting.repository.CrmLeadSourceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
    private TenantIntegrationEntityRepository tenantIntegrationEntityRepository;
    @Mock
    private CrmLeadRepository leadRepository;
    @Mock
    private CrmIntegrationWebhookLogRepository webhookLogRepository;
    @Mock
    private CrmIntegrationChannelRepository channelRepository;
    @Mock
    private CrmLeadSourceRepository leadSourceRepository;
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
        lenient().when(leadSourceRepository.save(any(CrmLeadSource.class)))
                .thenAnswer(inv -> {
                    CrmLeadSource s = inv.getArgument(0);
                    s.setId(UUID.randomUUID());
                    return s;
                });
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
    @DisplayName("Should parse IndiaMART uppercase payload and extract buyer contact & product inquiry")
    void testHandleWebhook_IndiaMart_UppercaseFields() {
        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .id(integrationId)
                .webhookSlug("indiamart-push")
                .integrationChannelId(UUID.randomUUID())
                .build();
        integration.setCompanyId(companyId);

        when(tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse("indiamart-push"))
                .thenReturn(Optional.of(integration));
        when(webhookLogRepository.existsByCompanyIdAndIdempotencyHash(eq(companyId), anyString()))
                .thenReturn(false);

        CrmIntegrationChannel channel = CrmIntegrationChannel.builder()
                .providerCode(IntegrationProvider.INDIAMART)
                .build();
        when(channelRepository.findById(any())).thenReturn(Optional.of(channel));
        when(webhookLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID createdLeadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(LeadResponse.builder().id(createdLeadId).firstName("Amit").lastName("Shah").build());

        String indiaMartPayload = """
                {
                    "UNIQUEQUERYID": "IM-99887766",
                    "SENDER_NAME": "Amit Shah",
                    "SENDER_MOBILE": "+91-9820098200",
                    "SENDER_EMAIL": "amit@shahinfratech.com",
                    "SENDER_COMPANY": "Shah Infratech Ltd",
                    "SENDER_ADDRESS": "Plot 45, MIDC, Andheri East",
                    "SENDER_CITY": "Mumbai",
                    "SENDER_STATE": "Maharashtra",
                    "SENDER_COUNTRY_ISO": "IN",
                    "QUERY_PRODUCT_NAME": "Industrial Water Purifier 500 LPH",
                    "QUERY_MESSAGE": "Looking for heavy duty water purifier for factory use."
                }
                """;

        WebhookAckResponse ack = integrationService.handleWebhook("indiamart-push", indiaMartPayload, "10.0.0.1", Collections.emptyMap());

        assertNotNull(ack);
        assertEquals("ACCEPTED", ack.getStatus());
        assertEquals(createdLeadId, ack.getLeadId());

        ArgumentCaptor<LeadCreateRequest> captor = ArgumentCaptor.forClass(LeadCreateRequest.class);
        verify(leadService).createLead(captor.capture(), eq(companyId));
        LeadCreateRequest captured = captor.getValue();

        assertEquals("Amit", captured.getFirstName());
        assertEquals("Shah", captured.getLastName());
        assertEquals("+91-9820098200", captured.getPhone());
        assertEquals("amit@shahinfratech.com", captured.getEmail());
        assertEquals("Shah Infratech Ltd", captured.getOrganizationName());
        assertEquals("Mumbai", captured.getCity());
        assertEquals("Maharashtra", captured.getState());
        assertEquals("IM-99887766", captured.getExternalLeadId());
        assertEquals("IndiaMART", captured.getUtmSource());
        assertNotNull(captured.getInquiredProducts());
        assertEquals("Industrial Water Purifier 500 LPH", captured.getInquiredProducts().get(0).getProductName());
    }

    @Test
    @DisplayName("Should parse IndiaMART batch RESPONSE array payload")
    void testHandleWebhook_IndiaMart_ResponseArray() {
        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .id(integrationId)
                .webhookSlug("indiamart-batch")
                .integrationChannelId(UUID.randomUUID())
                .build();
        integration.setCompanyId(companyId);

        when(tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse("indiamart-batch"))
                .thenReturn(Optional.of(integration));
        when(webhookLogRepository.existsByCompanyIdAndIdempotencyHash(eq(companyId), anyString()))
                .thenReturn(false);

        CrmIntegrationChannel channel = CrmIntegrationChannel.builder()
                .providerCode(IntegrationProvider.INDIAMART)
                .build();
        when(channelRepository.findById(any())).thenReturn(Optional.of(channel));
        when(webhookLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(LeadResponse.builder().id(UUID.randomUUID()).build())
                .thenReturn(LeadResponse.builder().id(UUID.randomUUID()).build());

        String batchPayload = """
                {
                    "STATUS": "SUCCESS",
                    "TOTAL_RECORDS": 2,
                    "RESPONSE": [
                        {
                            "UNIQUEQUERYID": "Q1",
                            "SENDER_NAME": "Buyer One",
                            "SENDER_MOBILE": "9800011111",
                            "SENDER_COMPANY": "Company A"
                        },
                        {
                            "UNIQUEQUERYID": "Q2",
                            "SENDER_NAME": "Buyer Two",
                            "SENDER_MOBILE": "9800022222",
                            "SENDER_COMPANY": "Company B"
                        }
                    ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleWebhook("indiamart-batch", batchPayload, "10.0.0.1", Collections.emptyMap());

        assertNotNull(ack);
        assertEquals(2, ack.getLeadsCount());
        verify(leadService, times(2)).createLead(any(), eq(companyId));
    }

    @Test
    @DisplayName("Should parse TradeIndia inquiries payload with r_id and sender_co")
    void testHandleWebhook_TradeIndia_InquiriesArray() {
        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .id(integrationId)
                .webhookSlug("tradeindia-webhook")
                .integrationChannelId(UUID.randomUUID())
                .build();
        integration.setCompanyId(companyId);

        when(tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse("tradeindia-webhook"))
                .thenReturn(Optional.of(integration));
        when(webhookLogRepository.existsByCompanyIdAndIdempotencyHash(eq(companyId), anyString()))
                .thenReturn(false);

        CrmIntegrationChannel channel = CrmIntegrationChannel.builder()
                .providerCode(IntegrationProvider.TRADEINDIA)
                .build();
        when(channelRepository.findById(any())).thenReturn(Optional.of(channel));
        when(webhookLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID createdLeadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(LeadResponse.builder().id(createdLeadId).build());

        String tradeIndiaPayload = """
                {
                    "r_id": "TI-12345",
                    "sender_name": "Vikram Singh",
                    "sender_mobile": "9876512345",
                    "sender_email": "vikram@singhengineering.in",
                    "sender_co": "Singh Engineering Works",
                    "sender_city": "Ludhiana",
                    "sender_state": "Punjab",
                    "subject": "Inquiry for High Tensile Fasteners",
                    "message": "Requirement of 5000 pcs of M12 bolts."
                }
                """;

        WebhookAckResponse ack = integrationService.handleWebhook("tradeindia-webhook", tradeIndiaPayload, "10.0.0.1", Collections.emptyMap());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());

        ArgumentCaptor<LeadCreateRequest> captor = ArgumentCaptor.forClass(LeadCreateRequest.class);
        verify(leadService).createLead(captor.capture(), eq(companyId));
        LeadCreateRequest captured = captor.getValue();

        assertEquals("Vikram", captured.getFirstName());
        assertEquals("Singh", captured.getLastName());
        assertEquals("Singh Engineering Works", captured.getOrganizationName());
        assertEquals("TI-12345", captured.getExternalLeadId());
        assertEquals("TradeIndia", captured.getUtmSource());
        assertEquals("High Tensile Fasteners", captured.getInquiredProducts().get(0).getProductName());
    }

    @Test
    @DisplayName("Should parse TradeIndia standard payload with rfi_id, product_name, and deduplicate by rfi_id")
    void testHandleWebhook_TradeIndia_StandardRfiIdAndDeduplication() {
        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .id(integrationId)
                .webhookSlug("tradeindia-rfi-slug")
                .integrationChannelId(UUID.randomUUID())
                .build();
        integration.setCompanyId(companyId);

        when(tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse("tradeindia-rfi-slug"))
                .thenReturn(Optional.of(integration));
        when(webhookLogRepository.existsByCompanyIdAndIdempotencyHash(eq(companyId), anyString()))
                .thenReturn(false);

        CrmIntegrationChannel channel = CrmIntegrationChannel.builder()
                .providerCode(IntegrationProvider.TRADEINDIA)
                .build();
        when(channelRepository.findById(any())).thenReturn(Optional.of(channel));
        when(webhookLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // 1st request: new inquiry with rfi_id
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(companyId, "RFI-998877"))
                .thenReturn(false);
        UUID createdLeadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(LeadResponse.builder().id(createdLeadId).build());

        String payload = """
                {
                    "rfi_id": "RFI-998877",
                    "sender_name": "Pooja Sharma",
                    "sender_mobile": "9876500000",
                    "sender_email": "pooja@industrialtools.in",
                    "sender_co": "Sharma Industrial Tools",
                    "sender_city": "Pune",
                    "sender_state": "Maharashtra",
                    "product_name": "Carbide Cutting Inserts",
                    "subject": "Inquiry for Carbide Tools",
                    "message": "Requirement of 200 boxes CNC carbide tips"
                }
                """;

        WebhookAckResponse ack1 = integrationService.handleWebhook("tradeindia-rfi-slug", payload, "10.0.0.1", Collections.emptyMap());
        assertNotNull(ack1);
        assertEquals(1, ack1.getLeadsCount());

        ArgumentCaptor<LeadCreateRequest> captor = ArgumentCaptor.forClass(LeadCreateRequest.class);
        verify(leadService).createLead(captor.capture(), eq(companyId));
        LeadCreateRequest captured = captor.getValue();
        assertEquals("Pooja", captured.getFirstName());
        assertEquals("Sharma", captured.getLastName());
        assertEquals("Sharma Industrial Tools", captured.getOrganizationName());
        assertEquals("RFI-998877", captured.getExternalLeadId());
        assertEquals("Carbide Cutting Inserts", captured.getInquiredProducts().get(0).getProductName());

        // 2nd request: duplicate rfi_id already ingested -> must skip creating lead
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(companyId, "RFI-998877"))
                .thenReturn(true);
        reset(leadService);

        WebhookAckResponse ack2 = integrationService.handleWebhook("tradeindia-rfi-slug", payload, "10.0.0.1", Collections.emptyMap());
        assertNotNull(ack2);
        // Lead should not be created again
        verify(leadService, never()).createLead(any(), any());
    }

    @Test
    @DisplayName("Should parse Meta Lead Ads payload with field_data key-value array")
    void testHandleWebhook_MetaLeadAds_FieldData() {
        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .id(integrationId)
                .webhookSlug("meta-leadgen")
                .integrationChannelId(UUID.randomUUID())
                .build();
        integration.setCompanyId(companyId);

        when(tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse("meta-leadgen"))
                .thenReturn(Optional.of(integration));
        when(webhookLogRepository.existsByCompanyIdAndIdempotencyHash(eq(companyId), anyString()))
                .thenReturn(false);

        CrmIntegrationChannel channel = CrmIntegrationChannel.builder()
                .providerCode(IntegrationProvider.META_LEAD_ADS)
                .build();
        when(channelRepository.findById(any())).thenReturn(Optional.of(channel));
        when(webhookLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID createdLeadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(LeadResponse.builder().id(createdLeadId).build());

        String metaPayload = """
                {
                    "leadgen_id": "928374928172938",
                    "form_id": "18293847592817",
                    "campaign_name": "Manufacturing ERP Campaign",
                    "field_data": [
                        { "name": "full_name", "values": ["Priya Sharma"] },
                        { "name": "email", "values": ["priya.sharma@technocraft.com"] },
                        { "name": "phone_number", "values": ["+919811223344"] },
                        { "name": "company_name", "values": ["Technocraft Solutions"] },
                        { "name": "city", "values": ["Bengaluru"] },
                        { "name": "state", "values": ["Karnataka"] },
                        { "name": "required_modules", "values": ["Inventory and CRM"] }
                    ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleWebhook("meta-leadgen", metaPayload, "10.0.0.1", Collections.emptyMap());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());

        ArgumentCaptor<LeadCreateRequest> captor = ArgumentCaptor.forClass(LeadCreateRequest.class);
        verify(leadService).createLead(captor.capture(), eq(companyId));
        LeadCreateRequest captured = captor.getValue();

        assertEquals("Priya", captured.getFirstName());
        assertEquals("Sharma", captured.getLastName());
        assertEquals("priya.sharma@technocraft.com", captured.getEmail());
        assertEquals("+919811223344", captured.getPhone());
        assertEquals("Technocraft Solutions", captured.getOrganizationName());
        assertEquals("Bengaluru", captured.getCity());
        assertEquals("Karnataka", captured.getState());
        assertEquals("928374928172938", captured.getExternalLeadId());
        assertEquals("Meta Ads", captured.getUtmSource());
        assertTrue(captured.getRawInquiryText().contains("required_modules: Inventory and CRM"));
    }

    @Test
    @DisplayName("Should successfully respond to Meta webhook verification challenge when secret matches")
    void testVerifyWebhook_MetaChallenge_Success() {
        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .id(integrationId)
                .webhookSlug("meta-handshake")
                .webhookSecretHash("super_secret_token_123")
                .build();

        when(tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse("meta-handshake"))
                .thenReturn(Optional.of(integration));

        String challenge = integrationService.verifyWebhook(
                "meta-handshake", "subscribe", "1158201444", "super_secret_token_123");

        assertEquals("1158201444", challenge);
    }

    @Test
    @DisplayName("Should throw SecurityException on Meta webhook verification token mismatch")
    void testVerifyWebhook_MetaChallenge_Mismatch() {
        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .id(integrationId)
                .webhookSlug("meta-handshake")
                .webhookSecretHash("super_secret_token_123")
                .build();

        when(tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse("meta-handshake"))
                .thenReturn(Optional.of(integration));

        assertThrows(SecurityException.class, () -> integrationService.verifyWebhook(
                "meta-handshake", "subscribe", "1158201444", "wrong_token"));
    }

    @Test
    @DisplayName("Should parse custom generic JSON webhook with flexible fields")
    void testHandleWebhook_CustomGenericJson() {
        CrmTenantIntegration integration = CrmTenantIntegration.builder()
                .id(integrationId)
                .webhookSlug("generic-json")
                .integrationChannelId(UUID.randomUUID())
                .build();
        integration.setCompanyId(companyId);

        when(tenantIntegrationRepository.findByWebhookSlugAndIsDeletedFalse("generic-json"))
                .thenReturn(Optional.of(integration));
        when(webhookLogRepository.existsByCompanyIdAndIdempotencyHash(eq(companyId), anyString()))
                .thenReturn(false);

        CrmIntegrationChannel channel = CrmIntegrationChannel.builder()
                .providerCode(IntegrationProvider.WEBHOOK)
                .build();
        when(channelRepository.findById(any())).thenReturn(Optional.of(channel));
        when(webhookLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID createdLeadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(LeadResponse.builder().id(createdLeadId).build());

        String genericPayload = """
                {
                    "customerName": "Suresh Patel",
                    "phoneNumber": "9825012345",
                    "emailAddress": "suresh@pateltrading.com",
                    "companyName": "Patel Trading Corp",
                    "city": "Surat",
                    "product": "Industrial Solar Inverters",
                    "comments": "Need 10 units for factory installation"
                }
                """;

        WebhookAckResponse ack = integrationService.handleWebhook("generic-json", genericPayload, "10.0.0.1", Collections.emptyMap());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());

        ArgumentCaptor<LeadCreateRequest> captor = ArgumentCaptor.forClass(LeadCreateRequest.class);
        verify(leadService).createLead(captor.capture(), eq(companyId));
        LeadCreateRequest captured = captor.getValue();

        assertEquals("Suresh", captured.getFirstName());
        assertEquals("Patel", captured.getLastName());
        assertEquals("9825012345", captured.getPhone());
        assertEquals("suresh@pateltrading.com", captured.getEmail());
        assertEquals("Patel Trading Corp", captured.getOrganizationName());
        assertEquals("Surat", captured.getCity());
        assertEquals("Webhook", captured.getUtmSource());
        assertEquals("Industrial Solar Inverters", captured.getInquiredProducts().get(0).getProductName());
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

    @Test
    @DisplayName("Should verify Facebook webhook handshake with slug 'facebook'")
    void testVerifyWebhook_FacebookSlug() {
        String challenge = "192837465";
        String response = integrationService.verifyWebhook("facebook", "subscribe", challenge, "any_token");
        assertEquals(challenge, response);
    }
}
