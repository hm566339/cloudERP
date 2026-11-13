package com.erp.workflow.repository;

import com.erp.workflow.entity.OrgWorkflowTemplateSla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrgWorkflowTemplateSlaRepository extends JpaRepository<OrgWorkflowTemplateSla, UUID> {

    List<OrgWorkflowTemplateSla> findByStage_IdAndIsDeletedFalse(UUID stageId);

    void deleteByStage_Id(UUID stageId);
}

