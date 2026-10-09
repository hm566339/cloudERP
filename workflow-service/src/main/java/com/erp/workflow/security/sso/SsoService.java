package com.erp.workflow.security.sso;

import com.erp.workflow.security.dto.sso.TokenVerifyResponse;

public interface SsoService {

    /**
     * Verifies the provided access token with the SSO service at POST /api/sso/token/verify.
     *
     * @param accessToken the bearer access token
     * @return the verified token payload
     */
    TokenVerifyResponse verifyToken(String accessToken);
}
