package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.CompanyRequest;
import com.erp.auth_service.dto.request.OrganizationSignupRequest;
import com.erp.auth_service.dto.response.OrganizationLookupResponse;
import com.erp.auth_service.dto.response.OrganizationSignupResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.service.OrganizationService;
import com.erp.auth_service.utility.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationServiceImpl implements OrganizationService {
        private final OrganizationRepository organizationRepository;
        private final CompanyRepository companyRepository;
        private final UserRepository userRepository;
        private final OrganizationMemberRepository memberRepository;
        private final MemberCompanyAccessRepository accessRepository;
        private final SubscriptionRepository subscriptionRepository;
        private final RoleRepository roleRepository;
        private final UserRoleRepository userRoleRepository;
        private final ModuleRepository moduleRepository;
        private final CompanyModuleRepository companyModuleRepository;
        private final UserPortalAccessRepository userPortalAccessRepository;
        private final OrganizationModuleRepository organizationModuleRepository;
        private final PasswordEncoder passwordEncoder;
        private final com.erp.auth_service.service.PermissionService permissionService;
        private final EmailService emailService;
        private final SubscriptionPlanRepository subscriptionPlanRepository;
        private final SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;
        private final CompanySubscriptionRepository companySubscriptionRepository;

        @org.springframework.beans.factory.annotation.Autowired(required = false)
        private com.erp.auth_service.client.WorkflowProvisioningClient workflowProvisioningClient;

        @Value("${api.frontend}")
        private String frontendBaseUrl;

        @Value("${sso.trial-days:30}")
        private int trialDays;

        @Value("${sso.default-plan-code:30_DAY_FREE_TRIAL}")
        private String defaultPlanCode = "30_DAY_FREE_TRIAL";

        @Override
        @Transactional
        public OrganizationSignupResponse signup(OrganizationSignupRequest request) {
                String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
                if (userRepository.existsByEmailIgnoreCase(email)) {
                        throw new BadRequestException("Email already exists");
                }

                CompanyRequest companyRequest = request.getCompany();
                if (companyRequest.getCompanyCode() == null || companyRequest.getCompanyCode().isBlank()) {
                        throw new BadRequestException("Company code is required");
                }
                if (companyRepository.existsByCompanyCode(companyRequest.getCompanyCode().trim())) {
                        throw new BadRequestException("Company code already exists");
                }

                Organization organization = Organization.builder()
                                .organizationCode(uniqueCode(request.getOrganizationName()))
                                .legalName(request.getOrganizationName().trim())
                                .displayName(request.getOrganizationName().trim())
                                .timezone("UTC")
                                .currency(companyRequest.getBaseCurrency().trim().toUpperCase(Locale.ROOT))
                                .build();
                organization = organizationRepository.save(organization);

                Company company = Company.builder()
                                .companyCode(companyRequest.getCompanyCode().trim())
                                .companyName(companyRequest.getCompanyName().trim())
                                .legalName(companyRequest.getLegalName())
                                .companyType(companyRequest.getCompanyType())
                                .gstin(companyRequest.getGstin())
                                .pan(companyRequest.getPan())
                                .email(companyRequest.getEmail())
                                .phone(companyRequest.getPhone())
                                .website(companyRequest.getWebsite())
                                .addressLine1(companyRequest.getAddressLine1())
                                .addressLine2(companyRequest.getAddressLine2())
                                .city(companyRequest.getCity())
                                .state(companyRequest.getState())
                                .country(companyRequest.getCountry())
                                .baseCurrency(companyRequest.getBaseCurrency().trim().toUpperCase(Locale.ROOT))
                                .postalCode(companyRequest.getPostalCode())
                                .active(true)
                                .organization(organization)
                                .build();
                company = companyRepository.save(company);

                User user = User.builder()
                                .company(company)
                                .username(email)
                                .email(email)
                                .fullName(request.getFullName().trim())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .accountStatus(AccountStatus.ACTIVE)
                                .emailStatus(Status.VERIFIED)
                                .failedLoginCount(0)
                                .build();
                user = userRepository.save(user);

                User savedUser = user;
                Company savedCompany = company;
                Organization savedOrganization = organization;

                // Auto-provision Organization-level default workflows from Platform default
                // templates (idempotent)
                if (workflowProvisioningClient != null) {
                        try {
                                workflowProvisioningClient.provisionOrganizationWorkflows(savedOrganization.getId(),
                                                null);
                        } catch (Exception wfEx) {
                                log.warn("Non-blocking failure provisioning platform default workflows for org {}: {}",
                                                savedOrganization.getId(), wfEx.getMessage());
                        }
                }

                // 1. Resolve configured default subscription plan from persistent storage
                // (fail-fast if missing)
                String planCodeToResolve = (defaultPlanCode != null && !defaultPlanCode.isBlank())
                                ? defaultPlanCode.trim()
                                : "30_DAY_FREE_TRIAL";

                SubscriptionPlan trialPlan = subscriptionPlanRepository
                                .findByCodeIgnoreCaseAndActiveTrue(planCodeToResolve)
                                .or(() -> subscriptionPlanRepository.findByCodeIgnoreCase(planCodeToResolve))
                                .or(() -> subscriptionPlanRepository.findFirstByIsTrialTrueAndActiveTrue())
                                .or(() -> subscriptionPlanRepository.findByActiveTrue().stream().findFirst())
                                .orElseThrow(() -> new IllegalStateException(
                                                "Default subscription plan not found: " + planCodeToResolve));

                if (trialPlan.getId() == null) {
                        throw new IllegalStateException(
                                        "Resolved default subscription plan has no persistent identifier");
                }

                int effectiveTrialDays = (trialPlan.getDurationDays() != null && trialPlan.getDurationDays() > 0)
                                ? trialPlan.getDurationDays()
                                : trialDays;

                LocalDateTime startedAt = LocalDateTime.now();
                LocalDateTime trialEndsAt = startedAt.plusDays(effectiveTrialDays);

                // 2. Create company_subscription for primary company using the persistent plan
                // record
                companySubscriptionRepository.save(CompanySubscription.builder()
                                .company(savedCompany)
                                .plan(trialPlan)
                                .startAt(startedAt)
                                .endAt(trialEndsAt)
                                .status(CompanySubscriptionStatus.TRIALING)
                                .autoRenew(false)
                                .build());

                // 3. Read modules assigned to that plan from database (NO HARDCODING)
                List<Module> provisionedModules = new java.util.ArrayList<>();
                List<SubscriptionPlanModule> planModules = subscriptionPlanModuleRepository
                                .findByPlan_IdAndActiveTrue(trialPlan.getId());
                for (SubscriptionPlanModule spm : planModules) {
                        Module mod = spm.getModule();
                        if (mod != null && Boolean.TRUE.equals(mod.getModuleStatus())
                                        && !"SYSTEM_ADMIN".equalsIgnoreCase(mod.getName())) {
                                provisionedModules.add(mod);
                        }
                }
                if (provisionedModules.isEmpty()) {
                        // Fallback only if no specific modules have been mapped to the plan yet
                        provisionedModules = moduleRepository.findByModuleStatus(true).stream()
                                        .filter(m -> !"SYSTEM_ADMIN".equalsIgnoreCase(m.getName()))
                                        .toList();
                }

                // 4. Provision company_module and user_portal_access for only the plan modules
                for (Module module : provisionedModules) {
                        CompanyModule companyModule = companyModuleRepository.save(CompanyModule.builder()
                                        .company(savedCompany)
                                        .module(module)
                                        .active(true)
                                        .build());
                        userPortalAccessRepository.save(UserPortalAccess.builder()
                                        .user(savedUser)
                                        .companyModule(companyModule)
                                        .status(true)
                                        .build());
                        organizationModuleRepository.save(OrganizationModule.builder()
                                        .organization(savedOrganization).module(module).enabled(true).build());
                }

                Role ownerRole = roleRepository.findByCompany_IdAndNameIgnoreCase(savedCompany.getId(), "OWNER")
                                .orElseGet(() -> roleRepository.save(Role.builder().company(savedCompany).name("OWNER")
                                                .status(true).build()));
                userRoleRepository.save(UserRole.builder().user(user).role(ownerRole).build());

                // Auto-provision Company-level default workflow for the initial company
                // (idempotent)
                if (workflowProvisioningClient != null) {
                        try {
                                Map<String, UUID> roleMap = Map.of("OWNER", ownerRole.getId());
                                workflowProvisioningClient.provisionCompanyWorkflow(
                                                savedOrganization.getId(),
                                                savedCompany.getId(),
                                                roleMap,
                                                null);
                        } catch (Exception compWfEx) {
                                log.warn("Non-blocking failure provisioning default workflow for initial company {}: {}",
                                                savedCompany.getId(), compWfEx.getMessage());
                        }
                }
                permissionService.assignOwnerRolePermissions(ownerRole,
                                provisionedModules.stream().map(Module::getName).toList(),
                                user.getId());

                OrganizationMember member = memberRepository.save(OrganizationMember.builder()
                                .organization(organization)
                                .user(user)
                                .memberType(MemberType.OWNER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build());
                accessRepository.save(MemberCompanyAccess.builder()
                                .organizationMember(member)
                                .organization(organization)
                                .company(company)
                                .active(true)
                                .build());

                String planVersionCode = (trialPlan.getPlanVersion() != null && !trialPlan.getPlanVersion().isBlank())
                                ? trialPlan.getPlanVersion()
                                : "v1";

                Subscription subscription = subscriptionRepository.save(Subscription.builder()
                                .organization(organization)
                                .plan(trialPlan)
                                .planCode(trialPlan.getCode())
                                .planVersionCode(planVersionCode)
                                .price(trialPlan.getPrice())
                                .priceAtSubscription(trialPlan.getPrice())
                                .currency(trialPlan.getCurrency() != null ? trialPlan.getCurrency() : "INR")
                                .status(SubscriptionStatus.TRIALING)
                                .accessMode(AccessMode.FULL)
                                .trialStartedAt(startedAt)
                                .trialEndsAt(trialEndsAt)
                                .currentPeriodStart(startedAt)
                                .currentPeriodEnd(trialEndsAt)
                                .build());

                String loginUrl = loginUrl(organization.getOrganizationCode());

                // Fire-and-forget: send confirmation email to the owner.
                // @Async ensures this runs on a separate thread — email failure
                // will NOT roll back or block the account-creation response.
                try {
                        emailService.sendAccountCreationEmail(
                                        email,
                                        organization.getDisplayName(),
                                        organization.getOrganizationCode(),
                                        company.getCompanyName(),
                                        company.getCompanyCode(),
                                        subscription.getTrialEndsAt(),
                                        loginUrl);
                } catch (Exception emailEx) {
                        // Idempotency: if a duplicate call somehow reaches here, it is
                        // benign — we log and continue.
                        log.warn("Could not dispatch account-creation email for org [{}]: {}",
                                        organization.getOrganizationCode(), emailEx.getMessage());
                }

                return OrganizationSignupResponse.builder()
                                .user(OrganizationSignupResponse.UserIdentity.builder().id(user.getId()).build())
                                .organization(OrganizationSignupResponse.OrganizationIdentity.builder()
                                                .id(organization.getId()).name(organization.getDisplayName())
                                                .code(organization.getOrganizationCode()).build())
                                .company(OrganizationSignupResponse.CompanyIdentity.builder()
                                                .id(company.getId()).name(company.getCompanyName())
                                                .code(company.getCompanyCode()).build())
                                .subscription(OrganizationSignupResponse.SubscriptionIdentity.builder()
                                                .status(subscription.getStatus().name())
                                                .accessMode(subscription.getAccessMode().name())
                                                .trialEndsAt(subscription.getTrialEndsAt()).build())
                                .login(OrganizationSignupResponse.LoginIdentity.builder()
                                                .url(loginUrl).build())
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        public OrganizationLookupResponse lookup(String organizationCode) {
                Organization organization = organizationRepository
                                .findByOrganizationCodeIgnoreCaseAndStatusNot(organizationCode.trim(),
                                                OrganizationStatus.DELETED)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
                return OrganizationLookupResponse.builder()
                                .name(organization.getDisplayName())
                                .code(organization.getOrganizationCode())
                                .loginUrl(loginUrl(organization.getOrganizationCode()))
                                .build();
        }

        private String uniqueCode(String name) {
                String base = name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
                if (base.isBlank())
                        base = "organization";
                String candidate = base;
                int suffix = 2;
                while (organizationRepository.existsByOrganizationCodeIgnoreCase(candidate)) {
                        candidate = base + "-" + suffix++;
                }
                return candidate;
        }

        private String loginUrl(String code) {
                return frontendBaseUrl.replaceAll("/$", "") + "/o/" + code + "/login";
        }
}