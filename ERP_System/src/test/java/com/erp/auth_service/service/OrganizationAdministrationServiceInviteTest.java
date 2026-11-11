package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.InviteMemberRequest;
import com.erp.auth_service.dto.response.InviteMemberResponse;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.OrganizationAdministrationServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Robust unit tests for OrganizationAdministrationServiceImpl.inviteMember
 * using lightweight dynamic proxy test stubs (zero bytecode-agent or named pipe dependencies).
 */
class OrganizationAdministrationServiceInviteTest {

    private OrganizationAdministrationServiceImpl service;

    private Organization organization;
    private Organization otherOrg;
    private OrganizationMember owner;
    private Company companyA;
    private Company companyOther;
    private UUID orgId;
    private UUID ownerUserId;

    // Test state variables controlled per test
    private List<OrganizationMember> existingOrgMembers;
    private List<User> existingGlobalUsers;
    private OrganizationMember existingMemberByUserId;
    private User savedUser;
    private OrganizationMember savedMember;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        ownerUserId = UUID.randomUUID();

        organization = Organization.builder()
                .id(orgId)
                .displayName("Acme Corp")
                .legalName("Acme Corp Pvt Ltd")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        otherOrg = Organization.builder()
                .id(UUID.randomUUID())
                .displayName("Other Org")
                .legalName("Other Org Ltd")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        owner = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(User.builder().id(ownerUserId).email("owner@acme.com").username("owner").build())
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        companyA = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("ACME-A")
                .companyName("Acme Alpha")
                .organization(organization)
                .active(true)
                .build();

        companyOther = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("OTHER-1")
                .companyName("Other Co")
                .organization(otherOrg)
                .active(true)
                .build();

        RequestContext.set(ownerUserId, orgId, companyA.getId(), null, AccessMode.FULL);

        existingOrgMembers = new ArrayList<>();
        existingGlobalUsers = new ArrayList<>();
        existingMemberByUserId = null;
        savedUser = null;
        savedMember = null;

        OrganizationMemberRepository memberRepo = createStub(OrganizationMemberRepository.class, Map.of(
                "findByOrganization_IdAndUser_IdAndMembershipStatus", args -> Optional.of(owner),
                "findByOrganization_Id", args -> existingOrgMembers,
                "findByOrganization_IdAndUser_Id", args -> Optional.ofNullable(existingMemberByUserId),
                "save", args -> {
                    OrganizationMember m = (OrganizationMember) args[0];
                    if (m.getId() == null) m.setId(UUID.randomUUID());
                    savedMember = m;
                    return m;
                }
        ));

        CompanyRepository companyRepo = createStub(CompanyRepository.class, Map.of(
                "findByOrganization_IdAndActiveTrue", args -> List.of(companyA),
                "findByIdAndOrganization_IdAndActiveTrue", args -> Optional.of(companyA)
        ));

        UserRepository userRepo = createStub(UserRepository.class, Map.of(
                "findAllByEmailIgnoreCase", args -> existingGlobalUsers,
                "existsByUsernameIgnoreCase", args -> false,
                "save", args -> {
                    User u = (User) args[0];
                    if (u.getId() == null) u.setId(UUID.randomUUID());
                    savedUser = u;
                    return u;
                }
        ));

        OrganizationRepository orgRepo = createStub(OrganizationRepository.class, Map.of(
                "findById", args -> Optional.of(organization)
        ));

        SubscriptionRepository subRepo = createStub(SubscriptionRepository.class, Map.of(
                "findTopByOrganization_IdOrderByCreatedAtDesc", args -> Optional.empty()
        ));

        MemberCompanyAccessRepository accessRepo = createStub(MemberCompanyAccessRepository.class, Map.of());
        AuthorizationService authService = new AuthorizationService();

