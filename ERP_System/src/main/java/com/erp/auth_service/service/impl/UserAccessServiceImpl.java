package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.response.*;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.InvalidOperationException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.mapper.UserPortalAccessMapper;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.model.Session;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.model.User;
import com.erp.auth_service.model.UserPortalAccess;
import com.erp.auth_service.model.UserRole;
import com.erp.auth_service.repository.CompanyModuleRepository;
import com.erp.auth_service.repository.MemberCompanyAccessRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.repository.UserPortalAccessRepository;
import com.erp.auth_service.repository.UserRepository;
import com.erp.auth_service.repository.UserRoleRepository;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.UserAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserAccessServiceImpl implements UserAccessService {

        private final UserRepository userRepository;

        private final RoleRepository roleRepository;

        private final CompanyModuleRepository companyModuleRepository;

        private final UserRoleRepository userRoleRepository;

        private final UserPortalAccessRepository userPortalAccessRepository;

        private final SessionRepository sessionRepository;

        private final UserPortalAccessMapper userPortalAccessMapper;

        private final OrganizationMemberRepository organizationMemberRepository;

        private final MemberCompanyAccessRepository memberCompanyAccessRepository;

        private void assertCompanyOwnership(Company company) {
                if (company == null || PlatformSecurityUtil.isElevatedAdmin()) {
                        return;
                }
                RequestContext.Context context = RequestContext.get();
                if (context != null) {
                        if (context.organizationId() != null) {
                                if (company.getOrganization() == null || !company.getOrganization().getId().equals(context.organizationId())) {
                                        throw new ForbiddenException("Access denied: Company does not belong to authorized organization");
                                }
                        }
                        if (context.companyId() != null && !context.companyId().equals(company.getId())) {
                                throw new ForbiddenException("Access denied: Company does not match authorized company context");
                        }
                }
        }

        private void assertUserHasAccessToCompany(User user, Company company) {
                if (company == null || PlatformSecurityUtil.isElevatedAdmin()) {
                        return;
                }
                if (user.getCompany() != null && user.getCompany().getId().equals(company.getId())) {
                        return;
                }
                if (company.getOrganization() != null && organizationMemberRepository != null && memberCompanyAccessRepository != null) {
                        boolean hasAccess = organizationMemberRepository
                                        .findByOrganization_IdAndUser_Id(company.getOrganization().getId(), user.getId())
                                        .map(mem -> memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(mem.getId(), company.getId()))
                                        .orElse(false);
                        if (hasAccess) {
                                return;
                        }
                }
                throw new InvalidOperationException("User does not have access to company " + company.getCompanyName());
        }

        /*
         * ASSIGN ROLE
         */
        @Override
        public UserRoleAssignmentResponse assignRole(
                        UUID userId,
                        UUID roleId) {

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User not found"));

                Role role = roleRepository.findById(roleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Role not found"));

                Company targetCompany = role.getCompany();
                if (targetCompany != null) {
                        assertCompanyOwnership(targetCompany);
                        assertUserHasAccessToCompany(user, targetCompany);

                        // If user already has an existing role in targetCompany, replace it
                        List<UserRole> existingRoles = userRoleRepository.findAllByUser_IdAndRole_Company_Id(userId, targetCompany.getId());
                        for (UserRole er : existingRoles) {
                                if (!er.getRole().getId().equals(roleId)) {
                                        userRoleRepository.delete(er);
                                }
                        }
                }

                if (userRoleRepository
                                .roleExists(
                                                userId,
                                                roleId)) {

                        UserRole existing = userRoleRepository.findByUser_IdAndRole_Id(userId, roleId).orElse(null);
                        if (existing != null) {
                                return UserRoleAssignmentResponse.builder()
                                                .userId(existing.getUser().getId())
                                                .roleId(existing.getRole().getId())
                                                .assignedAt(existing.getAssignedAt())
                                                .build();
                        }
                }

                UserRole userRole = UserRole.builder()
                                .user(user)
                                .role(role)
                                .build();

                UserRole saved = userRoleRepository.save(userRole);

                return UserRoleAssignmentResponse.builder()
                                .userId(saved.getUser().getId())
                                .roleId(saved.getRole().getId())
                                .assignedAt(saved.getAssignedAt())
                                .build();
        }

        /*
         * REMOVE ROLE
         */
        @Override
        public void removeRole(
                        UUID userId,
                        UUID roleId) {

                UserRole userRole = userRoleRepository
                                .findByUser_IdAndRole_Id(
                                                userId,
                                                roleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Role assignment not found"));
                if (userRole.getRole().getCompany() != null) {
                        assertCompanyOwnership(userRole.getRole().getCompany());
                }

                if ("SYSTEM_ADMIN".equalsIgnoreCase(
                                userRole.getRole().getName())) {

                        throw new InvalidOperationException(
                                        "You are not allowed to remove SYSTEM_ADMIN role");
                }

                userRoleRepository.delete(userRole);
        }

        /*
         * GRANT PORTAL ACCESS
         */
        @Override
        public PortalAccessGrantResponse grantPortalAccess(
                        UUID userId,
                        UUID companyModuleId) {

                CompanyModule companyModule = companyModuleRepository.findById(
                                companyModuleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Company module not found"));
                assertCompanyOwnership(companyModule.getCompany());

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User not found"));
                assertUserHasAccessToCompany(user, companyModule.getCompany());

                UserPortalAccess access = userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_Id(
                                                userId,
                                                companyModuleId)
                                .orElse(null);

                if (access == null) {

                        access = UserPortalAccess.builder()
                                        .user(user)
                                        .companyModule(companyModule)
                                        .status(true)
                                        .build();

                } else {
                        if (access.isStatus()) {
                                throw new DuplicateResourceException(
                                                "Portal access already granted to user");
                        }
                        access.setStatus(true);
                }

                UserPortalAccess saved = userPortalAccessRepository.save(access);

                return PortalAccessGrantResponse.builder()
                                .userId(saved.getUser().getId())
                                .moduleId(
                                                saved.getCompanyModule()
                                                                .getModule()
                                                                .getId())
                                .status(saved.isStatus())
                                .createdAt(saved.getCreatedAt())
                                .build();
        }

        /*
         * REMOVE PORTAL ACCESS
         */
        @Override
        public void removePortalAccess(
                        UUID userId,
                        UUID companyModuleId) {

                UserPortalAccess access = userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_Id(
                                                userId,
                                                companyModuleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Portal access not found"));
                assertCompanyOwnership(access.getCompanyModule().getCompany());

                if (!access.isStatus()) {

                        throw new DuplicateResourceException(
                                        "Portal access already removed for user");
                }

                access.setStatus(false);

                userPortalAccessRepository.save(access);

                /*
                 * REMOVE ACTIVE SESSIONS
                 */
                List<Session> sessions = sessionRepository.findAllByUser_IdAndCompany_IdAndModule_Id(
                                userId,
                                access.getCompanyModule().getCompany().getId(),
                                access.getCompanyModule().getModule().getId());

                if (!sessions.isEmpty()) {
                        sessionRepository.deleteAll(sessions);
                }
        }

        /*
         * GET USER PORTAL ACCESSES
         */
        @Override
        @Transactional(readOnly = true)
        public UserPortalAccessListResponse getUserPortalAccesses(
                        UUID companyId,
                        int page,
                        int pageSize,
                        String search,
                        Boolean status) {

                RequestContext.Context context = RequestContext.get();
                if (!PlatformSecurityUtil.isElevatedAdmin() && context != null && context.companyId() != null && !context.companyId().equals(companyId)) {
                        throw new ForbiddenException("Access denied: Company does not match authorized company context");
                }

                Pageable pageable = PageRequest.of(
                                Math.max(page - 1, 0),
                                Math.min(Math.max(pageSize, 1), 100),
                                Sort.by(Sort.Direction.DESC, "createdAt"));

                Page<UserPortalAccess> accessPage = userPortalAccessRepository.findAllWithUserAndCompanyModulePage(
                                companyId,
                                search == null ? "" : search.trim(),
                                status,
                                pageable);

                return UserPortalAccessListResponse.builder()
                                .portalAccesses(
                                                userPortalAccessMapper.toUserPortalAccessResponseList(
                                                                accessPage.getContent()))
                                .pagination(
                                                PaginationResponse.builder()
                                                                .currentPage(page)
                                                                .pageSize(accessPage.getSize())
                                                                .totalPages(accessPage.getTotalPages())
                                                                .totalCount(accessPage.getTotalElements())
                                                                .build())
                                .build();
        }

        /*
         * TOGGLE PORTAL ACCESS
         */
        @Override
        public void togglePortalAccess(
                        UUID userId,
                        UUID companyModuleId) {

                UserPortalAccess access = userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_Id(
                                                userId,
                                                companyModuleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Portal access not found"));
                assertCompanyOwnership(access.getCompanyModule().getCompany());

                /*
                 * TOGGLE STATUS
                 */
                boolean newStatus = !access.isStatus();

                access.setStatus(newStatus);

                userPortalAccessRepository.save(access);

                /*
                 * REMOVE ACTIVE SESSIONS
                 */
                if (!newStatus) {

                        sessionRepository
                                        .findAllByUser_IdAndCompany_IdAndModule_Id(
                                                        userId,
                                                        access.getCompanyModule().getCompany().getId(),
                                                        access.getCompanyModule().getModule().getId())
                                        .stream()
                                        .filter(session ->

                                        session.getCompany() != null
                                                        && session.getModule() != null

                                                        && session.getCompany()
                                                                        .getId()
                                                                        .equals(
                                                                                        access.getCompanyModule()
                                                                                                        .getCompany()
                                                                                                        .getId())

                                                        && session.getModule()
                                                                        .getId()
                                                                        .equals(
                                                                                        access.getCompanyModule()
                                                                                                        .getModule()
                                                                                                        .getId())

                                        )
                                        .forEach(sessionRepository::delete);
                }
        }
}