package com.erp.auth_service.service.platform;

import com.erp.auth_service.dto.platform.*;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.InvalidOperationException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.platform.*;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.PlatformRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformAdminManagementService {

    private final PlatformAdminRepository platformAdminRepository;
    private final PlatformRoleRepository platformRoleRepository;
    private final PlatformAuditService platformAuditService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<PlatformAdminResponse> listAdmins() {
        return platformAdminRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PlatformAdminResponse createAdmin(CreatePlatformAdminRequest request, UUID callingAdminId, String ip, String userAgent) {
        String email = request.getEmail().trim().toLowerCase();
        if (platformAdminRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("Admin with email " + email + " already exists");
        }

        Set<PlatformRole> roles = new HashSet<>();
        for (String roleCode : request.getRoleCodes()) {
            PlatformRole role = platformRoleRepository.findByCode(roleCode.trim().toUpperCase())
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleCode));
            roles.add(role);
        }

        PlatformAdmin admin = PlatformAdmin.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .status(PlatformAdminStatus.ACTIVE)
                .roles(roles)
                .build();

        PlatformAdmin saved = platformAdminRepository.save(admin);

        platformAuditService.record(null, email, "PLATFORM_ADMIN_CREATED", null, null, null, null,
                "PlatformAdmin", saved.getId() != null ? saved.getId().toString() : null, "Created by admin " + callingAdminId, ip, userAgent, "SUCCESS", null);

        return toResponse(saved);
    }

    @Transactional
    public PlatformAdminResponse updateStatus(UUID adminId, UpdatePlatformAdminStatusRequest request, UUID callingAdminId, String ip, String userAgent) {
        PlatformAdmin admin = platformAdminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Platform admin not found: " + adminId));

        if (request.getStatus() != PlatformAdminStatus.ACTIVE) {
            boolean isSuperAdmin = admin.getRoles().stream().anyMatch(r -> "SUPER_ADMIN".equalsIgnoreCase(r.getCode()));
            if (isSuperAdmin && admin.getStatus() == PlatformAdminStatus.ACTIVE) {
                long activeSuperAdmins = platformAdminRepository.countByStatusAndRoleCode(PlatformAdminStatus.ACTIVE, "SUPER_ADMIN");
                if (activeSuperAdmins <= 1) {
                    throw new InvalidOperationException("Cannot disable the last active SUPER_ADMIN");
                }
            }
        }

        PlatformAdminStatus oldStatus = admin.getStatus();
        admin.setStatus(request.getStatus());
        PlatformAdmin saved = platformAdminRepository.save(admin);

        platformAuditService.record(admin, admin.getEmail(), "PLATFORM_ADMIN_STATUS_CHANGED", null, null, null, null,
                "PlatformAdmin", saved.getId().toString(),
                "Status changed from " + oldStatus + " to " + request.getStatus() + " by " + callingAdminId,
                ip, userAgent, "SUCCESS", null);

        return toResponse(saved);
    }

    @Transactional
    public PlatformAdminResponse updateRoles(UUID adminId, UpdatePlatformAdminRoleRequest request, UUID callingAdminId, String ip, String userAgent) {
        PlatformAdmin admin = platformAdminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Platform admin not found: " + adminId));

        boolean wasSuperAdmin = admin.getRoles().stream().anyMatch(r -> "SUPER_ADMIN".equalsIgnoreCase(r.getCode()));
        boolean willBeSuperAdmin = request.getRoleCodes().stream().anyMatch(rc -> "SUPER_ADMIN".equalsIgnoreCase(rc.trim()));

        if (wasSuperAdmin && !willBeSuperAdmin && admin.getStatus() == PlatformAdminStatus.ACTIVE) {
            long activeSuperAdmins = platformAdminRepository.countByStatusAndRoleCode(PlatformAdminStatus.ACTIVE, "SUPER_ADMIN");
            if (activeSuperAdmins <= 1) {
                throw new InvalidOperationException("Cannot remove SUPER_ADMIN role from the last active SUPER_ADMIN");
            }
        }

        Set<PlatformRole> newRoles = new HashSet<>();
        for (String roleCode : request.getRoleCodes()) {
            PlatformRole role = platformRoleRepository.findByCode(roleCode.trim().toUpperCase())
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleCode));
            newRoles.add(role);
        }

        admin.setRoles(newRoles);
        PlatformAdmin saved = platformAdminRepository.save(admin);

        platformAuditService.record(admin, admin.getEmail(), "PLATFORM_ADMIN_ROLES_CHANGED", null, null, null, null,
                "PlatformAdmin", saved.getId().toString(),
                "Roles updated to " + request.getRoleCodes() + " by " + callingAdminId,
                ip, userAgent, "SUCCESS", null);

        return toResponse(saved);
    }

    private PlatformAdminResponse toResponse(PlatformAdmin a) {
        List<String> roleCodes = a.getRoles().stream().map(PlatformRole::getCode).toList();
        List<String> permissionCodes = a.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(PlatformPermission::getCode)
                .distinct()
                .toList();

        return PlatformAdminResponse.builder()
                .id(a.getId())
                .email(a.getEmail())
                .fullName(a.getFullName())
                .status(a.getStatus())
                .roles(roleCodes)
                .permissions(permissionCodes)
                .createdAt(a.getCreatedAt())
                .lastLoginAt(a.getLastLoginAt())
                .build();
    }
}
