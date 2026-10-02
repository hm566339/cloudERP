package com.erp.account.modules.gst.repository;

import com.erp.account.modules.gst.entity.GstInputTax;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GstInputTaxRepository extends JpaRepository<GstInputTax, UUID> {
    List<GstInputTax> findByCompanyIdAndIsDeletedFalse(UUID companyId);
    List<GstInputTax> findByPurchaseInvoiceIdAndIsDeletedFalse(UUID purchaseInvoiceId);
}
