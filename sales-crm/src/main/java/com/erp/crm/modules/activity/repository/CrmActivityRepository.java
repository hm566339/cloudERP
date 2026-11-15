package com.erp.crm.modules.activity.repository;

import com.erp.crm.modules.activity.entity.CrmActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmActivityRepository extends JpaRepository<CrmActivity, UUID> {
    List<CrmActivity> findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalseOrderByActivityAtDesc(UUID companyId, String entityType, UUID entityId);
    Page<CrmActivity> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
    Optional<CrmActivity> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
}

