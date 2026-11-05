package com.erp.auth_service.service;

import com.erp.auth_service.dto.role_template.*;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.OrganizationRoleTemplateServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationRoleTemplateServiceTest {

    @Mock
    private OrganizationRoleTemplateRepository templateRepository;

    @Mock
    private OrganizationRoleTemplatePermissionRepository templatePermissionRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RolePermissionRepository rolePermissionRepository;

    @Mock
    private FeaturePermissionRepository featurePermissionRepository;

    @Mock
    private FeatureRepository featureRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private OrganizationMemberRepository memberRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private AuthorizationService authorizationService;

    @InjectMocks
    private OrganizationRoleTemplateServiceImpl service;

    private UUID orgId;
    private UUID userId;
    private UUID companyId;
    private Organization organization;
    private OrganizationMember ownerMember;
    private User ownerUser;
    private Company company;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        userId = UUID.randomUUID();
        companyId = UUID.randomUUID();

        organization = Organization.builder()
                .id(orgId)
                .organizationCode("ACME")
                .displayName("Acme Corp")
                .legalName("Acme Corp LLC")
                .build();

        ownerUser = User.builder()
                .id(userId)
                .username("owner")
                .email("owner@acme.com")
                .build();

        ownerMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(ownerUser)
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        company = Company.builder()
                .id(companyId)
                .organization(organization)
                .companyName("Acme Operations")
                .companyCode("ACME-OPS")
                .active(true)
                .build();

        RequestContext.set(userId, orgId, companyId, UUID.randomUUID(), AccessMode.FULL);
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    private void mockActiveActor() {
        when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));
    }

    @Test
    @DisplayName("1. Auto-seeds default templates when organization has none")
    void testSeedsDefaultTemplatesWhenEmpty() {
        mockActiveActor();
        when(templateRepository.countByOrganization_Id(orgId)).thenReturn(0L);
        when(featurePermissionRepository.findByActiveTrue()).thenReturn(Collections.emptyList());
        when(templateRepository.save(any(OrganizationRoleTemplate.class))).thenAnswer(inv -> inv.getArgument(0));
        when(templateRepository.findAllWithPermissionsByOrganizationId(orgId)).thenReturn(Collections.emptyList());
        when(companyRepository.findByOrganization_Id(orgId)).thenReturn(List.of(company));

        List<OrganizationRoleTemplateDto> result = service.getTemplates(orgId);

        assertNotNull(result);
        // 9 default templates seeded
        verify(templateRepository, times(9)).save(any(OrganizationRoleTemplate.class));
    }

    @Test
    @DisplayName("2. Creates new custom role template with permission codes")
    void testCreateTemplate() {
        mockActiveActor();
        CreateRoleTemplateRequest req = CreateRoleTemplateRequest.builder()
                .name("Custom Manager")
                .description("Custom operational manager")
                .permissionCodes(List.of("INVOICE:READ", "INVOICE:CREATE"))
                .build();

        when(templateRepository.existsByOrganization_IdAndNameIgnoreCase(orgId, "Custom Manager")).thenReturn(false);

        FeaturePermission fp1 = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .permissionCode("INVOICE:READ")
                .build();
        FeaturePermission fp2 = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .permissionCode("INVOICE:CREATE")
                .build();

        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("INVOICE:READ")).thenReturn(Optional.of(fp1));
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("INVOICE:CREATE")).thenReturn(Optional.of(fp2));

        when(templateRepository.save(any(OrganizationRoleTemplate.class))).thenAnswer(inv -> {
            OrganizationRoleTemplate t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        when(companyRepository.findByOrganization_Id(orgId)).thenReturn(List.of(company));

        OrganizationRoleTemplateDto created = service.createTemplate(orgId, req);

        assertNotNull(created);
        assertEquals("Custom Manager", created.getName());
        assertEquals("Custom operational manager", created.getDescription());
        assertFalse(created.isSystem());
    }

    @Test
    @DisplayName("3. Prevents duplicate template names in same organization")
    void testPreventsDuplicateTemplateNames() {
        mockActiveActor();
        CreateRoleTemplateRequest req = CreateRoleTemplateRequest.builder()
                .name("Accountant")
                .build();

        when(templateRepository.existsByOrganization_IdAndNameIgnoreCase(orgId, "Accountant")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> service.createTemplate(orgId, req));
    }

    @Test
    @DisplayName("4. Blocks deleting system templates")
    void testBlocksDeletingSystemTemplate() {
        mockActiveActor();
        UUID templateId = UUID.randomUUID();
        OrganizationRoleTemplate systemTemplate = OrganizationRoleTemplate.builder()
                .id(templateId)
                .organization(organization)
                .name("Company Admin")
                .isSystem(true)
                .build();

        when(templateRepository.findByOrganization_IdAndId(orgId, templateId)).thenReturn(Optional.of(systemTemplate));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> service.deleteTemplate(orgId, templateId));
        assertTrue(ex.getMessage().contains("System role templates cannot be deleted"));
    }

    @Test
    @DisplayName("5. Previews differences when deploying template to companies")
    void testPreviewApply() {
        mockActiveActor();
        UUID templateId = UUID.randomUUID();

        FeaturePermission fpRead = FeaturePermission.builder().id(UUID.randomUUID()).permissionCode("PAYMENTS:READ").build();
        FeaturePermission fpWrite = FeaturePermission.builder().id(UUID.randomUUID()).permissionCode("PAYMENTS:WRITE").build();

        OrganizationRoleTemplate template = OrganizationRoleTemplate.builder()
                .id(templateId)
                .organization(organization)
                .name("Accountant")
                .build();

        OrganizationRoleTemplatePermission tp1 = OrganizationRoleTemplatePermission.builder()
                .roleTemplate(template).permission(fpRead).build();
        OrganizationRoleTemplatePermission tp2 = OrganizationRoleTemplatePermission.builder()
                .roleTemplate(template).permission(fpWrite).build();
        template.setPermissions(List.of(tp1, tp2));

        when(templateRepository.findByIdWithPermissions(orgId, templateId)).thenReturn(Optional.of(template));
        when(companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyId, orgId)).thenReturn(Optional.of(company));

        // Company has existing role with only PAYMENTS:READ
        Role existingRole = Role.builder()
                .id(UUID.randomUUID())
                .name("Accountant")
                .company(company)
                .build();

        when(roleRepository.findByCompany_IdAndNameIgnoreCase(companyId, "Accountant")).thenReturn(Optional.of(existingRole));
        when(userRoleRepository.countByRole_Id(existingRole.getId())).thenReturn(3L);

        RolePermission rpExisting = RolePermission.builder().role(existingRole).permission(fpRead).build();
        when(rolePermissionRepository.findByRole_Id(existingRole.getId())).thenReturn(List.of(rpExisting));

        ApplyTemplateRequest req = ApplyTemplateRequest.builder()
                .companyIds(List.of(companyId))
                .overwriteExisting(true)
                .build();

        TemplateApplyPreviewDto preview = service.previewApply(orgId, templateId, req);

        assertNotNull(preview);
        assertEquals(1, preview.getCompanies().size());
        CompanyTemplatePreviewItemDto item = preview.getCompanies().get(0);
        assertTrue(item.isHasRole());
        assertEquals(3, item.getExistingUserCount()); // 3 users preserved!
        assertEquals(List.of("PAYMENTS:WRITE"), item.getAddedPermissions());
        assertEquals(List.of("PAYMENTS:READ"), item.getUnchangedPermissions());
        assertTrue(item.getRemovedPermissions().isEmpty());
    }

    @Test
    @DisplayName("6. Applies template safely preserving user assignments")
    void testApplyTemplatePreservesUserRoles() {
        mockActiveActor();
        UUID templateId = UUID.randomUUID();

        FeaturePermission fp = FeaturePermission.builder().id(UUID.randomUUID()).permissionCode("PAYMENTS:READ").build();
        OrganizationRoleTemplate template = OrganizationRoleTemplate.builder()
                .id(templateId)
                .organization(organization)
                .name("Accountant")
                .description("Standard Accountant")
                .build();
        OrganizationRoleTemplatePermission tp = OrganizationRoleTemplatePermission.builder()
                .roleTemplate(template).permission(fp).build();
        template.setPermissions(List.of(tp));

        when(templateRepository.findByIdWithPermissions(orgId, templateId)).thenReturn(Optional.of(template));
        when(companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyId, orgId)).thenReturn(Optional.of(company));

        Role existingRole = Role.builder()
                .id(UUID.randomUUID())
                .name("Accountant")
                .company(company)
                .build();

        when(roleRepository.findByCompany_IdAndNameIgnoreCase(companyId, "Accountant")).thenReturn(Optional.of(existingRole));
        when(userRoleRepository.countByRole_Id(existingRole.getId())).thenReturn(4L);

        ApplyTemplateRequest req = ApplyTemplateRequest.builder()
                .companyIds(List.of(companyId))
                .overwriteExisting(true)
                .build();

        ApplyTemplateResultDto result = service.applyTemplate(orgId, templateId, req);

        assertNotNull(result);
        assertEquals(1, result.getUpdatedCount());
        assertEquals(0, result.getCreatedCount());
        assertEquals(0, result.getSkippedCount());

        // Existing users assignments preserved!
        assertEquals(4, result.getDetails().get(0).getUserAssignmentsPreserved());
        // Verify UserRole was NEVER deleted or modified
        verify(userRoleRepository, never()).delete(any());
        verify(userRoleRepository, never()).deleteAll(any());
    }

    @Test
    @DisplayName("7. Imports existing company role as a new template")
    void testImportCompanyRoleAsTemplate() {
        mockActiveActor();
        UUID roleId = UUID.randomUUID();
        Role companyRole = Role.builder()
                .id(roleId)
                .name("Procurement Specialist")
                .company(company)
                .build();

        when(companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyId, orgId)).thenReturn(Optional.of(company));
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(companyRole));
        when(templateRepository.existsByOrganization_IdAndNameIgnoreCase(orgId, "Procurement Specialist")).thenReturn(false);

        FeaturePermission fp = FeaturePermission.builder().id(UUID.randomUUID()).permissionCode("PO:CREATE").build();
        RolePermission rp = RolePermission.builder().role(companyRole).permission(fp).build();
        when(rolePermissionRepository.findByRole_Id(roleId)).thenReturn(List.of(rp));

        when(templateRepository.save(any(OrganizationRoleTemplate.class))).thenAnswer(inv -> {
            OrganizationRoleTemplate t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        when(companyRepository.findByOrganization_Id(orgId)).thenReturn(List.of(company));

        OrganizationRoleTemplateDto imported = service.importCompanyRoleAsTemplate(
                orgId, companyId, roleId, "Procurement Specialist", "Imported from Operations");

        assertNotNull(imported);
        assertEquals("Procurement Specialist", imported.getName());
        assertEquals("Imported from Operations", imported.getDescription());
        // Links role to newly created template
        verify(roleRepository).save(companyRole);
    }

    @Test
    @DisplayName("8. Rejects non-admin/non-owner members from modifying templates")
    void testRejectsUnauthorizedMember() {
        OrganizationMember regularMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(ownerUser)
                .memberType(MemberType.MEMBER) // Regular MEMBER, not OWNER or ADMIN
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(regularMember));

        CreateRoleTemplateRequest req = CreateRoleTemplateRequest.builder().name("Test").build();

        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> service.createTemplate(orgId, req));
        assertTrue(ex.getMessage().contains("Organization owner or admin permission required"));
    }
}

