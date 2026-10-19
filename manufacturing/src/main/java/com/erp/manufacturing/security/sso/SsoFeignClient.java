package com.erp.manufacturing.security.sso;

import com.erp.manufacturing.integration.inventory.config.FeignClientConfig;
import com.erp.manufacturing.security.dto.sso.CompanyResponse;
import com.erp.manufacturing.security.dto.sso.ResponseWrapper;
import com.erp.manufacturing.security.dto.sso.TokenVerifyResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "ssoClient", url = "${sso.backend:http://auth-service:8090}", configuration = FeignClientConfig.class)
public interface SsoFeignClient {

    @PostMapping("/api/sso/token/verify")
    ResponseWrapper<TokenVerifyResponse> verifyToken(@RequestHeader("Authorization") String token);

    @GetMapping("/api/sso/company/company-verify")
    ResponseWrapper<CompanyResponse> verifyCompany(
            @RequestParam(value = "id", required = false) UUID id,
            @RequestParam(value = "companyCode", required = false) String companyCode,
            @RequestHeader(value = "Authorization", required = false) String token);
}

