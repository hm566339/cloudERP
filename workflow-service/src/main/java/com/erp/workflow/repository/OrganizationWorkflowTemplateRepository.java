package com.erp.workflow.repository;

import com.erp.workflow.entity.OrganizationWorkflowTemplate;
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
public interface OrganizationWorkflowTemplateRepository extends JpaRepository<OrganizationWorkflowTemplate, UUID> {

    Optional<OrganizationWorkflowTemplate> findByIdAndOrganizationIdAndIsDeletedFalse(UUID id, UUID organizationId);

    List<OrganizationWorkflowTemplate> findByOrganizationIdAndIsDeletedFalse(UUID organizationId);

    Page<OrganizationWorkflowTemplate> findByOrganizationIdAndIsDeletedFalse(UUID organizationId, Pageable pageable);

    Optional<OrganizationWorkflowTemplate> findFirstByOrganizationIdAndDocumentTypeAndIsDefaultTrueAndIsActiveTrueAndIsDeletedFalseOrderByVersionDesc(
            UUID organizationId, String documentType);

    List<OrganizationWorkflowTemplate> findByOrganizationIdAndDocumentTypeAndIsActiveTrueAndIsDeletedFalse(
            UUID organizationId, String documentType);

    boolean existsByOrganizationIdAndTemplateCodeAndVersionAndIsDeletedFalse(
            UUID organizationId, String templateCode, Integer version);

    @Query("SELECT MAX(t.version) FROM OrganizationWorkflowTemplate t WHERE t.organizationId = :organizationId AND t.templateCode = :templateCode")
    Integer findMaxVersionByOrganizationIdAndTemplateCode(
            @Param("organizationId") UUID organizationId,
            @Param("templateCode") String templateCode);
}

