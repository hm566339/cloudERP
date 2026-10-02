package com.erp.account.modules.purchasereturn.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.entity.ApInvoiceItem;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.debitnote.dto.request.DebitNoteRequest;
import com.erp.account.modules.debitnote.service.DebitNoteService;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptItem;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptItemRepository;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptRepository;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.purchasereturn.dto.PurchaseReturnItemRequest;
import com.erp.account.modules.purchasereturn.dto.PurchaseReturnItemResponse;
import com.erp.account.modules.purchasereturn.dto.PurchaseReturnRequest;
import com.erp.account.modules.purchasereturn.dto.PurchaseReturnResponse;
import com.erp.account.modules.purchasereturn.entity.PurchaseReturn;
import com.erp.account.modules.purchasereturn.entity.PurchaseReturnItem;
import com.erp.account.modules.purchasereturn.entity.PurchaseReturnStatus;
import com.erp.account.modules.purchasereturn.repository.PurchaseReturnItemRepository;
import com.erp.account.modules.purchasereturn.repository.PurchaseReturnRepository;
import com.erp.account.modules.purchasereturn.service.PurchaseReturnService;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseReturnServiceImpl implements PurchaseReturnService {

    private final PurchaseReturnRepository purchaseReturnRepository;
    private final PurchaseReturnItemRepository purchaseReturnItemRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final GoodsReceiptItemRepository goodsReceiptItemRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ApInvoiceRepository apInvoiceRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final InventoryIntegrationService inventoryIntegrationService;
        private final DebitNoteService debitNoteService;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PurchaseReturnResponse createPurchaseReturn(UUID companyId, PurchaseReturnRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        GoodsReceipt grn = goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(
                        request.getGoodsReceiptId(), resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Goods Receipt not found with ID: " + request.getGoodsReceiptId()));

        // GRN must be CONFIRMED or POSTED — cannot return against DRAFT or REVERSED
        if (grn.getStatus() != GoodsReceiptStatus.CONFIRMED && grn.getStatus() != GoodsReceiptStatus.POSTED) {
            throw new BadRequestException(
                    "Purchase Return can only be created against a CONFIRMED or POSTED Goods Receipt. Current status: "
                            + grn.getStatus(), "GRN_NOT_CONFIRMED");
        }

        // Tenant / vendor consistency: GRN must belong to the resolved company
        if (!resolvedCompanyId.equals(grn.getCompanyId())) {
            throw new BadRequestException("Goods Receipt does not belong to the current company.", "TENANT_MISMATCH");
        }

        PurchaseOrder po = null;
        if (grn.getPurchaseOrderId() != null) {
            po = purchaseOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(
                    grn.getPurchaseOrderId(), resolvedCompanyId).orElse(null);
        }

        LocalDate returnDate = request.getReturnDate() != null ? request.getReturnDate() : LocalDate.now();
        String returnNumber = voucherSequenceService.generateNextPurchaseReturnNumber(resolvedCompanyId, returnDate);

        PurchaseReturn purchaseReturn = PurchaseReturn.builder()
                .companyId(resolvedCompanyId)
                .company(grn.getCompany())
                .returnNumber(returnNumber)
                .returnDate(returnDate)
                .goodsReceiptId(grn.getId())
                .goodsReceipt(grn)
                .purchaseOrderId(grn.getPurchaseOrderId())
                .purchaseOrder(po)
                .vendorId(grn.getVendor() != null ? grn.getVendor().getId()
                        : (po != null ? po.getVendor().getId() : null))
                .vendor(grn.getVendor() != null ? grn.getVendor()
                        : (po != null ? po.getVendor() : null))
                .status(PurchaseReturnStatus.DRAFT)
                .reason(request.getReason())
                .notes(request.getNotes())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        for (PurchaseReturnItemRequest itemReq : request.getItems()) {

            // Validate positive return quantity
            if (itemReq.getReturnedQuantity() == null || itemReq.getReturnedQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException(
                        "Returned quantity must be greater than zero for each item.", "INVALID_RETURN_QUANTITY");
            }

            GoodsReceiptItem grnItem = grn.getItems().stream()
                    .filter(gi -> gi.getId().equals(itemReq.getGoodsReceiptItemId()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException(
                            "Goods Receipt Item not found: " + itemReq.getGoodsReceiptItemId(),
                            "GRN_ITEM_NOT_FOUND"));

            // Calculate previously confirmed returned quantity for this GRN line
            List<PurchaseReturnItem> previousReturns =
                    purchaseReturnItemRepository.findByGoodsReceiptItemIdAndIsDeletedFalse(grnItem.getId());
            BigDecimal alreadyReturned = previousReturns.stream()
                    .filter(pri -> pri.getPurchaseReturn() != null
                            && pri.getPurchaseReturn().getStatus() == PurchaseReturnStatus.CONFIRMED)
                    .map(PurchaseReturnItem::getReturnedQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal acceptedQty = grnItem.getAcceptedQuantity() != null
                    ? grnItem.getAcceptedQuantity() : BigDecimal.ZERO;
            BigDecimal availableToReturn = acceptedQty.subtract(alreadyReturned).max(BigDecimal.ZERO);

            if (itemReq.getReturnedQuantity().compareTo(availableToReturn) > 0) {
                throw new BadRequestException(String.format(
                        "Returned quantity (%s) exceeds available returnable quantity (%s) for item '%s'. "
                                + "Accepted: %s, Already Returned: %s",
                        itemReq.getReturnedQuantity(), availableToReturn, grnItem.getItemName(),
                        acceptedQty, alreadyReturned), "EXCESS_RETURN_QUANTITY");
            }

            BigDecimal unitPrice = grnItem.getUnitPrice() != null ? grnItem.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = unitPrice.multiply(itemReq.getReturnedQuantity());
            subtotal = subtotal.add(lineTotal);

            PurchaseReturnItem returnItem = PurchaseReturnItem.builder()
                    .companyId(resolvedCompanyId)
                    .goodsReceiptItemId(grnItem.getId())
                    .purchaseOrderItemId(grnItem.getPurchaseOrderItemId())
                    .itemId(grnItem.getItemId())
                    .itemName(grnItem.getItemName())
                    .unit(grnItem.getUnit())
                    .returnedQuantity(itemReq.getReturnedQuantity())
                    .unitPrice(unitPrice)
                    .taxAmount(BigDecimal.ZERO)
                    .totalAmount(lineTotal)
                    .reason(itemReq.getReason())
                    .build();

            purchaseReturn.addItem(returnItem);
        }

        purchaseReturn.setSubtotal(subtotal);
        purchaseReturn.setTaxAmount(BigDecimal.ZERO);
        purchaseReturn.setTotalAmount(subtotal);

        PurchaseReturn saved = purchaseReturnRepository.save(purchaseReturn);
        log.info("Created Purchase Return {} with ID {}", saved.getReturnNumber(), saved.getId());
        return toResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONFIRM
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PurchaseReturnResponse confirmPurchaseReturn(UUID companyId, UUID returnId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        PurchaseReturn purchaseReturn = purchaseReturnRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(returnId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase Return not found with ID: " + returnId));

        if (purchaseReturn.getStatus() != PurchaseReturnStatus.DRAFT) {
            throw new BadRequestException(
                    "Only DRAFT Purchase Returns can be confirmed. Current status: " + purchaseReturn.getStatus());
        }

        // Re-validate GRN still CONFIRMED at confirmation time
        GoodsReceipt grn = goodsReceiptRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(
                        purchaseReturn.getGoodsReceiptId(), resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Goods Receipt not found: " + purchaseReturn.getGoodsReceiptId()));

        if (grn.getStatus() != GoodsReceiptStatus.CONFIRMED && grn.getStatus() != GoodsReceiptStatus.POSTED) {
            throw new BadRequestException(
                    "Cannot confirm Purchase Return: the linked Goods Receipt is neither CONFIRMED nor POSTED. "
                            + "Current GRN status: " + grn.getStatus(), "GRN_NOT_CONFIRMED");
        }

        // ── Update returnedQuantity on each GRN item (pessimistic lock for concurrency) ──
        for (PurchaseReturnItem returnItem : purchaseReturn.getItems()) {
            if (Boolean.TRUE.equals(returnItem.getIsDeleted())) continue;

            GoodsReceiptItem grnItem = goodsReceiptItemRepository
                    .findByIdWithLock(returnItem.getGoodsReceiptItemId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Goods Receipt Item not found: " + returnItem.getGoodsReceiptItemId()));

            // Re-validate available qty under the pessimistic lock to prevent concurrent over-return
            BigDecimal acceptedQty = grnItem.getAcceptedQuantity() != null
                    ? grnItem.getAcceptedQuantity() : BigDecimal.ZERO;
            BigDecimal currentReturned = grnItem.getReturnedQuantity() != null
                    ? grnItem.getReturnedQuantity() : BigDecimal.ZERO;
            BigDecimal availableToReturn = acceptedQty.subtract(currentReturned).max(BigDecimal.ZERO);

            if (returnItem.getReturnedQuantity().compareTo(availableToReturn) > 0) {
                throw new BadRequestException(String.format(
                        "Concurrent return detected: Returned quantity (%s) exceeds available returnable quantity (%s) "
                                + "for item '%s'. Accepted: %s, Already Returned: %s",
                        returnItem.getReturnedQuantity(), availableToReturn, grnItem.getItemName(),
                        acceptedQty, currentReturned), "EXCESS_RETURN_QUANTITY");
            }

            // Atomically accumulate the returned quantity on the GRN item
            grnItem.setReturnedQuantity(currentReturned.add(returnItem.getReturnedQuantity()));
            goodsReceiptItemRepository.save(grnItem);
        }

        // ── Check if an active AP Invoice exists for this GRN ──────────────────────
        // If yes, log a note. A full Debit Note flow can be added here when the
        // DebitNote service is available. For now, we record the linked invoice.
        List<ApInvoice> linkedInvoices = apInvoiceRepository.findByGoodsReceiptIdAndCompanyIdAndIsDeletedFalse(
                purchaseReturn.getGoodsReceiptId(), resolvedCompanyId);
        boolean hasActiveInvoice = linkedInvoices.stream()
                .anyMatch(inv -> inv.getStatus() == InvoiceStatus.APPROVED
                        || inv.getStatus() == InvoiceStatus.POSTED
                        || inv.getStatus() == InvoiceStatus.PARTIALLY_PAID
                        || inv.getStatus() == InvoiceStatus.PAID);
        if (hasActiveInvoice) {
            ApInvoice activeInvoice = linkedInvoices.stream()
                    .filter(inv -> inv.getStatus() == InvoiceStatus.APPROVED
                            || inv.getStatus() == InvoiceStatus.POSTED
                            || inv.getStatus() == InvoiceStatus.PARTIALLY_PAID
                            || inv.getStatus() == InvoiceStatus.PAID)
                    .findFirst().orElse(null);
            if (activeInvoice != null && purchaseReturn.getDebitNoteId() == null) {
                applyReturnTaxFromInvoice(purchaseReturn, activeInvoice);
                ApInvoiceItem accountItem = activeInvoice.getItems().stream()
                        .filter(item -> item.getExpenseAccountId() != null)
                        .findFirst().orElse(null);
                if (accountItem == null || activeInvoice.getVendor() == null
                        || activeInvoice.getVendor().getPayableAccount() == null) {
                    throw new BadRequestException("Purchase return accounting accounts are not configured",
                            "RETURN_ACCOUNTING_CONFIG_REQUIRED");
                }
                DebitNoteRequest debitNoteRequest = DebitNoteRequest.builder()
                        .apInvoiceId(activeInvoice.getId())
                        .noteDate(purchaseReturn.getReturnDate())
                        .amount(purchaseReturn.getTotalAmount())
                        .gstAmount(purchaseReturn.getTaxAmount())
                        .referenceNo(purchaseReturn.getReturnNumber())
                        .reason(purchaseReturn.getReason())
                        .payableAccountId(activeInvoice.getVendor().getPayableAccount().getId())
                        .purchaseReturnAccountId(accountItem.getExpenseAccountId())
                        .build();
                var debitNote = debitNoteService.createDebitNote(
                        resolvedCompanyId, RequestWrapper.of(debitNoteRequest));
                purchaseReturn.setDebitNoteId(debitNote.getId());
            }
        }

        // ── Set confirmation audit fields ──────────────────────────────────────────
        purchaseReturn.setStatus(PurchaseReturnStatus.CONFIRMED);
        purchaseReturn.setConfirmedBy(TenantUtils.getCurrentUserId());
        purchaseReturn.setConfirmedAt(LocalDateTime.now());

        PurchaseReturn saved = purchaseReturnRepository.save(purchaseReturn);
        log.info("Confirmed Purchase Return {} (ID: {})", saved.getReturnNumber(), saved.getId());

        // ── Dispatch inventory outbox event ────────────────────────────────────────
        inventoryIntegrationService.schedulePurchaseReturnStockOut(saved);

        return toResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CANCEL
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PurchaseReturnResponse cancelPurchaseReturn(UUID companyId, UUID returnId, String reason) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        PurchaseReturn purchaseReturn = purchaseReturnRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(returnId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase Return not found with ID: " + returnId));

        if (purchaseReturn.getStatus() == PurchaseReturnStatus.CANCELLED) {
            throw new BadRequestException("Purchase Return is already CANCELLED.");
        }

        if (purchaseReturn.getStatus() == PurchaseReturnStatus.DRAFT) {
            // Simple cancellation of a DRAFT return — no side effects
            purchaseReturn.setStatus(PurchaseReturnStatus.CANCELLED);
            purchaseReturn.setCancelledBy(TenantUtils.getCurrentUserId());
            purchaseReturn.setCancelledAt(LocalDateTime.now());
            purchaseReturn.setCancellationReason(reason);

        } else if (purchaseReturn.getStatus() == PurchaseReturnStatus.CONFIRMED) {
            // ── Reverse the returnedQuantity on GRN items ──────────────────────────
            GoodsReceipt grn = goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(
                    purchaseReturn.getGoodsReceiptId(), resolvedCompanyId).orElse(null);

            if (grn != null) {
                for (PurchaseReturnItem returnItem : purchaseReturn.getItems()) {
                    if (Boolean.TRUE.equals(returnItem.getIsDeleted())) continue;

                    goodsReceiptItemRepository.findByIdWithLock(returnItem.getGoodsReceiptItemId())
                            .ifPresent(grnItem -> {
                                BigDecimal currentReturned = grnItem.getReturnedQuantity() != null
                                        ? grnItem.getReturnedQuantity() : BigDecimal.ZERO;
                                BigDecimal newReturned = currentReturned
                                        .subtract(returnItem.getReturnedQuantity())
                                        .max(BigDecimal.ZERO);
                                grnItem.setReturnedQuantity(newReturned);
                                goodsReceiptItemRepository.save(grnItem);
                            });
                }
                log.info("Reversed returnedQuantity on GRN items for cancelled Purchase Return {}",
                        purchaseReturn.getReturnNumber());
            }

            // ── Cancel the pending PURCHASE_RETURN_STOCK_OUT outbox task if not yet processed ──
            inventoryIntegrationService.compensatePurchaseReturnStockOut(purchaseReturn);

            purchaseReturn.setStatus(PurchaseReturnStatus.CANCELLED);
            purchaseReturn.setCancelledBy(TenantUtils.getCurrentUserId());
            purchaseReturn.setCancelledAt(LocalDateTime.now());
            purchaseReturn.setCancellationReason(reason);

        } else {
            throw new BadRequestException(
                    "Cannot cancel Purchase Return in status: " + purchaseReturn.getStatus());
        }

        PurchaseReturn saved = purchaseReturnRepository.save(purchaseReturn);
        log.info("Cancelled Purchase Return {} (ID: {}). Reason: {}",
                saved.getReturnNumber(), saved.getId(), reason);
        return toResponse(saved);
    }

        private void applyReturnTaxFromInvoice(PurchaseReturn purchaseReturn, ApInvoice invoice) {
                BigDecimal tax = BigDecimal.ZERO;
                for (PurchaseReturnItem returnItem : purchaseReturn.getItems()) {
                        ApInvoiceItem invoiceItem = invoice.getItems().stream()
                                        .filter(item -> returnItem.getItemId() != null && returnItem.getItemId().equals(item.getItemId()))
                                        .findFirst().orElse(null);
                        if (invoiceItem == null || invoiceItem.getQuantity() == null
                                        || invoiceItem.getQuantity().signum() <= 0) continue;
                        BigDecimal taxPerUnit = invoiceItem.getTaxAmount() == null ? BigDecimal.ZERO
                                        : invoiceItem.getTaxAmount().divide(invoiceItem.getQuantity(), 8, java.math.RoundingMode.HALF_UP);
                        tax = tax.add(taxPerUnit.multiply(returnItem.getReturnedQuantity()));
                }
                purchaseReturn.setTaxAmount(tax);
                purchaseReturn.setTotalAmount(purchaseReturn.getSubtotal().add(tax));
        }

    // ─────────────────────────────────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PurchaseReturnResponse getPurchaseReturnById(UUID companyId, UUID returnId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        PurchaseReturn purchaseReturn = purchaseReturnRepository
                .findWithItemsByIdAndCompanyIdAndIsDeletedFalse(returnId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase Return not found with ID: " + returnId));
        return toResponse(purchaseReturn);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseReturnResponse> getAllPurchaseReturns(UUID companyId, Pageable pageable) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        return purchaseReturnRepository.findAll((root, query, cb) -> {
            if (resolvedCompanyId != null) {
                return cb.and(cb.equal(root.get("companyId"), resolvedCompanyId),
                        cb.isFalse(root.get("isDeleted")));
            }
            return cb.isFalse(root.get("isDeleted"));
        }, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseReturnResponse> getPurchaseReturnsByGoodsReceiptId(UUID companyId, UUID grnId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        return purchaseReturnRepository.findByGoodsReceiptIdAndCompanyIdAndIsDeletedFalse(grnId, resolvedCompanyId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mapper
    // ─────────────────────────────────────────────────────────────────────────

    private PurchaseReturnResponse toResponse(PurchaseReturn entity) {
        List<PurchaseReturnItemResponse> itemResponses = new ArrayList<>();
        if (entity.getItems() != null) {
            for (PurchaseReturnItem item : entity.getItems()) {
                itemResponses.add(PurchaseReturnItemResponse.builder()
                        .id(item.getId())
                        .goodsReceiptItemId(item.getGoodsReceiptItemId())
                        .purchaseOrderItemId(item.getPurchaseOrderItemId())
                        .itemId(item.getItemId())
                        .itemName(item.getItemName())
                        .unit(item.getUnit())
                        .returnedQuantity(item.getReturnedQuantity())
                        .unitPrice(item.getUnitPrice())
                        .taxAmount(item.getTaxAmount())
                        .totalAmount(item.getTotalAmount())
                        .reason(item.getReason())
                        .build());
            }
        }

        return PurchaseReturnResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompanyId())
                .returnNumber(entity.getReturnNumber())
                .returnDate(entity.getReturnDate())
                .goodsReceiptId(entity.getGoodsReceiptId())
                .grnNumber(entity.getGoodsReceipt() != null ? entity.getGoodsReceipt().getGrnNumber() : null)
                .purchaseOrderId(entity.getPurchaseOrderId())
                .poNumber(entity.getPurchaseOrder() != null ? entity.getPurchaseOrder().getPoNumber() : null)
                .vendorId(entity.getVendorId())
                .vendorName(entity.getVendor() != null ? entity.getVendor().getVendorName() : null)
                .status(entity.getStatus())
                .reason(entity.getReason())
                .notes(entity.getNotes())
                .subtotal(entity.getSubtotal())
                .taxAmount(entity.getTaxAmount())
                .totalAmount(entity.getTotalAmount())
                .items(itemResponses)
                .confirmedBy(entity.getConfirmedBy())
                .confirmedAt(entity.getConfirmedAt())
                .cancelledBy(entity.getCancelledBy())
                .cancelledAt(entity.getCancelledAt())
                .cancellationReason(entity.getCancellationReason())
                .debitNoteId(entity.getDebitNoteId())
                .createdAt(entity.getCreatedAt())
                .createdByUsername(entity.getCreatedByUsername())
                .build();
    }
}
