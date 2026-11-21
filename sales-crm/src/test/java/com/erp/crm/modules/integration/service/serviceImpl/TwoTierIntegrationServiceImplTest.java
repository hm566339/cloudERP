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
}
