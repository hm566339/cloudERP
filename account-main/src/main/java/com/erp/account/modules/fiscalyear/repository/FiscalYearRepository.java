package com.erp.account.modules.fiscalyear.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.fiscalyear.enums.FiscalYearStatus;

@Repository
public interface FiscalYearRepository extends JpaRepository<FiscalYear, UUID>, JpaSpecificationExecutor<FiscalYear> {

    Optional<FiscalYear> findByIdAndCompanyId(UUID id, UUID companyId);

    List<FiscalYear> findByCompanyId(UUID companyId);

    Optional<FiscalYear> findByCompanyIdAndFiscalYear(UUID companyId, String fiscalYear);

    List<FiscalYear> findByCompanyIdAndStatus(UUID companyId, FiscalYearStatus status);

    boolean existsByCompanyIdAndStatus(UUID companyId, FiscalYearStatus status);

    boolean existsByCompanyIdAndStatusAndIdNot(UUID companyId, FiscalYearStatus status, UUID id);

    @Query("select case when count(fy) > 0 then true else false end from FiscalYear fy where fy.company.id = :companyId and fy.id <> :excludeId and fy.startDate <= :endDate and fy.endDate >= :startDate")
    boolean existsOverlappingFiscalYear(@Param("companyId") UUID companyId,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate,
                                         @Param("excludeId") UUID excludeId);

    default boolean hasOverlappingFiscalYear(UUID companyId, LocalDate startDate, LocalDate endDate, UUID excludeId) {
        return existsOverlappingFiscalYear(companyId, startDate, endDate, excludeId);
    }

}
