package com.erp.workflow.repository;

import com.erp.workflow.entity.WorkflowSla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowSlaRepository extends JpaRepository<WorkflowSla, UUID> {

    Optional<WorkflowSla> findByWorkflowStageIdAndIsActiveTrueAndIsDeletedFalse(UUID workflowStageId);
}
