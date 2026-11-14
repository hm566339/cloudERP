package com.erp.workflow.security.sso;

import com.erp.workflow.dto.sso.CompanyRoleMappingDto;
import com.erp.workflow.exception.UnauthorizedException;
import com.erp.workflow.security.dto.sso.ResponseWrapper;
import com.erp.workflow.security.dto.sso.TokenVerifyResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.*;

@Service
@Slf4j
public class SsoServiceImpl implements SsoService {

    private final RestClient restClient;

    @Autowired
    public SsoServiceImpl(
            @Value("${auth.service.base-url:${sso.backend:http://localhost:8090}}") String ssoBaseUrl,
            @Autowired(required = false) RestClient.Builder restClientBuilder) {
        RestClient.Builder builder = restClientBuilder != null ? restClientBuilder : RestClient.builder();
        this.restClient = builder.baseUrl(ssoBaseUrl).build();
        log.info("Initialized SsoService with SSO base URL: {}", ssoBaseUrl);
    }

    public SsoServiceImpl(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public TokenVerifyResponse verifyToken(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new UnauthorizedException("Access token is required");
        }

        try {
            ResponseWrapper<TokenVerifyResponse> response = restClient.post()
                    .uri("/api/sso/token/verify")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(new ParameterizedTypeReference<ResponseWrapper<TokenVerifyResponse>>() {});

            if (response == null || response.getData() == null) {
                log.warn("SSO verify endpoint returned empty response or data");
                throw new UnauthorizedException("Invalid response from SSO verify endpoint");
            }

            return response.getData();
        } catch (HttpClientErrorException ex) {
            if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                log.warn("Access token expired or invalid according to SSO: {}", ex.getResponseBodyAsString());
                throw new UnauthorizedException("Access token expired or invalid", ex);
            }
            log.error("SSO token verification failed with HTTP status {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new UnauthorizedException("SSO token verification failed: " + ex.getMessage(), ex);
        } catch (UnauthorizedException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("SSO token verification failed unexpectedly: {}", ex.getMessage(), ex);
            throw new UnauthorizedException("Failed to verify token with SSO: " + ex.getMessage(), ex);
        }
    }

    @Override
    public List<UUID> getActiveOrganizationIds() {
        try {
            ResponseWrapper<List<UUID>> response = restClient.get()
                    .uri("/api/sso/organization/workflows/internal/active-ids")
                    .retrieve()
                    .body(new ParameterizedTypeReference<ResponseWrapper<List<UUID>>>() {});
            if (response != null && response.getData() != null) {
                return response.getData();
            }
        } catch (Exception ex) {
            log.warn("Failed to fetch active organization IDs from SSO service: {}", ex.getMessage());
        }
        return Collections.emptyList();
    }

    @Override
    public List<CompanyRoleMappingDto> getCompanyRoleMappings(UUID organizationId) {
        if (organizationId == null) {
            return Collections.emptyList();
        }
        try {
            ResponseWrapper<List<Map<String, Object>>> response = restClient.get()
                    .uri("/api/sso/organization/workflows/internal/{orgId}/companies", organizationId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<ResponseWrapper<List<Map<String, Object>>>>() {});
            if (response != null && response.getData() != null) {
                List<CompanyRoleMappingDto> list = new ArrayList<>();
                for (Map<String, Object> map : response.getData()) {
                    UUID compId = null;
                    if (map.get("companyId") != null) {
                        compId = UUID.fromString(map.get("companyId").toString());
                    }
                    String code = (String) map.get("companyCode");
                    String name = (String) map.get("companyName");
                    Map<String, UUID> roleMap = new HashMap<>();
                    if (map.get("roleNameToIdMap") instanceof Map<?, ?> rawMap) {
                        for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
                            if (entry.getKey() != null && entry.getValue() != null) {
                                try {
                                    roleMap.put(entry.getKey().toString().toUpperCase(), UUID.fromString(entry.getValue().toString()));
                                } catch (Exception ignored) {}
                            }
                        }
                    }
                    list.add(CompanyRoleMappingDto.builder()
                            .companyId(compId)
                            .companyCode(code)
                            .companyName(name)
                            .roleNameToIdMap(roleMap)
                            .build());
                }
                return list;
            }
        } catch (Exception ex) {
            log.warn("Failed to fetch company role mappings for org {} from SSO service: {}", organizationId, ex.getMessage());
        }
        return Collections.emptyList();
    }
}
