package com.erp.crm.modules.setting.repository;

import com.erp.crm.modules.setting.entity.CrmTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmTagRepository extends JpaRepository<CrmTag, UUID> {
    List<CrmTag> findByCompanyIdAndIsDeletedFalse(UUID companyId);
    Optional<CrmTag> findByCompanyIdAndTagNameAndIsDeletedFalse(UUID companyId, String tagName);
}

