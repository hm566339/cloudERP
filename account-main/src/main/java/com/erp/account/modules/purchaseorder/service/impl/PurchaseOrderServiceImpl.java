package com.erp.account.modules.purchaseorder.service.impl;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherRequest;
import com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse;
import com.erp.account.modules.purchaseorder.dto.*;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderItem;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.purchaseorder.mapper.PurchaseOrderMapper;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderItemRepository;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.purchaseorder.repository.spec.PurchaseOrderSpecification;
import com.erp.account.modules.purchaseorder.service.PurchaseOrderService;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import com.erp.account.modules.supplierquotation.entity.SupplierQuotation;
import com.erp.account.modules.supplierquotation.entity.SupplierQuotationItem;
import com.erp.account.modules.supplierquotation.entity.SupplierQuotationStatus;
import com.erp.account.modules.supplierquotation.repository.SupplierQuotationRepository;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final CompanyRepository companyRepository;
    private final VendorRepository vendorRepository;
    private final HsnSacMasterRepository hsnSacMasterRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final PurchaseOrderMapper purchaseOrderMapper;
    private final SupplierQuotationRepository supplierQuotationRepository;
    private final com.erp.account.modules.paymentvoucher.service.PaymentVoucherService paymentVoucherService;
    private final com.erp.account.modules.bankaccount.repository.BankAccountRepository bankAccountRepository;
    private final com.erp.account.common.service.WarehouseLookupService warehouseLookupService;
    private final WorkflowClient workflowClient;

    @Override
    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(UUID companyId, PurchaseOrderRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Company not found"));

        Vendor vendor = vendorRepository.findByIdAndCompanyIdAndNotDeleted(request.getVendorId(), resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Vendor not found with ID: " + request.getVendorId()));

        String poNumber = request.getPoNumber();
        if (StringUtils.isBlank(poNumber)) {
            poNumber = voucherSequenceService.generateNextPurchaseOrderNumber(resolvedCompanyId, request.getPoDate());
        } else {
            if (purchaseOrderRepository.existsByPoNumberAndCompanyIdAndIsDeletedFalse(poNumber.trim(),
                    resolvedCompanyId)) {
                throw new BadRequestException("Purchase Order number already exists: " + poNumber);
            }
            poNumber = poNumber.trim();
        }

        PurchaseOrder po = PurchaseOrder.builder()
                .companyId(resolvedCompanyId)
                .company(company)
                .vendorId(vendor.getId())
                .vendor(vendor)
                .poNumber(poNumber)
                .poDate(request.getPoDate())
                .expectedDeliveryDate(request.getExpectedDeliveryDate())
                .currency(StringUtils.isNotBlank(request.getCurrency()) ? request.getCurrency() : "INR")
                .exchangeRate(request.getExchangeRate() != null ? request.getExchangeRate() : BigDecimal.ONE)
                .placeOfSupplyStateId(request.getPlaceOfSupplyStateId())
                .placeOfSupplyStateCode(request.getPlaceOfSupplyStateCode())
                .vendorAddressId(request.getVendorAddressId())
                .purchaseAddressLine1(request.getPurchaseAddressLine1())
                .purchaseAddressLine2(request.getPurchaseAddressLine2())
                .purchaseCity(request.getPurchaseCity())
                .purchaseState(request.getPurchaseState())
                .purchaseCountry(request.getPurchaseCountry())
                .purchasePostalCode(request.getPurchasePostalCode())
                .shippingAddressSnapshot(request.getShippingAddressSnapshot())
                .referenceNumber(request.getReferenceNumber())
                .paymentTerms(request.getPaymentTerms())
                .deliveryTerms(request.getDeliveryTerms())
                .termsAndConditions(request.getTermsAndConditions())
                .notes(request.getNotes())
                .freightCharges(request.getFreightCharges() != null ? request.getFreightCharges() : BigDecimal.ZERO)
                .otherCharges(request.getOtherCharges() != null ? request.getOtherCharges() : BigDecimal.ZERO)
                .advanceRequired(request.getAdvanceRequired() != null ? request.getAdvanceRequired() : false)
                .advanceAmount(request.getAdvanceAmount() != null ? request.getAdvanceAmount() : BigDecimal.ZERO)
                .status(PurchaseOrderStatus.DRAFT)
                .items(new ArrayList<>())
                .build();

        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            PurchaseOrderItem item = buildPurchaseOrderItem(itemReq, resolvedCompanyId);
            po.addPurchaseOrderItem(item);
        }

        po.calculateTotals();
        PurchaseOrder savedPo = purchaseOrderRepository.save(po);
        log.info("Created Purchase Order {} with ID {}", savedPo.getPoNumber(), savedPo.getId());
        return toResponseWithWarehouse(savedPo);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse createFromSupplierQuotation(UUID companyId, UUID quotationId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        SupplierQuotation quotation = supplierQuotationRepository.findForUpdate(quotationId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier quotation not found: " + quotationId));
        if (quotation.getStatus() != SupplierQuotationStatus.AWARDED) {
            throw new BadRequestException("Only AWARDED supplier quotations can create a Purchase Order");
        }
        if (purchaseOrderRepository
                .findBySupplierQuotationIdAndCompanyIdAndIsDeletedFalse(quotationId, resolvedCompanyId).isPresent()) {
            throw new BadRequestException("A Purchase Order already exists for this supplier quotation");
        }

        PurchaseOrderRequest request = PurchaseOrderRequest.builder()
                .vendorId(quotation.getVendorId())
                .poDate(LocalDate.now())
                .expectedDeliveryDate(quotation.getRfq() != null ? quotation.getRfq().getExpectedDeliveryDate() : null)
                .paymentTerms(quotation.getPaymentTerms())
                .deliveryTerms(quotation.getDeliveryTerms())
                .freightCharges(quotation.getFreight())
                .notes(quotation.getRemarks())
                .items(quotation.getItems().stream().map(this::toPurchaseOrderItemRequest).toList())
                .build();

        PurchaseOrderResponse created = createPurchaseOrder(resolvedCompanyId, request);
        PurchaseOrder po = purchaseOrderRepository
                .findByPoNumberAndCompanyIdAndIsDeletedFalse(created.getPoNumber(), resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Created Purchase Order not found"));
        po.setSupplierQuotationId(quotation.getId());
        po.setRfqId(quotation.getRfqId());
        po.setPurchaseRequisitionId(quotation.getRfq() != null ? quotation.getRfq().getPurchaseRequisitionId() : null);
        return toResponseWithWarehouse(purchaseOrderRepository.save(po));
    }

    private PurchaseOrderItemRequest toPurchaseOrderItemRequest(SupplierQuotationItem item) {
        return PurchaseOrderItemRequest.builder()
                .itemId(item.getItemId()).itemName(item.getItemName()).description(item.getDescription())
                .itemType(item.getItemType()).orderedQuantity(item.getQuantity()).unit(item.getUnit())
                .unitPrice(item.getUnitPrice())
                .discountPercent(item.getDiscount() != null && item.getQuantity() != null && item.getUnitPrice() != null
                        && item.getUnitPrice().signum() > 0
                                ? item.getDiscount().multiply(BigDecimal.valueOf(100)).divide(
                                        item.getQuantity().multiply(item.getUnitPrice()), 4,
                                        java.math.RoundingMode.HALF_UP)
                                : BigDecimal.ZERO)
                .cgstRate(item.getCgstRate()).sgstRate(item.getSgstRate()).igstRate(item.getIgstRate())
                .cessRate(item.getCessRate())
                .hsnSacId(item.getHsnSacId()).build();
    }

    @Override
    @Transactional
    public PurchaseOrderResponse updatePurchaseOrder(UUID companyId, UUID poId, PurchaseOrderRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        PurchaseOrder po = purchaseOrderRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException(
                    "Only DRAFT purchase orders can be updated. Current status: " + po.getStatus());
        }

        Vendor vendor = vendorRepository.findByIdAndCompanyIdAndNotDeleted(request.getVendorId(), resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Vendor not found with ID: " + request.getVendorId()));

        po.setVendorId(vendor.getId());
        po.setVendor(vendor);
        po.setPoDate(request.getPoDate());
        po.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        po.setCurrency(StringUtils.isNotBlank(request.getCurrency()) ? request.getCurrency() : po.getCurrency());
        po.setExchangeRate(request.getExchangeRate() != null ? request.getExchangeRate() : po.getExchangeRate());
        po.setPlaceOfSupplyStateId(request.getPlaceOfSupplyStateId());
        po.setPlaceOfSupplyStateCode(request.getPlaceOfSupplyStateCode());
        po.setVendorAddressId(request.getVendorAddressId());
        po.setPurchaseAddressLine1(request.getPurchaseAddressLine1());
        po.setPurchaseAddressLine2(request.getPurchaseAddressLine2());
        po.setPurchaseCity(request.getPurchaseCity());
        po.setPurchaseState(request.getPurchaseState());
        po.setPurchaseCountry(request.getPurchaseCountry());
        po.setPurchasePostalCode(request.getPurchasePostalCode());
        po.setShippingAddressSnapshot(request.getShippingAddressSnapshot());
        po.setReferenceNumber(request.getReferenceNumber());
        po.setPaymentTerms(request.getPaymentTerms());
        po.setDeliveryTerms(request.getDeliveryTerms());
        po.setTermsAndConditions(request.getTermsAndConditions());
        po.setNotes(request.getNotes());
        po.setFreightCharges(request.getFreightCharges() != null ? request.getFreightCharges() : BigDecimal.ZERO);
        po.setOtherCharges(request.getOtherCharges() != null ? request.getOtherCharges() : BigDecimal.ZERO);
        po.setAdvanceRequired(request.getAdvanceRequired() != null ? request.getAdvanceRequired() : false);
        po.setAdvanceAmount(request.getAdvanceAmount() != null ? request.getAdvanceAmount() : BigDecimal.ZERO);

        // Clear existing items and replace
        po.getItems().clear();
        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            PurchaseOrderItem item = buildPurchaseOrderItem(itemReq, resolvedCompanyId);
            po.addPurchaseOrderItem(item);
        }

        po.calculateTotals();
        PurchaseOrder updatedPo = purchaseOrderRepository.save(po);
        log.info("Updated Purchase Order {} with ID {}", updatedPo.getPoNumber(), updatedPo.getId());
        return toResponseWithWarehouse(updatedPo);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderResponse getPurchaseOrderById(UUID companyId, UUID poId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        PurchaseOrder po = purchaseOrderRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));
        return toResponseWithWarehouse(po);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseOrderResponse> getAllPurchaseOrders(UUID companyId, Pageable pageable,
            PurchaseOrderFilterDto filter) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        Specification<PurchaseOrder> spec = PurchaseOrderSpecification.getPurchaseOrderSpec(
                resolvedCompanyId,
                filter != null ? filter.getStatus() : null,
                filter != null ? filter.getVendorId() : null,
                filter != null ? filter.getFromDate() : null,
                filter != null ? filter.getToDate() : null,
                filter != null ? filter.getSearch() : null);

        Page<PurchaseOrder> page = purchaseOrderRepository.findAll(spec, pageable);
        return enrichWarehouseNames(page.map(purchaseOrderMapper::toResponse));
    }

    @Override
    @Transactional
    public PurchaseOrderResponse submitForApproval(UUID companyId, UUID poId) {
        return submitForApproval(companyId, poId, null);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse submitForApproval(UUID companyId, UUID poId, String comments) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        PurchaseOrder po = purchaseOrderRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException(
                    "Only DRAFT purchase orders can be submitted for approval. Current status: " + po.getStatus());
        }

        // Prevent duplicate workflow submission
        try {
            WorkflowTransactionDto existingTx = workflowClient.getWorkflowByDocument(resolvedCompanyId, "PURCHASE_ORDER", po.getId());
            if (existingTx != null && ("PENDING".equalsIgnoreCase(existingTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existingTx.getStatus()))) {
                throw new BadRequestException("Purchase Order is already submitted for approval with transaction: " + existingTx.getId());
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("No existing workflow transaction found for purchase order {}", poId);
        }

        try {
            workflowClient.submitWorkflow(
                    resolvedCompanyId,
                    "PURCHASE_ORDER",
                    po.getId(),
                    po.getPoNumber(),
                    comments != null ? comments : "Submitted purchase order for approval"
            );
            log.info("Purchase Order {} submitted for approval to workflow-service", po.getPoNumber());
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Workflow engine submission failed for purchase order {}. Reverting to DRAFT. Error: {}", poId, e.getMessage());
            throw new BadRequestException("Failed to submit purchase order for workflow approval: " + e.getMessage());
        }

        po.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Purchase Order {} submitted for approval", saved.getPoNumber());
        return toResponseWithWarehouse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse approvePurchaseOrder(UUID companyId, UUID poId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        PurchaseOrder po = purchaseOrderRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        String currentUserRole = com.erp.account.security.CurrentUserContext.getUserRole();
        UUID currentUserId = TenantUtils.getCurrentUserId();

        log.info("Purchase Order approval request: poId={}, currentUserId={}, currentUserRole={}, createdBy={}",
                poId, currentUserId, currentUserRole, po.getCreatedBy());

        if (po.getStatus() != PurchaseOrderStatus.PENDING_APPROVAL) {
            throw new BadRequestException(
                    "Only PENDING_APPROVAL purchase orders can be approved. Current status: " + po.getStatus());
        }

        // Prevent bypassing active pending workflow
        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(resolvedCompanyId, "PURCHASE_ORDER", poId);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BadRequestException("Purchase Order cannot be approved directly while workflow approval is pending. Please approve via the workflow.");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for purchase order {}: {}", poId, e.getMessage());
        }

        boolean isAdminOrFinance = "SYSTEM_ADMIN".equalsIgnoreCase(currentUserRole)
                || "FINANCE_MANAGER".equalsIgnoreCase(currentUserRole);

        if (currentUserId != null && currentUserId.equals(po.getCreatedBy()) && !isAdminOrFinance) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Creator cannot approve their own document.");
        }

        po.setStatus(PurchaseOrderStatus.APPROVED);
        po.setApprovedBy(currentUserId);
        po.setApprovedAt(LocalDateTime.now());
        po.setRejectionReason(null);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Purchase Order {} approved by {}", saved.getPoNumber(), currentUserId);
        return toResponseWithWarehouse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse rejectPurchaseOrder(UUID companyId, UUID poId, String reason) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        PurchaseOrder po = purchaseOrderRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        if (po.getStatus() != PurchaseOrderStatus.PENDING_APPROVAL) {
            throw new BadRequestException(
                    "Only PENDING_APPROVAL purchase orders can be rejected. Current status: " + po.getStatus());
        }

        // Prevent bypassing active pending workflow
        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(resolvedCompanyId, "PURCHASE_ORDER", poId);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BadRequestException("Purchase Order cannot be rejected directly while workflow approval is pending. Please reject via the workflow.");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for purchase order {}: {}", poId, e.getMessage());
        }

        po.setStatus(PurchaseOrderStatus.REJECTED);
        po.setRejectionReason(reason);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Purchase Order {} rejected. Reason: {}", saved.getPoNumber(), reason);
        return toResponseWithWarehouse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse sendPurchaseOrder(UUID companyId, UUID poId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        PurchaseOrder po = purchaseOrderRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        if (po.getStatus() != PurchaseOrderStatus.APPROVED) {
            throw new BadRequestException(
                    "Only APPROVED purchase orders can be marked as SENT. Current status: " + po.getStatus());
        }

        po.setStatus(PurchaseOrderStatus.SENT);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Purchase Order {} marked as SENT", saved.getPoNumber());
        return toResponseWithWarehouse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse cancelPurchaseOrder(UUID companyId, UUID poId, String reason) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        PurchaseOrder po = purchaseOrderRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        if (po.getStatus() == PurchaseOrderStatus.CANCELLED || po.getStatus() == PurchaseOrderStatus.CLOSED) {
            throw new BadRequestException("Purchase Order is already " + po.getStatus());
        }

        boolean hasReceivedGoods = po.getItems().stream()
                .anyMatch(item -> item.getReceivedQuantity() != null
                        && item.getReceivedQuantity().compareTo(BigDecimal.ZERO) > 0);
        if (hasReceivedGoods) {
            throw new BadRequestException("Cannot cancel Purchase Order because items have already been received.");
        }

        po.setStatus(PurchaseOrderStatus.CANCELLED);
        po.setCancelledReason(reason);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Purchase Order {} cancelled. Reason: {}", saved.getPoNumber(), reason);
        return toResponseWithWarehouse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse closePurchaseOrder(UUID companyId, UUID poId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        PurchaseOrder po = purchaseOrderRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        if (po.getStatus() != PurchaseOrderStatus.RECEIVED
                && po.getStatus() != PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new BadRequestException(
                    "Only RECEIVED or PARTIALLY_RECEIVED purchase orders can be closed. Current status: "
                            + po.getStatus());
        }

        po.setStatus(PurchaseOrderStatus.CLOSED);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Purchase Order {} closed", saved.getPoNumber());
        return toResponseWithWarehouse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse overrideStatus(UUID companyId, UUID poId, PurchaseOrderStatusOverrideRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        String role = com.erp.account.security.CurrentUserContext.getUserRole();
        if (!"SYSTEM_ADMIN".equals(role) && !"FINANCE_MANAGER".equals(role)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not authorized to manually override Purchase Order status.");
        }

        PurchaseOrder po = purchaseOrderRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        UUID currentUserId = TenantUtils.getCurrentUserId();
        if (currentUserId == null || !currentUserId.equals(po.getCreatedBy())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You can only manually override the status of your own Purchase Order.");
        }

        log.info("Manual status override for Purchase Order {}: from {} to {} by user {}. Reason: {}",
                po.getPoNumber(), po.getStatus(), request.getStatus(), currentUserId, request.getReason());

        po.setStatus(request.getStatus());

        if (po.getNotes() == null) {
            po.setNotes("Override Reason: " + request.getReason());
        } else {
            po.setNotes(po.getNotes() + "\nOverride Reason: " + request.getReason());
        }

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return toResponseWithWarehouse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse updateAdvanceRequirement(UUID companyId, UUID poId,
            PurchaseOrderAdvanceRequirementRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        PurchaseOrder po = purchaseOrderRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        if (po.getStatus() == PurchaseOrderStatus.CANCELLED || po.getStatus() == PurchaseOrderStatus.CLOSED) {
            throw new BadRequestException(
                    "Cannot update advance requirement for a " + po.getStatus() + " purchase order.");
        }

        if (Boolean.TRUE.equals(request.getAdvanceRequired())) {
            if (request.getAdvanceAmount() == null || request.getAdvanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Advance amount must be greater than 0 when advance is required.");
            }
            if (request.getAdvanceAmount().compareTo(po.getTotalAmount()) > 0) {
                throw new BadRequestException("Advance amount cannot be greater than the Purchase Order total amount.");
            }
            po.setAdvanceRequired(true);
            po.setAdvanceAmount(request.getAdvanceAmount());
        } else {
            po.setAdvanceRequired(false);
            po.setAdvanceAmount(BigDecimal.ZERO);
        }

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Advance requirement updated for Purchase Order {}: required={}, amount={}",
                saved.getPoNumber(), saved.getAdvanceRequired(), saved.getAdvanceAmount());

        return toResponseWithWarehouse(saved);
    }

    @Override
    @Transactional
    public void deletePurchaseOrder(UUID companyId, UUID poId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        PurchaseOrder po = purchaseOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException(
                    "Only DRAFT purchase orders can be deleted. Current status: " + po.getStatus());
        }

        po.setIsDeleted(true);
        purchaseOrderRepository.save(po);
        log.info("Soft-deleted Purchase Order {}", po.getPoNumber());
    }

    @Override
    @Transactional
    public PaymentVoucherResponse createAdvancePayment(
            UUID companyId, UUID poId, POAdvanceRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        PurchaseOrder po = purchaseOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        if (po.getStatus() == PurchaseOrderStatus.CANCELLED || po.getStatus() == PurchaseOrderStatus.CLOSED
                || po.getStatus() == PurchaseOrderStatus.REJECTED) {
            throw new BadRequestException(
                    "Cannot create advance payment for Purchase Order in status: " + po.getStatus());
        }

        if (!Boolean.TRUE.equals(po.getAdvanceRequired())) {
            throw new BadRequestException("Advance payment is not required for this Purchase Order.");
        }

        BigDecimal advanceAmount = po.getAdvanceAmount() != null ? po.getAdvanceAmount() : BigDecimal.ZERO;
        BigDecimal advancePaidAmount = po.getAdvancePaidAmount() != null ? po.getAdvancePaidAmount() : BigDecimal.ZERO;

        BigDecimal allowedAdvance = advanceAmount.subtract(advancePaidAmount);

        if (request.getAmount().compareTo(allowedAdvance) > 0) {
            throw new BadRequestException(
                    "Advance payment amount exceeds the allowed remaining advance. Allowed: " + allowedAdvance);
        }

        // Resolve BankAccount and its linked GL account for paymentAccountId
        BankAccount bankAccount = bankAccountRepository
                .findByIdAndCompanyIdAndIsDeletedFalse(request.getBankAccountId(), resolvedCompanyId)
                .orElseThrow(
                        () -> new BadRequestException("Bank account not found with ID: " + request.getBankAccountId()));

        if (bankAccount.getGlAccount() == null || bankAccount.getGlAccount().getId() == null) {
            throw new BadRequestException(
                    "Bank account is not linked to a Payment/GL account. Please configure the bank account before creating the advance payment.");
        }

        PaymentVoucherRequest pvRequest = new PaymentVoucherRequest();

        pvRequest.setVendorId(po.getVendorId());
        pvRequest.setBankAccountId(request.getBankAccountId());
        pvRequest.setVoucherDate(request.getPaymentDate());
        pvRequest.setPaymentAmount(request.getAmount());
        pvRequest.setPaymentMode(request.getPaymentMode());
        pvRequest.setReferenceNo(request.getReference() != null ? request.getReference() : "ADV-" + po.getPoNumber());
        pvRequest.setRemarks(request.getRemarks());
        pvRequest.setPayableAccountId(request.getPayableAccountId());
        pvRequest.setPaymentAccountId(bankAccount.getGlAccount().getId());
        pvRequest.setPurchaseOrderId(poId);

        com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherAllocationRequest allocationReq = com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherAllocationRequest
                .builder()
                .purchaseOrderId(poId)
                .allocatedAmount(request.getAmount())
                .build();
        pvRequest.setAllocations(java.util.List.of(allocationReq));

        RequestWrapper<PaymentVoucherRequest> reqWrapper = RequestWrapper
                .of(pvRequest);

        PaymentVoucherResponse pvResponse = paymentVoucherService
                .createPaymentVoucher(resolvedCompanyId, reqWrapper);

        PaymentVoucherResponse postedResponse = pvResponse;
        if (pvResponse != null && pvResponse.getId() != null) {
            postedResponse = paymentVoucherService.postPaymentVoucherDirectly(pvResponse.getId());
        }

        BigDecimal currentPaid = po.getAdvancePaidAmount() != null ? po.getAdvancePaidAmount() : BigDecimal.ZERO;
        po.setAdvancePaidAmount(currentPaid.add(request.getAmount()));

        purchaseOrderRepository.save(po);

        return postedResponse;
    }

    private PurchaseOrderItem buildPurchaseOrderItem(PurchaseOrderItemRequest itemReq, UUID companyId) {
        HsnSacMaster hsnSac = null;
        if (itemReq.getHsnSacId() != null) {
            hsnSac = hsnSacMasterRepository.findByIdAndIsDeletedFalse(itemReq.getHsnSacId()).orElse(null);
        }

        BigDecimal orderedQty = itemReq.getOrderedQuantity();
        BigDecimal receivedQty = BigDecimal.ZERO;
        BigDecimal pendingQty = orderedQty;

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .companyId(companyId)
                .itemId(itemReq.getItemId())
                .itemName(itemReq.getItemName())
                .description(itemReq.getDescription())
                .hsnSacMaster(hsnSac)
                .itemType(itemReq.getItemType())
                .unit(itemReq.getUnit())
                .orderedQuantity(orderedQty)
                .receivedQuantity(receivedQty)
                .pendingQuantity(pendingQty)
                .unitPrice(itemReq.getUnitPrice())
                .discountPercent(itemReq.getDiscountPercent() != null ? itemReq.getDiscountPercent() : BigDecimal.ZERO)
                .cgstRate(itemReq.getCgstRate() != null ? itemReq.getCgstRate() : BigDecimal.ZERO)
                .sgstRate(itemReq.getSgstRate() != null ? itemReq.getSgstRate() : BigDecimal.ZERO)
                .igstRate(itemReq.getIgstRate() != null ? itemReq.getIgstRate() : BigDecimal.ZERO)
                .cessRate(itemReq.getCessRate() != null ? itemReq.getCessRate() : BigDecimal.ZERO)
                .warehouseId(itemReq.getWarehouseId())
                .locationId(itemReq.getLocationId())
                .notes(itemReq.getNotes())
                .build();

        item.ensureDerivedAmounts();
        return item;
    }

    private PurchaseOrderResponse toResponseWithWarehouse(PurchaseOrder po) {
        PurchaseOrderResponse response = purchaseOrderMapper.toResponse(po);
        enrichWarehouseNames(response);
        return response;
    }

    private void enrichWarehouseNames(PurchaseOrderResponse response) {
        if (response == null || response.getItems() == null || warehouseLookupService == null) {
            return;
        }
        java.util.Set<com.erp.account.common.dto.WarehouseLocationKey> keys = response.getItems().stream()
                .filter(it -> it.getWarehouseId() != null)
                .map(it -> new com.erp.account.common.dto.WarehouseLocationKey(it.getWarehouseId(), it.getLocationId()))
                .collect(java.util.stream.Collectors.toSet());
        if (keys.isEmpty()) {
            return;
        }
        java.util.Map<com.erp.account.common.dto.WarehouseLocationKey, com.erp.account.common.dto.WarehouseLocationNameDto> map =
                warehouseLookupService.resolveAll(keys);
        for (var it : response.getItems()) {
            if (it.getWarehouseId() != null) {
                var dto = map.get(new com.erp.account.common.dto.WarehouseLocationKey(it.getWarehouseId(), it.getLocationId()));
                if (dto != null) {
                    it.setWarehouseName(dto.getWarehouseName());
                    it.setLocationName(dto.getLocationName());
                }
            }
        }
    }

    private Page<PurchaseOrderResponse> enrichWarehouseNames(Page<PurchaseOrderResponse> page) {
        if (page == null || warehouseLookupService == null) {
            return page;
        }
        java.util.Set<com.erp.account.common.dto.WarehouseLocationKey> keys = page.getContent().stream()
                .filter(po -> po.getItems() != null)
                .flatMap(po -> po.getItems().stream())
                .filter(it -> it.getWarehouseId() != null)
                .map(it -> new com.erp.account.common.dto.WarehouseLocationKey(it.getWarehouseId(), it.getLocationId()))
                .collect(java.util.stream.Collectors.toSet());
        if (keys.isEmpty()) {
            return page;
        }
        java.util.Map<com.erp.account.common.dto.WarehouseLocationKey, com.erp.account.common.dto.WarehouseLocationNameDto> map =
                warehouseLookupService.resolveAll(keys);
        for (var po : page.getContent()) {
            if (po.getItems() != null) {
                for (var it : po.getItems()) {
                    if (it.getWarehouseId() != null) {
                        var dto = map.get(new com.erp.account.common.dto.WarehouseLocationKey(it.getWarehouseId(), it.getLocationId()));
                        if (dto != null) {
                            it.setWarehouseName(dto.getWarehouseName());
                            it.setLocationName(dto.getLocationName());
                        }
                    }
                }
            }
        }
        return page;
    }
}
