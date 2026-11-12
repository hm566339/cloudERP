package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.CreateRoleRequest;
import com.erp.auth_service.dto.response.PaginationResponse;
import com.erp.auth_service.dto.response.RoleDetailsResponse;
import com.erp.auth_service.dto.response.RoleListResponse;
import com.erp.auth_service.dto.response.RoleResponse;

import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;

import com.erp.auth_service.mapper.RoleMapper;

import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.FeaturePermission;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.model.RolePermission;

import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.repository.FeaturePermissionRepository;
import com.erp.auth_service.repository.RolePermissionRepository;
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.repository.UserRoleRepository;

import com.erp.auth_service.service.RoleService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleServiceImpl implements RoleService {

        private final RoleRepository roleRepository;
        private final CompanyRepository companyRepository;
        private final UserRoleRepository userRoleRepository;
        private final RoleMapper roleMapper;
        private final FeaturePermissionRepository featurePermissionRepository;
        private final RolePermissionRepository rolePermissionRepository;

        /*
         * CREATE ROLE
         */
        @Override
        public RoleResponse createRole(
                        UUID companyId,
                        CreateRoleRequest request) {

                if (request.getName() == null ||
                                request.getName().isBlank()) {

                        throw new BadRequestException(
                                        "Role name is required");
                }

                Company company = companyRepository
                                .findById(companyId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Company not found"));

                assertCompanyOwnership(company);

                String roleName = request.getName().trim();

                if (roleRepository.existsByCompany_IdAndNameIgnoreCase(
                                company.getId(),
                                roleName)) {

                        throw new BadRequestException(
                                        "Role already exists");
                }

                Role role = roleMapper.toRole(request);

                role.setCompany(company);
                role.setName(roleName);
                role.setStatus(
                                request.getStatus() != null
                                                ? request.getStatus()
                                                : true);

                Role saved = roleRepository.save(role);
                assignDefaultRolePermissions(saved);

                return roleMapper.toRoleResponse(saved);
        }

        private void assignDefaultRolePermissions(Role role) {
                if (role == null || role.getId() == null || featurePermissionRepository == null
                                || rolePermissionRepository == null) {
                        return;
                }
                try {
                        featurePermissionRepository.findByPermissionCodeIgnoreCase("DASHBOARD:READ")
                                        .ifPresent(fp -> {
                                                try {
                                                        rolePermissionRepository.save(RolePermission.builder()
                                                                        .role(role).permission(fp).build());
                                                } catch (Exception ignored) {
                                                }
                                        });
                        featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_APPEARANCE:READ")
                                        .ifPresent(fp -> {
                                                try {
                                                        rolePermissionRepository.save(RolePermission.builder()
                                                                        .role(role).permission(fp).build());
                                                } catch (Exception ignored) {
                                                }
                                        });
                } catch (Exception ignored) {
                }
        }

        /*
         * GET ALL ROLES
         */
        @Override
        @Transactional(readOnly = true)
        public RoleListResponse getAllRoles(
                        UUID companyId,
                        Boolean status,
                        int page,
                        int pageSize,
                        String search) {

                Company company = companyRepository
                                .findById(companyId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Company not found"));

                assertCompanyOwnership(company);

                int validatedPage = Math.max(page, 1);

                int validatedPageSize = Math.min(
                                Math.max(pageSize, 1),
                                100);

                Pageable pageable = PageRequest.of(
                                validatedPage - 1,
                                validatedPageSize,
                                Sort.by(Sort.Direction.DESC, "createdAt"));

                String keyword = search == null
                                ? ""
                                : search.trim();

                Page<Role> rolePage = roleRepository.findAllWithFilters(
                                company.getId(),
                                status,
                                keyword,
                                pageable);

                return RoleListResponse.builder()
                                .roles(
                                                roleMapper.toRoleResponseList(
                                                                rolePage.getContent()))
                                .pagination(
                                                PaginationResponse.builder()
                                                                .currentPage(validatedPage)
                                                                .pageSize(validatedPageSize)
                                                                .totalPages(rolePage.getTotalPages())
                                                                .totalCount(rolePage.getTotalElements())
                                                                .build())
                                .build();
        }

        /*
         * ROLE DETAILS
         */
        @Override
        @Transactional(readOnly = true)
        public RoleDetailsResponse getRoleDetails(UUID roleId, int page, int pageSize, String search) {

                Role role = roleRepository.findById(roleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Role not found"));

                assertCompanyOwnership(role.getCompany());

                int validatedPage = Math.max(page, 1);
                int validatedPageSize = Math.min(Math.max(pageSize, 1), 100);

                Pageable pageable = PageRequest.of(
                                validatedPage - 1,
                                validatedPageSize,
                                Sort.by(Sort.Direction.DESC, "user.username"));

                String keyword = search == null ? "" : search.trim();

                var userRolePage = userRoleRepository.findAllByRoleIdWithUserSearch(roleId, keyword, pageable);

                return RoleDetailsResponse.builder()
                                .id(role.getId())
                                .name(role.getName())
                                .status(role.isStatus())
                                .createdAt(role.getCreatedAt())
                                .updatedAt(role.getUpdatedAt())
                                .users(
                                                roleMapper.toRoleUserResponseList(
                                                                userRolePage.getContent()))
                                .pagination(
                                                PaginationResponse.builder()
                                                                .currentPage(validatedPage)
                                                                .pageSize(validatedPageSize)
                                                                .totalPages(userRolePage.getTotalPages())
                                                                .totalCount(userRolePage.getTotalElements())
                                                                .build())
                                .build();
        }

        /*
         * UPDATE ROLE
         */
        @Override
        public RoleResponse updateRole(
                        UUID roleId,
                        CreateRoleRequest request) {

                Role role = roleRepository.findById(roleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Role not found"));

                assertCompanyOwnership(role.getCompany());

                if ("SYSTEM_ADMIN".equalsIgnoreCase(role.getName())) {

                        throw new BadRequestException(
                                        "You can't update SYSTEM_ADMIN role");
                }

                if (request.getName() == null ||
                                request.getName().isBlank()) {

                        throw new BadRequestException(
                                        "Role name is required");
                }

                String newName = request.getName().trim();

                if ("SYSTEM_ADMIN".equalsIgnoreCase(newName)) {

                        throw new BadRequestException(
                                        "SYSTEM_ADMIN role name is reserved");
                }

                if (!role.getName().equalsIgnoreCase(newName)
                                && roleRepository.existsByCompany_IdAndNameIgnoreCase(
                                                role.getCompany().getId(),
                                                newName)) {

                        throw new BadRequestException(
                                        "Role name already exists");
                }

                role.setName(newName);

                if (request.getStatus() != null) {
                        role.setStatus(request.getStatus());
                }

                Role updated = roleRepository.save(role);

                return roleMapper.toRoleResponse(updated);
        }

        /*
         * UPDATE ROLE STATUS
         */
        @Override
        public RoleResponse updateRoleStatus(
                        UUID roleId,
                        boolean status) {

                Role role = roleRepository.findById(roleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Role not found"));

                assertCompanyOwnership(role.getCompany());

                if ("SYSTEM_ADMIN".equalsIgnoreCase(role.getName())) {

                        throw new BadRequestException(
                                        "You can't disable SYSTEM_ADMIN role");
                }

                role.setStatus(status);

                Role updated = roleRepository.save(role);

                return roleMapper.toRoleResponse(updated);
        }

        /*
         * DELETE ROLE
         */
        @Override
        public void deleteRole(UUID roleId) {

                Role role = roleRepository.findByIdWithUsers(roleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Role not found"));

                assertCompanyOwnership(role.getCompany());

                if ("SYSTEM_ADMIN".equalsIgnoreCase(role.getName())) {

                        throw new BadRequestException(
                                        "You can't delete SYSTEM_ADMIN role");
                }

                if (role.getUserRoles() != null &&
                                !role.getUserRoles().isEmpty()) {

                        throw new IllegalStateException(
                                        "Cannot delete role because users are assigned");
                }

                /*
                 * SOFT DELETE
                 */
                role.setStatus(false);

                roleRepository.save(role);
        }

        private void assertCompanyOwnership(Company company) {
                if (com.erp.auth_service.security.PlatformSecurityUtil.isElevatedAdmin()) {
                        return;
                }
                if (company == null) {
                        throw new com.erp.auth_service.exception.ForbiddenException(
                                        "Access denied: Role is not associated with any company");
                }
                com.erp.auth_service.security.RequestContext.Context context = com.erp.auth_service.security.RequestContext
                                .get();
                if (context != null) {
                        if (context.organizationId() != null) {
                                if (company.getOrganization() == null || !company.getOrganization().getId()
                                                .equals(context.organizationId())) {
                                        throw new com.erp.auth_service.exception.ForbiddenException(
                                                        "Access denied: Role does not belong to authorized organization");
                                }
                        }
                        if (context.companyId() != null && !context.companyId().equals(company.getId())) {
                                throw new com.erp.auth_service.exception.ForbiddenException(
                                                "Access denied: Role does not belong to authorized company context");
                        }
                }
        }
}