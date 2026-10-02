package com.erp.auth_service.repository;

import com.erp.auth_service.model.Feature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeatureRepository extends JpaRepository<Feature, UUID> {

    Optional<Feature> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<Feature> findByActiveTrue();

    List<Feature> findByModuleNameIgnoreCase(String moduleName);
}
