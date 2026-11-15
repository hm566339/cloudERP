package com.erp.auth_service.config;

import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.UserPermissionDetailDto;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.service.impl.PermissionServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

class FeatureBootstrapCrmAndSystemAdminTest {

    @Test
    @DisplayName("CRM features are bootstrapped with all required actions including EXPORT and APPROVE")
    void testCrmFeaturesBootstrapWithAllRequiredActions() {
        List<FeaturePermission> savedPermissions = new ArrayList<>();

        FeatureRepository featureRepository = (FeatureRepository) Proxy.newProxyInstance(
                FeatureRepository.class.getClassLoader(),
                new Class<?>[]{FeatureRepository.class},
                (proxy, method, args) -> {
                    if ("findByCodeIgnoreCase".equals(method.getName())) {
                        String code = (String) args[0];
                        return Optional.of(Feature.builder()
                                .id(UUID.randomUUID())
                                .code(code.toUpperCase())
                                .name(code)
                                .moduleName("CRM")
                                .active(true)
                                .build());
                    }
                    return null;
                }
        );

        FeaturePermissionRepository featurePermissionRepository = (FeaturePermissionRepository) Proxy.newProxyInstance(
                FeaturePermissionRepository.class.getClassLoader(),
                new Class<?>[]{FeaturePermissionRepository.class},
                (proxy, method, args) -> {
                    if ("findByPermissionCodeIgnoreCase".equals(method.getName())) {
                        return Optional.empty();
                    }
                    if ("save".equals(method.getName())) {
                        FeaturePermission fp = (FeaturePermission) args[0];
                        savedPermissions.add(fp);
                        return fp;
                    }
                    return null;
                }
        );

        FeatureBootstrap featureBootstrap = new FeatureBootstrap(featureRepository, featurePermissionRepository);
        featureBootstrap.run();

        List<String> codes = savedPermissions.stream()
                .map(FeaturePermission::getPermissionCode)
                .toList();

        assertThat(codes).contains(
                "CRM:READ",
                "CRM:MANAGE",
                "CRM_LEADS:READ",
                "CRM_LEADS:ASSIGN",
                "CRM_LEADS:IMPORT",
                "CRM_LEADS:EXPORT",
                "CRM_ACCOUNTS:ONBOARD",
                "CRM_ACCOUNTS:EXPORT",
                "CRM_OPPORTUNITIES:CLOSE",
                "CRM_OPPORTUNITIES:EXPORT",
                "CRM_QUOTATIONS:APPROVE",
                "CRM_QUOTATIONS:EXPORT",
                "CRM_AUTOMATION:MANAGE",
                "CRM_AUTOMATION:EXECUTE",
                "CRM_CAMPAIGNS:EXPORT",
                "CRM_SETTINGS:MANAGE"
        );
    }

