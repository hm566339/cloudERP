package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.*;
import com.erp.auth_service.dto.response.*;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.model.UserPortalAccess;
import com.erp.auth_service.repository.UserPortalAccessRepository;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.service.AuthService;
import com.erp.auth_service.service.UserAccessService;
import com.erp.auth_service.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/sso/")
@RequiredArgsConstructor
public class AuthController {

    @Value("${sso.cookies.same-site}")
    private String sameSite;

    @Value("${sso.cookies.secure}")
    private boolean secure;

    private final AuthService authService;
    private final UserService userService;
    private final UserAccessService userAccessService;
    private final com.erp.auth_service.service.OrganizationService organizationService;
    private final JwtDecoder jwtDecoder;
    private final Environment environment;

    @PostMapping("/signup")
    public ResponseEntity<ResponseWrapper<OrganizationSignupResponse>> signup(
            @Valid @RequestBody OrganizationSignupRequest request) {
        return ResponseEntity.ok(ResponseWrapper.success(organizationService.signup(request)));
    }

    @GetMapping("/organization/{organizationCode:^(?!appearance$).+}")
    public ResponseEntity<ResponseWrapper<OrganizationLookupResponse>> organization(
            @PathVariable String organizationCode) {
        return ResponseEntity.ok(ResponseWrapper.success(organizationService.lookup(organizationCode)));
    }

    @PostMapping("/auth/register")
    public ResponseEntity<ResponseWrapper<UserResponse>> register(
            @Valid @RequestBody RequestWrapper<CreateUserRequest> request) {
        return ResponseEntity.ok(ResponseWrapper.success(
                authService.register(request.getData())));
    }

    // ==================== USER LOGIN ====================
    @PostMapping("/auth/login")
    public ResponseEntity<ResponseWrapper<LoginResponse>> login(
            @Valid @RequestBody RequestWrapper<LoginRequest> request,
            HttpServletRequest httpServletRequest) {

        String ip = getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        LoginResponse response = authService.login(request.getData(), ip, userAgent);

        HttpHeaders headers = new HttpHeaders();
        if (response != null && StringUtils.hasText(response.getAccessToken())) {
            attachAuthCookies(headers, response.getAccessToken(), response.getRefreshToken(), isSecureCookie(httpServletRequest));
        }

        return ResponseEntity.ok().headers(headers).body(ResponseWrapper.success(response));
    }

    @PostMapping("/auth/select-company")
    public ResponseEntity<ResponseWrapper<LoginResponse>> selectCompany(
            @Valid @RequestBody RequestWrapper<LoginRequest> request,
            HttpServletRequest httpServletRequest) {
        LoginRequest data = request.getData();
        if (data.getOrganizationCode() == null || data.getCompanyId() == null) {
            throw new BadCredentialsException("organizationCode and companyId are required");
        }
        LoginResponse response = authService.organizationLogin(
                data, getClientIp(httpServletRequest), httpServletRequest.getHeader("User-Agent"));

        HttpHeaders headers = new HttpHeaders();
        if (response != null && StringUtils.hasText(response.getAccessToken())) {
            attachAuthCookies(headers, response.getAccessToken(), response.getRefreshToken(), isSecureCookie(httpServletRequest));
        }

        return ResponseEntity.ok().headers(headers).body(ResponseWrapper.success(response));
    }

