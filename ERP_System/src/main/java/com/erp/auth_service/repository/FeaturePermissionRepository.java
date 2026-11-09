package com.erp.auth_service.repository;

import com.erp.auth_service.model.FeaturePermission;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeaturePermissionRepository extends JpaRepository<FeaturePermission, UUID> {

    @EntityGraph(attributePaths = {"feature"})
    Optional<FeaturePermission> findByPermissionCodeIgnoreCase(String permissionCode);

    @EntityGraph(attributePaths = {"feature"})
    Optional<FeaturePermission> findByFeature_CodeIgnoreCaseAndActionIgnoreCase(String featureCode, String action);

    @EntityGraph(attributePaths = {"feature"})
    List<FeaturePermission> findByFeature_Id(UUID featureId);

    @EntityGraph(attributePaths = {"feature"})
    List<FeaturePermission> findByActiveTrue();
}
