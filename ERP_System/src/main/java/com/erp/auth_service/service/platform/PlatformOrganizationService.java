package com.erp.auth_service.service.platform;

import com.erp.auth_service.dto.platform.*;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.OrganizationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class PlatformOrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final MemberCompanyAccessRepository memberCompanyAccessRepository;
    private final CompanyRepository companyRepository;
    private final CompanyModuleRepository companyModuleRepository;
    private final OrganizationModuleRepository organizationModuleRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public Page<PlatformOrganizationSummaryResponse> listOrganizations(
            Pageable pageable, String search, OrganizationStatus status, AccessMode accessMode) {

        List<Organization> all = organizationRepository.findAll();

        List<Organization> filtered = all.stream()
                .filter(o -> {
                    if (search != null && !search.isBlank()) {
                        String s = search.trim().toLowerCase();
                        boolean matchName = o.getDisplayName() != null && o.getDisplayName().toLowerCase().contains(s);
                        boolean matchCode = o.getOrganizationCode() != null && o.getOrganizationCode().toLowerCase().contains(s);
                        if (!matchName && !matchCode) return false;
                    }
                    if (status != null && o.getStatus() != status) {
                        return false;
                    }
                    if (accessMode != null && o.getAccessMode() != accessMode) {
                        return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(Organization::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Organization> pagedContent = (start <= end && start < filtered.size()) ? filtered.subList(start, end) : List.of();

        List<PlatformOrganizationSummaryResponse> responses = pagedContent.stream()
                .map(this::toSummaryResponse)
                .toList();

        return new PageImpl<>(responses, pageable, filtered.size());
    }

    @Transactional(readOnly = true)
    public PlatformOrganizationDetailResponse getOrganizationDetail(UUID organizationId) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found: " + organizationId));

        long userCount = organizationMemberRepository.countByOrganization_Id(organizationId);
        long companyCount = companyRepository.countByOrganization_Id(organizationId);

        Subscription sub = subscriptionRepository.findEffectiveByOrganizationId(organizationId).orElse(null);

        List<String> enabledModules = organizationModuleRepository.findByOrganization_IdAndEnabledTrue(organizationId).stream()
                .map(om -> om.getModule() != null ? om.getModule().getName() : null)
                .filter(Objects::nonNull)
                .toList();

        List<PlatformCompanySummaryResponse> companies = getOrganizationCompanies(organizationId);

        return PlatformOrganizationDetailResponse.builder()
                .id(org.getId())
                .name(org.getDisplayName())
                .code(org.getOrganizationCode())
                .status(org.getStatus())
                .accessMode(org.getAccessMode())
                .planName(sub != null && sub.getPlan() != null ? sub.getPlan().getName() : null)
                .subscriptionStatus(sub != null ? sub.getStatus() : null)
                .trialEndsAt(sub != null ? sub.getTrialEndsAt() : null)
                .userCount(userCount)
                .companyCount(companyCount)
                .enabledModules(enabledModules)
                .companies(companies)
                .createdAt(org.getCreatedAt())
                .updatedAt(org.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<PlatformMemberSummaryResponse> getOrganizationMembers(UUID organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new ResourceNotFoundException("Organization not found: " + organizationId);
        }

        List<OrganizationMember> members = organizationMemberRepository.findByOrganization_Id(organizationId);
        return members.stream().map(m -> {
            List<String> authorizedCompanies = memberCompanyAccessRepository.findByOrganizationMember_IdAndActiveTrue(m.getId())
                    .stream()
                    .map(a -> a.getCompany() != null ? a.getCompany().getCompanyName() : null)
                    .filter(Objects::nonNull)
                    .toList();

            User user = m.getUser();
            return PlatformMemberSummaryResponse.builder()
                    .memberId(m.getId())
                    .userId(user != null ? user.getId() : null)
                    .email(user != null ? user.getEmail() : null)
                    .username(user != null ? user.getUsername() : null)
                    .fullName(user != null ? user.getFullName() : null)
                    .memberType(m.getMemberType())
                    .membershipStatus(m.getMembershipStatus())
                    .authorizedCompanies(authorizedCompanies)
                    .createdAt(m.getCreatedAt())
                    .build();
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<PlatformCompanySummaryResponse> getOrganizationCompanies(UUID organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new ResourceNotFoundException("Organization not found: " + organizationId);
        }

        List<Company> companies = companyRepository.findByOrganization_Id(organizationId);
        return companies.stream().map(c -> {
            List<String> activeModules = companyModuleRepository.findByCompany_IdAndActiveTrue(c.getId()).stream()
                    .map(cm -> cm.getModule() != null ? cm.getModule().getName() : null)
                    .filter(Objects::nonNull)
                    .toList();

            return PlatformCompanySummaryResponse.builder()
                    .id(c.getId())
                    .code(c.getCompanyCode())
                    .name(c.getCompanyName())
                    .active(Boolean.TRUE.equals(c.getActive()))
                    .modules(activeModules)
                    .createdAt(c.getCreatedAt())
                    .build();
        }).toList();
    }

    @Transactional(readOnly = true)
    public Subscription getOrganizationSubscription(UUID organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new ResourceNotFoundException("Organization not found: " + organizationId);
        }
        return subscriptionRepository.findEffectiveByOrganizationId(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("No subscription found for organization: " + organizationId));
    }

    @Transactional(readOnly = true)
    public List<Payment> getOrganizationPayments(UUID organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new ResourceNotFoundException("Organization not found: " + organizationId);
        }
        return paymentRepository.findBySubscription_Organization_IdOrderByCreatedAtDesc(organizationId);
    }

    @Transactional(readOnly = true)
    public List<Invoice> getOrganizationInvoices(UUID organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new ResourceNotFoundException("Organization not found: " + organizationId);
        }
        return invoiceRepository.findBySubscription_Organization_IdOrderByCreatedAtDesc(organizationId);
    }

    private PlatformOrganizationSummaryResponse toSummaryResponse(Organization org) {
        long userCount = organizationMemberRepository.countByOrganization_Id(org.getId());
        long companyCount = companyRepository.countByOrganization_Id(org.getId());
        Subscription sub = subscriptionRepository.findEffectiveByOrganizationId(org.getId()).orElse(null);

        return PlatformOrganizationSummaryResponse.builder()
                .id(org.getId())
                .name(org.getDisplayName())
                .code(org.getOrganizationCode())
                .status(org.getStatus())
                .accessMode(org.getAccessMode())
                .planName(sub != null && sub.getPlan() != null ? sub.getPlan().getName() : null)
                .subscriptionStatus(sub != null ? sub.getStatus() : null)
                .trialEndsAt(sub != null ? sub.getTrialEndsAt() : null)
                .userCount(userCount)
                .companyCount(companyCount)
                .createdAt(org.getCreatedAt())
                .build();
    }
}
