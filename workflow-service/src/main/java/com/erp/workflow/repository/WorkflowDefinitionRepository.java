package com.erp.workflow.repository;

import com.erp.workflow.entity.WorkflowDefinition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowDefinitionRepository extends JpaRepository<WorkflowDefinition, UUID> {

    Optional<WorkflowDefinition> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    Optional<WorkflowDefinition> findByCompanyIdAndWorkflowCodeAndVersionAndIsDeletedFalse(
            UUID companyId, String workflowCode, Integer version);

    @Query("SELECT wd FROM WorkflowDefinition wd WHERE wd.companyId = :companyId " +
           "AND wd.documentType = :documentType " +
           "AND wd.isActive = true AND wd.isDeleted = false " +
           "ORDER BY wd.isDefault DESC, wd.version DESC")
    List<WorkflowDefinition> findActiveByDocumentType(
            @Param("companyId") UUID companyId,
            @Param("documentType") String documentType);

    @Query("SELECT wd FROM WorkflowDefinition wd WHERE wd.companyId = :companyId " +
           "AND wd.moduleName = :moduleName " +
           "AND wd.documentType = :documentType " +
           "AND wd.isActive = true AND wd.isDeleted = false " +
           "ORDER BY wd.isDefault DESC, wd.version DESC")
    List<WorkflowDefinition> findActiveByModuleAndDocumentType(
            @Param("companyId") UUID companyId,
            @Param("moduleName") String moduleName,
            @Param("documentType") String documentType);

    Page<WorkflowDefinition> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    Page<WorkflowDefinition> findByCompanyIdAndModuleNameAndIsDeletedFalse(
            UUID companyId, String moduleName, Pageable pageable);

    boolean existsByCompanyIdAndWorkflowCodeAndVersionAndIsDeletedFalse(
            UUID companyId, String workflowCode, Integer version);

    boolean existsByCompanyIdAndWorkflowCodeAndVersion(
            UUID companyId, String workflowCode, Integer version);

    @Query("SELECT MAX(wd.version) FROM WorkflowDefinition wd WHERE wd.companyId = :companyId AND wd.workflowCode = :workflowCode")
    Integer findMaxVersionByCompanyIdAndWorkflowCode(
            @Param("companyId") UUID companyId,
            @Param("workflowCode") String workflowCode);
}
