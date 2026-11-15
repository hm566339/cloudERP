package com.erp.crm.modules.setting.repository;

import com.erp.crm.modules.setting.entity.CrmCompanySetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmCompanySettingRepository extends JpaRepository<CrmCompanySetting, UUID> {
    Optional<CrmCompanySetting> findByCompanyIdAndIsDeletedFalse(UUID companyId);
}

