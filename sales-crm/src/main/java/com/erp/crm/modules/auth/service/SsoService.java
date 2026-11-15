package com.erp.crm.modules.auth.service;

import org.springframework.stereotype.Service;

import com.erp.crm.modules.auth.dto.ssoresponse.LogoutResponse;
import com.erp.crm.modules.auth.dto.ssoresponse.TokenResponse;
import com.erp.crm.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.crm.modules.auth.dto.ssoresponse.UserResponse;

@Service
public interface SsoService {

    TokenResponse exchangeCode(String code);

    TokenVerifyResponse verifyToken(String accessToken);

    LogoutResponse logout(String accessToken);

    UserResponse fetchUserInfo(String accessToken);

    TokenResponse refreshAccessToken(String refreshToken);

}
