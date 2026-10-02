package com.erp.account.modules.auth.controller;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ExternalServiceException;
import com.erp.account.common.exception.InternalServerException;
import com.erp.account.common.exception.UnauthorizedException;
import com.erp.account.modules.auth.dto.ssoresponse.LogoutResponse;
import com.erp.account.modules.auth.dto.ssoresponse.SsoMeResponse;
import com.erp.account.modules.auth.dto.ssoresponse.TokenResponse;
import com.erp.account.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.account.modules.auth.dto.ssoresponse.UserResponse;
import com.erp.account.modules.auth.service.SsoService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("/api/account/auth")
@Slf4j
@RequiredArgsConstructor
public class AuthController {

        private final SsoService ssoService;

        @Value("${sso.frontend}")
        private String ssoFrontendUrl;

        @Value("${sso.base-url}")
        private String backendUrl;

        @Value("${sso.cookie-name}")
        private String cookieName;

        @Value("${sso.cookie-secure}")
        private boolean cookieSecure;

        @Value("${sso.cookie-same-site:Lax}")
        private String cookieSameSite;

        @Value("${sso.cookie-path:/}")
        private String cookiePath;

        @Value("${frontend.url:http://localhost:4173}")
        private String frontendUrl;

        @GetMapping("/login")
        public void login(
                        @RequestParam("companyCode") String companyCode,
                        HttpServletResponse response) throws IOException {

                log.info("Initiating login process for companyCode: {}", companyCode);

                // String encodedGoto = URLEncoder.encode(
                // backendUrl,
                // StandardCharsets.UTF_8);

                // String encodedCompanyCode = URLEncoder.encode(
                // companyCode,
                // StandardCharsets.UTF_8);

                String loginUrl = ssoFrontendUrl
                                + "/login?goto=" + backendUrl
                                + "&companyCode=" + companyCode;

                log.info("Redirecting to SSO login: {}", loginUrl);

                response.sendRedirect(loginUrl);
        }

        @GetMapping("/callback")
        public void callback(
                        @RequestParam(required = false) String code,
                        HttpServletResponse response)
                        throws IOException {

                log.info("Received SSO callback");

                if (code == null || code.isBlank()) {

                        throw new BadRequestException("SSO authorization code is missing", "MISSING_SSO_CODE");
                }

                try {

                        TokenResponse tokenResponse = ssoService.exchangeCode(code);

                        if (tokenResponse == null
                                        || tokenResponse.getAccessToken() == null
                                        || tokenResponse.getRefreshToken() == null) {

                                throw new ExternalServiceException("Invalid token response from SSO");
                        }

                        writeResponseCookie(response, cookieName, tokenResponse.getAccessToken(), 24 * 60 * 60);
                        writeResponseCookie(response, cookieName + "_REFRESH", tokenResponse.getRefreshToken(),
                                        24 * 60 * 60);

                        // Route to the Common ERP Shell workspace after successful authentication.
                        // The workspace is the new landing page for all ERP users after login.
                        String redirectUrl = frontendUrl + "/workspace";

                        log.info(
                                        "Token exchange successful, redirecting to: {}",
                                        redirectUrl);

                        response.sendRedirect(redirectUrl);

                } catch (Exception ex) {

                        log.error(
                                        "Token exchange failed: {}",
                                        ex.getMessage(),
                                        ex);

                        throw new InternalServerException(
                                        "Token exchange failed", ex);
                }
        }

        @GetMapping("/verify")
        public TokenVerifyResponse verifyToken(HttpServletRequest request) {

                String accessToken = extractAccessToken(request);

                log.info("Verifying access token");

                if (accessToken == null || accessToken.isBlank()) {

                        throw new UnauthorizedException(
                                        "Access token is missing");
                }

                try {

                        return ssoService.verifyToken(accessToken);

                } catch (UnauthorizedException ex) {

                        throw ex;
                } catch (Exception ex) {

                        log.error(
                                        "Token verification failed: {}",
                                        ex.getMessage(),
                                        ex);

                        throw new UnauthorizedException(
                                        "Invalid token", ex);
                }
        }

        @PostMapping("/logout")
        public LogoutResponse logout(HttpServletRequest request,
                        HttpServletResponse response) {

                // Read access token from configured cookie name (fallback to header)
                String accessToken = extractAccessToken(request);

                log.info("Processing logout request");

                if (accessToken == null || accessToken.isBlank()) {
                        throw new UnauthorizedException("Access token is missing");
                }

                try {
                        LogoutResponse logoutResponse = ssoService.logout(accessToken);

                        writeResponseCookie(response, cookieName, "", 0);
                        writeResponseCookie(response, cookieName + "_REFRESH", "", 0);

                        return logoutResponse;

                } catch (UnauthorizedException ex) {
                        throw ex;
                } catch (ExternalServiceException ex) {
                        throw ex;
                } catch (Exception ex) {
                        log.error("Logout failed: {}", ex.getMessage(), ex);
                        throw new InternalServerException("Logout failed", ex);
                }
        }

