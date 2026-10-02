package com.erp.gateway_service.service;

import com.erp.gateway_service.dto.ModuleRouteResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.util.retry.Retry;

import java.net.URI;
import java.time.Duration;
import java.util.Collections;
import java.util.List;

@Service
public class RouteProviderService {

    private final WebClient webClient;

    private static final Logger log = LoggerFactory.getLogger(RouteProviderService.class);

    // support both property names: auth.service.base-url (preferred),
    // auth.server.base-uri, and auth.server.base-url
    @Value("${auth.service.base-url:${auth.server.base-uri:${auth.server.base-url:}}}")
    private String AUTH_SERVICE_BASE_URL;

    public RouteProviderService(WebClient webClient) {
        this.webClient = webClient;
    }

    public List<ModuleRouteResponse> getRoutes() {
        if (!StringUtils.hasText(AUTH_SERVICE_BASE_URL)) {
            log.warn(
                    "auth service base url is not configured (auth.service.base-url or auth.server.base-uri). Returning empty route list.");
            return Collections.emptyList();
        }

        String normalizedBaseUrl = AUTH_SERVICE_BASE_URL.trim();
        if (normalizedBaseUrl.endsWith("/")) {
            normalizedBaseUrl = normalizedBaseUrl.substring(0, normalizedBaseUrl.length() - 1);
        }
        String url = normalizedBaseUrl + "/api/sso/module-routes/internal/routes";
        try {
            log.info("Fetching routes from auth service: {}", url);

            List<ModuleRouteResponse> routes = webClient
                    .get()
                    .uri(URI.create(url))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<ModuleRouteResponse>>() {
                    })
                    .retryWhen(
                            Retry.fixedDelay(5, Duration.ofSeconds(10)))
                    .block(Duration.ofSeconds(60));

            if (routes == null) {
                log.warn("Auth service returned null route list: {}", url);
                return Collections.emptyList();
            }

            routes.forEach(route -> log.debug("Route payload received: {}", route));
            log.info("Received {} routes from auth service", routes.size());
            return routes;
        } catch (Exception ex) {
            log.error("Failed to fetch routes from auth service {}: {}", url, ex.getMessage());
            log.debug("Full error while fetching routes", ex);
            return Collections.emptyList();
        }
    }
}