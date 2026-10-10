package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.*;
import com.erp.auth_service.dto.response.AuthorizationCodeResponse;
import com.erp.auth_service.dto.response.LoginResponse;
import com.erp.auth_service.dto.response.RefreshTokenResponse;
import com.erp.auth_service.dto.response.TokenResponse;
import com.erp.auth_service.dto.response.TokenVerifyResponse;
import com.erp.auth_service.dto.response.UserResponse;

import java.util.Map;
import java.util.UUID;

public interface AuthService {

    UserResponse register(CreateUserRequest request);

    LoginResponse login(LoginRequest request, String ip, String userAgent);

    LoginResponse organizationLogin(LoginRequest request, String ip, String userAgent);

    RefreshTokenResponse refreshToken(RefreshTokenRequest request);

    RefreshTokenResponse AdminrefreshToken(AdminRefreshToken request);

    String logout(String accessToken);

    AuthorizationCodeResponse generateAuthorizationCode(LoginRequest request);

    TokenResponse exchangeCodeForToken(String codeValue, UUID clientId);

    TokenResponse exchangeCodeForToken(String codeValue, String clientId);

    TokenResponse exchangeCodeForToken(String codeValue, String clientId, String clientSecret);

    String sendTokenForPassword(
            String companyCode,
            String email);

    String emailverify(String token);

    String resetPassword(PasswordReset passwordReset, String code);

    Map<String, String> resetPasswordWithDetails(PasswordReset passwordReset, String code);

    void validateClient(UUID clientId, String clientSecret);

    void validateClient(String clientId, String clientSecret);

    TokenVerifyResponse verifyToken(String accessToken);

    void revokeToken(TokenRevokeRequest request);

    LoginResponse adminLogin(LoginRequest request, String ip, String userAgent);

    Map<String, Object> authorize(String accessToken, UUID userId, UUID moduleId);
}