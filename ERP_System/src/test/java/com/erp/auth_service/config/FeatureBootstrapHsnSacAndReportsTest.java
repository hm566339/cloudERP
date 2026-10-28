package com.erp.auth_service.config;

import com.erp.auth_service.model.Feature;
import com.erp.auth_service.model.FeaturePermission;
import com.erp.auth_service.repository.FeaturePermissionRepository;
import com.erp.auth_service.repository.FeatureRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class FeatureBootstrapHsnSacAndReportsTest {

    @Test
    @DisplayName("HSN_SAC feature is bootstrapped with READ, CREATE, WRITE, UPDATE, DELETE, and EXPORT actions")
    void testHsnSacFeatureHasAllExpectedActions() {
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
                                .moduleName("ACCOUNT")
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
                "HSN_SAC:READ",
                "HSN_SAC:CREATE",
                "HSN_SAC:WRITE",
                "HSN_SAC:UPDATE",
                "HSN_SAC:DELETE",
                "HSN_SAC:EXPORT"
        );
    }

    @Test
    @DisplayName("REPORTS feature is bootstrapped with EXPORT action in addition to default actions")
    void testReportsFeatureHasExportAction() {
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
                                .moduleName("ACCOUNT")
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
                "REPORTS:READ",
                "REPORTS:WRITE",
                "REPORTS:DELETE",
                "REPORTS:EXPORT"
        );
    }
}
