package com.erp.workflow.repository;

import com.erp.workflow.entity.PlatformWorkflowTemplateTransition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlatformWorkflowTemplateTransitionRepository extends JpaRepository<PlatformWorkflowTemplateTransition, UUID> {

    List<PlatformWorkflowTemplateTransition> findByTemplate_IdAndIsDeletedFalse(UUID templateId);

    void deleteByTemplate_Id(UUID templateId);
}

