package com.erp.auth_service.repository;

import com.erp.auth_service.model.SubscriptionPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {

    Optional<SubscriptionPlan> findByCodeIgnoreCase(String code);

    Optional<SubscriptionPlan> findByCodeIgnoreCaseAndActiveTrue(String code);

    Optional<SubscriptionPlan> findFirstByIsTrialTrueAndActiveTrue();

    List<SubscriptionPlan> findByActiveTrue();

    boolean existsByCodeIgnoreCase(String code);

    Optional<SubscriptionPlan> findByRazorpayPlanId(String razorpayPlanId);

    @Query("SELECT p FROM SubscriptionPlan p WHERE " +
           "(:active IS NULL OR p.active = :active) AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<SubscriptionPlan> findAllWithFilter(@Param("search") String search, @Param("active") Boolean active, Pageable pageable);
}
