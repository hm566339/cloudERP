package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.CompanyModuleRequest;
import com.erp.auth_service.dto.request.CompanyRequest;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.mapper.CompanyMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.CompanyModuleServiceImpl;
import com.erp.auth_service.service.impl.CompanyServiceImpl;
import com.erp.auth_service.service.impl.OrganizationAdministrationServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubscriptionPlanLimitsAndCompanyManagementTest {

        @Mock
        private CompanyRepository companyRepository;
        @Mock
        private CompanyMapper companyMapper;
        @Mock
        private RestClient.Builder restClientBuilder;
        @Mock
        private CloudinaryService cloudinaryService;
        @Mock
        private AuthorizationService authorizationService;
        @Mock
        private OrganizationRepository organizationRepository;
        @Mock
        private SubscriptionRepository subscriptionRepository;
        @Mock
        private OrganizationMemberRepository organizationMemberRepository;
        @Mock
        private MemberCompanyAccessRepository memberCompanyAccessRepository;
        @Mock
        private RoleRepository roleRepository;
        @Mock
        private UserRoleRepository userRoleRepository;

        @Mock
        private CompanyModuleRepository companyModuleRepository;
        @Mock
        private ModuleRepository moduleRepository;
        @Mock
        private SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;

        private CompanyServiceImpl companyService;
        private CompanyModuleServiceImpl companyModuleService;
        private OrganizationAdministrationServiceImpl organizationAdministrationService;

        private UUID orgId;
        private UUID ownerUserId;
        private UUID memberUserId;
        private UUID otherOrgId;

        private Organization organization;
        private Organization otherOrganization;
        private OrganizationMember ownerMember;
        private OrganizationMember regularMember;

        private SubscriptionPlan planWith4CompaniesAnd10Users;
        private Subscription activeSubscription;

        @BeforeEach
        void setUp() {
                companyService = new CompanyServiceImpl(
                                companyRepository, companyMapper, restClientBuilder, cloudinaryService,
                                authorizationService, organizationRepository, subscriptionRepository,
                                organizationMemberRepository, memberCompanyAccessRepository, roleRepository,
                                userRoleRepository);

                companyModuleService = new CompanyModuleServiceImpl(
                                companyModuleRepository, companyRepository, moduleRepository,
                                subscriptionRepository, subscriptionPlanModuleRepository,
                                organizationMemberRepository, authorizationService);

                organizationAdministrationService = new OrganizationAdministrationServiceImpl(
                                organizationMemberRepository, memberCompanyAccessRepository,
                                companyRepository, authorizationService, subscriptionRepository);

                orgId = UUID.randomUUID();
                ownerUserId = UUID.randomUUID();
                memberUserId = UUID.randomUUID();
                otherOrgId = UUID.randomUUID();

                organization = Organization.builder()
                                .id(orgId)
                                .organizationCode("ORG_TEST")
                                .displayName("Test Organization")
                                .accessMode(AccessMode.FULL)
                                .build();

                otherOrganization = Organization.builder()
                                .id(otherOrgId)
                                .organizationCode("ORG_OTHER")
                                .displayName("Other Organization")
                                .accessMode(AccessMode.FULL)
                                .build();

                ownerMember = OrganizationMember.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .user(User.builder().id(ownerUserId).email("owner@test.com").build())
                                .memberType(MemberType.OWNER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();

                regularMember = OrganizationMember.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .user(User.builder().id(memberUserId).email("member@test.com").build())
                                .memberType(MemberType.MEMBER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();

                planWith4CompaniesAnd10Users = SubscriptionPlan.builder()
                                .id(UUID.randomUUID())
                                .code("30_DAY_FREE_TRIAL")
                                .name("30 Day Free Trial")
                                .durationDays(30)
                                .maxCompanies(4)
                                .maxUsersPerCompany(10)
                                .active(true)
                                .build();

                activeSubscription = Subscription.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .plan(planWith4CompaniesAnd10Users)
                                .status(SubscriptionStatus.TRIALING)
                                .accessMode(AccessMode.FULL)
                                .build();
        }

        @AfterEach
        void tearDown() {
                RequestContext.clear();
        }

        // ==========================================
        // 1. PLAN LIMITS: maxCompanies = 4
        // ==========================================

        @Test
        @DisplayName("Company creation allowed when company count is below maxCompanies (count = 3 < 4)")
        void createCompany_AllowedWhenBelowLimit() {
                RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

                when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, ownerUserId))
                                .thenReturn(Optional.of(ownerMember));
                when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
                when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId))
                                .thenReturn(Optional.of(activeSubscription));
                when(companyRepository.countByOrganization_IdAndActiveTrue(orgId)).thenReturn(3L);

                CompanyRequest request = new CompanyRequest();
                request.setCompanyName("Company 4");
                request.setCompanyCode("000004");

                Company mappedCompany = Company.builder().companyName("Company 4").companyCode("000004").build();
                when(companyMapper.toCompany(request)).thenReturn(mappedCompany);
                when(companyRepository.save(any(Company.class))).thenReturn(mappedCompany);

                var result = companyService.createCompany(request, null, null);

                assertNotNull(result);
                assertEquals("000004", result.get("companyCode"));
                verify(companyRepository).save(any(Company.class));
        }

        @Test
        @DisplayName("Company creation denied when company count reaches maxCompanies (count = 4 >= 4)")
        void createCompany_DeniedWhenLimitReached() {
                RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

                when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, ownerUserId))
                                .thenReturn(Optional.of(ownerMember));
                when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
                when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId))
                                .thenReturn(Optional.of(activeSubscription));
                when(companyRepository.countByOrganization_IdAndActiveTrue(orgId)).thenReturn(4L);

                CompanyRequest request = new CompanyRequest();
                request.setCompanyName("Company 5");
                request.setCompanyCode("000005");

                BadRequestException ex = assertThrows(BadRequestException.class,
                                () -> companyService.createCompany(request, null, null));

                assertTrue(ex.getMessage().contains("Company limit for current plan has been reached"));
                verify(companyRepository, never()).save(any(Company.class));
        }

        @Test
        @DisplayName("Company creation allowed when plan has unlimited companies (maxCompanies = null)")
        void createCompany_AllowedWhenUnlimitedPlan() {
                RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

                SubscriptionPlan unlimitedPlan = SubscriptionPlan.builder()
                                .id(UUID.randomUUID())
                                .code("UNLIMITED_EDUCATION")
                                .name("Unlimited education")
                                .maxCompanies(null)
                                .maxUsersPerCompany(null)
                                .active(true)
                                .build();

                Subscription unlimitedSub = Subscription.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .plan(unlimitedPlan)
                                .status(SubscriptionStatus.ACTIVE)
                                .accessMode(AccessMode.FULL)
                                .build();

                when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, ownerUserId))
                                .thenReturn(Optional.of(ownerMember));
                when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
                when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId))
                                .thenReturn(Optional.of(unlimitedSub));
                lenient().when(companyRepository.countByOrganization_IdAndActiveTrue(orgId)).thenReturn(50L);

                CompanyRequest request = new CompanyRequest();
                request.setCompanyName("Company 51");
                request.setCompanyCode("000051");

                Company mappedCompany = Company.builder().companyName("Company 51").companyCode("000051").build();
                when(companyMapper.toCompany(request)).thenReturn(mappedCompany);
                when(companyRepository.save(any(Company.class))).thenReturn(mappedCompany);

                var result = companyService.createCompany(request, null, null);

                assertNotNull(result);
                assertEquals("000051", result.get("companyCode"));
                verify(companyRepository).save(any(Company.class));
        }

        // ==========================================
        // 2. USER LIMITS: maxUsersPerCompany = 10
        // ==========================================

        @Test
        @DisplayName("Granting company access allowed when active user count is below maxUsersPerCompany (9 < 10)")
        void grantCompanyAccess_AllowedWhenBelowLimit() {
                RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

                UUID companyId = UUID.randomUUID();
                Company company = Company.builder().id(companyId).organization(organization).active(true).build();

                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId,
                                MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(ownerMember));
                when(organizationMemberRepository.findById(regularMember.getId()))
                                .thenReturn(Optional.of(regularMember));
                when(companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyId, orgId))
                                .thenReturn(Optional.of(company));
                when(memberCompanyAccessRepository.findActiveCompany(regularMember.getId(), orgId, companyId))
                                .thenReturn(Optional.empty());
                when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId))
                                .thenReturn(Optional.of(activeSubscription));
                when(memberCompanyAccessRepository.countByCompany_IdAndActiveTrue(companyId))
                                .thenReturn(9L);

                assertDoesNotThrow(() -> organizationAdministrationService.grantCompanyAccess(regularMember.getId(),
                                companyId));

                verify(memberCompanyAccessRepository).save(any(MemberCompanyAccess.class));
        }

        @Test
        @DisplayName("Granting company access denied when active user count reaches maxUsersPerCompany (10 >= 10)")
        void grantCompanyAccess_DeniedWhenLimitReached() {
                RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

                UUID companyId = UUID.randomUUID();
                Company company = Company.builder().id(companyId).organization(organization).active(true).build();

                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId,
                                MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(ownerMember));
                when(organizationMemberRepository.findById(regularMember.getId()))
                                .thenReturn(Optional.of(regularMember));
                when(companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyId, orgId))
                                .thenReturn(Optional.of(company));
                when(memberCompanyAccessRepository.findActiveCompany(regularMember.getId(), orgId, companyId))
                                .thenReturn(Optional.empty());
                when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId))
                                .thenReturn(Optional.of(activeSubscription));
                when(memberCompanyAccessRepository.countByCompany_IdAndActiveTrue(companyId))
                                .thenReturn(10L);

                BadRequestException ex = assertThrows(BadRequestException.class, () -> organizationAdministrationService
                                .grantCompanyAccess(regularMember.getId(), companyId));

                assertTrue(ex.getMessage().contains("Maximum users limit per company (10) reached"));
                verify(memberCompanyAccessRepository, never()).save(any(MemberCompanyAccess.class));
        }

        // ==========================================
        // 3. OWNER AUTHORIZATION
        // ==========================================

        @Test
        @DisplayName("Owner can create company, but non-owner member is denied with ForbiddenException")
        void nonOwner_CannotCreateCompany() {
                RequestContext.set(memberUserId, orgId, null, null, AccessMode.FULL);

                when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, memberUserId))
                                .thenReturn(Optional.of(regularMember));

                CompanyRequest request = new CompanyRequest();
                request.setCompanyName("Unauthorized Company");

                ForbiddenException ex = assertThrows(ForbiddenException.class,
                                () -> companyService.createCompany(request, null, null));

                assertTrue(ex.getMessage().contains("Only organization owners or admins can perform this operation"));
                verify(companyRepository, never()).save(any(Company.class));
        }

        @Test
        @DisplayName("Owner can update company in their organization")
        void owner_CanUpdateCompany() {
                UUID companyId = UUID.randomUUID();
                RequestContext.set(ownerUserId, orgId, companyId, null, AccessMode.FULL);

                Company company = Company.builder().id(companyId).organization(organization).companyName("Old Name")
                                .active(true).build();
                when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
                when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, ownerUserId))
                                .thenReturn(Optional.of(ownerMember));

                CompanyRequest updateRequest = new CompanyRequest();
                updateRequest.setCompanyName("New Name");

                var response = companyService.updateCompany(companyId, updateRequest, null);

                assertNotNull(response);
                assertEquals("Company updated successfully", response.get("message"));
                verify(companyRepository).save(company);
        }

        // ==========================================
        // 4. COMPANY ISOLATION (NO IDOR)
        // ==========================================

        @Test
        @DisplayName("Owner of Organization A cannot update company belonging to Organization B")
        void crossOrganization_CompanyUpdate_Denied() {
                UUID companyBId = UUID.randomUUID();
                RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

                Company companyB = Company.builder().id(companyBId).organization(otherOrganization).active(true)
                                .build();
                when(companyRepository.findById(companyBId)).thenReturn(Optional.of(companyB));

                ForbiddenException ex = assertThrows(ForbiddenException.class,
                                () -> companyService.updateCompany(companyBId, new CompanyRequest(), null));

                assertTrue(ex.getMessage().contains("Company does not belong to authorized organization"));
                verify(companyRepository, never()).save(companyB);
        }

        // ==========================================
        // 5. MODULE ENTITLEMENT (PLAN -> ORG -> COMPANY)
        // ==========================================

        @Test
        @DisplayName("Module assignment allowed when module is included in active subscription plan")
        void assignModule_AllowedWhenEntitledInPlan() {
                RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

                UUID companyId = UUID.randomUUID();
                Company company = Company.builder().id(companyId).organization(organization).active(true).build();

                UUID workflowModuleId = UUID.randomUUID();
                Module workflowModule = Module.builder().id(workflowModuleId).name("WORKFLOW").moduleStatus(true)
                                .build();

                when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
                when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, ownerUserId))
                                .thenReturn(Optional.of(ownerMember));
                when(moduleRepository.findById(workflowModuleId)).thenReturn(Optional.of(workflowModule));
                when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId))
                                .thenReturn(Optional.of(activeSubscription));
                when(subscriptionPlanModuleRepository.existsByPlan_IdAndModule_IdAndActiveTrue(
                                planWith4CompaniesAnd10Users.getId(), workflowModuleId))
                                .thenReturn(true);
                when(companyModuleRepository.findByCompany_IdAndModule_Id(companyId, workflowModuleId))
                                .thenReturn(Optional.empty());

                CompanyModuleRequest request = new CompanyModuleRequest(companyId, workflowModuleId);
                var response = companyModuleService.createCompanyModule(request);

                assertNotNull(response);
                assertEquals("Company Module created successfully", response.get("message"));
                verify(companyModuleRepository).save(any(CompanyModule.class));
        }

        @Test
        @DisplayName("Module assignment denied when module is NOT included in active subscription plan")
        void assignModule_DeniedWhenNotEntitledInPlan() {
                RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

                UUID companyId = UUID.randomUUID();
                Company company = Company.builder().id(companyId).organization(organization).active(true).build();

                UUID analyticsModuleId = UUID.randomUUID();
                Module analyticsModule = Module.builder().id(analyticsModuleId).name("ANALYTICS").moduleStatus(true)
                                .build();

                when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
                when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, ownerUserId))
                                .thenReturn(Optional.of(ownerMember));
                when(moduleRepository.findById(analyticsModuleId)).thenReturn(Optional.of(analyticsModule));
                when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId))
                                .thenReturn(Optional.of(activeSubscription));
                when(subscriptionPlanModuleRepository.existsByPlan_IdAndModule_IdAndActiveTrue(
                                planWith4CompaniesAnd10Users.getId(), analyticsModuleId))
                                .thenReturn(false);

                CompanyModuleRequest request = new CompanyModuleRequest(companyId, analyticsModuleId);
                ForbiddenException ex = assertThrows(ForbiddenException.class,
                                () -> companyModuleService.createCompanyModule(request));

                assertTrue(ex.getMessage().contains("Module is not included in the organization's subscription plan"));
                verify(companyModuleRepository, never()).save(any(CompanyModule.class));
        }

        // ==========================================
        // 6. MODULE REMOVAL (NON-DESTRUCTIVE)
        // ==========================================

        @Test
        @DisplayName("Module removal soft-disables the company module without deleting the row or business data")
        void deleteCompanyModule_SoftDisablesModule() {
                UUID companyId = UUID.randomUUID();
                RequestContext.set(ownerUserId, orgId, companyId, null, AccessMode.FULL);

                Company company = Company.builder().id(companyId).organization(organization).active(true).build();
                Module module = Module.builder().id(UUID.randomUUID()).name("CRM").moduleStatus(true).build();
                UUID companyModuleId = UUID.randomUUID();
                CompanyModule companyModule = CompanyModule.builder()
                                .id(companyModuleId)
                                .company(company)
                                .module(module)
                                .active(true)
                                .build();

                when(companyModuleRepository.findById(companyModuleId)).thenReturn(Optional.of(companyModule));
                when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, ownerUserId))
                                .thenReturn(Optional.of(ownerMember));

                companyModuleService.deleteCompanyModule(companyModuleId);

                assertFalse(companyModule.getActive());
                verify(companyModuleRepository).save(companyModule);
                verify(companyModuleRepository, never()).delete(any(CompanyModule.class));
        }

        // ==========================================
        // 7. PLAN UPGRADE: maxCompanies 4 -> 10
        // ==========================================

        @Test
        @DisplayName("Plan upgrade from 4 to 10 companies permits creating a 5th company dynamically")
        void planUpgrade_AllowsCreatingMoreCompanies() {
                RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

                SubscriptionPlan upgradedPlan = SubscriptionPlan.builder()
                                .id(UUID.randomUUID())
                                .code("PRO")
                                .name("Pro Plan")
                                .maxCompanies(10)
                                .maxUsersPerCompany(25)
                                .active(true)
                                .build();

                Subscription upgradedSubscription = Subscription.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .plan(upgradedPlan)
                                .status(SubscriptionStatus.ACTIVE)
                                .accessMode(AccessMode.FULL)
                                .build();

                when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, ownerUserId))
                                .thenReturn(Optional.of(ownerMember));
                when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
                when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId))
                                .thenReturn(Optional.of(upgradedSubscription));
                // Org already has 4 companies:
                when(companyRepository.countByOrganization_IdAndActiveTrue(orgId)).thenReturn(4L);

                CompanyRequest request = new CompanyRequest();
                request.setCompanyName("Company 5 (Pro)");
                request.setCompanyCode("000005");

                Company mappedCompany = Company.builder().companyName("Company 5 (Pro)").companyCode("000005").build();
                when(companyMapper.toCompany(request)).thenReturn(mappedCompany);
                when(companyRepository.save(any(Company.class))).thenReturn(mappedCompany);

                var response = companyService.createCompany(request, null, null);

                assertNotNull(response);
                assertEquals("000005", response.get("companyCode"));
                verify(companyRepository).save(any(Company.class));
        }

        // ==========================================
        // 8. PLAN DOWNGRADE: maxCompanies 10 -> 4
        // ==========================================

        @Test
        @DisplayName("Plan downgrade from 10 to 4 blocks new creation when current count is 7, without deleting existing companies")
        void planDowngrade_BlocksNewCreationSafelyWithoutDeleting() {
                RequestContext.set(ownerUserId, orgId, null, null, AccessMode.FULL);

                SubscriptionPlan downgradedPlan = SubscriptionPlan.builder()
                                .id(UUID.randomUUID())
                                .code("BASIC")
                                .name("Basic Plan")
                                .maxCompanies(4)
                                .maxUsersPerCompany(5)
                                .active(true)
                                .build();

                Subscription downgradedSubscription = Subscription.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .plan(downgradedPlan)
                                .status(SubscriptionStatus.ACTIVE)
                                .accessMode(AccessMode.FULL)
                                .build();

                when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, ownerUserId))
                                .thenReturn(Optional.of(ownerMember));
                when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
                when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId))
                                .thenReturn(Optional.of(downgradedSubscription));
                // Org currently has 7 companies from previous plan:
                when(companyRepository.countByOrganization_IdAndActiveTrue(orgId)).thenReturn(7L);

                CompanyRequest request = new CompanyRequest();
                request.setCompanyName("Company 8");

                BadRequestException ex = assertThrows(BadRequestException.class,
                                () -> companyService.createCompany(request, null, null));

                assertTrue(ex.getMessage().contains("Company limit for current plan has been reached (7/4)"));
                verify(companyRepository, never()).delete(any(Company.class));
                verify(companyRepository, never()).save(any(Company.class));
        }
}
