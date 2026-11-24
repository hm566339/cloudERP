package com.erp.crm.modules.integration.service.serviceImpl;

import com.erp.crm.common.exception.BusinessValidationException;
import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.security.CurrentUserContext;
import com.erp.crm.modules.integration.converter.Aes256EncryptionConverter;
import com.erp.crm.modules.integration.dto.*;
import com.erp.crm.modules.integration.entity.CrmIntegrationChannel;
import com.erp.crm.modules.integration.entity.IntegrationProviderEntity;
import com.erp.crm.modules.integration.entity.TenantIntegrationEntity;
import com.erp.crm.modules.integration.enums.IntegrationAuthType;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import com.erp.crm.modules.integration.enums.TenantIntegrationStatus;
import com.erp.crm.modules.integration.repository.CrmIntegrationChannelRepository;
import com.erp.crm.modules.integration.repository.CrmTenantIntegrationRepository;
import com.erp.crm.modules.integration.repository.IntegrationProviderRepository;
import com.erp.crm.modules.integration.repository.TenantIntegrationEntityRepository;
import com.erp.crm.modules.lead.dto.request.LeadCreateRequest;
import com.erp.crm.modules.setting.entity.CrmLeadSource;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TwoTierIntegrationServiceImplTest {

    @Mock
    private IntegrationProviderRepository providerRepository;

    @Mock
    private TenantIntegrationEntityRepository tenantIntegrationRepository;

    @Mock
    private CrmIntegrationChannelRepository channelRepository;

    @Mock
    private CrmTenantIntegrationRepository legacyTenantIntegrationRepository;

    @Mock
    private com.erp.crm.modules.lead.service.CrmLeadService leadService;

    @Mock
    private com.erp.crm.modules.lead.repository.CrmLeadRepository leadRepository;

    @Mock
    private com.erp.crm.modules.setting.repository.CrmLeadSourceRepository leadSourceRepository;

    @Mock
    private com.erp.crm.modules.integration.repository.CrmIntegrationWebhookLogRepository webhookLogRepository;

    @Mock
    private com.erp.crm.modules.automation.service.RoundRobinAssignmentService roundRobinAssignmentService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private TwoTierIntegrationServiceImpl integrationService;

    private final UUID companyId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID userId = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @BeforeEach
    void setUp() {
        CurrentUserContext.setCompanyId(companyId);
        CurrentUserContext.setUserId(userId);
        CurrentUserContext.setUsername("testuser@mark2.in");
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clearCompanyId();
        CurrentUserContext.clearUserId();
        CurrentUserContext.clearUsername();
        CurrentUserContext.clearUserRole();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("1. AES-256 Converter: Confirms encryption at rest and reversible decryption")
    void testAes256EncryptionConverter() {
        Aes256EncryptionConverter converter = new Aes256EncryptionConverter("my-super-secret-production-encryption-key-32-chars");

        String plainJson = "{\"clientId\":\"fb_app_999\",\"clientSecret\":\"secret_key_888\"}";
        String encrypted = converter.convertToDatabaseColumn(plainJson);

        assertNotNull(encrypted);
        assertTrue(encrypted.startsWith("ENC::"));
        assertNotEquals(plainJson, encrypted);

        String decrypted = converter.convertToEntityAttribute(encrypted);
        assertEquals(plainJson, decrypted);

        // Test legacy unencrypted string resilience
        String legacyPlain = "{\"crmKey\":\"GLUSR_KEY_123\"}";
        assertEquals(legacyPlain, converter.convertToEntityAttribute(legacyPlain));

        // Test null handling
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToEntityAttribute(null));
    }

    @Test
    @DisplayName("2. Layer 1 SystemAdmin: Global provider listing and updates allowed for ROLE_SYSTEM_ADMIN")
    void testSystemAdminGlobalProviderUpdate() {
        // Authenticate as SystemAdmin
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@mark2.in", "pass",
                        List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));

        IntegrationProviderEntity existing = IntegrationProviderEntity.builder()
                .id(UUID.randomUUID())
                .code(IntegrationProviderCode.FACEBOOK)
                .displayName("Meta Ads")
                .authType(IntegrationAuthType.OAUTH2)
                .globalConfigJson("{\"clientId\":\"old_client_id\",\"clientSecret\":\"old_secret\"}")
                .isEnabled(true)
                .build();

        when(providerRepository.findByCode(IntegrationProviderCode.FACEBOOK)).thenReturn(Optional.of(existing));
        when(providerRepository.save(any(IntegrationProviderEntity.class))).thenAnswer(i -> i.getArgument(0));

        AdminProviderUpdateRequest updateReq = AdminProviderUpdateRequest.builder()
                .displayName("Facebook / Meta Lead Ads Global")
                .authType(IntegrationAuthType.OAUTH2)
                .globalConfig(Map.of("clientId", "new_fb_client_id", "clientSecret", "new_secret_123"))
                .isEnabled(true)
                .build();

        AdminProviderResponse response = integrationService.updateProvider(IntegrationProviderCode.FACEBOOK, updateReq);

        assertNotNull(response);
        assertEquals("Facebook / Meta Lead Ads Global", response.getDisplayName());
        // Verify clientSecret is masked in admin response
        assertTrue(response.getGlobalConfig().get("clientSecret").toString().startsWith("••••"));
        verify(providerRepository, times(1)).save(any(IntegrationProviderEntity.class));
    }

    @Test
    @DisplayName("3. Layer 1 RBAC: Non-system admin user rejected with AccessDeniedException on global config")
    void testNonSystemAdminRejectedFromGlobalProviderConfig() {
        // Normal user without ROLE_SYSTEM_ADMIN
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user@mark2.in", "pass",
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        AdminProviderUpdateRequest updateReq = AdminProviderUpdateRequest.builder()
                .displayName("Hacked Provider")
                .build();

        assertThrows(AccessDeniedException.class, () ->
                integrationService.updateProvider(IntegrationProviderCode.FACEBOOK, updateReq));

        assertThrows(AccessDeniedException.class, () ->
                integrationService.listAllProvidersForAdmin());
    }

    @Test
    @DisplayName("4. Layer 2 Available Providers: Returns public configs and NEVER exposes clientSecret")
    void testListAvailableProvidersNeverExposesSecrets() {
        IntegrationProviderEntity facebook = IntegrationProviderEntity.builder()
                .code(IntegrationProviderCode.FACEBOOK)
                .displayName("Meta Ads")
                .authType(IntegrationAuthType.OAUTH2)
                .globalConfigJson("{\"clientId\":\"public_client_123\",\"clientSecret\":\"SUPER_SECRET_VALUE\"}")
                .isEnabled(true)
                .build();

        IntegrationProviderEntity indiamart = IntegrationProviderEntity.builder()
                .code(IntegrationProviderCode.INDIAMART)
                .displayName("IndiaMART")
                .authType(IntegrationAuthType.API_KEY)
                .globalConfigJson("{\"apiBaseUrl\":\"https://mapi.indiamart.com\"}")
                .isEnabled(true)
                .build();

        when(providerRepository.findByIsEnabledTrue()).thenReturn(List.of(facebook, indiamart));

        List<AvailableProviderResponse> available = integrationService.listAvailableProviders();

        assertEquals(2, available.size());
        AvailableProviderResponse fb = available.stream().filter(p -> p.getCode() == IntegrationProviderCode.FACEBOOK).findFirst().orElseThrow();
        assertEquals("public_client_123", fb.getClientId());
        // Verify response class has no secret and raw globalConfig is not exposed
        assertNotNull(fb.getAuthType());
        assertEquals(IntegrationAuthType.OAUTH2, fb.getAuthType());
    }

    @Test
    @DisplayName("5. Layer 2 Tenant Connect: Saves tenant integration with status CONNECTED and sensible routing")
    void testTenantIntegrationConnectSuccess() {
        // Authenticate user with CRM_INTEGRATION_MANAGE permission
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("tenant_user@mark2.in", "pass",
                        List.of(new SimpleGrantedAuthority("PERMISSION_CRM_INTEGRATION_MANAGE"))));

        IntegrationProviderEntity provider = IntegrationProviderEntity.builder()
                .code(IntegrationProviderCode.INDIAMART)
                .displayName("IndiaMART B2B Portal")
                .authType(IntegrationAuthType.API_KEY)
                .isEnabled(true)
                .build();

        when(providerRepository.findByCode(IntegrationProviderCode.INDIAMART)).thenReturn(Optional.of(provider));
        when(tenantIntegrationRepository.save(any(TenantIntegrationEntity.class))).thenAnswer(i -> {
            TenantIntegrationEntity e = i.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        TenantIntegrationConnectRequest request = TenantIntegrationConnectRequest.builder()
                .providerCode(IntegrationProviderCode.INDIAMART)
                .integrationName("Main IndiaMART Key")
                .credentials(Map.of("crmKey", "IM_CRM_KEY_999888777"))
                .routingConfig(Map.of("autoQualify", true, "poolId", UUID.randomUUID().toString()))
                .build();

        TenantIntegrationDetailResponse response = integrationService.connect(request, companyId);

        assertNotNull(response);
        assertEquals(TenantIntegrationStatus.CONNECTED, response.getStatus());
        assertEquals("Main IndiaMART Key", response.getIntegrationName());
        assertEquals(IntegrationProviderCode.INDIAMART, response.getProviderCode());
        // Verify key is masked in tenant response
        assertTrue(response.getSafeCredentials().get("crmKey").toString().contains("••••"));

        verify(tenantIntegrationRepository, times(1)).save(any(TenantIntegrationEntity.class));
    }

    @Test
    @DisplayName("6. Layer 2 RBAC: User without CRM_INTEGRATION_MANAGE is denied connect access")
    void testTenantConnectRequiresPermission() {
        // Authenticate user without CRM_INTEGRATION_MANAGE permission
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("sales_rep@mark2.in", "pass",
                        List.of(new SimpleGrantedAuthority("PERMISSION_CRM_LEADS:READ"))));

        TenantIntegrationConnectRequest request = TenantIntegrationConnectRequest.builder()
                .providerCode(IntegrationProviderCode.INDIAMART)
                .integrationName("Unauthorized Connection")
                .build();

        assertThrows(AccessDeniedException.class, () -> integrationService.connect(request, companyId));
    }

    @Test
    @DisplayName("7. Test Connection API: Validates IndiaMART CRM Key format correctly")
    void testIndiaMARTConnectionValidation() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user@mark2.in", "pass",
                        List.of(new SimpleGrantedAuthority("PERMISSION_CRM_INTEGRATION_MANAGE"))));

        // Valid key
        ConnectionTestRequest validReq = ConnectionTestRequest.builder()
                .providerCode(IntegrationProviderCode.INDIAMART)
                .crmKey("GLUSR_VAL_998877")
                .build();
        ConnectionTestResponse validRes = integrationService.testConnection(validReq);
        assertTrue(validRes.isSuccess());
        assertTrue(validRes.isVerified());

        // Invalid short key
        ConnectionTestRequest invalidReq = ConnectionTestRequest.builder()
                .providerCode(IntegrationProviderCode.INDIAMART)
                .crmKey("12")
                .build();
        ConnectionTestResponse invalidRes = integrationService.testConnection(invalidReq);
        assertFalse(invalidRes.isVerified());
    }

    @Test
    @DisplayName("8. Tenant Disconnect: Deactivates integration and marks status DISCONNECTED")
    void testTenantDisconnect() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user@mark2.in", "pass",
                        List.of(new SimpleGrantedAuthority("PERMISSION_CRM_INTEGRATION_MANAGE"))));

        UUID integrationId = UUID.randomUUID();
        TenantIntegrationEntity entity = TenantIntegrationEntity.builder()
                .id(integrationId)
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.INDIAMART)
                .integrationName("Test Integration")
                .status(TenantIntegrationStatus.CONNECTED)
                .webhookSlug("test-slug-123")
                .build();

        when(tenantIntegrationRepository.findByIdAndTenantIdAndIsDeletedFalse(integrationId, companyId))
                .thenReturn(Optional.of(entity));

        integrationService.disconnect(integrationId, companyId);

        assertEquals(TenantIntegrationStatus.DISCONNECTED, entity.getStatus());
        assertTrue(entity.getIsDeleted());
        verify(tenantIntegrationRepository, times(1)).save(entity);
    }

    @Test
    @DisplayName("9. Trigger Sync: Successfully triggers sync for Facebook 2-tier integration")
    void testTriggerSyncSuccessFacebook() {
        UUID integrationId = UUID.randomUUID();
        TenantIntegrationEntity entity = TenantIntegrationEntity.builder()
                .id(integrationId)
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .integrationName("Facebook Lead Ads Ingestion")
                .credentialsJson("{\"pages\":[{\"pageId\":\"p1\",\"pageAccessToken\":\"mock_token\"}]}")
                .status(TenantIntegrationStatus.CONNECTED)
                .webhookSlug("fb-slug-123")
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findByIdAndTenantIdAndIsDeletedFalse(integrationId, companyId))
                .thenReturn(Optional.of(entity));
        when(tenantIntegrationRepository.save(any(TenantIntegrationEntity.class))).thenAnswer(i -> i.getArgument(0));

        SyncTriggerResponse response = integrationService.triggerSync(integrationId, companyId);

        assertNotNull(response);
        assertEquals(integrationId, response.getIntegrationId());
        assertEquals("TRIGGERED", response.getSyncStatus());
        assertNotNull(entity.getLastSyncedAt());
        verify(tenantIntegrationRepository, times(1)).save(entity);
    }

    @Test
    @DisplayName("10. Trigger Sync: Successfully triggers pull sync for IndiaMART integration")
    void testTriggerSyncSuccessIndiaMART() {
        UUID integrationId = UUID.randomUUID();
        TenantIntegrationEntity entity = TenantIntegrationEntity.builder()
                .id(integrationId)
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.INDIAMART)
                .integrationName("IndiaMART Marketplace")
                .credentialsJson("{\"crmKey\":\"GLUSR_KEY_TEST\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .webhookSlug("indiamart-slug-123")
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findByIdAndTenantIdAndIsDeletedFalse(integrationId, companyId))
                .thenReturn(Optional.of(entity));
        when(tenantIntegrationRepository.save(any(TenantIntegrationEntity.class))).thenAnswer(i -> i.getArgument(0));

        SyncTriggerResponse response = integrationService.triggerSync(integrationId, companyId);

        assertNotNull(response);
        assertEquals(integrationId, response.getIntegrationId());
        assertEquals("TRIGGERED", response.getSyncStatus());
        assertTrue(response.getMessage().contains("IndiaMART"));
    }

    @Test
    @DisplayName("11. Trigger Sync: Throws ResourceNotFoundException when integration not found")
    void testTriggerSyncNotFound() {
        UUID integrationId = UUID.randomUUID();
        when(tenantIntegrationRepository.findByIdAndTenantIdAndIsDeletedFalse(integrationId, companyId))
                .thenReturn(Optional.empty());
        when(tenantIntegrationRepository.findById(integrationId))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> integrationService.triggerSync(integrationId, companyId));
    }

    @Test
    @DisplayName("12. Trigger Sync: Throws BusinessValidationException when integration is disconnected")
    void testTriggerSyncDisconnected() {
        UUID integrationId = UUID.randomUUID();
        TenantIntegrationEntity entity = TenantIntegrationEntity.builder()
                .id(integrationId)
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .status(TenantIntegrationStatus.DISCONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findByIdAndTenantIdAndIsDeletedFalse(integrationId, companyId))
                .thenReturn(Optional.of(entity));

        assertThrows(BusinessValidationException.class, () -> integrationService.triggerSync(integrationId, companyId));
    }

    @Test
    @DisplayName("13. Dynamic Provider Builder: SystemAdmin can create custom provider with tenantFields schema")
    void testCreateProviderWithTenantFields() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@mark2.in", "pass",
                        List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));

        when(providerRepository.findByCode(IntegrationProviderCode.JUSTDIAL)).thenReturn(Optional.empty());
        when(providerRepository.save(any(IntegrationProviderEntity.class))).thenAnswer(i -> {
            IntegrationProviderEntity e = i.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        AdminProviderCreateRequest request = AdminProviderCreateRequest.builder()
                .code("JUSTDIAL")
                .displayName("Justdial B2B Leads")
                .authType(IntegrationAuthType.WEBHOOK)
                .globalConfig(Map.of(
                        "pullApiUrl", "https://api.justdial.com/inquiries",
                        "tenantFields", List.of(
                                Map.of("key", "lead_token", "label", "Justdial Lead Token", "type", "password", "required", true)
                        )
                ))
                .isEnabled(true)
                .build();

        AdminProviderResponse response = integrationService.createProvider(request);

        assertNotNull(response);
        assertEquals(IntegrationProviderCode.JUSTDIAL, response.getCode());
        assertEquals("Justdial B2B Leads", response.getDisplayName());
        assertEquals(IntegrationAuthType.WEBHOOK, response.getAuthType());
        assertTrue(response.getIsEnabled());
        verify(providerRepository, times(1)).save(any(IntegrationProviderEntity.class));
    }

    @Test
    @DisplayName("14. Facebook: subscribeFacebookPage successfully handles flat credentials")
    void testSubscribeFacebookPageFlatCredentials() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user@mark2.in", "pass",
                        List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("CRM_INTEGRATION_MANAGE"))));

        UUID intId = UUID.randomUUID();
        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(intId)
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"pageId\":\"fb_page_mohit\",\"pageAccessToken\":\"mock_page_token_abc\",\"pageName\":\"Mohit CRM Testing\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(companyId))
                .thenReturn(List.of(fbEntity));
        when(tenantIntegrationRepository.save(any(TenantIntegrationEntity.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> result = integrationService.subscribeFacebookPage("fb_page_mohit", true, companyId);

        assertNotNull(result);
        assertEquals("fb_page_mohit", result.get("pageId"));
        assertTrue((Boolean) result.get("subscribed"));
        assertTrue((Boolean) result.get("success"));
        verify(tenantIntegrationRepository, times(1)).save(any(TenantIntegrationEntity.class));
    }

    @Test
    @DisplayName("15. Facebook: getFacebookAccountDetails synthesizes page DTO from flat credentials")
    void testGetFacebookAccountDetailsFlatCredentials() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user@mark2.in", "pass",
                        List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("CRM_INTEGRATION_MANAGE"))));

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"pageId\":\"104928192\",\"pageAccessToken\":\"mock_long_token_1234567\",\"pageName\":\"Mohit CRM Testing\",\"formId\":\"form_999\",\"formName\":\"Contact Form\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(companyId))
                .thenReturn(List.of(fbEntity));

        OAuthCallbackResponse response = integrationService.getFacebookAccountDetails(companyId);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertFalse(response.getPages().isEmpty());
        OAuthCallbackResponse.FacebookPageDto pageDto = response.getPages().get(0);
        assertEquals("104928192", pageDto.getPageId());
        assertEquals("Mohit CRM Testing", pageDto.getPageName());
        assertFalse(pageDto.getForms().isEmpty());
        assertEquals("form_999", pageDto.getForms().get(0).getFormId());
    }

    @Test
    @DisplayName("16. Facebook: verifyFacebookWebhook succeeds on valid hub.challenge")
    void testVerifyFacebookWebhookHandshake() {
        String challenge = "1158201444";
        String response = integrationService.verifyFacebookWebhook("subscribe", challenge, "mark2_crm_token");
        assertEquals(challenge, response);
    }

    @Test
    @DisplayName("17. Facebook: handleFacebookWebhook parses webhook payload, resolves tenant and creates lead without user session")
    void testHandleFacebookWebhookLeadIngestion() {
        // Clear all user context to simulate unauthenticated server-to-server webhook
        CurrentUserContext.clear();
        org.springframework.security.core.context.SecurityContextHolder.clearContext();

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"pageId\":\"page_123\",\"pageAccessToken\":\"mock_page_token\",\"pageName\":\"Mohit CRM Testing\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(eq(companyId), anyString())).thenReturn(false);
        when(leadSourceRepository.findByCompanyIdAndSourceCodeAndIsDeletedFalse(eq(companyId), anyString()))
                .thenReturn(Optional.of(CrmLeadSource.builder().id(UUID.randomUUID()).build()));

        UUID leadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(com.erp.crm.modules.lead.dto.response.LeadResponse.builder().id(leadId).firstName("Mohit").lastName("Sharma").build());

        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "page_123",
                      "time": 1700000000,
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "ad_id": "ad_111",
                            "form_id": "form_222",
                            "leadgen_id": "leadgen_333",
                            "created_time": 1700000000,
                            "page_id": "page_123"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals("ACCEPTED", ack.getStatus());
        assertEquals("PROCESSED", ack.getProcessingStatus());
        assertEquals(leadId, ack.getLeadId());
        assertEquals(1, ack.getLeadsCount());
        verify(leadService, times(1)).createLead(any(LeadCreateRequest.class), eq(companyId));
    }

    @Test
    @DisplayName("18. Facebook: handleFacebookWebhook safely ignores unknown page IDs and does not create leads")
    void testHandleFacebookWebhook_UnknownPageId_CreatesNoLead() {
        CurrentUserContext.clear();
        org.springframework.security.core.context.SecurityContextHolder.clearContext();

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"pageId\":\"page_known_123\",\"pageAccessToken\":\"tok_123\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));

        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "unknown_page_999",
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "leadgen_id": "leadgen_888",
                            "page_id": "unknown_page_999"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(0, ack.getLeadsCount());
        verify(leadService, never()).createLead(any(), any());
    }

    @Test
    @DisplayName("19. Facebook: handleFacebookWebhook skips duplicate leadgen events")
    void testHandleFacebookWebhook_DuplicateLead_Skipped() {
        CurrentUserContext.clear();

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"pageId\":\"page_123\",\"pageAccessToken\":\"mock_page_token\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(eq(companyId), eq("duplicate_leadgen_111")))
                .thenReturn(true);

        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "page_123",
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "leadgen_id": "duplicate_leadgen_111",
                            "page_id": "page_123"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(0, ack.getLeadsCount());
        verify(leadService, never()).createLead(any(), any());
    }

    @Test
    @DisplayName("20. Facebook: handleFacebookWebhook handles dummy test payload (444444444444) gracefully")
    void testHandleFacebookWebhook_DummyTestPayload_GracefulCreation() {
        CurrentUserContext.clear();

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"pageId\":\"104928192\",\"pageAccessToken\":\"dummy_token\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(eq(companyId), eq("444444444444")))
                .thenReturn(false);
        when(leadSourceRepository.findByCompanyIdAndSourceCodeAndIsDeletedFalse(eq(companyId), anyString()))
                .thenReturn(Optional.of(CrmLeadSource.builder().id(UUID.randomUUID()).build()));

        UUID leadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(com.erp.crm.modules.lead.dto.response.LeadResponse.builder().id(leadId).firstName("Meta Ad Lead").lastName("444444444444").build());

        String dummyPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "104928192",
                      "time": 1732360000,
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "ad_id": "0",
                            "form_id": "form_test_555",
                            "leadgen_id": "444444444444",
                            "created_time": 1732360000,
                            "page_id": "104928192"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(dummyPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());
        assertEquals(leadId, ack.getLeadId());
        verify(leadService, times(1)).createLead(any(LeadCreateRequest.class), eq(companyId));
    }

    @Test
    @DisplayName("21. Facebook: handleFacebookWebhook resolves page in nested pages array")
    void testHandleFacebookWebhook_NestedPagesArray_ResolvesTenant() {
        CurrentUserContext.clear();

        String credsJson = """
                {
                  "userAccessToken": "user_token_abc",
                  "pages": [
                    {
                      "pageId": "nested_page_789",
                      "pageName": "Nested Testing Page",
                      "pageAccessToken": "nested_token_xyz"
                    }
                  ]
                }
                """;

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson(credsJson)
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(eq(companyId), anyString())).thenReturn(false);
        when(leadSourceRepository.findByCompanyIdAndSourceCodeAndIsDeletedFalse(eq(companyId), anyString()))
                .thenReturn(Optional.of(CrmLeadSource.builder().id(UUID.randomUUID()).build()));

        UUID leadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(com.erp.crm.modules.lead.dto.response.LeadResponse.builder().id(leadId).build());

        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "nested_page_789",
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "leadgen_id": "leadgen_555",
                            "page_id": "nested_page_789"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());
        verify(leadService, times(1)).createLead(any(LeadCreateRequest.class), eq(companyId));
    }

    @Test
    @DisplayName("22. Facebook: handleFacebookWebhook resolves page when pageId is a key in routingConfig pageMappings")
    void testHandleFacebookWebhook_PageMappingsKeyInRoutingConfig_ResolvesTenant() {
        CurrentUserContext.clear();

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"userAccessToken\":\"user_token_123\"}")
                .routingConfigJson("{\"pageMappings\":{\"104928192\":{\"leadPoolId\":\"pool-1\",\"autoQualify\":true}}}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(eq(companyId), anyString())).thenReturn(false);
        when(leadSourceRepository.findByCompanyIdAndSourceCodeAndIsDeletedFalse(eq(companyId), anyString()))
                .thenReturn(Optional.of(CrmLeadSource.builder().id(UUID.randomUUID()).build()));

        UUID leadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(com.erp.crm.modules.lead.dto.response.LeadResponse.builder().id(leadId).build());

        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "104928192",
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "leadgen_id": "leadgen_map_1",
                            "page_id": "104928192"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());
        verify(leadService, times(1)).createLead(any(LeadCreateRequest.class), eq(companyId));
    }

    @Test
    @DisplayName("23. Facebook: handleFacebookWebhook resolves page in raw Graph API data array")
    void testHandleFacebookWebhook_RawGraphApiDataArray_ResolvesTenant() {
        CurrentUserContext.clear();

        String rawGraphCreds = """
                {
                  "data": [
                    {
                      "id": "104928192",
                      "name": "Mohit CRM Testing",
                      "access_token": "page_token_from_graph_api"
                    }
                  ]
                }
                """;

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson(rawGraphCreds)
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(eq(companyId), anyString())).thenReturn(false);
        when(leadSourceRepository.findByCompanyIdAndSourceCodeAndIsDeletedFalse(eq(companyId), anyString()))
                .thenReturn(Optional.of(CrmLeadSource.builder().id(UUID.randomUUID()).build()));

        UUID leadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(com.erp.crm.modules.lead.dto.response.LeadResponse.builder().id(leadId).build());

        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "104928192",
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "leadgen_id": "leadgen_graph_1",
                            "page_id": "104928192"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());
        verify(leadService, times(1)).createLead(any(LeadCreateRequest.class), eq(companyId));
    }

    @Test
    @DisplayName("24. Facebook: handleFacebookWebhook resolves prefixed pageId (page_104928192 vs 104928192)")
    void testHandleFacebookWebhook_PrefixedPageId_ResolvesTenant() {
        CurrentUserContext.clear();

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"pageId\":\"page_104928192\",\"pageAccessToken\":\"token_prefix\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(eq(companyId), anyString())).thenReturn(false);
        when(leadSourceRepository.findByCompanyIdAndSourceCodeAndIsDeletedFalse(eq(companyId), anyString()))
                .thenReturn(Optional.of(CrmLeadSource.builder().id(UUID.randomUUID()).build()));

        UUID leadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(com.erp.crm.modules.lead.dto.response.LeadResponse.builder().id(leadId).build());

        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "104928192",
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "leadgen_id": "leadgen_prefix_1",
                            "page_id": "104928192"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());
        verify(leadService, times(1)).createLead(any(LeadCreateRequest.class), eq(companyId));
    }

    @Test
    @DisplayName("25. Facebook: handleFacebookWebhook resolves numeric pageId in JSON")
    void testHandleFacebookWebhook_NumericPageIdInJson_ResolvesTenant() {
        CurrentUserContext.clear();

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"pageId\":104928192,\"pageAccessToken\":\"token_num\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(eq(companyId), anyString())).thenReturn(false);
        when(leadSourceRepository.findByCompanyIdAndSourceCodeAndIsDeletedFalse(eq(companyId), anyString()))
                .thenReturn(Optional.of(CrmLeadSource.builder().id(UUID.randomUUID()).build()));

        UUID leadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(com.erp.crm.modules.lead.dto.response.LeadResponse.builder().id(leadId).build());

        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "104928192",
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "leadgen_id": "leadgen_num_1",
                            "page_id": "104928192"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());
        verify(leadService, times(1)).createLead(any(LeadCreateRequest.class), eq(companyId));
    }

    @Test
    @DisplayName("26. Facebook: handleFacebookWebhook resolves stringified nested JSON")
    void testHandleFacebookWebhook_StringifiedJson_ResolvesTenant() {
        CurrentUserContext.clear();

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"pages\":\"[{\\\"pageId\\\":\\\"104928192\\\",\\\"pageAccessToken\\\":\\\"tok_str\\\"}]\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(eq(companyId), anyString())).thenReturn(false);
        when(leadSourceRepository.findByCompanyIdAndSourceCodeAndIsDeletedFalse(eq(companyId), anyString()))
                .thenReturn(Optional.of(CrmLeadSource.builder().id(UUID.randomUUID()).build()));

        UUID leadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(com.erp.crm.modules.lead.dto.response.LeadResponse.builder().id(leadId).build());

        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "104928192",
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "leadgen_id": "leadgen_str_1",
                            "page_id": "104928192"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());
        verify(leadService, times(1)).createLead(any(LeadCreateRequest.class), eq(companyId));
    }

    @Test
    @DisplayName("27. Facebook: handleFacebookWebhook resolves page in legacy crm_tenant_integration table")
    void testHandleFacebookWebhook_LegacyTableIntegration_ResolvesTenant() {
        CurrentUserContext.clear();

        // Modern repository returns no match
        when(tenantIntegrationRepository.findAll()).thenReturn(Collections.emptyList());

        // Legacy repository has a matching integration
        com.erp.crm.modules.integration.entity.CrmTenantIntegration legacyEntity =
                com.erp.crm.modules.integration.entity.CrmTenantIntegration.builder()
                        .id(UUID.randomUUID())
                        .connectionName("Facebook Page Lead Sync")
                        .webhookSlug("fb-legacy-slug")
                        .isEnabled(true)
                        .settingsJson("{\"pageId\":\"104928192\",\"pageAccessToken\":\"legacy_token\"}")
                        .build();
        legacyEntity.setCompanyId(companyId);
        legacyEntity.setIsDeleted(false);

        when(legacyTenantIntegrationRepository.findAll()).thenReturn(List.of(legacyEntity));
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(eq(companyId), anyString())).thenReturn(false);
        when(leadSourceRepository.findByCompanyIdAndSourceCodeAndIsDeletedFalse(eq(companyId), anyString()))
                .thenReturn(Optional.of(CrmLeadSource.builder().id(UUID.randomUUID()).build()));

        UUID leadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(com.erp.crm.modules.lead.dto.response.LeadResponse.builder().id(leadId).build());

        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "104928192",
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "leadgen_id": "leadgen_leg_1",
                            "page_id": "104928192"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());
        verify(leadService, times(1)).createLead(any(LeadCreateRequest.class), eq(companyId));
    }

    @Test
    @DisplayName("28. Facebook: handleFacebookWebhook rejects unknown Page ID (strict tenant isolation preserved)")
    void testHandleFacebookWebhook_UnknownPageId_StrictTenantIsolation_Rejected() {
        CurrentUserContext.clear();

        // Database only has integration for page 104928192
        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"pageId\":\"104928192\",\"pageAccessToken\":\"tok_123\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));
        when(legacyTenantIntegrationRepository.findAll()).thenReturn(Collections.emptyList());

        // Incoming webhook is for unknown page 999999999
        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "999999999",
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "leadgen_id": "leadgen_unknown",
                            "page_id": "999999999"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(0, ack.getLeadsCount());
        // Verify leadService.createLead was NEVER called (tenant isolation preserved, never routed to an arbitrary tenant)
        verify(leadService, never()).createLead(any(), any());
    }

    @Test
    @DisplayName("29. Facebook: empty page_id in changes does not overwrite valid entry.id")
    void testHandleFacebookWebhook_EmptyPageIdInChanges_PreservesEntryId() {
        CurrentUserContext.clear();

        TenantIntegrationEntity fbEntity = TenantIntegrationEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .credentialsJson("{\"pageId\":\"104928192\",\"pageAccessToken\":\"tok_entry\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findAll()).thenReturn(List.of(fbEntity));
        when(leadRepository.existsByCompanyIdAndExternalLeadIdAndIsDeletedFalse(eq(companyId), anyString())).thenReturn(false);
        when(leadSourceRepository.findByCompanyIdAndSourceCodeAndIsDeletedFalse(eq(companyId), anyString()))
                .thenReturn(Optional.of(CrmLeadSource.builder().id(UUID.randomUUID()).build()));

        UUID leadId = UUID.randomUUID();
        when(leadService.createLead(any(LeadCreateRequest.class), eq(companyId)))
                .thenReturn(com.erp.crm.modules.lead.dto.response.LeadResponse.builder().id(leadId).build());

        // Webhook where changes.value.page_id is empty string ""
        String metaPayload = """
                {
                  "object": "page",
                  "entry": [
                    {
                      "id": "104928192",
                      "changes": [
                        {
                          "field": "leadgen",
                          "value": {
                            "leadgen_id": "leadgen_empty_page_id",
                            "page_id": ""
                          }
                        }
                      ]
                    }
                  ]
                }
                """;

        WebhookAckResponse ack = integrationService.handleFacebookWebhook(metaPayload, "127.0.0.1", Map.of());

        assertNotNull(ack);
        assertEquals(1, ack.getLeadsCount());
        verify(leadService, times(1)).createLead(any(LeadCreateRequest.class), eq(companyId));
    }

    @Test
    @DisplayName("30. Facebook: triggerSync routes to explicit case FACEBOOK and executes syncFacebookLeadAds")
    void testTriggerSyncFacebookLeadAds_ExplicitCaseFacebook() {
        UUID integrationId = UUID.randomUUID();
        TenantIntegrationEntity entity = TenantIntegrationEntity.builder()
                .id(integrationId)
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .integrationName("Facebook Lead Ads Ingestion")
                .credentialsJson("{\"pages\":[{\"pageId\":\"p100\",\"pageAccessToken\":\"mock_token_sync\",\"isSyncEnabled\":true}]}")
                .status(TenantIntegrationStatus.CONNECTED)
                .webhookSlug("fb-sync-slug")
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findByIdAndTenantIdAndIsDeletedFalse(integrationId, companyId))
                .thenReturn(Optional.of(entity));
        when(tenantIntegrationRepository.save(any(TenantIntegrationEntity.class))).thenAnswer(i -> i.getArgument(0));

        SyncTriggerResponse response = integrationService.triggerSync(integrationId, companyId);

        assertNotNull(response);
        assertEquals(integrationId, response.getIntegrationId());
        assertEquals("TRIGGERED", response.getSyncStatus());
        assertEquals(0, response.getQueuedRecords());
        assertTrue(response.getMessage().contains("Facebook Lead Ads sync completed"));
        assertNotNull(entity.getLastSyncedAt());
        verify(tenantIntegrationRepository, times(1)).save(entity);
    }

    @Test
    @DisplayName("31. Facebook: syncFacebookLeadAds handles flat credentials fallback")
    void testTriggerSyncFacebookLeadAds_FlatCredentialsFallback() {
        UUID integrationId = UUID.randomUUID();
        TenantIntegrationEntity entity = TenantIntegrationEntity.builder()
                .id(integrationId)
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .integrationName("Facebook Lead Ads Flat")
                .credentialsJson("{\"pageId\":\"flat_p1\",\"pageAccessToken\":\"mock_flat_token\",\"formId\":\"form_flat_1\"}")
                .status(TenantIntegrationStatus.CONNECTED)
                .webhookSlug("fb-flat-slug")
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findByIdAndTenantIdAndIsDeletedFalse(integrationId, companyId))
                .thenReturn(Optional.of(entity));
        when(tenantIntegrationRepository.save(any(TenantIntegrationEntity.class))).thenAnswer(i -> i.getArgument(0));

        SyncTriggerResponse response = integrationService.triggerSync(integrationId, companyId);

        assertNotNull(response);
        assertEquals(integrationId, response.getIntegrationId());
        assertEquals(0, response.getQueuedRecords());
        assertEquals("Facebook Lead Ads sync completed. 0 record(s) processed.", response.getMessage());
    }

    @Test
    @DisplayName("32. Facebook: syncFacebookLeadAds skips pages with isSyncEnabled=false")
    void testTriggerSyncFacebookLeadAds_DisabledPage_Skipped() {
        UUID integrationId = UUID.randomUUID();
        TenantIntegrationEntity entity = TenantIntegrationEntity.builder()
                .id(integrationId)
                .tenantId(companyId)
                .providerCode(IntegrationProviderCode.FACEBOOK)
                .integrationName("Facebook Lead Ads Disabled Page")
                .credentialsJson("{\"pages\":[{\"pageId\":\"disabled_p1\",\"pageAccessToken\":\"mock_disabled_token\",\"isSyncEnabled\":false}]}")
                .status(TenantIntegrationStatus.CONNECTED)
                .webhookSlug("fb-disabled-slug")
                .isDeleted(false)
                .build();

        when(tenantIntegrationRepository.findByIdAndTenantIdAndIsDeletedFalse(integrationId, companyId))
                .thenReturn(Optional.of(entity));
        when(tenantIntegrationRepository.save(any(TenantIntegrationEntity.class))).thenAnswer(i -> i.getArgument(0));

        SyncTriggerResponse response = integrationService.triggerSync(integrationId, companyId);

        assertNotNull(response);
        assertEquals(0, response.getQueuedRecords());
        assertEquals("Facebook Lead Ads sync completed. 0 record(s) processed.", response.getMessage());
    }
}
