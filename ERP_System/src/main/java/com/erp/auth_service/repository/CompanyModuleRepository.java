package com.erp.auth_service.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanyModule;

public interface CompanyModuleRepository extends JpaRepository<CompanyModule, UUID> {

    // ================= EXISTING =================

    Optional<CompanyModule> findByCompany_IdAndModule_IdAndActiveTrue(UUID companyId, UUID moduleId);

    Page<CompanyModule> findByActive(Boolean active, Pageable pageable);

    // ================= FIND BY COMPANY =================

    // All modules for a specific company
    Optional<CompanyModule> findByCompany_Id(UUID companyId);

    // All ACTIVE modules for a specific company
    List<CompanyModule> findByCompany_IdAndActiveTrue(UUID companyId);

    // All INACTIVE modules for a specific company
    List<CompanyModule> findByCompany_IdAndActiveFalse(UUID companyId);

    // All modules for a specific company (both active and inactive)
    List<CompanyModule> findAllByCompany_Id(UUID companyId);

    // Paginated modules for a specific company
    Page<CompanyModule> findByCompany_Id(UUID companyId, Pageable pageable);

    // Paginated active modules for a specific company
    Page<CompanyModule> findByCompany_IdAndActiveTrue(UUID companyId, Pageable pageable);

    // Single mapping by company + module
    Optional<CompanyModule> findByCompany_IdAndModule_Id(UUID companyId, UUID moduleId);

    // Check if a company has a specific module
    boolean existsByCompany_IdAndModule_Id(UUID companyId, UUID moduleId);

    // Check if a company has an active specific module
    boolean existsByCompany_IdAndModule_IdAndActiveTrue(UUID companyId, UUID moduleId);

    // ================= FIND BY MODULE =================

    // All companies that have a specific module
    List<CompanyModule> findByModule_Id(UUID moduleId);

    // All companies that have a specific module and it's active
    List<CompanyModule> findByModule_IdAndActiveTrue(UUID moduleId);

    // Paginated companies for a specific module
    Page<CompanyModule> findByModule_Id(UUID moduleId, Pageable pageable);

    // Check if a module is assigned to any company
    boolean existsByModule_Id(UUID moduleId);

    Optional<CompanyModule> findByCompany_IdAndModule_NameIgnoreCaseAndActiveTrue(UUID id, String module);
}