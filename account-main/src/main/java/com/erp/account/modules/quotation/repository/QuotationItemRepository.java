package com.erp.account.modules.quotation.repository;

import com.erp.account.modules.quotation.entity.QuotationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuotationItemRepository extends JpaRepository<QuotationItem, UUID> {
    List<QuotationItem> findByQuotationIdAndCompanyIdAndIsDeletedFalse(UUID quotationId, UUID companyId);
}
