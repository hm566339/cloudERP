package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.*;
import com.erp.auth_service.dto.response.*;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.OrganizationSettingsServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationSettingsServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationSettingsRepository organizationSettingsRepository;

    @Mock
    private OrganizationRegionalSettingsRepository regionalSettingsRepository;

    @Mock
    private OrganizationSecuritySettingsRepository securitySettingsRepository;

    @Mock
    private LocalizationSettingsRepository localizationSettingsRepository;

    @Mock
    private OrganizationMemberRepository organizationMemberRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Mock
    private ModuleRepository moduleRepository;

    @Mock
    private OrganizationModuleRepository organizationModuleRepository;

    @Mock
    private CompanyModuleRepository companyModuleRepository;

    @Mock
    private MemberCompanyAccessRepository memberCompanyAccessRepository;

    @Mock
    private AuthorizationService authorizationService;

    private OrganizationSettingsServiceImpl service;

    private UUID orgId;
    private UUID ownerUserId;
    private UUID nonOwnerUserId;
    private Organization org;
    private OrganizationMember ownerMember;

    @BeforeEach
    void setUp() {
        service = new OrganizationSettingsServiceImpl(
                organizationRepository,
                organizationSettingsRepository,
                regionalSettingsRepository,
                securitySettingsRepository,
                localizationSettingsRepository,
                organizationMemberRepository,
                companyRepository,
                subscriptionRepository,
                subscriptionPlanRepository,
                moduleRepository,
                organizationModuleRepository,
                companyModuleRepository,
                memberCompanyAccessRepository,
                authorizationService
        );

        ReflectionTestUtils.setField(service, "frontendBaseUrl", "https://app.mark2erp.com");

        orgId = UUID.randomUUID();
        ownerUserId = UUID.randomUUID();
        nonOwnerUserId = UUID.randomUUID();

        org = Organization.builder()
                .id(orgId)
                .organizationCode("ACME")
                .legalName("Acme Holdings Inc")
                .displayName("Acme Corp")
                .primaryEmail("billing@acme.com")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .currency("INR")
                .timezone("Asia/Kolkata (IST)")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ownerMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .user(User.builder().id(ownerUserId).email("owner@acme.com").build())
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Profile Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getProfile successfully returns organization profile")
    void testGetProfileSuccess() {
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        OrganizationProfileResponse profile = service.getProfile(orgId, ownerUserId);

        assertNotNull(profile);
        assertEquals("Acme Corp", profile.getName());
        assertEquals("ACME", profile.getCode());
        assertEquals("billing@acme.com", profile.getPrimaryEmail());
        assertEquals("ACTIVE", profile.getStatus());
    }

    @Test
    @DisplayName("updateProfile successfully updates name and email, maintaining code immutability")
    void testUpdateProfileSuccess() {
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(organizationRepository.existsByPrimaryEmailIgnoreCaseAndIdNot("contact@acme.com", orgId)).thenReturn(false);
        when(organizationRepository.save(any(Organization.class))).thenAnswer(i -> i.getArgument(0));
        when(organizationSettingsRepository.findByOrganization_Id(orgId)).thenReturn(Optional.empty());

        UpdateOrganizationProfileRequest req = UpdateOrganizationProfileRequest.builder()
                .name("Acme Enterprise")
                .primaryEmail("contact@acme.com")
                .build();

        OrganizationProfileResponse updated = service.updateProfile(orgId, ownerUserId, req);

        assertNotNull(updated);
        assertEquals("Acme Enterprise", updated.getName());
        assertEquals("contact@acme.com", updated.getPrimaryEmail());
        assertEquals("ACME", updated.getCode()); // Code immutable
        verify(organizationRepository).save(any(Organization.class));
    }

    @Test
    @DisplayName("updateProfile rejects duplicate email")
    void testUpdateProfileDuplicateEmail() {
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(organizationRepository.existsByPrimaryEmailIgnoreCaseAndIdNot("existing@other.com", orgId)).thenReturn(true);

        UpdateOrganizationProfileRequest req = UpdateOrganizationProfileRequest.builder()
                .name("Acme Enterprise")
                .primaryEmail("existing@other.com")
                .build();

        assertThrows(DuplicateResourceException.class, () -> service.updateProfile(orgId, ownerUserId, req));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Login Portal Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getLoginPortal returns vanity URL using organization code")
    void testGetLoginPortalSuccess() {
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        OrganizationLoginPortalResponse portal = service.getLoginPortal(orgId, ownerUserId);

        assertNotNull(portal);
        assertEquals("ACME", portal.getOrganizationCode());
        assertEquals("acme", portal.getSlug());
        assertEquals("https://app.mark2erp.com/erp/o/acme/login", portal.getLoginUrl());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Regional Settings Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateRegionalSettings validates currency, timezone, and fiscal year")
    void testUpdateRegionalSettingsSuccess() {
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(regionalSettingsRepository.findByOrganization_Id(orgId)).thenReturn(Optional.empty());
        when(regionalSettingsRepository.save(any(OrganizationRegionalSettings.class)))
                .thenAnswer(i -> i.getArgument(0));

        UpdateRegionalSettingsRequest req = UpdateRegionalSettingsRequest.builder()
                .currency("USD")
                .timezone("America/New_York (EST)")
                .fiscalYearStartMonth("January")
                .dateFormat("YYYY-MM-DD")
                .timeFormat("24h")
                .build();

        OrganizationRegionalSettingsResponse res = service.updateRegionalSettings(orgId, ownerUserId, req);

        assertNotNull(res);
        assertEquals("USD", res.getCurrency());
        assertEquals("America/New_York (EST)", res.getTimezone());
        assertEquals("January", res.getFiscalYearStartMonth());
        assertEquals("YYYY-MM-DD", res.getDateFormat());
        assertEquals("24h", res.getTimeFormat());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Security Settings Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateSecuritySettings persists 2FA enforcement and session timeout")
    void testUpdateSecuritySettingsSuccess() {
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(securitySettingsRepository.findByOrganization_Id(orgId)).thenReturn(Optional.empty());
        when(securitySettingsRepository.save(any(OrganizationSecuritySettings.class)))
                .thenAnswer(i -> i.getArgument(0));

        UpdateSecuritySettingsRequest req = UpdateSecuritySettingsRequest.builder()
                .enforce2FA(true)
                .sessionTimeoutMinutes(120)
                .build();

        OrganizationSecuritySettingsResponse res = service.updateSecuritySettings(orgId, ownerUserId, req);

        assertNotNull(res);
        assertTrue(res.getEnforce2FA());
        assertEquals(120, res.getSessionTimeoutMinutes());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Multi-Company Management & Plan Limit Enforcement
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createCompany rejects when subscription plan limit is reached")
    void testCreateCompanyPlanLimitEnforced() {
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        SubscriptionPlan plan = SubscriptionPlan.builder().maxCompanies(1).build();
        Subscription sub = Subscription.builder()
                .organization(org)
                .status(SubscriptionStatus.ACTIVE)
                .plan(plan)
                .build();

        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId)).thenReturn(Optional.of(sub));
        when(companyRepository.countByOrganization_IdAndActiveTrue(orgId)).thenReturn(1L);

        CreateOrganizationCompanyRequest req = CreateOrganizationCompanyRequest.builder()
                .companyName("Second Branch")
                .companyCode("000002")
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class, () -> service.createCompany(orgId, ownerUserId, req));
        assertTrue(ex.getMessage().contains("Active company limit reached"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Entitled Modules Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getModules returns canonical ERP modules with enabled status")
    void testGetModules() {
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationModuleRepository.findByOrganization_Id(orgId)).thenReturn(List.of());

        OrganizationModulesResponse res = service.getModules(orgId, ownerUserId);

        assertNotNull(res);
        assertEquals(6, res.getTotalCount());
        assertEquals(6, res.getEnabledCount());
        assertTrue(res.getModules().stream().anyMatch(m -> "ACCOUNT".equals(m.getKey())));
        assertTrue(res.getModules().stream().anyMatch(m -> "INVENTORY".equals(m.getKey())));
    }
}

