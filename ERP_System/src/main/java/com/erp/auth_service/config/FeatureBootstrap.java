package com.erp.auth_service.config;

import com.erp.auth_service.model.Feature;
import com.erp.auth_service.repository.FeatureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class FeatureBootstrap implements CommandLineRunner {

    private final FeatureRepository featureRepository;
    private final com.erp.auth_service.repository.FeaturePermissionRepository featurePermissionRepository;

    private static final List<String> DEFAULT_ACTIONS = List.of("READ", "WRITE", "DELETE");

    private record FeatureDefinition(String code, String name, String moduleName, String description) {}

    private static final List<FeatureDefinition> DEFAULT_FEATURES = List.of(
            new FeatureDefinition("DASHBOARD", "Dashboard Access", "CORE", "Access to operational and executive dashboard analytics"),
            new FeatureDefinition("PROFILE", "User Profile", "CORE", "Access to view and update user profile information"),
            new FeatureDefinition("PAYMENTS", "Payment Operations", "ACCOUNT", "Access to payment creation, disbursement, and settlement"),
            new FeatureDefinition("REPORTS", "System Reports", "ACCOUNT", "Access to financial, operational, and inventory reports"),
            new FeatureDefinition("USER_MANAGEMENT", "User Administration", "SSO", "Access to manage users, permissions, and company roles"),
            new FeatureDefinition("NOTIFICATIONS", "Notification Services", "CORE", "Access to receive and manage system alerts and emails")
    );

    @Override
    public void run(String... args) {
        log.info("Starting FBAC Feature and Action-Level Permissions Bootstrap...");

        for (FeatureDefinition def : DEFAULT_FEATURES) {
            Feature feature = featureRepository.findByCodeIgnoreCase(def.code())
                    .orElseGet(() -> {
                        Feature newFeature = Feature.builder()
                                .code(def.code().toUpperCase())
                                .name(def.name())
                                .moduleName(def.moduleName().toUpperCase())
                                .description(def.description())
                                .active(true)
                                .build();
                        Feature saved = featureRepository.save(newFeature);
                        log.info("Registered FBAC Feature: code={}, module={}", def.code(), def.moduleName());
                        return saved;
                    });

            for (String action : DEFAULT_ACTIONS) {
                String permissionCode = feature.getCode() + ":" + action;
                featurePermissionRepository.findByPermissionCodeIgnoreCase(permissionCode)
                        .ifPresentOrElse(
                                existing -> log.debug("Feature permission [{}] already exists.", permissionCode),
                                () -> {
                                    com.erp.auth_service.model.FeaturePermission fp = com.erp.auth_service.model.FeaturePermission.builder()
                                            .feature(feature)
                                            .action(action)
                                            .permissionCode(permissionCode)
                                            .description(action + " access for feature " + feature.getName())
                                            .active(true)
                                            .build();
                                    featurePermissionRepository.save(fp);
                                    log.info("Registered Feature Permission: {}", permissionCode);
                                }
                        );
            }
        }

        log.info("FBAC Feature Catalog and Action Permissions bootstrap completed successfully.");
    }
}
