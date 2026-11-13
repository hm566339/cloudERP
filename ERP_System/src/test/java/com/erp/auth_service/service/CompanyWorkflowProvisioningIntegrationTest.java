package com.erp.auth_service.service;

import com.erp.auth_service.client.WorkflowProvisioningClient;
import com.erp.auth_service.dto.request.CompanyRequest;
import com.erp.auth_service.mapper.CompanyMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.CompanyServiceImpl;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyWorkflowProvisioningIntegrationTest {

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
    @Mock private WorkflowProvisioningClient workflowProvisioningClient;

    private CompanyServiceImpl companyService;
    private UUID orgId;
    private UUID userId;
    private UUID companyId;
    private Organization organization;
    private OrganizationMember ownerMember;
    private Subscription activeSubscription;

    @BeforeEach
    void setUp() {
        RequestContext.clear();

        companyService = new CompanyServiceImpl(
                companyRepository, companyMapper, restClientBuilder, cloudinaryService,
                authorizationService, organizationRepository, subscriptionRepository,
                organizationMemberRepository, memberCompanyAccessRepository, roleRepository, userRoleRepository);

        ReflectionTestUtils.setField(companyService, "workflowProvisioningClient", workflowProvisioningClient);

        orgId = UUID.randomUUID();
        userId = UUID.randomUUID();
        companyId = UUID.randomUUID();

        organization = Organization.builder()
                .id(orgId)
                .organizationCode("ACME")
                .legalName("Acme Corp")
                .displayName("Acme Corp")
                .build();

        ownerMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        activeSubscription = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .status(SubscriptionStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .plan(SubscriptionPlan.builder().maxCompanies(10).build())
                .build();

        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    @Test
    @DisplayName("Creating a company triggers workflow provisioning with resolved roles")
    void testCreateCompany_TriggersWorkflowProvisioning() {
        CompanyRequest request = new CompanyRequest();
        request.setCompanyName("Acme Branch 1");
        request.setCompanyCode("ACME-01");

        Company company = Company.builder()
                .id(companyId)
                .companyName("Acme Branch 1")
                .companyCode("ACME-01")
                .organization(organization)
                .active(true)
                .build();

        UUID accountantRoleId = UUID.randomUUID();
        Role accountantRole = Role.builder()
                .id(accountantRoleId)
                .name("ACCOUNTANT")
                .company(company)
                .build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, userId))
                .thenReturn(Optional.of(ownerMember));
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId))
                .thenReturn(Optional.of(activeSubscription));
        when(companyRepository.countByOrganization_IdAndActiveTrue(orgId)).thenReturn(1L);
        when(companyRepository.existsByCompanyName("Acme Branch 1")).thenReturn(false);
        when(companyRepository.existsByCompanyCode("ACME-01")).thenReturn(false);
        when(companyMapper.toCompany(request)).thenReturn(company);
        when(companyRepository.save(any(Company.class))).thenReturn(company);
        when(memberCompanyAccessRepository.findActiveCompany(any(), eq(orgId), eq(companyId)))
                .thenReturn(Optional.empty());

        when(roleRepository.findByCompany_Id(companyId)).thenReturn(List.of(accountantRole));
        when(workflowProvisioningClient.provisionCompanyWorkflow(eq(orgId), eq(companyId), any(), any()))
                .thenReturn(true);

        Map<String, String> response = companyService.createCompany(request, null, "Bearer test-token");

        assertNotNull(response);
        assertEquals("Company created successfully", response.get("message"));

        verify(workflowProvisioningClient).provisionCompanyWorkflow(
                eq(orgId), eq(companyId), argThat(map -> map.containsKey("ACCOUNTANT")), eq("Bearer test-token"));
    }

    @Test
    @DisplayName("Workflow provisioning failure does not block company creation (non-blocking fallback)")
    void testCreateCompany_WorkflowFailureNonBlocking() {
        CompanyRequest request = new CompanyRequest();
        request.setCompanyName("Acme Branch 2");
        request.setCompanyCode("ACME-02");

        Company company = Company.builder()
                .id(companyId)
                .companyName("Acme Branch 2")
                .companyCode("ACME-02")
                .organization(organization)
                .active(true)
                .build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, userId))
                .thenReturn(Optional.of(ownerMember));
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgId))
                .thenReturn(Optional.of(activeSubscription));
        when(companyRepository.countByOrganization_IdAndActiveTrue(orgId)).thenReturn(1L);
        when(companyRepository.existsByCompanyName("Acme Branch 2")).thenReturn(false);
        when(companyRepository.existsByCompanyCode("ACME-02")).thenReturn(false);
        when(companyMapper.toCompany(request)).thenReturn(company);
        when(companyRepository.save(any(Company.class))).thenReturn(company);
        when(memberCompanyAccessRepository.findActiveCompany(any(), eq(orgId), eq(companyId)))
                .thenReturn(Optional.empty());

        when(roleRepository.findByCompany_Id(companyId)).thenReturn(Collections.emptyList());
        when(workflowProvisioningClient.provisionCompanyWorkflow(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("workflow-service network timeout"));

        // Must still succeed despite workflow-service exception
        Map<String, String> response = companyService.createCompany(request, null, null);

        assertNotNull(response);
        assertEquals("Company created successfully", response.get("message"));
    }
}
