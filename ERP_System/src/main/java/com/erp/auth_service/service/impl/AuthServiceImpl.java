package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.*;
import com.erp.auth_service.dto.response.*;
import com.erp.auth_service.exception.*;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.mapper.AuthorizationCodeMapper;
import com.erp.auth_service.mapper.SsoSessionMapper;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.AuthService;
import com.erp.auth_service.service.OrganizationResolverService;
import com.erp.auth_service.service.PermissionService;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.Status;
import com.erp.auth_service.utility.TokenType;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthServiceImpl implements AuthService {

        private final UserRepository userRepository;
        private final ModuleRepository moduleRepository;
        private final SessionRepository sessionRepository; // FIX #9: consistent naming
        private final AuthorizationCodeRepository authorizationCodeRepository;
        private final AuthorizationCodeMapper authorizationCodeMapper;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final JwtDecoder jwtDecoder;
        private final EmailService emailService;
        private final UserTokenRepository userTokenRepository;
        private final UserMapper userMapper;
        private final SsoSessionMapper ssoSessionMapper;
        private final UserPortalAccessRepository userPortalAccessRepository;
        private final UserRoleRepository userRoleRepository;
        private final RoleRepository roleRepository;
        private final CompanyRepository companyRepository;
        private final CompanyModuleRepository companyModuleRepository;
        private final PermissionService permissionService;
        private final OrganizationResolverService organizationResolverService;
        private final OrganizationMemberRepository organizationMemberRepository;
        private final MemberCompanyAccessRepository memberCompanyAccessRepository;
        private final SubscriptionRepository subscriptionRepository;
        private final RefreshTokenRecordRepository refreshTokenRecordRepository;
        private final OrganizationModuleRepository organizationModuleRepository;

        private static final int ACCESS_TOKEN_MINUTES = 15;
        private static final int REFRESH_TOKEN_DAYS = 7;
        private static final int MAX_FAILED_ATTEMPTS = 5;
        private static final int LOCKOUT_MINUTES = 30;

        @Value("${api.frontend}")
        private String url;

        // ==================== REGISTER ====================

        @Override
        @Transactional
        public UserResponse register(CreateUserRequest request) {

                log.info("User registration requested | companyCode={} | username={} | email={} | role={} | module={}",
                                request.getCompanyCode(), request.getUsername(), request.getEmail(), request.getRole(), request.getModule());

                /*
                 * FIND COMPANY
                 */
                Company company = companyRepository
                                .findByCompanyCode(request.getCompanyCode())
                                .orElseThrow(() -> {
                                        log.warn("Registration failed - company not found | companyCode={}", request.getCompanyCode());
                                        return new ResourceNotFoundException("Company not found");
                                });

                /*
                 * CHECK USERNAME
                 */
                if (userRepository.existsByCompany_IdAndUsernameIgnoreCase(
                                company.getId(),
                                request.getUsername())) {

                        log.warn("Registration rejected - username already exists | companyCode={} | username={}",
                                        request.getCompanyCode(), request.getUsername());
                        throw new BadRequestException("Username already exists");
                }

                /*
                 * CHECK EMAIL
                 */
                if (userRepository.existsByCompany_IdAndEmailIgnoreCase(
                                company.getId(),
                                request.getEmail())) {

                        log.warn("Registration rejected - email already exists | companyCode={} | email={}",
                                        request.getCompanyCode(), request.getEmail());
                        throw new BadRequestException("Email already exists");
                }

                /*
                 * CREATE USER
                 */
                User user = userMapper.toEntity(request);

                user.setCompany(company);

                user.setPassword(
                                passwordEncoder.encode(request.getPassword()));

                user.setEmailStatus(Status.UNVERIFIED);

                user.setAccountStatus(AccountStatus.INACTIVE);

                user.setFailedLoginCount(0);

                User savedUser = userRepository.save(user);

                /*
                 * FIND ROLE
                 */
                Role role = roleRepository
                                .findByCompany_IdAndNameIgnoreCase(
                                                company.getId(),
                                                request.getRole())
                                .orElseThrow(() -> {
                                        log.warn("Registration failed - role not found | companyCode={} | role={}",
                                                        request.getCompanyCode(), request.getRole());
                                        return new ResourceNotFoundException("Role not found");
                                });

                /*
                 * ASSIGN ROLE
                 */
                UserRole userRole = UserRole.builder()
                                .user(savedUser)
                                .role(role)
                                .build();

                userRoleRepository.save(userRole);

                /*
                 * FIND COMPANY MODULE
                 */
                CompanyModule companyModule = companyModuleRepository
                                .findByCompany_IdAndModule_NameIgnoreCaseAndActiveTrue(
                                                company.getId(),
                                                request.getModule())
                                .orElseThrow(() -> {
                                        log.warn("Registration failed - module not assigned to company | companyCode={} | module={}",
                                                        request.getCompanyCode(), request.getModule());
                                        return new ResourceNotFoundException(
                                                        "Module not assigned to company");
                                });

                /*
                 * ASSIGN MODULE ACCESS
                 */
                UserPortalAccess access = UserPortalAccess.builder()
                                .user(savedUser)
                                .companyModule(companyModule)
                                .status(true)
                                .build();

                userPortalAccessRepository.save(access);

                /*
                 * EMAIL VERIFICATION TOKEN
                 */
                String code = jwtService.generateRandomToken();

                UserToken token = UserToken.builder()
                                .token(code)
                                .tokenType(TokenType.EMAIL_VERIFICATION)
                                .expiresAt(LocalDateTime.now().plusMinutes(15))
                                .used(false)
                                .user(savedUser)
                                .company(company)
                                .module(companyModule.getModule())
                                .build();

                userTokenRepository.save(token);

                /*
                 * SEND EMAIL
                 */
                String verifyUrl = url + "/verify-email?token=" + code;

                try {
                        emailService.sendEmail(
                                        savedUser.getEmail(),
                                        verifyUrl);
                        log.info("Registration verification email dispatched | userId={} | email={}", savedUser.getId(), savedUser.getEmail());
                } catch (Exception ex) {
                        log.error("Failed to send registration verification email | userId={} | email={} | error={}",
                                        savedUser.getId(), savedUser.getEmail(), ex.getMessage(), ex);
                }

                /*
                 * FINAL RESPONSE
                 */
                User finalUser = userRepository
                                .findById(savedUser.getId())
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                log.info("User registered successfully | userId={} | username={} | companyCode={}",
                                finalUser.getId(), finalUser.getUsername(), company.getCompanyCode());

                return userMapper.toResponse(finalUser);
        }

        @Override
        @Transactional(noRollbackFor = EmailNotVerifiedException.class)
        public LoginResponse login(
                        LoginRequest request,
                        String ip,
                        String userAgent) {

                if (request.getOrganizationCode() != null && !request.getOrganizationCode().isBlank()) {
                        return organizationLogin(request, ip, userAgent);
                }

                log.info("Login attempt received | companyCode={} | username={} | ip={} | host={}",
                                request.getCompanyCode(), request.getUsername(), ip, request.getHost());

                if (request.getUsername() == null || request.getUsername().isBlank()) {
                        log.warn("Login rejected - missing username/email | ip={}", ip);
                        throw new BadCredentialsException("Username or email is required");
                }

                Company company = companyRepository
                                .findByCompanyCode(request.getCompanyCode())
                                .orElseThrow(() -> {
                                        log.warn("Login failed - company not found | companyCode={} | ip={}", request.getCompanyCode(), ip);
                                        return new ResourceNotFoundException("Company not found");
                                });

                String input = request.getUsername().trim();

                User user = userRepository
                                .findUserWithRoles(
                                                company.getId(),
                                                input)
                                .orElseThrow(() -> {
                                        log.warn("Login failed - user not found | companyCode={} | username={} | ip={}", request.getCompanyCode(), input, ip);
                                        return new ResourceNotFoundException("User not found");
                                });

                if (user.getLockedUntil() != null
                                && user.getLockedUntil().isAfter(LocalDateTime.now())) {
                        log.warn("Login rejected - account locked | userId={} | username={} | lockedUntil={} | ip={}",
                                        user.getId(), user.getUsername(), user.getLockedUntil(), ip);
                        throw new AccountLockedException(
                                        "Account is locked. Try again after "
                                                        + user.getLockedUntil());
                }

                if (!passwordEncoder.matches(
                                request.getPassword(),
                                user.getPassword())) {

                        int attempts = user.getFailedLoginCount() + 1;

                        user.setFailedLoginCount(attempts);

                        if (attempts >= MAX_FAILED_ATTEMPTS) {

                                user.setLockedUntil(
                                                LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES));

                                user.setAccountStatus(AccountStatus.INACTIVE);

                                userRepository.save(user);

                                log.warn("Account locked due to excessive failed attempts | userId={} | username={} | attempts={}/{} | lockedForMinutes={} | ip={}",
                                                user.getId(), user.getUsername(), attempts, MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES, ip);

                                throw new AccountLockedException(
                                                "Account locked due to multiple failed attempts");
                        }

                        userRepository.save(user);

                        log.warn("Login failed - invalid credentials | userId={} | username={} | failedAttempts={}/{} | ip={}",
                                        user.getId(), user.getUsername(), attempts, MAX_FAILED_ATTEMPTS, ip);

                        throw new BadCredentialsException("Invalid credentials");
                }

                if (user.getEmailStatus() != Status.VERIFIED) {

                        log.warn("Login rejected - email unverified | userId={} | username={} | email={}",
                                        user.getId(), user.getUsername(), user.getEmail());

                        UserToken emailToken = userTokenRepository
                                        .findTopByUserIdAndTokenTypeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                                                        user.getId(),
                                                        TokenType.EMAIL_VERIFICATION,
                                                        LocalDateTime.now())
                                        .orElse(null);

                        if (emailToken != null) {

                                throw new EmailNotVerifiedException(
                                                "Your email is not verified. Please check your inbox.");
                        }

                        String tokenValue = jwtService.generateRandomToken();

                        Module module = userPortalAccessRepository
                                        .findFirstByUser_IdAndStatusTrueOrderByCreatedAtAsc(user.getId())
                                        .map(upa -> upa.getCompanyModule().getModule())
                                        .orElseGet(() -> companyModuleRepository
                                                        .findByCompany_IdAndActiveTrue(company.getId()).stream()
                                                        .map(CompanyModule::getModule)
                                                        .findFirst()
                                                        .orElseGet(() -> moduleRepository.findByModuleStatus(true)
                                                                        .stream()
                                                                        .findFirst()
                                                                        .orElseGet(() -> moduleRepository.findAll()
                                                                                        .stream()
                                                                                        .findFirst()
                                                                                        .orElse(null))));

                        if (module == null) {
                                log.error("No module available to issue email verification token | userId={}", user.getId());
                                throw new ResourceNotFoundException("No module found for token assignment");
                        }

                        UserToken token = UserToken.builder()
                                        .token(tokenValue)
                                        .tokenType(TokenType.EMAIL_VERIFICATION)
                                        .expiresAt(LocalDateTime.now().plusMinutes(30))
                                        .used(false)
                                        .user(user)
                                        .company(company)
                                        .module(module)
                                        .build();

                        userTokenRepository.save(token);

                        String verifyUrl = url + "/verify-email?token=" + tokenValue;

                        try {
                                emailService.sendEmail(
                                                user.getEmail(),
                                                verifyUrl);
                                log.info("Verification email resent for unverified user login | userId={} | email={}", user.getId(), user.getEmail());
                        } catch (Exception ex) {
                                log.error("Failed to send verification email | userId={} | email={} | error={}", user.getId(), user.getEmail(), ex.getMessage(), ex);
                        }

                        throw new EmailNotVerifiedException(
                                        "Verification email sent.");
                }

                if (user.getAccountStatus() != AccountStatus.ACTIVE) {

                        log.warn("Login rejected - account inactive | userId={} | status={}", user.getId(), user.getAccountStatus());
                        throw new InvalidOperationException(
                                        "Your account is inactive");
                }

                int count = sessionRepository.countUserActiveSessions(
                                user.getId(),
                                LocalDateTime.now());

                if (count >= 5) {

                        log.warn("Login rejected - active session limit reached (>=5) | userId={}", user.getId());
                        throw new SessionLimitExceededException(
                                        "Maximum active session limit reached");
                }

                user.setFailedLoginCount(0);
                user.setLockedUntil(null);
                userRepository.save(user);

                String rawHost = request.getHost() != null
                                ? request.getHost().trim()
                                : null;

                final String requestedHost = rawHost;
                String resolvedHost = rawHost;

                Module module;
                CompanyModule companyModule;

                if (requestedHost != null && !requestedHost.isBlank()) {

                        Module foundModule = moduleRepository
                                        .findByHost(requestedHost)
                                        .orElseThrow(() -> {
                                                log.warn("Login failed - module not found by host | host={} | userId={}", requestedHost, user.getId());
                                                return new ResourceNotFoundException("Module not found");
                                        });

                        final Module selectedModule = foundModule;
                        CompanyModule foundCompanyModule = companyModuleRepository
                                        .findByCompany_IdAndModule_IdAndActiveTrue(
                                                        company.getId(),
                                                        selectedModule.getId())
                                        .orElseThrow(() -> {
                                                log.warn("Login failed - module not enabled for company | companyId={} | moduleId={}", company.getId(), selectedModule.getId());
                                                return new ResourceNotFoundException(
                                                                "Module not enabled for company");
                                        });

                        final CompanyModule selectedCompanyModule = foundCompanyModule;
                        UserPortalAccess portalAccess = userPortalAccessRepository
                                        .findByUser_IdAndCompanyModule_IdAndStatusTrue(
                                                        user.getId(),
                                                        selectedCompanyModule.getId())
                                        .orElseThrow(() -> {
                                                log.warn("Login failed - portal access denied | userId={} | companyModuleId={}", user.getId(), selectedCompanyModule.getId());
                                                return new ResourceNotFoundException(
                                                                "You do not have access to this portal");
                                        });

                        companyModule = selectedCompanyModule;
                        module = portalAccess
                                        .getCompanyModule()
                                        .getModule();

                } else {

                        UserPortalAccess portalAccess = userPortalAccessRepository
                                        .findFirstByUser_IdAndStatusTrueOrderByCreatedAtAsc(
                                                        user.getId())
                                        .orElseThrow(() -> {
                                                log.warn("Login failed - no active portal access found | userId={}", user.getId());
                                                return new ResourceNotFoundException(
                                                                "No active portal access found");
                                        });

                        companyModule = portalAccess.getCompanyModule();
                        module = companyModule.getModule();
                        resolvedHost = module.getHost();
                }

                String codeValue = UUID.randomUUID().toString();

                AuthorizationCode code = AuthorizationCode.builder()
                                .code(codeValue)
                                .used(false)
                                .expiresAt(
                                                LocalDateTime.now().plusMinutes(5))
                                .user(user)
                                .company(company)
                                .module(module)
                                .gotoUrl(resolvedHost)
                                .build();

                authorizationCodeRepository.save(code);

                String redirectUrl = resolvedHost
                                + "/auth/callback?code="
                                + codeValue;

                log.info("Login successful - authorization code issued | userId={} | companyId={} | moduleId={} | code={} | ip={}",
                                user.getId(), company.getId(), module.getId(), maskCode(codeValue), ip);

                return LoginResponse.builder()
                                .redirectUrl(redirectUrl)
                                .build();
        }

        @Override
        @Transactional
        public LoginResponse organizationLogin(LoginRequest request, String ip, String userAgent) {
                String email = request.getEmail() != null ? request.getEmail().trim() : request.getUsername();
                log.info("Organization login attempt | organizationCode={} | email={} | ip={}",
                                request.getOrganizationCode(), email, ip);

                if (email == null || email.isBlank()) {
                        log.warn("Organization login rejected - missing email/username | ip={}", ip);
                        throw new BadCredentialsException("Invalid credentials");
                }

                Organization organization = organizationResolverService.resolveByCode(request.getOrganizationCode());
                OrganizationMember member = organizationMemberRepository.findActiveByOrganizationAndEmail(
                                organization.getId(), email, MembershipStatus.ACTIVE)
                                .orElseThrow(() -> {
                                        log.warn("Organization login failed - active member not found | orgCode={} | email={} | ip={}",
                                                        request.getOrganizationCode(), email, ip);
                                        return new BadCredentialsException("Invalid credentials");
                                });

                User user = member.getUser();
                if (user.getAccountStatus() != AccountStatus.ACTIVE
                                || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        log.warn("Organization login failed - inactive user or password mismatch | userId={} | orgCode={} | ip={}",
                                        user.getId(), request.getOrganizationCode(), ip);
                        throw new BadCredentialsException("Invalid credentials");
                }

                List<MemberCompanyAccess> access = memberCompanyAccessRepository.findActiveForMember(
                                member.getId(), organization.getId());
                if (access.isEmpty()) {
                        log.warn("Organization login failed - no active company access | orgMemberId={} | userId={}",
                                        member.getId(), user.getId());
                        throw new BadCredentialsException("Invalid credentials");
                }

                List<LoginResponse.CompanyChoice> companies = access.stream()
                                .map(item -> LoginResponse.CompanyChoice.builder()
                                                .id(item.getCompany().getId())
                                                .name(item.getCompany().getCompanyName())
                                                .code(item.getCompany().getCompanyCode())
                                                .build())
                                .toList();

                if (request.getCompanyId() == null && companies.size() > 1) {
                        log.info("Organization login requires company selection | orgCode={} | userId={} | companyCount={}",
                                        request.getOrganizationCode(), user.getId(), companies.size());
                        return LoginResponse.builder()
                                        .requiresCompanySelection(true)
                                        .organization(LoginResponse.OrganizationContext.builder()
                                                        .id(organization.getId()).name(organization.getDisplayName())
                                                        .code(organization.getOrganizationCode()).build())
                                        .companies(companies)
                                        .message("Company selection required")
                                        .build();
                }

                UUID companyId = request.getCompanyId() == null ? companies.get(0).getId() : request.getCompanyId();
                Company company = memberCompanyAccessRepository.findActiveCompany(
                                member.getId(), organization.getId(), companyId)
                                .map(MemberCompanyAccess::getCompany)
                                .orElseThrow(() -> {
                                        log.warn("Organization login failed - invalid company access | orgMemberId={} | requestedCompanyId={}",
                                                        member.getId(), companyId);
                                        return new BadCredentialsException("Invalid company access");
                                });

                Subscription subscription = subscriptionRepository
                                .findTopByOrganization_IdOrderByCreatedAtDesc(organization.getId())
                                .orElseThrow(() -> {
                                        log.warn("Organization login failed - subscription unavailable | orgId={}", organization.getId());
                                        return new InvalidOperationException(
                                                        "Organization subscription unavailable");
                                });

                if (subscription.getAccessMode() == AccessMode.BLOCKED) {
                        log.warn("Organization login rejected - subscription access blocked | orgId={}", organization.getId());
                        throw new InvalidOperationException("Organization access is blocked");
                }

                Module module = resolveOrganizationModule(request, company);
                if (!organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(
                                organization.getId(), module.getId())) {
                        log.warn("Organization login failed - module not entitled for org | orgId={} | moduleId={}",
                                        organization.getId(), module.getId());
                        throw new InvalidOperationException("Module is not entitled for organization");
                }

                CompanyModule companyModule = companyModuleRepository
                                .findByCompany_IdAndModule_IdAndActiveTrue(company.getId(), module.getId())
                                .orElseThrow(() -> {
                                        log.warn("Organization login failed - module not enabled for company | companyId={} | moduleId={}",
                                                        company.getId(), module.getId());
                                        return new ResourceNotFoundException("Module not enabled for company");
                                });

                userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_IdAndStatusTrue(user.getId(), companyModule.getId())
                                .orElseThrow(() -> {
                                        log.warn("Organization login failed - user lacks portal access | userId={} | companyModuleId={}",
                                                        user.getId(), companyModule.getId());
                                        return new ResourceNotFoundException(
                                                        "You do not have access to this portal");
                                });

                String codeValue = UUID.randomUUID().toString();
                AuthorizationCode code = AuthorizationCode.builder()
                                .code(codeValue).used(false).expiresAt(LocalDateTime.now().plusMinutes(5))
                                .user(user).company(company).organization(organization).module(module)
                                .gotoUrl(module.getHost()).build();
                authorizationCodeRepository.save(code);

                log.info("Organization login successful - authorization code issued | orgCode={} | companyId={} | userId={} | moduleId={} | code={}",
                                organization.getOrganizationCode(), company.getId(), user.getId(), module.getId(), maskCode(codeValue));

                return LoginResponse.builder()
                                .requiresCompanySelection(false)
                                .organization(LoginResponse.OrganizationContext.builder()
                                                .id(organization.getId()).name(organization.getDisplayName())
                                                .code(organization.getOrganizationCode()).build())
                                .redirectUrl(module.getHost() + "/auth/callback?code=" + codeValue)
                                .build();
        }

        private Module resolveOrganizationModule(LoginRequest request, Company company) {
                if (request.getHost() != null && !request.getHost().isBlank()) {
                        return moduleRepository.findByHost(request.getHost().trim())
                                        .orElseThrow(() -> new ResourceNotFoundException("Module not found"));
                }
                return companyModuleRepository.findByCompany_IdAndActiveTrue(company.getId()).stream()
                                .map(CompanyModule::getModule)
                                .filter(m -> !"SYSTEM_ADMIN".equalsIgnoreCase(m.getName()))
                                .findFirst()
                                .orElseGet(() -> companyModuleRepository.findByCompany_IdAndActiveTrue(company.getId())
                                                .stream()
                                                .map(CompanyModule::getModule)
                                                .findFirst()
                                                .orElseThrow(() -> new ResourceNotFoundException(
                                                                "No module enabled for company")));
        }

        // ==================== REFRESH ====================
        @Override
        public RefreshTokenResponse refreshToken(
                        RefreshTokenRequest request) {

                log.info("Token refresh requested | clientId={}", request.getClientId());

                String presentedRefreshToken = request.getRefreshToken();
                if (presentedRefreshToken == null || presentedRefreshToken.isBlank()) {
                        log.warn("Token refresh failed - empty refresh token | clientId={}", request.getClientId());
                        throw new BadCredentialsException("Invalid refresh token");
                }
                Optional<RefreshTokenRecord> hashedRecord = refreshTokenRecordRepository
                                .findByTokenHash(hashRefreshToken(presentedRefreshToken));
                if (hashedRecord.isPresent()) {
                        return refreshHashedToken(hashedRecord.get(), presentedRefreshToken, request.getClientId());
                }

                Session session = sessionRepository
                                .findByRefreshToken(
                                                request.getRefreshToken())
                                .orElseThrow(() -> {
                                        log.warn("Token refresh failed - session not found | clientId={}", request.getClientId());
                                        return new BadCredentialsException("Invalid refresh token");
                                });

                if (session.getRefreshTokenValidTill()
                                .isBefore(LocalDateTime.now())) {
                        log.warn("Token refresh failed - session expired | sessionId={} | expiredAt={}",
                                        session.getId(), session.getRefreshTokenValidTill());
                        throw new TokenExpiredException(
                                        "Session expired");
                }

                if (jwtDecoder.isTokenExpired(
                                request.getRefreshToken())) {
                        log.warn("Token refresh failed - JWT refresh token expired | sessionId={}", session.getId());
                        throw new TokenExpiredException(
                                        "Refresh token expired");
                }

                User user = userRepository
                                .findByIdWithRoles(
                                                session.getUser().getId())
                                .orElseThrow(() -> {
                                        log.warn("Token refresh failed - user not found | userId={}", session.getUser().getId());
                                        return new ResourceNotFoundException("User not found");
                                });

                if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                        log.warn("Token refresh failed - user inactive | userId={}", user.getId());
                        throw new InvalidOperationException(
                                        "Your account is inactive");
                }

                Company company = session.getCompany();

                if (company == null) {
                        log.warn("Token refresh failed - missing company in session | sessionId={}", session.getId());
                        throw new InvalidOperationException(
                                        "Invalid company session");
                }

                Module module = moduleRepository
                                .findByClientId(
                                                request.getClientId())
                                .orElseThrow(() -> {
                                        log.warn("Token refresh failed - module not found for clientId | clientId={}", request.getClientId());
                                        return new ResourceNotFoundException("Module does not exist");
                                });

                CompanyModule companyModule = companyModuleRepository
                                .findByCompany_IdAndModule_IdAndActiveTrue(
                                                company.getId(),
                                                module.getId())
                                .orElseThrow(() -> {
                                        log.warn("Token refresh failed - module not enabled for company | companyId={} | moduleId={}",
                                                        company.getId(), module.getId());
                                        return new InvalidOperationException("Module not enabled for company");
                                });

                userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_IdAndStatusTrue(
                                                user.getId(),
                                                companyModule.getId())
                                .orElseThrow(() -> {
                                        log.warn("Token refresh failed - user does not have portal access | userId={} | companyModuleId={}",
                                                        user.getId(), companyModule.getId());
                                        return new InvalidOperationException("User does not have portal access");
                                });

                Map<String, Object> claims = buildClaims(
                                user,
                                company,
                                module,
                                request.getClientId().toString());

                String newAccessToken = jwtService.generateAccessToken(
                                user.getUsername(),
                                claims);

                String newRefreshToken = jwtService.generateRefreshToken(
                                user.getUsername(),
                                company.getCompanyCode());

                session.setAccessToken(newAccessToken);
                session.setRefreshToken(null);
                session.setAccessTokenValidTill(
                                LocalDateTime.now()
                                                .plusMinutes(ACCESS_TOKEN_MINUTES));
                session.setRefreshTokenValidTill(
                                LocalDateTime.now()
                                                .plusDays(REFRESH_TOKEN_DAYS));
                session.setCompany(company);
                session.setModule(module);
                sessionRepository.save(session);
                refreshTokenRecordRepository.save(RefreshTokenRecord.builder()
                                .session(session)
                                .tokenHash(hashRefreshToken(newRefreshToken))
                                .familyId(UUID.randomUUID())
                                .issuedAt(LocalDateTime.now())
                                .expiresAt(LocalDateTime.now().plusDays(REFRESH_TOKEN_DAYS))
                                .build());

                log.info("Token refresh successful | sessionId={} | userId={} | companyId={} | moduleId={} | clientId={}",
                                session.getId(), user.getId(), company.getId(), module.getId(), request.getClientId());

                RefreshTokenResponse response = ssoSessionMapper
                                .toRefreshTokenResponse(session);
                response.setExpiresIn(
                                (long) (ACCESS_TOKEN_MINUTES * 60));
                return response;
        }

        private RefreshTokenResponse refreshHashedToken(
                        RefreshTokenRecord record,
                        String presentedToken,
                        UUID clientId) {
                LocalDateTime now = LocalDateTime.now();
                if (record.getUsedAt() != null || record.getRevokedAt() != null) {
                        log.warn("CRITICAL: Refresh token reuse detected! Revoking token family | familyId={} | sessionId={}",
                                        record.getFamilyId(), record.getSession() != null ? record.getSession().getId() : null);
                        revokeRefreshFamily(record.getFamilyId(), record.getSession());
                        throw new BadCredentialsException("Refresh token reuse detected");
                }
                if (record.getExpiresAt().isBefore(now) || jwtDecoder.isTokenExpired(presentedToken)) {
                        log.warn("Hashed refresh token expired | familyId={} | recordId={}", record.getFamilyId(), record.getId());
                        record.setRevokedAt(now);
                        refreshTokenRecordRepository.save(record);
                        throw new TokenExpiredException("Refresh token expired");
                }

                Session session = record.getSession();
                User user = userRepository.findByIdWithRoles(session.getUser().getId())
                                .orElseThrow(() -> {
                                        log.warn("Hashed refresh failed - user not found | userId={}", session.getUser().getId());
                                        return new ResourceNotFoundException("User not found");
                                });
                if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                        log.warn("Hashed refresh failed - user inactive | userId={}", user.getId());
                        throw new InvalidOperationException("Your account is inactive");
                }
                Company company = session.getCompany();
                Module module = moduleRepository.findByClientId(clientId)
                                .orElseThrow(() -> {
                                        log.warn("Hashed refresh failed - module not found for clientId | clientId={}", clientId);
                                        return new ResourceNotFoundException("Module does not exist");
                                });
                CompanyModule companyModule = companyModuleRepository
                                .findByCompany_IdAndModule_IdAndActiveTrue(company.getId(), module.getId())
                                .orElseThrow(() -> {
                                        log.warn("Hashed refresh failed - module not enabled for company | companyId={} | moduleId={}",
                                                        company.getId(), module.getId());
                                        return new InvalidOperationException("Module not enabled for company");
                                });
                userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_IdAndStatusTrue(user.getId(), companyModule.getId())
                                .orElseThrow(() -> {
                                        log.warn("Hashed refresh failed - portal access denied | userId={} | companyModuleId={}",
                                                        user.getId(), companyModule.getId());
                                        return new InvalidOperationException("User does not have portal access");
                                });

                record.setUsedAt(now);
                refreshTokenRecordRepository.save(record);
                Map<String, Object> claims = buildClaims(user, company, module, clientId.toString());
                String accessToken = jwtService.generateAccessToken(user.getUsername(), claims);
                String refreshToken = jwtService.generateRefreshToken(user.getUsername(), company.getCompanyCode());
                session.setAccessToken(accessToken);
                session.setAccessTokenValidTill(now.plusMinutes(ACCESS_TOKEN_MINUTES));
                session.setRefreshToken(null);
                session.setRefreshTokenValidTill(now.plusDays(REFRESH_TOKEN_DAYS));
                session.setModule(module);
                sessionRepository.save(session);
                refreshTokenRecordRepository.save(RefreshTokenRecord.builder()
                                .session(session)
                                .tokenHash(hashRefreshToken(refreshToken))
                                .familyId(record.getFamilyId())
                                .issuedAt(now)
                                .expiresAt(now.plusDays(REFRESH_TOKEN_DAYS))
                                .build());

                log.info("Hashed refresh token rotated successfully | familyId={} | userId={} | clientId={}",
                                record.getFamilyId(), user.getId(), clientId);

                return RefreshTokenResponse.builder()
                                .accessToken(accessToken)
                                .refreshToken(refreshToken)
                                .expiresIn((long) ACCESS_TOKEN_MINUTES * 60)
                                .build();
        }

        private void revokeRefreshFamily(UUID familyId, Session session) {
                LocalDateTime now = LocalDateTime.now();
                log.warn("Revoking refresh family | familyId={} | sessionId={}", familyId, session != null ? session.getId() : null);
                refreshTokenRecordRepository.findAllByFamilyId(familyId).forEach(token -> token.setRevokedAt(now));
                refreshTokenRecordRepository.findAllByFamilyId(familyId).forEach(refreshTokenRecordRepository::save);
                if (session != null) {
                        session.setAccessTokenValidTill(now);
                        session.setRefreshTokenValidTill(now);
                        sessionRepository.save(session);
                }
        }

        @Override
        @Transactional
        public RefreshTokenResponse AdminrefreshToken(
                        AdminRefreshToken request) {

                log.info("Admin refresh token requested");

                String refreshToken = request.getRefreshToken();

                if (refreshToken == null
                                || refreshToken.isBlank()) {
                        log.warn("Admin refresh token failed - refresh token is missing");
                        throw new BadCredentialsException(
                                        "Refresh token is required");
                }

                Session session = sessionRepository
                                .findByRefreshToken(
                                                refreshToken.trim())
                                .orElseThrow(() -> {
                                        log.warn("Admin refresh token failed - session not found");
                                        return new BadCredentialsException("Invalid refresh token");
                                });

                LocalDateTime now = LocalDateTime.now();

                if (session.getRefreshTokenValidTill() == null
                                || session.getRefreshTokenValidTill()
                                                .isBefore(now)) {
                        log.warn("Admin refresh token failed - session expired | sessionId={}", session.getId());
                        throw new TokenExpiredException(
                                        "Session expired");
                }

                if (jwtDecoder.isTokenExpired(
                                refreshToken)) {
                        log.warn("Admin refresh token failed - JWT expired | sessionId={}", session.getId());
                        throw new TokenExpiredException(
                                        "Refresh token expired");
                }

                User user = userRepository
                                .findByIdWithRoles(
                                                session.getUser().getId())
                                .orElseThrow(() -> {
                                        log.warn("Admin refresh token failed - user not found | userId={}", session.getUser().getId());
                                        return new ResourceNotFoundException("User not found");
                                });

                if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                        log.warn("Admin refresh token failed - user inactive | userId={}", user.getId());
                        throw new InvalidOperationException(
                                        "Your account is inactive");
                }

                Company company = session.getCompany();

                if (company == null) {
                        log.warn("Admin refresh token failed - invalid admin session company | sessionId={}", session.getId());
                        throw new InvalidOperationException(
                                        "Invalid admin session");
                }

                boolean isSystemAdmin = user.getUserRoles() != null
                                && user.getUserRoles()
                                                .stream()
                                                .map(UserRole::getRole)
                                                .filter(Objects::nonNull)
                                                .anyMatch(role -> "SYSTEM_ADMIN"
                                                                .equalsIgnoreCase(
                                                                                role.getName()));

                if (!isSystemAdmin) {
                        log.warn("Admin refresh token rejected - user lacks SYSTEM_ADMIN role | userId={}", user.getId());
                        throw new BadCredentialsException(
                                        "You are not authorized");
                }

                Map<String, Object> claims = buildAdminClaims(
                                user,
                                company);

                String newAccessToken = jwtService.generateAccessToken(
                                user.getUsername(),
                                claims);

                String newRefreshToken = jwtService.generateRefreshToken(
                                user.getUsername(),
                                company.getCompanyCode());

                session.setAccessToken(newAccessToken);

                session.setRefreshToken(null);

                session.setAccessTokenValidTill(
                                now.plusMinutes(
                                                ACCESS_TOKEN_MINUTES));

                session.setRefreshTokenValidTill(
                                now.plusDays(
                                                REFRESH_TOKEN_DAYS));
                sessionRepository.save(session);
                refreshTokenRecordRepository.save(RefreshTokenRecord.builder()
                                .session(session)
                                .tokenHash(hashRefreshToken(newRefreshToken))
                                .familyId(UUID.randomUUID())
                                .issuedAt(now)
                                .expiresAt(now.plusDays(REFRESH_TOKEN_DAYS))
                                .build());

                log.info("Admin token refreshed successfully | userId={} | companyId={} | sessionId={}",
                                user.getId(), company.getId(), session.getId());

                RefreshTokenResponse response = ssoSessionMapper
                                .toRefreshTokenResponse(session);

                response.setExpiresIn(
                                (long) ACCESS_TOKEN_MINUTES * 60);

                return response;
        }

        // ==================== LOGOUT ====================
        @Override
        @Transactional
        public String logout(String accessToken) {

                if (accessToken == null || accessToken.isBlank()) {
                        log.info("Logout request received with empty token");
                        return "Logout successful";
                }

                String trimmedToken = accessToken.trim();
                Optional<Session> sessionOpt = sessionRepository.findByAccessToken(trimmedToken);
                if (sessionOpt.isPresent()) {
                        Session session = sessionOpt.get();
                        log.info("Logout successful - session invalidated | sessionId={} | userId={}",
                                        session.getId(), session.getUser() != null ? session.getUser().getId() : null);
                        sessionRepository.delete(session);
                        return "Logout successful";
                }

                // Fallback: If session not found by access token, attempt to resolve userId from claims and delete sessions
                try {
                        UUID userId = jwtDecoder.extractUserId(trimmedToken);
                        if (userId != null) {
                                log.info("Fallback logout - purging sessions for userId={}", userId);
                                sessionRepository.deleteByUser_Id(userId);
                        }
                } catch (Exception e) {
                        log.warn("Could not resolve userId from token during fallback logout: {}", e.getMessage());
                }

                return "Logout successful";
        }


        // ==================== AUTH CODE (direct login) ====================

        @Override
        @Transactional
        public AuthorizationCodeResponse generateAuthorizationCode(
                        LoginRequest request) {

                log.info("Direct authorization code requested | companyCode={} | username={} | host={}",
                                request.getCompanyCode(), request.getUsername(), request.getHost());

                Company company = companyRepository
                                .findByCompanyCode(request.getCompanyCode())
                                .orElseThrow(() -> {
                                        log.warn("Direct auth code failed - company not found | companyCode={}", request.getCompanyCode());
                                        return new ResourceNotFoundException("Company not found");
                                });

                String input = request.getUsername().trim();

                User user = userRepository
                                .findByCompany_IdAndUsernameIgnoreCaseOrEmailIgnoreCase(
                                                company.getId(),
                                                input,
                                                input)
                                .orElseThrow(() -> {
                                        log.warn("Direct auth code failed - user not found | companyCode={} | username={}", request.getCompanyCode(), input);
                                        return new BadCredentialsException("Invalid credentials");
                                });

                if (user.getLockedUntil() != null
                                && user.getLockedUntil().isAfter(LocalDateTime.now())) {
                        log.warn("Direct auth code rejected - account locked | userId={} | lockedUntil={}", user.getId(), user.getLockedUntil());
                        throw new AccountLockedException(
                                        "Account is locked. Try again later");
                }

                if (user.getEmailStatus() != Status.VERIFIED) {
                        log.warn("Direct auth code rejected - email unverified | userId={}", user.getId());
                        throw new BadCredentialsException(
                                        "Email is not verified");
                }

                if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                        log.warn("Direct auth code rejected - account inactive | userId={}", user.getId());
                        throw new BadCredentialsException(
                                        "Your account is inactive");
                }

                if (!passwordEncoder.matches(
                                request.getPassword(),
                                user.getPassword())) {

                        int attempts = user.getFailedLoginCount() + 1;

                        user.setFailedLoginCount(attempts);

                        if (attempts >= MAX_FAILED_ATTEMPTS) {

                                user.setLockedUntil(
                                                LocalDateTime.now()
                                                                .plusMinutes(LOCKOUT_MINUTES));

                                user.setAccountStatus(
                                                AccountStatus.INACTIVE);

                                userRepository.save(user);

                                log.warn("Direct auth code - account locked due to excessive failed attempts | userId={} | lockoutMinutes={}",
                                                user.getId(), LOCKOUT_MINUTES);
                                throw new AccountLockedException("Account locked due to multiple failed attempts");
                        }

                        userRepository.save(user);

                        log.warn("Direct auth code failed - invalid password | userId={} | attempts={}/{}",
                                        user.getId(), attempts, MAX_FAILED_ATTEMPTS);

                        throw new BadCredentialsException(
                                        "Invalid credentials");
                }

                user.setFailedLoginCount(0);
                user.setLockedUntil(null);
                userRepository.save(user);

                Module module = moduleRepository
                                .findByHost(request.getHost())
                                .orElseThrow(() -> {
                                        log.warn("Direct auth code failed - module not found | host={}", request.getHost());
                                        return new ResourceNotFoundException("Module does not exist");
                                });

                CompanyModule companyModule = companyModuleRepository
                                .findByCompany_IdAndModule_IdAndActiveTrue(
                                                company.getId(),
                                                module.getId())
                                .orElseThrow(() -> {
                                        log.warn("Direct auth code failed - module not enabled for company | companyId={} | moduleId={}",
                                                        company.getId(), module.getId());
                                        return new InvalidOperationException("Module not enabled for company");
                                });

                userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_IdAndStatusTrue(
                                                user.getId(),
                                                companyModule.getId())
                                .orElseThrow(() -> {
                                        log.warn("Direct auth code failed - portal access denied | userId={} | companyModuleId={}",
                                                        user.getId(), companyModule.getId());
                                        return new InvalidOperationException("You do not have portal access");
                                });

                String codeVal = UUID.randomUUID().toString();
                AuthorizationCode code = AuthorizationCode.builder()
                                .user(user)
                                .company(company)
                                .module(module)
                                .code(codeVal)
                                .used(false)
                                .expiresAt(
                                                LocalDateTime.now()
                                                                .plusMinutes(5))
                                .gotoUrl(module.getHost())
                                .build();
                authorizationCodeRepository.save(code);

                log.info("Direct authorization code generated | userId={} | companyId={} | moduleId={} | code={}",
                                user.getId(), company.getId(), module.getId(), maskCode(codeVal));

                return authorizationCodeMapper
                                .toAuthorizationCodeResponse(code);
        }

        @Override
        @Transactional
        public TokenResponse exchangeCodeForToken(
                        String codeValue,
                        UUID clientId) {

                log.info(
                                "Token exchange started | code={} | clientId={}",
                                maskCode(codeValue),
                                clientId);

                AuthorizationCode code = authorizationCodeRepository
                                .findByCode(codeValue)
                                .orElseThrow(() -> {

                                        log.warn(
                                                        "Token exchange failed | reason=INVALID_AUTHORIZATION_CODE | code={} | clientId={}",
                                                        maskCode(codeValue),
                                                        clientId);

                                        return new BadCredentialsException(
                                                        "Invalid authorization code");
                                });

                log.info(
                                "Authorization code found | code={} | userId={} | companyId={} | moduleId={} | expiresAt={} | used={}",
                                maskCode(code.getCode()),
                                code.getUser().getId(),
                                code.getCompany().getId(),
                                code.getModule().getId(),
                                code.getExpiresAt(),
                                code.getUsed());

                if (Boolean.TRUE.equals(code.getUsed())) {

                        log.warn(
                                        "Token exchange failed | reason=CODE_ALREADY_USED | code={} | clientId={} | userId={}",
                                        maskCode(code.getCode()),
                                        clientId,
                                        code.getUser().getId());

                        throw new BadCredentialsException(
                                        "Authorization code already used");
                }

                if (code.getExpiresAt()
                                .isBefore(LocalDateTime.now())) {

                        log.warn(
                                        "Token exchange failed | reason=CODE_EXPIRED | code={} | clientId={} | expiredAt={}",
                                        maskCode(code.getCode()),
                                        clientId,
                                        code.getExpiresAt());

                        throw new TokenExpiredException(
                                        "Authorization code expired");
                }

                Module module = moduleRepository
                                .findByClientId(clientId)
                                .orElseThrow(() -> {

                                        log.warn(
                                                        "Token exchange failed | reason=CLIENT_ID_NOT_FOUND | code={} | clientId={}",
                                                        maskCode(codeValue),
                                                        clientId);

                                        return new ResourceNotFoundException(
                                                        "Client id not found");
                                });

                if (!module.getId().equals(
                                code.getModule().getId())) {

                        log.warn(
                                        "Token exchange failed | reason=MODULE_MISMATCH | code={} | requestedModuleId={} | actualModuleId={}",
                                        maskCode(codeValue),
                                        module.getId(),
                                        code.getModule().getId());

                        throw new BadCredentialsException(
                                        "Invalid module");
                }

                log.info(
                                "Module validated | moduleId={} | moduleName={} | clientId={} | host={}",
                                module.getId(),
                                module.getName(),
                                module.getClientId(),
                                module.getHost());

                User user = code.getUser();

                Company company = code.getCompany();

                if (code.getOrganization() != null) {
                        OrganizationMember member = organizationMemberRepository
                                        .findByOrganization_IdAndUser_IdAndMembershipStatus(
                                                        code.getOrganization().getId(), user.getId(),
                                                        MembershipStatus.ACTIVE)
                                        .orElseThrow(() -> {
                                                log.warn("Token exchange failed | reason=ORG_MEMBERSHIP_REVOKED | orgId={} | userId={}",
                                                                code.getOrganization().getId(), user.getId());
                                                return new BadCredentialsException(
                                                                "Organization membership revoked");
                                        });
                        memberCompanyAccessRepository.findActiveCompany(
                                        member.getId(), code.getOrganization().getId(), company.getId())
                                        .orElseThrow(() -> {
                                                log.warn("Token exchange failed | reason=COMPANY_ACCESS_REVOKED | orgId={} | companyId={}",
                                                                code.getOrganization().getId(), company.getId());
                                                return new BadCredentialsException("Company access revoked");
                                        });
                        if (!organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(
                                        code.getOrganization().getId(), module.getId())) {
                                log.warn("Token exchange failed | reason=MODULE_ENTITLEMENT_REVOKED | orgId={} | moduleId={}",
                                                code.getOrganization().getId(), module.getId());
                                throw new InvalidOperationException("Module entitlement revoked");
                        }
                        if (code.getOrganization().getAccessMode() == AccessMode.BLOCKED) {
                                log.warn("Token exchange failed | reason=ORG_ACCESS_BLOCKED | orgId={}", code.getOrganization().getId());
                                throw new InvalidOperationException("Organization access is blocked");
                        }
                }

                log.info(
                                "User resolved from authorization code | userId={} | username={} | email={} | companyId={}",
                                user.getId(),
                                user.getUsername(),
                                user.getEmail(),
                                company.getId());

                companyModuleRepository
                                .findByCompany_IdAndModule_IdAndActiveTrue(
                                                company.getId(),
                                                module.getId())
                                .orElseThrow(() -> {

                                        log.warn(
                                                        "Token exchange failed | reason=COMPANY_MODULE_DISABLED | companyId={} | moduleId={}",
                                                        company.getId(),
                                                        module.getId());

                                        return new InvalidOperationException(
                                                        "Module is not enabled for company");
                                });

                code.setUsed(true);

                authorizationCodeRepository.save(code);

                log.info(
                                "Authorization code marked as used | code={} | userId={} | clientId={}",
                                maskCode(code.getCode()),
                                user.getId(),
                                clientId);

                Map<String, Object> claims = buildClaims(
                                user,
                                company,
                                module,
                                clientId.toString());

                log.info(
                                "JWT claims prepared | userId={} | username={} | companyId={} | moduleId={} | clientId={}",
                                user.getId(),
                                user.getUsername(),
                                company.getId(),
                                module.getId(),
                                clientId);

                String accessToken = jwtService.generateAccessToken(
                                user.getUsername(),
                                claims);

                String refreshToken = jwtService.generateRefreshToken(
                                user.getUsername(),
                                company.getCompanyCode());

                log.info(
                                "Tokens generated | userId={} | username={} | accessTokenExpiresInMinutes={} | refreshTokenExpiresInDays={}",
                                user.getId(),
                                user.getUsername(),
                                ACCESS_TOKEN_MINUTES,
                                REFRESH_TOKEN_DAYS);

                Session session = Session.builder()
                                .user(user)
                                .company(company)
                                .organization(code.getOrganization())
                                .module(module)
                                .accessToken(accessToken)
                                .accessTokenValidTill(
                                                LocalDateTime.now()
                                                                .plusMinutes(ACCESS_TOKEN_MINUTES))
                                .refreshTokenValidTill(
                                                LocalDateTime.now()
                                                                .plusDays(REFRESH_TOKEN_DAYS))
                                .build();

                sessionRepository.save(session);

                refreshTokenRecordRepository.save(RefreshTokenRecord.builder()
                                .session(session)
                                .tokenHash(hashRefreshToken(refreshToken))
                                .familyId(UUID.randomUUID())
                                .issuedAt(LocalDateTime.now())
                                .expiresAt(LocalDateTime.now().plusDays(REFRESH_TOKEN_DAYS))
                                .build());

                log.info(
                                "Session created from token exchange | sessionId={} | userId={} | companyId={} | moduleId={} | clientId={}",
                                session.getId(),
                                user.getId(),
                                company.getId(),
                                module.getId(),
                                clientId);

                log.info(
                                "Token exchange successful | userId={} | username={} | clientId={} | expiresInSeconds={}",
                                user.getId(),
                                user.getUsername(),
                                clientId,
                                (ACCESS_TOKEN_MINUTES * 60));

                return TokenResponse.builder()
                                .accessToken(accessToken)
                                .refreshToken(refreshToken)
                                .expiresIn(
                                                (long) (ACCESS_TOKEN_MINUTES * 60))
                                .user(userMapper.toResponse(user))
                                .build();
        }

        private String maskCode(String code) {
                if (code == null
                                || code.length() < 8) {
                        return "INVALID";
                }
                return code.substring(0, 8) + "...";
        }

        private String hashRefreshToken(String token) {
                try {
                        byte[] digest = MessageDigest.getInstance("SHA-256")
                                        .digest(token.getBytes(StandardCharsets.UTF_8));
                        return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
                } catch (Exception exception) {
                        log.error("Unable to hash refresh token | error={}", exception.getMessage(), exception);
                        throw new IllegalStateException("Unable to hash refresh token", exception);
                }
        }

        // ==================== FORGOT PASSWORD ====================
        @Override
        public String sendTokenForPassword(
                        String companyCode,
                        String email) {

                log.info("Password reset requested | companyCode={} | email={}", companyCode, email);

                try {

                        Optional<Company> optionalCompany = companyRepository
                                        .findByCompanyCode(companyCode);

                        if (optionalCompany.isEmpty()) {
                                log.warn("Password reset requested for non-existent company | companyCode={}", companyCode);
                                return "If account exists, reset link sent to email";
                        }
                        Company company = optionalCompany.get();

                        Optional<User> optionalUser = userRepository
                                        .findByCompany_IdAndEmailIgnoreCase(
                                                        company.getId(),
                                                        email);

                        if (optionalUser.isEmpty()) {
                                log.warn("Password reset requested for non-existent user | companyCode={} | email={}", companyCode, email);
                                return "If account exists, reset link sent to email";
                        }

                        User user = optionalUser.get();
                        String code = jwtService.generateRandomToken();

                        Module module = userPortalAccessRepository
                                        .findFirstByUser_IdAndStatusTrueOrderByCreatedAtAsc(user.getId())
                                        .map(upa -> upa.getCompanyModule().getModule())
                                        .orElseGet(() -> companyModuleRepository
                                                        .findByCompany_IdAndActiveTrue(company.getId()).stream()
                                                        .map(CompanyModule::getModule)
                                                        .findFirst()
                                                        .orElseGet(() -> moduleRepository.findByModuleStatus(true)
                                                                        .stream()
                                                                        .findFirst()
                                                                        .orElseGet(() -> moduleRepository.findAll()
                                                                                        .stream()
                                                                                        .findFirst()
                                                                                        .orElse(null))));

                        if (module == null) {
                                log.error("No module found for password reset token assignment | userId={}", user.getId());
                                throw new ResourceNotFoundException("No module found for token assignment");
                        }

                        UserToken token = UserToken.builder()
                                        .token(code)
                                        .user(user)
                                        .company(company)
                                        .module(module)
                                        .expiresAt(
                                                        LocalDateTime.now()
                                                                        .plusMinutes(15))
                                        .tokenType(
                                                        TokenType.PASSWORD_RESET)
                                        .used(false)
                                        .build();

                        userTokenRepository.save(token);
                        String resetLink = url + "/reset-password?token=" + code;

                        emailService.sendOtpEmail(
                                        email,
                                        resetLink);

                        log.info("Password reset email sent successfully | userId={} | email={}", user.getId(), email);

                } catch (Exception e) {

                        log.error(
                                        "Error sending reset email | companyCode={} | email={} | error={}",
                                        companyCode,
                                        email,
                                        e.getMessage(),
                                        e);

                }

                return "If account exists, reset link sent to email";
        }

        // ==================== EMAIL VERIFY ====================
        @Override
        @Transactional
        public String emailverify(String token) {

                if (token == null
                                || token.isBlank()) {
                        log.warn("Email verification failed - token is required");
                        throw new BadCredentialsException(
                                        "Token is required");
                }

                String cleanToken = token.trim();
                log.info(
                                "Email verification started | token={}",
                                maskCode(cleanToken));

                UserToken userToken = userTokenRepository
                                .findByToken(cleanToken)
                                .orElseThrow(() -> {
                                        log.warn("Email verification failed - invalid token | token={}", maskCode(cleanToken));
                                        return new BadCredentialsException("Invalid token");
                                });

                if (userToken.getTokenType() != TokenType.EMAIL_VERIFICATION) {
                        log.warn("Email verification failed - invalid token type | token={} | type={}", maskCode(cleanToken), userToken.getTokenType());
                        throw new BadCredentialsException(
                                        "Invalid token type");
                }

                if (Boolean.TRUE.equals(
                                userToken.getUsed())) {
                        log.warn("Email verification failed - token already used | token={}", maskCode(cleanToken));
                        throw new BadCredentialsException(
                                        "Token already used");
                }

                if (userToken.getExpiresAt() == null
                                || userToken.getExpiresAt()
                                                .isBefore(LocalDateTime.now())) {
                        log.warn("Email verification failed - token expired | token={} | expiredAt={}", maskCode(cleanToken), userToken.getExpiresAt());
                        throw new TokenExpiredException(
                                        "Token expired");
                }

                User user = userToken.getUser();
                if (user == null) {
                        log.warn("Email verification failed - invalid token user | token={}", maskCode(cleanToken));
                        throw new BadCredentialsException(
                                        "Invalid token user");
                }

                Company company = userToken.getCompany();
                if (company == null) {
                        log.warn("Email verification failed - invalid company token | token={}", maskCode(cleanToken));
                        throw new InvalidOperationException(
                                        "Invalid company token");
                }

                if (user.getEmailStatus() == Status.VERIFIED) {
                        userToken.setUsed(true);
                        userTokenRepository.save(userToken);
                        log.info("Email was already verified | userId={} | companyId={}", user.getId(), company.getId());
                        return "Email already verified";
                }

                user.setEmailStatus(Status.VERIFIED);
                user.setAccountStatus(AccountStatus.ACTIVE);
                userToken.setUsed(true);

                userRepository.save(user);
                userTokenRepository.save(userToken);
                log.info(
                                "Email verified successfully | userId={} | companyId={}",
                                user.getId(),
                                company.getId());

                return "Email verified successfully";
        }

        // ==================== RESET PASSWORD ====================
        // FIX #8: method signature uses PasswordReset (correct spelling)
        @Override
        @Transactional
        public String resetPassword(
                        PasswordReset passwordReset,
                        String code) {

                if (code == null
                                || code.isBlank()) {
                        log.warn("Password reset rejected - token is required");
                        throw new BadCredentialsException(
                                        "Token is required");
                }

                log.info("Password reset attempt | token={}", maskCode(code));

                UserToken token = userTokenRepository
                                .findByToken(code.trim())
                                .orElseThrow(() -> {
                                        log.warn("Password reset failed - token not found | token={}", maskCode(code));
                                        return new BadCredentialsException("Token not found");
                                });

                if (token.getTokenType() != TokenType.PASSWORD_RESET) {
                        log.warn("Password reset failed - invalid token type | token={} | type={}", maskCode(code), token.getTokenType());
                        throw new BadCredentialsException(
                                        "Invalid token");
                }

                if (Boolean.TRUE.equals(
                                token.getUsed())) {
                        log.warn("Password reset failed - token already used | token={}", maskCode(code));
                        throw new BadCredentialsException(
                                        "Token already used");
                }

                if (token.getExpiresAt()
                                .isBefore(LocalDateTime.now())) {
                        log.warn("Password reset failed - token expired | token={} | expiredAt={}", maskCode(code), token.getExpiresAt());
                        throw new TokenExpiredException(
                                        "Token expired");
                }

                User user = token.getUser();

                if (user == null) {
                        log.warn("Password reset failed - invalid token user | token={}", maskCode(code));
                        throw new BadCredentialsException(
                                        "Invalid token user");
                }

                Company company = token.getCompany();

                if (company == null) {
                        log.warn("Password reset failed - invalid company token | token={}", maskCode(code));
                        throw new InvalidOperationException(
                                        "Invalid company token");
                }
                user.setPassword(
                                passwordEncoder.encode(
                                                passwordReset.getPassword()));

                user.setFailedLoginCount(0);
                user.setLockedUntil(null);
                userRepository.save(user);
                token.setUsed(true);
                userTokenRepository.save(token);
                sessionRepository.deleteByUser_Id(
                                user.getId());

                log.info(
                                "Password reset successful | userId={} | companyId={}",
                                user.getId(),
                                company.getId());

                return "Password reset successfully";
        }

        @Override
        public void validateClient(
                        UUID clientId,
                        String clientSecret) {
                if (clientId == null
                                || clientSecret == null
                                || clientSecret.isBlank()) {
                        log.warn("Client validation failed - missing client credentials | clientId={}", clientId);
                        throw new BadCredentialsException(
                                        "Client credentials missing");
                }

                Module module = moduleRepository
                                .findByClientId(clientId)
                                .orElseThrow(() -> {
                                        log.warn("Client validation failed - invalid client_id | clientId={}", clientId);
                                        return new BadCredentialsException("Invalid client_id");
                                });

                if (Boolean.FALSE.equals(
                                module.getModuleStatus())) {
                        log.warn("Client validation failed - client module inactive | clientId={} | moduleId={}", clientId, module.getId());
                        throw new BadCredentialsException(
                                        "Client is inactive");
                }
                if (!module.getClientSecret()
                                .equals(clientSecret.trim())) {
                        log.warn("Client validation failed - client_secret mismatch | clientId={} | moduleId={}", clientId, module.getId());
                        throw new BadCredentialsException(
                                        "Invalid client_secret");
                }
                log.debug("Client validated successfully | clientId={} | moduleId={}", clientId, module.getId());
        }

        // ==================== HELPERS ====================

        // FIX #7: removed email from JWT claims — userId + roles only
        private Map<String, Object> buildClaims(
                        User user,
                        Company company,
                        Module module,
                        String clientId) {

                Map<String, Object> claims = new HashMap<>();

                claims.put(
                                "userId",
                                user.getId().toString());

                claims.put(
                                "username",
                                user.getUsername());

                claims.put(
                                "companyCode",
                                company.getCompanyCode());

                claims.put(
                                "companyName",
                                company.getCompanyName());

                if (company.getOrganization() != null) {
                        claims.put("organizationId", company.getOrganization().getId().toString());
                        claims.put("organizationCode", company.getOrganization().getOrganizationCode());
                }

                claims.put(
                                "moduleName",
                                module.getName());

                claims.put(
                                "roles",
                                user.getUserRoles()
                                                .stream()
                                                .map(r -> r.getRole().getName())
                                                .toList());

                return claims;
        }

        private String extractAccessToken(
                        HttpServletRequest request) {

                String authHeader = request.getHeader("Authorization");

                if (authHeader != null
                                && authHeader.startsWith("Bearer ")) {

                        String token = authHeader.substring(7).trim();

                        if (!token.isBlank()) {
                                return token;
                        }
                }

                Cookie[] cookies = request.getCookies();

                if (cookies != null) {

                        for (Cookie cookie : cookies) {

                                if ("accessToken".equals(cookie.getName())
                                                && cookie.getValue() != null
                                                && !cookie.getValue().isBlank()) {

                                        return cookie.getValue().trim();
                                }
                        }
                }

                return null;
        }

        @Override
        @Transactional(readOnly = true)
        public TokenVerifyResponse verifyToken(
                        String accessToken) {
                if (accessToken == null
                                || accessToken.isBlank()) {

                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }
                if (!jwtDecoder.isTokenValid(accessToken)) {
                        log.warn(
                                        "JWT validation failed or token invalid");

                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }
                Optional<Session> optionalSession = sessionRepository
                                .findByAccessToken(
                                                accessToken.trim());

                if (optionalSession.isEmpty()) {

                        log.warn(
                                        "Session not found for token");

                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }

                Session session = optionalSession.get();

                log.debug(
                                "Session found -> sessionId: {}",
                                session.getId());

                if (session.getAccessTokenValidTill()
                                .isBefore(LocalDateTime.now())) {

                        log.warn(
                                        "Access token expired -> sessionId: {}",
                                        session.getId());

                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }
                Company company = session.getCompany();
                if (company == null) {
                        log.warn(
                                        "Company missing in session -> sessionId: {}",
                                        session.getId());
                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }

                Module module = session.getModule();
                if (module == null) {
                        log.warn(
                                        "Module missing in session -> sessionId: {}",
                                        session.getId());
                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }

                if (Boolean.FALSE.equals(
                                module.getModuleStatus())) {

                        log.warn(
                                        "Module inactive -> moduleId: {}",
                                        module.getId());

                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }

                Optional<CompanyModule> optionalCompanyModule = companyModuleRepository
                                .findByCompany_IdAndModule_IdAndActiveTrue(
                                                company.getId(),
                                                module.getId());

                if (optionalCompanyModule.isEmpty()) {

                        log.warn(
                                        "Module not enabled for company -> companyId={} | moduleId={}",
                                        company.getId(),
                                        module.getId());

                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }
                User user = userRepository
                                .findByIdWithRoles(
                                                session.getUser().getId())
                                .orElse(null);

                if (user == null) {

                        log.warn(
                                        "User not found -> userId: {}",
                                        session.getUser().getId());

                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }

                if (user.getAccountStatus() != AccountStatus.ACTIVE) {

                        log.warn(
                                        "User inactive -> userId: {}, status: {}",
                                        user.getId(),
                                        user.getAccountStatus());

                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }

                Optional<UserPortalAccess> optionalAccess = userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_IdAndStatusTrue(
                                                user.getId(),
                                                optionalCompanyModule.get().getId());

                if (optionalAccess.isEmpty()) {

                        log.warn(
                                        "Portal access denied -> userId={} | companyModuleId={}",
                                        user.getId(),
                                        optionalCompanyModule.get().getId());

                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }

                if (session.getOrganization() != null && company.getOrganization() != null
                                && !session.getOrganization().getId().equals(company.getOrganization().getId())) {
                        log.warn("Company {} does not belong to session organization {}",
                                        company.getId(), session.getOrganization().getId());
                        return TokenVerifyResponse.builder().valid(false).build();
                }

                log.info(
                                "Token verified successfully -> userId={} | companyId={} | moduleId={}",
                                user.getId(),
                                company.getId(),
                                module.getId());

                try {
                        UserResponse userResponse = userMapper.toResponse(user);
                        if (session.getOrganization() != null) {
                                userResponse.setOrganizationId(session.getOrganization().getId());
                                userResponse.setOrganizationCode(session.getOrganization().getOrganizationCode());
                                AccessMode effectiveMode = session.getOrganization().getAccessMode() != null
                                                ? session.getOrganization().getAccessMode()
                                                : AccessMode.FULL;
                                Optional<Subscription> subOpt = subscriptionRepository
                                                .findTopByOrganization_IdOrderByCreatedAtDesc(session.getOrganization().getId());
                                if (subOpt.isPresent()) {
                                        Subscription sub = subOpt.get();
                                        if (sub.getAccessMode() != null) {
                                                effectiveMode = sub.getAccessMode();
                                        }
                                        if (sub.getStatus() == com.erp.auth_service.utility.SubscriptionStatus.EXPIRED
                                                        || (sub.getStatus() == com.erp.auth_service.utility.SubscriptionStatus.TRIALING
                                                                        && sub.getTrialEndsAt() != null
                                                                        && !sub.getTrialEndsAt().isAfter(LocalDateTime.now()))) {
                                                effectiveMode = AccessMode.READ_ONLY;
                                        }
                                }
                                if (session.getOrganization().getAccessMode() != null
                                                && session.getOrganization().getAccessMode() != AccessMode.FULL) {
                                        effectiveMode = session.getOrganization().getAccessMode();
                                }
                                userResponse.setAccessMode(effectiveMode.name());
                        }
                        if (company != null) {
                                userResponse.setCompanyId(company.getId());
                                userResponse.setCompanyCode(company.getCompanyCode());
                                if (user.getUserRoles() != null) {
                                        List<com.erp.auth_service.dto.response.RoleResponse> scopedRoles = user.getUserRoles().stream()
                                                        .filter(ur -> ur.getRole() != null
                                                                        && (ur.getRole().getCompany() == null
                                                                                        || company.getId().equals(ur.getRole().getCompany().getId())))
                                                        .map(userMapper::toRoleResponse)
                                                        .toList();
                                        userResponse.setRole(scopedRoles);
                                }
                        }
                        EffectivePermissionsResponse effective = permissionService
                                        .getEffectivePermissions(user.getId(), company != null ? company.getId() : null);
                        userResponse.setFeatures(effective.getFeatures());
                        userResponse.setPermissions(effective.getPermissions());
                        log.debug(
                                        "Verify enriched with {} feature(s) and {} permission(s) for userId={}",
                                        effective.getFeatures() != null
                                                        ? effective.getFeatures().size()
                                                        : 0,
                                        effective.getPermissions() != null
                                                        ? effective.getPermissions().size()
                                                        : 0,
                                        user.getId());

                        return TokenVerifyResponse.builder()
                                        .valid(true)
                                        .user(userResponse)
                                        .build();                } catch (RuntimeException ex) {
                        log.error(
                                        "Permission/feature enrichment failed during token verification -> userId={} | error={}",
                                        user.getId(),
                                        ex.getMessage(),
                                        ex);
                        return TokenVerifyResponse.builder()
                                        .valid(false)
                                        .build();
                }
        }

        @Override
        @Transactional
        public void revokeToken(
                        TokenRevokeRequest request) {
                if (request == null
                                || request.getToken() == null
                                || request.getToken().isBlank()
                                || request.getTokenType() == null
                                || request.getTokenType().isBlank()) {
                        log.warn("Token revocation failed - invalid request payload");
                        throw new BadCredentialsException(
                                        "Invalid request");
                }

                String token = request.getToken().trim();

                String tokenType = request.getTokenType().trim();
                if ("access".equalsIgnoreCase(tokenType)) {

                        Session session = sessionRepository
                                        .findByAccessToken(token)
                                        .orElseThrow(() -> {
                                                log.warn("Revoke access token failed - session not found | token={}", maskCode(token));
                                                return new ResourceNotFoundException("Session not found");
                                        });

                        log.info(
                                        "Revoking access token | sessionId={} | userId={} | companyId={}",
                                        session.getId(),
                                        session.getUser().getId(),
                                        session.getCompany() != null
                                                        ? session.getCompany().getId()
                                                        : null);

                        sessionRepository.delete(session);
                        log.info("Access token revoked successfully | sessionId={}", session.getId());
                        return;
                }

                if ("refresh".equalsIgnoreCase(tokenType)) {

                        Session session = sessionRepository
                                        .findByRefreshToken(token)
                                        .orElseThrow(() -> {
                                                log.warn("Revoke refresh token failed - session not found | token={}", maskCode(token));
                                                return new ResourceNotFoundException("Session not found");
                                        });

                        log.info(
                                        "Revoking refresh token | sessionId={} | userId={} | companyId={}",
                                        session.getId(),
                                        session.getUser().getId(),
                                        session.getCompany() != null
                                                        ? session.getCompany().getId()
                                                        : null);

                        sessionRepository.delete(session);
                        log.info("Refresh token revoked successfully | sessionId={}", session.getId());
                        return;
                }

                log.warn("Token revocation failed - invalid token type: {}", tokenType);
                throw new BadCredentialsException(
                                "Invalid token type");
        }

        @Override
        @Transactional
        public LoginResponse adminLogin(
                        LoginRequest request,
                        String ip,
                        String userAgent) {

                log.info("Admin login attempt received | username={} | ip={} | userAgent={}",
                                request.getUsername(), ip, userAgent);

                String input = request.getUsername().trim();

                Company rootCompany = companyRepository
                                .findByCompanyCode("000000")
                                .orElseThrow(() -> {
                                        log.error("Admin login failed - root company 000000 not found | ip={}", ip);
                                        return new ResourceNotFoundException("Root company not found");
                                });

                User user = userRepository
                                .findUserWithRoles(rootCompany.getId(), input)
                                .orElseThrow(() -> {
                                        log.warn("Admin login failed - user not found in root company 000000 | input={} | ip={}", input, ip);
                                        return new BadCredentialsException("You are not authorized for admin login");
                                });

                boolean isSystemAdmin = user.getUserRoles() != null
                                && user.getUserRoles()
                                                .stream()
                                                .map(UserRole::getRole)
                                                .filter(Objects::nonNull)
                                                .anyMatch(role -> "SYSTEM_ADMIN".equalsIgnoreCase(role.getName()));

                if (!isSystemAdmin) {
                        log.warn("Admin login rejected - user is not SYSTEM_ADMIN | userId={} | username={} | ip={}",
                                        user.getId(), user.getUsername(), ip);
                        throw new BadCredentialsException(
                                        "You are not authorized for admin login");
                }

                if (!"000000".equalsIgnoreCase(
                                user.getCompany().getCompanyCode())) {
                        log.warn("Admin login rejected - company code is not root admin (000000) | userId={} | companyCode={} | ip={}",
                                        user.getId(), user.getCompany().getCompanyCode(), ip);
                        throw new BadCredentialsException(
                                        "You are not authorized for admin login");
                }

                if (user.getLockedUntil() != null
                                && user.getLockedUntil().isAfter(LocalDateTime.now())) {
                        log.warn("Admin login rejected - account locked | userId={} | lockedUntil={} | ip={}",
                                        user.getId(), user.getLockedUntil(), ip);
                        throw new AccountLockedException(
                                        "Account is locked until " + user.getLockedUntil());
                }

                if (user.getEmailStatus() != Status.VERIFIED) {
                        log.warn("Admin login rejected - email not verified | userId={} | ip={}", user.getId(), ip);
                        throw new InvalidOperationException(
                                        "Email is not verified");
                }

                if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                        log.warn("Admin login rejected - account inactive | userId={} | ip={}", user.getId(), ip);
                        throw new InvalidOperationException(
                                        "Your account is inactive");
                }

                boolean passwordMatched = passwordEncoder.matches(
                                request.getPassword(),
                                user.getPassword());

                if (!passwordMatched) {

                        int attempts = user.getFailedLoginCount() + 1;
                        user.setFailedLoginCount(attempts);

                        if (attempts >= MAX_FAILED_ATTEMPTS) {

                                user.setLockedUntil(
                                                LocalDateTime.now()
                                                                .plusMinutes(LOCKOUT_MINUTES));

                                user.setAccountStatus(AccountStatus.INACTIVE);

                                userRepository.save(user);

                                log.warn("Admin account locked due to excessive failed attempts | userId={} | lockoutMinutes={} | ip={}",
                                                user.getId(), LOCKOUT_MINUTES, ip);

                                throw new AccountLockedException(
                                                "Account locked due to multiple failed attempts");
                        }

                        userRepository.save(user);

                        log.warn("Admin login failed - password mismatch | userId={} | attempts={}/{} | ip={}",
                                        user.getId(), attempts, MAX_FAILED_ATTEMPTS, ip);

                        throw new BadCredentialsException(
                                        "Invalid credentials");
                }

                user.setFailedLoginCount(0);
                user.setLockedUntil(null);
                userRepository.save(user);

                // SYSTEM_ADMIN MODULE LOAD
                Module module = moduleRepository
                                .findByNameIgnoreCase("SYSTEM_ADMIN")
                                .orElseThrow(() -> {
                                        log.error("SYSTEM_ADMIN module not found in database!");
                                        return new ResourceNotFoundException("SYSTEM_ADMIN module not found");
                                });

                Map<String, Object> claims = buildAdminClaims(user, user.getCompany());

                String accessToken = jwtService.generateAccessToken(
                                user.getUsername(),
                                claims);

                String refreshToken = jwtService.generateRefreshToken(
                                user.getUsername(),
                                user.getCompany().getCompanyCode());

                Session session = Session.builder()
                                .user(user)
                                .company(user.getCompany())
                                .module(module)
                                .accessToken(accessToken)
                                .refreshToken(refreshToken)
                                .accessTokenValidTill(
                                                LocalDateTime.now()
                                                                .plusMinutes(ACCESS_TOKEN_MINUTES))
                                .refreshTokenValidTill(
                                                LocalDateTime.now()
                                                                .plusDays(REFRESH_TOKEN_DAYS))
                                .ipAddress(ip)
                                .userAgent(userAgent)
                                .build();

                sessionRepository.save(session);

                log.info("Admin login successful | userId={} | username={} | companyCode={} | sessionId={} | ip={}",
                                user.getId(), user.getUsername(), user.getCompany().getCompanyCode(), session.getId(), ip);

                return LoginResponse.builder()
                                .accessToken(accessToken)
                                .refreshToken(refreshToken)
                                .build();
        }

        private Map<String, Object> buildAdminClaims(
                        User user,
                        Company company) {

                Map<String, Object> claims = new HashMap<>();

                claims.put(
                                "iss",
                                "ADMIN_PANEL");

                claims.put(
                                "userId",
                                user.getId().toString());

                claims.put(
                                "username",
                                user.getUsername());

                claims.put(
                                "companyCode",
                                company.getCompanyCode());

                claims.put(
                                "roles",
                                user.getUserRoles()
                                                .stream()
                                                .map(r -> r.getRole().getName())
                                                .toList());

                claims.put(
                                "loginType",
                                "ADMIN");

                claims.put(
                                "scope",
                                "SYSTEM_ADMIN");

                return claims;
        }

        @Override
        @Transactional(readOnly = true)
        public Map<String, Object> authorize(
                        String accessToken,
                        UUID userId,
                        UUID moduleId) {

                /*
                 * TOKEN VALIDATION
                 */
                if (accessToken == null
                                || accessToken.isBlank()
                                || !jwtDecoder.isTokenValid(accessToken)) {

                        log.warn("Authorize rejected - invalid token | userId={} | moduleId={}", userId, moduleId);
                        return Map.of(
                                        "authorized", false,
                                        "reason", "Invalid token");
                }

                /*
                 * SESSION
                 */
                Session session = sessionRepository
                                .findByAccessToken(accessToken.trim())
                                .orElseThrow(() -> {
                                        log.warn("Authorize rejected - session not found | userId={} | moduleId={}", userId, moduleId);
                                        return new ResourceNotFoundException("Session not found");
                                });

                /*
                 * SESSION EXPIRY
                 */
                if (session.getAccessTokenValidTill()
                                .isBefore(LocalDateTime.now())) {

                        log.warn("Authorize rejected - session expired | sessionId={} | userId={} | moduleId={}",
                                        session.getId(), userId, moduleId);
                        return Map.of(
                                        "authorized", false,
                                        "reason", "Session expired");
                }

                /*
                 * TOKEN USER VALIDATION
                 */
                UUID tokenUserId = jwtDecoder.extractUserId(accessToken);

                if (!tokenUserId.equals(userId)
                                || (session.getUser() != null && !session.getUser().getId().equals(userId))) {

                        log.warn("Authorize rejected - user mismatch | tokenUserId={} | requestedUserId={} | sessionUserId={}",
                                        tokenUserId, userId, session.getUser() != null ? session.getUser().getId() : null);
                        return Map.of(
                                        "authorized", false,
                                        "reason", "User mismatch");
                }

                /*
                 * COMPANY VALIDATION
                 */
                Company company = session.getCompany();

                if (company == null) {
                        log.warn("Authorize rejected - missing company in session | sessionId={} | userId={}", session.getId(), userId);
                        return Map.of(
                                        "authorized", false,
                                        "reason", "Invalid company session");
                }

                /*
                 * MODULE VALIDATION
                 */
                Module module = moduleRepository
                                .findById(moduleId)
                                .orElseThrow(() -> {
                                        log.warn("Authorize rejected - module not found | moduleId={} | userId={}", moduleId, userId);
                                        return new ResourceNotFoundException("Module not found");
                                });

                /*
                 * MODULE STATUS
                 */
                if (Boolean.FALSE.equals(
                                module.getModuleStatus())) {

                        log.warn("Authorize rejected - module inactive | moduleId={} | userId={}", moduleId, userId);
                        return Map.of(
                                        "authorized", false,
                                        "reason", "Module inactive");
                }

                /*
                 * COMPANY MODULE VALIDATION
                 */
                CompanyModule companyModule = companyModuleRepository
                                .findByCompany_IdAndModule_IdAndActiveTrue(
                                                company.getId(),
                                                module.getId())
                                .orElseThrow(() -> {
                                        log.warn("Authorize rejected - module not enabled for company | companyId={} | moduleId={} | userId={}",
                                                        company.getId(), module.getId(), userId);
                                        return new ResourceNotFoundException("Module not enabled for company");
                                });

                /*
                 * USER
                 */
                User user = userRepository
                                .findByIdWithRolesAndPortalAccess(userId)
                                .orElseThrow(() -> {
                                        log.warn("Authorize rejected - user not found | userId={}", userId);
                                        return new ResourceNotFoundException("User not found");
                                });

                /*
                 * USER STATUS
                 */
                if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                        log.warn("Authorize rejected - user account inactive | userId={} | status={}", userId, user.getAccountStatus());
                        return Map.of(
                                        "authorized", false,
                                        "reason", "User inactive");
                }

                /*
                 * USER COMPANY VALIDATION
                 */
                if (session.getOrganization() != null) {
                        var member = organizationMemberRepository
                                        .findByOrganization_IdAndUser_IdAndMembershipStatus(
                                                        session.getOrganization().getId(), user.getId(),
                                                        MembershipStatus.ACTIVE);
                        if (member.isEmpty() || !memberCompanyAccessRepository
                                        .existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(
                                                        member.get().getId(), company.getId())) {
                                log.warn("Authorize rejected - organization company access mismatch | orgId={} | memberId={} | companyId={}",
                                                session.getOrganization().getId(), member.map(OrganizationMember::getId).orElse(null), company.getId());
                                return Map.of(
                                                "authorized", false,
                                                "reason", "Company mismatch");
                        }
                } else if (!user.getCompany()
                                .getId()
                                .equals(company.getId())) {

                        log.warn("Authorize rejected - user company mismatch | userCompanyId={} | sessionCompanyId={}",
                                        user.getCompany().getId(), company.getId());
                        return Map.of(
                                        "authorized", false,
                                        "reason", "Company mismatch");
                }

                /*
                 * PORTAL ACCESS CHECK
                 */
                boolean hasAccess = user.getPortalAccesses()
                                .stream()
                                .anyMatch(pa ->

                                pa.getCompanyModule()
                                                .getId()
                                                .equals(companyModule.getId())

                                                && pa.isStatus()

                                                && Boolean.TRUE.equals(
                                                                pa.getCompanyModule()
                                                                                .getActive())

                                                && Boolean.TRUE.equals(
                                                                pa.getCompanyModule()
                                                                                .getModule()
                                                                                .getModuleStatus()));

                if (!hasAccess) {
                        log.warn("Authorize rejected - no portal access | userId={} | companyModuleId={}",
                                        userId, companyModule.getId());
                        return Map.of(
                                        "authorized", false,
                                        "reason", "No portal access");
                }

                /*
                 * ROLES
                 */
                List<String> roles = user.getUserRoles()
                                .stream()
                                .map(r -> r.getRole().getName())
                                .toList();

                log.info("Authorization successful | userId={} | companyId={} | moduleId={} | rolesCount={}",
                                userId, company.getId(), module.getId(), roles.size());

                /*
                 * SUCCESS RESPONSE
                 */
                return Map.of(
                                "authorized", true,
                                "companyId", company.getId(),
                                "companyCode", company.getCompanyCode(),
                                "moduleId", module.getId(),
                                "moduleName", module.getName(),
                                "roles", roles,
                                "permissions", List.of(
                                                "READ",
                                                "WRITE"));
        }

}
