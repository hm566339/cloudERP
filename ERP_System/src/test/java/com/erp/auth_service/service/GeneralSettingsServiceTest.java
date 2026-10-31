package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.UpdateGeneralSettingsRequest;
import com.erp.auth_service.dto.request.UpdateLocalizationSettingsRequest;
import com.erp.auth_service.dto.request.UpdateOrganizationSettingsRequest;
import com.erp.auth_service.dto.response.GeneralSettingsResponse;
import com.erp.auth_service.dto.response.LocalizationSettingsResponse;
import com.erp.auth_service.dto.response.OrganizationSettingsResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.model.LocalizationSettings;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.OrganizationSettings;
import com.erp.auth_service.model.User;
import com.erp.auth_service.repository.LocalizationSettingsRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.repository.OrganizationSettingsRepository;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.GeneralSettingsServiceImpl;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeneralSettingsServiceTest {

    @Mock
    private OrganizationSettingsRepository organizationSettingsRepository;

    @Mock
    private LocalizationSettingsRepository localizationSettingsRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationMemberRepository organizationMemberRepository;

    @Mock
    private AuthorizationService authorizationService;

    private GeneralSettingsServiceImpl generalSettingsService;

    private UUID orgId;
    private UUID ownerUserId;
    private UUID memberUserId;
    private Organization org;
    private OrganizationMember ownerMember;
    private OrganizationMember regularMember;

    @BeforeEach
    void setUp() {
        generalSettingsService = new GeneralSettingsServiceImpl(
                organizationSettingsRepository,
                localizationSettingsRepository,
                organizationRepository,
                organizationMemberRepository,
                authorizationService);

        orgId = UUID.randomUUID();
        ownerUserId = UUID.randomUUID();
        memberUserId = UUID.randomUUID();

        org = Organization.builder()
                .id(orgId)
                .organizationCode("ACME")
                .legalName("Acme Global Technologies Inc.")
                .displayName("Acme Global")
                .currency("INR")
                .timezone("IST")
                .accessMode(AccessMode.FULL)
                .build();

        User ownerUser = User.builder().id(ownerUserId).email("owner@acme.com").build();
        ownerMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .user(ownerUser)
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        User regUser = User.builder().id(memberUserId).email("staff@acme.com").build();
        regularMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .user(regUser)
                .memberType(MemberType.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    @Test
    @DisplayName("getOrganizationSettings returns existing saved settings")
    void getOrganizationSettingsExisting() {
        RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        OrganizationSettings existing = OrganizationSettings.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .companyName("Acme Corp")
                .contactEmail("info@acme.com")
                .updatedAt(LocalDateTime.now())
                .build();

        when(organizationSettingsRepository.findByOrganization_Id(orgId)).thenReturn(Optional.of(existing));

        OrganizationSettingsResponse res = generalSettingsService.getOrganizationSettings(orgId);

        assertNotNull(res);
        assertEquals("Acme Corp", res.getCompanyName());
        assertEquals("info@acme.com", res.getContactEmail());
    }

    @Test
    @DisplayName("getOrganizationSettings returns sensible defaults if not yet persisted")
    void getOrganizationSettingsDefaultFallback() {
        RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(organizationSettingsRepository.findByOrganization_Id(orgId)).thenReturn(Optional.empty());
        when(organizationMemberRepository.findByOrganization_Id(orgId)).thenReturn(List.of(ownerMember));

        OrganizationSettingsResponse res = generalSettingsService.getOrganizationSettings(orgId);

        assertNotNull(res);
        assertEquals("Acme Global", res.getCompanyName());
        assertEquals("owner@acme.com", res.getContactEmail());
    }

    @Test
    @DisplayName("updateOrganizationSettings updates company name, email and syncs organization display name")
    void updateOrganizationSettingsSuccess() {
        RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(organizationSettingsRepository.findByOrganization_Id(orgId)).thenReturn(Optional.empty());

        when(organizationSettingsRepository.save(any(OrganizationSettings.class))).thenAnswer(inv -> {
            OrganizationSettings s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        UpdateOrganizationSettingsRequest req = UpdateOrganizationSettingsRequest.builder()
                .companyName("Acme Enterprise Solutions")
                .contactEmail("contact@acmeenterprise.com")
                .build();

        OrganizationSettingsResponse res = generalSettingsService.updateOrganizationSettings(orgId, ownerUserId, req);

        assertNotNull(res);
        assertEquals("Acme Enterprise Solutions", res.getCompanyName());
        assertEquals("contact@acmeenterprise.com", res.getContactEmail());

        verify(organizationRepository).save(org);
        assertEquals("Acme Enterprise Solutions", org.getDisplayName());
    }

    @Test
    @DisplayName("updateOrganizationSettings throws BadRequestException for invalid email")
    void updateOrganizationSettingsInvalidEmail() {
        RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        UpdateOrganizationSettingsRequest req = UpdateOrganizationSettingsRequest.builder()
                .companyName("Acme Corp")
                .contactEmail("not-an-email")
                .build();

        assertThrows(BadRequestException.class, () ->
                generalSettingsService.updateOrganizationSettings(orgId, ownerUserId, req));
    }

    @Test
    @DisplayName("updateLocalizationSettings validates currency, timezone, date & time formats")
    void updateLocalizationSettingsSuccess() {
        RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(localizationSettingsRepository.findByOrganization_Id(orgId)).thenReturn(Optional.empty());

        when(localizationSettingsRepository.save(any(LocalizationSettings.class))).thenAnswer(inv -> {
            LocalizationSettings s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        UpdateLocalizationSettingsRequest req = UpdateLocalizationSettingsRequest.builder()
                .defaultCurrency("USD")
                .timezone("America/New_York")
                .dateFormat("YYYY-MM-DD")
                .timeFormat("24h")
                .build();

        LocalizationSettingsResponse res = generalSettingsService.updateLocalizationSettings(orgId, ownerUserId, req);

        assertNotNull(res);
        assertEquals("USD", res.getDefaultCurrency());
        assertEquals("America/New_York", res.getTimezone());
        assertEquals("YYYY-MM-DD", res.getDateFormat());
        assertEquals("24h", res.getTimeFormat());

        assertEquals("USD", org.getCurrency());
        assertEquals("America/New_York", org.getTimezone());
    }

    @Test
    @DisplayName("updateLocalizationSettings throws BadRequestException for unsupported date format")
    void updateLocalizationSettingsInvalidDateFormat() {
        RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        UpdateLocalizationSettingsRequest req = UpdateLocalizationSettingsRequest.builder()
                .defaultCurrency("INR")
                .timezone("IST")
                .dateFormat("INVALID_FORMAT")
                .timeFormat("12h")
                .build();

        assertThrows(BadRequestException.class, () ->
                generalSettingsService.updateLocalizationSettings(orgId, ownerUserId, req));
    }

    @Test
    @DisplayName("updateGeneralSettings updates combined settings atomically")
    void updateGeneralSettingsSuccess() {
        RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(organizationSettingsRepository.findByOrganization_Id(orgId)).thenReturn(Optional.empty());
        when(localizationSettingsRepository.findByOrganization_Id(orgId)).thenReturn(Optional.empty());

        when(organizationSettingsRepository.save(any(OrganizationSettings.class))).thenAnswer(inv -> inv.getArgument(0));
        when(localizationSettingsRepository.save(any(LocalizationSettings.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateGeneralSettingsRequest req = UpdateGeneralSettingsRequest.builder()
                .companyName("Acme Worldwide")
                .contactEmail("contact@acmeworld.com")
                .defaultCurrency("GBP")
                .timezone("UTC")
                .dateFormat("DD/MM/YYYY")
                .timeFormat("12h")
                .build();

        GeneralSettingsResponse res = generalSettingsService.updateGeneralSettings(orgId, ownerUserId, req);

        assertNotNull(res);
        assertEquals("Acme Worldwide", res.getCompanyName());
        assertEquals("contact@acmeworld.com", res.getContactEmail());
        assertEquals("GBP", res.getDefaultCurrency());
        assertEquals("UTC", res.getTimezone());
        assertEquals("DD/MM/YYYY", res.getDateFormat());
        assertEquals("12h", res.getTimeFormat());
    }

    @Test
    @DisplayName("assertWritePermission rejects regular members who are not OWNER or ADMIN")
    void assertWritePermissionRejectsNonAdminMember() {
        RequestContext.set(memberUserId, orgId, null, null, AccessMode.FULL);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, memberUserId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(regularMember));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                generalSettingsService.assertWritePermission(orgId, memberUserId));

        assertTrue(ex.getMessage().contains("Only organization OWNER or ADMIN"));
    }

    @Test
    @DisplayName("assertReadPermission rejects users who are not active members of the organization")
    void assertReadPermissionRejectsNonMember() {
        UUID strangerId = UUID.randomUUID();
        RequestContext.set(strangerId, orgId, null, null, AccessMode.FULL);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, strangerId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class, () ->
                generalSettingsService.assertReadPermission(orgId, strangerId));
    }
}

