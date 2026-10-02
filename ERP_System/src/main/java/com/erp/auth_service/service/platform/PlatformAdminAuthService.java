package com.erp.auth_service.service.platform;

import com.erp.auth_service.dto.platform.PlatformAdminLoginRequest;
import com.erp.auth_service.dto.platform.PlatformAdminLoginResponse;
import com.erp.auth_service.exception.AccountLockedException;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.exception.InvalidOperationException;
import com.erp.auth_service.model.platform.PlatformAdmin;
import com.erp.auth_service.model.platform.PlatformAdminStatus;
import com.erp.auth_service.model.platform.PlatformPermission;
import com.erp.auth_service.model.platform.PlatformRole;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.PlatformPermissionRepository;
import com.erp.auth_service.repository.platform.PlatformRoleRepository;
import com.erp.auth_service.security.JwtService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformAdminAuthService {

    public static final String PRINCIPAL_TYPE_PLATFORM_ADMIN = "PLATFORM_ADMIN";
    public static final String PRINCIPAL_TYPE_PLATFORM_SUPPORT = "PLATFORM_SUPPORT";

    private final PlatformAdminRepository platformAdminRepository;
    private final PlatformRoleRepository platformRoleRepository;
    private final PlatformPermissionRepository platformPermissionRepository;
    private final PlatformAuditService platformAuditService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${platform.admin.session-duration-minutes:480}")
    private long sessionDurationMinutes;

    @Value("${platform.admin.login.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${platform.admin.login.lockout-minutes:15}")
    private int lockoutMinutes;

    @PostConstruct
    @Transactional
    public void initPlatformRolesAndPermissions() {
        try {
            Map<String, String> permissionsMap = Map.ofEntries(
                    Map.entry("PLATFORM_DASHBOARD_READ", "View platform overview and metrics"),
                    Map.entry("PLATFORM_ORGANIZATION_READ", "View customer organizations"),
                    Map.entry("PLATFORM_ORGANIZATION_WRITE", "Modify customer organizations"),
                    Map.entry("PLATFORM_USER_READ", "View organization members and users"),
                    Map.entry("PLATFORM_USER_WRITE", "Modify customer users"),
                    Map.entry("PLATFORM_COMPANY_READ", "View organization companies"),
                    Map.entry("PLATFORM_COMPANY_WRITE", "Modify organization companies"),
                    Map.entry("PLATFORM_SUBSCRIPTION_READ", "View subscriptions and plans"),
                    Map.entry("PLATFORM_SUBSCRIPTION_WRITE", "Modify subscriptions and plans"),
                    Map.entry("PLATFORM_PAYMENT_READ", "View payments and invoices"),
                    Map.entry("PLATFORM_PAYMENT_WRITE", "Perform billing and payment operations"),
                    Map.entry("PLATFORM_SUPPORT_ACCESS", "Create and execute scoped customer support sessions"),
                    Map.entry("PLATFORM_AUDIT_READ", "View platform audit and security logs"),
                    Map.entry("PLATFORM_ADMIN_MANAGE", "Manage platform admin users and roles")
            );

            Map<String, PlatformPermission> savedPermissions = new HashMap<>();
            for (Map.Entry<String, String> entry : permissionsMap.entrySet()) {
                PlatformPermission perm = platformPermissionRepository.findByCode(entry.getKey())
                        .orElseGet(() -> platformPermissionRepository.save(PlatformPermission.builder()
                                .code(entry.getKey())
                                .description(entry.getValue())
                                .build()));
                savedPermissions.put(entry.getKey(), perm);
            }

            // Role: SUPER_ADMIN
            ensureRole("SUPER_ADMIN", "Super Administrator", "Full access to all platform functions",
                    new HashSet<>(savedPermissions.values()));

            // Role: SUPPORT_ADMIN
            ensureRole("SUPPORT_ADMIN", "Support Administrator", "Support access and customer troubleshooting",
                    Set.of(
                            savedPermissions.get("PLATFORM_DASHBOARD_READ"),
                            savedPermissions.get("PLATFORM_ORGANIZATION_READ"),
                            savedPermissions.get("PLATFORM_USER_READ"),
                            savedPermissions.get("PLATFORM_COMPANY_READ"),
                            savedPermissions.get("PLATFORM_SUPPORT_ACCESS"),
                            savedPermissions.get("PLATFORM_AUDIT_READ")
                    ));

            // Role: BILLING_ADMIN
            ensureRole("BILLING_ADMIN", "Billing Administrator", "Manages plans, subscriptions and payments",
                    Set.of(
                            savedPermissions.get("PLATFORM_DASHBOARD_READ"),
                            savedPermissions.get("PLATFORM_ORGANIZATION_READ"),
                            savedPermissions.get("PLATFORM_SUBSCRIPTION_READ"),
                            savedPermissions.get("PLATFORM_SUBSCRIPTION_WRITE"),
                            savedPermissions.get("PLATFORM_PAYMENT_READ"),
                            savedPermissions.get("PLATFORM_PAYMENT_WRITE")
                    ));

            // Role: READ_ONLY_SUPPORT
            ensureRole("READ_ONLY_SUPPORT", "Read-Only Support", "Inspect customer data with read-only support access",
                    Set.of(
                            savedPermissions.get("PLATFORM_DASHBOARD_READ"),
                            savedPermissions.get("PLATFORM_ORGANIZATION_READ"),
                            savedPermissions.get("PLATFORM_USER_READ"),
                            savedPermissions.get("PLATFORM_COMPANY_READ"),
                            savedPermissions.get("PLATFORM_SUPPORT_ACCESS"),
                            savedPermissions.get("PLATFORM_AUDIT_READ")
                    ));

            // Bootstrap default super admin if none exists
            if (platformAdminRepository.count() == 0) {
                PlatformRole superAdminRole = platformRoleRepository.findByCode("SUPER_ADMIN").orElseThrow();
                PlatformAdmin defaultAdmin = PlatformAdmin.builder()
                        .email("superadmin@platform.com")
                        .passwordHash(passwordEncoder.encode("PlatformAdmin@123!"))
                        .fullName("Default Platform Super Admin")
                        .status(PlatformAdminStatus.ACTIVE)
                        .roles(Set.of(superAdminRole))
                        .build();
                platformAdminRepository.save(defaultAdmin);
                log.info("Bootstrapped default platform super admin: superadmin@platform.com");
            }
        } catch (Exception ex) {
            log.warn("Platform roles bootstrap check: {}", ex.getMessage());
        }
    }

    private void ensureRole(String code, String name, String description, Set<PlatformPermission> permissions) {
        platformRoleRepository.findByCode(code).ifPresentOrElse(
                role -> {
                    role.setName(name);
                    role.setDescription(description);
                    role.setPermissions(permissions);
                    platformRoleRepository.save(role);
                },
                () -> {
                    platformRoleRepository.save(PlatformRole.builder()
                            .code(code)
                            .name(name)
                            .description(description)
                            .permissions(permissions)
                            .build());
                }
        );
    }

    @Transactional
    public PlatformAdminLoginResponse login(PlatformAdminLoginRequest request, String ip, String userAgent) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        PlatformAdmin admin = platformAdminRepository.findByEmailIgnoreCase(email)
                .orElse(null);

        if (admin == null) {
            platformAuditService.record(null, email, "ADMIN_LOGIN_FAILED", null, null, null, null,
                    "PlatformAdmin", null, "Admin not found", ip, userAgent, "FAILURE", null);
            throw new BadCredentialsException("Invalid credentials");
        }

        if (admin.getLockedUntil() != null && admin.getLockedUntil().isAfter(LocalDateTime.now())) {
            platformAuditService.record(admin, email, "ADMIN_LOGIN_FAILED", null, null, null, null,
                    "PlatformAdmin", admin.getId().toString(), "Account locked", ip, userAgent, "FAILURE", null);
            throw new AccountLockedException("Account is locked until " + admin.getLockedUntil());
        }

        if (admin.getStatus() != PlatformAdminStatus.ACTIVE) {
            platformAuditService.record(admin, email, "ADMIN_LOGIN_FAILED", null, null, null, null,
                    "PlatformAdmin", admin.getId().toString(), "Account status: " + admin.getStatus(), ip, userAgent, "DENIED", null);
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            int attempts = admin.getFailedLoginCount() + 1;
            admin.setFailedLoginCount(attempts);
            if (attempts >= maxFailedAttempts) {
                admin.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutMinutes));
                log.warn("Platform admin [{}] locked out after {} failed attempts", email, attempts);
            }
            platformAdminRepository.save(admin);

            platformAuditService.record(admin, email, "ADMIN_LOGIN_FAILED", null, null, null, null,
                    "PlatformAdmin", admin.getId().toString(), "Invalid password attempt " + attempts, ip, userAgent, "FAILURE", null);
            throw new BadCredentialsException("Invalid credentials");
        }

        admin.setFailedLoginCount(0);
        admin.setLockedUntil(null);
        admin.setLastLoginAt(LocalDateTime.now());
        platformAdminRepository.save(admin);

        List<String> roleCodes = admin.getRoles().stream()
                .map(PlatformRole::getCode)
                .toList();

        List<String> permissionCodes = admin.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(PlatformPermission::getCode)
                .distinct()
                .toList();

        Map<String, Object> claims = new HashMap<>();
        claims.put("principalType", PRINCIPAL_TYPE_PLATFORM_ADMIN);
        claims.put("adminId", admin.getId().toString());
        claims.put("email", admin.getEmail());
        claims.put("roles", roleCodes.stream().map(r -> "ROLE_" + r).toList());
        claims.put("permissions", permissionCodes);

        String accessToken = jwtService.generateAccessToken(admin.getEmail(), claims);

        platformAuditService.record(admin, email, "ADMIN_LOGIN_SUCCESS", null, null, null, null,
                "PlatformAdmin", admin.getId().toString(), "Admin logged in successfully", ip, userAgent, "SUCCESS", null);

        return PlatformAdminLoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .adminId(admin.getId())
                .email(admin.getEmail())
                .fullName(admin.getFullName())
                .roles(roleCodes)
                .permissions(permissionCodes)
                .expiresIn(sessionDurationMinutes * 60)
                .build();
    }
}
