package com.erp.auth_service.utility;

import jakarta.servlet.http.Cookie;

public class CookieUtil {

    public static Cookie createCookie(String name, String value, int maxAgeInSeconds) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(maxAgeInSeconds);
        return cookie;
    }
}