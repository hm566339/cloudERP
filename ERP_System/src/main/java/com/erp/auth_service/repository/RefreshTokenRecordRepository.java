package com.erp.auth_service.repository;

import com.erp.auth_service.model.RefreshTokenRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRecordRepository extends JpaRepository<RefreshTokenRecord, UUID> {
    Optional<RefreshTokenRecord> findByTokenHash(String tokenHash);
    List<RefreshTokenRecord> findAllByFamilyId(UUID familyId);
}