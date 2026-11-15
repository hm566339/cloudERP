package com.erp.crm.modules.setting.repository;

import com.erp.crm.modules.setting.entity.CrmLostReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmLostReasonRepository extends JpaRepository<CrmLostReason, UUID> {
    List<CrmLostReason> findByCompanyIdAndIsDeletedFalseAndIsActiveTrue(UUID companyId);
    Optional<CrmLostReason> findByCompanyIdAndReasonCodeAndIsDeletedFalse(UUID companyId, String reasonCode);
}

