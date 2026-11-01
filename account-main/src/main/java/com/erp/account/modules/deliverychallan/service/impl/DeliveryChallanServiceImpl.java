package com.erp.account.modules.deliverychallan.service.impl;

import com.erp.account.common.dto.WarehouseLocationKey;
import com.erp.account.common.dto.inventory.response.WarehouseAccountResponse;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ConflictException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.ReceiptVoucherStatus;
import com.erp.account.modules.deliverychallan.dto.request.DcConversionRequest;
import com.erp.account.modules.deliverychallan.dto.request.DcFromReceiptRequest;
import com.erp.account.modules.deliverychallan.dto.request.DeliveryChallanItemUpdateRequest;
import com.erp.account.modules.deliverychallan.dto.request.DeliveryChallanUpdateRequest;
import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanProfileResponse;
import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanResponse;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallan;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanItem;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import com.erp.account.modules.deliverychallan.mapper.DeliveryChallanMapper;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanItemRepository;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanRepository;
import com.erp.account.modules.deliverychallan.repository.spec.DeliveryChallanSpecification;
import com.erp.account.modules.deliverychallan.service.DeliveryChallanService;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceItemRequest;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceRequest;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.salesinvoice.service.SalesInvoiceService;
import com.erp.account.modules.common.entity.ReceiptAllocation;
import com.erp.account.modules.common.repository.ReceiptAllocationRepository;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.entity.SalesOrderItem;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryChallanServiceImpl implements DeliveryChallanService {

    private final DeliveryChallanRepository deliveryChallanRepository;
    private final DeliveryChallanItemRepository deliveryChallanItemRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final DeliveryChallanMapper deliveryChallanMapper;
    private final VoucherSequenceService voucherSequenceService;
    private final InventoryIntegrationService inventoryIntegrationService;
    private final SalesInvoiceService salesInvoiceService;
    private final SalesInvoiceRepository salesInvoiceRepository;
    private final ReceiptAllocationRepository receiptAllocationRepository;
    private final ReceiptVoucherRepository receiptVoucherRepository;
    private final com.erp.account.integration.workflow.client.WorkflowClient workflowClient;

    /**
     * Delivery Challan statuses that count against the Sales Order open quantity.
     * CONFIRMED: physically dispatched via inventory stock-out.
     * DRAFT: active reserved allocation, prevents over-dispatch across repeated API calls.
     * CANCELLED / soft-deleted records do not consume open quantity.
     */
    private static final Set<DeliveryChallanStatus> ACTIVE_DISPATCH_STATUSES = Set.of(
            DeliveryChallanStatus.CONFIRMED,
            DeliveryChallanStatus.APPROVED,
            DeliveryChallanStatus.PENDING_APPROVAL,
            DeliveryChallanStatus.DRAFT
    );

    @Override
    @Transactional(readOnly = true)
    public Page<DeliveryChallanProfileResponse> getAllDeliveryChallans(UUID companyId, Pageable pageable,
            DeliveryChallanStatus status, UUID customerId, LocalDate fromDate, LocalDate toDate, String search) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        Pageable safePageable = sanitizePageable(pageable);
        Specification<DeliveryChallan> spec = DeliveryChallanSpecification.filter(resolvedCompanyId, status, customerId,
                fromDate, toDate, search);
        Page<DeliveryChallan> page = deliveryChallanRepository.findAll(spec, safePageable);
        return page.map(dc -> {
            DeliveryChallanProfileResponse profile = deliveryChallanMapper.toProfileResponse(dc);
            salesInvoiceRepository.findBySourceDeliveryChallanIdAndCompanyIdAndIsDeletedFalse(dc.getId(), resolvedCompanyId)
                    .ifPresent(inv -> {
                        profile.setInvoiceId(inv.getId());
                        profile.setInvoiceNumber(inv.getInvoiceNumber());
                    });
            if (profile.getInvoiceId() == null && dc.getSourceSalesInvoiceId() != null) {
                profile.setInvoiceId(dc.getSourceSalesInvoiceId());
                profile.setInvoiceNumber(dc.getSourceSalesInvoiceNumber());
            }
            return profile;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryChallanResponse getDeliveryChallanById(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        DeliveryChallan dc = getDeliveryChallanOrThrow(resolvedCompanyId, id);
        DeliveryChallanResponse response = deliveryChallanMapper.toResponse(dc);
        salesInvoiceRepository.findBySourceDeliveryChallanIdAndCompanyIdAndIsDeletedFalse(dc.getId(), resolvedCompanyId)
                .ifPresent(inv -> {
                    response.setInvoiceId(inv.getId());
                    response.setInvoiceNumber(inv.getInvoiceNumber());
                });
        if (response.getInvoiceId() == null && dc.getSourceSalesInvoiceId() != null) {
            response.setInvoiceId(dc.getSourceSalesInvoiceId());
            response.setInvoiceNumber(dc.getSourceSalesInvoiceNumber());
        }
        return response;
    }

    @Override
    @Transactional
    public DeliveryChallanResponse createFromSalesOrder(UUID companyId, DcConversionRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        if (request == null) {
            throw new BadRequestException("Request body cannot be null.");
        }
        if (request.getSourceSalesOrderId() == null) {
            throw new BadRequestException("Source Sales Order ID is required.");
        }
        if (request.getWarehouseId() == null) {
            throw new BadRequestException("Warehouse ID is required at root level.");
        }

        // 1. Acquire pessimistic write lock to serialize concurrent conversion requests for this Sales Order
        SalesOrder so;
        try {
            so = salesOrderRepository
                    .findByIdAndCompanyIdAndIsDeletedFalseWithLock(request.getSourceSalesOrderId(), resolvedCompanyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sales Order not found with ID: " + request.getSourceSalesOrderId()));
        } catch (org.springframework.dao.PessimisticLockingFailureException | jakarta.persistence.PessimisticLockException | jakarta.persistence.LockTimeoutException e) {
            log.error("Concurrent lock conflict on Sales Order: {}", request.getSourceSalesOrderId(), e);
            throw new ConflictException("Sales Order is currently being processed by another transaction. Please retry.", e);
        }

        // 2. Validate Sales Order status
        if (so.getStatus() != SalesOrderStatus.CONFIRMED && so.getStatus() != SalesOrderStatus.APPROVED) {
            throw new BadRequestException("Sales Order must be in CONFIRMED or APPROVED status to create a Delivery Challan. Current status: " + so.getStatus());
        }

        // 3. Validate Sales Order contains items
        if (so.getItems() == null || so.getItems().isEmpty()) {
            throw new BadRequestException("Sales Order contains no items to dispatch.");
        }

        Map<UUID, SalesOrderItem> soItemMap = so.getItems().stream()
                .collect(Collectors.toMap(SalesOrderItem::getId, item -> item));

        // 4. Validate requested item IDs (duplicate check & ownership check)
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            Set<UUID> seenItemIds = new HashSet<>();
            Set<UUID> duplicateItemIds = new LinkedHashSet<>();
            for (DcConversionRequest.DcConversionItemRequest itemReq : request.getItems()) {
                if (itemReq.getSourceSalesOrderItemId() == null) {
                    throw new BadRequestException("Sales Order Item ID is required for each item in request.");
                }
                if (!seenItemIds.add(itemReq.getSourceSalesOrderItemId())) {
                    duplicateItemIds.add(itemReq.getSourceSalesOrderItemId());
                }
                if (!soItemMap.containsKey(itemReq.getSourceSalesOrderItemId())) {
                    throw new BadRequestException("Sales Order Item ID " + itemReq.getSourceSalesOrderItemId() +
                            " does not belong to Sales Order: " + so.getSoNumber());
                }
            }
            if (!duplicateItemIds.isEmpty()) {
                throw new BadRequestException("Duplicate Sales Order Item ID(s) found in request: " + duplicateItemIds);
            }
        }

        // 5. Query previously dispatched/reserved quantities for all items of this Sales Order
        List<UUID> soItemIds = so.getItems().stream().map(SalesOrderItem::getId).toList();
        List<Object[]> dispatchedRecords = deliveryChallanItemRepository
                .sumDispatchedQuantityBySoItemIds(soItemIds, resolvedCompanyId, ACTIVE_DISPATCH_STATUSES);

        Map<UUID, BigDecimal> alreadyDispatchedMap = new HashMap<>();
        if (dispatchedRecords != null) {
            for (Object[] record : dispatchedRecords) {
                UUID itemId = (UUID) record[0];
                BigDecimal qty = record[1] instanceof BigDecimal bd ? bd : new BigDecimal(record[1].toString());
                alreadyDispatchedMap.put(itemId, qty);
            }
        }

        // 6. Build Delivery Challan line items using root-level warehouseId
        List<DeliveryChallanItem> newItems = new ArrayList<>();
        Map<WarehouseLocationKey, WarehouseAccountResponse> validatedWhLocCache = new HashMap<>();
        UUID rootWarehouseId = request.getWarehouseId();

        if (request.getItems() == null || request.getItems().isEmpty()) {
            // Full dispatch: dispatch remaining open quantities for all items
            for (SalesOrderItem soItem : so.getItems()) {
                BigDecimal alreadyDispatched = alreadyDispatchedMap.getOrDefault(soItem.getId(), BigDecimal.ZERO);
                BigDecimal remainingQty = soItem.getQuantity().subtract(alreadyDispatched);

                if (remainingQty.compareTo(BigDecimal.ZERO) <= 0) {
                    continue; // Skip already fulfilled items
                }

                UUID effectiveLocationId = soItem.getLocationId();

                validateWarehouseAndLocation(rootWarehouseId, effectiveLocationId, resolvedCompanyId, soItem.getItemName(), validatedWhLocCache);

                DeliveryChallanItem dcItem = buildDeliveryChallanItem(
                        resolvedCompanyId, so, soItem, remainingQty, rootWarehouseId, effectiveLocationId, soItem.getNotes());
                newItems.add(dcItem);
            }
        } else {
            // Partial dispatch: dispatch specified quantities
            for (DcConversionRequest.DcConversionItemRequest itemReq : request.getItems()) {
                SalesOrderItem soItem = soItemMap.get(itemReq.getSourceSalesOrderItemId());
                BigDecimal requestedQty = itemReq.getQuantityToDispatch();

                if (requestedQty == null || requestedQty.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BadRequestException("Quantity to dispatch must be greater than zero for item: " + soItem.getItemName());
                }

                BigDecimal alreadyDispatched = alreadyDispatchedMap.getOrDefault(soItem.getId(), BigDecimal.ZERO);
                BigDecimal remainingQty = soItem.getQuantity().subtract(alreadyDispatched);

                if (requestedQty.compareTo(remainingQty) > 0) {
                    throw new BadRequestException(String.format(
                            "Dispatch quantity (%.4f) cannot exceed remaining open quantity (%.4f) for item: %s. Original quantity: %.4f, previously dispatched/reserved: %.4f",
                            requestedQty, remainingQty, soItem.getItemName(), soItem.getQuantity(), alreadyDispatched));
                }

                UUID effectiveLocationId = itemReq.getWarehouseLocationId() != null ? itemReq.getWarehouseLocationId() : soItem.getLocationId();

                validateWarehouseAndLocation(rootWarehouseId, effectiveLocationId, resolvedCompanyId, soItem.getItemName(), validatedWhLocCache);

                DeliveryChallanItem dcItem = buildDeliveryChallanItem(
                        resolvedCompanyId, so, soItem, requestedQty, rootWarehouseId, effectiveLocationId, soItem.getNotes());
                newItems.add(dcItem);
            }
        }

        if (newItems.isEmpty()) {
            throw new BadRequestException("No items available for dispatch. All items in Sales Order " + so.getSoNumber() + " are already fully dispatched or reserved.");
        }

        // 7. Create and persist Delivery Challan
        LocalDate dcDate = LocalDate.now();
        String dcNumber = voucherSequenceService.generateNextDeliveryChallanNumber(resolvedCompanyId, dcDate);

        DeliveryChallan dc = DeliveryChallan.builder()
                .companyId(resolvedCompanyId)
                .company(so.getCompany())
                .dcNumber(dcNumber)
                .dcDate(dcDate)
                .sourceSalesOrderId(so.getId())
                .sourceSalesOrder(so)
                .sourceSalesOrderNumber(so.getSoNumber())
                .customerId(so.getCustomerId())
                .customer(so.getCustomer())
                .billingAddressId(so.getBillingAddressId())
                .billingAddressSnapshot(so.getBillingAddressSnapshot())
                .billingStateCode(so.getBillingStateCode())
                .deliveryAddressId(so.getDeliveryAddressId())
                .deliveryAddressSnapshot(so.getDeliveryAddressSnapshot())
                .referenceNumber(so.getReferenceNumber())
                .notes(so.getNotes())
                .status(DeliveryChallanStatus.DRAFT)
                .build();

        for (DeliveryChallanItem item : newItems) {
            dc.addDeliveryChallanItem(item);
        }

        recalculateTotals(dc);
        dc = deliveryChallanRepository.save(dc);

        return deliveryChallanMapper.toResponse(dc);
    }

    @Override
    @Transactional
    public DeliveryChallanResponse createFromReceipt(UUID companyId, UUID receiptId, DcFromReceiptRequest rawRequest) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        if (rawRequest == null) {
            throw new BadRequestException("Request body cannot be null.");
        }
        DcFromReceiptRequest request = rawRequest.unwrap();
        if (receiptId == null) {
            throw new BadRequestException("Receipt Voucher ID is required.");
        }
        if (request.getWarehouseId() == null) {
            throw new BadRequestException("Warehouse ID is required at root level.");
        }

        // 1. Fetch Receipt Voucher with its relations
        ReceiptVoucher receipt = receiptVoucherRepository
                .findProfileByIdAndCompanyIdAndIsDeletedFalse(receiptId, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt Voucher not found with ID: " + receiptId));

        // 2. Validate Receipt Voucher status
        if (receipt.getReceiptStatus() == ReceiptVoucherStatus.CANCELLED
                || receipt.getReceiptStatus() == ReceiptVoucherStatus.REJECTED
                || receipt.getReceiptStatus() == ReceiptVoucherStatus.REVERSED) {
            throw new BadRequestException("Cannot create Delivery Challan from " + receipt.getReceiptStatus() + " Receipt Voucher.");
        }
        if (receipt.getReceiptStatus() == ReceiptVoucherStatus.DRAFT || receipt.getReceiptStatus() == ReceiptVoucherStatus.SUBMITTED) {
            throw new BadRequestException("Receipt Voucher must be APPROVED or POSTED before creating Delivery Challan. Current status: " + receipt.getReceiptStatus());
        }

        // 3. Resolve linked Sales Invoice
        List<ReceiptAllocation> activeSiAllocations = receipt.getAllocations() != null
                ? receipt.getAllocations().stream()
                    .filter(a -> !Boolean.TRUE.equals(a.getIsDeleted()))
                    .filter(a -> a.getSalesInvoice() != null || a.getSalesInvoiceId() != null)
                    .filter(a -> a.getAllocatedAmount() != null && a.getAllocatedAmount().compareTo(BigDecimal.ZERO) > 0)
                    .toList()
                : Collections.emptyList();

        UUID targetInvoiceId;
        if (request.getSalesInvoiceId() != null) {
            targetInvoiceId = request.getSalesInvoiceId();
            boolean matched = activeSiAllocations.stream().anyMatch(a -> targetInvoiceId.equals(a.getSalesInvoiceId()));
            if (!matched && (receipt.getSalesInvoice() == null || !targetInvoiceId.equals(receipt.getSalesInvoice().getId()))) {
                throw new BadRequestException("Sales Invoice " + targetInvoiceId + " is not allocated in Receipt Voucher " + receipt.getReceiptNo());
            }
        } else if (!activeSiAllocations.isEmpty()) {
            Set<UUID> allocatedSiIds = activeSiAllocations.stream().map(ReceiptAllocation::getSalesInvoiceId).collect(Collectors.toSet());
            if (allocatedSiIds.size() > 1) {
                throw new BadRequestException("Receipt Voucher is allocated to multiple Sales Invoices: " + allocatedSiIds + ". Please specify salesInvoiceId in the request.");
            }
            targetInvoiceId = allocatedSiIds.iterator().next();
        } else if (receipt.getSalesInvoice() != null) {
            targetInvoiceId = receipt.getSalesInvoice().getId();
        } else {
            throw new BadRequestException("Receipt Voucher " + receipt.getReceiptNo() + " is not linked to any Sales Invoice.");
        }

        // 4. Acquire pessimistic write lock to serialize concurrent conversion requests for this Sales Invoice
        SalesInvoice invoice;
        try {
            invoice = salesInvoiceRepository
                    .findByIdAndCompanyIdAndIsDeletedFalseWithLock(targetInvoiceId, resolvedCompanyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sales Invoice not found with ID: " + targetInvoiceId));
        } catch (org.springframework.dao.PessimisticLockingFailureException | jakarta.persistence.PessimisticLockException | jakarta.persistence.LockTimeoutException e) {
            log.error("Concurrent lock conflict on Sales Invoice: {}", targetInvoiceId, e);
            throw new ConflictException("Sales Invoice is currently being processed by another transaction. Please retry.", e);
        }

        // 5. Validate Sales Invoice status
        if (invoice.getStatus() == InvoiceStatus.CANCELLED
                || invoice.getStatus() == InvoiceStatus.REJECTED
                || invoice.getStatus() == InvoiceStatus.VOIDED
                || invoice.getStatus() == InvoiceStatus.REVERSED) {
            throw new BadRequestException("Cannot create Delivery Challan for Sales Invoice with status: " + invoice.getStatus());
        }

        // 6. Validate customer match
        if (receipt.getCustomer() != null && invoice.getCustomerId() != null
                && !invoice.getCustomerId().equals(receipt.getCustomer().getId())) {
            throw new BadRequestException(String.format("Customer on Sales Invoice (%s) does not match Receipt Voucher customer (%s).",
                    invoice.getCustomer() != null ? invoice.getCustomer().getCustomerName() : invoice.getCustomerId(),
                    receipt.getCustomer().getCustomerName()));
        }

        // 7. Validate Sales Invoice contains active items
        Set<SalesInvoiceItem> invoiceItems = invoice.getSalesInvoiceItems();
        List<SalesInvoiceItem> activeInvoiceItems = invoiceItems != null
                ? invoiceItems.stream().filter(i -> !Boolean.TRUE.equals(i.getIsDeleted())).toList()
                : Collections.emptyList();

        if (activeInvoiceItems.isEmpty()) {
            throw new BadRequestException("Sales Invoice contains no active items to dispatch.");
        }

        Map<UUID, SalesInvoiceItem> siItemMap = activeInvoiceItems.stream()
                .collect(Collectors.toMap(SalesInvoiceItem::getId, item -> item));

        // 8. Validate requested item IDs (duplicate check & ownership check)
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            Set<UUID> seenItemIds = new HashSet<>();
            Set<UUID> duplicateItemIds = new LinkedHashSet<>();
            for (DcFromReceiptRequest.DcFromReceiptItemRequest itemReq : request.getItems()) {
                if (itemReq.getSourceSalesInvoiceItemId() == null) {
                    throw new BadRequestException("Sales Invoice Item ID is required for each item in request.");
                }
                if (!seenItemIds.add(itemReq.getSourceSalesInvoiceItemId())) {
                    duplicateItemIds.add(itemReq.getSourceSalesInvoiceItemId());
                }
                if (!siItemMap.containsKey(itemReq.getSourceSalesInvoiceItemId())) {
                    throw new BadRequestException("Sales Invoice Item ID " + itemReq.getSourceSalesInvoiceItemId() +
                            " does not belong to Sales Invoice: " + invoice.getInvoiceNumber());
                }
            }
            if (!duplicateItemIds.isEmpty()) {
                throw new BadRequestException("Duplicate Sales Invoice Item ID(s) found in request: " + duplicateItemIds);
            }
        }

        // 9. Query previously dispatched/reserved quantities for all items of this Sales Invoice
        List<UUID> siItemIds = activeInvoiceItems.stream().map(SalesInvoiceItem::getId).toList();
        List<Object[]> dispatchedRecords = deliveryChallanItemRepository
                .sumDispatchedQuantityBySiItemIds(siItemIds, resolvedCompanyId, ACTIVE_DISPATCH_STATUSES);

        Map<UUID, BigDecimal> alreadyDispatchedMap = new HashMap<>();
        if (dispatchedRecords != null) {
            for (Object[] record : dispatchedRecords) {
                UUID itemId = (UUID) record[0];
                BigDecimal qty = record[1] instanceof BigDecimal bd ? bd : new BigDecimal(record[1].toString());
                alreadyDispatchedMap.put(itemId, qty);
            }
        }

        // 10. Build Delivery Challan line items using root-level warehouseId
        List<DeliveryChallanItem> newItems = new ArrayList<>();
        Map<WarehouseLocationKey, WarehouseAccountResponse> validatedWhLocCache = new HashMap<>();
        UUID rootWarehouseId = request.getWarehouseId();

        if (request.getItems() == null || request.getItems().isEmpty()) {
            // Full dispatch: dispatch remaining open quantities for all items
            for (SalesInvoiceItem siItem : activeInvoiceItems) {
                BigDecimal alreadyDispatched = alreadyDispatchedMap.getOrDefault(siItem.getId(), BigDecimal.ZERO);
                BigDecimal remainingQty = siItem.getQuantity().subtract(alreadyDispatched);

                if (remainingQty.compareTo(BigDecimal.ZERO) <= 0) {
                    continue; // Skip already fulfilled items
                }

                UUID effectiveLocationId = request.getLocationId() != null
                        ? request.getLocationId()
                        : siItem.getLocationId();

                validateWarehouseAndLocation(rootWarehouseId, effectiveLocationId, resolvedCompanyId, siItem.getItemName(), validatedWhLocCache);

                DeliveryChallanItem dcItem = buildDeliveryChallanItemFromSi(
                        resolvedCompanyId, invoice, siItem, remainingQty, rootWarehouseId, effectiveLocationId, siItem.getNotes());
                newItems.add(dcItem);
            }
        } else {
            // Partial dispatch: dispatch specified quantities
            for (DcFromReceiptRequest.DcFromReceiptItemRequest itemReq : request.getItems()) {
                SalesInvoiceItem siItem = siItemMap.get(itemReq.getSourceSalesInvoiceItemId());
                BigDecimal requestedQty = itemReq.getQuantityToDispatch();

                if (requestedQty == null || requestedQty.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BadRequestException("Quantity to dispatch must be greater than zero for item: " + siItem.getItemName());
                }

                BigDecimal alreadyDispatched = alreadyDispatchedMap.getOrDefault(siItem.getId(), BigDecimal.ZERO);
                BigDecimal remainingQty = siItem.getQuantity().subtract(alreadyDispatched);

                if (requestedQty.compareTo(remainingQty) > 0) {
                    throw new BadRequestException(String.format(
                            "Dispatch quantity (%.4f) cannot exceed remaining open quantity (%.4f) for item: %s. Original quantity: %.4f, previously dispatched/reserved: %.4f",
                            requestedQty, remainingQty, siItem.getItemName(), siItem.getQuantity(), alreadyDispatched));
                }

                UUID effectiveLocationId = itemReq.getWarehouseLocationId() != null
                        ? itemReq.getWarehouseLocationId()
                        : (request.getLocationId() != null ? request.getLocationId() : siItem.getLocationId());

                validateWarehouseAndLocation(rootWarehouseId, effectiveLocationId, resolvedCompanyId, siItem.getItemName(), validatedWhLocCache);

                DeliveryChallanItem dcItem = buildDeliveryChallanItemFromSi(
                        resolvedCompanyId, invoice, siItem, requestedQty, rootWarehouseId, effectiveLocationId, siItem.getNotes());
                newItems.add(dcItem);
            }
        }

        if (newItems.isEmpty()) {
            throw new BadRequestException("No items available for dispatch. All items in Sales Invoice " + invoice.getInvoiceNumber() + " are already fully dispatched or reserved.");
        }

        // 11. Create and persist Delivery Challan
        LocalDate dcDate = LocalDate.now();
        String dcNumber = voucherSequenceService.generateNextDeliveryChallanNumber(resolvedCompanyId, dcDate);

        String billingSnapshot = buildAddressSnapshot(
                invoice.getBillingAddressLine1(), invoice.getBillingAddressLine2(),
                invoice.getBillingCity(), invoice.getBillingState(),
                invoice.getBillingPostalCode(), invoice.getBillingCountry());

        String deliverySnapshot = buildAddressSnapshot(
                invoice.getDeliveryAddressLine1(), invoice.getDeliveryAddressLine2(),
                invoice.getDeliveryCity(), invoice.getDeliveryState(),
                invoice.getDeliveryPostalCode(), invoice.getDeliveryCountry());

        DeliveryChallan dc = DeliveryChallan.builder()
                .companyId(resolvedCompanyId)
                .company(invoice.getCompany())
                .dcNumber(dcNumber)
                .dcDate(dcDate)
                .sourceSalesOrderId(invoice.getSourceSalesOrderId())
                .sourceSalesOrder(null)
                .sourceSalesOrderNumber(invoice.getSourceSalesOrderNumber())
                .sourceSalesInvoiceId(invoice.getId())
                .sourceSalesInvoice(invoice)
                .sourceSalesInvoiceNumber(invoice.getInvoiceNumber())
                .sourceReceiptVoucherId(receipt.getId())
                .sourceReceiptVoucher(receipt)
                .sourceReceiptVoucherNumber(receipt.getReceiptNo())
                .customerId(invoice.getCustomerId())
                .customer(invoice.getCustomer())
                .billingAddressId(invoice.getBillingAddressId())
                .billingAddressSnapshot(billingSnapshot)
                .billingStateCode(invoice.getBillingStateCode())
                .deliveryAddressId(invoice.getDeliveryAddressId())
                .deliveryAddressSnapshot(deliverySnapshot)
                .referenceNumber(invoice.getInvoiceNumber())
                .notes(invoice.getNotes())
                .status(DeliveryChallanStatus.DRAFT)
                .build();

        for (DeliveryChallanItem item : newItems) {
            dc.addDeliveryChallanItem(item);
        }

        recalculateTotals(dc);
        dc = deliveryChallanRepository.save(dc);

        DeliveryChallanResponse response = deliveryChallanMapper.toResponse(dc);
        response.setInvoiceId(invoice.getId());
        response.setInvoiceNumber(invoice.getInvoiceNumber());
        return response;
    }

    private DeliveryChallanItem buildDeliveryChallanItemFromSi(
            UUID companyId,
            SalesInvoice invoice,
            SalesInvoiceItem siItem,
            BigDecimal dispatchQuantity,
            UUID warehouseId,
            UUID locationId,
            String notes) {

        BigDecimal cgstRate = siItem.getCgstAmount() != null && siItem.getTaxableAmount() != null && siItem.getTaxableAmount().compareTo(BigDecimal.ZERO) > 0
                ? siItem.getCgstAmount().multiply(new BigDecimal("100")).divide(siItem.getTaxableAmount(), 2, RoundingMode.HALF_UP)
                : (siItem.getHsnSacMaster() != null && siItem.getHsnSacMaster().getGstSlab() != null ? siItem.getHsnSacMaster().getGstSlab().getCgstRate() : null);

        BigDecimal sgstRate = siItem.getSgstAmount() != null && siItem.getTaxableAmount() != null && siItem.getTaxableAmount().compareTo(BigDecimal.ZERO) > 0
                ? siItem.getSgstAmount().multiply(new BigDecimal("100")).divide(siItem.getTaxableAmount(), 2, RoundingMode.HALF_UP)
                : (siItem.getHsnSacMaster() != null && siItem.getHsnSacMaster().getGstSlab() != null ? siItem.getHsnSacMaster().getGstSlab().getSgstRate() : null);

        BigDecimal igstRate = siItem.getIgstAmount() != null && siItem.getTaxableAmount() != null && siItem.getTaxableAmount().compareTo(BigDecimal.ZERO) > 0
                ? siItem.getIgstAmount().multiply(new BigDecimal("100")).divide(siItem.getTaxableAmount(), 2, RoundingMode.HALF_UP)
                : (siItem.getHsnSacMaster() != null && siItem.getHsnSacMaster().getGstSlab() != null ? siItem.getHsnSacMaster().getGstSlab().getIgstRate() : null);

        BigDecimal cessRate = siItem.getCessAmount() != null && siItem.getTaxableAmount() != null && siItem.getTaxableAmount().compareTo(BigDecimal.ZERO) > 0
                ? siItem.getCessAmount().multiply(new BigDecimal("100")).divide(siItem.getTaxableAmount(), 2, RoundingMode.HALF_UP)
                : (siItem.getHsnSacMaster() != null && siItem.getHsnSacMaster().getGstSlab() != null ? siItem.getHsnSacMaster().getGstSlab().getCessRate() : null);

        DeliveryChallanItem dcItem = DeliveryChallanItem.builder()
                .companyId(companyId)
                .company(invoice.getCompany())
                .sourceSalesInvoiceItemId(siItem.getId())
                .sourceSalesInvoiceItem(siItem)
                .hsnSacMaster(siItem.getHsnSacMaster())
                .itemId(siItem.getItemId())
                .itemName(siItem.getItemName())
                .description(siItem.getDescription())
                .quantity(dispatchQuantity)
                .unit(siItem.getUnit())
                .unitPrice(siItem.getUnitPrice())
                .discountPercent(siItem.getDiscountPercentage())
                .cgstRate(cgstRate)
                .sgstRate(sgstRate)
                .igstRate(igstRate)
                .cessRate(cessRate)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .notes(notes)
                .build();

        dcItem.ensureDerivedAmounts();
        return dcItem;
    }

    private String buildAddressSnapshot(String line1, String line2, String city, String state, String zip, String country) {
        StringBuilder sb = new StringBuilder();
        if (line1 != null && !line1.trim().isEmpty()) sb.append(line1.trim()).append(", ");
        if (line2 != null && !line2.trim().isEmpty()) sb.append(line2.trim()).append(", ");
        if (city != null && !city.trim().isEmpty()) sb.append(city.trim()).append(", ");
        if (state != null && !state.trim().isEmpty()) sb.append(state.trim()).append(" ");
        if (zip != null && !zip.trim().isEmpty()) sb.append(zip.trim()).append(", ");
        if (country != null && !country.trim().isEmpty()) sb.append(country.trim());

        String result = sb.toString().trim();
        if (result.endsWith(",")) {
            result = result.substring(0, result.length() - 1).trim();
        }
        return result.isEmpty() ? null : result;
    }

    private void validateWarehouseAndLocation(
            UUID warehouseId,
            UUID locationId,
            UUID expectedCompanyId,
            String itemName,
            Map<WarehouseLocationKey, WarehouseAccountResponse> cache) {

        if (warehouseId == null) {
            throw new BadRequestException("Warehouse ID is required for item: " + itemName);
        }

        WarehouseLocationKey key = new WarehouseLocationKey(warehouseId, locationId);
        WarehouseAccountResponse response;
        if (cache.containsKey(key)) {
            response = cache.get(key);
        } else {
            try {
                response = inventoryIntegrationService.getWarehouseAccount(warehouseId, locationId);
            } catch (Exception e) {
                log.error("Failed to verify warehouse/location with Inventory MS for warehouseId={}, locationId={}: {}",
                        warehouseId, locationId, e.getMessage());
                throw new BadRequestException(
                        "Warehouse ID " + warehouseId + (locationId != null ? " or location ID " + locationId : "") +
                        " is invalid or could not be verified for item " + itemName + ": " + e.getMessage(), e);
            }
            if (response == null) {
                throw new BadRequestException("Warehouse ID " + warehouseId + " was not found in the inventory system.");
            }
            cache.put(key, response);
        }

        if (response.getCompanyId() != null && !response.getCompanyId().equals(expectedCompanyId)) {
            throw new BadRequestException("Warehouse " + warehouseId + " does not belong to company " + expectedCompanyId);
        }

        if (locationId != null && response.getWarehouseLocation() != null && !response.getWarehouseLocation().equals(locationId)) {
            throw new BadRequestException("Warehouse location " + locationId + " does not belong to warehouse " + warehouseId);
        }
    }

    private DeliveryChallanItem buildDeliveryChallanItem(
            UUID companyId,
            SalesOrder so,
            SalesOrderItem soItem,
            BigDecimal dispatchQuantity,
            UUID warehouseId,
            UUID locationId,
            String notes) {

        DeliveryChallanItem dcItem = DeliveryChallanItem.builder()
                .companyId(companyId)
                .company(so.getCompany())
                .sourceSalesOrderItemId(soItem.getId())
                .sourceSalesOrderItem(soItem)
                .hsnSacMaster(soItem.getHsnSacMaster())
                .itemId(soItem.getItemId())
                .itemName(soItem.getItemName())
                .description(soItem.getDescription())
                .quantity(dispatchQuantity)
                .unit(soItem.getUnit())
                .unitPrice(soItem.getUnitPrice())
                .discountPercent(soItem.getDiscountPercent())
                .cgstRate(soItem.getCgstRate())
                .sgstRate(soItem.getSgstRate())
                .igstRate(soItem.getIgstRate())
                .cessRate(soItem.getCessRate())
                .warehouseId(warehouseId)
                .locationId(locationId)
                .notes(notes)
                .build();

        dcItem.ensureDerivedAmounts();
        return dcItem;
    }

    @Override
    @Transactional
    public DeliveryChallanResponse updateDeliveryChallan(UUID companyId, UUID id,
            DeliveryChallanUpdateRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        DeliveryChallan dc = getDeliveryChallanOrThrow(resolvedCompanyId, id);

        if (dc.getStatus() != DeliveryChallanStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT Delivery Challans can be updated.");
        }

        if (request.getDeliveryAddressId() != null)
            dc.setDeliveryAddressId(request.getDeliveryAddressId());
        if (request.getReferenceNumber() != null)
            dc.setReferenceNumber(request.getReferenceNumber());
        if (request.getDispatchDate() != null)
            dc.setDispatchDate(request.getDispatchDate());
        if (request.getTransporterId() != null)
            dc.setTransporterId(request.getTransporterId());
        if (request.getVehicleNumber() != null)
            dc.setVehicleNumber(request.getVehicleNumber());
        if (request.getLrNumber() != null)
            dc.setLrNumber(request.getLrNumber());
        if (request.getNotes() != null)
            dc.setNotes(request.getNotes());

        if (request.getItems() != null) {
            Map<UUID, DeliveryChallanItem> itemMap = dc.getItems().stream()
                    .collect(Collectors.toMap(DeliveryChallanItem::getId, item -> item));

            for (DeliveryChallanItemUpdateRequest itemRequest : request.getItems()) {
                DeliveryChallanItem dcItem = itemMap.get(itemRequest.getId());
                if (dcItem == null) {
                    throw new BadRequestException(
                            "Item ID " + itemRequest.getId() + " does not belong to this Delivery Challan.");
                }

                if (itemRequest.getQuantity() != null) {
                    BigDecimal maxAllowed = dcItem.getSourceSalesOrderItem() != null
                            ? dcItem.getSourceSalesOrderItem().getQuantity()
                            : (dcItem.getSourceSalesInvoiceItem() != null
                                ? dcItem.getSourceSalesInvoiceItem().getQuantity()
                                : null);
                    if (maxAllowed != null && itemRequest.getQuantity().compareTo(maxAllowed) > 0) {
                        throw new BadRequestException("Dispatch quantity cannot exceed source document quantity for item: "
                                + dcItem.getItemName());
                    }
                    dcItem.setQuantity(itemRequest.getQuantity());
                }

                if (itemRequest.getNotes() != null) {
                    dcItem.setNotes(itemRequest.getNotes());
                }
                dcItem.ensureDerivedAmounts();
            }
            recalculateTotals(dc);
        }

        dc = deliveryChallanRepository.save(dc);
        return deliveryChallanMapper.toResponse(dc);
    }

    @Override
    @Transactional
    public DeliveryChallanResponse submitForApproval(UUID companyId, UUID id, String comments) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        DeliveryChallan dc = deliveryChallanRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery Challan not found"));

        if (dc.getStatus() != DeliveryChallanStatus.DRAFT && dc.getStatus() != DeliveryChallanStatus.CHANGES_REQUESTED) {
            throw new BadRequestException("Only DRAFT or CHANGES_REQUESTED delivery challans can be submitted for approval. Current status: " + dc.getStatus());
        }

        try {
            com.erp.account.integration.workflow.dto.WorkflowTransactionDto existingTx = workflowClient.getWorkflowByDocument(resolvedCompanyId, "DELIVERY_CHALLAN", dc.getId());
            if (existingTx != null && ("PENDING".equalsIgnoreCase(existingTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existingTx.getStatus()))) {
                throw new BadRequestException("Delivery Challan is already submitted for approval with transaction: " + existingTx.getId());
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("No existing workflow transaction found for delivery challan {}", id);
        }

        UUID custId = dc.getCustomer() != null ? dc.getCustomer().getId() : null;
        WorkflowTransactionDto tx = workflowClient.submitWorkflow(
                resolvedCompanyId,
                "DELIVERY_CHALLAN",
                dc.getId(),
                dc.getDcNumber(),
                comments != null ? comments : "Submitted delivery challan for approval",
                BigDecimal.ZERO,
                custId,
                Map.of("dcNumber", dc.getDcNumber() != null ? dc.getDcNumber() : "")
        );

        if (tx != null && "APPROVED".equalsIgnoreCase(tx.getStatus())) {
            dc.setStatus(DeliveryChallanStatus.APPROVED);
            log.info("Delivery Challan {} auto-approved by workflow engine, status updated to APPROVED", dc.getDcNumber());
        } else {
            dc.setStatus(DeliveryChallanStatus.PENDING_APPROVAL);
            log.info("Delivery Challan {} submitted for approval to workflow-service, status updated to PENDING_APPROVAL", dc.getDcNumber());
        }
        dc.setUpdatedBy(TenantUtils.getCurrentUserId());
        DeliveryChallan saved = deliveryChallanRepository.save(dc);
        return deliveryChallanMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void approveDeliveryChallan(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        DeliveryChallan dc = deliveryChallanRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery Challan not found"));

        if (dc.getStatus() != DeliveryChallanStatus.DRAFT && dc.getStatus() != DeliveryChallanStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Only DRAFT or PENDING_APPROVAL delivery challans can be approved");
        }

        dc.setStatus(DeliveryChallanStatus.APPROVED);
        dc.setUpdatedBy(TenantUtils.getCurrentUserId());
        deliveryChallanRepository.save(dc);
        log.info("Delivery Challan {} marked APPROVED", dc.getDcNumber());
    }

    @Override
    @Transactional
    public void confirmDeliveryChallan(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        // Acquire pessimistic write lock to serialize concurrent confirmations and prevent double stock deduction
        DeliveryChallan dc;
        try {
            dc = deliveryChallanRepository
                    .findByIdAndCompanyIdAndIsDeletedFalseWithLock(id, resolvedCompanyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Delivery Challan not found"));
        } catch (org.springframework.dao.PessimisticLockingFailureException | jakarta.persistence.PessimisticLockException | jakarta.persistence.LockTimeoutException e) {
            log.error("Concurrent lock conflict on Delivery Challan: {}", id, e);
            throw new ConflictException("Delivery Challan is currently being processed by another transaction. Please retry.", e);
        }

        log.info("DELIVERY CONFIRM START - DC Number: {}, Company ID: {}, Delivery Challan ID: {}",
                dc.getDcNumber(), resolvedCompanyId, id);

        if (dc.getStatus() != DeliveryChallanStatus.DRAFT && dc.getStatus() != DeliveryChallanStatus.APPROVED) {
            throw new BadRequestException("Delivery Challan is not in DRAFT or APPROVED status.");
        }

        // Execute Inventory Stock OUT integration in the same transaction
        // If stock is insufficient or any inventory error occurs, exception is thrown
        // and transaction rolls back
        inventoryIntegrationService.processDeliveryChallanStockOut(dc, resolvedCompanyId);

        dc.setStatus(DeliveryChallanStatus.CONFIRMED);
        deliveryChallanRepository.save(dc);

        log.info("DELIVERY CHALLAN CONFIRMED - DC Number: {}, Status: CONFIRMED", dc.getDcNumber());
        log.info("DELIVERY CONFIRM COMPLETE - DC Number: {}", dc.getDcNumber());
    }

    @Override
    @Transactional
    public void cancelDeliveryChallan(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        DeliveryChallan dc = getDeliveryChallanOrThrow(resolvedCompanyId, id);
        if (dc.getStatus() == DeliveryChallanStatus.CANCELLED) {
            throw new BadRequestException("Delivery Challan is already CANCELLED.");
        }
        dc.setStatus(DeliveryChallanStatus.CANCELLED);
        deliveryChallanRepository.save(dc);
    }

    @Override
    @Transactional
    public SalesInvoiceResponse generateInvoiceFromDeliveryChallan(UUID companyId, UUID deliveryChallanId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        DeliveryChallan dc = getDeliveryChallanOrThrow(resolvedCompanyId, deliveryChallanId);

        if (dc.getStatus() != DeliveryChallanStatus.CONFIRMED && dc.getStatus() != DeliveryChallanStatus.APPROVED) {
            throw new BadRequestException("Only CONFIRMED or APPROVED Delivery Challans can be invoiced");
        }

        if (salesInvoiceRepository.existsBySourceDeliveryChallanIdAndCompanyIdAndIsDeletedFalse(deliveryChallanId,
                resolvedCompanyId)) {
            throw new BadRequestException("Invoice already exists for this Delivery Challan");
        }

        SalesOrder so = null;
        if (dc.getSourceSalesOrderId() != null) {
            so = salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(dc.getSourceSalesOrderId(), resolvedCompanyId)
                    .orElse(null);
        }

        SalesInvoiceRequest invoiceRequest = new SalesInvoiceRequest();
        invoiceRequest.setCustomerId(dc.getCustomerId());
        invoiceRequest.setDeliveryAddressId(dc.getDeliveryAddressId());

        invoiceRequest.setSourceDeliveryChallanId(dc.getId());
        invoiceRequest.setSourceDeliveryChallanNumber(dc.getDcNumber());

        if (so != null) {
            invoiceRequest.setSourceSalesOrderId(so.getId());
            invoiceRequest.setSourceSalesOrderNumber(so.getSoNumber());
            invoiceRequest.setInvoiceCurrency(so.getCurrency());
            invoiceRequest.setExchangeRate(so.getExchangeRate());
            invoiceRequest.setPlaceOfSupplyStateId(so.getPlaceOfSupplyStateId());
            invoiceRequest.setPaymentTermId(so.getPaymentTermId());
            invoiceRequest.setPaymentTerms(so.getPaymentTerms());
            invoiceRequest.setTermsConditionId(so.getTermsConditionId());
            invoiceRequest.setTermsAndConditions(so.getTermsAndConditions());
            invoiceRequest.setDeliveryTerms(so.getDeliveryTerms());
        } else {
            invoiceRequest.setSourceSalesOrderId(dc.getSourceSalesOrderId());
            invoiceRequest.setSourceSalesOrderNumber(dc.getSourceSalesOrderNumber());
        }

        invoiceRequest.setInvoiceDate(LocalDate.now());
        invoiceRequest.setDueDate(LocalDate.now());

        invoiceRequest.setFreightCharges(BigDecimal.ZERO);
        invoiceRequest.setOtherCharges(BigDecimal.ZERO);
        invoiceRequest.setNotes(dc.getNotes());

        List<SalesInvoiceItemRequest> invoiceItems = dc.getItems().stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .map(item -> {
                    SalesInvoiceItemRequest req = new SalesInvoiceItemRequest();
                    req.setItemId(item.getItemId());
                    req.setHsnSacCode(item.getHsnSacMaster() != null ? item.getHsnSacMaster().getCode() : null);
                    req.setItemName(item.getItemName());
                    req.setDescription(item.getDescription());
                    req.setQuantity(item.getQuantity());
                    req.setUnitPrice(item.getUnitPrice());
                    req.setDiscountPercentage(item.getDiscountPercent());
                    req.setUnit(item.getUnit());
                    req.setWarehouseId(item.getWarehouseId());
                    req.setLocationId(item.getLocationId());
                    req.setNotes(item.getNotes());
                    return req;
                })
                .collect(Collectors.toList());

        if (invoiceItems.isEmpty()) {
            throw new BadRequestException("Delivery Challan has no valid items to invoice");
        }

        invoiceRequest.setItems(invoiceItems);

        com.erp.account.common.dto.request.RequestWrapper<SalesInvoiceRequest> wrapper = new com.erp.account.common.dto.request.RequestWrapper<>();
        wrapper.setData(invoiceRequest);

        SalesInvoiceResponse response = salesInvoiceService.createInvoice(wrapper, resolvedCompanyId);

        // Link unlinked PI allocations to the newly created Sales Invoice if available
        if (so != null && so.getSourceProformaInvoiceId() != null && response != null && response.getId() != null) {
            List<ReceiptAllocation> piAllocations = receiptAllocationRepository.findByProformaInvoiceId(so.getSourceProformaInvoiceId());
            if (piAllocations != null && !piAllocations.isEmpty()) {
                SalesInvoice createdInvoice = salesInvoiceRepository.findById(response.getId()).orElse(null);
                if (createdInvoice != null) {
                    for (ReceiptAllocation alloc : piAllocations) {
                        if (alloc.getSalesInvoice() == null && !Boolean.TRUE.equals(alloc.getIsDeleted())) {
                            alloc.setSalesInvoice(createdInvoice);
                            alloc.setSalesInvoiceId(createdInvoice.getId());
                            receiptAllocationRepository.save(alloc);
                        }
                    }
                }
            }
        }

        log.info("Invoice generated successfully from Delivery Challan: dcNumber={}, invoiceNumber={}",
                dc.getDcNumber(), response != null ? response.getInvoiceNumber() : "null");

        return response;
    }

    private void recalculateTotals(DeliveryChallan dc) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;

        for (DeliveryChallanItem item : dc.getItems()) {
            BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
            BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal gross = qty.multiply(price);
            subtotal = subtotal.add(gross);
            discount = discount.add(item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO);
            tax = tax.add(item.getTaxAmount() != null ? item.getTaxAmount() : BigDecimal.ZERO);
            total = total.add(item.getTotalAmount() != null ? item.getTotalAmount() : BigDecimal.ZERO);
        }

        dc.setSubtotal(subtotal.setScale(4, RoundingMode.HALF_UP));
        dc.setDiscountAmount(discount.setScale(4, RoundingMode.HALF_UP));
        dc.setTaxAmount(tax.setScale(4, RoundingMode.HALF_UP));
        dc.setTotalAmount(total.setScale(4, RoundingMode.HALF_UP));
    }

    private DeliveryChallan getDeliveryChallanOrThrow(UUID companyId, UUID id) {
        return deliveryChallanRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery Challan not found"));
    }

    private Pageable sanitizePageable(Pageable pageable) {
        if (pageable == null || pageable.isUnpaged()) {
            return pageable;
        }

        Sort sort = pageable.getSort();
        if (sort == null || sort.isUnsorted()) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        List<Sort.Order> safeOrders = new ArrayList<>();
        Sort.Direction pendingDirection = null;

        for (Sort.Order order : sort) {
            String prop = order.getProperty();
            if (prop == null || prop.isBlank()) {
                continue;
            }
            String trimmed = prop.trim();
            if ("desc".equalsIgnoreCase(trimmed)) {
                pendingDirection = Sort.Direction.DESC;
            } else if ("asc".equalsIgnoreCase(trimmed)) {
                pendingDirection = Sort.Direction.ASC;
            } else {
                String safeProp = resolveSortProperty(trimmed);
                safeOrders.add(new Sort.Order(order.getDirection(), safeProp));
            }
        }

        if (pendingDirection != null) {
            if (!safeOrders.isEmpty()) {
                List<Sort.Order> updatedOrders = new ArrayList<>();
                for (int i = 0; i < safeOrders.size(); i++) {
                    Sort.Order o = safeOrders.get(i);
                    if (i == safeOrders.size() - 1) {
                        updatedOrders.add(new Sort.Order(pendingDirection, o.getProperty()));
                    } else {
                        updatedOrders.add(o);
                    }
                }
                safeOrders = updatedOrders;
            } else {
                safeOrders.add(new Sort.Order(pendingDirection, "createdAt"));
            }
        }

        if (safeOrders.isEmpty()) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(safeOrders));
    }

    private String resolveSortProperty(String property) {
        if (property == null) {
            return "createdAt";
        }
        String lower = property.toLowerCase();
        return switch (lower) {
            case "dcnumber", "dc_number" -> "dcNumber";
            case "dcdate", "dc_date" -> "dcDate";
            case "sourcesalesordernumber", "sourcesonumber", "source_so_number", "sonumber", "so_number" ->
                "sourceSalesOrderNumber";
            case "customerid", "customer_id" -> "customerId";
            case "customername", "customer_name" -> "customer.customerName";
            case "dispatchdate", "dispatch_date" -> "dispatchDate";
            case "vehiclenumber", "vehicle_number" -> "vehicleNumber";
            case "lrnumber", "lr_number" -> "lrNumber";
            case "referencenumber", "reference_number" -> "referenceNumber";
            case "subtotal" -> "subtotal";
            case "discountamount", "discount_amount" -> "discountAmount";
            case "taxamount", "tax_amount" -> "taxAmount";
            case "totalamount", "total_amount", "total" -> "totalAmount";
            case "status" -> "status";
            case "createdat", "created_at" -> "createdAt";
            case "updatedat", "updated_at" -> "updatedAt";
            default -> "createdAt";
        };
    }
}
