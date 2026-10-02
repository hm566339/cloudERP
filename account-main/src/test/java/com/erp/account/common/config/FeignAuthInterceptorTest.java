package com.erp.account.common.config;

import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Collection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

class FeignAuthInterceptorTest {

    private FeignAuthInterceptor interceptor;

    @Mock
    private HttpServletRequest request;

    private AutoCloseable mocks;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        interceptor = new FeignAuthInterceptor();
    }

    @AfterEach
    void tearDown() throws Exception {
        RequestContextHolder.resetRequestAttributes();
        if (mocks != null) {
            mocks.close();
        }
    }

    @Test
    void apply_WithValidBearerToken_ForwardsToken() {
        // Arrange
        String token = "Bearer abc123def456";
        when(request.getHeader("Authorization")).thenReturn(token);
        ServletRequestAttributes attributes = new ServletRequestAttributes(request);
        RequestContextHolder.setRequestAttributes(attributes);

        RequestTemplate template = new RequestTemplate();

        // Act
        interceptor.apply(template);

        // Assert
        assertTrue(template.headers().containsKey("Authorization"));
        Collection<String> authHeaders = template.headers().get("Authorization");
        assertEquals(1, authHeaders.size());
        assertEquals(token, authHeaders.iterator().next());
    }

    @Test
    void apply_WithoutAuthorizationHeader_DoesNotAddHeader() {
        // Arrange
        when(request.getHeader("Authorization")).thenReturn(null);
        ServletRequestAttributes attributes = new ServletRequestAttributes(request);
        RequestContextHolder.setRequestAttributes(attributes);

        RequestTemplate template = new RequestTemplate();

        // Act
        interceptor.apply(template);

        // Assert
        assertFalse(template.headers().containsKey("Authorization"));
    }

    @Test
    void apply_WithMalformedAuthorizationHeader_DoesNotForward() {
        // Arrange
        String token = "Basic abc123def456";
        when(request.getHeader("Authorization")).thenReturn(token);
        ServletRequestAttributes attributes = new ServletRequestAttributes(request);
        RequestContextHolder.setRequestAttributes(attributes);

        RequestTemplate template = new RequestTemplate();

        // Act
        interceptor.apply(template);

        // Assert
        assertFalse(template.headers().containsKey("Authorization"));
    }

    @Test
    void apply_WithNoRequestAttributes_DoesNotFail() {
        // Arrange
        RequestContextHolder.resetRequestAttributes();
        RequestTemplate template = new RequestTemplate();

        // Act
        interceptor.apply(template);

        // Assert
        assertFalse(template.headers().containsKey("Authorization"));
    }
}
