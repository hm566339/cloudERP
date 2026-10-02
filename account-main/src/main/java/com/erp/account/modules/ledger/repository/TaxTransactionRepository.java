package com.erp.account.modules.ledger.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.ledger.entity.TaxTransaction;

@Repository
public interface TaxTransactionRepository extends JpaRepository<TaxTransaction, UUID> {
    List<TaxTransaction> findByCompanyId(UUID companyId);
    Page<TaxTransaction> findByCompanyId(UUID companyId, Pageable pageable);
    List<TaxTransaction> findBySourceType(String sourceType);
    Page<TaxTransaction> findBySourceType(String sourceType, Pageable pageable);
}
