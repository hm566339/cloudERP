package com.erp.workflow.repository;

import com.erp.workflow.entity.PlatformWorkflowRolloutLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlatformWorkflowRolloutLogRepository extends JpaRepository<PlatformWorkflowRolloutLog, UUID> {

    List<PlatformWorkflowRolloutLog> findByPlatformTemplateIdOrderByCreatedAtDesc(UUID platformTemplateId);

    Page<PlatformWorkflowRolloutLog> findByPlatformTemplateIdOrderByCreatedAtDesc(UUID platformTemplateId, Pageable pageable);

    List<PlatformWorkflowRolloutLog> findByTargetOrganizationIdOrderByCreatedAtDesc(UUID targetOrganizationId);

    Page<PlatformWorkflowRolloutLog> findByTargetOrganizationIdOrderByCreatedAtDesc(UUID targetOrganizationId, Pageable pageable);
}

