package com.erp.workflow.repository;

import com.erp.workflow.entity.WorkflowStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowStageRepository extends JpaRepository<WorkflowStage, UUID> {

    List<WorkflowStage> findByWorkflowDefinitionIdAndIsDeletedFalseOrderBySequenceNoAsc(UUID workflowDefinitionId);

    Optional<WorkflowStage> findByIdAndIsDeletedFalse(UUID id);

    Optional<WorkflowStage> findByWorkflowDefinitionIdAndSequenceNoAndIsDeletedFalse(
            UUID workflowDefinitionId, Integer sequenceNo);

    Optional<WorkflowStage> findByWorkflowDefinitionIdAndStageCodeAndIsDeletedFalse(
            UUID workflowDefinitionId, String stageCode);

    @Query("SELECT s FROM WorkflowStage s WHERE s.workflowDefinition.id = :definitionId " +
           "AND s.sequenceNo > :currentSeq AND s.isDeleted = false AND s.isActive = true " +
           "ORDER BY s.sequenceNo ASC LIMIT 1")
    Optional<WorkflowStage> findNextStage(
            @Param("definitionId") UUID definitionId,
            @Param("currentSeq") Integer currentSeq);

    @Query("SELECT s FROM WorkflowStage s WHERE s.workflowDefinition.id = :definitionId " +
           "AND s.sequenceNo < :currentSeq AND s.isDeleted = false AND s.isActive = true " +
           "ORDER BY s.sequenceNo DESC LIMIT 1")
    Optional<WorkflowStage> findPreviousStage(
            @Param("definitionId") UUID definitionId,
            @Param("currentSeq") Integer currentSeq);
}
