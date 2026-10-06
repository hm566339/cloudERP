package com.erp.auth_service.repository;

import com.erp.auth_service.model.Company;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository
        extends JpaRepository<Company, UUID> {

    Optional<Company> findByCompanyCode(String companyCode);

    boolean existsByCompanyCode(String companyCode);

    boolean existsByCompanyName(String companyName);

    @Query("""
            SELECT c
            FROM Company c
            WHERE
                (
                    :search IS NULL
                    OR LOWER(c.companyName)
                        LIKE %:search%
                    OR LOWER(c.companyCode)
                        LIKE %:search%
                )
            AND
                (
                    :active IS NULL
                    OR c.active = :active
                )
            """)
    Page<Company> findCompanies(
            @Param("search") String search,
            @Param("active") Boolean active,
            Pageable pageable);

    @Query("""
            SELECT c
            FROM Company c
            WHERE c.organization.id = :organizationId
            AND (
                :search IS NULL
                OR LOWER(c.companyName) LIKE %:search%
                OR LOWER(c.companyCode) LIKE %:search%
            )
            AND (
                :active IS NULL
                OR c.active = :active
            )
            """)
    Page<Company> findCompaniesByOrganization(
            @Param("organizationId") UUID organizationId,
            @Param("search") String search,
            @Param("active") Boolean active,
            Pageable pageable);

    @Query(value = """
            SELECT *
            FROM company
            WHERE company_code ~ '^[0-9]+$'
            ORDER BY company_code DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<Company> findLastNumericCompanyCode();

    Optional<Company> findByIdAndCompanyCode(UUID id, String companyCode);

    Optional<Company> findByIdAndOrganization_IdAndActiveTrue(UUID id, UUID organizationId);

    long countByOrganization_IdAndActiveTrue(UUID organizationId);

    long countByOrganization_Id(UUID organizationId);

    java.util.List<Company> findByOrganization_Id(UUID organizationId);
}