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

                /*
                 * FIND COMPANY
                 */
                Company company = companyRepository
                                .findByCompanyCode(request.getCompanyCode())
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

                /*
                 * CHECK USERNAME
                 */
                if (userRepository.existsByCompany_IdAndUsernameIgnoreCase(
                                company.getId(),
                                request.getUsername())) {

                        throw new BadRequestException("Username already exists");
                }

                /*
                 * CHECK EMAIL
                 */
                if (userRepository.existsByCompany_IdAndEmailIgnoreCase(
                                company.getId(),
                                request.getEmail())) {

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
                                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

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
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Module not assigned to company"));

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

                emailService.sendEmail(
                                savedUser.getEmail(),
                                verifyUrl);

                /*
                 * FINAL RESPONSE
                 */
                User finalUser = userRepository
                                .findById(savedUser.getId())
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

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

                if (request.getUsername() == null || request.getUsername().isBlank()) {
                        throw new BadCredentialsException("Username or email is required");
                }

                Company company = companyRepository
                                .findByCompanyCode(request.getCompanyCode())
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

                String input = request.getUsername().trim();

                User user = userRepository
                                .findUserWithRoles(
                                                company.getId(),
                                                input)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User not found"));

                if (user.getLockedUntil() != null
                                && user.getLockedUntil().isAfter(LocalDateTime.now())) {

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

                                throw new AccountLockedException(
                                                "Account locked due to multiple failed attempts");
                        }

                        userRepository.save(user);

                        throw new BadCredentialsException("Invalid credentials");
                }

                if (user.getEmailStatus() != Status.VERIFIED) {

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

                        emailService.sendEmail(
                                        user.getEmail(),
                                        verifyUrl);

                        throw new EmailNotVerifiedException(
                                        "Verification email sent.");
                }

                if (user.getAccountStatus() != AccountStatus.ACTIVE) {

                        throw new InvalidOperationException(
                                        "Your account is inactive");
                }

                int count = sessionRepository.countUserActiveSessions(
                                user.getId(),
                                LocalDateTime.now());

                if (count >= 5) {

                        throw new SessionLimitExceededException(
                                        "Maximum active session limit reached");
                }

                user.setFailedLoginCount(0);
                user.setLockedUntil(null);
                userRepository.save(user);

                String resolvedHost = request.getHost() != null
                                ? request.getHost().trim()
                                : null;

                Module module;

                CompanyModule companyModule;

                if (resolvedHost != null && !resolvedHost.isBlank()) {

                        module = moduleRepository
                                        .findByHost(resolvedHost)
                                        .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

                        companyModule = companyModuleRepository
                                        .findByCompany_IdAndModule_IdAndActiveTrue(
                                                        company.getId(),
                                                        module.getId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Module not enabled for company"));

                        UserPortalAccess portalAccess = userPortalAccessRepository
                                        .findByUser_IdAndCompanyModule_IdAndStatusTrue(
                                                        user.getId(),
                                                        companyModule.getId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "You do not have access to this portal"));

                        module = portalAccess
                                        .getCompanyModule()
                                        .getModule();

                } else {

                        UserPortalAccess portalAccess = userPortalAccessRepository
                                        .findFirstByUser_IdAndStatusTrueOrderByCreatedAtAsc(
                                                        user.getId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "No active portal access found"));

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

                return LoginResponse.builder()
                                .redirectUrl(redirectUrl)
                                .build();
        }

        @Override
        @Transactional
        public LoginResponse organizationLogin(LoginRequest request, String ip, String userAgent) {
                String email = request.getEmail() != null ? request.getEmail().trim() : request.getUsername();
                if (email == null || email.isBlank()) {
                        throw new BadCredentialsException("Invalid credentials");
                }

                Organization organization = organizationResolverService.resolveByCode(request.getOrganizationCode());
                OrganizationMember member = organizationMemberRepository.findActiveByOrganizationAndEmail(
                                organization.getId(), email, MembershipStatus.ACTIVE)
                                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
                User user = member.getUser();
                if (user.getAccountStatus() != AccountStatus.ACTIVE
                                || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        throw new BadCredentialsException("Invalid credentials");
                }

                List<MemberCompanyAccess> access = memberCompanyAccessRepository.findActiveForMember(
                                member.getId(), organization.getId());
                if (access.isEmpty()) {
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
                                .orElseThrow(() -> new BadCredentialsException("Invalid company access"));

                Subscription subscription = subscriptionRepository
                                .findTopByOrganization_IdOrderByCreatedAtDesc(organization.getId())
                                .orElseThrow(() -> new InvalidOperationException(
                                                "Organization subscription unavailable"));
                if (subscription.getAccessMode() == AccessMode.BLOCKED) {
                        throw new InvalidOperationException("Organization access is blocked");
                }

                Module module = resolveOrganizationModule(request, company);
                if (!organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(
                                organization.getId(), module.getId())) {
                        throw new InvalidOperationException("Module is not entitled for organization");
                }
                CompanyModule companyModule = companyModuleRepository
                                .findByCompany_IdAndModule_IdAndActiveTrue(company.getId(), module.getId())
                                .orElseThrow(() -> new ResourceNotFoundException("Module not enabled for company"));
                userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_IdAndStatusTrue(user.getId(), companyModule.getId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "You do not have access to this portal"));

                String codeValue = UUID.randomUUID().toString();
                AuthorizationCode code = AuthorizationCode.builder()
                                .code(codeValue).used(false).expiresAt(LocalDateTime.now().plusMinutes(5))
                                .user(user).company(company).organization(organization).module(module)
                                .gotoUrl(module.getHost()).build();
                authorizationCodeRepository.save(code);

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

                String presentedRefreshToken = request.getRefreshToken();
                if (presentedRefreshToken == null || presentedRefreshToken.isBlank()) {
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
                                .orElseThrow(() -> new BadCredentialsException(
                                                "Invalid refresh token"));

                if (session.getRefreshTokenValidTill()
                                .isBefore(LocalDateTime.now())) {

                        throw new TokenExpiredException(
                                        "Session expired");
                }

                if (jwtDecoder.isTokenExpired(
                                request.getRefreshToken())) {

                        throw new TokenExpiredException(
                                        "Refresh token expired");
                }

                User user = userRepository
                                .findByIdWithRoles(
                                                session.getUser().getId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User not found"));

                if (user.getAccountStatus() != AccountStatus.ACTIVE) {

                        throw new InvalidOperationException(
                                        "Your account is inactive");
                }

                Company company = session.getCompany();

                if (company == null) {

                        throw new InvalidOperationException(
                                        "Invalid company session");
                }

                Module module = moduleRepository
                                .findByClientId(
                                                request.getClientId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Module does not exist"));

                CompanyModule companyModule = companyModuleRepository
                                .findByCompany_IdAndModule_IdAndActiveTrue(
                                                company.getId(),
                                                module.getId())
                                .orElseThrow(() -> new InvalidOperationException(
                                                "Module not enabled for company"));

                userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_IdAndStatusTrue(
                                                user.getId(),
                                                companyModule.getId())
                                .orElseThrow(() -> new InvalidOperationException(
                                                "User does not have portal access"));

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
                        revokeRefreshFamily(record.getFamilyId(), record.getSession());
                        throw new BadCredentialsException("Refresh token reuse detected");
                }
                if (record.getExpiresAt().isBefore(now) || jwtDecoder.isTokenExpired(presentedToken)) {
                        record.setRevokedAt(now);
                        refreshTokenRecordRepository.save(record);
                        throw new TokenExpiredException("Refresh token expired");
                }

                Session session = record.getSession();
                User user = userRepository.findByIdWithRoles(session.getUser().getId())
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                        throw new InvalidOperationException("Your account is inactive");
                }
                Company company = session.getCompany();
                Module module = moduleRepository.findByClientId(clientId)
                                .orElseThrow(() -> new ResourceNotFoundException("Module does not exist"));
                CompanyModule companyModule = companyModuleRepository
                                .findByCompany_IdAndModule_IdAndActiveTrue(company.getId(), module.getId())
                                .orElseThrow(() -> new InvalidOperationException("Module not enabled for company"));
                userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_IdAndStatusTrue(user.getId(), companyModule.getId())
                                .orElseThrow(() -> new InvalidOperationException("User does not have portal access"));

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
                return RefreshTokenResponse.builder()
                                .accessToken(accessToken)
                                .refreshToken(refreshToken)
                                .expiresIn((long) ACCESS_TOKEN_MINUTES * 60)
                                .build();
        }

        private void revokeRefreshFamily(UUID familyId, Session session) {
                LocalDateTime now = LocalDateTime.now();
                refreshTokenRecordRepository.findAllByFamilyId(familyId).forEach(token -> token.setRevokedAt(now));
                refreshTokenRecordRepository.findAllByFamilyId(familyId).forEach(refreshTokenRecordRepository::save);
                session.setAccessTokenValidTill(now);
                session.setRefreshTokenValidTill(now);
                sessionRepository.save(session);
        }

        @Override
        @Transactional
        public RefreshTokenResponse AdminrefreshToken(
                        AdminRefreshToken request) {

                String refreshToken = request.getRefreshToken();

                if (refreshToken == null
                                || refreshToken.isBlank()) {

                        throw new BadCredentialsException(
                                        "Refresh token is required");
                }

                Session session = sessionRepository
                                .findByRefreshToken(
                                                refreshToken.trim())
                                .orElseThrow(() -> new BadCredentialsException(
                                                "Invalid refresh token"));

                LocalDateTime now = LocalDateTime.now();

                if (session.getRefreshTokenValidTill() == null
                                || session.getRefreshTokenValidTill()
                                                .isBefore(now)) {

                        throw new TokenExpiredException(
                                        "Session expired");
                }

                if (jwtDecoder.isTokenExpired(
                                refreshToken)) {

                        throw new TokenExpiredException(
                                        "Refresh token expired");
                }

                User user = userRepository
                                .findByIdWithRoles(
                                                session.getUser().getId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User not found"));

                if (user.getAccountStatus() != AccountStatus.ACTIVE) {

                        throw new InvalidOperationException(
                                        "Your account is inactive");
                }

                Company company = session.getCompany();

                if (company == null) {

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
                        return "Logout successful";
                }

                String trimmedToken = accessToken.trim();
                Optional<Session> sessionOpt = sessionRepository.findByAccessToken(trimmedToken);
                if (sessionOpt.isPresent()) {
                        sessionRepository.delete(sessionOpt.get());
                        return "Logout successful";
                }

                // Fallback: If session not found by access token, attempt to resolve userId from claims and delete sessions
                try {
                        UUID userId = jwtDecoder.extractUserId(trimmedToken);
                        if (userId != null) {
                                sessionRepository.deleteByUser_Id(userId);
                        }
                } catch (Exception e) {
                        log.debug("Could not resolve userId from token during logout: {}", e.getMessage());
                }

                return "Logout successful";
        }


        // ==================== AUTH CODE (direct login) ====================

        @Override
        @Transactional
        public AuthorizationCodeResponse generateAuthorizationCode(
                        LoginRequest request) {

                Company company = companyRepository
                                .findByCompanyCode(request.getCompanyCode())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Company not found"));

                String input = request.getUsername().trim();

                User user = userRepository
                                .findByCompany_IdAndUsernameIgnoreCaseOrEmailIgnoreCase(
                                                company.getId(),
                                                input,
                                                input)
                                .orElseThrow(() -> new BadCredentialsException(
                                                "Invalid credentials"));

                if (user.getLockedUntil() != null
                                && user.getLockedUntil().isAfter(LocalDateTime.now())) {

                        throw new AccountLockedException(
                                        "Account is locked. Try again later");
                }

                if (user.getEmailStatus() != Status.VERIFIED) {

                        throw new BadCredentialsException(
                                        "Email is not verified");
                }

                if (user.getAccountStatus() != AccountStatus.ACTIVE) {

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
                        }

                        userRepository.save(user);

                        throw new BadCredentialsException(
                                        "Invalid credentials");
                }

                user.setFailedLoginCount(0);
                user.setLockedUntil(null);
                userRepository.save(user);

                Module module = moduleRepository
                                .findByHost(request.getHost())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Module does not exist"));

                CompanyModule companyModule = companyModuleRepository
                                .findByCompany_IdAndModule_IdAndActiveTrue(
                                                company.getId(),
                                                module.getId())
                                .orElseThrow(() -> new InvalidOperationException(
                                                "Module not enabled for company"));

                userPortalAccessRepository
                                .findByUser_IdAndCompanyModule_IdAndStatusTrue(
                                                user.getId(),
                                                companyModule.getId())
                                .orElseThrow(() -> new InvalidOperationException(
                                                "You do not have portal access"));

                AuthorizationCode code = AuthorizationCode.builder()
                                .user(user)
                                .company(company)
                                .module(module)
                                .code(UUID.randomUUID().toString())
                                .used(false)
                                .expiresAt(
                                                LocalDateTime.now()
                                                                .plusMinutes(5))
                                .gotoUrl(module.getHost())
                                .build();
                authorizationCodeRepository.save(code);
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
                                        .orElseThrow(() -> new BadCredentialsException(
                                                        "Organization membership revoked"));
                        memberCompanyAccessRepository.findActiveCompany(
                                        member.getId(), code.getOrganization().getId(), company.getId())
                                        .orElseThrow(() -> new BadCredentialsException("Company access revoked"));
                        if (!organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(
                                        code.getOrganization().getId(), module.getId())) {
                                throw new InvalidOperationException("Module entitlement revoked");
                        }
                        if (code.getOrganization().getAccessMode() == AccessMode.BLOCKED) {
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
                        throw new IllegalStateException("Unable to hash refresh token", exception);
                }
        }

        // ==================== FORGOT PASSWORD ====================
        @Override
        public String sendTokenForPassword(
                        String companyCode,
                        String email) {

                try {

                        Optional<Company> optionalCompany = companyRepository
                                        .findByCompanyCode(companyCode);

                        if (optionalCompany.isEmpty()) {

                                return "If account exists, reset link sent to email";
                        }
                        Company company = optionalCompany.get();

                        Optional<User> optionalUser = userRepository
                                        .findByCompany_IdAndEmailIgnoreCase(
                                                        company.getId(),
                                                        email);

                        if (optionalUser.isEmpty()) {

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

                } catch (Exception e) {

                        log.error(
                                        "Error sending reset email: {}",
                                        e.getMessage());

                }

                return "If account exists, reset link sent to email";
        }

        // ==================== EMAIL VERIFY ====================
        @Override
        @Transactional
        public String emailverify(String token) {

                if (token == null
                                || token.isBlank()) {

                        throw new BadCredentialsException(
                                        "Token is required");
                }

                String cleanToken = token.trim();
                log.info(
                                "Email verification started | token={}",
                                cleanToken);

                UserToken userToken = userTokenRepository
                                .findByToken(cleanToken)
                                .orElseThrow(() -> new BadCredentialsException(
                                                "Invalid token"));

                if (userToken.getTokenType() != TokenType.EMAIL_VERIFICATION) {

                        throw new BadCredentialsException(
                                        "Invalid token type");
                }

                if (Boolean.TRUE.equals(
                                userToken.getUsed())) {

                        throw new BadCredentialsException(
                                        "Token already used");
                }

                if (userToken.getExpiresAt() == null
                                || userToken.getExpiresAt()
                                                .isBefore(LocalDateTime.now())) {

                        throw new TokenExpiredException(
                                        "Token expired");
                }

                User user = userToken.getUser();
                if (user == null) {
                        throw new BadCredentialsException(
                                        "Invalid token user");
                }

                Company company = userToken.getCompany();
                if (company == null) {
                        throw new InvalidOperationException(
                                        "Invalid company token");
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

                        throw new BadCredentialsException(
                                        "Token is required");
                }

                UserToken token = userTokenRepository
                                .findByToken(code.trim())
                                .orElseThrow(() -> new BadCredentialsException(
                                                "Token not found"));

                if (token.getTokenType() != TokenType.PASSWORD_RESET) {

                        throw new BadCredentialsException(
                                        "Invalid token");
                }

                if (Boolean.TRUE.equals(
                                token.getUsed())) {

                        throw new BadCredentialsException(
                                        "Token already used");
                }

                if (token.getExpiresAt()
                                .isBefore(LocalDateTime.now())) {

                        throw new TokenExpiredException(
                                        "Token expired");
                }

                User user = token.getUser();

                if (user == null) {

                        throw new BadCredentialsException(
                                        "Invalid token user");
                }

                Company company = token.getCompany();

                if (company == null) {

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

                        throw new BadCredentialsException(
                                        "Client credentials missing");
                }

                Module module = moduleRepository
                                .findByClientId(clientId)
                                .orElseThrow(() -> new BadCredentialsException(
                                                "Invalid client_id"));

                if (Boolean.FALSE.equals(
                                module.getModuleStatus())) {

                        throw new BadCredentialsException(
                                        "Client is inactive");
                }
                if (!module.getClientSecret()
                                .equals(clientSecret.trim())) {

                        throw new BadCredentialsException(
                                        "Invalid client_secret");
                }
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
                                        .build();
                } catch (RuntimeException ex) {
                        log.error(
                                        "Permission/feature enrichment failed during token verification -> userId={} | error={}",
                                        user.getId(),
                                        ex.getMessage());
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

                        throw new BadCredentialsException(
                                        "Invalid request");
                }

                String token = request.getToken().trim();

                String tokenType = request.getTokenType().trim();
                if ("access".equalsIgnoreCase(tokenType)) {

                        Session session = sessionRepository
                                        .findByAccessToken(token)
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Session not found"));

                        log.info(
                                        "Revoking access token | sessionId={} | userId={} | companyId={}",
                                        session.getId(),
                                        session.getUser().getId(),
                                        session.getCompany() != null
                                                        ? session.getCompany().getId()
                                                        : null);

                        sessionRepository.delete(session);

                        return;
                }

                if ("refresh".equalsIgnoreCase(tokenType)) {

                        Session session = sessionRepository
                                        .findByRefreshToken(token)
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Session not found"));

                        log.info(
                                        "Revoking refresh token | sessionId={} | userId={} | companyId={}",
                                        session.getId(),
                                        session.getUser().getId(),
                                        session.getCompany() != null
                                                        ? session.getCompany().getId()
                                                        : null);

                        sessionRepository.delete(session);

                        return;
                }

                throw new BadCredentialsException(
                                "Invalid token type");
        }

        @Override
        @Transactional
        public LoginResponse adminLogin(
                        LoginRequest request,
                        String ip,
                        String userAgent) {

                String input = request.getUsername().trim();

                User user = userRepository
                                .findByUsernameIgnoreCaseOrEmailIgnoreCaseWithRoles(input, input)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                boolean isSystemAdmin = user.getUserRoles() != null
                                && user.getUserRoles()
                                                .stream()
                                                .map(UserRole::getRole)
                                                .filter(Objects::nonNull)
                                                .anyMatch(role -> "SYSTEM_ADMIN".equalsIgnoreCase(role.getName()));

                if (!isSystemAdmin) {
                        throw new BadCredentialsException(
                                        "You are not authorized for admin login");
                }

                if (!"000000".equalsIgnoreCase(
                                user.getCompany().getCompanyCode())) {

                        throw new BadCredentialsException(
                                        "You are not authorized for admin login");
                }

                if (user.getLockedUntil() != null
                                && user.getLockedUntil().isAfter(LocalDateTime.now())) {

                        throw new AccountLockedException(
                                        "Account is locked until " + user.getLockedUntil());
                }

                if (user.getEmailStatus() != Status.VERIFIED) {
                        throw new InvalidOperationException(
                                        "Email is not verified");
                }

                if (user.getAccountStatus() != AccountStatus.ACTIVE) {
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

                                throw new AccountLockedException(
                                                "Account locked due to multiple failed attempts");
                        }

                        userRepository.save(user);

                        throw new BadCredentialsException(
                                        "Invalid credentials");
                }

                user.setFailedLoginCount(0);
                user.setLockedUntil(null);
                userRepository.save(user);

                // SYSTEM_ADMIN MODULE LOAD
                Module module = moduleRepository
                                .findByNameIgnoreCase("SYSTEM_ADMIN")
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "SYSTEM_ADMIN module not found"));

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

                        return Map.of(
                                        "authorized", false,
                                        "reason", "Invalid token");
                }

                /*
                 * SESSION
                 */
                Session session = sessionRepository
                                .findByAccessToken(accessToken.trim())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Session not found"));

                /*
                 * SESSION EXPIRY
                 */
                if (session.getAccessTokenValidTill()
                                .isBefore(LocalDateTime.now())) {

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

                        return Map.of(
                                        "authorized", false,
                                        "reason", "User mismatch");
                }

                /*
                 * COMPANY VALIDATION
                 */
                Company company = session.getCompany();

                if (company == null) {

                        return Map.of(
                                        "authorized", false,
                                        "reason", "Invalid company session");
                }

                /*
                 * MODULE VALIDATION
                 */
                Module module = moduleRepository
                                .findById(moduleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Module not found"));

                /*
                 * MODULE STATUS
                 */
                if (Boolean.FALSE.equals(
                                module.getModuleStatus())) {

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
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Module not enabled for company"));

                /*
                 * USER
                 */
                User user = userRepository
                                .findByIdWithRolesAndPortalAccess(userId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User not found"));

                /*
                 * USER STATUS
                 */
                if (user.getAccountStatus() != AccountStatus.ACTIVE) {

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
                                return Map.of(
                                                "authorized", false,
                                                "reason", "Company mismatch");
                        }
                } else if (!user.getCompany()
                                .getId()
                                .equals(company.getId())) {

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
