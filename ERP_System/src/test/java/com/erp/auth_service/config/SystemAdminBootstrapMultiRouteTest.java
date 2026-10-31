package com.erp.auth_service.config;

import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.model.ModuleRoute;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.model.User;
import com.erp.auth_service.model.UserPortalAccess;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SystemAdminBootstrapMultiRouteTest {

    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserRoleRepository userRoleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private ModuleRepository moduleRepository;
    @Mock
    private ModuleRouteRepository moduleRouteRepository;
    @Mock
    private CompanyModuleRepository companyModuleRepository;
    @Mock
    private UserPortalAccessRepository userPortalAccessRepository;

    @InjectMocks
    private SystemAdminBootstrap systemAdminBootstrap;

    private Company systemCompany;
    private Role systemRole;
    private User systemAdminUser;
    private Module adminModule;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(systemAdminBootstrap, "hostname", "http://auth-service:8090");
        ReflectionTestUtils.setField(systemAdminBootstrap, "email", "admin@mark2.in");
        ReflectionTestUtils.setField(systemAdminBootstrap, "password", "Admin@123");

        systemCompany = Company.builder().id(UUID.randomUUID()).companyCode("000000").companyName("System Company").active(true).build();
        systemRole = Role.builder().id(UUID.randomUUID()).company(systemCompany).name("SYSTEM_ADMIN").status(true).build();
        systemAdminUser = User.builder().id(UUID.randomUUID()).company(systemCompany).username("System001").email("admin@mark2.in").accountStatus(AccountStatus.ACTIVE).emailStatus(Status.VERIFIED).build();
        adminModule = Module.builder().id(UUID.randomUUID()).name("SYSTEM_ADMIN").clientId(UUID.randomUUID()).clientSecret("secret").host("system-admin.local").moduleStatus(true).build();

        when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(systemCompany));
        when(roleRepository.findByCompany_IdAndNameIgnoreCase(systemCompany.getId(), "SYSTEM_ADMIN")).thenReturn(Optional.of(systemRole));
        when(userRepository.findByCompany_IdAndUsernameIgnoreCase(systemCompany.getId(), "System001")).thenReturn(Optional.of(systemAdminUser));
        when(userRoleRepository.roleExists(systemAdminUser.getId(), systemRole.getId())).thenReturn(true);
        when(moduleRepository.findByNameIgnoreCase("SYSTEM_ADMIN")).thenReturn(Optional.of(adminModule));

        CompanyModule companyModule = CompanyModule.builder().id(UUID.randomUUID()).company(systemCompany).module(adminModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndModule_Id(systemCompany.getId(), adminModule.getId())).thenReturn(Optional.of(companyModule));
        when(userPortalAccessRepository.findByUser_IdAndCompanyModule_Id(systemAdminUser.getId(), companyModule.getId())).thenReturn(Optional.of(
                UserPortalAccess.builder().id(UUID.randomUUID()).user(systemAdminUser).companyModule(companyModule).status(true).build()
        ));
    }

    @Test
    @DisplayName("Successfully starts even when SYSTEM_ADMIN has multiple routes registered in the database")
    void testSystemAdminBootstrapWithMultipleRoutes() {
        // Given: SYSTEM_ADMIN has 3 routes registered in DB
        ModuleRoute ssoRoute = ModuleRoute.builder().id(UUID.randomUUID()).module(adminModule).apiPattern("/api/sso/**").serviceUrl("http://auth-service:8090").active(true).build();
        ModuleRoute settingsRoute = ModuleRoute.builder().id(UUID.randomUUID()).module(adminModule).apiPattern("/api/settings/**").serviceUrl("http://auth-service:8090").active(true).build();
        ModuleRoute orgRoute = ModuleRoute.builder().id(UUID.randomUUID()).module(adminModule).apiPattern("/api/organization/**").serviceUrl("http://auth-service:8090").active(true).build();

        when(moduleRouteRepository.findByModule_Id(adminModule.getId())).thenReturn(List.of(ssoRoute, settingsRoute, orgRoute));
        when(moduleRouteRepository.findByApiPattern("/api/sso/**")).thenReturn(Optional.of(ssoRoute));
        when(moduleRouteRepository.findByModule_IdAndApiPatternIgnoreCase(adminModule.getId(), "/api/sso/**")).thenReturn(Optional.of(ssoRoute));
        when(moduleRouteRepository.save(any(ModuleRoute.class))).thenAnswer(inv -> inv.getArgument(0));

        // When & Then: Bootstrap must run cleanly without throwing IncorrectResultSizeDataAccessException
        assertThatCode(() -> systemAdminBootstrap.run())
                .doesNotThrowAnyException();

        ArgumentCaptor<ModuleRoute> captor = ArgumentCaptor.forClass(ModuleRoute.class);
        verify(moduleRouteRepository).save(captor.capture());

        ModuleRoute savedRoute = captor.getValue();
        assertThat(savedRoute.getApiPattern()).isEqualTo("/api/sso/**");
        assertThat(savedRoute.getServiceUrl()).isEqualTo("http://auth-service:8090");
        assertThat(savedRoute.getActive()).isTrue();
    }
}
