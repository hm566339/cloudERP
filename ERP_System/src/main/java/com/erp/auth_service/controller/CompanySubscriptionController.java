package com.erp.auth_service.controller;

import com.erp.auth_service.dto.response.CompanySubscriptionResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.SubscriptionPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sso/company-subscriptions")
@RequiredArgsConstructor
public class CompanySubscriptionController {

    private final SubscriptionPlanService subscriptionPlanService;

    @GetMapping("/current")
    public ResponseEntity<ResponseWrapper<CompanySubscriptionResponse>> getCurrentCompanySubscription() {
        RequestContext.Context context = RequestContext.get();
        if (context == null || context.companyId() == null) {
            throw new BadRequestException("No company context found in current session");
        }
        return ResponseEntity.ok(ResponseWrapper.success(
                subscriptionPlanService.getCurrentCompanySubscription(context.companyId())));
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<ResponseWrapper<CompanySubscriptionResponse>> getCompanySubscription(
            @PathVariable UUID companyId) {
        assertCompanyAccess(companyId);
        return ResponseEntity.ok(ResponseWrapper.success(
                subscriptionPlanService.getCurrentCompanySubscription(companyId)));
    }

    private void assertCompanyAccess(UUID targetCompanyId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null) {
            boolean isElevated = auth.getAuthorities().stream().anyMatch(a ->
                    "SYSTEM_ADMIN".equals(a.getAuthority())
                    || "ROLE_SUPER_ADMIN".equals(a.getAuthority())
                    || "ROLE_PLATFORM_SUPPORT".equals(a.getAuthority())
                    || "PERM_PLATFORM_SUBSCRIPTION_READ".equals(a.getAuthority())
                    || "PERM_PLATFORM_COMPANY_READ".equals(a.getAuthority()));
            if (isElevated) {
                return;
            }
        }

        RequestContext.Context context = RequestContext.get();
        if (context != null && context.companyId() != null) {
            if (!context.companyId().equals(targetCompanyId)) {
                throw new ForbiddenException("Access denied: Cannot access subscription data for another company");
            }
        }
    }
}
