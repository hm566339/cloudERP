package com.erp.auth_service.repository;

import com.erp.auth_service.model.SubscriptionPlanModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPlanModuleRepository extends JpaRepository<SubscriptionPlanModule, UUID> {

    List<SubscriptionPlanModule> findByPlan_Id(UUID planId);

    List<SubscriptionPlanModule> findByPlan_IdAndActiveTrue(UUID planId);

    Optional<SubscriptionPlanModule> findByPlan_IdAndModule_Id(UUID planId, UUID moduleId);

    boolean existsByPlan_IdAndModule_Id(UUID planId, UUID moduleId);

    boolean existsByPlan_IdAndModule_IdAndActiveTrue(UUID planId, UUID moduleId);

    void deleteByPlan_IdAndModule_Id(UUID planId, UUID moduleId);

    @Query("SELECT spm FROM SubscriptionPlanModule spm JOIN FETCH spm.module WHERE spm.plan.id = :planId")
    List<SubscriptionPlanModule> findAllWithModuleByPlanId(@Param("planId") UUID planId);
}
