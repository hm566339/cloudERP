package com.erp.auth_service.service.platform;

import com.erp.auth_service.dto.platform.*;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.InvalidOperationException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.model.platform.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.SupportAccessSessionRepository;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.OrganizationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformSupportServiceTest {

    @Mock private PlatformAdminRepository platformAdminRepository;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ModuleRepository moduleRepository;
    @Mock private OrganizationModuleRepository organizationModuleRepository;
    @Mock private CompanyModuleRepository companyModuleRepository;
    @Mock private SupportAccessSessionRepository supportAccessSessionRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private PlatformAuditService platformAuditService;
    @Mock private JwtService jwtService;
    @Mock private AuthorizationService authorizationService;

    @InjectMocks
    private PlatformSupportService platformSupportService;

    private PlatformAdmin supportAdmin;
    private PlatformAdmin readOnlySupportAdmin;
    private Organization orgA;
    private Organization orgB;
    private Company compA;
    private Company compB;
    private Module salesModule;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(platformSupportService, "defaultDurationMinutes", 30);
        ReflectionTestUtils.setField(platformSupportService, "maxDurationMinutes", 60);

        PlatformPermission supportPerm = PlatformPermission.builder()
                .code("PLATFORM_SUPPORT_ACCESS")
                .description("Support access")
                .build();

        PlatformRole supportRole = PlatformRole.builder()
                .code("SUPPORT_ADMIN")
                .permissions(Set.of(supportPerm))
                .build();

        PlatformRole readOnlySupportRole = PlatformRole.builder()
                .code("READ_ONLY_SUPPORT")
                .permissions(Set.of(supportPerm))
                .build();

        supportAdmin = PlatformAdmin.builder()
                .id(UUID.randomUUID())
                .email("support@platform.com")
                .status(PlatformAdminStatus.ACTIVE)
                .roles(Set.of(supportRole))
                .build();

        readOnlySupportAdmin = PlatformAdmin.builder()
                .id(UUID.randomUUID())
                .email("readonly@platform.com")
                .status(PlatformAdminStatus.ACTIVE)
                .roles(Set.of(readOnlySupportRole))
                .build();

        orgA = Organization.builder()
                .id(UUID.randomUUID())
                .displayName("Acme Corp")
                .organizationCode("ACME")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        orgB = Organization.builder()
                .id(UUID.randomUUID())
                .displayName("Beta Corp")
                .organizationCode("BETA")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        compA = Company.builder()
                .id(UUID.randomUUID())
                .companyName("Acme HQ")
                .companyCode("ACME01")
                .active(true)
                .organization(orgA)
                .build();

        compB = Company.builder()
                .id(UUID.randomUUID())
                .companyName("Beta HQ")
                .companyCode("BETA01")
                .active(true)
                .organization(orgB)
                .build();

        salesModule = Module.builder()
                .id(UUID.randomUUID())
                .name("SALES")
                .moduleStatus(true)
                .clientId(UUID.randomUUID())
                .build();
    }

    @Test
    @DisplayName("createSupportSession: creates valid support session with JWT")
    void createSupportSession_Success() {
        when(platformAdminRepository.findById(supportAdmin.getId())).thenReturn(Optional.of(supportAdmin));
        when(organizationRepository.findById(orgA.getId())).thenReturn(Optional.of(orgA));
        when(companyRepository.findById(compA.getId())).thenReturn(Optional.of(compA));
        when(moduleRepository.findByNameIgnoreCase("SALES")).thenReturn(Optional.of(salesModule));
        when(organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(orgA.getId(), salesModule.getId())).thenReturn(true);
        when(companyModuleRepository.existsByCompany_IdAndModule_IdAndActiveTrue(compA.getId(), salesModule.getId())).thenReturn(true);
        when(jwtService.generateAccessToken(eq(supportAdmin.getEmail()), anyMap())).thenReturn("mock.support.jwt");
        when(supportAccessSessionRepository.save(any())).thenAnswer(inv -> {
            SupportAccessSession s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        CreateSupportSessionRequest req = CreateSupportSessionRequest.builder()
                .organizationId(orgA.getId())
                .companyId(compA.getId())
                .moduleCode("SALES")
                .reason("Investigating incorrect invoice total")
                .durationMinutes(30)
                .build();

        SupportSessionResponse resp = platformSupportService.createSupportSession(
                supportAdmin.getId(), req, "127.0.0.1", "Agent");

        assertNotNull(resp);
        assertEquals("mock.support.jwt", resp.getSupportToken());
        assertEquals(orgA.getId(), resp.getOrganizationId());
        assertEquals(compA.getId(), resp.getCompanyId());
        assertEquals("SALES", resp.getModuleCode());
        assertEquals(SupportSessionStatus.ACTIVE, resp.getStatus());
        assertTrue(resp.isActive());

        verify(platformAuditService).record(eq(supportAdmin), eq(supportAdmin.getEmail()), eq("SUPPORT_SESSION_CREATED"),
                eq(orgA.getId()), eq(compA.getId()), eq(salesModule.getId()), any(),
                eq("SupportAccessSession"), anyString(), eq(req.getReason()), eq("127.0.0.1"), eq("Agent"), eq("SUCCESS"), anyString());
    }

    @Test
    @DisplayName("createSupportSession: cross-organization attack (Org A + Company B) is rejected and audited")
    void createSupportSession_CrossOrgAttack_Rejected() {
        when(platformAdminRepository.findById(supportAdmin.getId())).thenReturn(Optional.of(supportAdmin));
        when(organizationRepository.findById(orgA.getId())).thenReturn(Optional.of(orgA));
        when(companyRepository.findById(compB.getId())).thenReturn(Optional.of(compB)); // compB belongs to orgB!

        CreateSupportSessionRequest req = CreateSupportSessionRequest.builder()
                .organizationId(orgA.getId())
                .companyId(compB.getId()) // attack: Org A + Company B
                .moduleCode("SALES")
                .reason("Attempting cross-org access")
                .durationMinutes(30)
                .build();

        InvalidOperationException ex = assertThrows(InvalidOperationException.class,
                () -> platformSupportService.createSupportSession(supportAdmin.getId(), req, "127.0.0.1", "Agent"));

        assertEquals("Company does not belong to requested organization", ex.getMessage());

        verify(platformAuditService).record(eq(supportAdmin), eq(supportAdmin.getEmail()), eq("CROSS_ORG_SUPPORT_ATTEMPT"),
                eq(orgA.getId()), eq(compB.getId()), isNull(), isNull(),
                eq("SupportAccessSession"), isNull(), anyString(), eq("127.0.0.1"), eq("Agent"), eq("DENIED"), isNull());
    }

    @Test
    @DisplayName("createSupportSession: BLOCKED organization is rejected")
    void createSupportSession_BlockedOrg_Rejected() {
        orgA.setAccessMode(AccessMode.BLOCKED);
        when(platformAdminRepository.findById(supportAdmin.getId())).thenReturn(Optional.of(supportAdmin));
        when(organizationRepository.findById(orgA.getId())).thenReturn(Optional.of(orgA));

        CreateSupportSessionRequest req = CreateSupportSessionRequest.builder()
                .organizationId(orgA.getId())
                .companyId(compA.getId())
                .moduleCode("SALES")
                .reason("Support for blocked org")
                .durationMinutes(30)
                .build();

        assertThrows(InvalidOperationException.class,
                () -> platformSupportService.createSupportSession(supportAdmin.getId(), req, "127.0.0.1", "Agent"));
    }

    @Test
    @DisplayName("createSupportSession: duration exceeding max is rejected")
    void createSupportSession_ExcessiveDuration_Rejected() {
        when(platformAdminRepository.findById(supportAdmin.getId())).thenReturn(Optional.of(supportAdmin));
        when(organizationRepository.findById(orgA.getId())).thenReturn(Optional.of(orgA));
        when(companyRepository.findById(compA.getId())).thenReturn(Optional.of(compA));
        when(moduleRepository.findByNameIgnoreCase("SALES")).thenReturn(Optional.of(salesModule));
        when(organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(orgA.getId(), salesModule.getId())).thenReturn(true);
        when(companyModuleRepository.existsByCompany_IdAndModule_IdAndActiveTrue(compA.getId(), salesModule.getId())).thenReturn(true);

        CreateSupportSessionRequest req = CreateSupportSessionRequest.builder()
                .organizationId(orgA.getId())
                .companyId(compA.getId())
                .moduleCode("SALES")
                .reason("Testing duration limit")
                .durationMinutes(120) // max is 60
                .build();

        InvalidOperationException ex = assertThrows(InvalidOperationException.class,
                () -> platformSupportService.createSupportSession(supportAdmin.getId(), req, "127.0.0.1", "Agent"));

        assertTrue(ex.getMessage().contains("exceeds maximum allowed"));
    }

    @Test
    @DisplayName("revokeSupportSession: revokes active session")
    void revokeSupportSession_Success() {
        UUID sessionId = UUID.randomUUID();
        SupportAccessSession session = SupportAccessSession.builder()
                .id(sessionId)
                .platformAdmin(supportAdmin)
                .organization(orgA)
                .company(compA)
                .module(salesModule)
                .status(SupportSessionStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        when(supportAccessSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(supportAccessSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SupportSessionResponse resp = platformSupportService.revokeSupportSession(
                sessionId, supportAdmin.getId(), "Problem resolved", "127.0.0.1", "Agent");

        assertEquals(SupportSessionStatus.REVOKED, resp.getStatus());
        assertFalse(resp.isActive());
        assertNotNull(resp.getRevokedAt());
    }

    @Test
    @DisplayName("executeSupportMutation: allowed for SUPPORT_ADMIN and audited")
    void executeSupportMutation_SupportAdmin_Allowed() {
        UUID sessionId = UUID.randomUUID();
        SupportAccessSession session = SupportAccessSession.builder()
                .id(sessionId)
                .platformAdmin(supportAdmin)
                .organization(orgA)
                .company(compA)
                .module(salesModule)
                .status(SupportSessionStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        when(supportAccessSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(platformAdminRepository.findById(supportAdmin.getId())).thenReturn(Optional.of(supportAdmin));

        SupportMutationRequest req = SupportMutationRequest.builder()
                .action("CORRECT_INVOICE")
                .resourceType("INVOICE")
                .resourceId("INV-1023")
                .reason("Customer reported tax calculation discrepancy")
                .payload(Map.of("taxAmount", 15.00))
                .build();

        Map<String, Object> result = platformSupportService.executeSupportMutation(
                sessionId, supportAdmin.getId(), req, "127.0.0.1", "Agent");

        assertEquals("SUCCESS", result.get("status"));
        assertEquals("CORRECT_INVOICE", result.get("action"));

        verify(authorizationService).requireWriteAccess();
        verify(platformAuditService).record(eq(supportAdmin), eq(supportAdmin.getEmail()), eq("CORRECT_INVOICE"),
                eq(orgA.getId()), eq(compA.getId()), eq(salesModule.getId()), eq(sessionId),
                eq("INVOICE"), eq("INV-1023"), eq(req.getReason()), eq("127.0.0.1"), eq("Agent"), eq("SUCCESS"), anyString());
    }

    @Test
    @DisplayName("executeSupportMutation: READ_ONLY_SUPPORT is forbidden from mutating data")
    void executeSupportMutation_ReadOnlySupport_Forbidden() {
        UUID sessionId = UUID.randomUUID();
        SupportAccessSession session = SupportAccessSession.builder()
                .id(sessionId)
                .platformAdmin(readOnlySupportAdmin)
                .organization(orgA)
                .company(compA)
                .module(salesModule)
                .status(SupportSessionStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        when(supportAccessSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(platformAdminRepository.findById(readOnlySupportAdmin.getId())).thenReturn(Optional.of(readOnlySupportAdmin));

        SupportMutationRequest req = SupportMutationRequest.builder()
                .action("CORRECT_INVOICE")
                .resourceType("INVOICE")
                .resourceId("INV-1023")
                .reason("Attempting unauthorized mutation")
                .build();

        ForbiddenException ex = assertThrows(ForbiddenException.class,
                () -> platformSupportService.executeSupportMutation(sessionId, readOnlySupportAdmin.getId(), req, "127.0.0.1", "Agent"));

        assertTrue(ex.getMessage().contains("READ_ONLY_SUPPORT"));
    }

    @Test
    @DisplayName("executeSupportMutation: expired session is forbidden")
    void executeSupportMutation_ExpiredSession_Forbidden() {
        UUID sessionId = UUID.randomUUID();
        SupportAccessSession session = SupportAccessSession.builder()
                .id(sessionId)
                .platformAdmin(supportAdmin)
                .organization(orgA)
                .company(compA)
                .module(salesModule)
                .status(SupportSessionStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().minusMinutes(5)) // expired 5 minutes ago!
                .build();

        when(supportAccessSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        SupportMutationRequest req = SupportMutationRequest.builder()
                .action("CORRECT_INVOICE")
                .resourceType("INVOICE")
                .resourceId("INV-1023")
                .reason("Mutation on expired session")
                .build();

        assertThrows(ForbiddenException.class,
                () -> platformSupportService.executeSupportMutation(sessionId, supportAdmin.getId(), req, "127.0.0.1", "Agent"));
    }

    @Test
    @DisplayName("executeSupportMutation: mutation in READ_ONLY organization is forbidden")
    void executeSupportMutation_ReadOnlyOrg_Forbidden() {
        orgA.setAccessMode(AccessMode.READ_ONLY);
        UUID sessionId = UUID.randomUUID();
        SupportAccessSession session = SupportAccessSession.builder()
                .id(sessionId)
                .platformAdmin(supportAdmin)
                .organization(orgA)
                .company(compA)
                .module(salesModule)
                .status(SupportSessionStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        when(supportAccessSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(platformAdminRepository.findById(supportAdmin.getId())).thenReturn(Optional.of(supportAdmin));

        SupportMutationRequest req = SupportMutationRequest.builder()
                .action("CORRECT_INVOICE")
                .resourceType("INVOICE")
                .resourceId("INV-1023")
                .reason("Mutation on read-only org")
                .build();

        assertThrows(ForbiddenException.class,
                () -> platformSupportService.executeSupportMutation(sessionId, supportAdmin.getId(), req, "127.0.0.1", "Agent"));
    }
}
