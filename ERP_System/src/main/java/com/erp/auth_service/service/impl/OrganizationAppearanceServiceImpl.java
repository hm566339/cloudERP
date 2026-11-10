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
import com.erp.auth_service.service.CloudinaryService;
import com.erp.auth_service.service.OrganizationAppearanceService;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class OrganizationAppearanceServiceImpl implements OrganizationAppearanceService {

    private final OrganizationAppearanceRepository appearanceRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final AuthorizationService authorizationService;
    private final CloudinaryService cloudinaryService;

    private static final Set<String> ALLOWED_THEMES = Set.of("sage", "ocean", "lavender", "terracotta", "slate");
    private static final Set<String> ALLOWED_MODES = Set.of("light", "dark", "system");
    private static final Set<String> ALLOWED_DENSITIES = Set.of("comfortable", "compact", "relaxed");
    private static final Set<String> ALLOWED_SIDEBAR_STATES = Set.of("expanded", "collapsed");
    private static final Set<String> ALLOWED_CONTENT_WIDTHS = Set.of("standard", "wide");
    private static final Set<String> ALLOWED_BORDER_RADII = Set.of("small", "medium", "large");
    private static final Set<String> ALLOWED_TABLE_DENSITIES = Set.of("comfortable", "compact");
    private static final Set<String> ALLOWED_FONT_SIZES = Set.of("small", "default", "large");
    private static final Set<String> ALLOWED_FONT_FAMILIES = Set.of("default", "inter", "jakarta", "roboto", "system");

    private static final long MAX_ASSET_SIZE_BYTES = 2L * 1024L * 1024L; // 2MB
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/svg+xml",
            "image/x-icon",
            "image/vnd.microsoft.icon",
            "image/webp");

    public OrganizationAppearanceServiceImpl(
            OrganizationAppearanceRepository appearanceRepository,
            OrganizationRepository organizationRepository,
            OrganizationMemberRepository organizationMemberRepository,
            AuthorizationService authorizationService) {
        this(appearanceRepository, organizationRepository, organizationMemberRepository, authorizationService, null);
    }

    @Autowired
    public OrganizationAppearanceServiceImpl(
            OrganizationAppearanceRepository appearanceRepository,
            OrganizationRepository organizationRepository,
            OrganizationMemberRepository organizationMemberRepository,
            AuthorizationService authorizationService,
            @Autowired(required = false) CloudinaryService cloudinaryService) {
        this.appearanceRepository = appearanceRepository;
        this.organizationRepository = organizationRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.authorizationService = authorizationService;
        this.cloudinaryService = cloudinaryService;
    }

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
                        .sidebarDefaultState("expanded")
                        .contentWidth("standard")
                        .borderRadius("medium")
                        .cardShadow(true)
                        .tableDensity("comfortable")
                        .baseFontSize("default")
                        .customOverridesEnabled(false)
                        .build());

        if (request != null) {
            // Theme Preset
            String theme = request.resolveActiveTheme();
            if (StringUtils.hasText(theme)) {
                String normalizedTheme = theme.trim().toLowerCase();
                if (ALLOWED_THEMES.contains(normalizedTheme)) {
                    appearance.setActiveTheme(normalizedTheme);
                }
            }

            // Appearance Mode
            String mode = request.resolveAppearanceMode();
            if (StringUtils.hasText(mode)) {
                String normalizedMode = mode.trim().toLowerCase();
                if (ALLOWED_MODES.contains(normalizedMode)) {
                    appearance.setAppearanceMode(normalizedMode);
                }
            }

            // Layout Density
            String density = request.resolveLayoutDensity();
            if (StringUtils.hasText(density)) {
                String normalizedDensity = density.trim().toLowerCase();
                if (ALLOWED_DENSITIES.contains(normalizedDensity)) {
                    appearance.setLayoutDensity(normalizedDensity);
                }
            }

            // Font Family
            String font = request.resolveFontFamily();
            if (StringUtils.hasText(font)) {
                String normalizedFont = font.trim().toLowerCase();
                if (ALLOWED_FONT_FAMILIES.contains(normalizedFont)) {
                    appearance.setFontFamily(normalizedFont);
                } else {
                    appearance.setFontFamily(font.trim());
                }
            }

            // Sidebar Default State
            String sidebarState = request.resolveSidebarDefaultState();
            if (StringUtils.hasText(sidebarState)) {
                String normalized = sidebarState.trim().toLowerCase();
                if (ALLOWED_SIDEBAR_STATES.contains(normalized)) {
                    appearance.setSidebarDefaultState(normalized);
                }
            }

            // Content Width
            String width = request.resolveContentWidth();
            if (StringUtils.hasText(width)) {
                String normalized = width.trim().toLowerCase();
                if (ALLOWED_CONTENT_WIDTHS.contains(normalized)) {
                    appearance.setContentWidth(normalized);
                }
            }

            // Border Radius
            String radius = request.resolveBorderRadius();
            if (StringUtils.hasText(radius)) {
                String normalized = radius.trim().toLowerCase();
                if (ALLOWED_BORDER_RADII.contains(normalized)) {
                    appearance.setBorderRadius(normalized);
                }
            }

            // Card Shadow
            Boolean cardShadow = request.resolveCardShadow();
            if (cardShadow != null) {
                appearance.setCardShadow(cardShadow);
            }

            // Table Density
            String tableDens = request.resolveTableDensity();
            if (StringUtils.hasText(tableDens)) {
                String normalized = tableDens.trim().toLowerCase();
                if (ALLOWED_TABLE_DENSITIES.contains(normalized)) {
                    appearance.setTableDensity(normalized);
                }
            }

            // Base Font Size
            String fontSize = request.resolveBaseFontSize();
            if (StringUtils.hasText(fontSize)) {
                String normalized = fontSize.trim().toLowerCase();
                if (ALLOWED_FONT_SIZES.contains(normalized)) {
                    appearance.setBaseFontSize(normalized);
                }
            }

            // Branding Assets URLs
            String lightLogo = request.resolveLightLogoUrl();
            if (lightLogo != null) {
                appearance.setLightLogoUrl(StringUtils.hasText(lightLogo) ? lightLogo.trim() : null);
            }

            String darkLogo = request.resolveDarkLogoUrl();
            if (darkLogo != null) {
                appearance.setDarkLogoUrl(StringUtils.hasText(darkLogo) ? darkLogo.trim() : null);
            }

            String favicon = request.resolveFaviconUrl();
            if (favicon != null) {
                appearance.setFaviconUrl(StringUtils.hasText(favicon) ? favicon.trim() : null);
            }

            // Custom Overrides & Palette
            Boolean overridesEnabled = request.resolveCustomOverridesEnabled();
            if (overridesEnabled != null) {
                appearance.setCustomOverridesEnabled(overridesEnabled);
            }

            String customPalette = request.resolveCustomPalette();
            if (customPalette != null) {
                appearance.setCustomPalette(StringUtils.hasText(customPalette) ? customPalette.trim() : null);
            }

            String primary = request.resolvePrimaryColor();
            if (primary != null) {
                appearance.setPrimaryColor(StringUtils.hasText(primary) ? primary.trim() : null);
            }

            String secondary = request.resolveSecondaryColor();
            if (secondary != null) {
                appearance.setSecondaryColor(StringUtils.hasText(secondary) ? secondary.trim() : null);
            }

            String accent = request.resolveAccentColor();
            if (accent != null) {
                appearance.setAccentColor(StringUtils.hasText(accent) ? accent.trim() : null);
            }
        }

        appearance.setUpdatedAt(LocalDateTime.now());
        OrganizationAppearance saved = appearanceRepository.save(appearance);
        log.info("Persisted extended appearance settings for organization [{}]: theme={}, mode={}, density={}, font={}, sidebar={}",
                org.getOrganizationCode(), saved.getActiveTheme(), saved.getAppearanceMode(),
                saved.getLayoutDensity(), saved.getFontFamily(), saved.getSidebarDefaultState());

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
        appearance.setSidebarDefaultState("expanded");
        appearance.setContentWidth("standard");
        appearance.setBorderRadius("medium");
        appearance.setCardShadow(true);
        appearance.setTableDensity("comfortable");
        appearance.setBaseFontSize("default");
        appearance.setLightLogoUrl(null);
        appearance.setDarkLogoUrl(null);
        appearance.setFaviconUrl(null);
        appearance.setCustomOverridesEnabled(false);
        appearance.setCustomPalette(null);
        appearance.setPrimaryColor(null);
        appearance.setSecondaryColor(null);
        appearance.setAccentColor(null);
        appearance.setUpdatedAt(LocalDateTime.now());

        OrganizationAppearance saved = appearanceRepository.save(appearance);
        log.info("Reset appearance settings to default Sage Nature for organization [{}]", org.getOrganizationCode());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public Map<String, Object> uploadAsset(UUID organizationId, UUID actorUserId, MultipartFile file,
            String assetType) {
        if (organizationId == null) {
            throw new ForbiddenException("Organization context required");
        }

        assertWritePermission(organizationId, actorUserId);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Asset file cannot be empty");
        }

        if (file.getSize() > MAX_ASSET_SIZE_BYTES) {
            throw new IllegalArgumentException("Asset file size exceeds the 2MB maximum limit");
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        if (contentType != null) {
            String lowerType = contentType.toLowerCase().trim();
            if (!ALLOWED_MIME_TYPES.contains(lowerType)) {
                throw new IllegalArgumentException(
                        "Unsupported image format. Allowed formats: PNG, JPG, SVG, ICO, WEBP");
            }
        }

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        String assetUrl = null;

        // Try Cloudinary if available
        if (cloudinaryService != null) {
            try {
                assetUrl = cloudinaryService.uploadFile(file);
                log.info("Successfully uploaded branding asset to Cloudinary: {}", assetUrl);
            } catch (Exception e) {
                log.warn("Cloudinary upload failed, falling back to base64 data URI", e);
            }
        }

        // Resilient fallback: data URI representation
        if (!StringUtils.hasText(assetUrl)) {
            try {
                String mime = StringUtils.hasText(contentType) ? contentType : "image/png";
                String base64 = Base64.getEncoder().encodeToString(file.getBytes());
                assetUrl = "data:" + mime + ";base64," + base64;
                log.info("Generated base64 data URI for branding asset ({} bytes)", file.getSize());
            } catch (IOException e) {
                log.error("Failed to read asset file bytes", e);
                throw new RuntimeException("Failed to process branding asset file", e);
            }
        }

        // Update Organization Appearance record
        OrganizationAppearance appearance = appearanceRepository.findByOrganization_Id(organizationId)
                .orElseGet(() -> OrganizationAppearance.builder()
                        .organization(org)
                        .activeTheme("sage")
                        .appearanceMode("system")
                        .layoutDensity("comfortable")
                        .fontFamily("default")
                        .build());

        String normalizedType = assetType != null ? assetType.trim().toLowerCase() : "asset";
        if ("light_logo".equals(normalizedType) || "lightlogo".equals(normalizedType)) {
            appearance.setLightLogoUrl(assetUrl);
        } else if ("dark_logo".equals(normalizedType) || "darklogo".equals(normalizedType)) {
            appearance.setDarkLogoUrl(assetUrl);
        } else if ("favicon".equals(normalizedType) || "favicon_url".equals(normalizedType)) {
            appearance.setFaviconUrl(assetUrl);
        }

        appearance.setUpdatedAt(LocalDateTime.now());
        OrganizationAppearance saved = appearanceRepository.save(appearance);

        Map<String, Object> result = new HashMap<>();
        result.put("assetUrl", assetUrl);
        result.put("assetType", normalizedType);
        result.put("filename", originalFilename);
        result.put("appearance", mapToResponse(saved));
        return result;
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
                .findByOrganization_IdAndUser_IdAndMembershipStatus(organizationId, actorUserId,
                        MembershipStatus.ACTIVE);

        if (memberOpt.isEmpty()) {
            throw new ForbiddenException(
                    "Access denied: You are not an active member of organization: " + organizationId);
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
                .findByOrganization_IdAndUser_IdAndMembershipStatus(organizationId, actorUserId,
                        MembershipStatus.ACTIVE);

        if (memberOpt.isEmpty()) {
            throw new ForbiddenException("Access denied: You are not a member of organization: " + organizationId);
        }

        OrganizationMember member = memberOpt.get();
        if (member.getMemberType() != MemberType.OWNER && member.getMemberType() != MemberType.ADMIN) {
            throw new ForbiddenException(
                    "Access denied: Only organization OWNER or ADMIN can modify appearance settings");
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
                .sidebarDefaultState(appearance.getSidebarDefaultState())
                .contentWidth(appearance.getContentWidth())
                .borderRadius(appearance.getBorderRadius())
                .cardShadow(appearance.getCardShadow())
                .tableDensity(appearance.getTableDensity())
                .baseFontSize(appearance.getBaseFontSize())
                .lightLogoUrl(appearance.getLightLogoUrl())
                .darkLogoUrl(appearance.getDarkLogoUrl())
                .faviconUrl(appearance.getFaviconUrl())
                .customOverridesEnabled(appearance.getCustomOverridesEnabled())
                .customPalette(appearance.getCustomPalette())
                .primaryColor(appearance.getPrimaryColor())
                .secondaryColor(appearance.getSecondaryColor())
                .accentColor(appearance.getAccentColor())
                .updatedAt(appearance.getUpdatedAt())
                .build();
    }
}
