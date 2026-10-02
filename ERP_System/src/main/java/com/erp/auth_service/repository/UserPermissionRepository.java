package com.erp.auth_service.repository;

import com.erp.auth_service.model.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, UUID> {

    Optional<UserPermission> findByUser_IdAndPermission_Id(UUID userId, UUID permissionId);

    List<UserPermission> findByUser_Id(UUID userId);

    @Query("SELECT up.permission.permissionCode FROM UserPermission up " +
           "WHERE up.user.id = :userId " +
           "AND up.active = true " +
           "AND up.revoked = false " +
           "AND up.permission.active = true " +
           "AND up.permission.feature.active = true")
    List<String> findActivePermissionCodesByUserId(@Param("userId") UUID userId);

    @Query("SELECT CASE WHEN COUNT(up) > 0 THEN true ELSE false END FROM UserPermission up " +
           "WHERE up.user.id = :userId " +
           "AND LOWER(up.permission.permissionCode) = LOWER(:permissionCode) " +
           "AND up.active = true " +
           "AND up.revoked = false " +
           "AND up.permission.active = true " +
           "AND up.permission.feature.active = true")
    boolean hasActivePermission(@Param("userId") UUID userId, @Param("permissionCode") String permissionCode);
}
