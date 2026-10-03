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

                // Ensure the route always points to the internal Docker service URL and is active
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
        }
}