    // ==================== ADMIN LOGIN ====================
    @PostMapping("/auth/admin-login")
    public ResponseEntity<LoginResponse> adminLogin(
            @Valid @RequestBody RequestWrapper<LoginRequest> request,
            HttpServletRequest httpServletRequest) {

        String ip = getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        LoginResponse response = authService.adminLogin(request.getData(), ip, userAgent);

        String accessToken = response.getAccessToken();
        String refreshToken = response.getRefreshToken();

        long accessTokenMaxAge = getCookieMaxAgeSeconds(accessToken);
        long refreshTokenMaxAge = getCookieMaxAgeSeconds(refreshToken);

        boolean isSec = isSecureCookie(httpServletRequest);

        ResponseCookie accessCookie = ResponseCookie.from("ACCESS_TOKEN", accessToken)
                .httpOnly(true)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(accessTokenMaxAge)
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("ACCESS_TOKEN_REFRESH", refreshToken)
                .httpOnly(true)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(refreshTokenMaxAge)
                .build();

        ResponseCookie authTokenCookie = ResponseCookie.from("auth_token", accessToken)
                .httpOnly(false)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(accessTokenMaxAge)
                .build();

        response.setAccessToken(null);
        response.setRefreshToken(null);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .header(HttpHeaders.SET_COOKIE, authTokenCookie.toString())
                .body(response);
    }

