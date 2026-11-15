package com.erp.crm.modules.quotation.repository;

import com.erp.crm.modules.quotation.entity.CrmQuotationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmQuotationItemRepository extends JpaRepository<CrmQuotationItem, UUID> {
    List<CrmQuotationItem> findByCompanyIdAndQuotationIdAndIsDeletedFalseOrderByItemOrderAsc(UUID companyId, UUID quotationId);
}