        PasswordEncoder passwordEncoder = new PasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                return "encoded_" + rawPassword;
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                return true;
            }
        };

        service = new OrganizationAdministrationServiceImpl(
                memberRepo, accessRepo, companyRepo, authService, subRepo);

        com.erp.auth_service.mail.CommunicationServiceClient commClient = new com.erp.auth_service.mail.CommunicationServiceClient(null) {
            @Override
            public boolean isEnabled() {
                return true;
            }

            @Override
            public boolean sendOrganizationUserInvitationEmail(
                    UUID organizationId, UUID companyId, String to, String fullName,
                    String organizationName, String username, String activationLink,
                    int validityHours, String idempotencyKey) {
                return true;
            }

            @Override
            public com.erp.auth_service.mail.CommunicationServiceClient.DeliveryResult sendOrganizationUserInvitationEmailDetailed(
                    UUID organizationId, UUID companyId, String to, String fullName,
                    String organizationName, String username, String activationLink,
                    int validityHours, String idempotencyKey) {
                return com.erp.auth_service.mail.CommunicationServiceClient.DeliveryResult.builder()
                        .success(true)
                        .status("ACCEPTED_BY_PROVIDER")
                        .providerMessageId("msg-mock-123")
                        .build();
            }
        };

        ReflectionTestUtils.setField(service, "organizationRepository", orgRepo);
        ReflectionTestUtils.setField(service, "userRepository", userRepo);
        ReflectionTestUtils.setField(service, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(service, "communicationServiceClient", commClient);
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    @Test
    @DisplayName("inviteMember creates a brand new user when no existing user has the email")
    void inviteMemberNewUserCreated() {
        String email = "brandnew@example.com";
        InviteMemberRequest request = InviteMemberRequest.builder()
                .email(email)
                .fullName("Brand New")
                .memberType(MemberType.MEMBER)
                .build();

        InviteMemberResponse response = service.inviteMember(orgId, request);

        assertNotNull(response);
        assertEquals(email, response.getEmail());
        assertEquals(MembershipStatus.INVITED, response.getMembershipStatus());
        assertEquals(MemberType.MEMBER, response.getMemberType());
        assertNotNull(savedUser);
        assertNotNull(savedMember);
        assertEquals(email, savedUser.getEmail());
    }

    @Test
    @DisplayName("inviteMember reuses single existing user account without duplicate creation")
    void inviteMemberSingleExistingUserReused() {
        String email = "singleuser@example.com";
        User existingUser = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .username("singleuser")
                .fullName("Existing Single")
                .company(companyA)
                .build();

        existingGlobalUsers.add(existingUser);

        InviteMemberRequest request = InviteMemberRequest.builder()
                .email(email)
                .memberType(MemberType.ADMIN)
                .build();

        InviteMemberResponse response = service.inviteMember(orgId, request);

        assertNotNull(response);
        assertEquals(email, response.getEmail());
        assertEquals(existingUser.getId(), response.getUserId());
        assertEquals(MemberType.ADMIN, response.getMemberType());
        assertEquals(MembershipStatus.INVITED, response.getMembershipStatus());
    }

    @Test
    @DisplayName("inviteMember throws DuplicateResourceException (409) when email is already active member")
    void inviteMemberDuplicateActiveThrows409() {
        String email = "activemember@example.com";
        User existingUser = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .build();

        OrganizationMember existingMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(existingUser)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        existingOrgMembers.add(existingMember);

        InviteMemberRequest request = InviteMemberRequest.builder()
                .email(email)
                .build();

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> service.inviteMember(orgId, request));

        assertTrue(ex.getMessage().contains("already an active member"));
    }

    @Test
    @DisplayName("inviteMember resends invitation when member is already in INVITED status")
    void inviteMemberResendInvitedStatus() {
        String email = "pending@example.com";
        User existingUser = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .username("pendinguser")
                .build();

        OrganizationMember existingMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(existingUser)
                .membershipStatus(MembershipStatus.INVITED)
                .memberType(MemberType.MEMBER)
                .joinedAt(LocalDateTime.now().minusDays(3))
                .build();

        existingOrgMembers.add(existingMember);

        InviteMemberRequest request = InviteMemberRequest.builder()
                .email(email)
                .memberType(MemberType.ADMIN)
                .build();

        InviteMemberResponse response = service.inviteMember(orgId, request);

        assertNotNull(response);
        assertEquals(MembershipStatus.INVITED, response.getMembershipStatus());
        assertEquals(MemberType.ADMIN, response.getMemberType());
        assertTrue(response.getMessage().contains("Invitation resent successfully"));
    }

    @Test
    @DisplayName("inviteMember safely disambiguates when multiple users exist globally and exactly one belongs to current org")
    void inviteMemberMultipleUsersGloballyDisambiguatesByOrg() {
        String email = "multi@example.com";

        User userInOrg = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .username("multi_org")
                .company(companyA)
                .build();

        User userInOtherOrg = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .username("multi_other")
                .company(companyOther)
                .build();

        existingGlobalUsers.add(userInOrg);
        existingGlobalUsers.add(userInOtherOrg);

        InviteMemberRequest request = InviteMemberRequest.builder()
                .email(email)
                .memberType(MemberType.MEMBER)
                .build();

        InviteMemberResponse response = service.inviteMember(orgId, request);

        assertNotNull(response);
        assertEquals(userInOrg.getId(), response.getUserId());
        assertEquals(MembershipStatus.INVITED, response.getMembershipStatus());
    }

    @Test
    @DisplayName("inviteMember throws DuplicateResourceException (409) when multiple users exist in the same organization")
    void inviteMemberMultipleUsersInSameOrgThrows409() {
        String email = "duplicate_in_org@example.com";

        Company companyA2 = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("ACME-2")
                .organization(organization)
                .active(true)
                .build();

        User user1 = User.builder().id(UUID.randomUUID()).email(email).company(companyA).build();
        User user2 = User.builder().id(UUID.randomUUID()).email(email).company(companyA2).build();

        existingGlobalUsers.add(user1);
        existingGlobalUsers.add(user2);

        InviteMemberRequest request = InviteMemberRequest.builder()
                .email(email)
                .build();

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> service.inviteMember(orgId, request));

        assertTrue(ex.getMessage().contains("Multiple user accounts found with email"));
    }

    @Test
    @DisplayName("inviteMember throws DuplicateResourceException (409) when multiple users exist globally and none in current org")
    void inviteMemberMultipleUsersNoneInOrgThrows409() {
        String email = "duplicate_global@example.com";

        User user1 = User.builder().id(UUID.randomUUID()).email(email).company(companyOther).build();
        User user2 = User.builder().id(UUID.randomUUID()).email(email).company(companyOther).build();

        existingGlobalUsers.add(user1);
        existingGlobalUsers.add(user2);

        InviteMemberRequest request = InviteMemberRequest.builder()
                .email(email)
                .build();

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> service.inviteMember(orgId, request));

        assertTrue(ex.getMessage().contains("Cannot resolve user unambiguously"));
    }

    @SuppressWarnings("unchecked")
    private static <T> T createStub(Class<T> iface, Map<String, Function<Object[], Object>> handlers) {
        return (T) Proxy.newProxyInstance(
                iface.getClassLoader(),
                new Class<?>[]{iface},
                (proxy, method, args) -> {
                    if ("equals".equals(method.getName())) return proxy == args[0];
                    if ("hashCode".equals(method.getName())) return System.identityHashCode(proxy);
                    if ("toString".equals(method.getName())) return iface.getSimpleName() + "Stub";
                    Function<Object[], Object> handler = handlers.get(method.getName());
                    if (handler != null) {
                        return handler.apply(args);
                    }
                    Class<?> ret = method.getReturnType();
                    if (ret.equals(Optional.class)) return Optional.empty();
                    if (ret.equals(List.class)) return List.of();
                    if (ret.equals(boolean.class)) return false;
                    return null;
                });
    }
}
