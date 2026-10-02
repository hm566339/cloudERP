package com.erp.inventory.modules.period.repository;

import com.erp.inventory.modules.period.entity.InventoryPeriod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryPeriodRepository extends JpaRepository<InventoryPeriod, UUID> {

    Optional<InventoryPeriod> findByIdAndCompanyId(UUID id, UUID companyId);

    List<InventoryPeriod> findAllByCompanyId(UUID companyId);

    Page<InventoryPeriod> findAllByCompanyId(UUID companyId, Pageable pageable);

    boolean existsByPeriodNameIgnoreCaseAndCompanyId(String periodName, UUID companyId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM InventoryPeriod p WHERE p.companyId = :companyId AND p.id != :excludeId AND " +
            "(p.startDate <= :endDate AND p.endDate >= :startDate)")
    long countOverlappingPeriods(@org.springframework.data.repository.query.Param("companyId") UUID companyId, 
                                 @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate, 
                                 @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate,
                                 @org.springframework.data.repository.query.Param("excludeId") UUID excludeId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM InventoryPeriod p WHERE p.companyId = :companyId AND :date >= p.startDate AND :date <= p.endDate")
    Optional<InventoryPeriod> findByCompanyIdAndDate(@org.springframework.data.repository.query.Param("companyId") UUID companyId, 
                                                     @org.springframework.data.repository.query.Param("date") java.time.LocalDate date);
}
