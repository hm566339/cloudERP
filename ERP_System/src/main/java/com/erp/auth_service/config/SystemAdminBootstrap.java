package com.erp.auth_service.config;

import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.model.ModuleRoute;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.model.User;
import com.erp.auth_service.model.UserPortalAccess;
import com.erp.auth_service.model.UserRole;
import com.erp.auth_service.repository.CompanyModuleRepository;
import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.repository.ModuleRepository;
import com.erp.auth_service.repository.ModuleRouteRepository;
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.repository.UserPortalAccessRepository;
import com.erp.auth_service.repository.UserRepository;
import com.erp.auth_service.repository.UserRoleRepository;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.Status;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@Component
@Order(2)
@RequiredArgsConstructor
public class SystemAdminBootstrap implements CommandLineRunner {

        @Value("${api.internal-base:http://auth-service:8090}")
        private String hostname;

        private final CompanyRepository companyRepository;
        private final RoleRepository roleRepository;
        private final UserRepository userRepository;
        private final UserRoleRepository userRoleRepository;
        private final PasswordEncoder passwordEncoder;

        private final ModuleRepository moduleRepository;
        private final ModuleRouteRepository moduleRouteRepository;
        private final CompanyModuleRepository companyModuleRepository;
        private final UserPortalAccessRepository userPortalAccessRepository;

        @Value("${system.admin.email}")
        private String email;

        @Value("${system.admin.password}")
        private String password;

        @Override
        public void run(String... args) {

                /*
                 * SYSTEM COMPANY
                 */
                Company systemCompany = companyRepository
                                .findByCompanyCode("000000")
                                .orElseGet(() -> companyRepository.save(
                                                Company.builder()
                                                                .companyCode("000000")
                                                                .companyName("System Company")
                                                                .active(true)
                                                                .build()));

                /*
                 * SYSTEM ADMIN ROLE
                 */
                Role systemAdminRole = roleRepository
                                .findByCompany_IdAndNameIgnoreCase(
                                                systemCompany.getId(),
                                                "SYSTEM_ADMIN")
                                .orElseGet(() -> roleRepository.save(
                                                Role.builder()
                                                                .company(systemCompany)
                                                                .name("SYSTEM_ADMIN")
                                                                .status(true)
                                                                .build()));

                /*
                 * SYSTEM ADMIN USER
                 */
                Optional<User> existingUser = userRepository.findByCompany_IdAndUsernameIgnoreCase(
                                systemCompany.getId(),
                                "System001");

                if (existingUser.isEmpty()) {
                        existingUser = userRepository.findByCompany_IdAndEmailIgnoreCase(
                                        systemCompany.getId(),
                                        email);
                }

                User systemAdmin;
                if (existingUser.isPresent()) {
                        systemAdmin = existingUser.get();
                        systemAdmin.setEmail(email);
                        systemAdmin.setPassword(passwordEncoder.encode(password));
                        systemAdmin.setAccountStatus(AccountStatus.ACTIVE);
                        systemAdmin.setEmailStatus(Status.VERIFIED);
                        userRepository.save(systemAdmin);
                } else {
                        systemAdmin = userRepository.save(
                                        User.builder()
                                                        .company(systemCompany)
                                                        .empId("00.00.00.00.00")
                                                        .username("System001")
                                                        .email(email)
                                                        .fullName("System Admin")
                                                        .password(passwordEncoder.encode(password))
                                                        .accountStatus(AccountStatus.ACTIVE)
                                                        .emailStatus(Status.VERIFIED)
                                                        .failedLoginCount(0)
                                                        .build());
                }

                /*
                 * ASSIGN ROLE
                 */
                if (!userRoleRepository.roleExists(
                                systemAdmin.getId(),
                                systemAdminRole.getId())) {

                        userRoleRepository.save(
                                        UserRole.builder()
                                                        .user(systemAdmin)
                                                        .role(systemAdminRole)
                                                        .build());
                }

                /*
                 * SYSTEM_ADMIN MODULE MAPPING
                 * Don't crash application if module
                 * is not yet registered.
                 */
                // Ensure SYSTEM_ADMIN module exists (idempotent)
                Module adminModule = moduleRepository
                                .findByNameIgnoreCase("SYSTEM_ADMIN")
                                .orElseGet(() -> moduleRepository.save(
                                                Module.builder()
                                                                .name("SYSTEM_ADMIN")
                                                                .clientId(java.util.UUID.randomUUID())
                                                                .clientSecret(java.util.UUID.randomUUID().toString())
                                                                .host("system-admin.local")
                                                                .moduleStatus(true)
                                                                .build()));

                ModuleRoute moduleRoute = moduleRouteRepository.findByApiPattern("/api/sso/**")
                                .orElseGet(() -> moduleRouteRepository.findByModule_IdAndApiPatternIgnoreCase(adminModule.getId(), "/api/sso/**")
                                                .orElseGet(() -> ModuleRoute.builder()
                                                                .module(adminModule)
                                                                .apiPattern("/api/sso/**")
                                                                .routeOrder(0)
                                                                .build()));

                moduleRoute.setModule(adminModule);
                moduleRoute.setApiPattern("/api/sso/**");
                moduleRoute.setServiceUrl(hostname);
                moduleRoute.setActive(true);
                moduleRouteRepository.save(moduleRoute);

                // Ensure company-module mapping exists for system company
                CompanyModule companyModule = companyModuleRepository
                                .findByCompany_IdAndModule_Id(
                                                systemCompany.getId(),
                                                adminModule.getId())
                                .orElseGet(() -> companyModuleRepository.save(
                                                CompanyModule.builder()
                                                                .company(systemCompany)
                                                                .module(adminModule)
                                                                .active(true)
                                                                .build()));

                // Ensure user has portal access
                userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_Id(
                                                systemAdmin.getId(),
                                                companyModule.getId())
                                .orElseGet(() -> userPortalAccessRepository.save(
                                                UserPortalAccess.builder()
                                                                .user(systemAdmin)
                                                                .companyModule(companyModule)
                                                                .status(true)
                                                                .build()));

                System.out.println("SYSTEM_ADMIN module mapping completed successfully.");

                System.out.println("==============================================");
                System.out.println("SYSTEM_ADMIN setup completed successfully!");
                System.out.println("Company Code : 000000");
                System.out.println("Username     : System001");
                System.out.println("Email        : " + email);
                System.out.println("==============================================");
        }
}
