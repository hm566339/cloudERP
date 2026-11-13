package com.erp.workflow.repository;

import com.erp.workflow.entity.OrgWorkflowProvisionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrgWorkflowProvisionLogRepository extends JpaRepository<OrgWorkflowProvisionLog, UUID> {

    List<OrgWorkflowProvisionLog> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Page<OrgWorkflowProvisionLog> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);

    List<OrgWorkflowProvisionLog> findByTemplateIdOrderByCreatedAtDesc(UUID templateId);

    List<OrgWorkflowProvisionLog> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
}

