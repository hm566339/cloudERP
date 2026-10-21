package com.erp.gateway_service.config;

import com.erp.gateway_service.dto.ModuleRouteResponse;
import com.erp.gateway_service.service.RouteProviderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.support.GenericApplicationContext;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GatewayConfigTest {

    @Mock
    private RouteProviderService routeProviderService;

    private GatewayConfig gatewayConfig;
    private RouteLocatorBuilder builder;

    @BeforeEach
    void setUp() {
        gatewayConfig = new GatewayConfig(routeProviderService);
        gatewayConfig.setAuthServiceBaseUrl("http://auth-service:8090");

        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(org.springframework.cloud.gateway.handler.predicate.PathRoutePredicateFactory.class,
                () -> new org.springframework.cloud.gateway.handler.predicate.PathRoutePredicateFactory(
                        new org.springframework.boot.webflux.autoconfigure.WebFluxProperties()));
        context.refresh();

        builder = new RouteLocatorBuilder(context);
    }

    private ModuleRouteResponse createRoute(UUID id, String moduleName, String apiPattern, String serviceUrl,
            Integer order, Boolean active) {
        ModuleRouteResponse route = new ModuleRouteResponse();
        route.setId(id);
        route.setModuleName(moduleName);
        route.setApiPattern(apiPattern);
        route.setServiceUrl(serviceUrl);
        route.setRouteOrder(order);
        route.setActive(active);
        return route;
    }

    @Test
    @DisplayName("Should register valid dynamic routes from SSO/Auth Service with path and URI normalization")
    void testRegistersValidDynamicRoutes() {
        UUID wfRouteId = UUID.randomUUID();
        UUID accRouteId = UUID.randomUUID();

        ModuleRouteResponse wfRoute = createRoute(wfRouteId, "WORKFLOW", "/api/v1/workflow/**",
                "http://workflow-service:8083", 2, true);
        // Test normalization: leading slash added to pattern, trailing slash removed from serviceUrl
        ModuleRouteResponse accRoute = createRoute(accRouteId, "ACCOUNT", "api/account/**",
                "http://account-service:8080/", 1, true);

        when(routeProviderService.getRoutes()).thenReturn(List.of(wfRoute, accRoute));

        RouteLocator routeLocator = gatewayConfig.routeLocator(builder);
        List<Route> routes = routeLocator.getRoutes().collectList().block();

        assertNotNull(routes);
        assertEquals(2, routes.size());

        Route registeredWf = routes.stream().filter(r -> r.getId().equals(wfRouteId.toString())).findFirst()
                .orElse(null);
        assertNotNull(registeredWf);
        assertEquals(URI.create("http://workflow-service:8083"), registeredWf.getUri());

        Route registeredAcc = routes.stream().filter(r -> r.getId().equals(accRouteId.toString())).findFirst()
                .orElse(null);
        assertNotNull(registeredAcc);
        assertEquals(URI.create("http://account-service:8080"), registeredAcc.getUri());
    }

    @Test
    @DisplayName("Should skip null, inactive, duplicate, missing-ID, and invalid-URI routes")
    void testSkipsInactiveNullDuplicateAndInvalidRoutes() {
        UUID validId = UUID.randomUUID();
        UUID dupId = UUID.randomUUID();

        List<ModuleRouteResponse> mixedRoutes = new ArrayList<>();
        // 1. null route
        mixedRoutes.add(null);
        // 2. null ID
        mixedRoutes.add(createRoute(null, "NO_ID", "/api/noid/**", "http://noid-service:8080", 1, true));
        // 3. inactive route
        mixedRoutes.add(createRoute(UUID.randomUUID(), "INACTIVE", "/api/inactive/**", "http://inactive:8080", 1, false));
        // 4. blank apiPattern
        mixedRoutes.add(createRoute(UUID.randomUUID(), "BLANK_PAT", "   ", "http://blank-pat:8080", 1, true));
        // 5. blank serviceUrl
        mixedRoutes.add(createRoute(UUID.randomUUID(), "BLANK_URL", "/api/blankurl/**", "   ", 1, true));
        // 6. invalid scheme (ftp)
        mixedRoutes.add(createRoute(UUID.randomUUID(), "FTP_URL", "/api/ftp/**", "ftp://fileserver/path", 1, true));
        // 7. invalid URI format (no host or malformed)
        mixedRoutes.add(createRoute(UUID.randomUUID(), "BAD_URL", "/api/bad/**", "http:///no-host", 1, true));
        // 8. duplicate route
        mixedRoutes.add(createRoute(dupId, "DUP1", "/api/dup1/**", "http://dup-service:8080", 1, true));
        mixedRoutes.add(createRoute(dupId, "DUP2", "/api/dup2/**", "http://dup-service:8080", 2, true));
        // 9. valid route
        mixedRoutes.add(createRoute(validId, "INVENTORY", "/api/inventory/**", "http://inventory-service:8082", 3, true));

        when(routeProviderService.getRoutes()).thenReturn(mixedRoutes);

        RouteLocator routeLocator = gatewayConfig.routeLocator(builder);
        List<Route> routes = routeLocator.getRoutes().collectList().block();

        assertNotNull(routes);
        // Only dup1 (first occurrence) and validId should be registered (total 2)
        assertEquals(2, routes.size());

        assertTrue(routes.stream().anyMatch(r -> r.getId().equals(validId.toString())));
        assertTrue(routes.stream().anyMatch(r -> r.getId().equals(dupId.toString())));
    }

    @Test
    @DisplayName("Should register workflow route only when supplied by SSO/Auth Service")
    void testWorkflowRouteRegisteredOnlyWhenSuppliedByAuthService() {
        UUID wfRouteId = UUID.randomUUID();
        ModuleRouteResponse wfRoute = createRoute(wfRouteId, "WORKFLOW", "/api/v1/workflow/**",
                "http://workflow-service:8083", 1, true);

        when(routeProviderService.getRoutes()).thenReturn(List.of(wfRoute));

        RouteLocator routeLocator = gatewayConfig.routeLocator(builder);
        List<Route> routes = routeLocator.getRoutes().collectList().block();

        assertNotNull(routes);
        assertEquals(1, routes.size());
        assertEquals(wfRouteId.toString(), routes.get(0).getId());
        assertEquals(URI.create("http://workflow-service:8083"), routes.get(0).getUri());
    }

    @Test
    @DisplayName("Should NOT register hardcoded fallback route when workflow route is missing from SSO")
    void testNoWorkflowSpecificFallbackWhenWorkflowRouteMissing() {
        UUID accRouteId = UUID.randomUUID();
        ModuleRouteResponse accRoute = createRoute(accRouteId, "ACCOUNT", "/api/account/**",
                "http://account-service:8080", 1, true);

        when(routeProviderService.getRoutes()).thenReturn(List.of(accRoute));

        RouteLocator routeLocator = gatewayConfig.routeLocator(builder);
        List<Route> routes = routeLocator.getRoutes().collectList().block();

        assertNotNull(routes);
        assertEquals(1, routes.size());
        assertEquals(accRouteId.toString(), routes.get(0).getId());

        // Verify no workflow-service-default fallback exists
        assertFalse(routes.stream().anyMatch(r -> "workflow-service-default".equals(r.getId())));
        assertFalse(routes.stream().anyMatch(r -> r.getUri().toString().contains("8083")));
    }

    @Test
    @DisplayName("Should gracefully handle route loading failure and start gateway with zero dynamic routes")
    void testRouteLoadingFailureGracefullyStartsGatewayWithZeroRoutes() {
        when(routeProviderService.getRoutes()).thenThrow(new RuntimeException("Connection refused: auth-service"));

        assertDoesNotThrow(() -> {
            RouteLocator routeLocator = gatewayConfig.routeLocator(builder);
            List<Route> routes = routeLocator.getRoutes().collectList().block();
            assertNotNull(routes);
            assertEquals(0, routes.size());
        });
    }

    @Test
    @DisplayName("Should gracefully handle null route list returned by RouteProviderService")
    void testNullRouteListStartsGatewayWithZeroRoutes() {
        when(routeProviderService.getRoutes()).thenReturn(null);

        assertDoesNotThrow(() -> {
            RouteLocator routeLocator = gatewayConfig.routeLocator(builder);
            List<Route> routes = routeLocator.getRoutes().collectList().block();
            assertNotNull(routes);
            assertEquals(0, routes.size());
        });
    }

    @Test
    @DisplayName("Should override external/public auth route URLs to prevent routing loops")
    void testAuthServiceInternalUrlOverridePreventsRoutingLoops() {
        UUID ssoRouteId = UUID.randomUUID();
        ModuleRouteResponse ssoRoute = createRoute(ssoRouteId, "AUTH", "/api/sso/**",
                "https://mark2.in/api/sso", 1, true);

        when(routeProviderService.getRoutes()).thenReturn(List.of(ssoRoute));

        RouteLocator routeLocator = gatewayConfig.routeLocator(builder);
        List<Route> routes = routeLocator.getRoutes().collectList().block();

        assertNotNull(routes);
        assertEquals(1, routes.size());
        assertEquals(URI.create("http://auth-service:8090"), routes.get(0).getUri());
    }

    @Test
    @DisplayName("Should dynamically resolve and forward Manufacturing routes from SSO database")
    void testManufacturingDynamicRouteRegistration() {
        UUID mfgRouteId = UUID.randomUUID();
        UUID bomRouteId = UUID.randomUUID();

        ModuleRouteResponse mfgRoute = createRoute(mfgRouteId, "MANUFACTURING", "/api/manufacturing/**",
                "http://manufacturing-service:8085", 10, true);
        ModuleRouteResponse bomRoute = createRoute(bomRouteId, "MANUFACTURING", "/api/boms/**",
                "http://manufacturing-service:8085", 10, true);

        when(routeProviderService.getRoutes()).thenReturn(List.of(mfgRoute, bomRoute));

        RouteLocator routeLocator = gatewayConfig.routeLocator(builder);
        List<Route> routes = routeLocator.getRoutes().collectList().block();

        assertNotNull(routes);
        assertEquals(2, routes.size());

        Route resolvedMfg = routes.stream()
                .filter(r -> r.getId().equals(mfgRouteId.toString()))
                .findFirst()
                .orElse(null);
        assertNotNull(resolvedMfg);
        assertEquals(URI.create("http://manufacturing-service:8085"), resolvedMfg.getUri());

        Route resolvedBom = routes.stream()
                .filter(r -> r.getId().equals(bomRouteId.toString()))
                .findFirst()
                .orElse(null);
        assertNotNull(resolvedBom);
        assertEquals(URI.create("http://manufacturing-service:8085"), resolvedBom.getUri());
    }
}
