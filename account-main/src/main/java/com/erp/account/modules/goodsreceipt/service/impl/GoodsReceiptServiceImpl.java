package com.erp.account.modules.goodsreceipt.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.goodsreceipt.dto.*;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptItem;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import com.erp.account.modules.goodsreceipt.mapper.GoodsReceiptMapper;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptItemRepository;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptRepository;
import com.erp.account.modules.goodsreceipt.repository.spec.GoodsReceiptSpecification;
import com.erp.account.modules.goodsreceipt.service.GoodsReceiptService;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderItem;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderItemRepository;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.purchasereturn.entity.PurchaseReturnStatus;
import com.erp.account.modules.purchasereturn.repository.PurchaseReturnRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderItemResponse;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderResponse;
import com.erp.account.modules.purchaseorder.mapper.PurchaseOrderMapper;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoodsReceiptServiceImpl implements GoodsReceiptService {

    private final GoodsReceiptRepository goodsReceiptRepository;
    private final GoodsReceiptItemRepository goodsReceiptItemRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final GoodsReceiptMapper goodsReceiptMapper;
    private final InventoryIntegrationService inventoryIntegrationService;
    private final com.erp.account.modules.apinvoice.repository.ApInvoiceRepository apInvoiceRepository;
    private final PurchaseReturnRepository purchaseReturnRepository;
    private final PurchaseOrderMapper purchaseOrderMapper;

    @Override
    @Transactional
    public GoodsReceiptResponse createFromPurchaseOrder(UUID companyId, UUID poId, GoodsReceiptRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        PurchaseOrder po = purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        if (po.getStatus() != PurchaseOrderStatus.APPROVED
                && po.getStatus() != PurchaseOrderStatus.SENT
                && po.getStatus() != PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new BadRequestException("Cannot create Goods Receipt from Purchase Order in " + po.getStatus()
                    + " status. Only APPROVED, SENT, or PARTIALLY_RECEIVED allowed.");
        }

        String grnNumber = request.getGrnNumber();
        if (StringUtils.isBlank(grnNumber)) {
            grnNumber = voucherSequenceService.generateNextGrnNumber(resolvedCompanyId, request.getGrnDate());
        } else {
            if (goodsReceiptRepository.existsByGrnNumberAndCompanyIdAndIsDeletedFalse(grnNumber.trim(), resolvedCompanyId)) {
                throw new BadRequestException("Goods Receipt number already exists: " + grnNumber);
            }
            grnNumber = grnNumber.trim();
        }

        GoodsReceipt grn = GoodsReceipt.builder()
                .companyId(resolvedCompanyId)
                .company(po.getCompany())
                .vendorId(po.getVendorId())
                .vendor(po.getVendor())
                .purchaseOrderId(po.getId())
                .purchaseOrder(po)
                .grnNumber(grnNumber)
                .grnDate(request.getGrnDate())
                .warehouseId(request.getWarehouseId())
                .deliveryNoteNumber(request.getDeliveryNoteNumber())
                .deliveryNoteDate(request.getDeliveryNoteDate())
                .vehicleNumber(request.getVehicleNumber())
                .transporterName(request.getTransporterName())
                .notes(request.getNotes())
                .status(GoodsReceiptStatus.DRAFT)
                .items(new ArrayList<>())
                .build();

        for (GoodsReceiptItemRequest itemReq : request.getItems()) {
            PurchaseOrderItem poItem = po.getItems().stream()
                    .filter(it -> it.getId().equals(itemReq.getPurchaseOrderItemId()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Purchase Order Item not found with ID: " + itemReq.getPurchaseOrderItemId()));

            if (itemReq.getReceivedQuantity().compareTo(poItem.getPendingQuantity()) > 0) {
                throw new BadRequestException("Received quantity (" + itemReq.getReceivedQuantity()
                        + ") exceeds pending quantity (" + poItem.getPendingQuantity()
                        + ") for item: " + poItem.getItemName());
            }

            BigDecimal acceptedQty = itemReq.getAcceptedQuantity();
            BigDecimal rejectedQty = itemReq.getRejectedQuantity() != null ? itemReq.getRejectedQuantity() : BigDecimal.ZERO;
            if (acceptedQty == null) {
                acceptedQty = itemReq.getReceivedQuantity().subtract(rejectedQty);
            }
            validateReceiptQuantities(itemReq.getReceivedQuantity(), acceptedQty, rejectedQty);

            BigDecimal remainingPending = poItem.getPendingQuantity().subtract(itemReq.getReceivedQuantity());

            GoodsReceiptItem grnItem = GoodsReceiptItem.builder()
                    .companyId(resolvedCompanyId)
                    .purchaseOrderItemId(poItem.getId())
                    .purchaseOrderItem(poItem)
                    .itemId(poItem.getItemId())
                    .itemName(poItem.getItemName())
                    .description(poItem.getDescription())
                    .unit(poItem.getUnit())
                    .itemType(poItem.getItemType())
                    .orderedQuantity(poItem.getOrderedQuantity())
                    .previouslyReceivedQuantity(poItem.getReceivedQuantity())
                    .receivedQuantity(itemReq.getReceivedQuantity())
                    .acceptedQuantity(acceptedQty)
                    .rejectedQuantity(rejectedQty)
                    .rejectionReason(itemReq.getRejectionReason())
                    .pendingQuantity(remainingPending)
                    .unitPrice(poItem.getUnitPrice())
                    .batchNumber(itemReq.getBatchNumber())
                    .serialNumber(itemReq.getSerialNumber())
                    .expiryDate(itemReq.getExpiryDate())
                    .warehouseId(itemReq.getWarehouseId() != null ? itemReq.getWarehouseId() : request.getWarehouseId())
                    .locationId(itemReq.getLocationId())
                    .notes(itemReq.getNotes())
                    .build();

            grn.addGoodsReceiptItem(grnItem);
        }

        GoodsReceipt savedGrn = goodsReceiptRepository.save(grn);
        log.info("Created Goods Receipt {} with ID {}", savedGrn.getGrnNumber(), savedGrn.getId());
        return goodsReceiptMapper.toResponse(savedGrn);
    }

    @Override
    @Transactional
    public GoodsReceiptResponse updateGoodsReceipt(UUID companyId, UUID grnId, GoodsReceiptRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        GoodsReceipt grn = goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + grnId));

        if (grn.getStatus() != GoodsReceiptStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT Goods Receipts can be updated. Current status: " + grn.getStatus());
        }

        PurchaseOrder po = purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grn.getPurchaseOrderId(), resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found for Goods Receipt: " + grn.getPurchaseOrderId()));

        grn.setGrnDate(request.getGrnDate());
        grn.setWarehouseId(request.getWarehouseId());
        grn.setDeliveryNoteNumber(request.getDeliveryNoteNumber());
        grn.setDeliveryNoteDate(request.getDeliveryNoteDate());
        grn.setVehicleNumber(request.getVehicleNumber());
        grn.setTransporterName(request.getTransporterName());
        grn.setNotes(request.getNotes());

        grn.getItems().clear();
        for (GoodsReceiptItemRequest itemReq : request.getItems()) {
            PurchaseOrderItem poItem = po.getItems().stream()
                    .filter(it -> it.getId().equals(itemReq.getPurchaseOrderItemId()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Purchase Order Item not found with ID: " + itemReq.getPurchaseOrderItemId()));

            if (itemReq.getReceivedQuantity().compareTo(poItem.getPendingQuantity()) > 0) {
                throw new BadRequestException("Received quantity (" + itemReq.getReceivedQuantity()
                        + ") exceeds pending quantity (" + poItem.getPendingQuantity()
                        + ") for item: " + poItem.getItemName());
            }

            BigDecimal acceptedQty = itemReq.getAcceptedQuantity();
            BigDecimal rejectedQty = itemReq.getRejectedQuantity() != null ? itemReq.getRejectedQuantity() : BigDecimal.ZERO;
            if (acceptedQty == null) {
                acceptedQty = itemReq.getReceivedQuantity().subtract(rejectedQty);
            }
            validateReceiptQuantities(itemReq.getReceivedQuantity(), acceptedQty, rejectedQty);

            BigDecimal remainingPending = poItem.getPendingQuantity().subtract(itemReq.getReceivedQuantity());

            GoodsReceiptItem grnItem = GoodsReceiptItem.builder()
                    .companyId(resolvedCompanyId)
                    .purchaseOrderItemId(poItem.getId())
                    .purchaseOrderItem(poItem)
                    .itemId(poItem.getItemId())
                    .itemName(poItem.getItemName())
                    .description(poItem.getDescription())
                    .unit(poItem.getUnit())
                    .itemType(poItem.getItemType())
                    .orderedQuantity(poItem.getOrderedQuantity())
                    .previouslyReceivedQuantity(poItem.getReceivedQuantity())
                    .receivedQuantity(itemReq.getReceivedQuantity())
                    .acceptedQuantity(acceptedQty)
                    .rejectedQuantity(rejectedQty)
                    .rejectionReason(itemReq.getRejectionReason())
                    .pendingQuantity(remainingPending)
                    .unitPrice(poItem.getUnitPrice())
                    .batchNumber(itemReq.getBatchNumber())
                    .serialNumber(itemReq.getSerialNumber())
                    .expiryDate(itemReq.getExpiryDate())
                    .warehouseId(itemReq.getWarehouseId() != null ? itemReq.getWarehouseId() : request.getWarehouseId())
                    .locationId(itemReq.getLocationId())
                    .notes(itemReq.getNotes())
                    .build();

            grn.addGoodsReceiptItem(grnItem);
        }

        GoodsReceipt updatedGrn = goodsReceiptRepository.save(grn);
        log.info("Updated Goods Receipt {} with ID {}", updatedGrn.getGrnNumber(), updatedGrn.getId());
        return goodsReceiptMapper.toResponse(updatedGrn);
    }

    @Override
    @Transactional(readOnly = true)
    public GoodsReceiptResponse getGoodsReceiptById(UUID companyId, UUID grnId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        GoodsReceipt grn = goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + grnId));
        return goodsReceiptMapper.toResponse(grn);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GoodsReceiptResponse> getAllGoodsReceipts(UUID companyId, Pageable pageable, GoodsReceiptFilterDto filter) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        Specification<GoodsReceipt> spec = GoodsReceiptSpecification.getGoodsReceiptSpec(
                resolvedCompanyId,
                filter != null ? filter.getStatus() : null,
                filter != null ? filter.getPurchaseOrderId() : null,
                filter != null ? filter.getVendorId() : null,
                filter != null ? filter.getFromDate() : null,
                filter != null ? filter.getToDate() : null,
                filter != null ? filter.getSearch() : null
        );

        Page<GoodsReceipt> page = goodsReceiptRepository.findAll(spec, pageable);
        return page.map(goodsReceiptMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GoodsReceiptResponse> getGoodsReceiptsByPurchaseOrderId(UUID companyId, UUID poId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        List<GoodsReceipt> list = goodsReceiptRepository.findByPurchaseOrderIdAndCompanyIdAndIsDeletedFalse(poId, resolvedCompanyId);
        return list.stream().map(goodsReceiptMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GoodsReceiptResponse verifyGoodsReceipt(UUID companyId, UUID grnId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        GoodsReceipt grn = goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + grnId));

        if (grn.getStatus() != GoodsReceiptStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT Goods Receipts can be verified. Current status: " + grn.getStatus());
        }

        if (grn.getItems() == null || grn.getItems().isEmpty()) {
            throw new BadRequestException("Cannot verify Goods Receipt with no items.");
        }

        for (GoodsReceiptItem item : grn.getItems()) {
            if (Boolean.TRUE.equals(item.getIsDeleted())) continue;
            validateReceiptQuantities(item.getReceivedQuantity(), item.getAcceptedQuantity(), item.getRejectedQuantity());
        }

        grn.setStatus(GoodsReceiptStatus.VERIFIED);
        grn.setVerifiedBy(TenantUtils.getCurrentUserId());
        grn.setVerifiedAt(LocalDateTime.now());

        GoodsReceipt savedGrn = goodsReceiptRepository.save(grn);
        log.info("Verified Goods Receipt {} with ID {}", savedGrn.getGrnNumber(), savedGrn.getId());
        return goodsReceiptMapper.toResponse(savedGrn);
    }

    @Override
    @Transactional
    public GoodsReceiptResponse postGoodsReceipt(UUID companyId, UUID grnId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        GoodsReceipt grn = goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + grnId));

        if (grn.getStatus() == GoodsReceiptStatus.POSTED || grn.getStatus() == GoodsReceiptStatus.CONFIRMED) {
            throw new BadRequestException("Goods Receipt is already " + grn.getStatus());
        }

        if (grn.getStatus() != GoodsReceiptStatus.VERIFIED) {
            throw new BadRequestException("Only VERIFIED Goods Receipts can be posted. Current status: " + grn.getStatus());
        }

        PurchaseOrder po = purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grn.getPurchaseOrderId(), resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found: " + grn.getPurchaseOrderId()));

        // Pessimistic lock and update on PO items to avoid concurrency race conditions
        for (GoodsReceiptItem grnItem : grn.getItems()) {
            if (Boolean.TRUE.equals(grnItem.getIsDeleted())) continue;
            PurchaseOrderItem poItem = purchaseOrderItemRepository.findByIdWithLock(grnItem.getPurchaseOrderItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase Order Item not found: " + grnItem.getPurchaseOrderItemId()));

            if (grnItem.getReceivedQuantity().compareTo(poItem.getPendingQuantity()) > 0) {
                throw new BadRequestException("Cannot post GRN: Received quantity (" + grnItem.getReceivedQuantity()
                        + ") exceeds available pending quantity (" + poItem.getPendingQuantity()
                        + ") for item: " + poItem.getItemName());
            }

            BigDecimal newReceived = poItem.getReceivedQuantity().add(grnItem.getReceivedQuantity());
            poItem.setReceivedQuantity(newReceived);
            poItem.setPendingQuantity(poItem.getOrderedQuantity().subtract(newReceived));
            purchaseOrderItemRepository.save(poItem);
        }

        // Re-evaluate Purchase Order status
        List<PurchaseOrderItem> updatedPoItems = purchaseOrderItemRepository.findByPurchaseOrderIdAndIsDeletedFalse(po.getId());
        boolean allFullyReceived = updatedPoItems.stream()
                .allMatch(it -> it.getPendingQuantity().compareTo(BigDecimal.ZERO) <= 0);

        if (allFullyReceived) {
            po.setStatus(PurchaseOrderStatus.RECEIVED);
        } else {
            po.setStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED);
        }
        purchaseOrderRepository.save(po);

        // Mark as POSTED (and confirmed for backward compatibility)
        grn.setStatus(GoodsReceiptStatus.POSTED);
        grn.setPostedBy(TenantUtils.getCurrentUserId());
        grn.setPostedAt(LocalDateTime.now());
        grn.setConfirmedBy(TenantUtils.getCurrentUserId());
        grn.setConfirmedAt(LocalDateTime.now());
        GoodsReceipt savedGrn = goodsReceiptRepository.save(grn);
        log.info("Posted Goods Receipt {} for PO {}", savedGrn.getGrnNumber(), po.getPoNumber());

        // Trigger asynchronous inventory stock-in via resilient outbox
        inventoryIntegrationService.scheduleGrnStockIn(savedGrn);

        return goodsReceiptMapper.toResponse(savedGrn);
    }

    @Override
    @Transactional
    public GoodsReceiptResponse confirmGoodsReceipt(UUID companyId, UUID grnId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        GoodsReceipt grn = goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + grnId));

        if (grn.getStatus() == GoodsReceiptStatus.POSTED || grn.getStatus() == GoodsReceiptStatus.CONFIRMED) {
            throw new BadRequestException("Goods Receipt is already " + grn.getStatus());
        }

        if (grn.getStatus() == GoodsReceiptStatus.CANCELLED || grn.getStatus() == GoodsReceiptStatus.REVERSED) {
            throw new BadRequestException("Cannot confirm Goods Receipt in status: " + grn.getStatus());
        }

        if (grn.getStatus() == GoodsReceiptStatus.DRAFT) {
            verifyGoodsReceipt(resolvedCompanyId, grnId);
        }

        return postGoodsReceipt(resolvedCompanyId, grnId);
    }

    @Override
    @Transactional
    public GoodsReceiptResponse cancelGoodsReceipt(UUID companyId, UUID grnId, String reason) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        GoodsReceipt grn = goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + grnId));

        if (grn.getStatus() == GoodsReceiptStatus.CONFIRMED || grn.getStatus() == GoodsReceiptStatus.POSTED) {
            throw new BadRequestException("Cannot cancel a " + grn.getStatus() + " Goods Receipt. Return/Adjustment must be processed.");
        }
        if (grn.getStatus() == GoodsReceiptStatus.CANCELLED) {
            throw new BadRequestException("Goods Receipt is already CANCELLED.");
        }

        grn.setStatus(GoodsReceiptStatus.CANCELLED);
        grn.setCancellationReason(reason);
        grn.setCancelledBy(TenantUtils.getCurrentUserId());
        grn.setCancelledAt(LocalDateTime.now());

        GoodsReceipt saved = goodsReceiptRepository.save(grn);
        log.info("Goods Receipt {} cancelled. Reason: {}", saved.getGrnNumber(), reason);
        return goodsReceiptMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteGoodsReceipt(UUID companyId, UUID grnId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        GoodsReceipt grn = goodsReceiptRepository.findByIdAndCompanyIdAndIsDeletedFalse(grnId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + grnId));

        if (grn.getStatus() != GoodsReceiptStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT Goods Receipts can be deleted. Current status: " + grn.getStatus());
        }

        grn.setIsDeleted(true);
        goodsReceiptRepository.save(grn);
        log.info("Soft-deleted Goods Receipt {}", grn.getGrnNumber());
    }

    @Override
    @Transactional
    public GoodsReceiptResponse reverseGoodsReceipt(UUID companyId, UUID grnId, String reason) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        // Validate reason is provided
        if (StringUtils.isBlank(reason)) {
            throw new BadRequestException("Reversal reason is required.", "REVERSAL_REASON_REQUIRED");
        }

        GoodsReceipt grn = goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods Receipt not found with ID: " + grnId));

        // Strict lifecycle: only CONFIRMED GRNs can be reversed
        if (grn.getStatus() == GoodsReceiptStatus.REVERSED) {
            throw new BadRequestException("Goods Receipt is already REVERSED.", "ALREADY_REVERSED");
        }
        if (grn.getStatus() != GoodsReceiptStatus.CONFIRMED && grn.getStatus() != GoodsReceiptStatus.POSTED) {
            throw new BadRequestException("Only CONFIRMED or POSTED Goods Receipts can be reversed. Current status: " + grn.getStatus());
        }

        // Guard: reject if any active (CONFIRMED) Purchase Returns exist against this GRN
        boolean hasActiveReturns = purchaseReturnRepository
                .findByGoodsReceiptIdAndCompanyIdAndIsDeletedFalse(grnId, resolvedCompanyId)
                .stream()
                .anyMatch(pr -> pr.getStatus() == PurchaseReturnStatus.CONFIRMED);
        if (hasActiveReturns) {
            throw new BadRequestException(
                    "Cannot reverse Goods Receipt: active (CONFIRMED) Purchase Returns exist against this GRN. "
                            + "Cancel or reverse all associated Purchase Returns first.",
                    "RETURNS_EXIST_FOR_GRN");
        }

        // Guard: reject if any active posted AP invoice exists against this GRN
        List<com.erp.account.modules.apinvoice.entity.ApInvoice> linkedInvoices =
                apInvoiceRepository.findByGoodsReceiptIdAndIsDeletedFalse(grnId);

        for (var inv : linkedInvoices) {
            var status = inv.getStatus();
            if (status == com.erp.account.enums.InvoiceStatus.APPROVED
                    || status == com.erp.account.enums.InvoiceStatus.POSTED
                    || status == com.erp.account.enums.InvoiceStatus.PAID
                    || status == com.erp.account.enums.InvoiceStatus.PARTIALLY_PAID) {
                throw new BadRequestException("Cannot reverse Goods Receipt: active Purchase Invoice ("
                        + inv.getInvoiceNo() + ") is linked to this GRN. Please reverse/cancel invoice first or process a Purchase Return.",
                        "INVOICE_EXISTS_FOR_GRN");
            }
        }

        PurchaseOrder po = purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grn.getPurchaseOrderId(), resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found: " + grn.getPurchaseOrderId()));

        // Reduce/reverse received quantities on PO items and restore pending quantities
        for (GoodsReceiptItem grnItem : grn.getItems()) {
            if (Boolean.TRUE.equals(grnItem.getIsDeleted())) continue;
            PurchaseOrderItem poItem = purchaseOrderItemRepository.findByIdWithLock(grnItem.getPurchaseOrderItemId())
                    .orElse(null);
            if (poItem != null) {
                BigDecimal qtyToReverse = grnItem.getReceivedQuantity() != null ? grnItem.getReceivedQuantity() : BigDecimal.ZERO;
                BigDecimal newReceived = poItem.getReceivedQuantity().subtract(qtyToReverse).max(BigDecimal.ZERO);
                poItem.setReceivedQuantity(newReceived);
                poItem.setPendingQuantity(poItem.getOrderedQuantity().subtract(newReceived));
                purchaseOrderItemRepository.save(poItem);
            }
        }

        // Re-evaluate Purchase Order status
        List<PurchaseOrderItem> updatedPoItems = purchaseOrderItemRepository.findByPurchaseOrderIdAndIsDeletedFalse(po.getId());
        BigDecimal totalReceived = updatedPoItems.stream()
                .map(PurchaseOrderItem::getReceivedQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalReceived.compareTo(BigDecimal.ZERO) == 0) {
            po.setStatus(PurchaseOrderStatus.SENT);
        } else {
            po.setStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED);
        }
        purchaseOrderRepository.save(po);

        // Mark GRN as REVERSED — write to reversal fields (not cancellation fields)
        grn.setStatus(GoodsReceiptStatus.REVERSED);
        grn.setReversalReason(reason);
        grn.setReversedBy(TenantUtils.getCurrentUserId());
        grn.setReversedAt(LocalDateTime.now());
        GoodsReceipt savedGrn = goodsReceiptRepository.save(grn);
        log.info("Reversed Goods Receipt {} for PO {}. Reason: {}", savedGrn.getGrnNumber(), po.getPoNumber(), reason);

        // Schedule reverse inventory stock movement (idempotency enforced inside)
        inventoryIntegrationService.scheduleGrnStockOut(savedGrn);

        return goodsReceiptMapper.toResponse(savedGrn);
    }

    private void validateReceiptQuantities(BigDecimal receivedQuantity, BigDecimal acceptedQuantity,
            BigDecimal rejectedQuantity) {
        if (receivedQuantity == null || receivedQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Received quantity must be greater than zero", "INVALID_RECEIVED_QUANTITY");
        }
        if (acceptedQuantity == null || acceptedQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Accepted quantity cannot be negative", "INVALID_ACCEPTED_QUANTITY");
        }
        if (rejectedQuantity == null || rejectedQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Rejected quantity cannot be negative", "INVALID_REJECTED_QUANTITY");
        }
        if (acceptedQuantity.add(rejectedQuantity).compareTo(receivedQuantity) != 0) {
            throw new BadRequestException("Accepted quantity plus rejected quantity must equal received quantity",
                    "RECEIPT_QUANTITY_MISMATCH");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getPendingReceiptsByWarehouse(UUID companyId, UUID warehouseId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        List<PurchaseOrderStatus> statuses = List.of(
                PurchaseOrderStatus.APPROVED,
                PurchaseOrderStatus.SENT,
                PurchaseOrderStatus.PARTIALLY_RECEIVED
        );

        List<PurchaseOrder> approvedPos = purchaseOrderRepository
                .findByCompanyIdAndStatusInAndIsDeletedFalse(resolvedCompanyId, statuses);

        List<PurchaseOrderResponse> result = new ArrayList<>();
        for (PurchaseOrder po : approvedPos) {
            List<PurchaseOrderItem> pendingItems = po.getItems().stream()
                    .filter(it -> !Boolean.TRUE.equals(it.getIsDeleted()))
                    .filter(it -> it.getPendingQuantity() != null && it.getPendingQuantity().compareTo(BigDecimal.ZERO) > 0)
                    .filter(it -> warehouseId.equals(it.getWarehouseId()))
                    .collect(Collectors.toList());

            if (!pendingItems.isEmpty()) {
                PurchaseOrderResponse poResp = purchaseOrderMapper.toResponse(po);
                List<PurchaseOrderItemResponse> itemResponses = pendingItems.stream()
                        .map(purchaseOrderMapper::toItemResponse)
                        .collect(Collectors.toList());
                poResp.setItems(itemResponses);
                result.add(poResp);
            }
        }
        return result;
    }
}
