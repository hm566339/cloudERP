package com.erp.auth_service.config;

import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.model.FeaturePermission;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.model.RolePermission;
import com.erp.auth_service.repository.CompanyModuleRepository;
import com.erp.auth_service.repository.FeaturePermissionRepository;
import com.erp.auth_service.repository.RolePermissionRepository;
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(4)
@RequiredArgsConstructor
@Slf4j
public class OwnerRolePermissionBootstrap implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final CompanyModuleRepository companyModuleRepository;
    private final PermissionService permissionService;
    private final FeaturePermissionRepository featurePermissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting Owner Role Permissions Bootstrap...");
        try {
            List<Role> ownerRoles = roleRepository.findAll().stream()
                    .filter(r -> "OWNER".equalsIgnoreCase(r.getName()))
                    .toList();

            int processed = 0;
            for (Role role : ownerRoles) {
                try {
                    Company company = role.getCompany();
                    if (company != null) {
                        List<CompanyModule> companyModules = companyModuleRepository.findByCompany_IdAndActiveTrue(company.getId());
                        List<String> moduleNames = companyModules.stream()
                                .filter(cm -> cm.getModule() != null && Boolean.TRUE.equals(cm.getModule().getModuleStatus()))
                                .map(cm -> cm.getModule().getName())
                                .toList();
                        permissionService.assignOwnerRolePermissions(role, moduleNames, null);
                        processed++;
                    }
                } catch (Exception ex) {
                    log.warn("Failed to bootstrap permissions for role ID {}: {}", role.getId(), ex.getMessage());
                }
            }
            log.info("Owner Role Permissions Bootstrap completed. Processed {} OWNER roles.", processed);

            // Also ensure ADMIN / WORKFLOW_ADMIN / WORKFLOW_MANAGER roles receive workflow permissions if WORKFLOW module enabled
            List<Role> workflowRoles = roleRepository.findAll().stream()
                    .filter(r -> r.getName() != null && (
                            r.getName().equalsIgnoreCase("ADMIN")
                            || r.getName().equalsIgnoreCase("WORKFLOW_ADMIN")
                            || r.getName().equalsIgnoreCase("WORKFLOW_MANAGER")
                    ))
                    .toList();
            for (Role role : workflowRoles) {
                try {
                    Company company = role.getCompany();
                    if (company != null) {
                        List<CompanyModule> companyModules = companyModuleRepository.findByCompany_IdAndActiveTrue(company.getId());
                        boolean hasWorkflowModule = companyModules.stream()
                                .anyMatch(cm -> cm.getModule() != null && "WORKFLOW".equalsIgnoreCase(cm.getModule().getName()));
                        if (hasWorkflowModule) {
                            permissionService.assignOwnerRolePermissions(role, List.of("WORKFLOW"), null);
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Failed to bootstrap workflow permissions for role [{}]: {}", role.getName(), ex.getMessage());
                }
            }
            // Ensure all existing roles across all companies have baseline DASHBOARD:READ and ORGANIZATION_APPEARANCE:READ
            bootstrapDefaultPermissionsForAllRoles();
        } catch (Exception e) {
            log.error("Error during Owner Role Permissions Bootstrap: {}", e.getMessage(), e);
        }
    }

    private void bootstrapDefaultPermissionsForAllRoles() {
        if (featurePermissionRepository == null || rolePermissionRepository == null) return;
        var dashboardReadOpt = featurePermissionRepository.findByPermissionCodeIgnoreCase("DASHBOARD:READ");
        var appearanceReadOpt = featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_APPEARANCE:READ");

        List<Role> allRoles = roleRepository.findAll();
        int seeded = 0;
        for (Role role : allRoles) {
            try {
                if (role == null || role.getId() == null) continue;
                List<RolePermission> existing = rolePermissionRepository.findByRole_Id(role.getId());
                Set<String> existingCodes = existing.stream()
                        .filter(rp -> rp.getPermission() != null && rp.getPermission().getPermissionCode() != null)
                        .map(rp -> rp.getPermission().getPermissionCode().toUpperCase(Locale.ROOT))
                        .collect(Collectors.toSet());

                if (dashboardReadOpt.isPresent() && !existingCodes.contains("DASHBOARD:READ")) {
                    rolePermissionRepository.save(RolePermission.builder()
                            .role(role)
                            .permission(dashboardReadOpt.get())
                            .build());
                    seeded++;
                }
                if (appearanceReadOpt.isPresent() && !existingCodes.contains("ORGANIZATION_APPEARANCE:READ")) {
                    rolePermissionRepository.save(RolePermission.builder()
                            .role(role)
                            .permission(appearanceReadOpt.get())
                            .build());
                    seeded++;
                }
            } catch (Exception ex) {
                log.warn("Could not seed default permissions for role [{}]: {}", role.getName(), ex.getMessage());
            }
        }
        log.info("Default role permissions bootstrap completed. Seeded {} baseline permissions across all roles.", seeded);
    }
}
