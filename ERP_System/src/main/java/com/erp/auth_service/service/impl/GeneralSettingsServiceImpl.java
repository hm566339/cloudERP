package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.UpdateGeneralSettingsRequest;
import com.erp.auth_service.dto.request.UpdateLocalizationSettingsRequest;
import com.erp.auth_service.dto.request.UpdateOrganizationSettingsRequest;
import com.erp.auth_service.dto.response.GeneralSettingsResponse;
import com.erp.auth_service.dto.response.LocalizationSettingsResponse;
import com.erp.auth_service.dto.response.OrganizationSettingsResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.LocalizationSettings;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.OrganizationSettings;
import com.erp.auth_service.repository.LocalizationSettingsRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.repository.OrganizationSettingsRepository;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.service.GeneralSettingsService;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeneralSettingsServiceImpl implements GeneralSettingsService {

    private final OrganizationSettingsRepository organizationSettingsRepository;
    private final LocalizationSettingsRepository localizationSettingsRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final AuthorizationService authorizationService;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$");
    private static final Set<String> ALLOWED_DATE_FORMATS = Set.of(
            "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY", "DD.MM.YYYY"
    );
    private static final Set<String> COMMON_TIMEZONES = Set.of(
            "IST", "UTC", "EST", "PST", "CST", "MST", "GMT", "BST", "CET", "EET", "JST", "AEST"
    );

    @Override
    @Transactional(readOnly = true)
    public OrganizationSettingsResponse getOrganizationSettings(UUID organizationId) {
        if (organizationId == null) {
            throw new ForbiddenException("Organization context required");
        }

        RequestContext.Context ctx = RequestContext.get();
        UUID actorUserId = ctx != null ? ctx.userId() : null;
        assertReadPermission(organizationId, actorUserId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        return organizationSettingsRepository.findByOrganization_Id(organizationId)
                .map(this::mapToOrgResponse)
                .orElseGet(() -> resolveDefaultOrgSettings(org));
    }

    @Override
    @Transactional
    public OrganizationSettingsResponse updateOrganizationSettings(
            UUID organizationId,
            UUID actorUserId,
            UpdateOrganizationSettingsRequest request) {

        if (organizationId == null) {
            throw new ForbiddenException("Organization context required");
        }

        assertWritePermission(organizationId, actorUserId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        String companyName = request != null ? request.resolveCompanyName() : null;
        String contactEmail = request != null ? request.resolveContactEmail() : null;

        validateCompanyName(companyName);
        validateContactEmail(contactEmail);

        OrganizationSettings settings = organizationSettingsRepository.findByOrganization_Id(organizationId)
                .orElseGet(() -> OrganizationSettings.builder()
                        .organization(org)
                        .build());

        settings.setCompanyName(companyName.trim());
        settings.setContactEmail(contactEmail.trim().toLowerCase());
        settings.setUpdatedAt(LocalDateTime.now());

        OrganizationSettings saved = organizationSettingsRepository.save(settings);

        // Keep organization display name in sync
        org.setDisplayName(companyName.trim());
        organizationRepository.save(org);

        log.info("Updated organization settings for org [{}]: companyName='{}', contactEmail='{}'",
                org.getOrganizationCode(), saved.getCompanyName(), saved.getContactEmail());

        return mapToOrgResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public LocalizationSettingsResponse getLocalizationSettings(UUID organizationId) {
        if (organizationId == null) {
            throw new ForbiddenException("Organization context required");
        }

        RequestContext.Context ctx = RequestContext.get();
        UUID actorUserId = ctx != null ? ctx.userId() : null;
        assertReadPermission(organizationId, actorUserId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        return localizationSettingsRepository.findByOrganization_Id(organizationId)
                .map(this::mapToLocResponse)
                .orElseGet(() -> resolveDefaultLocSettings(org));
    }

    @Override
    @Transactional
    public LocalizationSettingsResponse updateLocalizationSettings(
            UUID organizationId,
            UUID actorUserId,
            UpdateLocalizationSettingsRequest request) {

        if (organizationId == null) {
            throw new ForbiddenException("Organization context required");
        }

        assertWritePermission(organizationId, actorUserId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        String currency = request != null ? request.resolveDefaultCurrency() : null;
        String timezone = request != null ? request.resolveTimezone() : null;
        String dateFormat = request != null ? request.resolveDateFormat() : null;
        String timeFormat = request != null ? request.resolveTimeFormat() : null;

        currency = validateCurrency(currency);
        timezone = validateTimezone(timezone);
        dateFormat = validateDateFormat(dateFormat);
        timeFormat = validateTimeFormat(timeFormat);

        LocalizationSettings settings = localizationSettingsRepository.findByOrganization_Id(organizationId)
                .orElseGet(() -> LocalizationSettings.builder()
                        .organization(org)
                        .build());

        settings.setDefaultCurrency(currency);
        settings.setTimezone(timezone);
        settings.setDateFormat(dateFormat);
        settings.setTimeFormat(timeFormat);
        settings.setUpdatedAt(LocalDateTime.now());

        LocalizationSettings saved = localizationSettingsRepository.save(settings);

        // Keep organization currency and timezone in sync
        org.setCurrency(currency);
        org.setTimezone(timezone);
        organizationRepository.save(org);

        log.info("Updated localization settings for org [{}]: currency='{}', timezone='{}', dateFormat='{}', timeFormat='{}'",
                org.getOrganizationCode(), saved.getDefaultCurrency(), saved.getTimezone(), saved.getDateFormat(), saved.getTimeFormat());

        return mapToLocResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public GeneralSettingsResponse getGeneralSettings(UUID organizationId) {
        if (organizationId == null) {
            throw new ForbiddenException("Organization context required");
        }

        RequestContext.Context ctx = RequestContext.get();
        UUID actorUserId = ctx != null ? ctx.userId() : null;
        assertReadPermission(organizationId, actorUserId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        OrganizationSettingsResponse orgSettings = organizationSettingsRepository.findByOrganization_Id(organizationId)
                .map(this::mapToOrgResponse)
                .orElseGet(() -> resolveDefaultOrgSettings(org));

        LocalizationSettingsResponse locSettings = localizationSettingsRepository.findByOrganization_Id(organizationId)
                .map(this::mapToLocResponse)
                .orElseGet(() -> resolveDefaultLocSettings(org));

        LocalDateTime latestUpdatedAt = orgSettings.getUpdatedAt() != null && locSettings.getUpdatedAt() != null
                ? (orgSettings.getUpdatedAt().isAfter(locSettings.getUpdatedAt()) ? orgSettings.getUpdatedAt() : locSettings.getUpdatedAt())
                : (orgSettings.getUpdatedAt() != null ? orgSettings.getUpdatedAt() : locSettings.getUpdatedAt());

        return GeneralSettingsResponse.builder()
                .organizationId(org.getId())
                .companyName(orgSettings.getCompanyName())
                .contactEmail(orgSettings.getContactEmail())
                .defaultCurrency(locSettings.getDefaultCurrency())
                .timezone(locSettings.getTimezone())
                .dateFormat(locSettings.getDateFormat())
                .timeFormat(locSettings.getTimeFormat())
                .updatedAt(latestUpdatedAt)
                .build();
    }

    @Override
    @Transactional
    public GeneralSettingsResponse updateGeneralSettings(
            UUID organizationId,
            UUID actorUserId,
            UpdateGeneralSettingsRequest request) {

        if (organizationId == null) {
            throw new ForbiddenException("Organization context required");
        }

        assertWritePermission(organizationId, actorUserId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        String companyName = request != null ? request.resolveCompanyName() : null;
        String contactEmail = request != null ? request.resolveContactEmail() : null;
        String currency = request != null ? request.resolveDefaultCurrency() : null;
        String timezone = request != null ? request.resolveTimezone() : null;
        String dateFormat = request != null ? request.resolveDateFormat() : null;
        String timeFormat = request != null ? request.resolveTimeFormat() : null;

        // Apply and save Organization Settings
        OrganizationSettings orgSettings = organizationSettingsRepository.findByOrganization_Id(organizationId)
                .orElseGet(() -> OrganizationSettings.builder()
                        .organization(org)
                        .companyName(resolveDefaultCompanyName(org))
                        .contactEmail("admin@acmecorp.com")
                        .build());

        if (StringUtils.hasText(companyName)) {
            validateCompanyName(companyName);
            orgSettings.setCompanyName(companyName.trim());
            org.setDisplayName(companyName.trim());
        }
        if (StringUtils.hasText(contactEmail)) {
            validateContactEmail(contactEmail);
            orgSettings.setContactEmail(contactEmail.trim().toLowerCase());
        }
        orgSettings.setUpdatedAt(LocalDateTime.now());
        organizationSettingsRepository.save(orgSettings);

        // Apply and save Localization Settings
        LocalizationSettings locSettings = localizationSettingsRepository.findByOrganization_Id(organizationId)
                .orElseGet(() -> LocalizationSettings.builder()
                        .organization(org)
                        .defaultCurrency("INR")
                        .timezone("IST")
                        .dateFormat("DD/MM/YYYY")
                        .timeFormat("12h")
                        .build());

        if (StringUtils.hasText(currency)) {
            String validatedCurrency = validateCurrency(currency);
            locSettings.setDefaultCurrency(validatedCurrency);
            org.setCurrency(validatedCurrency);
        }
        if (StringUtils.hasText(timezone)) {
            String validatedTz = validateTimezone(timezone);
            locSettings.setTimezone(validatedTz);
            org.setTimezone(validatedTz);
        }
        if (StringUtils.hasText(dateFormat)) {
            locSettings.setDateFormat(validateDateFormat(dateFormat));
        }
        if (StringUtils.hasText(timeFormat)) {
            locSettings.setTimeFormat(validateTimeFormat(timeFormat));
        }
        locSettings.setUpdatedAt(LocalDateTime.now());
        localizationSettingsRepository.save(locSettings);

        organizationRepository.save(org);

        log.info("Updated general settings for org [{}]: name='{}', email='{}', currency='{}', tz='{}', date='{}', time='{}'",
                org.getOrganizationCode(), orgSettings.getCompanyName(), orgSettings.getContactEmail(),
                locSettings.getDefaultCurrency(), locSettings.getTimezone(), locSettings.getDateFormat(), locSettings.getTimeFormat());

        return GeneralSettingsResponse.builder()
                .organizationId(org.getId())
                .companyName(orgSettings.getCompanyName())
                .contactEmail(orgSettings.getContactEmail())
                .defaultCurrency(locSettings.getDefaultCurrency())
                .timezone(locSettings.getTimezone())
                .dateFormat(locSettings.getDateFormat())
                .timeFormat(locSettings.getTimeFormat())
                .updatedAt(LocalDateTime.now())
                .build();
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
            throw new ForbiddenException("Access denied: Only organization OWNER or ADMIN can modify general settings");
        }
    }

    private void validateCompanyName(String companyName) {
        if (!StringUtils.hasText(companyName) || companyName.trim().length() < 2 || companyName.trim().length() > 255) {
            throw new BadRequestException("Company name must be between 2 and 255 characters");
        }
    }

    private void validateContactEmail(String email) {
        if (!StringUtils.hasText(email) || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new BadRequestException("Invalid contact email format");
        }
    }

    private String validateCurrency(String currency) {
        if (!StringUtils.hasText(currency)) {
            throw new BadRequestException("Default currency is required");
        }
        String clean = currency.trim().toUpperCase();
        if (clean.length() < 2 || clean.length() > 10) {
            throw new BadRequestException("Default currency code is invalid: " + currency);
        }
        return clean;
    }

    private String validateTimezone(String timezone) {
        if (!StringUtils.hasText(timezone)) {
            throw new BadRequestException("Timezone is required");
        }
        String clean = timezone.trim();
        // Check known common aliases
        if (COMMON_TIMEZONES.contains(clean.toUpperCase())) {
            return clean.toUpperCase();
        }
        // Check IANA zone id
        try {
            ZoneId zoneId = ZoneId.of(clean);
            return zoneId.getId();
        } catch (Exception ex) {
            // Also check partial matching or alias
            for (String available : ZoneId.getAvailableZoneIds()) {
                if (available.equalsIgnoreCase(clean)) {
                    return available;
                }
            }
            throw new BadRequestException("Invalid timezone identifier: " + timezone);
        }
    }

    private String validateDateFormat(String dateFormat) {
        if (!StringUtils.hasText(dateFormat)) {
            throw new BadRequestException("Date format is required");
        }
        String clean = dateFormat.trim().toUpperCase();
        if (!ALLOWED_DATE_FORMATS.contains(clean)) {
            throw new BadRequestException("Unsupported date format: " + dateFormat + ". Allowed: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD");
        }
        return clean;
    }

    private String validateTimeFormat(String timeFormat) {
        if (!StringUtils.hasText(timeFormat)) {
            throw new BadRequestException("Time format is required");
        }
        String clean = timeFormat.trim().toLowerCase();
        if ("12h".equals(clean) || "12-hour".equals(clean) || "12-hour (am/pm)".equals(clean)) {
            return "12h";
        }
        if ("24h".equals(clean) || "24-hour".equals(clean)) {
            return "24h";
        }
        throw new BadRequestException("Unsupported time format: " + timeFormat + ". Allowed: 12h, 24h");
    }

    private OrganizationSettingsResponse mapToOrgResponse(OrganizationSettings settings) {
        return OrganizationSettingsResponse.builder()
                .organizationId(settings.getOrganization().getId())
                .companyName(settings.getCompanyName())
                .contactEmail(settings.getContactEmail())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }

    private LocalizationSettingsResponse mapToLocResponse(LocalizationSettings settings) {
        return LocalizationSettingsResponse.builder()
                .organizationId(settings.getOrganization().getId())
                .defaultCurrency(settings.getDefaultCurrency())
                .timezone(settings.getTimezone())
                .dateFormat(settings.getDateFormat())
                .timeFormat(settings.getTimeFormat())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }

    private OrganizationSettingsResponse resolveDefaultOrgSettings(Organization org) {
        String companyName = resolveDefaultCompanyName(org);
        String contactEmail = resolveDefaultContactEmail(org);
        return OrganizationSettingsResponse.defaultFor(org.getId(), companyName, contactEmail);
    }

    private LocalizationSettingsResponse resolveDefaultLocSettings(Organization org) {
        String currency = StringUtils.hasText(org.getCurrency()) ? org.getCurrency().trim().toUpperCase() : "INR";
        String timezone = StringUtils.hasText(org.getTimezone()) ? org.getTimezone().trim() : "IST";
        return LocalizationSettingsResponse.defaultFor(org.getId(), currency, timezone);
    }

    private String resolveDefaultCompanyName(Organization org) {
        if (StringUtils.hasText(org.getDisplayName())) {
            return org.getDisplayName().trim();
        }
        if (StringUtils.hasText(org.getLegalName())) {
            return org.getLegalName().trim();
        }
        return org.getOrganizationCode() != null ? org.getOrganizationCode().trim() : "Acme Corporation";
    }

    private String resolveDefaultContactEmail(Organization org) {
        Optional<OrganizationMember> ownerOpt = organizationMemberRepository
                .findByOrganization_Id(org.getId()).stream()
                .filter(m -> m.getMemberType() == MemberType.OWNER && m.getUser() != null)
                .findFirst();

        if (ownerOpt.isPresent() && StringUtils.hasText(ownerOpt.get().getUser().getEmail())) {
            return ownerOpt.get().getUser().getEmail();
        }
        return "admin@" + (org.getOrganizationCode() != null ? org.getOrganizationCode().toLowerCase() : "acmecorp") + ".com";
    }
}

