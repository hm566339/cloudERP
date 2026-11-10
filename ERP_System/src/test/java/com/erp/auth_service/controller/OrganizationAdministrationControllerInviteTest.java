package com.erp.auth_service.controller;

import com.erp.auth_service.dto.platform.MemberCompanyRoleDto;
import com.erp.auth_service.dto.platform.PlatformMemberSummaryResponse;
import com.erp.auth_service.dto.request.InviteMemberRequest;
import com.erp.auth_service.dto.response.AccessibleCompanyResponse;
import com.erp.auth_service.dto.response.InviteMemberResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.GlobalExceptionHandler;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationAdministrationService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OrganizationAdministrationControllerInviteTest {

    private MockMvc mockMvc;
    private FakeOrganizationAdministrationService fakeService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private UUID orgId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        fakeService = new FakeOrganizationAdministrationService();
        OrganizationAdministrationController controller = new OrganizationAdministrationController(fakeService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        orgId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    @Test
    @DisplayName("POST /api/sso/organization/members/invite successfully invites new member and returns 200")
    void inviteMemberSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        InviteMemberRequest request = InviteMemberRequest.builder()
                .email("newuser@example.com")
                .fullName("New User")
                .memberType(MemberType.MEMBER)
                .build();

        mockMvc.perform(post("/api/sso/organization/members/invite")
                .param("organizationId", orgId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.data.membershipStatus").value("INVITED"))
                .andExpect(jsonPath("$.data.message").value("Invitation successfully sent to newuser@example.com"));

        assertEquals(orgId, fakeService.lastOrganizationId);
        assertEquals("newuser@example.com", fakeService.lastInviteRequest.getEmail());
    }

    @Test
    @DisplayName("POST /api/organization/members/invite works with alternate path prefix")
    void inviteMemberAlternatePathSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        InviteMemberRequest request = InviteMemberRequest.builder()
                .email("teammate@example.com")
                .fullName("Teammate")
                .memberType(MemberType.MEMBER)
                .build();

        mockMvc.perform(post("/api/organization/members/invite")
                .header("X-Organization-Id", orgId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("teammate@example.com"));
    }

    @Test
    @DisplayName("POST /api/sso/organization/members/invite rejects invalid email format with 400")
    void inviteMemberInvalidEmail() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        InviteMemberRequest request = InviteMemberRequest.builder()
                .email("not-an-email")
                .build();

        mockMvc.perform(post("/api/sso/organization/members/invite")
                .param("organizationId", orgId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/sso/organization/members/invite rejects duplicate active member with 409 Conflict")
    void inviteMemberDuplicateActive() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        fakeService.shouldThrowDuplicate = true;

        InviteMemberRequest request = InviteMemberRequest.builder()
                .email("existing@example.com")
                .build();

        mockMvc.perform(post("/api/sso/organization/members/invite")
                .param("organizationId", orgId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("User is already an active member of this organization"));
    }

    @Test
    @DisplayName("POST /api/sso/organization/members/invite rejects non-admin caller with 403 Forbidden")
    void inviteMemberUnauthorized() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        fakeService.shouldThrowForbidden = true;

        InviteMemberRequest request = InviteMemberRequest.builder()
                .email("test@example.com")
                .build();

        mockMvc.perform(post("/api/sso/organization/members/invite")
                .param("organizationId", orgId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Only organization OWNER or ADMIN can invite members"));
    }

    @Test
    @DisplayName("PATCH /api/sso/organization/members/{memberId}/status updates status")
    void updateStatusSuccess() throws Exception {
        UUID targetMemberId = UUID.randomUUID();

        mockMvc.perform(patch("/api/sso/organization/members/" + targetMemberId + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertEquals(targetMemberId, fakeService.lastUpdatedMemberId);
        assertEquals("ACTIVE", fakeService.lastUpdatedStatus);
    }

    @Test
    @DisplayName("DELETE /api/sso/organization/members/{memberId} removes member")
    void deleteMemberSuccess() throws Exception {
        UUID targetMemberId = UUID.randomUUID();

        mockMvc.perform(delete("/api/sso/organization/members/" + targetMemberId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertEquals(targetMemberId, fakeService.lastRemovedMemberId);
    }

    // Fake Service implementation with zero external dependencies / agents
    static class FakeOrganizationAdministrationService implements OrganizationAdministrationService {
        UUID lastOrganizationId;
        InviteMemberRequest lastInviteRequest;
        UUID lastUpdatedMemberId;
        String lastUpdatedStatus;
        UUID lastRemovedMemberId;

        boolean shouldThrowDuplicate = false;
        boolean shouldThrowForbidden = false;

        @Override
        public InviteMemberResponse inviteMember(UUID organizationId, InviteMemberRequest request) {
            this.lastOrganizationId = organizationId;
            this.lastInviteRequest = request;

            if (shouldThrowDuplicate) {
                throw new DuplicateResourceException("User is already an active member of this organization");
            }
            if (shouldThrowForbidden) {
                throw new ForbiddenException("Only organization OWNER or ADMIN can invite members");
            }

            return InviteMemberResponse.builder()
                    .memberId(UUID.randomUUID())
                    .userId(UUID.randomUUID())
                    .organizationId(organizationId)
                    .email(request.getEmail())
                    .fullName(request.getFullName())
                    .memberType(request.getMemberType() != null ? request.getMemberType() : MemberType.MEMBER)
                    .membershipStatus(MembershipStatus.INVITED)
                    .companyId(request.getCompanyId())
                    .message("Invitation successfully sent to " + request.getEmail())
                    .invitedAt(LocalDateTime.now())
                    .build();
        }

        @Override
        public void updateMemberStatus(UUID memberId, String status) {
            this.lastUpdatedMemberId = memberId;
            this.lastUpdatedStatus = status;
        }

        @Override
        public void removeMemberFromOrganization(UUID memberId) {
            this.lastRemovedMemberId = memberId;
        }

        @Override
        public void grantCompanyAccess(UUID memberId, UUID companyId) {
        }

        @Override
        public void grantCompanyAccess(UUID memberId, UUID companyId, UUID roleId) {
        }

        @Override
        public void grantCompanyAccess(UUID memberId, UUID companyId, List<UUID> roleIds) {
        }

        @Override
        public void updateCompanyRole(UUID memberId, UUID companyId, UUID roleId) {
        }

        @Override
        public void addCompanyRole(UUID memberId, UUID companyId, UUID roleId) {
        }

        @Override
        public void removeCompanyRole(UUID memberId, UUID companyId, UUID roleId) {
        }

        @Override
        public void syncCompanyRoles(UUID memberId, UUID companyId, List<UUID> roleIds) {
        }

        @Override
        public void revokeCompanyAccess(UUID memberId, UUID companyId) {
        }

        @Override
        public List<AccessibleCompanyResponse> accessibleCompanies(UUID organizationId) {
            return List.of();
        }

        @Override
        public List<PlatformMemberSummaryResponse> organizationMembers(UUID organizationId) {
            return List.of();
        }

        @Override
        public List<MemberCompanyRoleDto> memberCompanyAccesses(UUID memberId) {
            return List.of();
        }

        @Override
        public List<MemberCompanyRoleDto> userCompanyAccesses(UUID userId) {
            return List.of();
        }

        @Override
        public UUID resolveMemberIdByUserId(UUID userId) {
            return UUID.randomUUID();
        }
    }
}
