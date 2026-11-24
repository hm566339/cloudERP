package com.erp.crm.modules.lead.service.serviceImpl;

import com.erp.crm.common.exception.ConflictException;
import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.util.PhoneUtils;
import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.account.entity.CrmAccount;
import com.erp.crm.modules.account.entity.CrmContact;
import com.erp.crm.modules.account.enums.AccountTier;
import com.erp.crm.modules.account.enums.AccountType;
import com.erp.crm.modules.account.enums.BusinessType;
import com.erp.crm.modules.account.enums.DecisionMakerRole;
import com.erp.crm.modules.account.repository.CrmAccountRepository;
import com.erp.crm.modules.account.repository.CrmContactRepository;
import com.erp.crm.modules.lead.dto.request.*;
import com.erp.crm.modules.lead.dto.response.LeadConvertResponse;
import com.erp.crm.modules.lead.dto.response.LeadResponse;
import com.erp.crm.modules.lead.entity.*;
import com.erp.crm.modules.lead.enums.LeadRating;
import com.erp.crm.modules.lead.enums.LeadStage;
import com.erp.crm.modules.lead.mapper.LeadMapper;
import com.erp.crm.modules.lead.repository.*;
import com.erp.crm.modules.lead.service.CrmLeadService;
import com.erp.crm.modules.pipeline.entity.CrmOpportunity;
import com.erp.crm.modules.pipeline.entity.CrmSalesPipeline;
import com.erp.crm.modules.pipeline.enums.OpportunityDealStatus;
import com.erp.crm.modules.pipeline.enums.OpportunityDealType;
import com.erp.crm.modules.pipeline.repository.CrmOpportunityRepository;
import com.erp.crm.modules.pipeline.repository.CrmPipelineStageRepository;
import com.erp.crm.modules.pipeline.repository.CrmSalesPipelineRepository;
import com.erp.crm.modules.setting.entity.CrmLeadSource;
import com.erp.crm.modules.setting.entity.CrmLeadStatus;
import com.erp.crm.modules.setting.repository.CrmLeadSourceRepository;
import com.erp.crm.modules.setting.repository.CrmLeadStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrmLeadServiceImpl implements CrmLeadService {

    private final CrmLeadRepository leadRepository;
    private final CrmLeadProductInterestRepository productInterestRepository;
    private final CrmLeadTagMappingRepository tagMappingRepository;
    private final CrmLeadAssignmentHistoryRepository assignmentHistoryRepository;
    private final CrmLeadMergeHistoryRepository mergeHistoryRepository;
    private final CrmLeadScoreLogRepository scoreLogRepository;
    private final CrmLeadStatusRepository statusRepository;
    private final CrmLeadSourceRepository sourceRepository;
    private final CrmAccountRepository accountRepository;
    private final CrmContactRepository contactRepository;
    private final CrmOpportunityRepository opportunityRepository;
    private final CrmSalesPipelineRepository pipelineRepository;
    private final CrmPipelineStageRepository stageRepository;
    private final LeadMapper leadMapper;
    private final com.erp.crm.modules.automation.service.CrmAutomationEvaluatorService automationEvaluatorService;

    @Override
    public LeadResponse createLead(LeadCreateRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Creating Lead for companyId: {}, name: {}", companyId, request.getFirstName());

        String normalizedPhone = PhoneUtils.normalizePhone(request.getPhone());
        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;

        // Check deduplication
        if (normalizedPhone != null) {
            leadRepository.findByCompanyIdAndNormalizedPhoneAndIsDeletedFalse(companyId, normalizedPhone)
                    .ifPresent(existing -> log.warn("Possible duplicate lead with phone: {}", normalizedPhone));
        }

        CrmLead lead = leadMapper.toEntity(request);
        lead.setCompanyId(companyId);
        lead.setLeadCode(generateLeadCode());
        lead.setNormalizedPhone(normalizedPhone);
        lead.setNormalizedEmail(normalizedEmail);

        String displayName = (request.getFirstName() + " "
                + (request.getLastName() != null ? request.getLastName() : "")).trim();
        lead.setDisplayName(displayName);

        // Resolve or default lead status
        if (lead.getLeadStatusId() == null) {
            CrmLeadStatus defaultStatus = statusRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(companyId)
                    .orElse(null);
            if (defaultStatus != null) {
                lead.setLeadStatusId(defaultStatus.getId());
            }
        }

        // Calculate initial lead score
        int score = calculateLeadScore(lead,
                request.getInquiredProducts() != null && !request.getInquiredProducts().isEmpty());
        lead.setLeadScore(score);
        lead.setScoreGrade(score >= 70 ? LeadRating.HOT : (score >= 40 ? LeadRating.WARM : LeadRating.COLD));
        lead.setLeadStage(LeadStage.RAW);

        UUID currentUserId = TenantUtils.getCurrentUserId();
        if (lead.getOwnerUserId() == null) {
            lead.setOwnerUserId(currentUserId);
        }

        sanitizeLead(lead);

        CrmLead savedLead = leadRepository.save(lead);

        // Save product interests
        if (request.getInquiredProducts() != null) {
            for (LeadCreateRequest.ProductInterestRequest prod : request.getInquiredProducts()) {
                CrmLeadProductInterest interest = CrmLeadProductInterest.builder()
                        .leadId(savedLead.getId())
                        .productId(prod.getProductId())
                        .productName(truncate(prod.getProductName(), 255))
                        .productCode(truncate(prod.getProductCode(), 100))
                        .quantity(prod.getQuantity())
                        .uom(prod.getUom() != null ? truncate(prod.getUom(), 50) : "PCS")
                        .estimatedBudget(prod.getEstimatedBudget())
                        .specifications(prod.getSpecifications())
                        .build();
                interest.setCompanyId(companyId);
                productInterestRepository.save(interest);
            }
        }

        // Save tag mappings
        if (request.getTagIds() != null) {
            for (UUID tagId : request.getTagIds()) {
                CrmLeadTagMapping mapping = CrmLeadTagMapping.builder()
                        .companyId(companyId)
                        .leadId(savedLead.getId())
                        .tagId(tagId)
                        .build();
                tagMappingRepository.save(mapping);
            }
        }

        // Initial assignment history
        if (savedLead.getOwnerUserId() != null) {
            assignmentHistoryRepository.save(CrmLeadAssignmentHistory.builder()
                    .companyId(companyId)
                    .leadId(savedLead.getId())
                    .toUserId(savedLead.getOwnerUserId())
                    .assignedByUserId(currentUserId)
                    .assignmentMethod("CREATION_ASSIGN")
                    .reason("Initial assignment on lead creation")
                    .build());
        }

        // Trigger automation evaluation for LEAD_CREATED
        if (automationEvaluatorService != null) {
            try {
                automationEvaluatorService.evaluateAndExecute(companyId,
                        com.erp.crm.modules.automation.enums.AutomationTrigger.LEAD_CREATED,
                        savedLead, savedLead.getId(), "LEAD");
            } catch (Exception e) {
                log.warn("Automation execution failed for new lead [{}]: {}", savedLead.getId(), e.getMessage());
            }
        }

        return enrichResponse(savedLead);
    }

    @Override
    @Transactional(readOnly = true)
    public LeadResponse getLeadById(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmLead lead = leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));
        return enrichResponse(lead);
    }

    private static final Map<String, String> LEAD_SORT_FIELD_MAPPING = Map.ofEntries(
            Map.entry("date", "createdAt"),
            Map.entry("createddate", "createdAt"),
            Map.entry("createdat", "createdAt"),
            Map.entry("updateddate", "updatedAt"),
            Map.entry("updatedat", "updatedAt"),
            Map.entry("company", "organizationName"),
            Map.entry("companyname", "organizationName"),
            Map.entry("organizationname", "organizationName"),
            Map.entry("contact", "displayName"),
            Map.entry("name", "displayName"),
            Map.entry("displayname", "displayName"),
            Map.entry("value", "annualRevenue"),
            Map.entry("annualrevenue", "annualRevenue"),
            Map.entry("score", "leadScore"),
            Map.entry("leadscore", "leadScore"),
            Map.entry("rating", "scoreGrade"),
            Map.entry("scoregrade", "scoreGrade"),
            Map.entry("stage", "leadStage"),
            Map.entry("leadstage", "leadStage"),
            Map.entry("code", "leadCode"),
            Map.entry("leadcode", "leadCode"),
            Map.entry("followupdate", "nextFollowUpDate"),
            Map.entry("nextfollowupdate", "nextFollowUpDate"));

    private static final Set<String> VALID_LEAD_ENTITY_FIELDS = Set.of(
            "id", "companyId", "leadCode", "salutation", "firstName", "lastName", "displayName",
            "email", "normalizedEmail", "phone", "normalizedPhone", "alternatePhone", "website",
            "organizationName", "designation", "industry", "annualRevenue", "companySize",
            "gstin", "pan", "addressLine1", "addressLine2", "city", "state", "stateCode", "postalCode", "country",
            "leadSourceId", "leadStatusId", "leadStage", "leadScore", "scoreGrade", "isQualified",
            "qualifiedAt", "qualifiedByUserId", "ownerUserId", "assignedTeamId", "assignedAt",
            "lastContactedAt", "nextFollowUpDate", "isConverted", "convertedAt", "convertedByUserId",
            "convertedAccountId", "convertedContactId", "convertedOpportunityId", "isLost",
            "lostReasonId", "lostDetails", "lostAt", "isRecycled", "recycledAt", "isDuplicate",
            "primaryLeadId", "dedupFingerprint", "consentGiven", "consentTimestamp", "consentSource",
            "optOutEmail", "optOutWhatsapp", "optOutSms", "optOutCall", "createdAt", "updatedAt", "isDeleted");

    private Pageable sanitizeLeadPageable(Pageable pageable) {
        if (pageable == null) {
            return PageRequest.of(0, 15, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        if (pageable.getSort().isUnsorted()) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        List<Sort.Order> sanitizedOrders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            String property = order.getProperty();
            if (property == null || property.isBlank()) {
                continue;
            }
            String lower = property.trim().toLowerCase();
            String mapped = LEAD_SORT_FIELD_MAPPING.getOrDefault(lower, property.trim());

            if (!VALID_LEAD_ENTITY_FIELDS.contains(mapped)) {
                log.warn("Invalid sort property '{}' passed for CrmLead; falling back to 'createdAt'", property);
                mapped = "createdAt";
            }
            sanitizedOrders.add(new Sort.Order(order.getDirection(), mapped, order.getNullHandling()));
        }

        Sort sanitizedSort = sanitizedOrders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(sanitizedOrders);

        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sanitizedSort);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeadResponse> getAllLeads(LeadFilterRequest filter, UUID requestCompanyId, Pageable pageable) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        Pageable sanitizedPageable = sanitizeLeadPageable(pageable);
        Specification<CrmLead> spec = buildSpecification(companyId, filter);
        return leadRepository.findAll(spec, sanitizedPageable).map(this::enrichResponse);
    }

    @Override
    public LeadResponse updateLead(UUID id, LeadUpdateRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmLead lead = leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        leadMapper.updateEntityFromRequest(request, lead);
        if (request.getPhone() != null) {
            lead.setNormalizedPhone(PhoneUtils.normalizePhone(request.getPhone()));
        }
        if (request.getEmail() != null) {
            String normEmail = request.getEmail().trim().toLowerCase();
            lead.setNormalizedEmail(normEmail.length() > 255 ? normEmail.substring(0, 255) : normEmail);
        }
        String first = lead.getFirstName() != null ? lead.getFirstName() : "";
        String last = lead.getLastName() != null ? lead.getLastName() : "";
        lead.setDisplayName((first + " " + last).trim());

        sanitizeLead(lead);

        CrmLead updated = leadRepository.save(lead);
        return enrichResponse(updated);
    }

    @Override
    public LeadResponse updateLeadStatus(UUID id, LeadStatusUpdateRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmLead lead = leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        CrmLeadStatus newStatus = statusRepository
                .findByCompanyIdAndIdAndIsDeletedFalse(companyId, request.getStatusId())
                .orElseThrow(() -> new ResourceNotFoundException("Lead status not found: " + request.getStatusId()));

        lead.setLeadStatusId(newStatus.getId());
        if ("QUALIFIED".equals(newStatus.getStatusCategory().name())) {
            lead.setIsQualified(true);
            lead.setQualifiedAt(LocalDateTime.now());
            lead.setQualifiedByUserId(TenantUtils.getCurrentUserId());
            lead.setLeadStage(LeadStage.SQL);
        } else if ("CONVERTED".equals(newStatus.getStatusCategory().name())) {
            lead.setIsConverted(true);
            lead.setConvertedAt(LocalDateTime.now());
        } else if ("UNQUALIFIED".equals(newStatus.getStatusCategory().name())) {
            lead.setIsLost(true);
            lead.setLostAt(LocalDateTime.now());
            lead.setLostReasonId(request.getReasonId());
            lead.setLostDetails(request.getNotes());
        }

        CrmLead updatedLead = leadRepository.save(lead);

        // Trigger automation evaluation for LEAD_STATUS_CHANGED
        if (automationEvaluatorService != null) {
            try {
                automationEvaluatorService.evaluateAndExecute(companyId,
                        com.erp.crm.modules.automation.enums.AutomationTrigger.LEAD_STATUS_CHANGED,
                        updatedLead, updatedLead.getId(), "LEAD");
            } catch (Exception e) {
                log.warn("Automation execution failed on lead status change [{}]: {}", updatedLead.getId(),
                        e.getMessage());
            }
        }

        return enrichResponse(updatedLead);
    }

    @Override
    public LeadResponse assignLead(UUID id, LeadAssignRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmLead lead = leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        UUID fromUser = lead.getOwnerUserId();
        lead.setOwnerUserId(request.getTargetUserId());
        lead.setAssignedAt(LocalDateTime.now());

        assignmentHistoryRepository.save(CrmLeadAssignmentHistory.builder()
                .companyId(companyId)
                .leadId(lead.getId())
                .fromUserId(fromUser)
                .toUserId(request.getTargetUserId())
                .assignedByUserId(TenantUtils.getCurrentUserId())
                .assignmentMethod("MANUAL")
                .reason(request.getReason())
                .build());

        return enrichResponse(leadRepository.save(lead));
    }

    @Override
    public LeadResponse mergeLeads(LeadMergeRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmLead primaryLead = leadRepository
                .findByCompanyIdAndIdAndIsDeletedFalse(companyId, request.getPrimaryLeadId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Primary lead not found: " + request.getPrimaryLeadId()));

        for (UUID dupId : request.getDuplicateLeadIds()) {
            CrmLead dupLead = leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, dupId)
                    .orElseThrow(() -> new ResourceNotFoundException("Duplicate lead not found: " + dupId));

            dupLead.setIsDuplicate(true);
            dupLead.setPrimaryLeadId(primaryLead.getId());
            dupLead.setIsDeleted(true);
            leadRepository.save(dupLead);

            mergeHistoryRepository.save(CrmLeadMergeHistory.builder()
                    .companyId(companyId)
                    .primaryLeadId(primaryLead.getId())
                    .mergedLeadId(dupId)
                    .mergedLeadSnapshotJson(
                            "{\"code\":\"" + dupLead.getLeadCode() + "\",\"phone\":\"" + dupLead.getPhone() + "\"}")
                    .mergedByUserId(TenantUtils.getCurrentUserId())
                    .mergeReason(request.getMergeReason())
                    .build());
        }

        return enrichResponse(primaryLead);
    }

    @Override
    public LeadConvertResponse convertLead(UUID id, LeadConvertRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmLead lead = leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + id));

        if (lead.getIsConverted()) {
            throw new ConflictException("Lead has already been converted.");
        }

        UUID accountId = null;
        String accountCode = null;
        if (Boolean.TRUE.equals(request.getCreateAccount())) {
            String accName = request.getAccountName() != null && !request.getAccountName().isBlank()
                    ? request.getAccountName()
                    : (lead.getOrganizationName() != null ? lead.getOrganizationName() : lead.getDisplayName());
            accountCode = "ACC-" + LocalDate.now().getYear() + "-" + ThreadLocalRandom.current().nextInt(10000, 99999);
            CrmAccount account = CrmAccount.builder()
                    .accountCode(accountCode)
                    .accountName(accName)
                    .accountType(AccountType.PROSPECT)
                    .industry(lead.getIndustry())
                    .businessType(BusinessType.PVT_LTD)
                    .tier(AccountTier.TIER_2)
                    .gstin(lead.getGstin())
                    .pan(lead.getPan())
                    .phone(lead.getPhone())
                    .email(lead.getEmail())
                    .ownerUserId(lead.getOwnerUserId())
                    .isActive(true)
                    .build();
            account.setCompanyId(companyId);
            CrmAccount savedAccount = accountRepository.save(account);
            accountId = savedAccount.getId();
        }

        // Create Contact
        String contactCode = "CON-" + LocalDate.now().getYear() + "-"
                + ThreadLocalRandom.current().nextInt(10000, 99999);
        CrmContact contact = CrmContact.builder()
                .accountId(accountId)
                .contactCode(contactCode)
                .salutation(lead.getSalutation())
                .firstName(lead.getFirstName())
                .lastName(lead.getLastName())
                .displayName(lead.getDisplayName())
                .designation(lead.getDesignation())
                .email(lead.getEmail())
                .normalizedEmail(lead.getNormalizedEmail())
                .phone(lead.getPhone())
                .normalizedPhone(lead.getNormalizedPhone())
                .isPrimaryContact(true)
                .decisionMakerRole(DecisionMakerRole.DECISION_MAKER)
                .ownerUserId(lead.getOwnerUserId())
                .isActive(true)
                .build();
        contact.setCompanyId(companyId);
        CrmContact savedContact = contactRepository.save(contact);

        // Optionally create Opportunity
        UUID oppId = null;
        String oppCode = null;
        if (Boolean.TRUE.equals(request.getCreateOpportunity())) {
            oppCode = "OPP-" + LocalDate.now().getYear() + "-" + ThreadLocalRandom.current().nextInt(10000, 99999);
            UUID pipelineId = request.getPipelineId();
            if (pipelineId == null) {
                pipelineId = pipelineRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(companyId)
                        .map(CrmSalesPipeline::getId)
                        .orElse(null);
            }
            UUID stageId = request.getStageId();
            if (stageId == null && pipelineId != null) {
                stageId = stageRepository.findByPipelineIdAndIsDeletedFalseOrderByStageOrderAsc(pipelineId)
                        .stream().findFirst().map(s -> s.getId()).orElse(null);
            }

            if (pipelineId != null && stageId != null) {
                CrmOpportunity opp = CrmOpportunity.builder()
                        .opportunityCode(oppCode)
                        .opportunityName(request.getOpportunityName() != null ? request.getOpportunityName()
                                : lead.getDisplayName() + " Deal")
                        .pipelineId(pipelineId)
                        .currentStageId(stageId)
                        .accountId(accountId)
                        .primaryContactId(savedContact.getId())
                        .originLeadId(lead.getId())
                        .dealValue(request.getDealValue() != null ? request.getDealValue() : java.math.BigDecimal.ZERO)
                        .expectedCloseDate(request.getExpectedCloseDate() != null ? request.getExpectedCloseDate()
                                : LocalDate.now().plusDays(30))
                        .ownerUserId(lead.getOwnerUserId())
                        .dealType(OpportunityDealType.NEW_BUSINESS)
                        .dealStatus(OpportunityDealStatus.OPEN)
                        .build();
                opp.setCompanyId(companyId);
                CrmOpportunity savedOpp = opportunityRepository.save(opp);
                oppId = savedOpp.getId();
            }
        }

        lead.setIsConverted(true);
        lead.setConvertedAt(LocalDateTime.now());
        lead.setConvertedByUserId(TenantUtils.getCurrentUserId());
        lead.setConvertedAccountId(accountId);
        lead.setConvertedContactId(savedContact.getId());
        lead.setConvertedOpportunityId(oppId);
        leadRepository.save(lead);

        return LeadConvertResponse.builder()
                .leadId(lead.getId())
                .leadCode(lead.getLeadCode())
                .accountId(accountId)
                .accountCode(accountCode)
                .contactId(savedContact.getId())
                .contactCode(contactCode)
                .opportunityId(oppId)
                .opportunityCode(oppCode)
                .build();
    }

    @Override
    public void deleteLead(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmLead lead = leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));
        lead.setIsDeleted(true);
        leadRepository.save(lead);
    }

    private int calculateLeadScore(CrmLead lead, boolean hasProducts) {
        int score = 0;
        if (lead.getEmail() != null && !lead.getEmail().isBlank())
            score += 15;
        if (lead.getPhone() != null && !lead.getPhone().isBlank())
            score += 20;
        if (lead.getOrganizationName() != null && !lead.getOrganizationName().isBlank())
            score += 15;
        if (lead.getGstin() != null && !lead.getGstin().isBlank())
            score += 20;
        if (lead.getAnnualRevenue() != null)
            score += 15;
        if (hasProducts)
            score += 15;
        return Math.min(score, 100);
    }

    private String generateLeadCode() {
        return "LD-" + LocalDate.now().getYear() + "-"
                + String.format("%05d", ThreadLocalRandom.current().nextInt(1, 99999));
    }

    private LeadResponse enrichResponse(CrmLead lead) {
        LeadResponse response = leadMapper.toResponse(lead);
        if (lead.getLeadStatusId() != null) {
            statusRepository.findByCompanyIdAndIdAndIsDeletedFalse(lead.getCompanyId(), lead.getLeadStatusId())
                    .ifPresent(s -> {
                        response.setLeadStatusName(s.getStatusName());
                        response.setLeadStatusColor(s.getColorCode());
                    });
        }
        if (lead.getLeadSourceId() != null) {
            sourceRepository.findByCompanyIdAndIdAndIsDeletedFalse(lead.getCompanyId(), lead.getLeadSourceId())
                    .ifPresent(src -> response.setLeadSourceName(src.getSourceName()));
        }
        List<CrmLeadProductInterest> interests = productInterestRepository
                .findByCompanyIdAndLeadIdAndIsDeletedFalse(lead.getCompanyId(), lead.getId());
        response.setInquiredProducts(interests.stream().map(leadMapper::toProductInterestResponse).toList());
        return response;
    }

    private Specification<CrmLead> buildSpecification(UUID companyId, LeadFilterRequest filter) {
        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("companyId"), companyId));
            predicates.add(cb.isFalse(root.get("isDeleted")));

            if (filter != null) {
                if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
                    String pattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
                    predicates.add(cb.or(
                            cb.like(cb.lower(root.get("displayName")), pattern),
                            cb.like(cb.lower(root.get("organizationName")), pattern),
                            cb.like(cb.lower(root.get("leadCode")), pattern),
                            cb.like(cb.lower(root.get("phone")), pattern),
                            cb.like(cb.lower(root.get("email")), pattern)));
                }
                if (filter.getStatusId() != null) {
                    predicates.add(cb.equal(root.get("leadStatusId"), filter.getStatusId()));
                }
                if (filter.getStage() != null) {
                    predicates.add(cb.equal(root.get("leadStage"), filter.getStage()));
                }
                if (filter.getRating() != null) {
                    predicates.add(cb.equal(root.get("scoreGrade"), filter.getRating()));
                }
                if (filter.getOwnerId() != null) {
                    predicates.add(cb.equal(root.get("ownerUserId"), filter.getOwnerId()));
                }
                if (filter.getSourceId() != null) {
                    predicates.add(cb.equal(root.get("leadSourceId"), filter.getSourceId()));
                }
                if (filter.getScoreMin() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("leadScore"), filter.getScoreMin()));
                }
                if (filter.getScoreMax() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("leadScore"), filter.getScoreMax()));
                }
                if (filter.getIsConverted() != null) {
                    predicates.add(cb.equal(root.get("isConverted"), filter.getIsConverted()));
                }
                if (filter.getFromDate() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFromDate()));
                }
                if (filter.getToDate() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getToDate()));
                }
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private void sanitizeLead(CrmLead lead) {
        if (lead == null) {
            return;
        }
        lead.setLeadCode(truncate(lead.getLeadCode(), 50));
        lead.setSalutation(truncate(lead.getSalutation(), 20));
        if (lead.getFirstName() == null || lead.getFirstName().isBlank()) {
            lead.setFirstName("Lead");
        } else {
            lead.setFirstName(truncate(lead.getFirstName(), 100));
        }
        lead.setLastName(truncate(lead.getLastName(), 100));
        if (lead.getDisplayName() == null || lead.getDisplayName().isBlank()) {
            lead.setDisplayName(lead.getFirstName());
        }
        lead.setDisplayName(truncate(lead.getDisplayName(), 200));
        lead.setEmail(truncate(lead.getEmail(), 255));
        lead.setNormalizedEmail(truncate(lead.getNormalizedEmail(), 255));
        lead.setPhone(truncate(lead.getPhone(), 30));
        lead.setNormalizedPhone(truncate(lead.getNormalizedPhone(), 20));
        lead.setAlternatePhone(truncate(lead.getAlternatePhone(), 30));
        lead.setWebsite(truncate(lead.getWebsite(), 255));
        lead.setOrganizationName(truncate(lead.getOrganizationName(), 255));
        lead.setDesignation(truncate(lead.getDesignation(), 100));
        lead.setIndustry(truncate(lead.getIndustry(), 100));
        lead.setCompanySize(truncate(lead.getCompanySize(), 50));
        lead.setGstin(truncate(lead.getGstin(), 15));
        lead.setPan(truncate(lead.getPan(), 10));
        lead.setAddressLine1(truncate(lead.getAddressLine1(), 255));
        lead.setAddressLine2(truncate(lead.getAddressLine2(), 255));
        lead.setCity(truncate(lead.getCity(), 100));
        lead.setState(truncate(lead.getState(), 100));
        lead.setStateCode(truncate(lead.getStateCode(), 10));
        lead.setPostalCode(truncate(lead.getPostalCode(), 20));
        lead.setCountry(truncate(lead.getCountry(), 100));
        lead.setExternalLeadId(truncate(lead.getExternalLeadId(), 255));
        lead.setExternalLeadUrl(truncate(lead.getExternalLeadUrl(), 500));
        lead.setUtmSource(truncate(lead.getUtmSource(), 100));
        lead.setUtmMedium(truncate(lead.getUtmMedium(), 100));
        lead.setUtmCampaign(truncate(lead.getUtmCampaign(), 100));
        lead.setUtmContent(truncate(lead.getUtmContent(), 100));
        lead.setUtmTerm(truncate(lead.getUtmTerm(), 100));
        lead.setDedupFingerprint(truncate(lead.getDedupFingerprint(), 64));
        lead.setConsentSource(truncate(lead.getConsentSource(), 100));
    }

    private String truncate(String str, int maxLen) {
        if (str == null) {
            return null;
        }
        String trimmed = str.trim();
        return trimmed.length() <= maxLen ? trimmed : trimmed.substring(0, maxLen);
    }
}
