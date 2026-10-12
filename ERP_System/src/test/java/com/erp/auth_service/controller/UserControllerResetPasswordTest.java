package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.PasswordReset;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.exception.GlobalExceptionHandler;
import com.erp.auth_service.exception.TokenExpiredException;
import com.erp.auth_service.service.AuthService;
import com.erp.auth_service.service.UserAccessService;
import com.erp.auth_service.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerResetPasswordTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @Mock
    private UserAccessService userAccessService;

    @Mock
    private AuthService authService;

    @InjectMocks
    private UserController userController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("Reset password succeeds with frontend wrapped payload and query param token")
    void testResetPassword_Success_WrappedPayloadAndQueryParamToken() throws Exception {
        when(authService.resetPasswordWithDetails(any(PasswordReset.class), eq("reset-token-123")))
                .thenReturn(Map.of(
                        "message", "Password set successfully",
                        "companyCode", "techcorp",
                        "companyLoginUrl", "https://www.mark2.in/c/techcorp/login"
                ));

        String json = """
                {
                    "data": {
                        "password": "ValidPassword123@"
                    }
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .param("token", "reset-token-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").value("Password set successfully"))
                .andExpect(jsonPath("$.data.companyCode").value("techcorp"))
                .andExpect(jsonPath("$.data.companyLoginUrl").value("https://www.mark2.in/c/techcorp/login"));
    }

    @Test
    @DisplayName("Reset password succeeds with direct unwrapped JSON body and query param token")
    void testResetPassword_Success_DirectPayloadAndQueryParamToken() throws Exception {
        when(authService.resetPasswordWithDetails(any(PasswordReset.class), eq("reset-token-456")))
                .thenReturn(Map.of(
                        "message", "Password set successfully",
                        "companyCode", "alpha",
                        "companyLoginUrl", "https://www.mark2.in/c/alpha/login"
                ));

        String json = """
                {
                    "password": "ValidPassword123@"
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .param("token", "reset-token-456")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.companyCode").value("alpha"));
    }

    @Test
    @DisplayName("Reset password succeeds when token is supplied inside the JSON body")
    void testResetPassword_Success_TokenInBody() throws Exception {
        when(authService.resetPasswordWithDetails(any(PasswordReset.class), eq("body-token-789")))
                .thenReturn(Map.of(
                        "message", "Password set successfully",
                        "companyCode", "beta",
                        "companyLoginUrl", "https://www.mark2.in/c/beta/login"
                ));

        String json = """
                {
                    "token": "body-token-789",
                    "password": "ValidPassword123@"
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.companyCode").value("beta"));
    }

    @Test
    @DisplayName("Reset password succeeds when token is supplied inside wrapped data object")
    void testResetPassword_Success_WrappedTokenInBody() throws Exception {
        when(authService.resetPasswordWithDetails(any(PasswordReset.class), eq("wrapped-body-token")))
                .thenReturn(Map.of(
                        "message", "Password set successfully",
                        "companyCode", "gamma",
                        "companyLoginUrl", "https://www.mark2.in/c/gamma/login"
                ));

        String json = """
                {
                    "data": {
                        "token": "wrapped-body-token",
                        "password": "ValidPassword123@"
                    }
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.companyCode").value("gamma"));
    }

    @Test
    @DisplayName("Missing token returns 401 Unauthorized")
    void testResetPassword_MissingToken_Returns401() throws Exception {
        String json = """
                {
                    "password": "ValidPassword123@"
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Token is required"));
    }

    @Test
    @DisplayName("Missing password returns 400 Bad Request")
    void testResetPassword_MissingPassword_Returns400() throws Exception {
        String json = """
                {
                    "password": ""
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .param("token", "some-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Password is required"));
    }

    @Test
    @DisplayName("Password violating security policy returns 400 Bad Request")
    void testResetPassword_WeakPassword_Returns400() throws Exception {
        String json = """
                {
                    "password": "weak"
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .param("token", "some-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Password must be between 8 and 50 characters"));
    }

    @Test
    @DisplayName("Mismatched confirm password returns 400 Bad Request")
    void testResetPassword_MismatchedConfirmPassword_Returns400() throws Exception {
        String json = """
                {
                    "password": "ValidPassword123@",
                    "confirmPassword": "DifferentPassword123@"
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .param("token", "some-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Passwords do not match"));
    }

    @Test
    @DisplayName("Matching confirm password succeeds")
    void testResetPassword_MatchingConfirmPassword_Succeeds() throws Exception {
        when(authService.resetPasswordWithDetails(any(PasswordReset.class), eq("some-token")))
                .thenReturn(Map.of(
                        "message", "Password set successfully",
                        "companyCode", "delta",
                        "companyLoginUrl", "https://www.mark2.in/c/delta/login"
                ));

        String json = """
                {
                    "password": "ValidPassword123@",
                    "confirmPassword": "ValidPassword123@"
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .param("token", "some-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Expired token returns 401 Unauthorized")
    void testResetPassword_ExpiredToken_Returns401() throws Exception {
        when(authService.resetPasswordWithDetails(any(PasswordReset.class), eq("expired-tok")))
                .thenThrow(new TokenExpiredException("Token expired"));

        String json = """
                {
                    "password": "ValidPassword123@"
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .param("token", "expired-tok")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Token expired"));
    }

    @Test
    @DisplayName("Already used token returns 401 Unauthorized")
    void testResetPassword_AlreadyUsedToken_Returns401() throws Exception {
        when(authService.resetPasswordWithDetails(any(PasswordReset.class), eq("used-tok")))
                .thenThrow(new BadCredentialsException("Token already used"));

        String json = """
                {
                    "password": "ValidPassword123@"
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .param("token", "used-tok")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Token already used"));
    }

    @Test
    @DisplayName("Invalid/non-existent token returns 401 Unauthorized")
    void testResetPassword_InvalidToken_Returns401() throws Exception {
        when(authService.resetPasswordWithDetails(any(PasswordReset.class), eq("invalid-tok")))
                .thenThrow(new BadCredentialsException("Token not found"));

        String json = """
                {
                    "password": "ValidPassword123@"
                }
                """;

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .param("token", "invalid-tok")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Token not found"));
    }

    @Test
    @DisplayName("Malformed JSON returns 400 Bad Request instead of 500")
    void testResetPassword_MalformedJson_Returns400() throws Exception {
        String malformedJson = "{ \"password\": ";

        mockMvc.perform(post("/api/sso/user/reset-password")
                        .param("token", "some-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request body or invalid JSON"));
    }

    @Test
    @DisplayName("Unsupported HTTP method (PATCH) returns 405 Method Not Allowed")
    void testResetPassword_WrongHttpMethod_Returns405() throws Exception {
        mockMvc.perform(patch("/api/sso/user/reset-password")
                        .param("token", "some-token"))
                .andExpect(status().isMethodNotAllowed());
    }
}
