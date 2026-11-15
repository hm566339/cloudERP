package com.erp.crm.modules.activity.repository;

import com.erp.crm.modules.activity.entity.CrmTask;
import com.erp.crm.modules.activity.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmTaskRepository extends JpaRepository<CrmTask, UUID> {
    List<CrmTask> findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalse(UUID companyId, String entityType, UUID entityId);
    List<CrmTask> findByCompanyIdAndAssignedToUserIdAndStatusAndDueDateLessThanEqualAndIsDeletedFalse(
            UUID companyId, UUID assignedToUserId, TaskStatus status, LocalDate date);
    Page<CrmTask> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
    Optional<CrmTask> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
}

