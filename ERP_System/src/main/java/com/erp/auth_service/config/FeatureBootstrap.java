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

        private record FeatureDefinition(String code, String name, String moduleName, String description,
                        List<String> actions) {
                FeatureDefinition(String code, String name, String moduleName, String description) {
                        this(code, name, moduleName, description, DEFAULT_ACTIONS);
                }
        }

        private static final List<FeatureDefinition> DEFAULT_FEATURES = List.of(
                        new FeatureDefinition("DASHBOARD", "Dashboard Access", "CORE",
                                        "Access to operational and executive dashboard analytics"),
                        new FeatureDefinition("PROFILE", "User Profile", "CORE",
                                        "Access to view and update user profile information"),
                        new FeatureDefinition("PAYMENTS", "Payment Operations", "ACCOUNT",
                                        "Access to payment creation, disbursement, and settlement"),
                        new FeatureDefinition("REPORTS", "System Reports", "ACCOUNT",
                                        "Access to financial, operational, and inventory reports",
                                        List.of("READ", "WRITE", "DELETE", "EXPORT")),
                        new FeatureDefinition("HSN_SAC", "HSN/SAC Master", "ACCOUNT",
                                        "Access to manage HSN and SAC tax codes",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "EXPORT")),
                        new FeatureDefinition("USER_MANAGEMENT", "User Administration", "SSO",
                                        "Access to manage users, permissions, and company roles"),
                        new FeatureDefinition("ORGANIZATION", "Organization Management", "CORE",
                                        "Access to view and manage organization settings and appearance",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE")),
                        new FeatureDefinition("ORGANIZATION_APPEARANCE", "Organization Appearance", "CORE",
                                        "Access to view and manage organization appearance and branding settings",
                                        List.of("READ", "WRITE", "UPDATE")),
                        new FeatureDefinition("PERMISSION", "Permission Management", "SSO",
                                        "Access to permission and action catalog",
                                        List.of("READ", "WRITE", "DELETE")),
                        new FeatureDefinition("ORGANIZATION_PERMISSIONS", "Organization Permission Catalog", "SSO",
                                        "Access to view and manage organization permission catalog and matrix",
                                        List.of("READ", "WRITE")),
                        new FeatureDefinition("ORGANIZATION_ROLE_TEMPLATES", "Organization Role Templates", "SSO",
                                        "Access to manage organization role templates and company role mapping",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE")),
                        new FeatureDefinition("ORGANIZATION_MEMBERS", "Organization Members", "SSO",
                                        "Access to manage organization members and invitations",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE")),
                        new FeatureDefinition("NOTIFICATIONS", "Notification Services", "CORE",
                                        "Access to receive and manage system alerts and emails"),
                        new FeatureDefinition("WORKFLOW_DEFINITIONS", "Workflow Definitions", "WORKFLOW",
                                        "Access to create, configure, activate, and manage workflow definitions",
                                        List.of("READ", "CREATE", "UPDATE", "WRITE", "DELETE", "ACTIVATE",
                                                        "DEACTIVATE")),
                        new FeatureDefinition("WORKFLOW_TRANSACTIONS", "Workflow Transactions", "WORKFLOW",
                                        "Access to view, initiate, and manage workflow transactions",
                                        List.of("READ", "CREATE", "UPDATE", "WRITE", "DELETE", "CANCEL")),
                        new FeatureDefinition("WORKFLOW_TASKS", "Workflow Tasks", "WORKFLOW",
                                        "Access to approve, reject, return, delegate, and manage workflow tasks",
                                        List.of("READ", "WRITE", "APPROVE", "REJECT", "RETURN", "DELEGATE")),
                        new FeatureDefinition("WORKFLOW_NOTIFICATIONS", "Workflow Notifications", "WORKFLOW",
                                        "Access to workflow notification services",
                                        List.of("READ", "WRITE", "UPDATE")),
                        new FeatureDefinition("WORKFLOW_ATTACHMENTS", "Workflow Attachments", "WORKFLOW",
                                        "Access to workflow attachments",
                                        List.of("READ", "CREATE", "WRITE", "DELETE")),
                        new FeatureDefinition("WORKFLOW_CALLBACKS", "Workflow Callbacks", "WORKFLOW",
                                        "Access to workflow callback logs and retry operations",
                                        List.of("READ", "WRITE", "UPDATE")),
                        new FeatureDefinition("WORKFLOW_DOCUMENT_FLOWS", "Workflow Document Flows", "WORKFLOW",
                                        "Access to workflow document flows and configurations",
                                        List.of("READ", "CREATE", "UPDATE", "WRITE", "DELETE")),
                        // ── Manufacturing Features ──────────────────────────────────────────────
                        new FeatureDefinition("MANUFACTURING", "Manufacturing Module", "MANUFACTURING",
                                        "Access to the Manufacturing module — production orders, BOMs, and operations",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "SUBMIT", "APPROVE",
                                                        "REJECT", "RELEASE", "COMPLETE", "CONSUME", "RESERVE",
                                                        "CANCEL")),
                        new FeatureDefinition("MFG_BOM", "Bill of Materials", "MANUFACTURING",
                                        "Access to create, view, edit, submit and manage Bills of Materials",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "SUBMIT", "APPROVE",
                                                        "REJECT")),
                        new FeatureDefinition("MFG_PRODUCTION", "Production Orders", "MANUFACTURING",
                                        "Access to create, submit, approve, reject, release and manage Production Orders",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "SUBMIT", "APPROVE",
                                                        "REJECT", "RELEASE", "CANCEL")),
                        new FeatureDefinition("MFG_OPERATIONS", "Production Operations", "MANUFACTURING",
                                        "Access to record material consumption, production completion and scrap",
                                        List.of("READ", "CREATE", "WRITE", "COMPLETE", "CONSUME", "RESERVE",
                                                        "CANCEL")),
                        // ── CRM Features ──────────────────────────────────────────────────────────
                        new FeatureDefinition("CRM", "CRM Module", "CRM",
                                        "Access to the Customer Relationship Management module",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "MANAGE")),
                        new FeatureDefinition("CRM_LEADS", "CRM Leads", "CRM",
                                        "Access to lead management, qualification, assignment, conversion and import",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "ASSIGN", "MERGE", "CONVERT", "IMPORT", "EXPORT")),
                        new FeatureDefinition("CRM_ACCOUNTS", "CRM Accounts & Contacts", "CRM",
                                        "Access to corporate accounts, contacts, and ERP customer onboarding",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "ONBOARD", "EXPORT")),
                        new FeatureDefinition("CRM_OPPORTUNITIES", "CRM Deals & Pipelines", "CRM",
                                        "Access to sales pipelines, kanban board, stage progression, and deals",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "CLOSE", "EXPORT")),
                        new FeatureDefinition("CRM_QUOTATIONS", "CRM Quotations", "CRM",
                                        "Access to commercial quotations, GST calculation, approvals, and order conversion",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "SUBMIT_APPROVAL", "APPROVE", "CONVERT_ORDER", "EXPORT")),
                        new FeatureDefinition("CRM_ACTIVITIES", "CRM Activities & Tasks", "CRM",
                                        "Access to customer interaction timeline, schedule follow-ups, and tasks",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "COMPLETE")),
                        new FeatureDefinition("CRM_COMMUNICATION", "CRM Omnichannel Communication", "CRM",
                                        "Access to WhatsApp, SMS, Email threads, and telephony CDRs",
                                        List.of("READ", "CREATE", "WRITE", "SEND")),
                        new FeatureDefinition("COMMUNICATION_CHAT", "Internal Company Chat & Quotation Requests", "CRM",
                                        "Access to internal company chat channels, quotation requests, and real-time STOMP messaging",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "SEND")),
                        new FeatureDefinition("CRM_INTEGRATIONS", "CRM Integrations & Ingestion", "CRM",
                                        "Access to marketplace connectors, inbound webhooks, and manual sync",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "EXECUTE")),
                        new FeatureDefinition("CRM_AUTOMATION", "CRM Automation Engine", "CRM",
                                        "Access to rule-based automation triggers, actions, and round-robin pools",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "MANAGE", "EXECUTE")),
                        new FeatureDefinition("CRM_CAMPAIGNS", "CRM Campaigns & Marketing Attribution", "CRM",
                                        "Access to marketing campaigns, spend tracking, ROI, and multi-touch attribution",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "EXPORT")),
                        new FeatureDefinition("CRM_SETTINGS", "CRM Settings & Master Data", "CRM",
                                        "Access to tenant CRM operations, custom fields, lead statuses, sources, and tags",
                                        List.of("READ", "CREATE", "WRITE", "UPDATE", "DELETE", "MANAGE")));

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
                                                log.info("Registered FBAC Feature: code={}, module={}", def.code(),
                                                                def.moduleName());
                                                return saved;
                                        });

                        List<String> actions = def.actions() != null && !def.actions().isEmpty() ? def.actions()
                                        : DEFAULT_ACTIONS;
                        for (String action : actions) {
                                String permissionCode = feature.getCode() + ":" + action;
                                featurePermissionRepository.findByPermissionCodeIgnoreCase(permissionCode)
                                                .ifPresentOrElse(
                                                                existing -> log.debug(
                                                                                "Feature permission [{}] already exists.",
                                                                                permissionCode),
                                                                () -> {
                                                                        com.erp.auth_service.model.FeaturePermission fp = com.erp.auth_service.model.FeaturePermission
                                                                                        .builder()
                                                                                        .feature(feature)
                                                                                        .action(action)
                                                                                        .permissionCode(permissionCode)
                                                                                        .description(action
                                                                                                        + " access for feature "
                                                                                                        + feature.getName())
                                                                                        .active(true)
                                                                                        .build();
                                                                        featurePermissionRepository.save(fp);
                                                                        log.info("Registered Feature Permission: {}",
                                                                                        permissionCode);
                                                                });
                        }
                }

                log.info("FBAC Feature Catalog and Action Permissions bootstrap completed successfully.");
        }
}
