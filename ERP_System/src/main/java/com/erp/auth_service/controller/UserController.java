package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.*;
import com.erp.auth_service.dto.response.PortalAccessGrantResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.response.UserListResponse;
import com.erp.auth_service.dto.response.UserResponse;
import com.erp.auth_service.dto.response.UserRoleAssignmentResponse;
import com.erp.auth_service.service.AuthService;
import com.erp.auth_service.service.UserAccessService;
import com.erp.auth_service.service.UserService;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.Status;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/sso/user")
@RequiredArgsConstructor
public class UserController {

        private final UserService userService;
        private final UserAccessService userAccessService;
        private final AuthService authService;

        // POST /user
        @PostMapping
        public ResponseEntity<ResponseWrapper<UserResponse>> createUser(@Valid @RequestBody RequestWrapper<CreateUserByAdmin> request,
                        @RequestParam UUID companyId, @RequestParam UUID module) {
                UserResponse response = userService.create(request.getData(), companyId, module);
                return ResponseEntity.ok(ResponseWrapper.success(response));
        }

        // GET /user/:id
        @GetMapping("/{id}")
        public ResponseEntity<ResponseWrapper<UserResponse>> getUser(@PathVariable UUID id) {
                System.out.println("Fetching user with ID: " + id);
                return ResponseEntity.ok(ResponseWrapper.success(userService.getUserDetails(id)));
        }

        // GET /user
        @GetMapping("/company/{companyId}")
        public ResponseEntity<ResponseWrapper<UserListResponse>> getAllUsers(
                        @RequestParam int page,
                        @RequestParam int pageSize,
                        @RequestParam(required = false) String search,
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) String role,
                        @PathVariable UUID companyId) {
                AccountStatus accountStatus = null;

                if (status != null && !status.isBlank()) {
                        accountStatus = AccountStatus.valueOf(status.trim().toUpperCase());
                }

                return ResponseEntity.ok(
                                ResponseWrapper.success(userService.getAllUsers(page, pageSize, search, accountStatus, role, companyId)));
        }

        // PUT /user/:id
        @PutMapping("/{id}")
        public ResponseEntity<ResponseWrapper<UserResponse>> updateUser(
                        @PathVariable UUID id,
                        @Valid @RequestBody RequestWrapper<UpdateUserRequest> request) {
                return ResponseEntity.ok(ResponseWrapper.success(userService.update(id, request.getData())));
        }

        // DELETE /user/:id
        @DeleteMapping("/{id}")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> deleteUser(@PathVariable UUID id) {
                userService.delete(id);
                return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "User deleted")));
        }

        // POST /user/:id/resend-setup-email
        @PostMapping("/{id}/resend-setup-email")
        public ResponseEntity<ResponseWrapper<UserResponse>> resendSetupEmail(@PathVariable UUID id) {
                return ResponseEntity.ok(ResponseWrapper.success(userService.resendSetupEmail(id)));
        }

        // POST /user/:id/role
        @PostMapping("/{id}/role")
        public ResponseEntity<ResponseWrapper<UserRoleAssignmentResponse>> assignRole(
                        @PathVariable UUID id,
                        @Valid @RequestBody RequestWrapper<AssignRoleRequest> request) {
                return ResponseEntity.ok(ResponseWrapper.success(userAccessService.assignRole(id, request.getData().getRoleId())));
        }

        // DELETE /user/:id/role/:roleId
        @DeleteMapping("/{id}/role/{roleId}")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> removeRole(
                        @PathVariable UUID id,
                        @PathVariable UUID roleId) {
                userAccessService.removeRole(id, roleId);
                return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Role removed")));
        }

        // POST /user/:id/portal-access
        @PostMapping("/{id}/portal-access")
        public ResponseEntity<ResponseWrapper<PortalAccessGrantResponse>> grantPortalAccess(
                        @PathVariable UUID id,
                        @Valid @RequestBody RequestWrapper<GrantPortalAccessRequest> request) {
                return ResponseEntity.ok(ResponseWrapper.success(userAccessService.grantPortalAccess(id, request.getData().getModuleId())));
        }

        // DELETE /user/:id/portalaccess/:moduleId
        @DeleteMapping("/{id}/portalaccess/{moduleId}")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> removePortalAccess(
                        @PathVariable UUID id,
                        @PathVariable UUID moduleId) {
                userAccessService.removePortalAccess(id, moduleId);
                return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Portal access removed")));
        }

        @PatchMapping("/{userId}/portal/{moduleId}/toggle")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> togglePortalAccess(
                        @PathVariable UUID userId,
                        @PathVariable UUID moduleId) {

                userAccessService.togglePortalAccess(userId, moduleId);

                return ResponseEntity.ok(
                                ResponseWrapper.success(Map.of("message", "Portal access status updated successfully")));
        }

        // POST /user/:id/change-password
        @PostMapping("/{id}/change-password")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> changePassword(
                        @PathVariable UUID id,
                        @Valid @RequestBody RequestWrapper<ChangePasswordRequest> request) {

                String message = userService.changePassword(
                                id,
                                request.getData().getCurrentPassword(),
                                request.getData().getNewPassword());
                return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", message)));
        }

        // ================= VERIFY EMAIL =================
        @GetMapping("/verify-email")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> verifyEmail(@RequestParam("token") String token) {
                String message = authService.emailverify(token);
                return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", message)));
        }

        // ================= FORGOT PASSWORD =================
        @PostMapping("/forgot-password")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> forgotPassword(@RequestParam("email") String email,
                        @RequestParam("companyCode") String companyCode) {
                String message = authService.sendTokenForPassword(companyCode, email);
                return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", message)));
        }

        // ================= RESET PASSWORD =================
        @PostMapping("/reset-password")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> resetPassword(
                        @RequestParam("token") String token,
                        @Valid @RequestBody RequestWrapper<PasswordReset> passwordReset) {
                Map<String, String> details = authService.resetPasswordWithDetails(passwordReset.getData(), token);
                return ResponseEntity.ok(ResponseWrapper.success(details));
        }

        @PatchMapping("/{userId}/verify-email")
        public ResponseEntity<ResponseWrapper<Status>> verifyEmailAdmin(
                        @PathVariable("userId") UUID userId,
                        @RequestParam Status status) {

                Status response = userService.verifyEmailAdmin(userId, status);
                return ResponseEntity.ok(ResponseWrapper.success(response));
        }

        // PATCH /user/:id/status
        @PatchMapping("/{id}/status")
        public ResponseEntity<ResponseWrapper<UserResponse>> updateStatus(
                        @PathVariable UUID id,
                        @RequestParam AccountStatus status) {
                return ResponseEntity.ok(ResponseWrapper.success(userService.updateStatus(id, status)));
        }

}