    // ================= LOGOUT =================
    @PostMapping("/auth/logout")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest request) {

        String token = extractToken(authHeader, request);
        if (StringUtils.hasText(token)) {
            try {
                authService.logout(token);
            } catch (Exception e) {
                log.warn("Session logout warning: {}", e.getMessage());
            }
        }

        boolean isSec = isSecureCookie(request);

        ResponseCookie accessCookie = ResponseCookie.from("ACCESS_TOKEN", "")
                .httpOnly(true)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("ACCESS_TOKEN_REFRESH", "")
                .httpOnly(true)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie authTokenCookie = ResponseCookie.from("auth_token", "")
                .httpOnly(false)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie ssoSessionCookie = ResponseCookie.from("SSO_SESSION", "")
                .httpOnly(true)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie lowerAccessCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie lowerRefreshCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .header(HttpHeaders.SET_COOKIE, authTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, ssoSessionCookie.toString())
                .header(HttpHeaders.SET_COOKIE, lowerAccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, lowerRefreshCookie.toString())
                .body(ResponseWrapper.success(Map.of("message", "logged out")));
    }

    // ================= CURRENT USER (Global ERP Shell Context) =================
    /**
     * Returns the full global ERP authorization context for the Common ERP Shell.
     * Includes: user, organization, currentCompany, accessible companies,
     * membership, subscription (with trial info), authorized modules, features,
     * permissions.
     *
     * <p>
     * This is the CANONICAL source of truth for all frontend authorization
     * decisions.
     * The account module's /api/account/auth/me is preserved for backward
     * compatibility.
     */
    @GetMapping("/auth/me")
    public ResponseEntity<ResponseWrapper<SsoMeResponse>> me(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "companyId", required = false) String companyParam,
            HttpServletRequest request) {

        String token = extractToken(authHeader, request);
        if (!StringUtils.hasText(token)) {
            throw new BadCredentialsException("Authentication required: token missing");
        }
        return ResponseEntity.ok(ResponseWrapper.success(userService.getSsoMe(token, companyParam)));
    }

    // ================= TOKEN EXCHANGE =================
    @PostMapping("/token/exchange")
    public ResponseEntity<TokenResponse> exchange(
            @Valid @RequestBody RequestWrapper<TokenExchangeRequest> request,
            HttpServletRequest httpServletRequest) {

        TokenExchangeRequest data = request.getData();
        authService.validateClient(data.getClientId(), data.getClientSecret());

        TokenResponse tokenResponse = authService.exchangeCodeForToken(
                data.getCode(),
                data.getClientId(),
                data.getClientSecret());

        HttpHeaders headers = new HttpHeaders();
        if (tokenResponse != null && StringUtils.hasText(tokenResponse.getAccessToken())) {
            attachAuthCookies(headers, tokenResponse.getAccessToken(), tokenResponse.getRefreshToken(), isSecureCookie(httpServletRequest));
        }

        return ResponseEntity.ok().headers(headers).body(tokenResponse);
    }

    // ================= REFRESH TOKEN =================
    @PostMapping("/token/refresh")
    public ResponseEntity<ResponseWrapper<RefreshTokenResponse>> refresh(
            @RequestBody(required = false) Map<String, Object> body,
            @CookieValue(name = "ACCESS_TOKEN_REFRESH", required = false) String cookieRefreshToken,
            @CookieValue(name = "refresh_token", required = false) String altCookieRefreshToken,
            HttpServletRequest httpServletRequest) {

        String tokenToUse = null;
        UUID clientId = null;

        if (body != null) {
            Object dataObj = body.get("data");
            if (dataObj instanceof Map<?, ?> dataMap) {
                Object rt = dataMap.get("refreshToken");
                if (rt != null) {
                    tokenToUse = rt.toString();
                }
                Object cid = dataMap.get("clientId");
                if (cid != null) {
                    try {
                        clientId = UUID.fromString(cid.toString());
                    } catch (Exception ignored) {}
                }
            } else if (dataObj instanceof String s && StringUtils.hasText(s)) {
                tokenToUse = s;
            }

            if (!StringUtils.hasText(tokenToUse)) {
                Object rt = body.get("refreshToken");
                if (rt != null) {
                    tokenToUse = rt.toString();
                }
            }
            if (clientId == null) {
                Object cid = body.get("clientId");
                if (cid != null) {
                    try {
                        clientId = UUID.fromString(cid.toString());
                    } catch (Exception ignored) {}
                }
            }
        }

        if (!StringUtils.hasText(tokenToUse)) {
            tokenToUse = cookieRefreshToken;
        }

        if (!StringUtils.hasText(tokenToUse)) {
            tokenToUse = altCookieRefreshToken;
        }

        if (!StringUtils.hasText(tokenToUse) && httpServletRequest.getCookies() != null) {
            for (Cookie cookie : httpServletRequest.getCookies()) {
                if ("ACCESS_TOKEN_REFRESH".equalsIgnoreCase(cookie.getName())
                        || "refresh_token".equalsIgnoreCase(cookie.getName())
                        || "refreshToken".equalsIgnoreCase(cookie.getName())) {
                    tokenToUse = cookie.getValue();
                    break;
                }
            }
        }

        if (!StringUtils.hasText(tokenToUse)) {
            log.warn("Token refresh rejected: No refresh token supplied in request body or cookies");
            throw new BadCredentialsException("Refresh token is required");
        }

        RefreshTokenRequest refreshRequest = new RefreshTokenRequest(tokenToUse, clientId);
        RefreshTokenResponse response = authService.refreshToken(refreshRequest);

        String accessToken = response.getAccessToken();
        String refreshToken = response.getRefreshToken();

        long accessTokenMaxAge = getCookieMaxAgeSeconds(accessToken);
        long refreshTokenMaxAge = getCookieMaxAgeSeconds(refreshToken);

        boolean isSec = isSecureCookie(httpServletRequest);

        ResponseCookie accessCookie = ResponseCookie.from("ACCESS_TOKEN", accessToken != null ? accessToken : "")
                .httpOnly(false)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(accessTokenMaxAge)
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("ACCESS_TOKEN_REFRESH", refreshToken != null ? refreshToken : "")
                .httpOnly(false)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(refreshTokenMaxAge)
                .build();

        ResponseCookie authTokenCookie = ResponseCookie.from("auth_token", accessToken != null ? accessToken : "")
                .httpOnly(false)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(accessTokenMaxAge)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .header(HttpHeaders.SET_COOKIE, authTokenCookie.toString())
                .body(ResponseWrapper.success(response));
    }

    @PostMapping("/admin/token/refresh")
    public ResponseEntity<ResponseWrapper<RefreshTokenResponse>> adminRefresh(
            @RequestBody(required = false) Map<String, Object> body,
            @CookieValue(name = "ACCESS_TOKEN_REFRESH", required = false) String cookieRefreshToken,
            @CookieValue(name = "refresh_token", required = false) String altCookieRefreshToken,
            HttpServletRequest httpServletRequest) {

        String tokenToUse = null;

        if (body != null) {
            Object dataObj = body.get("data");
            if (dataObj instanceof Map<?, ?> dataMap) {
                Object rt = dataMap.get("refreshToken");
                if (rt != null) {
                    tokenToUse = rt.toString();
                }
            } else if (dataObj instanceof String s && StringUtils.hasText(s)) {
                tokenToUse = s;
            }

            if (!StringUtils.hasText(tokenToUse)) {
                Object rt = body.get("refreshToken");
                if (rt != null) {
                    tokenToUse = rt.toString();
                }
            }
        }

        if (!StringUtils.hasText(tokenToUse)) {
            tokenToUse = cookieRefreshToken;
        }

        if (!StringUtils.hasText(tokenToUse)) {
            tokenToUse = altCookieRefreshToken;
        }

        if (!StringUtils.hasText(tokenToUse) && httpServletRequest.getCookies() != null) {
            for (Cookie cookie : httpServletRequest.getCookies()) {
                if ("ACCESS_TOKEN_REFRESH".equalsIgnoreCase(cookie.getName())
                        || "refresh_token".equalsIgnoreCase(cookie.getName())
                        || "refreshToken".equalsIgnoreCase(cookie.getName())) {
                    tokenToUse = cookie.getValue();
                    break;
                }
            }
        }

        if (!StringUtils.hasText(tokenToUse)) {
            log.warn("Admin token refresh rejected: No refresh token supplied in request body or cookies");
            throw new BadCredentialsException("Refresh token is required");
        }

        AdminRefreshToken adminRefreshToken = new AdminRefreshToken(tokenToUse);
        RefreshTokenResponse response = authService.AdminrefreshToken(adminRefreshToken);

        String accessToken = response.getAccessToken();
        String refreshToken = response.getRefreshToken();

        long accessTokenMaxAge = getCookieMaxAgeSeconds(accessToken);
        long refreshTokenMaxAge = getCookieMaxAgeSeconds(refreshToken);

        boolean isSec = isSecureCookie(httpServletRequest);

        ResponseCookie accessCookie = ResponseCookie.from("ACCESS_TOKEN", accessToken)
                .httpOnly(true)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(accessTokenMaxAge)
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("ACCESS_TOKEN_REFRESH", refreshToken)
                .httpOnly(true)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(refreshTokenMaxAge)
                .build();

        ResponseCookie authTokenCookie = ResponseCookie.from("auth_token", accessToken)
                .httpOnly(false)
                .secure(isSec)
                .sameSite(sameSite)
                .path("/")
                .maxAge(accessTokenMaxAge)
                .build();

        response.setAccessToken(null);
        response.setRefreshToken(null);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .header(HttpHeaders.SET_COOKIE, authTokenCookie.toString())
                .body(ResponseWrapper.success(response));
    }

    // ================= VERIFY TOKEN =================
    @PostMapping("/token/verify")
    public ResponseEntity<ResponseWrapper<TokenVerifyResponse>> verify(
            @RequestHeader("Authorization") String authHeader,
            HttpServletRequest request) {

        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        log.info("Incoming token verify request -> ip: {}, userAgent: {}", ip, userAgent);

        String token = extractBearerToken(authHeader);

        // log only partial token (safe)
        log.debug("Extracted token -> {}",
                token != null ? token.substring(0, Math.min(10, token.length())) + "..." : "null");

        TokenVerifyResponse response = authService.verifyToken(token);

        log.info("Token verification completed -> valid: {}, ip: {}", response.isValid(), ip);

        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    // ================= REVOKE TOKEN =================
    @PostMapping("/token/revoke")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> revoke(
            @Valid @RequestBody RequestWrapper<TokenRevokeRequest> request) {

        authService.revokeToken(request.getData());
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "token revoked")));
    }

    // ================= AUTHORIZE =================
    @GetMapping("/authorize")
    public ResponseEntity<ResponseWrapper<Map<String, Object>>> authorize(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam UUID user_id,
            @RequestParam UUID module_id) {

        String token = extractBearerToken(authHeader);
        return ResponseEntity.ok(
                ResponseWrapper.success(authService.authorize(token, user_id, module_id)));
    }

    @GetMapping("/portal-access/{companyId}")
    public ResponseEntity<ResponseWrapper<UserPortalAccessListResponse>> checkPortalAccess(
            @RequestParam int page,
            @RequestParam int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean status,
            @PathVariable UUID companyId) {
        return ResponseEntity.ok(
                ResponseWrapper
                        .success(userAccessService.getUserPortalAccesses(companyId, page, pageSize, search, status)));
    }

    // ================= HELPER =================
    private String extractToken(String authHeader, HttpServletRequest request) {
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        if (request != null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("ACCESS_TOKEN".equalsIgnoreCase(cookie.getName())
                        || "access_token".equalsIgnoreCase(cookie.getName())
                        || "accessToken".equalsIgnoreCase(cookie.getName())
                        || "auth_token".equalsIgnoreCase(cookie.getName())
                        || "authToken".equalsIgnoreCase(cookie.getName())) {
                    if (StringUtils.hasText(cookie.getValue())) {
                        return cookie.getValue().trim();
                    }
                }
            }
        }
        return null;
    }

    private String extractBearerToken(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            throw new BadCredentialsException("Invalid Authorization header");
        }
        return header.substring(7);
    }

    private boolean isSecureCookie(HttpServletRequest request) {
        if (secure) {
            return true;
        }
        if (request != null) {
            if (request.isSecure()) {
                return true;
            }
            String proto = request.getHeader("X-Forwarded-Proto");
            if (proto != null && "https".equalsIgnoreCase(proto.trim())) {
                return true;
            }
            String origin = request.getHeader("Origin");
            if (origin != null && origin.startsWith("https://")) {
                return true;
            }
            String referer = request.getHeader("Referer");
            if (referer != null && referer.startsWith("https://")) {
                return true;
            }
        }
        return false;
    }

    private void attachAuthCookies(HttpHeaders headers, String accessToken, String refreshToken, boolean isSec) {
        if (StringUtils.hasText(accessToken)) {
            long accessTokenMaxAge = getCookieMaxAgeSeconds(accessToken);
            ResponseCookie accessCookie = ResponseCookie.from("ACCESS_TOKEN", accessToken)
                    .httpOnly(false)
                    .secure(isSec)
                    .sameSite(sameSite)
                    .path("/")
                    .maxAge(accessTokenMaxAge)
                    .build();

            ResponseCookie authTokenCookie = ResponseCookie.from("auth_token", accessToken)
                    .httpOnly(false)
                    .secure(isSec)
                    .sameSite(sameSite)
                    .path("/")
                    .maxAge(accessTokenMaxAge)
                    .build();

            headers.add(HttpHeaders.SET_COOKIE, accessCookie.toString());
            headers.add(HttpHeaders.SET_COOKIE, authTokenCookie.toString());
        }

        if (StringUtils.hasText(refreshToken)) {
            long refreshTokenMaxAge = getCookieMaxAgeSeconds(refreshToken);
            ResponseCookie refreshCookie = ResponseCookie.from("ACCESS_TOKEN_REFRESH", refreshToken)
                    .httpOnly(false)
                    .secure(isSec)
                    .sameSite(sameSite)
                    .path("/")
                    .maxAge(refreshTokenMaxAge)
                    .build();

            headers.add(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        }
    }

    private long getCookieMaxAgeSeconds(String token) {
        if (token == null || token.isBlank()) {
            return 0;
        }

        Date expiration = jwtDecoder.extractExpiration(token);
        long maxAge = (expiration.getTime() - System.currentTimeMillis()) / 1000L;
        return Math.max(maxAge, 0L);
    }

    // ==================== HELPER METHOD ====================
    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}