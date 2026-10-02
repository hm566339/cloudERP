package com.erp.account.modules.gst.repository;

import com.erp.account.modules.gst.entity.GstItc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GstItcRepository extends JpaRepository<GstItc, UUID> {
    Optional<GstItc> findByCompanyIdAndFinancialYearAndMonthAndIsDeletedFalse(UUID companyId, String financialYear, int month);
    List<GstItc> findByCompanyIdAndFinancialYearAndIsDeletedFalse(UUID companyId, String financialYear);
}
