package com.erp.workflow.repository;

import com.erp.workflow.entity.PlatformWorkflowTemplate;
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
public interface PlatformWorkflowTemplateRepository extends JpaRepository<PlatformWorkflowTemplate, UUID> {

    Optional<PlatformWorkflowTemplate> findByIdAndIsDeletedFalse(UUID id);

    List<PlatformWorkflowTemplate> findByIsDeletedFalse();

    Page<PlatformWorkflowTemplate> findByIsDeletedFalse(Pageable pageable);

    List<PlatformWorkflowTemplate> findByIsActiveTrueAndIsDeletedFalse();

    List<PlatformWorkflowTemplate> findByIsActiveTrueAndIsDefaultTrueAndIsDeletedFalse();

    Optional<PlatformWorkflowTemplate> findFirstByDocumentTypeAndIsDefaultTrueAndIsActiveTrueAndIsDeletedFalseOrderByVersionDesc(
            String documentType);

    List<PlatformWorkflowTemplate> findByDocumentTypeAndIsActiveTrueAndIsDeletedFalse(String documentType);

    boolean existsByTemplateCodeAndVersionAndIsDeletedFalse(String templateCode, Integer version);

    Optional<PlatformWorkflowTemplate> findTopByTemplateCodeAndIsDeletedFalseOrderByVersionDesc(String templateCode);

    @Query("SELECT MAX(t.version) FROM PlatformWorkflowTemplate t WHERE t.templateCode = :templateCode")
    Integer findMaxVersionByTemplateCode(@Param("templateCode") String templateCode);
}

