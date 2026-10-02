package com.erp.workflow.repository;

import com.erp.workflow.entity.WorkflowTransition;
import com.erp.workflow.enums.WorkflowActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransition, UUID> {

    List<WorkflowTransition> findByWorkflowDefinitionIdAndIsDeletedFalse(UUID workflowDefinitionId);

    @Query("SELECT t FROM WorkflowTransition t WHERE t.workflowDefinition.id = :definitionId " +
           "AND (t.sourceStage.id = :sourceStageId OR t.sourceStage IS NULL) " +
           "AND t.actionType = :actionType AND t.isActive = true AND t.isDeleted = false")
    Optional<WorkflowTransition> findValidTransition(
            @Param("definitionId") UUID definitionId,
            @Param("sourceStageId") UUID sourceStageId,
            @Param("actionType") WorkflowActionType actionType);
}
