package com.erp.auth_service.repository;

import com.erp.auth_service.model.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface PlanRepository extends JpaRepository<Plan, UUID> {
    Optional<Plan> findByCodeAndActiveTrue(String code);
}