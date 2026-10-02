package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.CreateUserByAdmin;
import com.erp.auth_service.dto.request.UpdateUserRequest;
import com.erp.auth_service.dto.response.PaginationResponse;
import com.erp.auth_service.dto.response.SsoMeResponse;
import com.erp.auth_service.dto.response.UserListResponse;
import com.erp.auth_service.dto.response.UserResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.exception.TokenExpiredException;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.UserService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.Status;
import com.erp.auth_service.utility.SubscriptionStatus;
import com.erp.auth_service.utility.TokenType;
import com.erp.auth_service.utility.UserSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserServiceImpl implements UserService {

    private static final int VERIFY_TOKEN_MINUTES = 15;
    private static final int PASSWORD_RESET_MINUTES = 30;
    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "@#$%&*!?";
    private static final String ALL = UPPER + LOWER + DIGITS + SPECIAL;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final UserTokenRepository userTokenRepository;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final SessionRepository sessionRepository;
    private final CompanyRepository companyRepository;
    private final ModuleRepository moduleRepository;
    private final JwtDecoder jwtDecoder;
    
    private final OrganizationMemberRepository organizationMemberRepository;
    private final MemberCompanyAccessRepository memberCompanyAccessRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final OrganizationModuleRepository organizationModuleRepository;
    private final CompanyModuleRepository companyModuleRepository;
    private final UserPortalAccessRepository userPortalAccessRepository;

    @org.springframework.context.annotation.Lazy
    private final com.erp.auth_service.service.PermissionService permissionService;

    @Value("${api.frontend}")
    private String emailBaseUrl;

    private void assertCompanyOwnership(Company company) {
        RequestContext.Context context = RequestContext.get();
        if (context != null) {
            if (context.organizationId() != null) {
                if (company.getOrganization() == null || !company.getOrganization().getId().equals(context.organizationId())) {
                    throw new ForbiddenException("Access denied: Company does not belong to authorized organization");
                }
            }
            if (context.companyId() != null && !context.companyId().equals(company.getId())) {
                throw new ForbiddenException("Access denied: Company does not match authorized company context");
            }
        }
    }

    private void assertUserAccess(User user) {
        if (user != null && user.getCompany() != null) {
            assertCompanyOwnership(user.getCompany());
        }
    }

    @Override
    @Transactional
    public UserResponse create(
            CreateUserByAdmin request,
            UUID companyId, UUID moduleid) {

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        assertCompanyOwnership(company);

        Module module = moduleRepository.findById(moduleid)
                .orElseThrow(() -> new BadRequestException("Module not found"));

        if (Boolean.FALSE.equals(company.getActive())) {
            throw new BadRequestException("Company is inactive");
        }

        String username = request.getUsername().trim();
        String email = request.getEmail()
                .trim()
                .toLowerCase();

        if (userRepository.existsByCompany_IdAndUsernameIgnoreCase(
                        companyId,username)) {
            throw new BadRequestException("Username already exists");
        }

        if (userRepository.existsByCompany_IdAndEmailIgnoreCase(companyId,email)) {
            throw new BadRequestException("Email already exists");
        }
        String rawPassword = generate(12);
        User user = User.builder()
                .empId(request.getEmpId())
                .username(username)
                .fullName(request.getFullName().trim())
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .company(company)
                .accountStatus(AccountStatus.INACTIVE)
                .emailStatus(Status.UNVERIFIED)
                .failedLoginCount(0)
                .build();

        User savedUser = userRepository.save(user);
        String tokenValue = jwtService.generateRandomToken();
        UserToken userToken = UserToken.builder()
                .token(tokenValue)
                .user(savedUser)
                .company(company)
                .module(module)
                .tokenType(TokenType.EMAIL_VERIFICATION)
                .expiresAt(LocalDateTime.now().plusMinutes(VERIFY_TOKEN_MINUTES))
                .used(false)
                .build();

        userTokenRepository.save(userToken);
        try {
            String verifyUrl = emailBaseUrl
                    + "/verify-email?token="+ tokenValue;

            emailService.sendEmail(savedUser.getEmail(),verifyUrl);

        } catch (Exception e) {
            throw new BadRequestException("User created but email sending failed");
        }
        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserDetails(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        assertUserAccess(user);

        UserResponse response = userMapper.toResponse(user);
        com.erp.auth_service.dto.response.EffectivePermissionsResponse effective = permissionService.getEffectivePermissions(userId);
        response.setFeatures(effective.getFeatures());
        response.setPermissions(effective.getPermissions());
        
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public UserListResponse getAllUsers(
            int page,
            int pageSize,
            String search,
            AccountStatus status,
            String role,
            UUID companyId) {

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        assertCompanyOwnership(company);

        int validatedPage = Math.max(page, 1);

        int validatedPageSize = Math.min(
                Math.max(pageSize, 1),
                100);

        Pageable pageable = PageRequest.of(
                validatedPage - 1,
                validatedPageSize,
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"));

        String cleanSearch = (search == null || search.isBlank())
                ? null
                : search.trim();

        String cleanRole = (role == null || role.isBlank())
                ? null
                : role.trim();

        Specification<User> specification = Specification

                .where(
                        UserSpecification.hasSearch(
                                cleanSearch))

                .and(
                        UserSpecification.hasStatus(
                                status))

                .and(
                        UserSpecification.hasRole(
                                cleanRole))

                .and(
                        UserSpecification.hasCompany(
                                companyId))

                .and((root, query, cb) -> cb.notEqual(
                        cb.lower(
                                root.get("username")),
                        "system001"));

        Page<User> userPage = userRepository.findAll(
                specification,
                pageable);

        return UserListResponse.builder()

                .users(
                        userMapper.toResponseList(
                                userPage.getContent()))

                .pagination(
                        PaginationResponse.builder()

                                .currentPage(
                                        validatedPage)

                                .pageSize(
                                        validatedPageSize)

                                .totalPages(
                                        userPage.getTotalPages())

                                .totalCount(
                                        userPage.getTotalElements())

                                .build())

                .build();
    }

    @Override
    public UserResponse update(UUID userId, UpdateUserRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        assertUserAccess(user);

        if ("SYSTEM".equalsIgnoreCase(
                user.getCompany().getCompanyCode())) {

            if (request.getEmail() == null || request.getEmail().isBlank()) {
                throw new BadRequestException("Email is required");
            }

            user.setEmail(request.getEmail().trim());

            userRepository.save(user);
            return userMapper.toResponse(user);
        }

        user.setEmpId(request.getEmpId());
        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        userRepository.save(user);

        return userMapper.toResponse(user);
    }

    @Override
    public UserResponse updateStatus(UUID userId, AccountStatus status) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        assertUserAccess(user);

        if (status.equals(user.getAccountStatus())) {
            throw new DuplicateResourceException("User already has status: " + status);
        }

        if ("System001".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("You can't change account Status for System001");
        }

        user.setAccountStatus(status);
        user.setAccountStatus(status);
        userRepository.save(user);

        if (status == AccountStatus.BLOCKED) {
            sessionRepository.deleteByUser_Id(userId);
        }

        return userMapper.toResponse(user);
    }

    @Override
    public void delete(UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        assertUserAccess(user);

        if ("System001".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("You can't delete this user");
        }

        List<Session> sessions = sessionRepository.findAllByUser_Id(userId);

        if (!sessions.isEmpty()) {
            sessionRepository.deleteAll(sessions);
        }

        userRepository.delete(user);
    }

    @Override
    public String verifyEmail(String token) {

        if (token == null || token.isBlank()) {
            throw new BadCredentialsException("Token is required");
        }

        String cleanToken = token.trim();

        UserToken userToken = userTokenRepository.findByToken(cleanToken)
                .orElseThrow(() -> new BadCredentialsException("Invalid token"));

        if (userToken.getTokenType() != TokenType.EMAIL_VERIFICATION) {
            throw new BadCredentialsException("Invalid token type");
        }

        if (Boolean.TRUE.equals(userToken.getUsed())) {
            throw new BadCredentialsException("Token already used");
        }

        if (userToken.getExpiresAt() == null ||
                userToken.getExpiresAt().isBefore(LocalDateTime.now())) {

            throw new TokenExpiredException("Token expired");
        }

        User user = userToken.getUser();

        if (user == null) {
            throw new BadCredentialsException("Invalid token user");
        }
        if (user.getCompany() == null) {
            throw new BadCredentialsException("Company not found");
        }

        if (Boolean.FALSE.equals(user.getCompany().getActive())) {
            throw new BadRequestException("Company inactive");
        }
        if (user.getEmailStatus() == Status.VERIFIED) {

            userToken.setUsed(true);
            userTokenRepository.save(userToken);

            return "Email already verified";
        }

        user.setEmailStatus(Status.VERIFIED);
        user.setAccountStatus(AccountStatus.ACTIVE);

        userToken.setUsed(true);
        userRepository.save(user);
        userTokenRepository.save(userToken);

        return "Email verified successfully";
    }

    @Override
    public String forgotPassword(String email, UUID companyId) {
        try {
            Optional<User> optionalUser = userRepository.findByCompany_IdAndEmailIgnoreCase(companyId, email);

            if (optionalUser.isEmpty()) {
                return "Reset email sent";
            }

            User user = optionalUser.get();
            String tokenValue = jwtService.generateRandomToken();

            Module module = moduleRepository.findByModuleStatus(true).stream()
                    .findFirst()
                    .orElseGet(() -> moduleRepository.findAll().stream()
                            .findFirst()
                            .orElse(null));

            if (module == null) {
                throw new ResourceNotFoundException("No module found for token assignment");
            }

            UserToken token = UserToken.builder()
                    .token(tokenValue)
                    .user(user)
                    .company(user.getCompany())
                    .module(module)
                    .tokenType(TokenType.PASSWORD_RESET)
                    .expiresAt(LocalDateTime.now().plusMinutes(PASSWORD_RESET_MINUTES))
                    .used(false)
                    .build();

            userTokenRepository.save(token);

            String resetUrl = emailBaseUrl + "/reset-password?token=" + tokenValue;
            emailService.sendOtpEmail(user.getEmail(), resetUrl);

        } catch (Exception e) {
            log.error("Error sending reset email: {}", e.getMessage());
        }

        return "Reset email sent";
    }

    @Override
    @Transactional
    public String resetPassword(
            String token,
            String newPassword) {

        if (token == null || token.isBlank()) {
            throw new BadCredentialsException("Token is required");
        }

        if (newPassword == null || newPassword.isBlank()) {
            throw new BadCredentialsException("Password is required");
        }

        String cleanToken = token.trim();

        UserToken userToken = userTokenRepository.findByToken(cleanToken)
                .orElseThrow(() -> new BadCredentialsException("Invalid token"));

        if (userToken.getTokenType() != TokenType.PASSWORD_RESET) {
            throw new BadCredentialsException("Invalid token type");
        }

        if (Boolean.TRUE.equals(userToken.getUsed())) {
            throw new BadCredentialsException("Token already used");
        }

        if (userToken.getExpiresAt() == null ||
                userToken.getExpiresAt().isBefore(LocalDateTime.now())) {

            throw new TokenExpiredException("Token expired");
        }

        User user = userToken.getUser();

        if (user == null) {
            throw new BadCredentialsException("Invalid token user");
        }

        if (user.getCompany() == null) {
            throw new BadCredentialsException("Company not found");
        }

        if (Boolean.FALSE.equals(user.getCompany().getActive())) {
            throw new BadCredentialsException("Company inactive");
        }

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadCredentialsException("User inactive");
        }

        user.setPassword(
                passwordEncoder.encode(newPassword));

        userToken.setUsed(true);

        userRepository.save(user);
        userTokenRepository.save(userToken);

        return "Password updated successfully";
    }

    @Override
    @Transactional
    public String changePassword(
            UUID userId,
            String currentPassword,
            String newPassword) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getCompany() == null) {
            throw new BadCredentialsException("Company not found");
        }

        if (Boolean.FALSE.equals(user.getCompany().getActive())) {
            throw new BadCredentialsException("Company inactive");
        }

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadCredentialsException("User inactive");
        }

        if (currentPassword == null ||
                currentPassword.isBlank()) {

            throw new BadRequestException(
                    "Current password is required");
        }

        if (newPassword == null ||
                newPassword.isBlank()) {

            throw new BadRequestException(
                    "New password is required");
        }

        if (passwordEncoder.matches(
                newPassword,
                user.getPassword())) {

            throw new BadRequestException(
                    "New password must be different from current password");
        }

        if (!passwordEncoder.matches(
                currentPassword,
                user.getPassword())) {

            throw new BadCredentialsException(
                    "Current password is incorrect");
        }

        user.setPassword(
                passwordEncoder.encode(newPassword));

        userRepository.save(user);

        sessionRepository.deleteByUser_Id(userId);

        userTokenRepository.deleteByUser_Id(userId);

        return "Password changed successfully";
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String accessToken) {

        if (accessToken == null || accessToken.isBlank()) {
            throw new BadCredentialsException("Access token is required");
        }

        if (!jwtDecoder.isTokenValid(accessToken)) {
            throw new BadCredentialsException(
                    "Invalid or expired access token");
        }

        log.info("Access token validated");

        UUID userId = jwtDecoder.extractUserId(accessToken);

        log.info("Extracted userId={} from access token", userId);

        Session session = sessionRepository
                .findByAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Session not found"));

        if (session.getAccessTokenValidTill() == null ||
                session.getAccessTokenValidTill()
                        .isBefore(LocalDateTime.now())) {

            throw new TokenExpiredException("Session expired");
        }

        if (session.getCompany() == null) {
            throw new BadCredentialsException("Company not found");
        }

        if (Boolean.FALSE.equals(
                session.getCompany().getActive())) {

            throw new BadCredentialsException(
                    "Company inactive");
        }

        if (session.getModule() == null) {
            throw new BadCredentialsException("Module not found");
        }

        if (Boolean.FALSE.equals(
                session.getModule().getModuleStatus())) {

            throw new BadCredentialsException(
                    "Module inactive");
        }

        User user = userRepository
                .findByIdWithRolesAndPortalAccess(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found"));

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {

            throw new BadCredentialsException(
                    "User account is inactive");
        }

        boolean companyMatches = user.getCompany() != null &&
                user.getCompany().getId().equals(session.getCompany().getId());

        if (!companyMatches) {
            if (session.getOrganization() != null) {
                boolean hasOrgAccess = organizationMemberRepository
                        .findByOrganization_IdAndUser_IdAndMembershipStatus(
                                session.getOrganization().getId(), user.getId(), MembershipStatus.ACTIVE)
                        .flatMap(member -> memberCompanyAccessRepository.findActiveCompany(
                                member.getId(), session.getOrganization().getId(), session.getCompany().getId()))
                        .isPresent();
                if (!hasOrgAccess) {
                    throw new BadCredentialsException("Company mismatch");
                }
            } else {
                throw new BadCredentialsException("Company mismatch");
            }
        }

        UserResponse response = userMapper.toResponse(user);
        com.erp.auth_service.dto.response.EffectivePermissionsResponse effective = permissionService.getEffectivePermissions(userId);
        response.setFeatures(effective.getFeatures());
        response.setPermissions(effective.getPermissions());
        
        return response;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL SSO /ME — Common ERP Shell Authorization Context
    // ═══════════════════════════════════════════════════════════════════════

    @Override
    @Transactional(readOnly = true)
    public SsoMeResponse getSsoMe(String accessToken) {

        if (accessToken == null || accessToken.isBlank()) {
            throw new BadCredentialsException("Access token is required");
        }

        if (!jwtDecoder.isTokenValid(accessToken)) {
            throw new BadCredentialsException("Invalid or expired access token");
        }

        UUID userId = jwtDecoder.extractUserId(accessToken);

        // Validate active session
        Session session = sessionRepository
                .findByAccessToken(accessToken)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (session.getAccessTokenValidTill() == null ||
                session.getAccessTokenValidTill().isBefore(LocalDateTime.now())) {
            throw new TokenExpiredException("Session expired");
        }

        // Load user
        User user = userRepository
                .findByIdWithRolesAndPortalAccess(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadCredentialsException("User account is inactive");
        }

        // ── Organization context ───────────────────────────────────────────
        Organization organization = session.getOrganization();
        if (organization == null && session.getCompany() != null) {
            organization = session.getCompany().getOrganization();
        }

        // ── Company context ────────────────────────────────────────────────
        Company currentCompany = session.getCompany();

        // ── Membership ────────────────────────────────────────────────────
        SsoMeResponse.MembershipContext membershipCtx = null;
        List<SsoMeResponse.CompanyContext> accessibleCompanies = new java.util.ArrayList<>();

        if (organization != null) {
            final UUID orgId = organization.getId();
            java.util.Optional<OrganizationMember> memberOpt =
                    organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                            orgId, userId, MembershipStatus.ACTIVE);

            if (memberOpt.isPresent()) {
                OrganizationMember member = memberOpt.get();
                membershipCtx = SsoMeResponse.MembershipContext.builder()
                        .memberId(member.getId())
                        .memberType(member.getMemberType())
                        .membershipStatus(member.getMembershipStatus())
                        .joinedAt(member.getJoinedAt())
                        .build();

                // All companies this member can access in the org
                memberCompanyAccessRepository
                        .findActiveForMember(member.getId(), orgId)
                        .forEach(mca -> accessibleCompanies.add(
                                SsoMeResponse.CompanyContext.builder()
                                        .id(mca.getCompany().getId())
                                        .code(mca.getCompany().getCompanyCode())
                                        .name(mca.getCompany().getCompanyName())
                                        .legalName(mca.getCompany().getLegalName())
                                        .active(mca.getCompany().getActive())
                                        .build()));
            }
        }

        // ── Subscription ──────────────────────────────────────────────────
        SsoMeResponse.SubscriptionContext subscriptionCtx = null;
        AccessMode effectiveAccessMode = AccessMode.FULL;

        if (organization != null) {
            java.util.Optional<Subscription> subOpt =
                    subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(organization.getId());

            if (subOpt.isPresent()) {
                Subscription sub = subOpt.get();
                boolean isTrialing = sub.getStatus() == SubscriptionStatus.TRIALING
                        && sub.getTrialEndsAt() != null
                        && sub.getTrialEndsAt().isAfter(LocalDateTime.now());

                long daysRemaining = 0L;
                if (sub.getTrialEndsAt() != null) {
                    daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(
                            LocalDateTime.now(), sub.getTrialEndsAt());
                    if (daysRemaining < 0) daysRemaining = 0L;
                } else if (sub.getCurrentPeriodEnd() != null) {
                    daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(
                            LocalDateTime.now(), sub.getCurrentPeriodEnd());
                    if (daysRemaining < 0) daysRemaining = 0L;
                }

                subscriptionCtx = SsoMeResponse.SubscriptionContext.builder()
                        .id(sub.getId())
                        .planCode(sub.getPlanCode())
                        .status(sub.getStatus())
                        .accessMode(sub.getAccessMode())
                        .trialStartedAt(sub.getTrialStartedAt())
                        .trialEndsAt(sub.getTrialEndsAt())
                        .currentPeriodStart(sub.getCurrentPeriodStart())
                        .currentPeriodEnd(sub.getCurrentPeriodEnd())
                        .trialing(isTrialing)
                        .daysRemaining(daysRemaining)
                        .build();

                effectiveAccessMode = sub.getAccessMode();
                if (sub.getStatus() == SubscriptionStatus.EXPIRED
                        || (sub.getStatus() == SubscriptionStatus.TRIALING && sub.getTrialEndsAt() != null && !sub.getTrialEndsAt().isAfter(LocalDateTime.now()))) {
                    effectiveAccessMode = AccessMode.READ_ONLY;
                }
            }

            // Organization-level override (e.g., manual block)
            if (organization.getAccessMode() != null && organization.getAccessMode() != AccessMode.FULL) {
                effectiveAccessMode = organization.getAccessMode();
            }
        }

        // ── Authorized modules ────────────────────────────────────────────
        List<SsoMeResponse.ModuleContext> authorizedModules = new java.util.ArrayList<>();

        if (currentCompany != null) {
            // Modules activated for this company with user portal access
            List<UserPortalAccess> userAccess = userPortalAccessRepository.findAllByUser_Id(userId);
            java.util.Set<UUID> allowedCompanyModuleIds = userAccess.stream()
                    .filter(UserPortalAccess::isStatus)
                    .filter(upa -> upa.getCompanyModule() != null
                            && upa.getCompanyModule().getCompany() != null
                            && upa.getCompanyModule().getCompany().getId().equals(currentCompany.getId()))
                    .map(upa -> upa.getCompanyModule().getId())
                    .collect(java.util.stream.Collectors.toSet());

            companyModuleRepository.findByCompany_IdAndActiveTrue(currentCompany.getId()).stream()
                    .filter(cm -> allowedCompanyModuleIds.contains(cm.getId())
                            || allowedCompanyModuleIds.isEmpty()) // if no portal-access rows, show all active
                    .filter(cm -> cm.getModule() != null
                            && Boolean.TRUE.equals(cm.getModule().getModuleStatus())
                            && !"SYSTEM_ADMIN".equalsIgnoreCase(cm.getModule().getName()))
                    .forEach(cm -> authorizedModules.add(
                            SsoMeResponse.ModuleContext.builder()
                                    .id(cm.getModule().getId())
                                    .name(cm.getModule().getName())
                                    .code(cm.getModule().getName().toLowerCase(java.util.Locale.ROOT)
                                            .replaceAll("[^a-z0-9]+", "_"))
                                    .host(cm.getModule().getHost())
                                    .active(Boolean.TRUE.equals(cm.getActive()))
                                    .build()));
        }

        // ── Roles ─────────────────────────────────────────────────────────
        List<com.erp.auth_service.dto.response.RoleResponse> roles = user.getUserRoles() == null
                ? java.util.Collections.<com.erp.auth_service.dto.response.RoleResponse>emptyList()
                : user.getUserRoles().stream()
                        .filter(ur -> ur.getRole() != null)
                        .filter(ur -> currentCompany == null || ur.getRole().getCompany() == null
                                || currentCompany.getId().equals(ur.getRole().getCompany().getId()))
                        .map(ur -> com.erp.auth_service.dto.response.RoleResponse.builder()
                                .id(ur.getRole().getId())
                                .name(ur.getRole().getName())
                                .status(ur.getRole().isStatus())
                                .build())
                        .collect(java.util.stream.Collectors.toList());

        // ── Permissions / Features ─────────────────────────────────────────
        com.erp.auth_service.dto.response.EffectivePermissionsResponse effective =
                permissionService.getEffectivePermissions(userId, currentCompany != null ? currentCompany.getId() : null);

        // ── Build response ─────────────────────────────────────────────────
        return SsoMeResponse.builder()
                .user(SsoMeResponse.UserContext.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .empId(user.getEmpId())
                        .accountStatus(user.getAccountStatus())
                        .emailStatus(user.getEmailStatus())
                        .createdAt(user.getCreatedAt())
                        .build())
                .organization(organization == null ? null : SsoMeResponse.OrganizationContext.builder()
                        .id(organization.getId())
                        .code(organization.getOrganizationCode())
                        .name(organization.getDisplayName())
                        .status(organization.getStatus())
                        .accessMode(organization.getAccessMode())
                        .timezone(organization.getTimezone())
                        .currency(organization.getCurrency())
                        .build())
                .currentCompany(currentCompany == null ? null : SsoMeResponse.CompanyContext.builder()
                        .id(currentCompany.getId())
                        .code(currentCompany.getCompanyCode())
                        .name(currentCompany.getCompanyName())
                        .legalName(currentCompany.getLegalName())
                        .active(currentCompany.getActive())
                        .build())
                .companies(accessibleCompanies)
                .membership(membershipCtx)
                .subscription(subscriptionCtx)
                .accessMode(effectiveAccessMode.name())
                .modules(authorizedModules)
                .roles(roles)
                .features(effective != null ? effective.getFeatures() : java.util.Collections.emptyList())
                .permissions(effective != null ? effective.getPermissions() : java.util.Collections.emptyList())
                .build();
    }

    @Override
    public Status verifyEmailAdmin(UUID id, Status status) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if ("System001".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("You can't update System001 email status");
        }

        user.setEmailStatus(status);
        userRepository.save(user);

        return user.getEmailStatus();
    }

    // helper method
    private static String generate(int length) {
        if (length < 8) {
            throw new IllegalArgumentException("Password length must be >= 8");
        }

        StringBuilder password = new StringBuilder(length);
        password.append(UPPER.charAt(RANDOM.nextInt(UPPER.length())));
        password.append(LOWER.charAt(RANDOM.nextInt(LOWER.length())));
        password.append(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
        password.append(SPECIAL.charAt(RANDOM.nextInt(SPECIAL.length())));

        for (int i = 4; i < length; i++) {
            password.append(ALL.charAt(RANDOM.nextInt(ALL.length())));
        }

        return shuffle(password.toString());
    }

    private static String shuffle(String input) {
        char[] array = input.toCharArray();
        for (int i = array.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return new String(array);
    }
}