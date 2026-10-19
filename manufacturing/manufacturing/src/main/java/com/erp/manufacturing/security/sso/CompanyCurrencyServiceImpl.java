package com.erp.manufacturing.security.sso;

import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.common.exception.ExternalServiceException;
import com.erp.manufacturing.common.exception.ResourceNotFoundException;
import com.erp.manufacturing.common.exception.UnauthorizedException;
import com.erp.manufacturing.security.dto.sso.CompanyResponse;
import com.erp.manufacturing.security.dto.sso.ResponseWrapper;
import com.erp.manufacturing.util.CurrentUserContext;
import com.erp.manufacturing.util.TenantUtils;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@Slf4j
public class CompanyCurrencyServiceImpl implements CompanyCurrencyService {

    private final SsoFeignClient ssoFeignClient;
    private final ConcurrentMap<UUID, CachedCurrency> cache = new ConcurrentHashMap<>();
    private static final long TTL_MILLIS = 5 * 60 * 1000L; // 5 minutes

    public CompanyCurrencyServiceImpl(SsoFeignClient ssoFeignClient) {
        this.ssoFeignClient = ssoFeignClient;
    }

    @Override
    public String getCompanyCurrency(UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        if (resolvedCompanyId == null) {
            throw new BusinessValidationException("Company ID is required for currency resolution.");
        }

        // Multi-tenant authorization check: reject cross-company access without system admin rights
        UUID contextCompanyId = CurrentUserContext.getCompanyId();
        if (contextCompanyId != null && !contextCompanyId.equals(resolvedCompanyId) && !CurrentUserContext.isSystemAdmin()) {
            throw new UnauthorizedException("Access denied: Tenant " + contextCompanyId + " is not authorized for company " + resolvedCompanyId);
        }

        // Check local cache
        CachedCurrency cached = cache.get(resolvedCompanyId);
        if (cached != null && System.currentTimeMillis() < cached.expiresAt) {
            return cached.currency;
        }

        String token = extractBearerToken();

        try {
            ResponseWrapper<CompanyResponse> response = ssoFeignClient.verifyCompany(resolvedCompanyId, null, token);
            if (response == null || !response.isSuccess() || response.getData() == null) {
                String message = response != null && response.getMessage() != null
                        ? response.getMessage() : "Empty or unsuccessful response from SSO company verification";
                throw new ExternalServiceException("Failed to verify company from SSO: " + message);
            }

            CompanyResponse company = response.getData();
            if (company.getId() != null && !resolvedCompanyId.equals(company.getId())) {
                throw new BusinessValidationException("SSO verified company ID mismatch: expected "
                        + resolvedCompanyId + " but received " + company.getId());
            }

            String baseCurrency = company.getBaseCurrency();
            if (baseCurrency == null || baseCurrency.isBlank()) {
                throw new BusinessValidationException("Company currency is not configured in SSO for company: " + resolvedCompanyId);
            }

            String normalized = baseCurrency.trim().toUpperCase();
            if (normalized.length() != 3) {
                throw new BusinessValidationException("Invalid ISO currency code configured for company: " + normalized);
            }

            cache.put(resolvedCompanyId, new CachedCurrency(normalized, System.currentTimeMillis() + TTL_MILLIS));
            return normalized;

        } catch (FeignException.NotFound ex) {
            throw new ResourceNotFoundException("Company not found in SSO: " + resolvedCompanyId);
        } catch (FeignException.Unauthorized | FeignException.Forbidden ex) {
            throw new UnauthorizedException("Unauthorized or rejected by SSO for company verification: " + resolvedCompanyId);
        } catch (FeignException ex) {
            log.error("SSO company verification HTTP failure (status {}): {}", ex.status(), ex.getMessage());
            throw new ExternalServiceException("SSO company verification failed with status " + ex.status() + ": " + ex.getMessage(), ex);
        } catch (BusinessValidationException | ResourceNotFoundException | UnauthorizedException | ExternalServiceException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error verifying company currency from SSO: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("Unexpected failure during company currency resolution: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void clearCache() {
        cache.clear();
    }

    private String extractBearerToken() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    String auth = request.getHeader("Authorization");
                    if (auth != null && !auth.isBlank()) {
                        return auth.startsWith("Bearer ") ? auth : "Bearer " + auth;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private record CachedCurrency(String currency, long expiresAt) {}
}
