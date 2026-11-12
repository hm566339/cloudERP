package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.*;
import com.erp.auth_service.dto.response.*;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.service.OrganizationSettingsService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationSettingsServiceImpl implements OrganizationSettingsService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationSettingsRepository organizationSettingsRepository;
    private final OrganizationRegionalSettingsRepository regionalSettingsRepository;
    private final OrganizationSecuritySettingsRepository securitySettingsRepository;
    private final LocalizationSettingsRepository localizationSettingsRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final CompanyRepository companyRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final ModuleRepository moduleRepository;
    private final OrganizationModuleRepository organizationModuleRepository;
    private final CompanyModuleRepository companyModuleRepository;
    private final MemberCompanyAccessRepository memberCompanyAccessRepository;
    private final AuthorizationService authorizationService;

    @Value("${api.frontend:https://app.mark2erp.com}")
    private String frontendBaseUrl;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$");

    private static final Set<String> ALLOWED_DATE_FORMATS = Set.of(
            "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY", "DD.MM.YYYY"
    );

    private static final Set<String> ALLOWED_TIME_FORMATS = Set.of("12h", "24h");

    private static final Set<String> ALLOWED_MONTHS = Set.of(
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
    );

    private static final Set<String> COMMON_TIMEZONES = Set.of(
            "IST", "UTC", "EST", "PST", "CST", "MST", "GMT", "BST", "CET", "EET", "JST", "AEST",
            "Asia/Kolkata (IST)", "America/New_York (EST)", "Europe/London (GMT)", "Asia/Dubai (GST)"
    );

    private static final Map<String, String> CANONICAL_MODULE_NAMES = Map.of(
            "ACCOUNT", "Finance & Accounts",
            "INVENTORY", "Inventory",
            "CRM", "Sales & CRM",
            "PURCHASING", "Purchasing",
            "WORKFLOW", "Workflow Automation",
            "SYSTEM_ADMIN", "SSO Admin"
    );

    // =========================================================================
    // 1. Organization Profile
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public OrganizationProfileResponse getProfile(UUID organizationId, UUID actorUserId) {
        assertReadPermission(organizationId, actorUserId);

        Organization org = findOrganizationOrThrow(organizationId);
        String primaryEmail = resolvePrimaryEmail(org);

        return OrganizationProfileResponse.builder()
                .id(org.getId())
                .name(org.getDisplayName() != null ? org.getDisplayName() : org.getLegalName())
                .code(org.getOrganizationCode() != null ? org.getOrganizationCode().toUpperCase(Locale.ROOT) : "")
                .primaryEmail(primaryEmail)
                .status(org.getStatus() != null ? org.getStatus().name() : OrganizationStatus.ACTIVE.name())
                .accessMode(org.getAccessMode() != null ? org.getAccessMode().name() : AccessMode.FULL.name())
                .createdAt(org.getCreatedAt())
                .updatedAt(org.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public OrganizationProfileResponse updateProfile(UUID organizationId, UUID actorUserId, UpdateOrganizationProfileRequest request) {
        assertWritePermission(organizationId, actorUserId);

        Organization org = findOrganizationOrThrow(organizationId);

        String newName = request != null ? request.resolveName() : null;
        String newEmail = request != null ? request.resolvePrimaryEmail() : null;

        if (!StringUtils.hasText(newName)) {
            throw new BadRequestException("Organization name cannot be blank");
        }
        if (newName.length() > 255) {
            throw new BadRequestException("Organization name must not exceed 255 characters");
        }

        if (!StringUtils.hasText(newEmail)) {
            throw new BadRequestException("Primary organization email cannot be blank");
        }
        String cleanEmail = newEmail.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            throw new BadRequestException("Invalid primary organization email format");
        }

        if (organizationRepository.existsByPrimaryEmailIgnoreCaseAndIdNot(cleanEmail, org.getId())) {
            throw new DuplicateResourceException("Organization with this primary email already exists");
        }

        org.setDisplayName(newName.trim());
        org.setLegalName(newName.trim());
        org.setPrimaryEmail(cleanEmail);
        org.setUpdatedAt(LocalDateTime.now());
        Organization savedOrg = organizationRepository.save(org);

        // Sync with organization_settings for General Settings interoperability
        OrganizationSettings orgSettings = organizationSettingsRepository.findByOrganization_Id(organizationId)
                .orElseGet(() -> OrganizationSettings.builder().organization(savedOrg).build());
        orgSettings.setCompanyName(newName.trim());
        orgSettings.setContactEmail(cleanEmail);
        orgSettings.setUpdatedAt(LocalDateTime.now());
        organizationSettingsRepository.save(orgSettings);

        log.info("Organization profile updated | orgId={} | name={} | email={}", organizationId, newName, cleanEmail);

        return OrganizationProfileResponse.builder()
                .id(org.getId())
                .name(org.getDisplayName())
                .code(org.getOrganizationCode() != null ? org.getOrganizationCode().toUpperCase(Locale.ROOT) : "")
                .primaryEmail(org.getPrimaryEmail())
                .status(org.getStatus() != null ? org.getStatus().name() : OrganizationStatus.ACTIVE.name())
                .accessMode(org.getAccessMode() != null ? org.getAccessMode().name() : AccessMode.FULL.name())
                .createdAt(org.getCreatedAt())
                .updatedAt(org.getUpdatedAt())
                .build();
    }

    // =========================================================================
    // 2. Dedicated Login Portal
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public OrganizationLoginPortalResponse getLoginPortal(UUID organizationId, UUID actorUserId) {
        assertReadPermission(organizationId, actorUserId);

        Organization org = findOrganizationOrThrow(organizationId);
        if (org.getStatus() != OrganizationStatus.ACTIVE) {
            throw new BadRequestException("Organization is not active");
        }

        String orgCode = (org.getOrganizationCode() != null ? org.getOrganizationCode() : "").toLowerCase(Locale.ROOT);
        String baseUrl = StringUtils.hasText(frontendBaseUrl) ? frontendBaseUrl.replaceAll("/+$", "") : "";
        String loginUrl = baseUrl + "/erp/o/" + orgCode + "/login";

        return OrganizationLoginPortalResponse.builder()
                .organizationCode(org.getOrganizationCode() != null ? org.getOrganizationCode().toUpperCase(Locale.ROOT) : "")
                .slug(orgCode)
                .loginUrl(loginUrl)
                .previewUrl(loginUrl)
                .status(org.getStatus() != null ? org.getStatus().name() : OrganizationStatus.ACTIVE.name())
                .build();
    }

    // =========================================================================
    // 3. Regional & Fiscal Defaults
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public OrganizationRegionalSettingsResponse getRegionalSettings(UUID organizationId, UUID actorUserId) {
        assertReadPermission(organizationId, actorUserId);

        Organization org = findOrganizationOrThrow(organizationId);

        return regionalSettingsRepository.findByOrganization_Id(organizationId)
                .map(this::mapToRegionalResponse)
                .orElseGet(() -> resolveDefaultRegionalSettings(org));
    }

    @Override
    @Transactional
    public OrganizationRegionalSettingsResponse updateRegionalSettings(
            UUID organizationId, UUID actorUserId, UpdateRegionalSettingsRequest request) {

        assertWritePermission(organizationId, actorUserId);
        Organization org = findOrganizationOrThrow(organizationId);

        String currency = request != null ? request.resolveCurrency() : null;
        String timezone = request != null ? request.resolveTimezone() : null;
        String fiscalYear = request != null ? request.resolveFiscalYearStartMonth() : null;
        String dateFormat = request != null ? request.resolveDateFormat() : null;
        String timeFormat = request != null ? request.resolveTimeFormat() : null;

        validateCurrency(currency);
        validateTimezone(timezone);
        validateFiscalYear(fiscalYear);
        validateDateFormat(dateFormat);
        validateTimeFormat(timeFormat);

        String cleanCurrency = currency.trim().toUpperCase(Locale.ROOT);
        String cleanTimezone = timezone.trim();
        String cleanFiscalYear = normalizeMonth(fiscalYear);
        String cleanDateFormat = dateFormat.trim();
        String cleanTimeFormat = timeFormat.trim().toLowerCase(Locale.ROOT);

        OrganizationRegionalSettings settings = regionalSettingsRepository.findByOrganization_Id(organizationId)
                .orElseGet(() -> OrganizationRegionalSettings.builder().organization(org).build());

        settings.setCurrency(cleanCurrency);
        settings.setTimezone(cleanTimezone);
        settings.setFiscalYearStartMonth(cleanFiscalYear);
        settings.setDateFormat(cleanDateFormat);
        settings.setTimeFormat(cleanTimeFormat);
        settings.setUpdatedAt(LocalDateTime.now());
        settings = regionalSettingsRepository.save(settings);

        // Sync with organization table defaults
        org.setCurrency(cleanCurrency.length() <= 3 ? cleanCurrency : cleanCurrency.substring(0, 3));
        org.setTimezone(cleanTimezone.length() <= 80 ? cleanTimezone : cleanTimezone.substring(0, 80));
        org.setUpdatedAt(LocalDateTime.now());
        organizationRepository.save(org);

        // Sync with localization_settings table
        LocalizationSettings locSettings = localizationSettingsRepository.findByOrganization_Id(organizationId)
                .orElseGet(() -> LocalizationSettings.builder().organization(org).build());
        locSettings.setDefaultCurrency(cleanCurrency);
        locSettings.setTimezone(cleanTimezone);
        locSettings.setDateFormat(cleanDateFormat);
        locSettings.setTimeFormat(cleanTimeFormat);
        locSettings.setUpdatedAt(LocalDateTime.now());
        localizationSettingsRepository.save(locSettings);

        log.info("Regional settings updated | orgId={} | currency={} | tz={} | fyStart={}",
                organizationId, cleanCurrency, cleanTimezone, cleanFiscalYear);

        return mapToRegionalResponse(settings);
    }

    // =========================================================================
    // 4. Security & Compliance
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public OrganizationSecuritySettingsResponse getSecuritySettings(UUID organizationId, UUID actorUserId) {
        assertReadPermission(organizationId, actorUserId);

        return securitySettingsRepository.findByOrganization_Id(organizationId)
                .map(this::mapToSecurityResponse)
                .orElseGet(OrganizationSecuritySettingsResponse::defaultSettings);
    }

    @Override
    @Transactional
    public OrganizationSecuritySettingsResponse updateSecuritySettings(
            UUID organizationId, UUID actorUserId, UpdateSecuritySettingsRequest request) {

        assertWritePermission(organizationId, actorUserId);
        Organization org = findOrganizationOrThrow(organizationId);

        Boolean enforce2FA = request != null ? request.resolveEnforce2FA() : null;
        Integer sessionTimeout = request != null ? request.resolveSessionTimeoutMinutes() : null;

        if (enforce2FA == null) {
            enforce2FA = false;
        }
        if (sessionTimeout == null || sessionTimeout <= 0) {
            sessionTimeout = 60;
        }

        OrganizationSecuritySettings settings = securitySettingsRepository.findByOrganization_Id(organizationId)
                .orElseGet(() -> OrganizationSecuritySettings.builder().organization(org).build());

        settings.setEnforce2FA(enforce2FA);
        settings.setSessionTimeoutMinutes(sessionTimeout);
        settings.setUpdatedAt(LocalDateTime.now());
        settings = securitySettingsRepository.save(settings);

        log.info("Security settings updated | orgId={} | enforce2FA={} | timeoutMinutes={}",
                organizationId, enforce2FA, sessionTimeout);

        return mapToSecurityResponse(settings);
    }

    // =========================================================================
    // 5. Multi-Company Management
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public OrganizationCompanyListResponse getCompanies(UUID organizationId, UUID actorUserId) {
        assertReadPermission(organizationId, actorUserId);

        List<Company> companies = companyRepository.findByOrganization_Id(organizationId);
        List<OrganizationCompanyResponse> dtoList = companies.stream()
                .map(this::mapToCompanyResponse)
                .toList();

        long activeCount = companies.stream().filter(c -> Boolean.TRUE.equals(c.getActive())).count();

        return OrganizationCompanyListResponse.builder()
                .companies(dtoList)
                .totalCount(companies.size())
                .activeCount((int) activeCount)
                .build();
    }

    @Override
    @Transactional
    public OrganizationCompanyResponse createCompany(
            UUID organizationId, UUID actorUserId, CreateOrganizationCompanyRequest rawRequest) {

        assertWritePermission(organizationId, actorUserId);
        Organization org = findOrganizationOrThrow(organizationId);
        CreateOrganizationCompanyRequest request = rawRequest != null ? rawRequest.resolve() : null;

        if (request == null || !StringUtils.hasText(request.getCompanyName())) {
            throw new BadRequestException("Company name is required");
        }

        // Verify Subscription limits
        Subscription subscription = subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(organizationId)
                .orElseThrow(() -> new BadRequestException("No subscription found for this organization"));

        if (subscription.getStatus() == SubscriptionStatus.EXPIRED ||
                subscription.getStatus() == SubscriptionStatus.CANCELLED ||
                subscription.getStatus() == SubscriptionStatus.SUSPENDED) {
            throw new BadRequestException("Subscription is not active (" + subscription.getStatus() + ")");
        }

        SubscriptionPlan plan = subscription.getPlan();
        if (plan != null && plan.getMaxCompanies() != null) {
            long currentActive = companyRepository.countByOrganization_IdAndActiveTrue(organizationId);
            if (currentActive >= plan.getMaxCompanies()) {
                throw new BadRequestException("Active company limit reached for current plan ("
                        + currentActive + "/" + plan.getMaxCompanies() + "). Upgrade required.");
            }
        }

        // Inherit regional defaults if baseCurrency omitted
        String currency = StringUtils.hasText(request.getBaseCurrency())
                ? request.getBaseCurrency().trim().toUpperCase(Locale.ROOT)
                : (org.getCurrency() != null ? org.getCurrency() : "INR");

        String companyCode = resolveCompanyCode(request.getCompanyCode());

        Company company = Company.builder()
                .organization(org)
                .companyCode(companyCode)
                .companyName(request.getCompanyName().trim())
                .legalName(StringUtils.hasText(request.getLegalName()) ? request.getLegalName().trim() : request.getCompanyName().trim())
                .companyType(request.getCompanyType())
                .gstin(request.getGstin())
                .pan(request.getPan())
                .email(request.getEmail())
                .phone(request.getPhone())
                .website(request.getWebsite())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .postalCode(request.getPostalCode())
                .baseCurrency(currency.length() <= 3 ? currency : currency.substring(0, 3))
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        final Company savedCompany = companyRepository.save(company);

        // Grant creator member access
        if (actorUserId != null) {
            organizationMemberRepository.findByOrganization_IdAndUser_Id(organizationId, actorUserId)
                    .ifPresent(member -> {
                        if (!memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(member.getId(), savedCompany.getId())) {
                            memberCompanyAccessRepository.save(MemberCompanyAccess.builder()
                                    .organizationMember(member)
                                    .organization(org)
                                    .company(savedCompany)
                                    .active(true)
                                    .build());
                        }
                    });
        }

        // Auto-provision CompanyModules for organization's enabled modules
        List<OrganizationModule> enabledOrgModules = organizationModuleRepository.findByOrganization_IdAndEnabledTrue(organizationId);
        for (OrganizationModule om : enabledOrgModules) {
            if (om.getModule() != null) {
                companyModuleRepository.save(CompanyModule.builder()
                        .company(savedCompany)
                        .module(om.getModule())
                        .active(true)
                        .build());
            }
        }

        log.info("Company created under organization | orgId={} | companyId={} | code={}",
                organizationId, company.getId(), company.getCompanyCode());

        return mapToCompanyResponse(company);
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationCompanyResponse getCompanyById(UUID organizationId, UUID companyId, UUID actorUserId) {
        assertReadPermission(organizationId, actorUserId);
        Company company = findCompanyUnderOrg(organizationId, companyId);
        return mapToCompanyResponse(company);
    }

    @Override
    @Transactional
    public OrganizationCompanyResponse updateCompany(
            UUID organizationId, UUID companyId, UUID actorUserId, UpdateOrganizationCompanyRequest rawRequest) {

        assertWritePermission(organizationId, actorUserId);
        Company company = findCompanyUnderOrg(organizationId, companyId);
        UpdateOrganizationCompanyRequest request = rawRequest != null ? rawRequest.resolve() : null;

        if (request != null) {
            if (StringUtils.hasText(request.getCompanyName())) company.setCompanyName(request.getCompanyName().trim());
            if (StringUtils.hasText(request.getLegalName())) company.setLegalName(request.getLegalName().trim());
            if (request.getCompanyType() != null) company.setCompanyType(request.getCompanyType());
            if (request.getGstin() != null) company.setGstin(request.getGstin());
            if (request.getPan() != null) company.setPan(request.getPan());
            if (request.getEmail() != null) company.setEmail(request.getEmail());
            if (request.getPhone() != null) company.setPhone(request.getPhone());
            if (request.getWebsite() != null) company.setWebsite(request.getWebsite());
            if (request.getAddressLine1() != null) company.setAddressLine1(request.getAddressLine1());
            if (request.getAddressLine2() != null) company.setAddressLine2(request.getAddressLine2());
            if (request.getCity() != null) company.setCity(request.getCity());
            if (request.getState() != null) company.setState(request.getState());
            if (request.getCountry() != null) company.setCountry(request.getCountry());
            if (request.getPostalCode() != null) company.setPostalCode(request.getPostalCode());
            if (StringUtils.hasText(request.getBaseCurrency())) {
                String c = request.getBaseCurrency().trim().toUpperCase(Locale.ROOT);
                company.setBaseCurrency(c.length() <= 3 ? c : c.substring(0, 3));
            }
            if (request.getActive() != null) {
                // If reactivating, verify plan limits
                if (Boolean.TRUE.equals(request.getActive()) && !Boolean.TRUE.equals(company.getActive())) {
                    assertPlanCompanyLimitNotExceeded(organizationId);
                }
                company.setActive(request.getActive());
            }
        }

        company.setUpdatedAt(LocalDateTime.now());
        company = companyRepository.save(company);

        log.info("Company updated | orgId={} | companyId={}", organizationId, companyId);
        return mapToCompanyResponse(company);
    }

    @Override
    @Transactional
    public void deleteCompany(UUID organizationId, UUID companyId, UUID actorUserId) {
        assertWritePermission(organizationId, actorUserId);
        Company company = findCompanyUnderOrg(organizationId, companyId);

        // Safe soft-deactivation to preserve dependent accounting and transactional records
        company.setActive(false);
        company.setUpdatedAt(LocalDateTime.now());
        companyRepository.save(company);

        log.info("Company deactivated/archived | orgId={} | companyId={}", organizationId, companyId);
    }

    // =========================================================================
    // 6. Subscription & Usage
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public OrganizationSubscriptionResponse getSubscription(UUID organizationId, UUID actorUserId) {
        assertReadPermission(organizationId, actorUserId);

        Subscription sub = subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(organizationId)
                .orElse(null);

        if (sub == null) {
            return OrganizationSubscriptionResponse.builder()
                    .planName("Standard Plan")
                    .planCode("30_DAY_FREE_TRIAL")
                    .status("TRIALING")
                    .trialPeriod(true)
                    .companyLimit(5)
                    .storageLimit("10 GB")
                    .price(BigDecimal.ZERO)
                    .currency("INR")
                    .build();
        }

        SubscriptionPlan plan = sub.getPlan();
        String planName = plan != null ? plan.getName() : "Standard Plan";
        Integer companyLimit = plan != null ? plan.getMaxCompanies() : 5;
        boolean isTrial = sub.getStatus() == SubscriptionStatus.TRIALING
                || (plan != null && Boolean.TRUE.equals(plan.getIsTrial()));

        return OrganizationSubscriptionResponse.builder()
                .planName(planName)
                .planCode(sub.getPlanCode() != null ? sub.getPlanCode() : "STANDARD")
                .status(sub.getStatus() != null ? sub.getStatus().name() : "ACTIVE")
                .trialPeriod(isTrial)
                .trialStartDate(sub.getTrialStartedAt())
                .trialEndDate(sub.getTrialEndsAt())
                .currentPeriodStart(sub.getCurrentPeriodStart())
                .currentPeriodEnd(sub.getCurrentPeriodEnd())
                .companyLimit(companyLimit != null ? companyLimit : 5)
                .storageLimit("10 GB")
                .price(sub.getPrice() != null ? sub.getPrice() : BigDecimal.ZERO)
                .currency(sub.getCurrency() != null ? sub.getCurrency() : "INR")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationSubscriptionUsageResponse getSubscriptionUsage(UUID organizationId, UUID actorUserId) {
        assertReadPermission(organizationId, actorUserId);

        long activeCompanies = companyRepository.countByOrganization_IdAndActiveTrue(organizationId);
        long totalCompanies = companyRepository.countByOrganization_Id(organizationId);
        long activeMembers = organizationMemberRepository.countByOrganization_IdAndMembershipStatus(
                organizationId, MembershipStatus.ACTIVE);

        Subscription sub = subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(organizationId).orElse(null);
        Integer limit = (sub != null && sub.getPlan() != null && sub.getPlan().getMaxCompanies() != null)
                ? sub.getPlan().getMaxCompanies()
                : 5;

        return OrganizationSubscriptionUsageResponse.builder()
                .activeCompanies(activeCompanies)
                .totalCompanies(totalCompanies)
                .companyLimit(limit)
                .storageUsed("120 MB")
                .storageLimit("10 GB")
                .activeMembers(activeMembers)
                .build();
    }

    // =========================================================================
    // 7. Entitled Modules
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public OrganizationModulesResponse getModules(UUID organizationId, UUID actorUserId) {
        assertReadPermission(organizationId, actorUserId);

        List<OrganizationModule> orgModules = organizationModuleRepository.findByOrganization_Id(organizationId);
        Map<String, Boolean> enabledMap = new HashMap<>();

        for (OrganizationModule om : orgModules) {
            if (om.getModule() != null) {
                enabledMap.put(om.getModule().getName().toUpperCase(Locale.ROOT), om.getEnabled());
            }
        }

        List<OrganizationModuleItemResponse> items = new ArrayList<>();
        int enabledCount = 0;

        for (Map.Entry<String, String> entry : CANONICAL_MODULE_NAMES.entrySet()) {
            String key = entry.getKey();
            String name = entry.getValue();
            // Default to true if not explicitly disabled
            boolean isEnabled = enabledMap.getOrDefault(key, true);
            if (isEnabled) enabledCount++;

            items.add(OrganizationModuleItemResponse.builder()
                    .key(key)
                    .name(name)
                    .enabled(isEnabled)
                    .build());
        }

        return OrganizationModulesResponse.builder()
                .modules(items)
                .enabledCount(enabledCount)
                .totalCount(items.size())
                .build();
    }

    @Override
    @Transactional
    public OrganizationModulesResponse updateModules(
            UUID organizationId, UUID actorUserId, UpdateOrganizationModulesRequest rawRequest) {

        assertWritePermission(organizationId, actorUserId);
        Organization org = findOrganizationOrThrow(organizationId);
        UpdateOrganizationModulesRequest request = rawRequest != null ? rawRequest : new UpdateOrganizationModulesRequest();

        List<UpdateOrganizationModulesRequest.ModuleAssignmentDto> list = request.resolveModules();
        if (list != null && !list.isEmpty()) {
            for (UpdateOrganizationModulesRequest.ModuleAssignmentDto dto : list) {
                String key = dto.resolveKey();
                if (key != null) {
                    applyOrgModuleStatus(org, key, dto.getEnabled() != null ? dto.getEnabled() : true);
                }
            }
        } else {
            List<String> enabledKeys = request.resolveModuleKeys();
            if (enabledKeys != null) {
                Set<String> cleanKeys = enabledKeys.stream()
                        .map(k -> k.trim().toUpperCase(Locale.ROOT))
                        .collect(Collectors.toSet());
                for (String key : CANONICAL_MODULE_NAMES.keySet()) {
                    applyOrgModuleStatus(org, key, cleanKeys.contains(key));
                }
            }
        }

        log.info("Organization modules updated | orgId={}", organizationId);
        return getModules(organizationId, actorUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyModulesResponse getCompanyModules(UUID organizationId, UUID companyId, UUID actorUserId) {
        assertReadPermission(organizationId, actorUserId);
        Company company = findCompanyUnderOrg(organizationId, companyId);

        List<CompanyModule> companyModules = companyModuleRepository.findAllByCompany_Id(companyId);
        Map<String, Boolean> activeMap = new HashMap<>();

        for (CompanyModule cm : companyModules) {
            if (cm.getModule() != null) {
                activeMap.put(cm.getModule().getName().toUpperCase(Locale.ROOT), cm.getActive());
            }
        }

        // Get organization enabled modules to know what can be assigned
        OrganizationModulesResponse orgModules = getModules(organizationId, actorUserId);
        List<OrganizationModuleItemResponse> items = new ArrayList<>();
        int enabledCount = 0;

        for (OrganizationModuleItemResponse om : orgModules.getModules()) {
            if (Boolean.TRUE.equals(om.getEnabled())) {
                boolean activeForCompany = activeMap.getOrDefault(om.getKey(), true);
                if (activeForCompany) enabledCount++;

                items.add(OrganizationModuleItemResponse.builder()
                        .key(om.getKey())
                        .name(om.getName())
                        .enabled(activeForCompany)
                        .build());
            }
        }

        return CompanyModulesResponse.builder()
                .companyId(company.getId())
                .companyName(company.getCompanyName())
                .modules(items)
                .enabledCount(enabledCount)
                .build();
    }

    @Override
    @Transactional
    public CompanyModulesResponse updateCompanyModules(
            UUID organizationId, UUID companyId, UUID actorUserId, UpdateCompanyModulesRequest rawRequest) {

        assertWritePermission(organizationId, actorUserId);
        Company company = findCompanyUnderOrg(organizationId, companyId);
        UpdateCompanyModulesRequest request = rawRequest != null ? rawRequest : new UpdateCompanyModulesRequest();

        List<UpdateCompanyModulesRequest.ModuleAssignmentDto> list = request.resolveModules();
        if (list != null && !list.isEmpty()) {
            for (UpdateCompanyModulesRequest.ModuleAssignmentDto dto : list) {
                String key = dto.resolveKey();
                if (key != null) {
                    assertOrgEntitledToModule(organizationId, key);
                    applyCompanyModuleStatus(company, key, dto.getEnabled() != null ? dto.getEnabled() : true);
                }
            }
        } else {
            List<String> enabledKeys = request.resolveModuleKeys();
            if (enabledKeys != null) {
                Set<String> cleanKeys = enabledKeys.stream()
                        .map(k -> k.trim().toUpperCase(Locale.ROOT))
                        .collect(Collectors.toSet());
                for (String key : CANONICAL_MODULE_NAMES.keySet()) {
                    boolean enabled = cleanKeys.contains(key);
                    if (enabled) {
                        assertOrgEntitledToModule(organizationId, key);
                    }
                    applyCompanyModuleStatus(company, key, enabled);
                }
            }
        }

        log.info("Company modules updated | orgId={} | companyId={}", organizationId, companyId);
        return getCompanyModules(organizationId, companyId, actorUserId);
    }

    // =========================================================================
    // Helper & Validation Methods
    // =========================================================================

    private Organization findOrganizationOrThrow(UUID organizationId) {
        if (organizationId == null) {
            throw new ForbiddenException("Organization context required");
        }
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
    }

    private Company findCompanyUnderOrg(UUID organizationId, UUID companyId) {
        if (companyId == null) {
            throw new BadRequestException("Company ID is required");
        }
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        if (company.getOrganization() == null || !company.getOrganization().getId().equals(organizationId)) {
            throw new ForbiddenException("Access denied: Company does not belong to your organization");
        }
        return company;
    }

        private void assertReadPermission(UUID targetOrgId, UUID actorUserId) {
        if (PlatformSecurityUtil.isElevatedAdmin()) {
            return;
        }
        if (targetOrgId == null) {
            throw new ForbiddenException("Organization context required");
        }
        if (actorUserId == null) {
            return;
        }
        boolean hasAccess = organizationMemberRepository
                .findByOrganization_IdAndUser_IdAndMembershipStatus(targetOrgId, actorUserId, MembershipStatus.ACTIVE)
                .isPresent();
        if (!hasAccess) {
            throw new ForbiddenException("Access denied: You do not belong to this organization");
        }
    }

    private void assertWritePermission(UUID targetOrgId, UUID actorUserId) {
        if (PlatformSecurityUtil.isElevatedAdmin()) {
            return;
        }
        if (targetOrgId == null) {
            throw new ForbiddenException("Organization context required");
        }
        if (actorUserId == null) {
            throw new ForbiddenException("Authenticated user context required for write operations");
        }
        boolean isOwnerOrAdmin = organizationMemberRepository
                .findByOrganization_IdAndUser_IdAndMembershipStatus(targetOrgId, actorUserId, MembershipStatus.ACTIVE)
                .map(member -> member.getMemberType() == MemberType.OWNER || member.getMemberType() == MemberType.ADMIN)
                .orElse(false);
        if (!isOwnerOrAdmin) {
            throw new ForbiddenException("Permission denied: Modifying settings requires OWNER or ADMIN role");
        }
    }

    private void assertPlanCompanyLimitNotExceeded(UUID organizationId) {
        Subscription subscription = subscriptionRepository
                .findTopByOrganization_IdOrderByCreatedAtDesc(organizationId)
                .orElse(null);
        if (subscription != null && subscription.getPlan() != null && subscription.getPlan().getMaxCompanies() != null) {
            long currentActive = companyRepository.countByOrganization_IdAndActiveTrue(organizationId);
            if (currentActive >= subscription.getPlan().getMaxCompanies()) {
                throw new BadRequestException("Cannot activate company: maximum companies limit ("
                        + subscription.getPlan().getMaxCompanies() + ") reached for plan");
            }
        }
    }

    private void assertOrgEntitledToModule(UUID organizationId, String moduleKey) {
        String cleanKey = moduleKey.trim().toUpperCase(Locale.ROOT);
        Optional<OrganizationModule> om = organizationModuleRepository
                .findByOrganization_IdAndModule_NameIgnoreCase(organizationId, cleanKey);
        if (om.isPresent() && !Boolean.TRUE.equals(om.get().getEnabled())) {
            throw new BadRequestException("Organization is not entitled to module: " + moduleKey);
        }
    }

    private void applyOrgModuleStatus(final Organization org, String moduleKey, boolean enabled) {
        String cleanKey = moduleKey.trim().toUpperCase(Locale.ROOT);
        Module module = moduleRepository.findByNameIgnoreCase(cleanKey).orElse(null);
        if (module == null) {
            module = moduleRepository.save(Module.builder()
                    .name(cleanKey)
                    .clientId(UUID.randomUUID())
                    .clientSecret(UUID.randomUUID().toString())
                    .moduleStatus(true)
                    .build());
        }

        final Module finalModule = module;
        OrganizationModule om = organizationModuleRepository
                .findByOrganization_IdAndModule_Id(org.getId(), finalModule.getId())
                .orElseGet(() -> OrganizationModule.builder().organization(org).module(finalModule).build());
        om.setEnabled(enabled);
        organizationModuleRepository.save(om);
    }

    private void applyCompanyModuleStatus(final Company company, String moduleKey, boolean active) {
        String cleanKey = moduleKey.trim().toUpperCase(Locale.ROOT);
        Module module = moduleRepository.findByNameIgnoreCase(cleanKey).orElse(null);
        if (module == null) return;

        CompanyModule cm = companyModuleRepository
                .findByCompany_IdAndModule_Id(company.getId(), module.getId())
                .orElseGet(() -> CompanyModule.builder().company(company).module(module).build());
        cm.setActive(active);
        companyModuleRepository.save(cm);
    }

    private String resolveCompanyCode(String requestedCode) {
        if (StringUtils.hasText(requestedCode)) {
            String clean = requestedCode.trim().toUpperCase(Locale.ROOT);
            if (companyRepository.existsByCompanyCode(clean)) {
                throw new DuplicateResourceException("Company code already exists: " + clean);
            }
            return clean;
        }
        return companyRepository.findLastNumericCompanyCode()
                .map(c -> {
                    try {
                        return String.format("%06d", Integer.parseInt(c.getCompanyCode()) + 1);
                    } catch (NumberFormatException e) {
                        return "000001";
                    }
                })
                .orElse("000001");
    }

    private String resolvePrimaryEmail(Organization org) {
        if (StringUtils.hasText(org.getPrimaryEmail())) {
            return org.getPrimaryEmail();
        }
        Optional<OrganizationSettings> settings = organizationSettingsRepository.findByOrganization_Id(org.getId());
        if (settings.isPresent() && StringUtils.hasText(settings.get().getContactEmail())) {
            return settings.get().getContactEmail();
        }
        return organizationMemberRepository.findFirstByOrganization_IdAndMembershipStatus(org.getId(), MembershipStatus.ACTIVE)
                .map(m -> m.getUser().getEmail())
                .orElse("admin@" + (org.getOrganizationCode() != null ? org.getOrganizationCode().toLowerCase(Locale.ROOT) : "org") + ".com");
    }

    private OrganizationRegionalSettingsResponse resolveDefaultRegionalSettings(Organization org) {
        Optional<LocalizationSettings> loc = localizationSettingsRepository.findByOrganization_Id(org.getId());
        if (loc.isPresent()) {
            return OrganizationRegionalSettingsResponse.builder()
                    .currency(loc.get().getDefaultCurrency())
                    .timezone(loc.get().getTimezone())
                    .fiscalYearStartMonth("April")
                    .dateFormat(loc.get().getDateFormat())
                    .timeFormat(loc.get().getTimeFormat())
                    .build();
        }
        return OrganizationRegionalSettingsResponse.defaultSettings();
    }

    private OrganizationRegionalSettingsResponse mapToRegionalResponse(OrganizationRegionalSettings s) {
        return OrganizationRegionalSettingsResponse.builder()
                .currency(s.getCurrency())
                .timezone(s.getTimezone())
                .fiscalYearStartMonth(s.getFiscalYearStartMonth())
                .dateFormat(s.getDateFormat())
                .timeFormat(s.getTimeFormat())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private OrganizationSecuritySettingsResponse mapToSecurityResponse(OrganizationSecuritySettings s) {
        return OrganizationSecuritySettingsResponse.builder()
                .enforce2FA(Boolean.TRUE.equals(s.getEnforce2FA()))
                .sessionTimeoutMinutes(s.getSessionTimeoutMinutes() != null ? s.getSessionTimeoutMinutes() : 60)
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private OrganizationCompanyResponse mapToCompanyResponse(Company c) {
        return OrganizationCompanyResponse.builder()
                .id(c.getId())
                .companyCode(c.getCompanyCode())
                .companyName(c.getCompanyName())
                .legalName(c.getLegalName())
                .companyType(c.getCompanyType())
                .active(Boolean.TRUE.equals(c.getActive()))
                .baseCurrency(c.getBaseCurrency())
                .email(c.getEmail())
                .phone(c.getPhone())
                .city(c.getCity())
                .state(c.getState())
                .country(c.getCountry())
                .gstin(c.getGstin())
                .pan(c.getPan())
                .logoUrl(c.getLogoUrl())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private void validateCurrency(String currency) {
        if (!StringUtils.hasText(currency)) throw new BadRequestException("Currency cannot be blank");
        String c = currency.trim();
        if (c.length() < 3 || c.length() > 10) {
            throw new BadRequestException("Currency must be a valid 3-letter currency code (e.g. INR, USD, EUR)");
        }
    }

    private void validateTimezone(String timezone) {
        if (!StringUtils.hasText(timezone)) throw new BadRequestException("Timezone cannot be blank");
        String tz = timezone.trim();
        if (COMMON_TIMEZONES.contains(tz)) return;
        try {
            ZoneId.of(tz);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid timezone: " + timezone);
        }
    }

    private void validateFiscalYear(String month) {
        if (!StringUtils.hasText(month)) throw new BadRequestException("Fiscal year start month cannot be blank");
        if (!ALLOWED_MONTHS.contains(month.trim().toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Fiscal year start month must be January through December");
        }
    }

    private void validateDateFormat(String dateFormat) {
        if (!StringUtils.hasText(dateFormat)) throw new BadRequestException("Date format cannot be blank");
        if (!ALLOWED_DATE_FORMATS.contains(dateFormat.trim())) {
            throw new BadRequestException("Unsupported date format: " + dateFormat);
        }
    }

    private void validateTimeFormat(String timeFormat) {
        if (!StringUtils.hasText(timeFormat)) throw new BadRequestException("Time format cannot be blank");
        if (!ALLOWED_TIME_FORMATS.contains(timeFormat.trim().toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Time format must be '12h' or '24h'");
        }
    }

    private String normalizeMonth(String m) {
        if (!StringUtils.hasText(m)) return "April";
        String lower = m.trim().toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
