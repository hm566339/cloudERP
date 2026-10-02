package com.erp.auth_service.repository.platform;

import com.erp.auth_service.model.platform.PlatformRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformRoleRepository extends JpaRepository<PlatformRole, UUID> {
    Optional<PlatformRole> findByCode(String code);
    boolean existsByCode(String code);
}
