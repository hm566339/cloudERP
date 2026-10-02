package com.erp.account.modules.gst.repository;

import com.erp.account.modules.gst.entity.GstOutputTax;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GstOutputTaxRepository extends JpaRepository<GstOutputTax, UUID> {
    List<GstOutputTax> findByCompanyIdAndIsDeletedFalse(UUID companyId);
    List<GstOutputTax> findByInvoiceIdAndIsDeletedFalse(UUID invoiceId);
}
