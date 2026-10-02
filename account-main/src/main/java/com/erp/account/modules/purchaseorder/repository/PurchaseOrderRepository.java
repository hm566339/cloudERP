package com.erp.account.modules.purchaseorder.repository;

import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID>, JpaSpecificationExecutor<PurchaseOrder> {

    Optional<PurchaseOrder> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @EntityGraph(attributePaths = {"items", "items.hsnSacMaster", "vendor", "company", "supplierQuotation", "rfq", "purchaseRequisition"})
    Optional<PurchaseOrder> findWithItemsByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @EntityGraph(attributePaths = {"items", "items.hsnSacMaster", "vendor", "company", "supplierQuotation", "rfq", "purchaseRequisition"})
    Optional<PurchaseOrder> findWithItemsByIdAndIsDeletedFalse(UUID id);

    Optional<PurchaseOrder> findByIdAndIsDeletedFalse(UUID id);

    Optional<PurchaseOrder> findByPoNumberAndCompanyIdAndIsDeletedFalse(String poNumber, UUID companyId);

    boolean existsByPoNumberAndCompanyIdAndIsDeletedFalse(String poNumber, UUID companyId);

    @EntityGraph(attributePaths = {"items", "items.hsnSacMaster", "vendor", "company", "supplierQuotation", "rfq", "purchaseRequisition"})
    List<PurchaseOrder> findByCompanyIdAndVendorIdAndIsDeletedFalse(UUID companyId, UUID vendorId);

    Optional<PurchaseOrder> findBySupplierQuotationIdAndCompanyIdAndIsDeletedFalse(UUID supplierQuotationId, UUID companyId);

    @EntityGraph(attributePaths = {"items", "items.hsnSacMaster", "vendor", "company", "supplierQuotation", "rfq", "purchaseRequisition"})
    List<PurchaseOrder> findByCompanyIdAndStatusInAndIsDeletedFalse(UUID companyId, java.util.Collection<com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus> statuses);

    @Override
    @EntityGraph(attributePaths = {"vendor", "company", "supplierQuotation", "rfq", "purchaseRequisition"})
    Page<PurchaseOrder> findAll(Specification<PurchaseOrder> spec, Pageable pageable);
}
