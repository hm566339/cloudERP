package com.erp.account.modules.auth.service;

import org.springframework.stereotype.Service;

import com.erp.account.modules.auth.dto.ssoresponse.LogoutResponse;
import com.erp.account.modules.auth.dto.ssoresponse.SsoMeResponse;
import com.erp.account.modules.auth.dto.ssoresponse.TokenResponse;
import com.erp.account.modules.auth.dto.ssoresponse.TokenVerifyResponse;

@Service
public interface SsoService {

    TokenResponse exchangeCode(String code);

    TokenVerifyResponse verifyToken(String accessToken);

    LogoutResponse logout(String accessToken);

    SsoMeResponse fetchUserInfo(String accessToken);

    TokenResponse refreshAccessToken(String refreshToken);

}
