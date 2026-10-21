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

    private record FeatureDefinition(String code, String name, String moduleName, String description, List<String> actions) {
        FeatureDefinition(String code, String name, String moduleName, String description) {
            this(code, name, moduleName, description, DEFAULT_ACTIONS);
        }
    }

    private static final List<FeatureDefinition> DEFAULT_FEATURES = List.of(
            new FeatureDefinition("DASHBOARD", "Dashboard Access", "CORE", "Access to operational and executive dashboard analytics"),
            new FeatureDefinition("PROFILE", "User Profile", "CORE", "Access to view and update user profile information"),
            new FeatureDefinition("PAYMENTS", "Payment Operations", "ACCOUNT", "Access to payment creation, disbursement, and settlement"),
            new FeatureDefinition("REPORTS", "System Reports", "ACCOUNT", "Access to financial, operational, and inventory reports"),
            new FeatureDefinition("USER_MANAGEMENT", "User Administration", "SSO", "Access to manage users, permissions, and company roles"),
            new FeatureDefinition("NOTIFICATIONS", "Notification Services", "CORE", "Access to receive and manage system alerts and emails"),
            new FeatureDefinition("WORKFLOW_DEFINITIONS", "Workflow Definitions", "WORKFLOW", "Access to create, configure, activate, and manage workflow definitions",
                    List.of("READ", "CREATE", "UPDATE", "WRITE", "DELETE", "ACTIVATE", "DEACTIVATE")),
            new FeatureDefinition("WORKFLOW_TRANSACTIONS", "Workflow Transactions", "WORKFLOW", "Access to view, initiate, and manage workflow transactions",
                    List.of("READ", "CREATE", "UPDATE", "WRITE", "DELETE", "CANCEL")),
            new FeatureDefinition("WORKFLOW_TASKS", "Workflow Tasks", "WORKFLOW", "Access to approve, reject, return, delegate, and manage workflow tasks",
                    List.of("READ", "WRITE", "APPROVE", "REJECT", "RETURN", "DELEGATE")),
            new FeatureDefinition("WORKFLOW_NOTIFICATIONS", "Workflow Notifications", "WORKFLOW", "Access to workflow notification services",
                    List.of("READ", "WRITE", "UPDATE")),
            new FeatureDefinition("WORKFLOW_ATTACHMENTS", "Workflow Attachments", "WORKFLOW", "Access to workflow attachments",
                    List.of("READ", "CREATE", "WRITE", "DELETE")),
            new FeatureDefinition("WORKFLOW_CALLBACKS", "Workflow Callbacks", "WORKFLOW", "Access to workflow callback logs and retry operations",
                    List.of("READ", "WRITE", "UPDATE")),
            new FeatureDefinition("WORKFLOW_DOCUMENT_FLOWS", "Workflow Document Flows", "WORKFLOW", "Access to workflow document flows and configurations",
                    List.of("READ", "CREATE", "UPDATE", "WRITE", "DELETE")),
            // ── Manufacturing Features ──────────────────────────────────────────────
            new FeatureDefinition("MANUFACTURING", "Manufacturing Module", "MANUFACTURING",
                    "Access to the Manufacturing module — production orders, BOMs, and operations",
                    List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "SUBMIT", "APPROVE", "REJECT", "RELEASE", "COMPLETE", "CONSUME", "RESERVE", "CANCEL")),
            new FeatureDefinition("MFG_BOM", "Bill of Materials", "MANUFACTURING",
                    "Access to create, view, edit, submit and manage Bills of Materials",
                    List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "SUBMIT", "APPROVE", "REJECT")),
            new FeatureDefinition("MFG_PRODUCTION", "Production Orders", "MANUFACTURING",
                    "Access to create, submit, approve, reject, release and manage Production Orders",
                    List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "SUBMIT", "APPROVE", "REJECT", "RELEASE", "CANCEL")),
            new FeatureDefinition("MFG_OPERATIONS", "Production Operations", "MANUFACTURING",
                    "Access to record material consumption, production completion and scrap",
                    List.of("READ", "CREATE", "WRITE", "COMPLETE", "CONSUME", "RESERVE", "CANCEL"))
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

            List<String> actions = def.actions() != null && !def.actions().isEmpty() ? def.actions() : DEFAULT_ACTIONS;
            for (String action : actions) {
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
