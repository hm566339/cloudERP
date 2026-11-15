package com.erp.crm.modules.setting.service.serviceImpl;

import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.setting.entity.*;
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
    @Transactional(readOnly = true)
    public List<CrmLeadStatus> getLeadStatuses(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return leadStatusRepository.findByCompanyIdAndIsDeletedFalseOrderByDisplayOrderAsc(companyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CrmLeadSource> getLeadSources(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return leadSourceRepository.findByCompanyIdAndIsDeletedFalseAndIsActiveTrue(companyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CrmLostReason> getLostReasons(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return lostReasonRepository.findByCompanyIdAndIsDeletedFalseAndIsActiveTrue(companyId);
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

