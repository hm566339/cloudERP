package com.erp.workflow.repository;

import com.erp.workflow.entity.DocumentFlowConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentFlowConfigRepository extends JpaRepository<DocumentFlowConfiguration, UUID> {

    Optional<DocumentFlowConfiguration> findByCompanyIdAndModuleNameAndIsActiveTrueAndIsDeletedFalse(UUID companyId, String moduleName);

    Optional<DocumentFlowConfiguration> findByCompanyIdAndModuleNameAndFlowNameAndIsDeletedFalse(UUID companyId, String moduleName, String flowName);

    List<DocumentFlowConfiguration> findByCompanyIdAndIsDeletedFalse(UUID companyId);

    List<DocumentFlowConfiguration> findByCompanyIdAndModuleNameAndIsDeletedFalse(UUID companyId, String moduleName);
}
