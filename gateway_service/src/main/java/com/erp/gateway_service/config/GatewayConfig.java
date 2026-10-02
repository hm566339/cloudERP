package com.erp.gateway_service.config;

import com.erp.gateway_service.dto.ModuleRouteResponse;
import com.erp.gateway_service.service.RouteProviderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public GatewayConfig(RouteProviderService routeProviderService) {
        this.routeProviderService = routeProviderService;
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
            log.warn(
                    "No dynamic routes were available from auth service; gateway will start with zero dynamic routes.");
        }

        AtomicInteger registeredRoutes = new AtomicInteger();
        Set<String> registeredRouteIds = new HashSet<>();

        fetchedRoutes.stream()
                .peek(route -> log.debug("Evaluating route payload: {}", route))
                .filter(route -> {
                    if (route == null) {
                        log.warn("Skipping null route payload");
                        return false;
                    }
                    if (!Boolean.TRUE.equals(route.getActive())) {
                        log.warn("Skipping inactive route: id={}, active={}", route.getId(), route.getActive());
                        return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(
                        route -> route.getRouteOrder() == null ? 0 : route.getRouteOrder()))
                .forEach(route -> {

                    try {

                        if (route.getId() == null) {
                            // log.warn("Skipping route because id is null");
                            return;
                        }

                        if (!StringUtils.hasText(route.getApiPattern())) {
                            // log.warn("Skipping route {} because apiPattern is empty", route.getId());
                            return;
                        }

                        if (!StringUtils.hasText(route.getServiceUrl())) {
                            // log.warn("Skipping route {} because serviceUrl is empty", route.getId());
                            return;
                        }

                        String pattern = StringUtils.trimWhitespace(route.getApiPattern());
                        String serviceUrl = StringUtils.trimWhitespace(route.getServiceUrl());

                        if (!StringUtils.hasText(pattern)) {
                            log.warn("Skipping route with blank normalized apiPattern: id={}", route.getId());
                            return;
                        }
                        if (!StringUtils.hasText(serviceUrl)) {
                            log.warn("Skipping route with blank normalized serviceUrl: id={}", route.getId());
                            return;
                        }
                        if (!serviceUrl.startsWith("http://") && !serviceUrl.startsWith("https://")) {
                            log.warn("Skipping route with invalid serviceUrl scheme: id={}, serviceUrl={}",
                                    route.getId(), serviceUrl);
                            return;
                        }
                        if (!isValidUri(serviceUrl)) {
                            log.warn("Skipping route with invalid serviceUrl format: id={}, serviceUrl={}",
                                    route.getId(), serviceUrl);
                            return;
                        }
                        if (!registeredRouteIds.add(route.getId().toString())) {
                            log.warn("Skipping duplicate route id: {}", route.getId());
                            return;
                        }

                        log.info("Registering route: id={}, apiPattern={}, serviceUrl={}, order={}",
                                route.getId(), pattern, serviceUrl, route.getRouteOrder());
                        if (!pattern.startsWith("/")) {
                            pattern = "/" + pattern;
                        }

                        // log.info("""

                        // ==========================================
                        // Registering Dynamic Route
                        // ID : {}
                        // Pattern : {}
                        // Target URL : {}
                        // Order : {}
                        // Active : {}
                        // ==========================================
                        // """,
                        // route.getId(),
                        // pattern,
                        // serviceUrl,
                        // route.getRouteOrder(),
                        // route.getActive());

                        final String finalPattern = pattern;
                        final String finalServiceUrl = serviceUrl;

                        routes.route(
                                route.getId().toString(),
                                r -> r
                                        .path(finalPattern)
                                        .uri(finalServiceUrl));
                        registeredRoutes.incrementAndGet();

                    } catch (Exception ex) {
                        log.error("Error while registering route {}", route.getId(), ex);
                    }
                });

        log.info("Built RouteLocator with {} registered route(s)", registeredRoutes.get());
        return routes.build();
    }

    private boolean isValidUri(String uriString) {
        try {
            URI uri = URI.create(uriString);
            return uri.getScheme() != null
                    && ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()));
        } catch (Exception ex) {
            return false;
        }
    }
}