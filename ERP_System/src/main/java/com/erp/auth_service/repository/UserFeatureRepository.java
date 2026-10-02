package com.erp.auth_service.repository;

import com.erp.auth_service.model.UserFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFeatureRepository extends JpaRepository<UserFeature, UUID> {

    Optional<UserFeature> findByUser_IdAndFeature_Id(UUID userId, UUID featureId);

    Optional<UserFeature> findByUser_IdAndFeature_CodeIgnoreCase(UUID userId, String featureCode);

    List<UserFeature> findAllByUser_Id(UUID userId);

    List<UserFeature> findAllByUser_IdAndActiveTrue(UUID userId);

    @Query("""
        SELECT uf.feature.code
        FROM UserFeature uf
        WHERE uf.user.id = :userId
          AND uf.active = true
          AND uf.revoked = false
          AND uf.feature.active = true
    """)
    List<String> findActiveFeatureCodesByUserId(@Param("userId") UUID userId);

    @Query("""
        SELECT COUNT(uf) > 0
        FROM UserFeature uf
        WHERE uf.user.id = :userId
          AND uf.feature.id = :featureId
    """)
    boolean existsByUserIdAndFeatureId(@Param("userId") UUID userId, @Param("featureId") UUID featureId);
}
