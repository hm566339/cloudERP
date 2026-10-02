package com.erp.account.modules.gst.repository;

import com.erp.account.modules.gst.entity.GstTaxSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GstTaxSummaryRepository extends JpaRepository<GstTaxSummary, UUID> {
    Optional<GstTaxSummary> findByCompanyIdAndFinancialYearAndMonthAndIsDeletedFalse(UUID companyId, String financialYear, int month);
    List<GstTaxSummary> findByCompanyIdAndFinancialYearAndIsDeletedFalse(UUID companyId, String financialYear);
}
