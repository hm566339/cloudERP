package com.erp.auth_service.repository;

import com.erp.auth_service.model.FeaturePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeaturePermissionRepository extends JpaRepository<FeaturePermission, UUID> {

    Optional<FeaturePermission> findByPermissionCodeIgnoreCase(String permissionCode);

    Optional<FeaturePermission> findByFeature_CodeIgnoreCaseAndActionIgnoreCase(String featureCode, String action);

    List<FeaturePermission> findByFeature_Id(UUID featureId);

    List<FeaturePermission> findByActiveTrue();
}
