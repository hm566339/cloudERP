package com.erp.auth_service.repository;

import com.erp.auth_service.model.ModuleRoute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.util.Streamable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ModuleRouteRepository extends JpaRepository<ModuleRoute, UUID> {

    boolean existsByModule_IdAndApiPatternIgnoreCase(UUID moduleId, String apiPattern);

    boolean existsByModule_IdAndApiPatternIgnoreCaseAndIdNot(UUID moduleId, String apiPattern, UUID id);

    Page<ModuleRoute> findByModule_Id(UUID moduleId, Pageable pageable);

    Page<ModuleRoute> findByActive(Boolean active, Pageable pageable);

    Page<ModuleRoute> findByModule_IdAndActive(UUID moduleId, Boolean active, Pageable pageable);

    Streamable<ModuleRoute> findByActiveTrueOrderByRouteOrderAsc();

    boolean existsByApiPattern(String string);

    Optional<ModuleRoute> findByApiPattern(String routePattern);

    List<ModuleRoute> findByModule_Id(UUID id);

    Optional<ModuleRoute> findFirstByModule_Id(UUID id);

    Optional<ModuleRoute> findByModule_IdAndApiPatternIgnoreCase(UUID moduleId, String apiPattern);
}
