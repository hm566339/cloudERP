package com.erp.auth_service.repository.platform;

import com.erp.auth_service.model.platform.PlatformAdmin;
import com.erp.auth_service.model.platform.PlatformAdminStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformAdminRepository extends JpaRepository<PlatformAdmin, UUID> {

    Optional<PlatformAdmin> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByStatus(PlatformAdminStatus status);

    @Query("SELECT COUNT(a) FROM PlatformAdmin a JOIN a.roles r WHERE a.status = :status AND r.code = :roleCode")
    long countByStatusAndRoleCode(@Param("status") PlatformAdminStatus status, @Param("roleCode") String roleCode);
}
