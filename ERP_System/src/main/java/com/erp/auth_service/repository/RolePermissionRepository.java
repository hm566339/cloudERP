package com.erp.auth_service.repository;

import com.erp.auth_service.model.RolePermission;
import com.erp.auth_service.utility.RolePermissionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermissionId> {
    List<RolePermission> findByRole_Id(UUID roleId);
    void deleteByRole_Id(UUID roleId);
}
