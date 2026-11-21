package com.erp.gateway_service.config;

import com.erp.gateway_service.dto.ModuleRouteResponse;
import com.erp.gateway_service.service.RouteProviderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

@Configuration
public class GatewayConfig {

    private static final Logger log = LoggerFactory.getLogger(GatewayConfig.class);

    private final RouteProviderService routeProviderService;

    @Value("${auth.service.base-url:${auth.server.base-uri:http://auth-service:8090}}")
    private String authServiceBaseUrl;

    public GatewayConfig(RouteProviderService routeProviderService) {
        this.routeProviderService = routeProviderService;
    }

    public void setAuthServiceBaseUrl(String authServiceBaseUrl) {
        this.authServiceBaseUrl = authServiceBaseUrl;
    }

    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder builder) {

        RouteLocatorBuilder.Builder routes = builder.routes();

        List<ModuleRouteResponse> fetchedRoutes;

        try {
            fetchedRoutes = routeProviderService.getRoutes();
        } catch (Exception ex) {
            log.error("Failed to load routes from Auth Service", ex);
            fetchedRoutes = List.of();
        }

        int candidateCount = fetchedRoutes == null ? 0 : fetchedRoutes.size();
        log.info("Fetched {} route candidate(s) from auth service", candidateCount);

        if (fetchedRoutes == null || fetchedRoutes.isEmpty()) {
            log.warn("No dynamic routes were available from auth service; gateway will start with zero dynamic routes.");
            fetchedRoutes = List.of();
        }

        AtomicInteger registeredRoutes = new AtomicInteger();
        Set<String> registeredRouteIds = new HashSet<>();
        java.util.concurrent.atomic.AtomicBoolean hasCrmRoute = new java.util.concurrent.atomic.AtomicBoolean(false);

        fetchedRoutes.stream()
                .peek(route -> log.debug("Evaluating route candidate: {}", route))
                .filter(route -> {
                    if (route == null) {
                        log.warn("Skipping null route payload");
                        return false;
                    }
                    if (route.getId() == null) {
                        log.warn("Skipping route with null id: {}", route);
                        return false;
                    }
                    if (!Boolean.TRUE.equals(route.getActive())) {
                        log.warn("Skipping inactive route: id={}, active={}", route.getId(), route.getActive());
                        return false;
                    }
                    if (!StringUtils.hasText(route.getApiPattern())
                            || !StringUtils.hasText(StringUtils.trimWhitespace(route.getApiPattern()))) {
                        log.warn("Skipping route with blank apiPattern: id={}", route.getId());
                        return false;
                    }
                    if (!StringUtils.hasText(route.getServiceUrl())
                            || !StringUtils.hasText(StringUtils.trimWhitespace(route.getServiceUrl()))) {
                        log.warn("Skipping route with blank serviceUrl: id={}", route.getId());
                        return false;
                    }
                    String serviceUrl = StringUtils.trimWhitespace(route.getServiceUrl());
                    if (!isValidUri(serviceUrl)) {
                        log.warn("Skipping route with invalid serviceUrl format or scheme: id={}, serviceUrl={}",
                                route.getId(), serviceUrl);
                        return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(
                        route -> route.getRouteOrder() == null ? 0 : route.getRouteOrder()))
                .forEach(route -> {
                    try {
                        String routeIdStr = route.getId().toString();
                        if (!registeredRouteIds.add(routeIdStr)) {
                            log.warn("Skipping duplicate route id: {}", routeIdStr);
                            return;
                        }

                        String pattern = StringUtils.trimWhitespace(route.getApiPattern());
                        String serviceUrl = StringUtils.trimWhitespace(route.getServiceUrl());

                        if (!pattern.startsWith("/")) {
                            pattern = "/" + pattern;
                        }

                        // Remove trailing slashes to prevent malformed double-slash target URIs
                        while (serviceUrl.endsWith("/")) {
                            serviceUrl = serviceUrl.substring(0, serviceUrl.length() - 1);
                        }

                        // Prevent routing loop if auth route was registered with public external URL or duplicate /api/sso path
                        if (pattern.startsWith("/api/sso") && (serviceUrl.contains("mark2.in") || serviceUrl.endsWith("/api/sso"))) {
                            String internalTarget = StringUtils.hasText(authServiceBaseUrl) ? authServiceBaseUrl.trim() : "http://auth-service:8090";
                            while (internalTarget.endsWith("/")) {
                                internalTarget = internalTarget.substring(0, internalTarget.length() - 1);
                            }
                            log.warn("Overriding external/public serviceUrl '{}' for auth route {} with internal service URL: {}",
                                    serviceUrl, pattern, internalTarget);
                            serviceUrl = internalTarget;
                        }

                        // Map CRM route to correct service URL & resolve docker hostname for local development
                        if (pattern.startsWith("/api/crm")) {
                            hasCrmRoute.set(true);
                            if (authServiceBaseUrl.contains("localhost") && serviceUrl.contains("sales-crm:8086")) {
                                log.info("Mapping docker hostname 'sales-crm:8086' to 'localhost:8086' for local gateway");
                                serviceUrl = serviceUrl.replace("sales-crm:8086", "localhost:8086");
                            } else if (serviceUrl.contains(":8083")) {
                                log.warn("Overriding erroneous port 8083 with 8086 for CRM serviceUrl: {}", serviceUrl);
                                serviceUrl = serviceUrl.replace(":8083", ":8086");
                            }
                        }

                        log.info("Registering route: id={}, apiPattern={}, serviceUrl={}, order={}",
                                route.getId(), pattern, serviceUrl, route.getRouteOrder());

                        final String finalPattern = pattern;
                        final String finalServiceUrl = serviceUrl;

                        routes.route(
                                routeIdStr,
                                r -> r
                                        .path(finalPattern)
                                        .uri(finalServiceUrl));
                        registeredRoutes.incrementAndGet();

                    } catch (Exception ex) {
                        log.error("Error while registering route id={}: {}", route.getId(), ex.getMessage(), ex);
                    }
                });

        if (!hasCrmRoute.get()) {
            String crmTarget = authServiceBaseUrl.contains("localhost") ? "http://localhost:8086" : "http://sales-crm:8086";
            log.info("No dynamic CRM route found in module_route; registering default CRM route: /api/crm/** -> {}", crmTarget);
            routes.route("default-crm-route", r -> r.path("/api/crm/**").uri(crmTarget));
            registeredRoutes.incrementAndGet();
        }

        log.info("Built RouteLocator with {} registered route(s)", registeredRoutes.get());
        return routes.build();
    }

    private boolean isValidUri(String uriString) {
        if (!StringUtils.hasText(uriString)) {
            return false;
        }
        try {
            URI uri = URI.create(uriString.trim());
            return uri.isAbsolute()
                    && uri.getScheme() != null
                    && ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && StringUtils.hasText(uri.getHost());
        } catch (Exception ex) {
            return false;
        }
    }
}