    @Test
    @DisplayName("SYSTEM_ADMIN receives all active ERP and CRM catalog permissions with source SYSTEM_ADMIN")
    void testSystemAdminReceivesAllActivePermissions() {
        UUID sysAdminId = UUID.randomUUID();
        Role sysAdminRole = Role.builder()
                .id(UUID.randomUUID())
                .name("SYSTEM_ADMIN")
                .status(true)
                .build();
        User sysAdminUser = User.builder()
                .id(sysAdminId)
                .username("system001")
                .build();
        UserRole ur = UserRole.builder()
                .user(sysAdminUser)
                .role(sysAdminRole)
                .build();
        sysAdminUser.setUserRoles(List.of(ur));

        Feature crmLeadFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("CRM_LEADS")
                .name("CRM Leads")
                .moduleName("CRM")
                .active(true)
                .build();

        FeaturePermission crmRead = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .feature(crmLeadFeature)
                .action("READ")
                .permissionCode("CRM_LEADS:READ")
                .active(true)
                .build();

        FeaturePermission crmExport = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .feature(crmLeadFeature)
                .action("EXPORT")
                .permissionCode("CRM_LEADS:EXPORT")
                .active(true)
                .build();

        UserRepository userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if ("findByIdWithRolesAndPortalAccess".equals(method.getName())) {
                        return Optional.of(sysAdminUser);
                    }
                    if ("findById".equals(method.getName())) {
                        return Optional.of(sysAdminUser);
                    }
                    return null;
                }
        );

        FeaturePermissionRepository featurePermissionRepository = (FeaturePermissionRepository) Proxy.newProxyInstance(
                FeaturePermissionRepository.class.getClassLoader(),
                new Class<?>[]{FeaturePermissionRepository.class},
                (proxy, method, args) -> {
                    if ("findAll".equals(method.getName())) {
                        return List.of(crmRead, crmExport);
                    }
                    return null;
                }
        );

        UserPermissionRepository userPermissionRepository = (UserPermissionRepository) Proxy.newProxyInstance(
                UserPermissionRepository.class.getClassLoader(),
                new Class<?>[]{UserPermissionRepository.class},
                (proxy, method, args) -> {
                    if ("findByUser_Id".equals(method.getName())) {
                        return List.of();
                    }
                    return null;
                }
        );

        RolePermissionRepository rolePermissionRepository = (RolePermissionRepository) Proxy.newProxyInstance(
                RolePermissionRepository.class.getClassLoader(),
                new Class<?>[]{RolePermissionRepository.class},
                (proxy, method, args) -> List.of()
        );

        RoleRepository roleRepository = (RoleRepository) Proxy.newProxyInstance(
                RoleRepository.class.getClassLoader(),
                new Class<?>[]{RoleRepository.class},
                (proxy, method, args) -> Optional.empty()
        );

        FeatureRepository featureRepository = (FeatureRepository) Proxy.newProxyInstance(
                FeatureRepository.class.getClassLoader(),
                new Class<?>[]{FeatureRepository.class},
                (proxy, method, args) -> Optional.empty()
        );

        CompanyModuleRepository companyModuleRepository = (CompanyModuleRepository) Proxy.newProxyInstance(
                CompanyModuleRepository.class.getClassLoader(),
                new Class<?>[]{CompanyModuleRepository.class},
                (proxy, method, args) -> List.of()
        );

        UserPortalAccessRepository userPortalAccessRepository = (UserPortalAccessRepository) Proxy.newProxyInstance(
                UserPortalAccessRepository.class.getClassLoader(),
                new Class<?>[]{UserPortalAccessRepository.class},
                (proxy, method, args) -> List.of()
        );

        CompanyRepository companyRepository = (CompanyRepository) Proxy.newProxyInstance(
                CompanyRepository.class.getClassLoader(),
                new Class<?>[]{CompanyRepository.class},
                (proxy, method, args) -> Optional.empty()
        );

        SubscriptionRepository subscriptionRepository = (SubscriptionRepository) Proxy.newProxyInstance(
                SubscriptionRepository.class.getClassLoader(),
                new Class<?>[]{SubscriptionRepository.class},
                (proxy, method, args) -> Optional.empty()
        );

        SubscriptionPlanModuleRepository subscriptionPlanModuleRepository = (SubscriptionPlanModuleRepository) Proxy.newProxyInstance(
                SubscriptionPlanModuleRepository.class.getClassLoader(),
                new Class<?>[]{SubscriptionPlanModuleRepository.class},
                (proxy, method, args) -> List.of()
        );

        CompanySubscriptionRepository companySubscriptionRepository = (CompanySubscriptionRepository) Proxy.newProxyInstance(
                CompanySubscriptionRepository.class.getClassLoader(),
                new Class<?>[]{CompanySubscriptionRepository.class},
                (proxy, method, args) -> Optional.empty()
        );

        SubscriptionPlanRepository subscriptionPlanRepository = (SubscriptionPlanRepository) Proxy.newProxyInstance(
                SubscriptionPlanRepository.class.getClassLoader(),
                new Class<?>[]{SubscriptionPlanRepository.class},
                (proxy, method, args) -> Optional.empty()
        );

        OrganizationMemberRepository organizationMemberRepository = (OrganizationMemberRepository) Proxy.newProxyInstance(
                OrganizationMemberRepository.class.getClassLoader(),
                new Class<?>[]{OrganizationMemberRepository.class},
                (proxy, method, args) -> {
                    if ("findByUser_IdAndMembershipStatus".equals(method.getName())) {
                        return List.of();
                    }
                    return Optional.empty();
                }
        );

        PermissionServiceImpl permissionService = new PermissionServiceImpl(
                featurePermissionRepository,
                userPermissionRepository,
                userRepository,
                rolePermissionRepository,
                roleRepository,
                featureRepository,
                companyModuleRepository,
                userPortalAccessRepository,
                companyRepository,
                subscriptionRepository,
                subscriptionPlanModuleRepository,
                companySubscriptionRepository,
                subscriptionPlanRepository,
                organizationMemberRepository
        );

        EffectivePermissionsResponse res = permissionService.getEffectivePermissions(sysAdminId, null);

        assertNotNull(res);
        assertTrue(res.getRoles().contains("SYSTEM_ADMIN"));
        assertEquals(2, res.getPermissions().size());
        for (UserPermissionDetailDto p : res.getPermissions()) {
            assertTrue(p.isAllowed());
            assertEquals("SYSTEM_ADMIN", p.getSource());
            assertEquals("CRM", p.getModuleName());
        }
        assertEquals(1, res.getFeatures().size());
        assertEquals("CRM_LEADS", res.getFeatures().get(0).getFeatureCode());
    }
}
