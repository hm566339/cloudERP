package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.RefreshTokenRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.request.TokenExchangeRequest;
import com.erp.auth_service.dto.response.*;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.mapper.SsoSessionMapper;
import com.erp.auth_service.model.AuthorizationCode;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.model.Session;
import com.erp.auth_service.repository.AuthorizationCodeRepository;
import com.erp.auth_service.repository.ModuleRepository;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.SessionService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final SsoSessionMapper ssoSessionMapper;
    private final AuthorizationCodeRepository authorizationCodeRepository;
    private final RestTemplate restTemplate;
    private final ModuleRepository moduleRepository;
    private final JwtDecoder jwtDecoder;

    @Value("${api.base}")
    private String ssoBaseUrl;

    @Value("${api.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${api.cookie.same-site:Lax}")
    private String cookieSameSite;

    // ================= GET MY SESSIONS =================
    @Override
    @Transactional(readOnly = true)
    public SessionPageResponse getMySessions(String accessToken) {

        Session currentSession = sessionRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        List<Session> sessions = sessionRepository
                .findAllByUser_IdAndAccessTokenValidTillAfter(
                        currentSession.getUser().getId(),
                        LocalDateTime.now());

        return SessionPageResponse.builder()
                .sessions(ssoSessionMapper.toResponseList(sessions))
                .build();
    }

    // ================= REVOKE SINGLE =================
    @Override
    public void revokeSession(String accessToken, UUID sessionId) {

        Session currentSession = sessionRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Current session not found"));

        if (currentSession.getAccessTokenValidTill().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Access token expired");
        }

        Session targetSession = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Target session not found"));

        if (targetSession.getId().equals(currentSession.getId())) {
            throw new BadRequestException("Cannot revoke current session");
        }

        boolean isSystemAdmin = jwtDecoder.extractRoles(accessToken).contains("SYSTEM_ADMIN");

        if (!isSystemAdmin &&
                !targetSession.getUser().getId().equals(currentSession.getUser().getId())) {
            throw new AccessDeniedException("Not allowed to revoke another user's session");
        }

        log.info("Revoking session {} by user {}", targetSession.getId(), currentSession.getUser().getId());
        sessionRepository.delete(targetSession);
    }

    // ================= REVOKE ALL =================
    @Override
    public long revokeAllSessions(String accessToken, boolean force) {

        Session currentSession = sessionRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Current session not found"));

        List<Session> sessions = (currentSession.getModule() != null)
                ? sessionRepository.findAllByUser_IdAndCompany_IdAndModule_Id(
                        currentSession.getUser().getId(),
                        currentSession.getCompany().getId(),
                        currentSession.getModule().getId())
                : sessionRepository.findAllByUser_IdAndCompany_Id(
                        currentSession.getUser().getId(),
                        currentSession.getCompany().getId());

        long count = 0;

        for (Session session : sessions) {
            if (!force && session.getId().equals(currentSession.getId())) {
                continue;
            }
            sessionRepository.delete(session);
            count++;
        }

        return count;
    }

    // ================= SSO CALLBACK =================
    @Override
    public void handleCallback(String code, String gotoUrl, HttpServletResponse response) throws IOException {

        var authcode = authorizationCodeRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Authorization code not found"));

        try {
            // ================= VALIDATION =================
            if (Boolean.TRUE.equals(authcode.getUsed())) {
                log.warn("Authorization code already used");
                response.sendRedirect("/login?error=code_used");
                return;
            }

            if (authcode.getExpiresAt() == null ||
                    authcode.getExpiresAt().isBefore(LocalDateTime.now())) {

                log.warn("Authorization code expired");
                response.sendRedirect("/login?error=code_expired");
                return;
            }

            if (authcode.getCompany() == null) {
                log.warn("Company missing in authorization code");
                response.sendRedirect("/login?error=company_not_found");
                return;
            }
            // ================= GET CLIENT =================
            UUID clientId = null;
            String clientSecret = null;
            if (authcode.getModule() != null) {
                var moduleId = authcode.getModule().getId();
                Module module = moduleRepository.findById(moduleId)
                        .orElseThrow(() -> new ResourceNotFoundException("Module not found"));
                clientId = module.getClientId();
                clientSecret = module.getClientSecret();
            }

            // ================= PREPARE REQUEST =================
            TokenExchangeRequest request = new TokenExchangeRequest();
            request.setCode(authcode.getCode());
            request.setClientId(clientId);
            request.setClientSecret(clientSecret);

            HttpEntity<TokenExchangeRequest> entity = new HttpEntity<>(request, getHeaders());

            // ================= CALL SSO =================

            ResponseEntity<TokenExchangeResponse> tokenResponse = restTemplate.exchange(
                    ssoBaseUrl + "/api/sso/token/exchange",
                    HttpMethod.POST,
                    entity,
                    TokenExchangeResponse.class);

            TokenExchangeResponse body = tokenResponse.getBody();

            // ================= VALIDATION =================
            if (body == null ||
                    !StringUtils.hasText(body.getAccessToken()) ||
                    !StringUtils.hasText(body.getRefreshToken())) {

                response.sendRedirect("/login?error=invalid_token");
                return;
            }

            // ================= MARK CODE USED =================
            markCodeAsUsed(code);

            // ================= COOKIE =================

            addSecureCookie(response, "access_token",
                    body.getAccessToken(), body.getExpiresIn());

            addSecureCookie(response, "refresh_token",
                    body.getRefreshToken(), 7 * 24 * 60 * 60);

            // ================= REDIRECT =================
            String redirectUrl = resolveSafeRedirect(gotoUrl);

            response.sendRedirect(redirectUrl);

        } catch (HttpClientErrorException e) {

            response.sendRedirect("/login?error=sso_error");

        } catch (Exception e) {

            response.sendRedirect("/login?error=server_error");
        }
    }

    // ================= GET CLIENT =================
    @Override
    public AuthorizationCodeResponseForSession getClientDetail(String code) {

        AuthorizationCode authCode = authorizationCodeRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Authorization code not found"));

        if (Boolean.TRUE.equals(authCode.getUsed())) {
            throw new BadRequestException("Authorization code already used");
        }

        if (authCode.getExpiresAt() != null &&
                authCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Authorization code expired");
        }

        Module module = authCode.getModule();

        return AuthorizationCodeResponseForSession.builder()
                .code(authCode.getCode())
                .clientId(module != null ? module.getClientId() : null)
                .clientSecret(module != null ? module.getClientSecret() : null)
                .build();
    }

    // ================= MARK USED =================
    @Override
    public void markCodeAsUsed(String code) {

        AuthorizationCode authCode = authorizationCodeRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Authorization code not found"));

        authCode.setUsed(true);
        authorizationCodeRepository.save(authCode);
    }

    @Override
    public ResponseEntity<Void> logout(String accessToken, HttpServletResponse response) {

        log.info("Processing logout");

        try {
            // ================= CALL SSO LOGOUT =================
            if (StringUtils.hasText(accessToken)) {

                log.debug("Calling SSO logout API");

                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(accessToken);

                HttpEntity<Void> entity = new HttpEntity<>(headers);

                restTemplate.exchange(
                        ssoBaseUrl + "/api/sso/auth/logout",
                        HttpMethod.POST,
                        entity,
                        Void.class);

                log.info("SSO logout successful");
            } else {
                log.warn("Access token not found in cookie");
            }

        } catch (Exception e) {
            log.error("SSO logout failed, continuing local logout", e);
        }

        // ================= CLEAR COOKIES =================
        clearCookie(response, "access_token");
        clearCookie(response, "refresh_token");

        log.info("Cookies cleared successfully");

        // ================= REDIRECT =================
        HttpHeaders redirectHeaders = new HttpHeaders();
        redirectHeaders.setLocation(URI.create("/login"));

        log.info("Redirecting to /login");

        return new ResponseEntity<>(redirectHeaders, HttpStatus.FOUND);
    }

    @Override
    public ResponseEntity<?> refresh(String refreshToken, HttpServletResponse response) {

        if (!StringUtils.hasText(refreshToken)) {
            log.warn("Refresh token missing");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Refresh token missing"));
        }

        log.info("Processing refresh request");

        try {
            Session session = sessionRepository.findByRefreshToken(refreshToken)
                    .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

            Company company = session.getCompany();

            if (company == null || Boolean.FALSE.equals(company.getActive())) {

                log.warn("Company inactive for sessionId={}", session.getId());

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Company inactive"));
            }

            if (session.getRefreshTokenValidTill() == null ||
                    session.getRefreshTokenValidTill().isBefore(LocalDateTime.now())) {
                log.warn("Refresh token expired for sessionId={}", session.getId());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Refresh token expired"));
            }

            Module module = session.getModule();
            if (module == null) {
                log.error("Module not found for sessionId={}", session.getId());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Module not found for session"));
            }

            if (module.getClientId() == null || !StringUtils.hasText(module.getClientSecret())) {
                log.error("Invalid module configuration for sessionId={}", session.getId());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Invalid module configuration"));
            }

            RefreshTokenRequest payload = new RefreshTokenRequest();
            payload.setRefreshToken(refreshToken.trim());
            payload.setClientId(module.getClientId());

            RequestWrapper<RefreshTokenRequest> request = RequestWrapper.<RefreshTokenRequest>builder()
                    .data(payload)
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<RequestWrapper<RefreshTokenRequest>> entity = new HttpEntity<>(request, headers);

            String refreshUrl = ssoBaseUrl + "/api/sso/token/refresh";
            log.info("Calling SSO refresh API: {}", refreshUrl);
            log.info("Module clientId={}, moduleId={}", module.getClientId(), module.getId());

            ResponseEntity<ResponseWrapper<RefreshTokenResponse>> tokenResponse = restTemplate.exchange(
                    refreshUrl,
                    HttpMethod.POST,
                    entity,
                    new org.springframework.core.ParameterizedTypeReference<ResponseWrapper<RefreshTokenResponse>>() {
                    });

            ResponseWrapper<RefreshTokenResponse> responseWrapper = tokenResponse.getBody();
            RefreshTokenResponse body = responseWrapper != null ? responseWrapper.getData() : null;

            if (body == null ||
                    !StringUtils.hasText(body.getAccessToken()) ||
                    !StringUtils.hasText(body.getRefreshToken())) {
                log.error("Invalid refresh response from SSO");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid refresh response"));
            }

            long expiresIn = body.getExpiresIn() != null ? body.getExpiresIn() : 1800L;

            addSecureCookie(response, "access_token", body.getAccessToken(), expiresIn);
            addSecureCookie(response, "refresh_token", body.getRefreshToken(), 7 * 24 * 60 * 60);

            session.setAccessToken(body.getAccessToken());
            session.setRefreshToken(body.getRefreshToken());
            session.setAccessTokenValidTill(LocalDateTime.now().plusSeconds(expiresIn));
            session.setRefreshTokenValidTill(LocalDateTime.now().plusDays(7));

            session.setModule(module);
            session.setCompany(company);

            sessionRepository.save(session);

            log.info("Token refreshed successfully for sessionId={}", session.getId());

            return ResponseEntity.ok(Map.of(
                    "access_token", body.getAccessToken(),
                    "expires_in", expiresIn));

        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            String responseBody = ex.getResponseBodyAsString();
            String safeBody = StringUtils.hasText(responseBody) ? responseBody : "No response body returned from SSO";

            log.error("SSO refresh failed: status={}, body={}",
                    ex.getStatusCode(),
                    safeBody,
                    ex);

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message", "SSO refresh failed",
                            "status", ex.getStatusCode().value(),
                            "details", safeBody));

        } catch (BadCredentialsException ex) {
            log.warn("Invalid refresh token: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", ex.getMessage()));

        } catch (Exception ex) {
            log.error("Refresh flow failed", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message", "Refresh flow failed",
                            "details", ex.getMessage()));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public SessionPageResponse getAllSessions(
            UUID companyId,
            int page,
            int pageSize) {

        int validatedPage = Math.max(page, 1);
        int validatedPageSize = Math.min(Math.max(pageSize, 1), 100);

        Pageable pageable = PageRequest.of(
                validatedPage - 1,
                validatedPageSize,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        LocalDateTime now = LocalDateTime.now();

        Page<Session> sessionPage = sessionRepository.findAllByCompanyId(
                companyId,
                pageable);

        List<SsoSessionResponse> activeSessions = sessionPage.getContent()
                .stream()
                .filter(session -> session.getAccessTokenValidTill() != null &&
                        session.getAccessTokenValidTill().isAfter(now))
                .map(ssoSessionMapper::toResponse)
                .toList();

        long filteredTotalCount = sessionPage.getContent()
                .stream()
                .filter(session -> session.getAccessTokenValidTill() != null &&
                        session.getAccessTokenValidTill().isAfter(now))
                .count();

        return SessionPageResponse.builder()
                .sessions(activeSessions)
                .pagination(
                        PaginationResponse.builder()
                                .currentPage(validatedPage)
                                .pageSize(validatedPageSize)
                                .totalPages(sessionPage.getTotalPages())
                                .totalCount(filteredTotalCount)
                                .build())
                .build();
    }

    @Override
    public void revokeSessionByAdmin(UUID id) {

        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        sessionRepository.delete(session);

        log.info(
                "Admin revoked session. sessionId={}, userId={}, moduleId={}",
                session.getId(),
                session.getUser() != null ? session.getUser().getId() : null,
                session.getModule() != null ? session.getModule().getId() : null);
    }

    // ================= HELPERS =================
    private HttpHeaders getHeaders() {

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);

        return headers;
    }

    private void addSecureCookie(
            HttpServletResponse response,
            String name,
            String value,
            long maxAge) {

        Cookie cookie = new Cookie(name, value);

        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge((int) maxAge);

        cookie.setAttribute("SameSite", cookieSameSite);

        response.addCookie(cookie);
    }

    private void clearCookie(
            HttpServletResponse response,
            String name) {

        Cookie cookie = new Cookie(name, null);

        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(0);

        cookie.setAttribute("SameSite", cookieSameSite);

        response.addCookie(cookie);
    }

    private String resolveSafeRedirect(String gotoUrl) {

        if (!StringUtils.hasText(gotoUrl)) {
            return "/dashboard";
        }

        if (gotoUrl.startsWith("http://") ||
                gotoUrl.startsWith("https://")) {

            return "/dashboard";
        }

        return gotoUrl;
    }
}