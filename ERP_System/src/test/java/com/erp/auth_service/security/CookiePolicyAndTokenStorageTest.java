package com.erp.auth_service.security;

import com.erp.auth_service.controller.AuthController;
import com.erp.auth_service.dto.response.TokenResponse;
import com.erp.auth_service.dto.response.UserResponse;
import com.erp.auth_service.service.CookieService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class CookiePolicyAndTokenStorageTest {

    @Test
    @DisplayName("CookieService: addAuthCookies sets ACCESS_TOKEN with httpOnly=false, ACCESS_TOKEN_REFRESH with httpOnly=true, and clears legacy cookies")
    void testCookieServiceAddAuthCookies() {
        CookieService cookieService = new CookieService();
        MockHttpServletResponse response = new MockHttpServletResponse();

        TokenResponse tokenResponse = TokenResponse.builder()
                .accessToken("sample-access-jwt")
                .refreshToken("sample-refresh-uuid")
                .user(UserResponse.builder()
                        .id(UUID.randomUUID())
                        .email("user@erp.com")
                        .build())
                .build();

        cookieService.addAuthCookies(response, tokenResponse);

        Cookie[] cookies = response.getCookies();
        assertNotNull(cookies);

        Cookie accessCookie = null;
        Cookie refreshCookie = null;
        Cookie legacyAuthCookie = null;
        Cookie legacyAccessCookie = null;
        Cookie legacyRefreshCookie = null;

        for (Cookie c : cookies) {
            if ("ACCESS_TOKEN".equals(c.getName())) accessCookie = c;
            if ("ACCESS_TOKEN_REFRESH".equals(c.getName())) refreshCookie = c;
            if ("auth_token".equals(c.getName())) legacyAuthCookie = c;
            if ("access_token".equals(c.getName())) legacyAccessCookie = c;
            if ("refresh_token".equals(c.getName())) legacyRefreshCookie = c;
        }

        assertNotNull(accessCookie, "ACCESS_TOKEN cookie must be set");
        assertEquals("sample-access-jwt", accessCookie.getValue());
        assertFalse(accessCookie.isHttpOnly(), "ACCESS_TOKEN must have httpOnly=false so SPA can read it for Authorization headers");
        assertTrue(accessCookie.getMaxAge() > 0, "ACCESS_TOKEN must have positive max age");
        assertEquals("/", accessCookie.getPath());

        assertNotNull(refreshCookie, "ACCESS_TOKEN_REFRESH cookie must be set");
        assertEquals("sample-refresh-uuid", refreshCookie.getValue());
        assertTrue(refreshCookie.isHttpOnly(), "ACCESS_TOKEN_REFRESH must have httpOnly=true to protect refresh token against XSS");
        assertTrue(refreshCookie.getMaxAge() > 0, "ACCESS_TOKEN_REFRESH must have positive max age");
        assertEquals("/", refreshCookie.getPath());

        assertNotNull(legacyAuthCookie, "auth_token clearing cookie must be present");
        assertEquals(0, legacyAuthCookie.getMaxAge(), "auth_token must be expired with maxAge=0");

        assertNotNull(legacyAccessCookie, "access_token clearing cookie must be present");
        assertEquals(0, legacyAccessCookie.getMaxAge(), "access_token must be expired with maxAge=0");

        assertNotNull(legacyRefreshCookie, "refresh_token clearing cookie must be present");
        assertEquals(0, legacyRefreshCookie.getMaxAge(), "refresh_token must be expired with maxAge=0");
    }

    @Test
    @DisplayName("CookieService: clearCookies deletes canonical and legacy auth cookies")
    void testCookieServiceClearCookies() {
        CookieService cookieService = new CookieService();
        MockHttpServletResponse response = new MockHttpServletResponse();

        cookieService.clearCookies(response);

        Cookie[] cookies = response.getCookies();
        assertNotNull(cookies);
        assertTrue(cookies.length >= 5);

        for (Cookie c : cookies) {
            assertEquals(0, c.getMaxAge(), "All cleared cookies must have maxAge=0: " + c.getName());
            assertEquals("/", c.getPath());
        }
    }

    @Test
    @DisplayName("AuthController: extractToken prioritizes canonical ACCESS_TOKEN over legacy auth_token cookie")
    void testExtractTokenPrecedence() throws Exception {
        AuthController controller = new AuthController(null, null, null, null, null, null);
        Method method = AuthController.class.getDeclaredMethod("extractToken", String.class, HttpServletRequest.class);
        method.setAccessible(true);

        // 1. Both ACCESS_TOKEN and auth_token present, but auth_token appears first in array
        MockHttpServletRequest requestWithBoth = new MockHttpServletRequest();
        requestWithBoth.setCookies(
                new Cookie("auth_token", "stale-auth-token-value"),
                new Cookie("ACCESS_TOKEN", "fresh-canonical-access-token"),
                new Cookie("access_token", "stale-access-token-value")
        );
        String extracted = (String) method.invoke(controller, null, requestWithBoth);
        assertEquals("fresh-canonical-access-token", extracted, "Canonical ACCESS_TOKEN must be preferred even if auth_token appears first");

        // 2. Only legacy auth_token present (fallback test)
        MockHttpServletRequest requestWithLegacyAuth = new MockHttpServletRequest();
        requestWithLegacyAuth.setCookies(new Cookie("auth_token", "legacy-auth-token"));
        String legacyAuth = (String) method.invoke(controller, null, requestWithLegacyAuth);
        assertEquals("legacy-auth-token", legacyAuth, "Should fall back to legacy auth_token if ACCESS_TOKEN is absent");

        // 3. Authorization Bearer header takes highest precedence over cookies
        MockHttpServletRequest requestWithHeaderAndCookies = new MockHttpServletRequest();
        requestWithHeaderAndCookies.setCookies(new Cookie("ACCESS_TOKEN", "cookie-token"));
        String headerResult = (String) method.invoke(controller, "Bearer header-bearer-token", requestWithHeaderAndCookies);
        assertEquals("header-bearer-token", headerResult, "Bearer Authorization header must take precedence over cookies");
    }

    @Test
    @DisplayName("AuthController: attachAuthCookies writes canonical ACCESS_TOKEN and clears legacy auth_token & access_token")
    void testAuthControllerAttachAuthCookies() throws Exception {
        JwtDecoder stubDecoder = new JwtDecoder() {
            @Override
            public java.util.Date extractExpiration(String token) {
                return new java.util.Date(System.currentTimeMillis() + 900_000);
            }
        };
        AuthController controller = new AuthController(null, null, null, null, stubDecoder, null);

        Field sameSiteField = AuthController.class.getDeclaredField("sameSite");
        sameSiteField.setAccessible(true);
        sameSiteField.set(controller, "Lax");

        Field secureField = AuthController.class.getDeclaredField("secure");
        secureField.setAccessible(true);
        secureField.set(controller, false);

        Method attachMethod = AuthController.class.getDeclaredMethod(
                "attachAuthCookies", HttpHeaders.class, String.class, String.class, boolean.class);
        attachMethod.setAccessible(true);

        HttpHeaders headers = new HttpHeaders();
        attachMethod.invoke(controller, headers, "canonical-access-jwt", "refresh-token-uuid", false);

        List<String> setCookieHeaders = headers.get(HttpHeaders.SET_COOKIE);
        assertNotNull(setCookieHeaders);

        boolean hasCanonicalAccess = false;
        boolean hasHttpOnlyInAccess = false;
        boolean hasClearAuthToken = false;
        boolean hasClearLegacyAccess = false;
        boolean hasClearLegacyRefresh = false;
        boolean hasCanonicalRefresh = false;
        boolean hasHttpOnlyInRefresh = false;

        for (String headerVal : setCookieHeaders) {
            if (headerVal.startsWith("ACCESS_TOKEN=")) {
                hasCanonicalAccess = true;
                if (headerVal.toLowerCase().contains("httponly")) {
                    hasHttpOnlyInAccess = true;
                }
            } else if (headerVal.startsWith("ACCESS_TOKEN_REFRESH=")) {
                hasCanonicalRefresh = true;
                if (headerVal.toLowerCase().contains("httponly")) {
                    hasHttpOnlyInRefresh = true;
                }
            } else if (headerVal.startsWith("auth_token=")) {
                if (headerVal.contains("Max-Age=0") || headerVal.contains("max-age=0")) {
                    hasClearAuthToken = true;
                }
            } else if (headerVal.startsWith("access_token=")) {
                if (headerVal.contains("Max-Age=0") || headerVal.contains("max-age=0")) {
                    hasClearLegacyAccess = true;
                }
            } else if (headerVal.startsWith("refresh_token=")) {
                if (headerVal.contains("Max-Age=0") || headerVal.contains("max-age=0")) {
                    hasClearLegacyRefresh = true;
                }
            }
        }

        assertTrue(hasCanonicalAccess, "ACCESS_TOKEN cookie must be set in response headers");
        assertFalse(hasHttpOnlyInAccess, "ACCESS_TOKEN must NOT be HttpOnly so JavaScript SPA can read it");
        assertTrue(hasCanonicalRefresh, "ACCESS_TOKEN_REFRESH cookie must be set in response headers");
        assertTrue(hasHttpOnlyInRefresh, "ACCESS_TOKEN_REFRESH must have HttpOnly set");
        assertTrue(hasClearAuthToken, "auth_token must be expired with Max-Age=0");
        assertTrue(hasClearLegacyAccess, "access_token must be expired with Max-Age=0");
        assertTrue(hasClearLegacyRefresh, "refresh_token must be expired with Max-Age=0");
    }
}
