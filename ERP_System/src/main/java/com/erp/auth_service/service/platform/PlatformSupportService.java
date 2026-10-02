package com.erp.auth_service.service.platform;

import com.erp.auth_service.dto.platform.*;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.InvalidOperationException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.model.platform.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.SupportAccessSessionRepository;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.OrganizationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformSupportService {

    private final PlatformAdminRepository platformAdminRepository;
    private final OrganizationRepository organizationRepository;
    private final CompanyRepository companyRepository;
    private final ModuleRepository moduleRepository;
    private final OrganizationModuleRepository organizationModuleRepository;
    private final CompanyModuleRepository companyModuleRepository;
    private final SupportAccessSessionRepository supportAccessSessionRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PlatformAuditService platformAuditService;
    private final JwtService jwtService;
    private final AuthorizationService authorizationService;

    @Value("${platform.admin.support.default-duration-minutes:30}")
    private int defaultDurationMinutes;

    @Value("${platform.admin.support.max-duration-minutes:60}")
    private int maxDurationMinutes;

    @Transactional
    public SupportSessionResponse createSupportSession(
            UUID adminId, CreateSupportSessionRequest request, String ip, String userAgent) {

        PlatformAdmin admin = platformAdminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Platform admin not found: " + adminId));

        if (admin.getStatus() != PlatformAdminStatus.ACTIVE) {
            throw new BadCredentialsException("Platform admin is not active");
        }

        boolean hasSupportPermission = admin.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .anyMatch(p -> "PLATFORM_SUPPORT_ACCESS".equalsIgnoreCase(p.getCode()));

        if (!hasSupportPermission) {
            platformAuditService.record(admin, admin.getEmail(), "SUPPORT_SESSION_DENIED",
                    request.getOrganizationId(), request.getCompanyId(), null, null,
                    "SupportAccessSession", null, "Admin lacks PLATFORM_SUPPORT_ACCESS", ip, userAgent, "DENIED", null);
            throw new ForbiddenException("Admin lacks PLATFORM_SUPPORT_ACCESS permission");
        }

        Organization org = organizationRepository.findById(request.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found: " + request.getOrganizationId()));

        if (org.getStatus() == OrganizationStatus.SUSPENDED || org.getAccessMode() == AccessMode.BLOCKED) {
            platformAuditService.record(admin, admin.getEmail(), "SUPPORT_SESSION_DENIED",
                    org.getId(), request.getCompanyId(), null, null,
                    "SupportAccessSession", null, "Organization is BLOCKED or SUSPENDED", ip, userAgent, "DENIED", null);
            throw new InvalidOperationException("Cannot create support session for BLOCKED or SUSPENDED organization");
        }

        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId()));

        if (company.getOrganization() == null || !company.getOrganization().getId().equals(org.getId())) {
            platformAuditService.record(admin, admin.getEmail(), "CROSS_ORG_SUPPORT_ATTEMPT",
                    org.getId(), company.getId(), null, null,
                    "SupportAccessSession", null, "Company does not belong to organization", ip, userAgent, "DENIED", null);
            throw new InvalidOperationException("Company does not belong to requested organization");
        }

        if (Boolean.FALSE.equals(company.getActive())) {
            throw new InvalidOperationException("Requested company is inactive");
        }

        Module module = moduleRepository.findByNameIgnoreCase(request.getModuleCode().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + request.getModuleCode()));

        if (Boolean.FALSE.equals(module.getModuleStatus())) {
            throw new InvalidOperationException("Requested module is inactive");
        }

        if (!organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(org.getId(), module.getId())) {
            platformAuditService.record(admin, admin.getEmail(), "SUPPORT_SESSION_DENIED",
                    org.getId(), company.getId(), module.getId(), null,
                    "SupportAccessSession", null, "Module not entitled for organization", ip, userAgent, "DENIED", null);
            throw new InvalidOperationException("Module is not entitled for organization");
        }

        if (!companyModuleRepository.existsByCompany_IdAndModule_IdAndActiveTrue(company.getId(), module.getId())) {
            throw new InvalidOperationException("Module is not enabled for company");
        }

        int duration = (request.getDurationMinutes() != null && request.getDurationMinutes() > 0)
                ? request.getDurationMinutes() : defaultDurationMinutes;

        if (duration > maxDurationMinutes) {
            throw new InvalidOperationException("Requested duration (" + duration + "m) exceeds maximum allowed (" + maxDurationMinutes + "m)");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(duration);

        SupportAccessSession session = SupportAccessSession.builder()
                .platformAdmin(admin)
                .organization(org)
                .company(company)
                .module(module)
                .moduleCode(module.getName())
                .reason(request.getReason().trim())
                .durationMinutes(duration)
                .status(SupportSessionStatus.ACTIVE)
                .startedAt(now)
                .lastUsedAt(now)
                .expiresAt(expiresAt)
                .build();

        SupportAccessSession saved = supportAccessSessionRepository.save(session);

        // Generate support token
        Map<String, Object> claims = new HashMap<>();
        claims.put("principalType", PlatformAdminAuthService.PRINCIPAL_TYPE_PLATFORM_SUPPORT);
        claims.put("supportSessionId", saved.getId().toString());
        claims.put("platformAdminId", admin.getId().toString());
        claims.put("organizationId", org.getId().toString());
        claims.put("organizationCode", org.getOrganizationCode());
        claims.put("companyId", company.getId().toString());
        claims.put("companyCode", company.getCompanyCode());
        claims.put("module", module.getName());
        claims.put("reason", saved.getReason());
        claims.put("expiresAt", expiresAt.toString());

        String supportToken = jwtService.generateAccessToken(admin.getEmail(), claims);

        platformAuditService.record(admin, admin.getEmail(), "SUPPORT_SESSION_CREATED",
                org.getId(), company.getId(), module.getId(), saved.getId(),
                "SupportAccessSession", saved.getId().toString(),
                saved.getReason(), ip, userAgent, "SUCCESS", "Duration: " + duration + "m");

        SupportSessionResponse response = toResponse(saved);
        response.setSupportToken(supportToken);
        return response;
    }

    @Transactional
    public SupportSessionResponse revokeSupportSession(
            UUID sessionId, UUID adminId, String reason, String ip, String userAgent) {

        SupportAccessSession session = supportAccessSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Support session not found: " + sessionId));

        if (session.getStatus() == SupportSessionStatus.REVOKED) {
            return toResponse(session);
        }

        session.setStatus(SupportSessionStatus.REVOKED);
        session.setRevokedAt(LocalDateTime.now());
        session.setRevokedReason(reason != null ? reason.trim() : "Manually revoked by admin");
        SupportAccessSession saved = supportAccessSessionRepository.save(session);

        platformAuditService.record(session.getPlatformAdmin(),
                session.getPlatformAdmin() != null ? session.getPlatformAdmin().getEmail() : null,
                "SUPPORT_SESSION_REVOKED",
                session.getOrganization().getId(), session.getCompany().getId(), session.getModule().getId(),
                saved.getId(), "SupportAccessSession", saved.getId().toString(),
                saved.getRevokedReason(), ip, userAgent, "SUCCESS", null);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SupportSessionResponse getSession(UUID sessionId) {
        SupportAccessSession session = supportAccessSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Support session not found: " + sessionId));
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public List<SupportSessionResponse> listSessions(UUID adminId) {
        return supportAccessSessionRepository.findByPlatformAdmin_IdOrderByCreatedAtDesc(adminId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SupportSessionContextResponse getSessionContext(UUID sessionId) {
        SupportAccessSession session = supportAccessSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Support session not found: " + sessionId));

        boolean active = session.isActive();
        long remainingSeconds = 0;
        if (active && session.getExpiresAt() != null) {
            remainingSeconds = Math.max(0, Duration.between(LocalDateTime.now(), session.getExpiresAt()).getSeconds());
        }

        return SupportSessionContextResponse.builder()
                .principalType(PlatformAdminAuthService.PRINCIPAL_TYPE_PLATFORM_SUPPORT)
                .supportSessionId(session.getId())
                .platformAdminId(session.getPlatformAdmin() != null ? session.getPlatformAdmin().getId() : null)
                .platformAdminEmail(session.getPlatformAdmin() != null ? session.getPlatformAdmin().getEmail() : null)
                .organizationId(session.getOrganization().getId())
                .organizationName(session.getOrganization().getDisplayName())
                .organizationCode(session.getOrganization().getOrganizationCode())
                .companyId(session.getCompany().getId())
                .companyName(session.getCompany().getCompanyName())
                .companyCode(session.getCompany().getCompanyCode())
                .moduleId(session.getModule().getId())
                .moduleCode(session.getModuleCode())
                .moduleName(session.getModule().getName())
                .reason(session.getReason())
                .remainingSeconds(remainingSeconds)
                .active(active)
                .build();
    }

    @Transactional
    public Map<String, Object> executeSupportMutation(
            UUID sessionId, UUID adminId, SupportMutationRequest request, String ip, String userAgent) {

        SupportAccessSession session = supportAccessSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Support session not found: " + sessionId));

        if (!session.isActive()) {
            throw new ForbiddenException("Support session is not active (expired or revoked)");
        }

        PlatformAdmin admin = platformAdminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Platform admin not found: " + adminId));

        if (admin.getStatus() != PlatformAdminStatus.ACTIVE) {
            throw new ForbiddenException("Platform admin is inactive");
        }

        boolean isReadOnlySupport = admin.getRoles().stream()
                .allMatch(r -> "READ_ONLY_SUPPORT".equalsIgnoreCase(r.getCode()));
        if (isReadOnlySupport) {
            platformAuditService.record(admin, admin.getEmail(), "SUPPORT_WRITE_DENIED",
                    session.getOrganization().getId(), session.getCompany().getId(), session.getModule().getId(),
                    session.getId(), request.getResourceType(), request.getResourceId(),
                    "READ_ONLY_SUPPORT admin cannot perform mutations", ip, userAgent, "DENIED", null);
            throw new ForbiddenException("READ_ONLY_SUPPORT admin role is not authorized to mutate customer data");
        }

        Organization org = session.getOrganization();
        if (org.getAccessMode() == AccessMode.READ_ONLY || org.getAccessMode() == AccessMode.BLOCKED) {
            throw new ForbiddenException("Cannot mutate data in " + org.getAccessMode() + " organization");
        }

        // Set RequestContext and verify write access
        RequestContext.set(admin.getId(), org.getId(), session.getCompany().getId(),
                session.getModule().getClientId(), org.getAccessMode());

        try {
            authorizationService.requireWriteAccess();

            session.setLastUsedAt(LocalDateTime.now());
            supportAccessSessionRepository.save(session);

            platformAuditService.record(admin, admin.getEmail(), request.getAction(),
                    org.getId(), session.getCompany().getId(), session.getModule().getId(),
                    session.getId(), request.getResourceType(), request.getResourceId(),
                    request.getReason(), ip, userAgent, "SUCCESS",
                    request.getPayload() != null ? request.getPayload().toString() : null);

            return Map.of(
                    "status", "SUCCESS",
                    "action", request.getAction(),
                    "resourceType", request.getResourceType(),
                    "resourceId", request.getResourceId(),
                    "supportSessionId", session.getId(),
                    "timestamp", LocalDateTime.now().toString()
            );
        } finally {
            RequestContext.clear();
        }
    }

    private SupportSessionResponse toResponse(SupportAccessSession s) {
        return SupportSessionResponse.builder()
                .id(s.getId())
                .platformAdminId(s.getPlatformAdmin() != null ? s.getPlatformAdmin().getId() : null)
                .platformAdminEmail(s.getPlatformAdmin() != null ? s.getPlatformAdmin().getEmail() : null)
                .organizationId(s.getOrganization() != null ? s.getOrganization().getId() : null)
                .organizationName(s.getOrganization() != null ? s.getOrganization().getDisplayName() : null)
                .organizationCode(s.getOrganization() != null ? s.getOrganization().getOrganizationCode() : null)
                .companyId(s.getCompany() != null ? s.getCompany().getId() : null)
                .companyName(s.getCompany() != null ? s.getCompany().getCompanyName() : null)
                .companyCode(s.getCompany() != null ? s.getCompany().getCompanyCode() : null)
                .moduleId(s.getModule() != null ? s.getModule().getId() : null)
                .moduleCode(s.getModuleCode())
                .moduleName(s.getModule() != null ? s.getModule().getName() : null)
                .reason(s.getReason())
                .durationMinutes(s.getDurationMinutes())
                .status(s.getStatus())
                .createdAt(s.getCreatedAt())
                .expiresAt(s.getExpiresAt())
                .revokedAt(s.getRevokedAt())
                .revokedReason(s.getRevokedReason())
                .active(s.isActive())
                .build();
    }
}
