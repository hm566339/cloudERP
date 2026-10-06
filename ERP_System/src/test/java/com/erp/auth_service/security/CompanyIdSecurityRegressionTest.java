package com.erp.auth_service.security;

import com.erp.auth_service.dto.request.CompanyModuleRequest;
import com.erp.auth_service.dto.request.CompanyRequest;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.mapper.CompanyMapper;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.service.CloudinaryService;
import com.erp.auth_service.service.PermissionService;
import com.erp.auth_service.service.impl.CompanyModuleServiceImpl;
import com.erp.auth_service.service.impl.CompanyServiceImpl;
import com.erp.auth_service.service.impl.UserServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyIdSecurityRegressionTest {

    @Mock private CompanyRepository companyRepository;
    @Mock private CompanyMapper companyMapper;
    @Mock private RestClient.Builder restClientBuilder;
    @Mock private CloudinaryService cloudinaryService;
    @Mock private AuthorizationService authorizationService;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private OrganizationMemberRepository organizationMemberRepository;
    @Mock private MemberCompanyAccessRepository memberCompanyAccessRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserRoleRepository userRoleRepository;

    @Mock private CompanyModuleRepository companyModuleRepository;
    @Mock private ModuleRepository moduleRepository;
    @Mock private SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;

    @Mock private UserRepository userRepository;
    @Mock private UserMapper userMapper;
    @Mock private PermissionService permissionService;

    private CompanyServiceImpl companyService;
    private CompanyModuleServiceImpl companyModuleService;
    private UserServiceImpl userService;

    private UUID orgAId;
    private UUID orgBId;
    private UUID companyA1Id;
    private UUID companyA2Id;
    private UUID companyB1Id;

    private Organization orgA;
    private Organization orgB;
    private Company companyA1;
    private Company companyA2;
    private Company companyB1;

    @BeforeEach
    void setUp() {
        companyService = new CompanyServiceImpl(
                companyRepository, companyMapper, restClientBuilder, cloudinaryService,
                authorizationService, organizationRepository, subscriptionRepository,
                organizationMemberRepository, memberCompanyAccessRepository, roleRepository, userRoleRepository);

        companyModuleService = new CompanyModuleServiceImpl(
                companyModuleRepository, companyRepository, moduleRepository,
                subscriptionRepository, subscriptionPlanModuleRepository,
                organizationMemberRepository, authorizationService);

        userService = new UserServiceImpl(
                userRepository, userMapper, null, null, null, null,
                null, companyRepository, moduleRepository, null,
                null, null, null, null, null, null, permissionService);

        orgAId = UUID.randomUUID();
        orgBId = UUID.randomUUID();
        companyA1Id = UUID.randomUUID();
        companyA2Id = UUID.randomUUID();
        companyB1Id = UUID.randomUUID();

        orgA = Organization.builder().id(orgAId).organizationCode("ORG_A").accessMode(AccessMode.FULL).build();
        orgB = Organization.builder().id(orgBId).organizationCode("ORG_B").accessMode(AccessMode.FULL).build();

        companyA1 = Company.builder().id(companyA1Id).companyCode("COMP_A1").organization(orgA).active(true).build();
        companyA2 = Company.builder().id(companyA2Id).companyCode("COMP_A2").organization(orgA).active(true).build();
        companyB1 = Company.builder().id(companyB1Id).companyCode("COMP_B1").organization(orgB).active(true).build();
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    @Test
    @DisplayName("CompanyService.getCompanyById: Cross-organization access is rejected with ForbiddenException")
    void getCompanyById_CrossOrganization_Rejected() {
        RequestContext.set(UUID.randomUUID(), orgAId, companyA1Id, null, AccessMode.FULL);
        when(companyRepository.findById(companyB1Id)).thenReturn(Optional.of(companyB1));

        assertThrows(ForbiddenException.class, () -> companyService.getCompanyById(companyB1Id));
    }

    @Test
    @DisplayName("CompanyService.getCompanyById: Scoped support session targeting another company in same org is rejected")
    void getCompanyById_CrossCompany_SameOrg_RejectedInScopedSession() {
        // Scoped session for companyA1
        RequestContext.set(UUID.randomUUID(), orgAId, companyA1Id, null, AccessMode.FULL);
        when(companyRepository.findById(companyA2Id)).thenReturn(Optional.of(companyA2));

        assertThrows(ForbiddenException.class, () -> companyService.getCompanyById(companyA2Id));
    }

    @Test
    @DisplayName("CompanyService.updateCompany: Cross-organization mutation is rejected with ForbiddenException")
    void updateCompany_CrossOrganization_Rejected() {
        RequestContext.set(UUID.randomUUID(), orgAId, companyA1Id, null, AccessMode.FULL);
        when(companyRepository.findById(companyB1Id)).thenReturn(Optional.of(companyB1));

        assertThrows(ForbiddenException.class, () ->
                companyService.updateCompany(companyB1Id, new CompanyRequest(), null));
    }

    @Test
    @DisplayName("CompanyService.deleteCompany: Cross-organization deletion is rejected with ForbiddenException")
    void deleteCompany_CrossOrganization_Rejected() {
        RequestContext.set(UUID.randomUUID(), orgAId, companyA1Id, null, AccessMode.FULL);
        when(companyRepository.findById(companyB1Id)).thenReturn(Optional.of(companyB1));

        assertThrows(ForbiddenException.class, () -> companyService.deleteCompany(companyB1Id));
    }

    @Test
    @DisplayName("CompanyService.changeStatus: Cross-organization status change is rejected with ForbiddenException")
    void changeStatus_CrossOrganization_Rejected() {
        RequestContext.set(UUID.randomUUID(), orgAId, companyA1Id, null, AccessMode.FULL);
        when(companyRepository.findById(companyB1Id)).thenReturn(Optional.of(companyB1));

        assertThrows(ForbiddenException.class, () -> companyService.changeStatus(companyB1Id, false));
    }

    @Test
    @DisplayName("CompanyModuleService.getCompanyModulesByCompany: Cross-organization query is rejected")
    void companyModule_CrossOrganization_Rejected() {
        RequestContext.set(UUID.randomUUID(), orgAId, companyA1Id, null, AccessMode.FULL);
        when(companyRepository.findById(companyB1Id)).thenReturn(Optional.of(companyB1));

        assertThrows(ForbiddenException.class, () ->
                companyModuleService.getCompanyModulesByCompany(companyB1Id, null));
    }

    @Test
    @DisplayName("CompanyModuleService.createCompanyModule: Cross-organization creation is rejected")
    void createCompanyModule_CrossOrganization_Rejected() {
        RequestContext.set(UUID.randomUUID(), orgAId, companyA1Id, null, AccessMode.FULL);
        when(companyRepository.findById(companyB1Id)).thenReturn(Optional.of(companyB1));

        CompanyModuleRequest req = new CompanyModuleRequest(companyB1Id, UUID.randomUUID());

        assertThrows(ForbiddenException.class, () -> companyModuleService.createCompanyModule(req));
    }

    @Test
    @DisplayName("UserService.getUserDetails: Cross-organization user lookup is rejected with ForbiddenException")
    void userDetails_CrossOrganization_Rejected() {
        RequestContext.set(UUID.randomUUID(), orgAId, companyA1Id, null, AccessMode.FULL);
        UUID victimId = UUID.randomUUID();
        User victim = User.builder().id(victimId).company(companyB1).build();
        when(userRepository.findById(victimId)).thenReturn(Optional.of(victim));

        assertThrows(ForbiddenException.class, () -> userService.getUserDetails(victimId));
    }

    @Test
    @DisplayName("UserService.getAllUsers: Cross-organization company users query is rejected with ForbiddenException")
    void getAllUsers_CrossOrganization_Rejected() {
        RequestContext.set(UUID.randomUUID(), orgAId, companyA1Id, null, AccessMode.FULL);
        when(companyRepository.findById(companyB1Id)).thenReturn(Optional.of(companyB1));

        assertThrows(ForbiddenException.class, () ->
                userService.getAllUsers(1, 10, null, null, null, companyB1Id));
    }
}
