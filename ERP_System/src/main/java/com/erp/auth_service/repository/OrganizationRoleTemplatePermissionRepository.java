package com.erp.auth_service.repository;

import com.erp.auth_service.model.OrganizationRoleTemplatePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrganizationRoleTemplatePermissionRepository extends JpaRepository<OrganizationRoleTemplatePermission, UUID> {

    List<OrganizationRoleTemplatePermission> findByRoleTemplate_Id(UUID roleTemplateId);

    void deleteByRoleTemplate_Id(UUID roleTemplateId);

    boolean existsByRoleTemplate_IdAndPermission_Id(UUID roleTemplateId, UUID featurePermissionId);
}

