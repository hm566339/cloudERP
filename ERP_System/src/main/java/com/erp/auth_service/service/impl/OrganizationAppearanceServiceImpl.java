package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.UpdateOrganizationAppearanceRequest;
import com.erp.auth_service.dto.response.OrganizationAppearanceResponse;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationAppearance;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.repository.OrganizationAppearanceRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.service.OrganizationAppearanceService;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationAppearanceServiceImpl implements OrganizationAppearanceService {

    private final OrganizationAppearanceRepository appearanceRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final AuthorizationService authorizationService;

    private static final Set<String> ALLOWED_THEMES = Set.of("sage", "ocean", "lavender", "terracotta", "slate");
    private static final Set<String> ALLOWED_MODES = Set.of("light", "dark", "system");
    private static final Set<String> ALLOWED_DENSITIES = Set.of("comfortable", "compact", "relaxed");

    @Override
    @Transactional(readOnly = true)
    public OrganizationAppearanceResponse getAppearance(UUID organizationId) {
        if (organizationId == null) {
            throw new ForbiddenException("Organization context required");
        }

        RequestContext.Context ctx = RequestContext.get();
        UUID actorUserId = ctx != null ? ctx.userId() : null;
        assertReadPermission(organizationId, actorUserId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        return appearanceRepository.findByOrganization_Id(organizationId)
                .map(this::mapToResponse)
                .orElseGet(() -> OrganizationAppearanceResponse.defaultFor(org.getId(), org.getOrganizationCode()));
    }

    @Override
    @Transactional
    public OrganizationAppearanceResponse updateAppearance(
            UUID organizationId,
            UUID actorUserId,
            UpdateOrganizationAppearanceRequest request) {

        if (organizationId == null) {
            throw new ForbiddenException("Organization context required");
        }

        assertWritePermission(organizationId, actorUserId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        OrganizationAppearance appearance = appearanceRepository.findByOrganization_Id(organizationId)
                .orElseGet(() -> OrganizationAppearance.builder()
                        .organization(org)
                        .activeTheme("sage")
                        .appearanceMode("system")
                        .layoutDensity("comfortable")
                        .fontFamily("default")
                        .build());

        // Validate and apply theme
        String theme = request != null ? request.resolveActiveTheme() : null;
        if (StringUtils.hasText(theme)) {
            String normalizedTheme = theme.trim().toLowerCase();
            if (ALLOWED_THEMES.contains(normalizedTheme)) {
                appearance.setActiveTheme(normalizedTheme);
            }
        }

        // Validate and apply appearance mode
        String mode = request != null ? request.resolveAppearanceMode() : null;
        if (StringUtils.hasText(mode)) {
            String normalizedMode = mode.trim().toLowerCase();
            if (ALLOWED_MODES.contains(normalizedMode)) {
                appearance.setAppearanceMode(normalizedMode);
            }
        }

        // Validate and apply layout density
        String density = request != null ? request.resolveLayoutDensity() : null;
        if (StringUtils.hasText(density)) {
            String normalizedDensity = density.trim().toLowerCase();
            if (ALLOWED_DENSITIES.contains(normalizedDensity)) {
                appearance.setLayoutDensity(normalizedDensity);
            }
        }

        // Validate and apply font family
        String font = request != null ? request.resolveFontFamily() : null;
        if (StringUtils.hasText(font)) {
            appearance.setFontFamily(font.trim());
        }

        appearance.setUpdatedAt(LocalDateTime.now());
        OrganizationAppearance saved = appearanceRepository.save(appearance);
        log.info("Persisted appearance settings for organization [{}]: theme={}, mode={}, density={}",
                org.getOrganizationCode(), saved.getActiveTheme(), saved.getAppearanceMode(), saved.getLayoutDensity());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public OrganizationAppearanceResponse resetAppearance(UUID organizationId, UUID actorUserId) {
        if (organizationId == null) {
            throw new ForbiddenException("Organization context required");
        }

        assertWritePermission(organizationId, actorUserId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        OrganizationAppearance appearance = appearanceRepository.findByOrganization_Id(organizationId)
                .orElseGet(() -> OrganizationAppearance.builder()
                        .organization(org)
                        .build());

        appearance.setActiveTheme("sage");
        appearance.setAppearanceMode("system");
        appearance.setLayoutDensity("comfortable");
        appearance.setFontFamily("default");
        appearance.setUpdatedAt(LocalDateTime.now());

        OrganizationAppearance saved = appearanceRepository.save(appearance);
        log.info("Reset appearance settings to default Sage Nature for organization [{}]", org.getOrganizationCode());

        return mapToResponse(saved);
    }

    @Override
    public void assertReadPermission(UUID organizationId, UUID actorUserId) {
        authorizationService.requireReadAccess();

        if (PlatformSecurityUtil.isElevatedAdmin()) {
            return;
        }

        if (actorUserId == null) {
            throw new ForbiddenException("Authentication required");
        }

        Optional<OrganizationMember> memberOpt = organizationMemberRepository
                .findByOrganization_IdAndUser_IdAndMembershipStatus(organizationId, actorUserId, MembershipStatus.ACTIVE);

        if (memberOpt.isEmpty()) {
            throw new ForbiddenException("Access denied: You are not an active member of organization: " + organizationId);
        }
    }

    @Override
    public void assertWritePermission(UUID organizationId, UUID actorUserId) {
        authorizationService.requireWriteAccess();

        if (PlatformSecurityUtil.isElevatedAdmin()) {
            return;
        }

        if (actorUserId == null) {
            throw new ForbiddenException("Authentication required");
        }

        Optional<OrganizationMember> memberOpt = organizationMemberRepository
                .findByOrganization_IdAndUser_IdAndMembershipStatus(organizationId, actorUserId, MembershipStatus.ACTIVE);

        if (memberOpt.isEmpty()) {
            throw new ForbiddenException("Access denied: You are not a member of organization: " + organizationId);
        }

        OrganizationMember member = memberOpt.get();
        if (member.getMemberType() != MemberType.OWNER && member.getMemberType() != MemberType.ADMIN) {
            throw new ForbiddenException("Access denied: Only organization OWNER or ADMIN can modify appearance settings");
        }
    }

    private OrganizationAppearanceResponse mapToResponse(OrganizationAppearance appearance) {
        Organization org = appearance.getOrganization();
        return OrganizationAppearanceResponse.builder()
                .organizationId(org.getId())
                .organizationCode(org.getOrganizationCode())
                .activeTheme(appearance.getActiveTheme())
                .appearanceMode(appearance.getAppearanceMode())
                .layoutDensity(appearance.getLayoutDensity())
                .fontFamily(appearance.getFontFamily())
                .updatedAt(appearance.getUpdatedAt())
                .build();
    }
}