        @GetMapping("/me")
        public ApiResponse<SsoMeResponse> fetchUserInfo(HttpServletRequest request) {

                String accessToken = extractAccessToken(request);

                log.info("Fetching authenticated user info: ");

                if (accessToken == null || accessToken.isBlank()) {

                        throw new UnauthorizedException(
                                        "Access token is missing");
                }

                try {

                        return ApiResponse.<SsoMeResponse>builder()
                                        .data(ssoService.fetchUserInfo(accessToken))
                                        .build();

                } catch (UnauthorizedException ex) {

                        throw ex;
                } catch (Exception ex) {

                        log.error(
                                        "Failed to fetch user info: {}",
                                        ex.getMessage(),
                                        ex);

                        throw new InternalServerException(
                                        "Failed to fetch user info", ex);
                }
        }

        @PostMapping("/refresh")
        public void refreshToken(
                        HttpServletRequest request,
                        HttpServletResponse response) throws IOException {

                String refreshToken = extractCookieValue(request, cookieName + "_REFRESH");
                if (refreshToken == null || refreshToken.isBlank()) {
                        // Fallback to checking the exact name set by frontend
                        refreshToken = extractCookieValue(request, "ACCESS_TOKEN_REFRESH");
                }

                log.info("Refreshing access token");

                if (refreshToken == null || refreshToken.isBlank()) {
                        throw new UnauthorizedException("Refresh token is missing");
                }

                try {
                        // Exchange refresh token for new tokens
                        TokenResponse tokenResponse = ssoService.refreshAccessToken(refreshToken);

                        if (tokenResponse == null || tokenResponse.getAccessToken() == null) {
                                throw new ExternalServiceException("Invalid token response from SSO");
                        }

                        // Write new tokens to cookies
                        writeResponseCookie(response, cookieName, tokenResponse.getAccessToken(), 24 * 60 * 60);
                        if (tokenResponse.getRefreshToken() != null) {
                                writeResponseCookie(response, cookieName + "_REFRESH", tokenResponse.getRefreshToken(),
                                                24 * 60 * 60);
                        }

                        // Also write the frontend-expected cookies just in case cookieName is different
                        if (!"ACCESS_TOKEN".equals(cookieName)) {
                                writeResponseCookie(response, "ACCESS_TOKEN", tokenResponse.getAccessToken(),
                                                24 * 60 * 60);
                                if (tokenResponse.getRefreshToken() != null) {
                                        writeResponseCookie(response, "ACCESS_TOKEN_REFRESH",
                                                        tokenResponse.getRefreshToken(), 24 * 60 * 60);
                                }
                        }

                        log.info("Access token refreshed successfully");

                } catch (UnauthorizedException ex) {
                        throw ex;
                } catch (Exception ex) {
                        log.error("Token refresh failed: {}", ex.getMessage(), ex);
                        throw new InternalServerException("Token refresh failed", ex);
                }
        }

        @GetMapping("/validate")
        public ApiResponse<Boolean> validateToken(HttpServletRequest request) {

                String accessToken = extractAccessToken(request);

                log.info("Validating token via /validate endpoint");

                if (accessToken == null || accessToken.isBlank()) {
                        log.warn("Validation failed: token is missing");
                        throw new UnauthorizedException("Access token is missing");
                }

                try {
                        ssoService.verifyToken(accessToken);
                        log.info("Token validation successful");
                        return ApiResponse.<Boolean>builder().data(true).build();
                } catch (UnauthorizedException ex) {
                        log.warn("Token validation failed: invalid token");
                        throw ex;
                } catch (Exception ex) {
                        log.error("Token validation failed: {}", ex.getMessage(), ex);
                        throw new UnauthorizedException("Invalid token", ex);
                }
        }

        private void writeResponseCookie(HttpServletResponse response, String name, String value, int maxAge) {
                ResponseCookie cookie = ResponseCookie.from(name, value != null ? value : "")
                                .httpOnly(true)
                                .secure(cookieSecure)
                                .path(cookiePath)
                                .maxAge(maxAge)
                                .sameSite(cookieSameSite)
                                .build();
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        private String extractAccessToken(HttpServletRequest request) {
                String header = request.getHeader("Authorization");
                if (header != null && header.startsWith("Bearer ")) {
                        return header.substring(7).trim();
                }
                String token = extractCookieValue(request, cookieName);
                if (token == null || token.isBlank()) {
                        token = extractCookieValue(request, "ACCESS_TOKEN");
                }
                return token;
        }

        private String extractCookieValue(HttpServletRequest request, String name) {
                Cookie[] cookies = request.getCookies();
                if (cookies != null) {
                        for (Cookie c : cookies) {
                                if (name.equals(c.getName())) {
                                        return c.getValue();
                                }
                        }
                }
                return null;
        }
}
