package com.erp.auth_service.config;

import com.erp.auth_service.model.Module;
import com.erp.auth_service.model.ModuleRoute;
import com.erp.auth_service.repository.ModuleRepository;
import com.erp.auth_service.repository.ModuleRouteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class ModuleBootstrapManufacturingTest {
    @Mock private ModuleRepository moduleRepository;
    @Mock private ModuleRouteRepository moduleRouteRepository;
    @InjectMocks private ModuleBootstrap moduleBootstrap;
    private Module mfgModule;
    private Module stub(String name) { return Module.builder().id(UUID.randomUUID()).name(name).clientId(UUID.randomUUID()).clientSecret("s").host(name.toLowerCase()+".local").moduleStatus(true).build(); }
    private ModuleRoute route(Module m, String p, String u) { return ModuleRoute.builder().module(m).apiPattern(p).serviceUrl(u).active(true).routeOrder(10).build(); }
    @BeforeEach void setUp() {
        Module sa = stub("SYSTEM_ADMIN");
        when(moduleRepository.findByNameIgnoreCase("SYSTEM_ADMIN")).thenReturn(Optional.of(sa));
        when(moduleRouteRepository.findByApiPattern("/api/sso/**")).thenReturn(Optional.of(route(sa,"/api/sso/**","http://auth-service:8090")));
        Module acc=stub("ACCOUNT"); Module inv=stub("INVENTORY"); Module wf=stub("WORKFLOW"); Module crm=stub("CRM");
        when(moduleRepository.findByNameIgnoreCase("ACCOUNT")).thenReturn(Optional.of(acc));
        when(moduleRepository.findByNameIgnoreCase("INVENTORY")).thenReturn(Optional.of(inv));
        when(moduleRepository.findByNameIgnoreCase("WORKFLOW")).thenReturn(Optional.of(wf));
        when(moduleRepository.findByNameIgnoreCase("CRM")).thenReturn(Optional.of(crm));
        when(moduleRouteRepository.findByApiPattern("/api/account/**")).thenReturn(Optional.of(route(acc,"/api/account/**","http://account-service:8080")));
        when(moduleRouteRepository.findByApiPattern("/api/inventory/**")).thenReturn(Optional.of(route(inv,"/api/inventory/**","http://inventory-service:8082")));
        when(moduleRouteRepository.findByApiPattern("/api/v1/workflow/**")).thenReturn(Optional.of(route(wf,"/api/v1/workflow/**","http://workflow-service:8083")));
        when(moduleRouteRepository.findByApiPattern("/api/workflow/**")).thenReturn(Optional.of(route(wf,"/api/workflow/**","http://workflow-service:8083")));
        when(moduleRouteRepository.findByApiPattern("/api/crm/**")).thenReturn(Optional.of(route(crm,"/api/crm/**","http://crm-service:8084")));
        mfgModule = stub("MANUFACTURING");
        when(moduleRepository.findByNameIgnoreCase("MANUFACTURING")).thenReturn(Optional.empty(), Optional.of(mfgModule));
        when(moduleRepository.save(argThat(m -> "MANUFACTURING".equalsIgnoreCase(m.getName())))).thenReturn(mfgModule);
        when(moduleRouteRepository.findByApiPattern("/api/manufacturing/**")).thenReturn(Optional.empty());
        when(moduleRouteRepository.findByApiPattern("/api/boms/**")).thenReturn(Optional.empty());
        when(moduleRouteRepository.save(any(ModuleRoute.class))).thenAnswer(i -> i.getArgument(0));
    }
    @Test @DisplayName("Registers /api/manufacturing/** -> manufacturing-service:8085")
    void testPrimaryRoute() {
        moduleBootstrap.run();
        ArgumentCaptor<ModuleRoute> c = ArgumentCaptor.forClass(ModuleRoute.class);
        verify(moduleRouteRepository, atLeastOnce()).save(c.capture());
        ModuleRoute r = c.getAllValues().stream().filter(x->"/api/manufacturing/**".equals(x.getApiPattern())).findFirst().orElse(null);
        assertThat(r).isNotNull(); assertThat(r.getServiceUrl()).isEqualTo("http://manufacturing-service:8085"); assertThat(r.getActive()).isTrue();
    }
    @Test @DisplayName("Registers /api/boms/** -> manufacturing-service:8085")
    void testBomsRoute() {
        moduleBootstrap.run();
        ArgumentCaptor<ModuleRoute> c = ArgumentCaptor.forClass(ModuleRoute.class);
        verify(moduleRouteRepository, atLeastOnce()).save(c.capture());
        ModuleRoute r = c.getAllValues().stream().filter(x->"/api/boms/**".equals(x.getApiPattern())).findFirst().orElse(null);
        assertThat(r).isNotNull(); assertThat(r.getServiceUrl()).isEqualTo("http://manufacturing-service:8085"); assertThat(r.getActive()).isTrue();
    }
    @Test @DisplayName("Idempotent: no duplicate Module entity saved on re-run")
    void testIdempotent() {
        when(moduleRepository.findByNameIgnoreCase("MANUFACTURING")).thenReturn(Optional.of(mfgModule));
        when(moduleRouteRepository.findByApiPattern("/api/manufacturing/**")).thenReturn(Optional.of(route(mfgModule,"/api/manufacturing/**","http://manufacturing-service:8085")));
        when(moduleRouteRepository.findByApiPattern("/api/boms/**")).thenReturn(Optional.of(route(mfgModule,"/api/boms/**","http://manufacturing-service:8085")));
        moduleBootstrap.run();
        verify(moduleRepository, never()).save(argThat(m -> "MANUFACTURING".equalsIgnoreCase(m.getName())));
        ArgumentCaptor<ModuleRoute> c = ArgumentCaptor.forClass(ModuleRoute.class);
        verify(moduleRouteRepository, atLeastOnce()).save(c.capture());
        List<String> ps = c.getAllValues().stream().map(ModuleRoute::getApiPattern).toList();
        assertThat(ps).contains("/api/manufacturing/**","/api/boms/**");
    }
    @Test @DisplayName("Existing modules (ACCOUNT/INVENTORY/WORKFLOW/CRM) unaffected")
    void testNoRegression() {
        moduleBootstrap.run();
        verify(moduleRepository, atLeastOnce()).findByNameIgnoreCase("ACCOUNT");
        verify(moduleRepository, atLeastOnce()).findByNameIgnoreCase("INVENTORY");
        verify(moduleRepository, atLeastOnce()).findByNameIgnoreCase("WORKFLOW");
        verify(moduleRepository, atLeastOnce()).findByNameIgnoreCase("CRM");
        verify(moduleRepository, atLeastOnce()).findByNameIgnoreCase("MANUFACTURING");
    }
}
