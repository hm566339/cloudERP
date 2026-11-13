package com.erp.workflow.repository;

import com.erp.workflow.entity.OrgWorkflowTemplateTransition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrgWorkflowTemplateTransitionRepository extends JpaRepository<OrgWorkflowTemplateTransition, UUID> {

    List<OrgWorkflowTemplateTransition> findByTemplate_IdAndIsDeletedFalse(UUID templateId);

    void deleteByTemplate_Id(UUID templateId);
}

