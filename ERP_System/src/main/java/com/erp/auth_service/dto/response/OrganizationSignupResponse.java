package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class OrganizationSignupResponse {
    UserIdentity user;
    OrganizationIdentity organization;
    CompanyIdentity company;
    SubscriptionIdentity subscription;
    LoginIdentity login;

    @Value
    @Builder
    public static class UserIdentity { UUID id; }

    @Value
    @Builder
    public static class OrganizationIdentity { UUID id; String name; String code; }

    @Value
    @Builder
    public static class CompanyIdentity { UUID id; String name; String code; }

    @Value
    @Builder
    public static class SubscriptionIdentity { String status; String accessMode; LocalDateTime trialEndsAt; }

    @Value
    @Builder
    public static class LoginIdentity { String url; }
}