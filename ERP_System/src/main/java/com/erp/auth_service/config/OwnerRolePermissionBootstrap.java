package com.erp.auth_service.config;

import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.repository.CompanyModuleRepository;
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Order(4)
@RequiredArgsConstructor
@Slf4j
public class OwnerRolePermissionBootstrap implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final CompanyModuleRepository companyModuleRepository;
    private final PermissionService permissionService;

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
        } catch (Exception e) {
            log.error("Error during Owner Role Permissions Bootstrap: {}", e.getMessage(), e);
        }
    }
}
