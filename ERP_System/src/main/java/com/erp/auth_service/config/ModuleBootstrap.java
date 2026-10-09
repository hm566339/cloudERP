package com.erp.auth_service.config;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.erp.auth_service.model.Module;
import com.erp.auth_service.model.ModuleRoute;
import com.erp.auth_service.repository.ModuleRepository;
import com.erp.auth_service.repository.ModuleRouteRepository;

import lombok.RequiredArgsConstructor;

@Component
@Order(1)
@RequiredArgsConstructor
public class ModuleBootstrap implements CommandLineRunner {

        private final ModuleRepository moduleRepository;
        private final ModuleRouteRepository moduleRouteRepository;

        @Value("${api.internal-base:http://auth-service:8090}")
        private String INTERNAL_BASE_URL;

        @Override
        public void run(String... args) {

                Module systemAdminModule = moduleRepository
                                .findByNameIgnoreCase("SYSTEM_ADMIN")
                                .orElseGet(() -> {

                                        Module module = Module.builder()
                                                        .name("SYSTEM_ADMIN")
                                                        .clientId(UUID.randomUUID())
                                                        .clientSecret(UUID.randomUUID().toString())
                                                        .host("system-admin.local")
                                                        .moduleStatus(true)
                                                        .build();

                                        return moduleRepository.save(module);
                                });

                String routePattern = "/api/sso/**";

                ModuleRoute moduleRoute = moduleRouteRepository.findByApiPattern(routePattern)
                                .orElseGet(() -> ModuleRoute.builder()
                                                .module(systemAdminModule)
                                                .apiPattern(routePattern)
                                                .routeOrder(1)
                                                .build());

                // Ensure the route always points to the internal Docker service URL and is
                // active
                moduleRoute.setModule(systemAdminModule);
                moduleRoute.setServiceUrl(INTERNAL_BASE_URL);
                moduleRoute.setActive(true);
                moduleRouteRepository.save(moduleRoute);

                System.out.println("==============================================");
                System.out.println("SYSTEM ADMIN MODULE REGISTERED");
                System.out.println("MODULE : SYSTEM_ADMIN");
                System.out.println("ROUTE  : " + routePattern);
                System.out.println("TARGET : " + INTERNAL_BASE_URL);
                System.out.println("==============================================");

                // Ensure canonical standard ERP modules exist (idempotent)
                bootstrapModuleIfMissing("ACCOUNT", "account-service.local", "/api/account/**",
                                "http://account-service:8081");
                bootstrapModuleIfMissing("INVENTORY", "inventory-service.local", "/api/inventory/**",
                                "http://inventory-service:8082");
                bootstrapModuleIfMissing("WORKFLOW", "workflow-service.local", "/api/v1/workflow/**",
                                "http://workflow-service:8083");
                bootstrapRouteIfMissing("WORKFLOW", "/api/workflow/**",
                                "http://workflow-service:8083");
                bootstrapModuleIfMissing("CRM", "crm-service.local", "/api/crm/**",
                                "http://crm-service:8084");
        }

        private void bootstrapRouteIfMissing(String moduleName, String routePattern, String serviceUrl) {
                Module module = moduleRepository.findByNameIgnoreCase(moduleName).orElse(null);
                if (module != null && routePattern != null && serviceUrl != null) {
                        ModuleRoute moduleRoute = moduleRouteRepository.findByApiPattern(routePattern)
                                        .orElseGet(() -> ModuleRoute.builder()
                                                        .module(module)
                                                        .apiPattern(routePattern)
                                                        .routeOrder(10)
                                                        .build());
                        moduleRoute.setModule(module);
                        moduleRoute.setServiceUrl(serviceUrl);
                        moduleRoute.setActive(true);
                        moduleRouteRepository.save(moduleRoute);
                }
        }

        private void bootstrapModuleIfMissing(String moduleName, String host, String routePattern, String serviceUrl) {
                Module module = moduleRepository.findByNameIgnoreCase(moduleName)
                                .orElseGet(() -> {
                                        Module newModule = Module.builder()
                                                        .name(moduleName)
                                                        .clientId(UUID.randomUUID())
                                                        .clientSecret(UUID.randomUUID().toString())
                                                        .host(host)
                                                        .moduleStatus(true)
                                                        .build();
                                        return moduleRepository.save(newModule);
                                });

                if (routePattern != null && serviceUrl != null) {
                        ModuleRoute moduleRoute = moduleRouteRepository.findByApiPattern(routePattern)
                                        .orElseGet(() -> ModuleRoute.builder()
                                                        .module(module)
                                                        .apiPattern(routePattern)
                                                        .routeOrder(10)
                                                        .build());
                        moduleRoute.setModule(module);
                        moduleRoute.setServiceUrl(serviceUrl);
                        moduleRoute.setActive(true);
                        moduleRouteRepository.save(moduleRoute);
                }
        }
}