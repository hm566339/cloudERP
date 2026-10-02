package com.erp.auth_service.security;

import com.erp.auth_service.model.platform.PlatformAdmin;
import com.erp.auth_service.model.platform.PlatformAdminStatus;
import com.erp.auth_service.repository.MemberCompanyAccessRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.SupportAccessSessionRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformAdminSecurityFilterTest {

    @Mock
    private JwtDecoder jwtDecoder;
    @Mock
    private CustomUserDetailsService userDetailsService;
    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private OrganizationMemberRepository organizationMemberRepository;
    @Mock
    private MemberCompanyAccessRepository memberCompanyAccessRepository;
    @Mock
    private PlatformAdminRepository platformAdminRepository;
    @Mock
    private SupportAccessSessionRepository supportAccessSessionRepository;
    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Filter: Customer JWT calling /api/sso/admin/dashboard is rejected with 403 Forbidden")
    void filter_CustomerTokenOnAdminRoute_RejectedWith403() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/api/sso/admin/dashboard");
        request.addHeader("Authorization", "Bearer customer.jwt.token");

        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtDecoder.isTokenValid("customer.jwt.token")).thenReturn(true);
        Claims claims = new DefaultClaims(Map.of("sub", "customer@user.com", "userId", UUID.randomUUID().toString()));
        when(jwtDecoder.extractClaims("customer.jwt.token")).thenReturn(claims);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
        assertTrue(response.getContentAsString()
                .contains("Customer tokens are not authorized for platform administration"));
        verifyNoInteractions(filterChain);
    }

    @Test
    @DisplayName("Filter: Platform Admin JWT calling customer endpoint without support session is rejected with 403")
    void filter_PlatformAdminOnCustomerRoute_RejectedWith403() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/api/sso/organization/members");
        request.addHeader("Authorization", "Bearer admin.jwt.token");

        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtDecoder.isTokenValid("admin.jwt.token")).thenReturn(true);
        Claims claims = new DefaultClaims(
                Map.of("principalType", "PLATFORM_ADMIN", "adminId", UUID.randomUUID().toString()));
        when(jwtDecoder.extractClaims("admin.jwt.token")).thenReturn(claims);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
        assertTrue(response.getContentAsString()
                .contains("Platform admin tokens cannot directly access customer endpoints"));
        verifyNoInteractions(filterChain);
    }

    @Test
    @DisplayName("Filter: Disabled Platform Admin calling /api/admin/organizations is rejected with 403")
    void filter_DisabledPlatformAdmin_RejectedWith403() throws Exception {
        UUID adminId = UUID.randomUUID();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/api/admin/organizations");
        request.addHeader("Authorization", "Bearer admin.jwt.token");

        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtDecoder.isTokenValid("admin.jwt.token")).thenReturn(true);
        Claims claims = new DefaultClaims(Map.of("principalType", "PLATFORM_ADMIN", "adminId", adminId.toString()));
        when(jwtDecoder.extractClaims("admin.jwt.token")).thenReturn(claims);

        PlatformAdmin disabledAdmin = PlatformAdmin.builder()
                .id(adminId)
                .email("disabled@platform.com")
                .status(PlatformAdminStatus.INACTIVE)
                .build();
        when(platformAdminRepository.findById(adminId)).thenReturn(Optional.of(disabledAdmin));

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
        assertTrue(response.getContentAsString().contains("Platform admin is inactive or disabled"));
        verifyNoInteractions(filterChain);
    }
}
