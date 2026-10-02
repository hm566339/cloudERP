package com.erp.auth_service.repository.platform;

import com.erp.auth_service.model.platform.PlatformPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformPermissionRepository extends JpaRepository<PlatformPermission, UUID> {
    Optional<PlatformPermission> findByCode(String code);
    boolean existsByCode(String code);
}
