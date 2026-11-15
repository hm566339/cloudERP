package com.erp.crm.modules.setting.service;

import com.erp.crm.modules.setting.entity.*;

import java.util.List;
import java.util.UUID;

public interface CrmSettingService {

    CrmCompanySetting getCompanySetting(UUID requestCompanyId);

    CrmCompanySetting updateCompanySetting(CrmCompanySetting setting, UUID requestCompanyId);

    List<CrmLeadStatus> getLeadStatuses(UUID requestCompanyId);

    List<CrmLeadSource> getLeadSources(UUID requestCompanyId);

    List<CrmLostReason> getLostReasons(UUID requestCompanyId);

    List<CrmTag> getTags(UUID requestCompanyId);

    CrmTag createTag(String tagName, String colorCode, UUID requestCompanyId);
}

