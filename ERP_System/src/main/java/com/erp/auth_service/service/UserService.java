package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.CreateUserByAdmin;
import com.erp.auth_service.dto.request.UpdateUserRequest;
import com.erp.auth_service.dto.response.SsoMeResponse;
import com.erp.auth_service.dto.response.UserListResponse;
import com.erp.auth_service.dto.response.UserResponse;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.Status;

import java.util.UUID;

public interface UserService {

    UserResponse create(CreateUserByAdmin request, UUID companyId, UUID moduleid);

    UserResponse getUserDetails(UUID userId);

    UserListResponse getAllUsers(
            int page,
            int pageSize,
            String search,
            AccountStatus status,
            String role,
            UUID companyId);

    UserResponse update(UUID userId, UpdateUserRequest request);

    UserResponse updateStatus(UUID userId, AccountStatus status);

    void delete(UUID userId);

    String verifyEmail(String token);

    String forgotPassword(String email, UUID companyId);

    String resetPassword(String token, String newPassword);

    String changePassword(UUID userId, String currentPassword, String newPassword);

    /**
     * Returns the basic user profile (legacy / Account-module-compatible endpoint).
     * Prefer {@link #getSsoMe(String)} for global ERP shell authorization context.
     */
    UserResponse getCurrentUser(String accessToken);

    /**
     * Returns the full global ERP authorization context from SSO.
     * This is the canonical source of truth for the Common ERP Shell.
     * Includes: user, organization, currentCompany, accessible companies,
     * membership, subscription, authorized modules, roles, features, permissions.
     */
    SsoMeResponse getSsoMe(String accessToken);

    SsoMeResponse getSsoMe(String accessToken, UUID requestedCompanyId);

    SsoMeResponse getSsoMe(String accessToken, String companyParam);

    Status verifyEmailAdmin(UUID id, Status status);

    UserResponse resendSetupEmail(UUID userId);

}