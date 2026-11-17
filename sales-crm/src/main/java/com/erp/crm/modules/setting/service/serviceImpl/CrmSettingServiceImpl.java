package com.erp.crm.modules.setting.service.serviceImpl;

import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.setting.entity.*;
import com.erp.crm.modules.setting.enums.LeadStatusCategory;
import com.erp.crm.modules.setting.repository.*;
import com.erp.crm.modules.setting.service.CrmSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrmSettingServiceImpl implements CrmSettingService {

    private final CrmCompanySettingRepository companySettingRepository;
    private final CrmLeadStatusRepository leadStatusRepository;
    private final CrmLeadSourceRepository leadSourceRepository;
    private final CrmLostReasonRepository lostReasonRepository;
    private final CrmTagRepository tagRepository;

    @Override
    @Transactional(readOnly = true)
    public CrmCompanySetting getCompanySetting(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return companySettingRepository.findByCompanyIdAndIsDeletedFalse(companyId)
                .orElseGet(() -> {
                    CrmCompanySetting defaultSetting = CrmCompanySetting.builder().build();
                    defaultSetting.setCompanyId(companyId);
                    return defaultSetting;
                });
    }

    @Override
    public CrmCompanySetting updateCompanySetting(CrmCompanySetting setting, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmCompanySetting existing = companySettingRepository.findByCompanyIdAndIsDeletedFalse(companyId)
                .orElseGet(() -> {
                    CrmCompanySetting s = CrmCompanySetting.builder().build();
                    s.setCompanyId(companyId);
                    return s;
                });

        if (setting.getAutoAssignLeads() != null) existing.setAutoAssignLeads(setting.getAutoAssignLeads());
        if (setting.getQuotationValidityDays() != null) existing.setQuotationValidityDays(setting.getQuotationValidityDays());
        if (setting.getRequireDiscountApproval() != null) existing.setRequireDiscountApproval(setting.getRequireDiscountApproval());
        if (setting.getDiscountApprovalThreshold() != null) existing.setDiscountApprovalThreshold(setting.getDiscountApprovalThreshold());
        if (setting.getEnableDeduplication() != null) existing.setEnableDeduplication(setting.getEnableDeduplication());
        if (setting.getBaseCurrency() != null) existing.setBaseCurrency(setting.getBaseCurrency());

        return companySettingRepository.save(existing);
    }

    @Override
    public List<CrmLeadStatus> getLeadStatuses(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        List<CrmLeadStatus> list = leadStatusRepository.findByCompanyIdAndIsDeletedFalseOrderByDisplayOrderAsc(companyId);
        if (list.isEmpty()) {
            list = seedDefaultLeadStatuses(companyId);
        }
        return list;
    }

    private List<CrmLeadStatus> seedDefaultLeadStatuses(UUID companyId) {
        log.info("Auto-seeding standard CRM lead statuses for company [{}]", companyId);
        List<CrmLeadStatus> defaults = List.of(
            CrmLeadStatus.builder().statusCode("NEW").statusName("New / Open").statusCategory(LeadStatusCategory.OPEN).displayOrder(1).colorCode("#3B82F6").isDefault(true).isActive(true).build(),
            CrmLeadStatus.builder().statusCode("CONTACTED").statusName("Contacted").statusCategory(LeadStatusCategory.OPEN).displayOrder(2).colorCode("#F59E0B").isDefault(false).isActive(true).build(),
            CrmLeadStatus.builder().statusCode("QUALIFIED").statusName("Qualified").statusCategory(LeadStatusCategory.QUALIFIED).displayOrder(3).colorCode("#10B981").isDefault(false).isActive(true).build(),
            CrmLeadStatus.builder().statusCode("PROPOSAL").statusName("Proposal Sent").statusCategory(LeadStatusCategory.OPEN).displayOrder(4).colorCode("#6366F1").isDefault(false).isActive(true).build(),
            CrmLeadStatus.builder().statusCode("NEGOTIATION").statusName("In Negotiation").statusCategory(LeadStatusCategory.OPEN).displayOrder(5).colorCode("#8B5CF6").isDefault(false).isActive(true).build(),
            CrmLeadStatus.builder().statusCode("UNQUALIFIED").statusName("Unqualified").statusCategory(LeadStatusCategory.UNQUALIFIED).displayOrder(6).colorCode("#6B7280").isDefault(false).isActive(true).build(),
            CrmLeadStatus.builder().statusCode("CONVERTED").statusName("Converted to Deal").statusCategory(LeadStatusCategory.CONVERTED).displayOrder(7).colorCode("#059669").isDefault(false).isActive(true).build(),
            CrmLeadStatus.builder().statusCode("LOST").statusName("Lost Lead").statusCategory(LeadStatusCategory.RECYCLED).displayOrder(8).colorCode("#EF4444").isDefault(false).isActive(true).build()
        );
        for (CrmLeadStatus s : defaults) {
            s.setCompanyId(companyId);
        }
        try {
            return leadStatusRepository.saveAll(defaults);
        } catch (Exception e) {
            log.warn("Could not save auto-seeded lead statuses: {}", e.getMessage());
            return leadStatusRepository.findByCompanyIdAndIsDeletedFalseOrderByDisplayOrderAsc(companyId);
        }
    }

    @Override
    public List<CrmLeadSource> getLeadSources(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        List<CrmLeadSource> list = leadSourceRepository.findByCompanyIdAndIsDeletedFalseAndIsActiveTrue(companyId);
        if (list.isEmpty()) {
            list = seedDefaultLeadSources(companyId);
        }
        return list;
    }

    private List<CrmLeadSource> seedDefaultLeadSources(UUID companyId) {
        log.info("Auto-seeding standard CRM lead sources for company [{}]", companyId);
        List<CrmLeadSource> defaults = List.of(
            CrmLeadSource.builder().sourceCode("DIRECT").sourceName("Direct / Inbound").sourceCategory("INBOUND").isActive(true).isSystem(true).build(),
            CrmLeadSource.builder().sourceCode("WEBSITE").sourceName("Company Website").sourceCategory("DIGITAL").isActive(true).isSystem(true).build(),
            CrmLeadSource.builder().sourceCode("INDIAMART").sourceName("IndiaMART Marketplace").sourceCategory("MARKETPLACE").isActive(true).isSystem(false).build(),
            CrmLeadSource.builder().sourceCode("TRADEINDIA").sourceName("TradeIndia Marketplace").sourceCategory("MARKETPLACE").isActive(true).isSystem(false).build(),
            CrmLeadSource.builder().sourceCode("JUSTDIAL").sourceName("JustDial Portal").sourceCategory("MARKETPLACE").isActive(true).isSystem(false).build(),
            CrmLeadSource.builder().sourceCode("META_ADS").sourceName("Facebook / Instagram Ads").sourceCategory("DIGITAL").isActive(true).isSystem(false).build(),
            CrmLeadSource.builder().sourceCode("GOOGLE_ADS").sourceName("Google Ads").sourceCategory("DIGITAL").isActive(true).isSystem(false).build(),
            CrmLeadSource.builder().sourceCode("COLD_CALL").sourceName("Cold Outreach").sourceCategory("SALES").isActive(true).isSystem(false).build(),
            CrmLeadSource.builder().sourceCode("REFERRAL").sourceName("Customer Referral").sourceCategory("REFERRAL").isActive(true).isSystem(false).build(),
            CrmLeadSource.builder().sourceCode("EXHIBITION").sourceName("Trade Show / Exhibition").sourceCategory("OFFLINE").isActive(true).isSystem(false).build(),
            CrmLeadSource.builder().sourceCode("OTHER").sourceName("Other / General").sourceCategory("OTHER").isActive(true).isSystem(false).build()
        );
        for (CrmLeadSource s : defaults) {
            s.setCompanyId(companyId);
        }
        try {
            return leadSourceRepository.saveAll(defaults);
        } catch (Exception e) {
            log.warn("Could not save auto-seeded lead sources: {}", e.getMessage());
            return leadSourceRepository.findByCompanyIdAndIsDeletedFalseAndIsActiveTrue(companyId);
        }
    }

    @Override
    public List<CrmLostReason> getLostReasons(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        List<CrmLostReason> list = lostReasonRepository.findByCompanyIdAndIsDeletedFalseAndIsActiveTrue(companyId);
        if (list.isEmpty()) {
            list = seedDefaultLostReasons(companyId);
        }
        return list;
    }

    private List<CrmLostReason> seedDefaultLostReasons(UUID companyId) {
        log.info("Auto-seeding standard CRM lost reasons for company [{}]", companyId);
        List<CrmLostReason> defaults = List.of(
            CrmLostReason.builder().reasonCode("PRICE_HIGH").reasonLabel("Price Too High").applicableTo("BOTH").isActive(true).build(),
            CrmLostReason.builder().reasonCode("COMPETITOR").reasonLabel("Chose Competitor").applicableTo("BOTH").isActive(true).build(),
            CrmLostReason.builder().reasonCode("NO_BUDGET").reasonLabel("No Budget / Project Cancelled").applicableTo("BOTH").isActive(true).build(),
            CrmLostReason.builder().reasonCode("NOT_RESPONSIVE").reasonLabel("Unresponsive / Ghosted").applicableTo("BOTH").isActive(true).build(),
            CrmLostReason.builder().reasonCode("SPEC_MISMATCH").reasonLabel("Specification / Product Mismatch").applicableTo("BOTH").isActive(true).build(),
            CrmLostReason.builder().reasonCode("TIMELINE_DELAY").reasonLabel("Timeline / Delivery Delay").applicableTo("BOTH").isActive(true).build(),
            CrmLostReason.builder().reasonCode("OTHER").reasonLabel("Other Reason").applicableTo("BOTH").isActive(true).build()
        );
        for (CrmLostReason r : defaults) {
            r.setCompanyId(companyId);
        }
        try {
            return lostReasonRepository.saveAll(defaults);
        } catch (Exception e) {
            log.warn("Could not save auto-seeded lost reasons: {}", e.getMessage());
            return lostReasonRepository.findByCompanyIdAndIsDeletedFalseAndIsActiveTrue(companyId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CrmTag> getTags(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return tagRepository.findByCompanyIdAndIsDeletedFalse(companyId);
    }

    @Override
    public CrmTag createTag(String tagName, String colorCode, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmTag tag = CrmTag.builder()
                .tagName(tagName)
                .colorCode(colorCode != null ? colorCode : "#10B981")
                .entityScope("GLOBAL")
                .build();
        tag.setCompanyId(companyId);
        return tagRepository.save(tag);
    }
}

