package com.erp.manufacturing.security.sso;

import com.erp.manufacturing.common.exception.ExternalServiceException;
import com.erp.manufacturing.security.dto.sso.ResponseWrapper;
import com.erp.manufacturing.security.dto.sso.TokenVerifyResponse;
import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SsoServiceImpl implements SsoService {

    private static final Logger log = LoggerFactory.getLogger(SsoServiceImpl.class);

    private final SsoFeignClient ssoFeignClient;

    public SsoServiceImpl(SsoFeignClient ssoFeignClient) {
        this.ssoFeignClient = ssoFeignClient;
    }

    @Override
    public TokenVerifyResponse verifyToken(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            return null;
        }

        String bearerToken = accessToken.startsWith("Bearer ") ? accessToken : "Bearer " + accessToken;

        try {
            ResponseWrapper<TokenVerifyResponse> response = ssoFeignClient.verifyToken(bearerToken);
            if (response == null || response.getData() == null) {
                log.warn("Invalid response structure from SSO verify endpoint");
                return null;
            }
            return response.getData();
        } catch (FeignException.Unauthorized ex) {
            log.warn("Access token expired or rejected by SSO: {}", ex.getMessage());
            return null;
        } catch (FeignException ex) {
            log.error("SSO token verification failed with HTTP error {}: {}", ex.status(), ex.getMessage());
            throw new ExternalServiceException("SSO token verification failed: " + ex.getMessage());
        } catch (Exception ex) {
            log.error("SSO token verification failed with unexpected error: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("SSO token verification failed: " + ex.getMessage());
        }
    }
}
