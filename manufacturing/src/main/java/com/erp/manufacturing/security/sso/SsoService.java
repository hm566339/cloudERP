package com.erp.manufacturing.security.sso;

import com.erp.manufacturing.security.dto.sso.TokenVerifyResponse;

public interface SsoService {
    TokenVerifyResponse verifyToken(String accessToken);
}
