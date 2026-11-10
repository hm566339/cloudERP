package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.UpdateOrganizationAppearanceRequest;
import com.erp.auth_service.dto.response.OrganizationAppearanceResponse;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationAppearance;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.User;
import com.erp.auth_service.repository.OrganizationAppearanceRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.OrganizationAppearanceServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationAppearanceServiceTest {

    @Mock
    private OrganizationAppearanceRepository appearanceRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationMemberRepository organizationMemberRepository;

    @Mock
    private AuthorizationService authorizationService;

    private OrganizationAppearanceService appearanceService;

    private UUID orgAId;
    private UUID orgBId;
    private UUID ownerAId;
    private UUID adminAId;
    private UUID memberAId;
    private UUID externalUserId;

    private Organization orgA;
    private Organization orgB;

    @BeforeEach
    void setUp() {
        appearanceService = new OrganizationAppearanceServiceImpl(
                appearanceRepository,
                organizationRepository,
                organizationMemberRepository,
                authorizationService);

        orgAId = UUID.randomUUID();
        orgBId = UUID.randomUUID();
        ownerAId = UUID.randomUUID();
        adminAId = UUID.randomUUID();
        memberAId = UUID.randomUUID();
        externalUserId = UUID.randomUUID();

        orgA = Organization.builder()
                .id(orgAId)
                .organizationCode("ORGA")
                .displayName("Organization Alpha")
                .legalName("Alpha Inc")
                .accessMode(AccessMode.FULL)
                .build();

        orgB = Organization.builder()
                .id(orgBId)
                .organizationCode("ORGB")
                .displayName("Organization Beta")
                .legalName("Beta LLC")
                .accessMode(AccessMode.FULL)
                .build();
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
        SecurityContextHolder.clearContext();
    }

    private void mockActiveMember(UUID orgId, UUID userId, MemberType memberType) {
        OrganizationMember member = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(Organization.builder().id(orgId).build())
                .user(User.builder().id(userId).build())
                .memberType(memberType)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(member));
    }

    @Test
    @DisplayName("Test 1: Unconfigured organization returns default Sage Nature appearance")
    void unconfiguredOrgReturnsDefaultSageNature() {
        RequestContext.set(ownerAId, orgAId, null, null, AccessMode.FULL);
        mockActiveMember(orgAId, ownerAId, MemberType.OWNER);
        when(organizationRepository.findById(orgAId)).thenReturn(Optional.of(orgA));
        when(appearanceRepository.findByOrganization_Id(orgAId)).thenReturn(Optional.empty());

        OrganizationAppearanceResponse res = appearanceService.getAppearance(orgAId);

        assertNotNull(res);
        assertEquals(orgAId, res.getOrganizationId());
        assertEquals("ORGA", res.getOrganizationCode());
        assertEquals("sage", res.getActiveTheme());
        assertEquals("system", res.getAppearanceMode());
        assertEquals("comfortable", res.getLayoutDensity());
        assertEquals("default", res.getFontFamily());
    }

    @Test
    @DisplayName("Test 2: Multi-tenant theme isolation: Org A settings never affect Org B")
    void multiTenantIsolationOrgASettingsDoNotAffectOrgB() {
        // Setup Org A with Ocean Blue
        OrganizationAppearance appearanceA = OrganizationAppearance.builder()
                .id(UUID.randomUUID())
                .organization(orgA)
                .activeTheme("ocean")
                .appearanceMode("light")
                .layoutDensity("comfortable")
                .fontFamily("default")
                .updatedAt(LocalDateTime.now())
                .build();

        // Setup Org B with Lavender
        OrganizationAppearance appearanceB = OrganizationAppearance.builder()
                .id(UUID.randomUUID())
                .organization(orgB)
                .activeTheme("lavender")
                .appearanceMode("dark")
                .layoutDensity("compact")
                .fontFamily("inter")
                .updatedAt(LocalDateTime.now())
                .build();

        when(organizationRepository.findById(orgAId)).thenReturn(Optional.of(orgA));
        when(organizationRepository.findById(orgBId)).thenReturn(Optional.of(orgB));
        when(appearanceRepository.findByOrganization_Id(orgAId)).thenReturn(Optional.of(appearanceA));
        when(appearanceRepository.findByOrganization_Id(orgBId)).thenReturn(Optional.of(appearanceB));

        // Member of Org A reads Org A
        RequestContext.set(memberAId, orgAId, null, null, AccessMode.FULL);
        mockActiveMember(orgAId, memberAId, MemberType.MEMBER);
        OrganizationAppearanceResponse resA = appearanceService.getAppearance(orgAId);

        // Member of Org B reads Org B
        UUID memberBId = UUID.randomUUID();
        RequestContext.set(memberBId, orgBId, null, null, AccessMode.FULL);
        mockActiveMember(orgBId, memberBId, MemberType.MEMBER);
        OrganizationAppearanceResponse resB = appearanceService.getAppearance(orgBId);

        assertEquals("ocean", resA.getActiveTheme());
        assertEquals("light", resA.getAppearanceMode());

        assertEquals("lavender", resB.getActiveTheme());
        assertEquals("dark", resB.getAppearanceMode());
        assertEquals("compact", resB.getLayoutDensity());

        // Cross-check: Org A settings are completely isolated from Org B
        assertNotEquals(resA.getActiveTheme(), resB.getActiveTheme());
    }

    @Test
    @DisplayName("Test 3: Organization OWNER can update and persist appearance settings")
    void ownerCanUpdateAppearanceSettings() {
        RequestContext.set(ownerAId, orgAId, null, null, AccessMode.FULL);
        mockActiveMember(orgAId, ownerAId, MemberType.OWNER);
        when(organizationRepository.findById(orgAId)).thenReturn(Optional.of(orgA));
        when(appearanceRepository.findByOrganization_Id(orgAId)).thenReturn(Optional.empty());
        when(appearanceRepository.save(any(OrganizationAppearance.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateOrganizationAppearanceRequest req = UpdateOrganizationAppearanceRequest.builder()
                .activeTheme("terracotta")
                .appearanceMode("dark")
                .layoutDensity("compact")
                .fontFamily("default")
                .build();

        OrganizationAppearanceResponse res = appearanceService.updateAppearance(orgAId, ownerAId, req);

        assertNotNull(res);
        assertEquals("terracotta", res.getActiveTheme());
        assertEquals("dark", res.getAppearanceMode());
        assertEquals("compact", res.getLayoutDensity());
        verify(appearanceRepository).save(any(OrganizationAppearance.class));
    }

    @Test
    @DisplayName("Test 4: Organization ADMIN can update appearance settings")
    void adminCanUpdateAppearanceSettings() {
        RequestContext.set(adminAId, orgAId, null, null, AccessMode.FULL);
        mockActiveMember(orgAId, adminAId, MemberType.ADMIN);
        when(organizationRepository.findById(orgAId)).thenReturn(Optional.of(orgA));
        when(appearanceRepository.findByOrganization_Id(orgAId)).thenReturn(Optional.empty());
        when(appearanceRepository.save(any(OrganizationAppearance.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateOrganizationAppearanceRequest req = UpdateOrganizationAppearanceRequest.builder()
                .activeTheme("slate")
                .appearanceMode("light")
                .build();

        OrganizationAppearanceResponse res = appearanceService.updateAppearance(orgAId, adminAId, req);

        assertNotNull(res);
        assertEquals("slate", res.getActiveTheme());
        assertEquals("light", res.getAppearanceMode());
    }

    @Test
    @DisplayName("Test 5: Regular MEMBER cannot modify appearance settings (403 Forbidden)")
    void regularMemberCannotUpdateAppearance() {
        RequestContext.set(memberAId, orgAId, null, null, AccessMode.FULL);
        mockActiveMember(orgAId, memberAId, MemberType.MEMBER);

        UpdateOrganizationAppearanceRequest req = UpdateOrganizationAppearanceRequest.builder()
                .activeTheme("ocean")
                .build();

        ForbiddenException ex = assertThrows(ForbiddenException.class,
                () -> appearanceService.updateAppearance(orgAId, memberAId, req));

        assertTrue(ex.getMessage().contains("Only organization OWNER or ADMIN can modify appearance settings"));
        verify(appearanceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 6: Non-member cannot read organization appearance (403 Forbidden)")
    void nonMemberCannotReadAppearance() {
        RequestContext.set(externalUserId, orgAId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgAId, externalUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class, () -> appearanceService.getAppearance(orgAId));
    }

    @Test
    @DisplayName("Test 7: Reset appearance restores default Sage Nature settings")
    void resetAppearanceRestoresDefaults() {
        RequestContext.set(ownerAId, orgAId, null, null, AccessMode.FULL);
        mockActiveMember(orgAId, ownerAId, MemberType.OWNER);
        when(organizationRepository.findById(orgAId)).thenReturn(Optional.of(orgA));

        OrganizationAppearance existing = OrganizationAppearance.builder()
                .organization(orgA)
                .activeTheme("ocean")
                .appearanceMode("dark")
                .layoutDensity("compact")
                .build();
        when(appearanceRepository.findByOrganization_Id(orgAId)).thenReturn(Optional.of(existing));
        when(appearanceRepository.save(any(OrganizationAppearance.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrganizationAppearanceResponse res = appearanceService.resetAppearance(orgAId, ownerAId);

        assertNotNull(res);
        assertEquals("sage", res.getActiveTheme());
        assertEquals("system", res.getAppearanceMode());
        assertEquals("comfortable", res.getLayoutDensity());
        assertEquals("default", res.getFontFamily());
        assertEquals("expanded", res.getSidebarDefaultState());
        assertEquals("standard", res.getContentWidth());
        assertEquals("medium", res.getBorderRadius());
        assertTrue(res.getCardShadow());
    }

    @Test
    @DisplayName("Test 8: Owner can update extended appearance (layout, branding URLs, and custom palette)")
    void ownerCanUpdateExtendedAppearance() {
        RequestContext.set(ownerAId, orgAId, null, null, AccessMode.FULL);
        mockActiveMember(orgAId, ownerAId, MemberType.OWNER);
        when(organizationRepository.findById(orgAId)).thenReturn(Optional.of(orgA));
        when(appearanceRepository.findByOrganization_Id(orgAId)).thenReturn(Optional.empty());
        when(appearanceRepository.save(any(OrganizationAppearance.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateOrganizationAppearanceRequest req = UpdateOrganizationAppearanceRequest.builder()
                .activeTheme("ocean")
                .appearanceMode("light")
                .sidebarDefaultState("collapsed")
                .contentWidth("wide")
                .borderRadius("large")
                .cardShadow(false)
                .tableDensity("compact")
                .baseFontSize("large")
                .lightLogoUrl("https://example.com/logo-light.png")
                .darkLogoUrl("https://example.com/logo-dark.png")
                .faviconUrl("https://example.com/favicon.ico")
                .customOverridesEnabled(true)
                .primaryColor("#123456")
                .secondaryColor("#654321")
                .accentColor("#abcdef")
                .build();

        OrganizationAppearanceResponse res = appearanceService.updateAppearance(orgAId, ownerAId, req);

        assertNotNull(res);
        assertEquals("ocean", res.getActiveTheme());
        assertEquals("collapsed", res.getSidebarDefaultState());
        assertEquals("wide", res.getContentWidth());
        assertEquals("large", res.getBorderRadius());
        assertFalse(res.getCardShadow());
        assertEquals("compact", res.getTableDensity());
        assertEquals("large", res.getBaseFontSize());
        assertEquals("https://example.com/logo-light.png", res.getLightLogoUrl());
        assertEquals("https://example.com/logo-dark.png", res.getDarkLogoUrl());
        assertEquals("https://example.com/favicon.ico", res.getFaviconUrl());
        assertTrue(res.getCustomOverridesEnabled());
        assertEquals("#123456", res.getPrimaryColor());
    }

    @Test
    @DisplayName("Test 9: Upload asset with valid PNG updates OrganizationAppearance and returns asset URL")
    void uploadAssetSuccess() {
        RequestContext.set(ownerAId, orgAId, null, null, AccessMode.FULL);
        mockActiveMember(orgAId, ownerAId, MemberType.OWNER);
        when(organizationRepository.findById(orgAId)).thenReturn(Optional.of(orgA));
        when(appearanceRepository.findByOrganization_Id(orgAId)).thenReturn(Optional.empty());
        when(appearanceRepository.save(any(OrganizationAppearance.class))).thenAnswer(invocation -> invocation.getArgument(0));

        org.springframework.mock.web.MockMultipartFile mockFile =
                new org.springframework.mock.web.MockMultipartFile(
                        "file",
                        "logo.png",
                        "image/png",
                        "dummy image content".getBytes()
                );

        var result = appearanceService.uploadAsset(orgAId, ownerAId, mockFile, "light_logo");

        assertNotNull(result);
        assertNotNull(result.get("assetUrl"));
        assertTrue(String.valueOf(result.get("assetUrl")).startsWith("data:image/png;base64,"));
        assertEquals("light_logo", result.get("assetType"));
        assertNotNull(result.get("appearance"));
    }

    @Test
    @DisplayName("Test 10: Upload asset exceeding 2MB throws IllegalArgumentException")
    void uploadAssetTooLargeThrowsException() {
        RequestContext.set(ownerAId, orgAId, null, null, AccessMode.FULL);
        mockActiveMember(orgAId, ownerAId, MemberType.OWNER);

        byte[] bigContent = new byte[(int) (2.5 * 1024 * 1024)];
        org.springframework.mock.web.MockMultipartFile mockFile =
                new org.springframework.mock.web.MockMultipartFile(
                        "file",
                        "big.png",
                        "image/png",
                        bigContent
                );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> appearanceService.uploadAsset(orgAId, ownerAId, mockFile, "favicon"));

        assertTrue(ex.getMessage().contains("2MB"));
    }
}

