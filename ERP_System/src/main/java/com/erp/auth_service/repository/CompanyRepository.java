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

    @Query("SELECT c FROM Company c WHERE LOWER(TRIM(c.companyCode)) = LOWER(TRIM(:companyCode))")
    Optional<Company> findByCompanyCode(@Param("companyCode") String companyCode);

    @Query("SELECT c FROM Company c WHERE LOWER(TRIM(c.companyCode)) = LOWER(TRIM(:companyCode))")
    Optional<Company> findByCompanyCodeIgnoreCase(@Param("companyCode") String companyCode);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN TRUE ELSE FALSE END FROM Company c WHERE LOWER(TRIM(c.companyCode)) = LOWER(TRIM(:companyCode))")
    boolean existsByCompanyCode(@Param("companyCode") String companyCode);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN TRUE ELSE FALSE END FROM Company c WHERE LOWER(TRIM(c.companyCode)) = LOWER(TRIM(:companyCode))")
    boolean existsByCompanyCodeIgnoreCase(@Param("companyCode") String companyCode);

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

    @Query("SELECT c FROM Company c WHERE c.id = :id AND LOWER(TRIM(c.companyCode)) = LOWER(TRIM(:companyCode))")
    Optional<Company> findByIdAndCompanyCode(@Param("id") UUID id, @Param("companyCode") String companyCode);

    @Query("SELECT c FROM Company c WHERE c.id = :id AND LOWER(TRIM(c.companyCode)) = LOWER(TRIM(:companyCode))")
    Optional<Company> findByIdAndCompanyCodeIgnoreCase(@Param("id") UUID id, @Param("companyCode") String companyCode);

    Optional<Company> findByIdAndOrganization_IdAndActiveTrue(UUID id, UUID organizationId);

    long countByOrganization_IdAndActiveTrue(UUID organizationId);

    long countByOrganization_Id(UUID organizationId);

    java.util.List<Company> findByOrganization_Id(UUID organizationId);

    java.util.List<Company> findByOrganization_IdAndActiveTrue(UUID organizationId);
}
