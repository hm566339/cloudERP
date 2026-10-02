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
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.repository.UserPortalAccessRepository;
import com.erp.auth_service.repository.UserRepository;
import com.erp.auth_service.repository.UserRoleRepository;
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

        private void assertCompanyOwnership(Company company) {
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
                assertCompanyOwnership(user.getCompany());

                Role role = roleRepository.findById(roleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Role not found"));

                /*
                 * COMPANY VALIDATION
                 */
                if (!user.getCompany()
                                .getId()
                                .equals(role.getCompany().getId())) {

                        throw new InvalidOperationException(
                                        "User and role company mismatch");
                }

                if (userRoleRepository
                                .roleExists(
                                                userId,
                                                roleId)) {

                        throw new DuplicateResourceException(
                                        "Role already assigned to user");
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
                assertCompanyOwnership(userRole.getUser().getCompany());

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

                if (userPortalAccessRepository
                                .existsByUser_IdAndCompanyModule_Id(
                                                userId,
                                                companyModuleId)) {

                        throw new DuplicateResourceException(
                                        "Portal access already granted to user");
                }

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User not found"));
                assertCompanyOwnership(user.getCompany());

                CompanyModule companyModule = companyModuleRepository.findById(
                                companyModuleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Company module not found"));
                assertCompanyOwnership(companyModule.getCompany());

                /*
                 * COMPANY VALIDATION
                 */
                if (!user.getCompany()
                                .getId()
                                .equals(
                                                companyModule
                                                                .getCompany()
                                                                .getId())) {

                        throw new InvalidOperationException(
                                        "User and company module mismatch");
                }

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
                assertCompanyOwnership(access.getUser().getCompany());

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

                for (Session session : sessions) {

                        if (session.getCompany() != null
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
                                                                                        .getId())) {

                                sessionRepository.delete(session);
                        }
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
                if (context != null && context.companyId() != null && !context.companyId().equals(companyId)) {
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
                assertCompanyOwnership(access.getUser().getCompany());

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