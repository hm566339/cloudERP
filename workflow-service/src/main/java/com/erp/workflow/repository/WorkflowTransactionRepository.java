package com.erp.workflow.repository;

import com.erp.workflow.entity.WorkflowTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowTransactionRepository extends JpaRepository<WorkflowTransaction, UUID> {

    Optional<WorkflowTransaction> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    Optional<WorkflowTransaction> findByCompanyIdAndDocumentTypeAndDocumentIdAndIsDeletedFalse(
            UUID companyId, String documentType, UUID documentId);

    Optional<WorkflowTransaction> findByCompanyIdAndModuleNameAndEntityTypeAndEntityIdAndIsDeletedFalse(
            UUID companyId, String moduleName, String entityType, UUID entityId);

    Page<WorkflowTransaction> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    Page<WorkflowTransaction> findByCompanyIdAndStatusAndIsDeletedFalse(
            UUID companyId, String status, Pageable pageable);

    Page<WorkflowTransaction> findByCompanyIdAndModuleNameAndIsDeletedFalse(
            UUID companyId, String moduleName, Pageable pageable);

    Page<WorkflowTransaction> findByCompanyIdAndInitiatedByAndIsDeletedFalse(
            UUID companyId, UUID initiatedBy, Pageable pageable);

    @Query("SELECT wt FROM WorkflowTransaction wt WHERE wt.companyId = :companyId " +
           "AND (:moduleName IS NULL OR wt.moduleName = :moduleName) " +
           "AND (:documentType IS NULL OR wt.documentType = :documentType) " +
           "AND (:status IS NULL OR wt.status = :status) " +
           "AND wt.isDeleted = false")
    Page<WorkflowTransaction> searchTransactions(
            @Param("companyId") UUID companyId,
            @Param("moduleName") String moduleName,
            @Param("documentType") String documentType,
            @Param("status") String status,
            Pageable pageable);

    boolean existsByCompanyIdAndDocumentTypeAndDocumentIdAndIsDeletedFalse(
            UUID companyId, String documentType, UUID documentId);
}
