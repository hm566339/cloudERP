package com.erp.account.modules.auth.service.impl;

import com.erp.account.common.client.SsoFeignClient;
import com.erp.account.modules.auth.dto.ssoresponse.ResponseWrapper;
import com.erp.account.modules.auth.dto.ssoresponse.UserResponse;
import com.erp.account.modules.auth.service.UserLookupService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserLookupServiceImpl implements UserLookupService {

    private final SsoFeignClient ssoFeignClient;

    @Override
    public Map<UUID, String> resolveFullNames(Set<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }

        String token = extractAccessToken();
        if (token == null) {
            log.warn("No access token available for user lookup. Returning empty names.");
            return Collections.emptyMap();
        }

        List<UUID> idList = new ArrayList<>(userIds);

        try {
            ResponseWrapper<List<UserResponse>> response = ssoFeignClient.fetchUsersByIds("Bearer " + token, idList);
            if (response != null && response.getData() != null) {
                return response.getData().stream()
                        .filter(u -> u.getId() != null && u.getFullName() != null)
                        .collect(Collectors.toMap(UserResponse::getId, UserResponse::getFullName, (a, b) -> a));
            }
        } catch (Exception e) {
            log.warn("Batch user lookup failed, falling back to individual lookups: {}", e.getMessage());
            return resolveIndividually(idList, token);
        }

        return Collections.emptyMap();
    }

    private Map<UUID, String> resolveIndividually(List<UUID> userIds, String token) {
        Map<UUID, String> result = new HashMap<>();
        for (UUID userId : userIds) {
            try {
                ResponseWrapper<UserResponse> response = ssoFeignClient.fetchUserById("Bearer " + token, userId);
                if (response != null && response.getData() != null && response.getData().getFullName() != null) {
                    result.put(userId, response.getData().getFullName());
                }
            } catch (Exception e) {
                log.debug("Failed to resolve user name for userId={}: {}", userId, e.getMessage());
            }
        }
        return result;
    }

    private String extractAccessToken() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            return null;
        }
        HttpServletRequest request = attrs.getRequest();
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("access_token".equals(cookie.getName()) || "ACCESS_TOKEN".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
