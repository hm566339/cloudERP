package com.erp.crm.modules.communication.repository;

import com.erp.crm.modules.communication.entity.CrmCallLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmCallLogRepository extends JpaRepository<CrmCallLog, UUID> {
    List<CrmCallLog> findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalseOrderByStartTimeDesc(UUID companyId, String entityType, UUID entityId);
    Page<CrmCallLog> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
    Optional<CrmCallLog> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
}

