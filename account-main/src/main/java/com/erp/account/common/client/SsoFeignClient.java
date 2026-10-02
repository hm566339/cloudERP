package com.erp.account.common.client;

import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.auth.dto.request.RefreshToken;
import com.erp.account.modules.auth.dto.request.TokenExchangeRequest;
import com.erp.account.modules.auth.dto.ssoresponse.LogoutResponse;
import com.erp.account.modules.auth.dto.ssoresponse.ResponseWrapper;
import com.erp.account.modules.auth.dto.ssoresponse.TokenResponse;
import com.erp.account.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.account.modules.auth.dto.ssoresponse.UserResponse;
import com.erp.account.modules.auth.dto.ssoresponse.SsoMeResponse;
import com.erp.account.modules.company.dto.clientdto.CompanyResponseClient;

import java.util.List;

@FeignClient(name = "ssoClient", url = "${sso.backend}")
public interface SsoFeignClient {

        @PostMapping("/api/sso/token/exchange")
        TokenResponse exchangeCode(@RequestBody RequestWrapper<TokenExchangeRequest> request);

        @PostMapping("/api/sso/token/refresh")
        ResponseWrapper<TokenResponse> refreshAccessToken(@RequestBody RequestWrapper<RefreshToken> request);

        @PostMapping("/api/sso/token/verify")
        ResponseWrapper<TokenVerifyResponse> verifyToken(@RequestHeader("Authorization") String token);

        @PostMapping("/api/sso/auth/logout")
        LogoutResponse logout(@RequestHeader("Authorization") String token);

        @GetMapping("/api/sso/auth/me")
        ResponseWrapper<SsoMeResponse> fetchUserInfo(@RequestHeader("Authorization") String token);

        @GetMapping("/api/sso/company/company-verify")
        ResponseWrapper<CompanyResponseClient> verifyCompany(
                        @RequestHeader("Authorization") String token,
                        @RequestParam(value = "id", required = false) UUID id,
                        @RequestParam(value = "companyCode", required = false) String companyCode);

        @PostMapping("/api/sso/users/batch")
        ResponseWrapper<List<UserResponse>> fetchUsersByIds(
                        @RequestHeader("Authorization") String token,
                        @RequestBody List<UUID> userIds);

        @GetMapping("/api/sso/users/{id}")
        ResponseWrapper<UserResponse> fetchUserById(
                        @RequestHeader("Authorization") String token,
                        @PathVariable("id") UUID userId);

        @GetMapping("/api/sso/features/user/{id}/active")
        ResponseWrapper<com.erp.account.modules.auth.dto.ssoresponse.UserActiveFeaturesResponse> fetchUserActiveFeatures(
                        @RequestHeader("Authorization") String token,
                        @PathVariable("id") UUID userId);
}
