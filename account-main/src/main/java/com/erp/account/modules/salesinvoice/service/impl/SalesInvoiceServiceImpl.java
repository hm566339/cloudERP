package com.erp.account.modules.salesinvoice.service.impl;

import com.erp.account.modules.salesinvoice.dto.*;
import com.erp.account.modules.salesinvoice.specification.SalesInvoiceSpecification;
import org.springframework.data.jpa.domain.Specification;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.common.client.InventoryClient;
import com.erp.account.common.dto.inventory.response.LocationStockIntegrationResponse;
import com.erp.account.common.dto.inventory.response.ProductDetailResponse;
import com.erp.account.common.dto.inventory.response.ProductStockIntegrationResponse;
import com.erp.account.common.dto.inventory.response.WarehouseAccountResponse;
import com.erp.account.common.dto.inventory.response.WarehouseStockIntegrationResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.*;
import com.erp.account.modules.salesinvoice.mapper.SalesInvoiceItemMapper;
import com.erp.account.modules.salesinvoice.mapper.SalesInvoiceMapper;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import com.erp.account.modules.customer.repository.CustomerRepository;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.dto.response.GlJournalEntryResponse;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.gst.entity.GstStateCode;
import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import com.erp.account.modules.gst.repository.GstRegistrationRepository;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.modules.integration.inventory.repository.InventorySyncTaskRepository;
import com.erp.account.modules.integration.inventory.entity.InventorySyncTask;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.salesinvoice.service.SalesInvoiceService;
import com.erp.account.util.InvoiceValidationUtil;
import com.erp.account.util.TenantUtils;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.enums.PostingStatus;
import com.erp.account.common.service.GstCalculationService;

@Slf4j
@Service
@Transactional
@AllArgsConstructor
public class SalesInvoiceServiceImpl implements SalesInvoiceService {

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final CustomerRepository customerRepository;
    private final SalesInvoiceMapper salesInvoiceMapper;
    private final SalesInvoiceItemMapper salesInvoiceItemMapper;
    private final AccountingValidationService accountingValidationService;
    private final GlJournalEntryService glJournalEntryService;
    private final HsnSacMasterRepository hsnSacMasterRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final GstCalculationService gstCalculationService;
    private final ApplicationEventPublisher eventPublisher;
    private final InventoryIntegrationService inventoryIntegrationService;
    private final TransactionTemplate transactionTemplate;
    private final InventorySyncTaskRepository inventorySyncTaskRepository;
    private final com.erp.account.modules.gst.repository.GstStateCodeRepository gstStateCodeRepository;
    private final com.erp.account.modules.company.repository.CompanyRepository companyRepository;
    private final GstRegistrationRepository gstRegistrationRepository;
    private final com.erp.account.modules.settings.repository.PaymentTermRepository paymentTermRepository;
    private final com.erp.account.modules.settings.repository.TermsConditionRepository termsConditionRepository;
    private final WorkflowClient workflowClient;

    @Override
    public SalesInvoiceResponse createInvoice(RequestWrapper<SalesInvoiceRequest> requestWrapper, UUID companyId) {
        SalesInvoiceRequest request = requestWrapper.unwrap();

        if (request.getInvoiceNumber() == null || request.getInvoiceNumber().trim().isEmpty()) {
            request.setInvoiceNumber("INV-" + LocalDate.now().getYear() + "-"
                    + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        }

        log.info("Creating sales invoice: {} for company: {}", request.getInvoiceNumber(), companyId);
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);

        try {
            // Validate request
            validateInvoice(request);

            // Map DTO to entity
            SalesInvoice invoice = salesInvoiceMapper.requestToEntity(request);
            invoice.setCompanyId(resolvedCompanyId);
            invoice.setStatus(InvoiceStatus.DRAFT);
            invoice.setPaymentStatus(PaymentStatus.UNPAID);
            invoice.setGlPostingStatus(PostingStatus.DRAFT);
            invoice.setIsDeleted(false);

            // Fetch and set Company entity for proper DTO mapping
            companyRepository.findById(resolvedCompanyId).ifPresent(invoice::setCompany);

            // Set audit fields
            invoice.setCreatedBy(TenantUtils.getCurrentUserId());
            invoice.setUpdatedBy(TenantUtils.getCurrentUserId());

            // Load and set customer
            Customer customer = getValidatedCustomer(request.getCustomerId());
            invoice.setCustomer(customer);
            invoice.setCustomerId(customer.getId());

            // Snapshot billing address from Customer Master
            snapshotBillingAddress(invoice, customer);

            if (request.getPlaceOfSupplyStateId() != null) {
                GstStateCode posState = gstStateCodeRepository.findById(request.getPlaceOfSupplyStateId())
                        .orElseThrow(() -> new ValidationException("Invalid Place of Supply State ID"));
                invoice.setPlaceOfSupplyStateId(posState.getId());
                invoice.setPlaceOfSupplyStateCode(posState.getStateCode());
            }

            // Map line items
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                List<SalesInvoiceItem> items = request.getItems().stream()
                        .map(itemRequest -> {
                            SalesInvoiceItem item = salesInvoiceItemMapper.requestToEntity(itemRequest);
                            item.setCompanyId(resolvedCompanyId);
                            item.setSalesInvoice(invoice);
                            if (item.getItemName() == null || item.getItemName().isBlank()) {
                                item.setItemName(
                                        itemRequest.getDescription() != null && !itemRequest.getDescription().isBlank()
                                                ? itemRequest.getDescription()
                                                : "Item");
                            }
                            if (itemRequest.getHsnSacCode() != null) {
                                HsnSacMaster hsnMaster = hsnSacMasterRepository
                                        .findByCodeAndIsDeletedFalse(itemRequest.getHsnSacCode())
                                        .orElseThrow(() -> new ValidationException("Invalid HSN/SAC code"));
                                item.setHsnSacMaster(hsnMaster);
                            } else {
                                throw new ValidationException("HSN/SAC code is required for tax calculation");
                            }
                            return item;
                        })
                        .collect(Collectors.toList());
                invoice.setSalesInvoiceItems(new HashSet<>(items));
            }

            resolveSettingsForCreate(resolvedCompanyId, request, invoice);

            // Set freight charges and other charges before recalculating
            if (request.getFreightCharges() != null) {
                invoice.setFreightCharges(request.getFreightCharges());
            } else if (invoice.getFreightCharges() == null) {
                invoice.setFreightCharges(BigDecimal.ZERO);
            }

            BigDecimal otherCharges = request.getOtherCharges() != null ? request.getOtherCharges()
                    : (invoice.getOtherCharges() != null ? invoice.getOtherCharges() : BigDecimal.ZERO);
            invoice.setOtherCharges(otherCharges);

            // Calculate totals
            recalculateTotals(invoice);

            // Resolve default GL accounts if not provided
            resolveDefaultAccounts(invoice, resolvedCompanyId);

            // Received & Outstanding Amount & Payment Status calculation
            BigDecimal received = request.getReceivedAmount() != null ? request.getReceivedAmount() : BigDecimal.ZERO;
            if (received.compareTo(BigDecimal.ZERO) < 0) {
                throw new ValidationException("Received amount cannot be negative");
            }
            if (received.compareTo(invoice.getTotalAmount()) > 0) {
                throw new ValidationException("Received amount cannot exceed total invoice amount");
            }
            invoice.setReceivedAmount(received.setScale(4, RoundingMode.HALF_UP));
            invoice.setOutstandingAmount(invoice.getTotalAmount().subtract(received).setScale(4, RoundingMode.HALF_UP));

            if (received.compareTo(BigDecimal.ZERO) == 0) {
                invoice.setPaymentStatus(PaymentStatus.UNPAID);
            } else if (received.compareTo(invoice.getTotalAmount()) >= 0) {
                invoice.setPaymentStatus(PaymentStatus.PAID);
            } else {
                invoice.setPaymentStatus(PaymentStatus.PARTIAL);
            }

            validatePostingAccounts(invoice, resolvedCompanyId);
            validateCreditLimit(null, invoice, customer, resolvedCompanyId);

            // Save
            SalesInvoice saved = salesInvoiceRepository.save(invoice);
            // publish cache eviction event to run after successful commit
            if (eventPublisher != null) {
                eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
            }
            log.info("Sales invoice created successfully: {} with ID: {}",
                    saved.getInvoiceNumber(), saved.getId());

            return enrichAndReturnResponse(salesInvoiceMapper.entityToResponse(saved), saved);
        } catch (Exception e) {
            log.error("Error creating sales invoice: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public SalesInvoiceResponse updateInvoice(UUID invoiceId, RequestWrapper<SalesInvoiceRequest> requestWrapper) {
        SalesInvoiceRequest request = requestWrapper.unwrap();
        log.info("Updating sales invoice: {}", invoiceId);

        SalesInvoice invoice = getValidatedInvoiceForUpdate(invoiceId);
        UUID companyId = invoice.getCompanyId();

        try {
            // Validate request
            validateInvoice(invoiceId, request);

            // Update basic fields
            salesInvoiceMapper.updateEntityFromRequest(request, invoice);
            invoice.setUpdatedBy(TenantUtils.getCurrentUserId());

            // Check if customer changed
            if (!invoice.getCustomerId().equals(request.getCustomerId())) {
                Customer newCustomer = getValidatedCustomer(request.getCustomerId());
                invoice.setCustomer(newCustomer);
                invoice.setCustomerId(newCustomer.getId());
                snapshotBillingAddress(invoice, newCustomer);
            }

            if (request.getPlaceOfSupplyStateId() != null) {
                com.erp.account.modules.gst.entity.GstStateCode posState = gstStateCodeRepository
                        .findById(request.getPlaceOfSupplyStateId())
                        .orElseThrow(() -> new ValidationException("Invalid Place of Supply State ID"));
                invoice.setPlaceOfSupplyStateId(posState.getId());
                invoice.setPlaceOfSupplyStateCode(posState.getStateCode());
            } else {
                invoice.setPlaceOfSupplyStateId(null);
                invoice.setPlaceOfSupplyStateCode(null);
            }

            resolveSettingsForUpdate(companyId, request, invoice);

            // Update line items using Merge Strategy
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                java.util.Map<UUID, SalesInvoiceItem> existingItems = invoice.getSalesInvoiceItems().stream()
                        .collect(Collectors.toMap(SalesInvoiceItem::getId, item -> item));

                for (com.erp.account.modules.salesinvoice.dto.SalesInvoiceItemRequest itemRequest : request
                        .getItems()) {
                    if (itemRequest.getId() != null && existingItems.containsKey(itemRequest.getId())) {
                        // Update existing item
                        SalesInvoiceItem item = existingItems.get(itemRequest.getId());
                        salesInvoiceItemMapper.updateEntityFromRequest(itemRequest, item);
                        if (itemRequest.getHsnSacCode() != null) {
                            HsnSacMaster hsnMaster = hsnSacMasterRepository
                                    .findByCodeAndIsDeletedFalse(itemRequest.getHsnSacCode())
                                    .orElseThrow(() -> new ValidationException("Invalid HSN/SAC ID"));
                            item.setHsnSacMaster(hsnMaster);
                        } else {
                            throw new ValidationException("HSN/SAC ID is required for tax calculation");
                        }
                        existingItems.remove(itemRequest.getId());
                    } else {
                        // Add new item
                        SalesInvoiceItem newItem = salesInvoiceItemMapper.requestToEntity(itemRequest);
                        newItem.setCompanyId(companyId);
                        if (itemRequest.getHsnSacCode() != null) {
                            HsnSacMaster hsnMaster = hsnSacMasterRepository
                                    .findByCodeAndIsDeletedFalse(itemRequest.getHsnSacCode())
                                    .orElseThrow(() -> new ValidationException("Invalid HSN/SAC code"));
                            newItem.setHsnSacMaster(hsnMaster);
                        } else {
                            throw new ValidationException("HSN/SAC code is required for tax calculation");
                        }
                        invoice.addSalesInvoiceItem(newItem);
                    }
                }

                // Removed invoice lines are soft-deleted so historical line IDs are not
                // destroyed.
                existingItems.values().forEach(item -> item.setIsDeleted(true));
            }

            // Set freight charges and other charges before recalculating
            if (request.getFreightCharges() != null) {
                invoice.setFreightCharges(request.getFreightCharges());
            } else if (invoice.getFreightCharges() == null) {
                invoice.setFreightCharges(BigDecimal.ZERO);
            }

            BigDecimal otherCharges = request.getOtherCharges() != null ? request.getOtherCharges()
                    : (invoice.getOtherCharges() != null ? invoice.getOtherCharges() : BigDecimal.ZERO);
            invoice.setOtherCharges(otherCharges);

            // Recalculate totals
            recalculateTotals(invoice);

            // Resolve default GL accounts if not provided
            resolveDefaultAccounts(invoice, companyId);

            BigDecimal received = request.getReceivedAmount() != null ? request.getReceivedAmount()
                    : (invoice.getReceivedAmount() != null ? invoice.getReceivedAmount() : BigDecimal.ZERO);
            if (received.compareTo(BigDecimal.ZERO) < 0) {
                throw new ValidationException("Received amount cannot be negative");
            }
            if (received.compareTo(invoice.getTotalAmount()) > 0) {
                throw new ValidationException("Received amount cannot exceed total invoice amount");
            }
            invoice.setReceivedAmount(received.setScale(4, RoundingMode.HALF_UP));
            invoice.setOutstandingAmount(invoice.getTotalAmount().subtract(received).setScale(4, RoundingMode.HALF_UP));

            if (received.compareTo(BigDecimal.ZERO) == 0) {
                invoice.setPaymentStatus(PaymentStatus.UNPAID);
            } else if (received.compareTo(invoice.getTotalAmount()) >= 0) {
                invoice.setPaymentStatus(PaymentStatus.PAID);
            } else {
                invoice.setPaymentStatus(PaymentStatus.PARTIAL);
            }

            validatePostingAccounts(invoice, companyId);
            validateCreditLimit(invoiceId, invoice, invoice.getCustomer(), companyId);

            // Save
            SalesInvoice updated = salesInvoiceRepository.save(invoice);
            if (eventPublisher != null) {
                eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
            }
            log.info("Sales invoice updated successfully: {}", invoiceId);

            return enrichAndReturnResponse(salesInvoiceMapper.entityToResponse(updated), updated);
        } catch (Exception e) {
            log.error("Error updating sales invoice: {}", e.getMessage(), e);
            throw e;
        }
    }

    public void deleteInvoice(UUID invoiceId) {
        log.info("Deleting sales invoice: {}", invoiceId);

        SalesInvoice invoice = getValidatedInvoiceForDelete(invoiceId);
        invoice.setIsDeleted(true);
        salesInvoiceRepository.save(invoice);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }

        log.info("Sales invoice deleted successfully: {}", invoiceId);
    }

    private UUID resolveCompanyId() {
        if (TenantUtils.isSystemAdmin()) {
            return null;
        }

        UUID currentCompanyId = TenantUtils.getCurrentCompanyId();
        if (currentCompanyId != null) {
            return currentCompanyId;
        }

        throw new UnauthorizedException("Company context is missing for the current user");
    }

    private SalesInvoice resolveInvoiceById(UUID invoiceId) {
        if (TenantUtils.isSystemAdmin()) {
            return salesInvoiceRepository.findByIdAndIsDeletedFalse(invoiceId)
                    .orElseThrow(() -> SalesInvoiceNotFoundException.ofId(invoiceId));
        }

        UUID resolvedCompanyId = resolveCompanyId();
        return salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, resolvedCompanyId)
                .orElseThrow(() -> SalesInvoiceNotFoundException.ofId(invoiceId));
    }

    // ============================================================
    // QUERY OPERATIONS - BASIC
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public SalesInvoiceProfileResponse getInvoiceById(UUID invoiceId) {
        log.debug("Fetching invoice profile by ID: {}", invoiceId);

        SalesInvoice invoice = resolveInvoiceById(invoiceId);
        return buildInvoiceProfileResponse(invoice);
    }

    private SalesInvoiceProfileResponse buildInvoiceProfileResponse(SalesInvoice inv) {
        Company comp = inv.getCompany();
        Customer cust = inv.getCustomer();

        // Fetch Warehouse Information from Inventory MS
        Map<UUID, ProductStockIntegrationResponse> stockCache = new HashMap<>();
        Set<SiWarehouseSummaryDto> uniqueWarehouses = new HashSet<>();

        // Line Items
        List<SiLineItemDto> lineItems = new ArrayList<>();
        if (inv.getSalesInvoiceItems() != null) {
            for (SalesInvoiceItem item : inv.getSalesInvoiceItems()) {
                if (Boolean.TRUE.equals(item.getIsDeleted()))
                    continue;

                SiItemInventoryDto inventoryDto = null;
                if (item.getItemId() != null && comp != null) {
                    try {
                        UUID pId = item.getItemId();
                        ProductStockIntegrationResponse stockData = stockCache
                                .get(pId);
                        if (!stockCache.containsKey(pId)) {
                            List<ProductStockIntegrationResponse> res = inventoryIntegrationService
                                    .getGroupedStock(comp.getId(), pId);
                            if (res != null && !res.isEmpty()) {
                                stockData = res.get(0);
                            }
                            stockCache.put(pId, stockData);
                        }

                        if (stockData != null && stockData.getWarehouses() != null) {
                            WarehouseStockIntegrationResponse selectedWarehouse = stockData
                                    .getWarehouses().stream()
                                    .filter(w -> w.getWarehouseId() != null
                                            && w.getWarehouseId().equals(item.getWarehouseId()))
                                    .findFirst().orElse(null);

                            if (selectedWarehouse != null && selectedWarehouse.getLocations() != null) {
                                LocationStockIntegrationResponse selectedLocation = selectedWarehouse
                                        .getLocations().stream()
                                        .filter(l -> l.getLocationId() != null
                                                && l.getLocationId().equals(item.getLocationId()))
                                        .findFirst().orElse(null);

                                if (selectedLocation != null) {
                                    inventoryDto = SiItemInventoryDto.builder()
                                            .warehouseId(selectedWarehouse.getWarehouseId())
                                            .warehouseName(selectedWarehouse.getWarehouseName())
                                            .locationId(selectedLocation.getLocationId())
                                            .locationName(selectedLocation.getLocationName())
                                            .batchId(selectedLocation.getBatchId())
                                            .batchCode(selectedLocation.getBatchCode())
                                            .stockQuantity(selectedLocation.getQuantity())
                                            .reservedQuantity(selectedLocation.getReservedQuantity())
                                            .availableQuantity(selectedLocation.getAvailableQuantity())
                                            .inventoryFetchStatus("SUCCESS")
                                            .build();

                                    // Add to unique warehouses summary
                                    SiLocationSummaryDto locSummary = SiLocationSummaryDto.builder()
                                            .locationId(selectedLocation.getLocationId())
                                            .locationName(selectedLocation.getLocationName())
                                            .build();

                                    SiWarehouseSummaryDto whSummary = uniqueWarehouses.stream()
                                            .filter(w -> w.getWarehouseId().equals(selectedWarehouse.getWarehouseId()))
                                            .findFirst().orElseGet(() -> {
                                                SiWarehouseSummaryDto w = SiWarehouseSummaryDto.builder()
                                                        .warehouseId(selectedWarehouse.getWarehouseId())
                                                        .warehouseName(selectedWarehouse.getWarehouseName())
                                                        .locations(new java.util.ArrayList<>())
                                                        .build();
                                                uniqueWarehouses.add(w);
                                                return w;
                                            });

                                    if (whSummary.getLocations().stream()
                                            .noneMatch(l -> l.getLocationId().equals(locSummary.getLocationId()))) {
                                        whSummary.getLocations().add(locSummary);
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Failed to fetch inventory data for product {} - {}", item.getItemId(),
                                e.getMessage());
                        inventoryDto = SiItemInventoryDto.builder().inventoryFetchStatus("FAILED").build();
                    }
                }

                if (inventoryDto == null) {
                    inventoryDto = SiItemInventoryDto.builder().inventoryFetchStatus("NOT_FOUND").build();
                }

                lineItems.add(SiLineItemDto.builder()
                        .itemId(item.getId()) // NOTE: user request says `itemId` remains the same but wait, the
                                              // original was item.getId()
                        .itemCode(item.getHsnSacMaster() != null ? item.getHsnSacMaster().getCode() : null)
                        .itemName(item.getDescription())
                        .sku(null)
                        .description(item.getDescription())
                        .hsnSacCode(item.getHsnSacMaster() != null ? item.getHsnSacMaster().getCode() : null)
                        .gstSlab(item.getHsnSacMaster() != null && item.getHsnSacMaster().getGstSlab() != null
                                ? item.getHsnSacMaster().getGstSlab().getSlabName()
                                : null)
                        .quantity(item.getQuantity())
                        .unit(item.getUnit())
                        .unitPrice(item.getUnitPrice())
                        .discountPercentage(
                                item.getDiscountPercentage() != null ? item.getDiscountPercentage() : BigDecimal.ZERO)
                        .taxableAmount(item.getTaxableAmount())
                        .cgst(item.getCgstAmount())
                        .sgst(item.getSgstAmount())
                        .igst(item.getIgstAmount())
                        .cess(item.getCessAmount())
                        .taxAmount(item.getTaxAmount())
                        .totalAmount(item.getTotalAmount() != null ? item.getTotalAmount()
                                : (item.getTaxableAmount() != null && item.getTaxAmount() != null
                                        ? item.getTaxableAmount().add(item.getTaxAmount())
                                        : item.getTaxableAmount()))
                        .inventory(inventoryDto)
                        .expiryDate(null)
                        .costCenter(null)
                        .lineRemarks(null)
                        .build());
            }
        }

        // Calculations
        BigDecimal totalTax = inv.getTaxAmount() != null ? inv.getTaxAmount() : BigDecimal.ZERO;
        BigDecimal cgstTotal = lineItems.stream().map(i -> i.getCgst() != null ? i.getCgst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal sgstTotal = lineItems.stream().map(i -> i.getSgst() != null ? i.getSgst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal igstTotal = lineItems.stream().map(i -> i.getIgst() != null ? i.getIgst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cessTotal = lineItems.stream().map(i -> i.getCess() != null ? i.getCess() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Outstanding & Aging
        BigDecimal received = inv.getReceivedAmount() != null ? inv.getReceivedAmount() : BigDecimal.ZERO;
        BigDecimal total = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal outstanding = inv.getOutstandingAmount() != null ? inv.getOutstandingAmount()
                : total.subtract(received);

        int daysOutstanding = 0;
        if (inv.getDueDate() != null && LocalDate.now().isAfter(inv.getDueDate())) {
            daysOutstanding = (int) java.time.temporal.ChronoUnit.DAYS.between(inv.getDueDate(), LocalDate.now());
        }

        String agingBucket = "0-30";
        if (daysOutstanding > 90)
            agingBucket = "90+";
        else if (daysOutstanding > 60)
            agingBucket = "61-90";
        else if (daysOutstanding > 30)
            agingBucket = "31-60";

        BigDecimal paymentPct = total.compareTo(BigDecimal.ZERO) > 0
                ? received.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Ledger Names Helper
        String arLedgerName = inv.getReceivableAccountId() != null
                ? chartOfAccountRepository.findById(inv.getReceivableAccountId()).map(ChartOfAccount::getAccountName)
                        .orElse(null)
                : null;
        String revLedgerName = inv.getRevenueAccountId() != null
                ? chartOfAccountRepository.findById(inv.getRevenueAccountId()).map(ChartOfAccount::getAccountName)
                        .orElse(null)
                : null;
        String cgstLedgerName = inv.getOutputCgstAccountId() != null
                ? chartOfAccountRepository.findById(inv.getOutputCgstAccountId()).map(ChartOfAccount::getAccountName)
                        .orElse(null)
                : null;
        String sgstLedgerName = inv.getOutputSgstAccountId() != null
                ? chartOfAccountRepository.findById(inv.getOutputSgstAccountId()).map(ChartOfAccount::getAccountName)
                        .orElse(null)
                : null;
        String igstLedgerName = inv.getOutputIgstAccountId() != null
                ? chartOfAccountRepository.findById(inv.getOutputIgstAccountId()).map(ChartOfAccount::getAccountName)
                        .orElse(null)
                : null;
        String cessLedgerName = inv.getOutputCessAccountId() != null
                ? chartOfAccountRepository.findById(inv.getOutputCessAccountId()).map(ChartOfAccount::getAccountName)
                        .orElse(null)
                : null;

        // Fetch Inventory Sync Status
        String syncStatus = "UNKNOWN";
        try {
            java.util.Optional<InventorySyncTask> syncTaskOpt = inventorySyncTaskRepository
                    .findByInvoiceId(inv.getId());
            if (syncTaskOpt.isPresent()) {
                syncStatus = syncTaskOpt.get().getStatus().name();
            } else {
                syncStatus = "NOT_REQUIRED";
            }
        } catch (Exception e) {
            log.warn("Failed to fetch inventory sync task for invoice: {}", inv.getId(), e);
        }

        String placeOfSupplyName = null;
        if (inv.getPlaceOfSupplyStateId() != null) {
            placeOfSupplyName = gstStateCodeRepository.findById(inv.getPlaceOfSupplyStateId())
                    .map(com.erp.account.modules.gst.entity.GstStateCode::getStateName)
                    .orElse(null);
        }

        return SalesInvoiceProfileResponse.builder()
                // 1. Master
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .salesOrderId(inv.getSourceSalesOrderId())
                .salesOrderNumber(inv.getSourceSalesOrderNumber())
                .deliveryChallanId(inv.getSourceDeliveryChallanId())
                .deliveryChallanNumber(inv.getSourceDeliveryChallanNumber())
                .invoiceDate(inv.getInvoiceDate())
                .dueDate(inv.getDueDate())
                .status(inv.getStatus() != null ? inv.getStatus().name() : null)
                .paymentStatus(inv.getPaymentStatus() != null ? inv.getPaymentStatus().name() : null)
                .currency(inv.getInvoiceCurrency() != null ? inv.getInvoiceCurrency()
                        : (comp != null ? comp.getBaseCurrency() : "INR"))
                .exchangeRate(inv.getExchangeRate() != null ? inv.getExchangeRate() : BigDecimal.ONE)
                .baseCurrencyAmount(inv.getTotalAmount())
                .placeOfSupplyStateId(inv.getPlaceOfSupplyStateId())
                .placeOfSupplyStateCode(inv.getPlaceOfSupplyStateCode())
                .placeOfSupply(placeOfSupplyName)
                .referenceNumber(null)
                .businessDescription(null)
                .remarks(inv.getNotes())

                // 2. Company Information
                .companyInformation(comp != null ? SiCompanyInfoDto.builder()
                        .companyId(comp.getId())
                        .companyName(comp.getCompanyName())
                        .companyCode(comp.getCompanyCode())
                        .gstin(comp.getGstin())
                        .pan(null)
                        .address(comp.getAddressLine1())
                        .contactDetails(comp.getPhone() != null ? comp.getPhone() : comp.getEmail())
                        .baseCurrency(comp.getBaseCurrency())
                        .build() : null)

                // 3. Customer Information
                .customerInformation(cust != null ? SiCustomerInfoDto.builder()
                        .customerId(cust.getId())
                        .customerCode(cust.getCustomerCode())
                        .customerName(cust.getCustomerName())
                        .gstin(cust.getGstin())
                        .pan(cust.getPanNo())
                        .email(cust.getEmail())
                        .phone(cust.getPhone())
                        .billingAddress(com.erp.account.util.CustomerAddressUtils.getAddressLine1(cust) != null
                                ? (com.erp.account.util.CustomerAddressUtils.getAddressLine1(cust)
                                        + (com.erp.account.util.CustomerAddressUtils.getCity(cust) != null
                                                ? ", " + com.erp.account.util.CustomerAddressUtils.getCity(cust)
                                                : ""))
                                : null)
                        .shippingAddress(com.erp.account.util.CustomerAddressUtils.getAddressLine1(cust) != null
                                ? (com.erp.account.util.CustomerAddressUtils.getAddressLine1(cust)
                                        + (com.erp.account.util.CustomerAddressUtils.getCity(cust) != null
                                                ? ", " + com.erp.account.util.CustomerAddressUtils.getCity(cust)
                                                : ""))
                                : null)
                        .creditLimit(cust.getCreditLimit())
                        .outstandingBalance(BigDecimal.ZERO)
                        .availableCredit(cust.getCreditLimit())
                        .paymentTerms("NET 30")
                        .build() : null)

                // 4. Line Items
                .lineItems(lineItems)

                // 5. Inventory Information
                .inventoryInformation(SiInventoryInfoDto.builder()
                        .stockMovement("OUT")
                        .inventorySyncStatus(syncStatus)
                        .warehouses(new java.util.ArrayList<>(uniqueWarehouses))
                        .build())

                // 6. Tax Summary
                .taxSummary(SiTaxSummaryDto.builder()
                        .taxableAmount(inv.getSubtotal())
                        .cgst(cgstTotal)
                        .sgst(sgstTotal)
                        .igst(igstTotal)
                        .cess(cessTotal)
                        .tcs(BigDecimal.ZERO)
                        .roundOff(BigDecimal.ZERO)
                        .totalTax(totalTax)
                        .grandTotal(total)
                        .build())

                // 7. Payment Information
                .paymentInformation(SiPaymentInfoDto.builder()
                        .totalReceived(received)
                        .outstandingAmount(outstanding)
                        .paymentPercentage(paymentPct)
                        .lastPaymentDate(null)
                        .paymentMode(null)
                        .paymentReferences(null)
                        .paymentHistory(List.of())
                        .build())

                // 8 & 9. Credit & Debit Notes
                .creditNotes(List.of())
                .debitNotes(List.of())

                // 10. Journal Entry
                .journalEntry(inv.getGlJournalEntryId() != null ? SiJournalEntryDto.builder()
                        .journalEntryId(inv.getGlJournalEntryId())
                        .voucherNumber(inv.getInvoiceNumber())
                        .postingDate(inv.getPostedAt() != null ? inv.getPostedAt().toLocalDate() : inv.getInvoiceDate())
                        .glPostingStatus(inv.getGlPostingStatus() != null ? inv.getGlPostingStatus().name() : null)
                        .ledgerPostings(List.of())
                        .debitEntries(List.of())
                        .creditEntries(List.of())
                        .build() : null)

                // 11. Ledger Impact
                .ledgerImpact(SiLedgerImpactDto.builder()
                        .accountsReceivableLedger(arLedgerName)
                        .revenueLedger(revLedgerName)
                        .outputCgstLedger(cgstLedgerName)
                        .outputSgstLedger(sgstLedgerName)
                        .outputIgstLedger(igstLedgerName)
                        .outputCessLedger(cessLedgerName)
                        .build())

                // 12. Delivery Information
                .deliveryInformation(SiDeliveryInfoDto.builder()
                        .deliveryChallan(null)
                        .dispatchDate(inv.getInvoiceDate())
                        .transporter(null)
                        .vehicleNumber(null)
                        .lrNumber(null)
                        .trackingNumber(null)
                        .build())

                // 13. Approval Workflow
                .approvalWorkflow(SiApprovalWorkflowDto.builder()
                        .approvalStatus(inv.getStatus() != null ? inv.getStatus().name() : null)
                        .approvedBy(inv.getApprovedBy())
                        .approvedDate(inv.getApprovedAt())
                        .approvalNotes(null)
                        .workflowHistory(List.of())
                        .build())

                // 14. Attachments
                .attachments(SiAttachmentsDto.builder()
                        .invoicePdf(null)
                        .eInvoicePdf(null)
                        .supportingDocuments(List.of())
                        .build())

                // 15. E-Invoice & E-Way Bill
                .eInvoiceAndEWayBill(SiEinvoiceEwayBillDto.builder()
                        .irn(inv.getIrn())
                        .ackNumber(inv.getAckNo())
                        .ackDate(inv.getAckDate())
                        .qrCode(inv.getSignedQrCode())
                        .eWayBillNumber(null)
                        .eWayBillValidity(null)
                        .build())

                // 16. Audit Information
                .auditInformation(SiAuditInfoDto.builder()
                        .createdBy(inv.getCreatedBy())
                        .createdAt(inv.getCreatedAt())
                        .updatedBy(inv.getUpdatedBy())
                        .updatedAt(inv.getUpdatedAt())
                        .deletedStatus(inv.getIsDeleted())
                        .build())

                // 17. Statistics
                .statistics(SiStatisticsDto.builder()
                        .itemCount(lineItems.size())
                        .paymentCount(0)
                        .creditNoteCount(0)
                        .taxTransactionCount(inv.getInvoiceTaxes() != null ? inv.getInvoiceTaxes().size() : 0)
                        .daysOutstanding(daysOutstanding)
                        .agingBucket(agingBucket)
                        .interestAccrued(BigDecimal.ZERO)
                        .build())

                // 18. Related Transactions
                .relatedTransactions(SiRelatedTransactionsDto.builder()
                        .payments(List.of())
                        .creditNotes(List.of())
                        .debitNotes(List.of())
                        .journalEntries(inv.getGlJournalEntryId() != null ? List.of(SiJournalEntryDto.builder()
                                .journalEntryId(inv.getGlJournalEntryId())
                                .voucherNumber(inv.getInvoiceNumber())
                                .postingDate(inv.getPostedAt() != null ? inv.getPostedAt().toLocalDate()
                                        : inv.getInvoiceDate())
                                .glPostingStatus(
                                        inv.getGlPostingStatus() != null ? inv.getGlPostingStatus().name() : null)
                                .build()) : List.of())
                        .inventoryTransactions(List.of())
                        .customerLedgerEntries(List.of())
                        .build())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SalesInvoiceResponse getInvoiceByNumber(String invoiceNumber) {
        log.debug("Fetching invoice by number: {}", invoiceNumber);

        SalesInvoice invoice;
        if (TenantUtils.isSystemAdmin()) {
            invoice = salesInvoiceRepository.findByInvoiceNumberAndIsDeletedFalse(invoiceNumber)
                    .orElseThrow(() -> new SalesInvoiceNotFoundException(invoiceNumber));
        } else {
            UUID resolvedCompanyId = resolveCompanyId();
            invoice = salesInvoiceRepository.findByInvoiceNumberAndCompanyIdAndIsDeletedFalse(
                    invoiceNumber, resolvedCompanyId)
                    .orElseThrow(() -> new SalesInvoiceNotFoundException(invoiceNumber));
        }

        return enrichAndReturnResponse(salesInvoiceMapper.entityToResponse(invoice), invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalesInvoiceResponse> getAllInvoices(SalesInvoiceFilterDto filter, Pageable pageable) {
        log.debug("Fetching all invoices with pagination: {}", pageable);

        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(filter.getCompanyId());
        Specification<SalesInvoice> spec = SalesInvoiceSpecification.getFilterSpecification(filter, resolvedCompanyId);

        Page<SalesInvoice> invoices = salesInvoiceRepository.findAll(spec, pageable);

        return invoices.map(invoice -> enrichAndReturnResponse(salesInvoiceMapper.entityToResponse(invoice), invoice));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalesInvoiceResponse> getCustomerInvoices(UUID customerId, Pageable pageable) {
        log.debug("Fetching invoices for customer: {}", customerId);
        getValidatedCustomer(customerId);

        return getAllInvoices(SalesInvoiceFilterDto.builder().customerId(customerId).build(), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalesInvoiceResponse> getInvoicesByStatus(InvoiceStatus status, Pageable pageable, UUID companyId) {
        log.debug("Fetching invoices with status: {}", status);
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        return getAllInvoices(SalesInvoiceFilterDto.builder().statuses(List.of(status)).build(), pageable);
    }

    // ============================================================
    // PAYMENT & OUTSTANDING QUERIES
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public Page<SalesInvoiceResponse> getOutstandingInvoices(Pageable pageable) {
        log.debug("Fetching outstanding invoices");
        return getAllInvoices(SalesInvoiceFilterDto.builder().hasOutstandingBalance(true).build(), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalesInvoiceResponse> getOverdueInvoices(LocalDate asOfDate, Pageable pageable) {
        log.debug("Fetching overdue invoices as of: {}", asOfDate);
        return getAllInvoices(SalesInvoiceFilterDto.builder().isOverdue(true).dueDateTo(asOfDate.minusDays(1)).build(),
                pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getCustomerOutstandingBalance(UUID customerId) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        log.debug("Calculating outstanding balance for customer: {} in company: {}", customerId, companyId);

        // Validate customer
        getValidatedCustomer(customerId);

        List<SalesInvoice> outstanding = salesInvoiceRepository
                .findOutstandingByCustomerAndCompany(customerId, companyId);

        BigDecimal balance = outstanding.stream()
                .map(invoice -> invoice.getOutstandingAmount() != null ? invoice.getOutstandingAmount()
                        : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(4, RoundingMode.HALF_UP);

        log.debug("Customer outstanding balance: {} for customer: {}", balance, customerId);
        return balance;
    }

    @Override
    @Transactional(readOnly = true)
    public AgingReportDTO getInvoiceAging(LocalDate asOfDate) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        log.debug("Generating aging report for company: {} as of: {}", companyId, asOfDate);

        List<SalesInvoice> outstanding = salesInvoiceRepository.findOutstandingByCompany(companyId);

        AgingReportDTO agingReport = new AgingReportDTO();
        agingReport.amount0to30Days = BigDecimal.ZERO;
        agingReport.amount31to60Days = BigDecimal.ZERO;
        agingReport.amount61to90Days = BigDecimal.ZERO;
        agingReport.amount90PlusDays = BigDecimal.ZERO;
        agingReport.count0to30Days = 0L;
        agingReport.count31to60Days = 0L;
        agingReport.count61to90Days = 0L;
        agingReport.count90PlusDays = 0L;

        for (SalesInvoice invoice : outstanding) {
            if (invoice.getDueDate() != null && invoice.getOutstandingAmount() != null) {
                long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(invoice.getDueDate(), asOfDate);

                if (daysOverdue <= 30) {
                    agingReport.amount0to30Days = agingReport.amount0to30Days.add(invoice.getOutstandingAmount());
                    agingReport.count0to30Days++;
                } else if (daysOverdue <= 60) {
                    agingReport.amount31to60Days = agingReport.amount31to60Days.add(invoice.getOutstandingAmount());
                    agingReport.count31to60Days++;
                } else if (daysOverdue <= 90) {
                    agingReport.amount61to90Days = agingReport.amount61to90Days.add(invoice.getOutstandingAmount());
                    agingReport.count61to90Days++;
                } else {
                    agingReport.amount90PlusDays = agingReport.amount90PlusDays.add(invoice.getOutstandingAmount());
                    agingReport.count90PlusDays++;
                }
            }
        }

        log.info("Aging report generated for company: {} with 0-30 days: {}",
                companyId, agingReport.amount0to30Days);
        return agingReport;
    }

    // ============================================================
    // WORKFLOW OPERATIONS
    // ============================================================

    @Override
    public SalesInvoiceResponse submitForApproval(UUID invoiceId, String comments) {
        return submitForApproval(null, invoiceId, comments);
    }

    @Override
    public SalesInvoiceResponse submitForApproval(UUID companyId, UUID invoiceId, String comments) {
        SalesInvoice invoice = getValidatedInvoice(invoiceId);
        UUID resolvedCompanyId = companyId != null ? TenantUtils.resolveCompanyIdForQuery(companyId) : invoice.getCompanyId();

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT invoices can be submitted for approval. Current status: " + invoice.getStatus());
        }

        // Prevent duplicate workflow submission
        try {
            WorkflowTransactionDto existingTx = workflowClient.getWorkflowByDocument(resolvedCompanyId, "SALES_INVOICE", invoice.getId());
            if (existingTx != null && ("PENDING".equalsIgnoreCase(existingTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existingTx.getStatus()))) {
                throw new BadRequestException("Sales Invoice is already submitted for approval with transaction: " + existingTx.getId());
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("No existing workflow transaction found for sales invoice {}", invoiceId);
        }

        try {
            WorkflowTransactionDto tx = workflowClient.submitWorkflow(
                    resolvedCompanyId,
                    "SALES_INVOICE",
                    invoice.getId(),
                    invoice.getInvoiceNumber(),
                    comments != null ? comments : "Submitted sales invoice for approval",
                    invoice.getTotalAmount(),
                    invoice.getCustomer() != null ? invoice.getCustomer().getId() : null,
                    java.util.Map.of("amount", invoice.getTotalAmount() != null ? invoice.getTotalAmount() : java.math.BigDecimal.ZERO)
            );
            if (tx != null && "APPROVED".equalsIgnoreCase(tx.getStatus())) {
                invoice.setStatus(InvoiceStatus.APPROVED);
                log.info("Sales Invoice {} auto-approved by workflow engine, status updated to APPROVED", invoice.getInvoiceNumber());
            } else {
                invoice.setStatus(InvoiceStatus.PENDING_APPROVAL);
                log.info("Sales Invoice {} submitted for approval to workflow-service, status updated to PENDING_APPROVAL", invoice.getInvoiceNumber());
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Workflow engine submission failed for sales invoice {}. Error: {}", invoiceId, e.getMessage());
            throw new BadRequestException("Failed to submit sales invoice for workflow approval: " + e.getMessage());
        }

        SalesInvoice saved = salesInvoiceRepository.save(invoice);
        return enrichAndReturnResponse(salesInvoiceMapper.entityToResponse(saved), saved);
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void approveInvoice(UUID invoiceId) {
        log.info("Approving sales invoice: {}", invoiceId);

        // 1. Fetch and validate invoice in a read-only transaction
        SalesInvoice invoice = transactionTemplate.execute(status -> {
            SalesInvoice inv = getValidatedInvoice(invoiceId);

            if (!inv.getStatus().equals(InvoiceStatus.DRAFT) && !inv.getStatus().equals(InvoiceStatus.PENDING_APPROVAL)) {
                throw new InvalidOperationException("Invoice must be in DRAFT or PENDING_APPROVAL status to approve");
            }

            // Temporarily commented out for testing so the same user can approve their own
            // invoice
            // if (inv.getCreatedBy() != null &&
            // inv.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
            // throw new SecurityException("Creator cannot approve their own document.");
            // }
            return inv;
        });

        // Prevent direct approval if active workflow is pending
        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(invoice.getCompanyId(), "SALES_INVOICE", invoiceId);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BadRequestException("Sales Invoice cannot be approved directly while workflow approval is pending. Please approve via the workflow.");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for sales invoice approval {}: {}", invoiceId, e.getMessage());
        }

        // 2. Update invoice status and schedule stock-out in a single write transaction
        transactionTemplate.execute(status -> {
            SalesInvoice inv = getValidatedInvoice(invoiceId);

            // Validate stock availability BEFORE approving
            // inventoryIntegrationService.validateStockAvailability(inv);

            inv.setStatus(InvoiceStatus.APPROVED);
            inv.setApprovedBy(TenantUtils.getCurrentUserId());
            inv.setApprovedAt(LocalDateTime.now());

            // inventoryIntegrationService.scheduleStockOut(inv);

            salesInvoiceRepository.save(inv);
            return null;
        });

        log.info("Sales invoice approved successfully: {}", invoiceId);
    }

    @Override
    public void rejectInvoice(UUID invoiceId) {
        log.info("Rejecting sales invoice: {}", invoiceId);

        SalesInvoice invoice = getValidatedInvoice(invoiceId);

        if (!invoice.getStatus().equals(InvoiceStatus.DRAFT) &&
                !invoice.getStatus().equals(InvoiceStatus.PENDING_APPROVAL)) {
            throw new InvalidInvoiceStatusException(
                    "Invoice can only be rejected from DRAFT or PENDING_APPROVAL status");
        }

        // Prevent direct rejection if active workflow is pending
        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(invoice.getCompanyId(), "SALES_INVOICE", invoiceId);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BadRequestException("Sales Invoice cannot be rejected directly while workflow approval is pending. Please reject via the workflow.");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for sales invoice rejection {}: {}", invoiceId, e.getMessage());
        }

        invoice.setStatus(InvoiceStatus.REJECTED);
        salesInvoiceRepository.save(invoice);
        log.info("Sales invoice rejected successfully: {}", invoiceId);
    }

    @Override
    public void postInvoice(UUID invoiceId) {
        log.info("Posting sales invoice to GL: {}", invoiceId);

        SalesInvoice invoice = getValidatedInvoice(invoiceId);
        accountingValidationService.validatePostingDate(invoice.getInvoiceDate(), invoice.getCompanyId());

        if (!invoice.getStatus().equals(InvoiceStatus.APPROVED)) {
            throw new InvoiceApprovalException("Invoice must be in APPROVED status to post");
        }
        if (PostingStatus.POSTED.equals(invoice.getGlPostingStatus())) {
            throw new InvoiceAlreadyPostedException("Sales invoice is already posted");
        }

        // Prevent direct posting if active workflow is pending
        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(invoice.getCompanyId(), "SALES_INVOICE", invoiceId);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BadRequestException("Sales Invoice cannot be posted directly while workflow approval is pending. Please approve via the workflow.");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for sales invoice posting {}: {}", invoiceId, e.getMessage());
        }

        // if (invoice.getCreatedBy() != null &&
        // invoice.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
        // throw new SecurityException("Creator cannot post their own document.");
        // }

        // Generate GL posting
        UUID glJournalEntryId = generateGlPosting(invoiceId);
        invoice.setGlJournalEntryId(glJournalEntryId);
        invoice.setStatus(InvoiceStatus.POSTED);
        invoice.setGlPostingStatus(PostingStatus.POSTED);
        invoice.setPostedBy(TenantUtils.getCurrentUserId());
        invoice.setPostedAt(LocalDateTime.now());

        salesInvoiceRepository.save(invoice);
        log.info("Sales invoice posted successfully to GL: {} with journal entry: {}", invoiceId, glJournalEntryId);
    }

    @Override
    public void cancelInvoice(UUID invoiceId) {
        log.info("Cancelling sales invoice: {}", invoiceId);

        SalesInvoice invoice = getValidatedInvoice(invoiceId);

        if (invoice.getStatus().equals(InvoiceStatus.PAID)) {
            throw new InvalidInvoiceStatusException("Cannot cancel PAID invoices");
        }

        if (invoice.getStatus().equals(InvoiceStatus.CANCELLED)) {
            throw new InvalidInvoiceStatusException("Invoice is already CANCELLED");
        }

        if (invoice.getStatus().equals(InvoiceStatus.POSTED)) {
            throw new InvalidInvoiceStatusException(
                    "POSTED invoices are immutable and cannot be cancelled directly. Please create a Credit Note (Reverse Entry).");
        }

        // Prevent direct cancellation if active workflow is pending
        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(invoice.getCompanyId(), "SALES_INVOICE", invoiceId);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BadRequestException("Sales Invoice cannot be cancelled directly while workflow approval is pending. Please cancel via the workflow.");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for sales invoice cancellation {}: {}", invoiceId, e.getMessage());
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);

        salesInvoiceRepository.save(invoice);
        log.info("Sales invoice cancelled successfully: {}", invoiceId);
    }

    // ============================================================
    // VALIDATION & CALCULATION OPERATIONS
    // ============================================================

    @Override
    public void validateInvoice(UUID invoiceId, SalesInvoiceRequest invoice) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        log.debug("Validating invoice: {} for company: {}", invoice.getInvoiceNumber(), companyId);
        accountingValidationService.validatePostingDate(invoice.getInvoiceDate(), companyId);

        // Basic field validations
        if (invoice.getDueDate() != null && invoice.getInvoiceDate() != null) {
            if (invoice.getDueDate().isBefore(invoice.getInvoiceDate())) {
                throw new ValidationException("Due date must be greater than or equal to invoice date");
            }
        }

        // Customer validation
        Customer customer = getValidatedCustomer(invoice.getCustomerId());

        if (!Boolean.TRUE.equals(customer.getIsActive())) {
            throw new com.erp.account.common.exception.SalesInvoiceInvalidCustomerException("Customer is inactive");
        }

        // Invoice number uniqueness (handle create vs update)
        boolean exists;
        if (invoiceId == null) {
            exists = salesInvoiceRepository.existsByInvoiceNumberAndCompanyIdAndIsDeletedFalse(
                    invoice.getInvoiceNumber(), companyId);
        } else {
            exists = salesInvoiceRepository.existsByInvoiceNumberAndCompanyIdAndIdNotAndIsDeletedFalse(
                    invoice.getInvoiceNumber(), companyId, invoiceId);
        }

        if (exists) {
            throw new SalesInvoiceDuplicateException(
                    "Invoice number already exists for this company");
        }

        // Currency Validation
        Company company = customer.getCompany();
        if (company != null && company.getBaseCurrency() != null && invoice.getInvoiceCurrency() != null) {
            if (company.getBaseCurrency().equalsIgnoreCase(invoice.getInvoiceCurrency())) {
                if (invoice.getExchangeRate() != null && invoice.getExchangeRate().compareTo(BigDecimal.ONE) != 0) {
                    throw new ValidationException("Exchange rate must be 1 for base currency");
                }
            }
        }

        // Line items validation
        if (invoice.getItems() == null || invoice.getItems().isEmpty()) {
            throw new ValidationException("Invoice must have at least one line item");
        }

        if (invoice.getFreightCharges() != null && invoice.getFreightCharges().compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Freight charges cannot be negative");
        }
        if (invoice.getOtherCharges() != null && invoice.getOtherCharges().compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Other charges cannot be negative");
        }
        if (invoice.getReceivedAmount() != null && invoice.getReceivedAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Received amount cannot be negative");
        }

        for (SalesInvoiceItemRequest item : invoice.getItems()) {
            if (item.getQuantity() == null || item.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ValidationException("Item quantity must be greater than 0");
            }
            if (item.getUnitPrice() == null || item.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new ValidationException("Item unit price cannot be negative");
            }
            if (item.getDiscountPercentage() != null) {
                if (item.getDiscountPercentage().compareTo(BigDecimal.ZERO) < 0 ||
                        item.getDiscountPercentage().compareTo(new BigDecimal("100")) > 0) {
                    throw new ValidationException("Discount percentage must be between 0 and 100");
                }
            }
        }

        log.debug("Invoice validation passed for: {}", invoice.getInvoiceNumber());
    }

    @Override
    public void validateInvoice(SalesInvoiceRequest invoice) {
        validateInvoice(null, invoice);
    }

    @Override
    public SalesInvoiceResponse recalculateInvoiceTotals(UUID invoiceId) {
        log.info("Recalculating totals for invoice: {}", invoiceId);

        SalesInvoice invoice = getValidatedInvoice(invoiceId);
        recalculateTotals(invoice);

        SalesInvoice updated = salesInvoiceRepository.save(invoice);
        return enrichAndReturnResponse(salesInvoiceMapper.entityToResponse(updated), updated);
    }

    // ============================================================
    // GL POSTING OPERATIONS
    // ============================================================

    @Override
    public UUID generateGlPosting(UUID invoiceId) {
        log.info("Generating GL posting for invoice: {}", invoiceId);

        SalesInvoice invoice = getValidatedInvoice(invoiceId);
        UUID companyId = invoice.getCompanyId();
        validatePostingAccounts(invoice, companyId);

        GlJournalEntryRequest request = new GlJournalEntryRequest();
        request.setVoucherDate(invoice.getInvoiceDate());
        request.setReferenceNo(invoice.getInvoiceNumber());
        request.setNarration("Sales Invoice: " + invoice.getInvoiceNumber());
        request.setSourceModule(SourceModule.AR);
        request.setSourceId(invoice.getId());
        request.setJournalLines(buildGlLines(invoice));

        GlJournalEntryResponse draft = glJournalEntryService.createJournalEntry(RequestWrapper.of(request), companyId);
        GlJournalEntryResponse posted = glJournalEntryService.postJournalEntry(draft.getId());
        return posted.getId();
    }

    // ============================================================
    // DATA AGGREGATION & REPORTING
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public SalesInvoiceSummaryDTO getSalesSummary() {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        log.debug("Generating sales summary for company: {}", companyId);

        SalesInvoiceSummaryDTO summary = new SalesInvoiceSummaryDTO();
        summary.totalInvoices = salesInvoiceRepository.countTotalInvoicesByCompany(companyId);
        summary.totalAmount = money(salesInvoiceRepository.sumTotalAmountByCompany(companyId));
        summary.receivedAmount = money(salesInvoiceRepository.sumReceivedAmountByCompany(companyId));
        summary.outstandingAmount = money(salesInvoiceRepository.sumOutstandingAmountByCompany(companyId));
        summary.overdueAmount = money(salesInvoiceRepository.sumOverdueAmountByCompany(companyId, LocalDate.now()));

        return summary;
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerSalesSummaryDTO getCustomerSalesSummary(UUID customerId) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        log.debug("Generating sales summary for customer: {} in company: {}", customerId, companyId);

        Customer customer = getValidatedCustomer(customerId);
        CustomerSalesSummaryDTO summary = new CustomerSalesSummaryDTO();
        summary.customerId = customerId;
        summary.customerName = customer.getCustomerName();
        summary.totalInvoices = salesInvoiceRepository.countByCustomerAndCompany(customerId, companyId);
        summary.totalAmount = money(salesInvoiceRepository.sumTotalAmountByCustomerAndCompany(customerId, companyId));
        summary.receivedAmount = money(
                salesInvoiceRepository.sumReceivedAmountByCustomerAndCompany(customerId, companyId));
        summary.outstandingAmount = money(
                salesInvoiceRepository.sumOutstandingByCustomerAndCompany(customerId, companyId));
        summary.creditLimit = customer.getCreditLimit();
        summary.overdueAmount = money(salesInvoiceRepository.sumOverdueAmountByCustomerAndCompany(
                customerId, companyId, LocalDate.now()));

        return summary;
    }

    // ============================================================
    // PRIVATE HELPER METHODS
    // ============================================================

    /**
     * Gets validated invoice entity for read operations
     */
    private SalesInvoice getValidatedInvoice(UUID invoiceId) {
        if (TenantUtils.isSystemAdmin()) {
            return salesInvoiceRepository.findByIdAndIsDeletedFalse(invoiceId)
                    .orElseThrow(() -> SalesInvoiceNotFoundException.ofId(invoiceId));
        }

        UUID companyId = TenantUtils.getCurrentCompanyId();
        SalesInvoice invoice = salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId)
                .orElseThrow(() -> SalesInvoiceNotFoundException.ofId(invoiceId));

        InvoiceValidationUtil.validateCompanyAccess(
                invoice.getCompanyId().toString(),
                companyId.toString());

        return invoice;
    }

    /**
     * Gets validated invoice for update operations (must be DRAFT)
     */
    private SalesInvoice getValidatedInvoiceForUpdate(UUID invoiceId) {
        SalesInvoice invoice = getValidatedInvoice(invoiceId);
        if (!invoice.getStatus().equals(InvoiceStatus.DRAFT)) {
            throw new InvoiceAlreadyPostedException("Only DRAFT invoices can be updated");
        }
        return invoice;
    }

    /**
     * Gets validated invoice for delete operations (must be DRAFT)
     */
    private SalesInvoice getValidatedInvoiceForDelete(UUID invoiceId) {
        SalesInvoice invoice = getValidatedInvoice(invoiceId);
        if (!invoice.getStatus().equals(InvoiceStatus.DRAFT)) {
            throw new InvoiceAlreadyPostedException("Only DRAFT invoices can be deleted");
        }
        return invoice;
    }

    /**
     * Gets validated customer
     */
    private Customer getValidatedCustomer(UUID customerId) {
        Customer customer = customerRepository.findByIdAndIsDeletedFalse(customerId)
                .orElseThrow(() -> new SalesInvoiceInvalidCustomerException("Customer not found"));

        if (!TenantUtils.isSystemAdmin()) {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            if (customer.getCompany() == null || !customer.getCompany().getId().equals(companyId)) {
                throw new com.erp.account.common.exception.SalesInvoiceInvalidCustomerException(
                        "Customer does not belong to this company");
            }
        }

        return customer;
    }

    /**
     * Snapshots the customer's billing address onto the invoice entity.
     * Uses the customer's default address (from CustomerAddress table) if
     * available,
     * otherwise falls back to the customer master's base address fields.
     * 
     * IMPORTANT: Customer State Code is derived from the customer's address state,
     * NOT from the GSTIN prefix or Place of Supply.
     */
    private void snapshotBillingAddress(SalesInvoice invoice, Customer customer) {
        String address = com.erp.account.util.CustomerAddressUtils.getAddressLine1(customer);
        String city = com.erp.account.util.CustomerAddressUtils.getCity(customer);
        String state = com.erp.account.util.CustomerAddressUtils.getState(customer);
        String country = com.erp.account.util.CustomerAddressUtils.getCountry(customer);
        String stateCode = null;

        // Try to get richer data from CustomerAddress
        if (customer.getAddresses() != null && !customer.getAddresses().isEmpty()) {
            com.erp.account.modules.customer.entity.CustomerAddress defaultAddr = customer.getAddresses().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                    .findFirst()
                    .orElse(customer.getAddresses().get(0));

            if (address == null || address.trim().isEmpty())
                address = defaultAddr.getAddressLine1();
            if (city == null || city.trim().isEmpty())
                city = defaultAddr.getCity();
            if (defaultAddr.getGstState() != null) {
                // Always use authoritative GstStateCode for both name and code
                state = defaultAddr.getGstState().getStateName();
                stateCode = defaultAddr.getGstState().getStateCode();
            }
            if (country == null || country.trim().isEmpty())
                country = defaultAddr.getCountry();
        }

        invoice.setBillingAddressLine1(address);
        invoice.setBillingCity(city);
        invoice.setBillingState(state);
        invoice.setBillingCountry(country);
        invoice.setBillingStateCode(stateCode);
    }

    /**
     * Recalculates invoice totals from line items and computes GST breakup
     */
    private void recalculateTotals(SalesInvoice invoice) {
        if (invoice.getSalesInvoiceItems() != null && !invoice.getSalesInvoiceItems().isEmpty()) {
            List<SalesInvoiceItem> activeItems = invoice.getSalesInvoiceItems().stream()
                    .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                    .collect(Collectors.toList());

            // Use invoice.getCompany() (seller) for GST state code resolution.
            // invoice.getCustomer().getCompany() may be lazy-loaded and is the same seller
            // company,
            // but invoice.getCompany() is the authoritative reference.
            Company company = invoice.getCompany();
            if (company == null) {
                // Fallback: customer's company
                company = invoice.getCustomer().getCompany();
            }

            // Resolve company state code from GstRegistration (most accurate source)
            // Fallback to GSTIN prefix if no registration found
            String resolvedCompanyStateCode = "";
            try {
                java.util.Optional<com.erp.account.modules.gst.entity.GstRegistration> regOpt = gstRegistrationRepository
                        .findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(company.getId());
                if (regOpt.isPresent()) {
                    com.erp.account.modules.gst.entity.GstRegistration reg = regOpt.get();
                    if (reg.getStateCode() != null && reg.getStateCode().getStateCode() != null) {
                        resolvedCompanyStateCode = reg.getStateCode().getStateCode().trim();
                    } else if (reg.getGstin() != null && reg.getGstin().length() >= 2) {
                        resolvedCompanyStateCode = reg.getGstin().substring(0, 2);
                    }
                }
            } catch (Exception e) {
                log.warn("[GST] Could not fetch GstRegistration for company {}: {}", company.getId(), e.getMessage());
            }
            // Final fallback: Company GSTIN prefix
            if (resolvedCompanyStateCode.isEmpty() && company.getGstin() != null && company.getGstin().length() >= 2) {
                resolvedCompanyStateCode = company.getGstin().substring(0, 2);
            }
            log.info("[GST] recalculateTotals: companyId={} resolvedCompanyStateCode='{}' placeOfSupply='{}'",
                    company.getId(), resolvedCompanyStateCode, invoice.getPlaceOfSupplyStateCode());

            final String finalCompanyStateCode = resolvedCompanyStateCode;
            final Company finalCompany = company;

            // Clear old tax records
            if (invoice.getInvoiceTaxes() != null) {
                invoice.getInvoiceTaxes().clear();
            } else {
                invoice.setInvoiceTaxes(new HashSet<>());
            }

            // Grouping structure for InvoiceTax aggregation
            java.util.Map<com.erp.account.modules.gstslab.entity.GstSlab, com.erp.account.modules.invoicetax.entity.InvoiceTax> taxMap = new HashMap<>();

            activeItems.forEach(item -> {
                // Perform precise tax calculation using GstRegistration-based state code
                gstCalculationService.calculateItemTaxes(item, finalCompany, invoice,
                        item.getHsnSacMaster(), finalCompanyStateCode);

                // Group by GST slab
                if (item.getHsnSacMaster() != null && item.getHsnSacMaster().getGstSlab() != null) {
                    com.erp.account.modules.gstslab.entity.GstSlab slab = item.getHsnSacMaster().getGstSlab();
                    com.erp.account.modules.invoicetax.entity.InvoiceTax invoiceTax = taxMap.getOrDefault(slab,
                            com.erp.account.modules.invoicetax.entity.InvoiceTax.builder()
                                    .company(finalCompany)
                                    .salesInvoice(invoice)
                                    .gstSlab(slab)
                                    .taxableAmount(BigDecimal.ZERO)
                                    .cgstAmount(BigDecimal.ZERO)
                                    .sgstAmount(BigDecimal.ZERO)
                                    .igstAmount(BigDecimal.ZERO)
                                    .cessAmount(BigDecimal.ZERO)
                                    .build());

                    invoiceTax.setTaxableAmount(invoiceTax.getTaxableAmount().add(money(item.getTaxableAmount())));
                    invoiceTax.setCgstAmount(invoiceTax.getCgstAmount().add(money(item.getCgstAmount())));
                    invoiceTax.setSgstAmount(invoiceTax.getSgstAmount().add(money(item.getSgstAmount())));
                    invoiceTax.setIgstAmount(invoiceTax.getIgstAmount().add(money(item.getIgstAmount())));
                    invoiceTax.setCessAmount(invoiceTax.getCessAmount().add(money(item.getCessAmount())));

                    taxMap.put(slab, invoiceTax);
                }
            });

            // Add aggregated taxes to invoice
            taxMap.values().forEach(invoice::addInvoiceTax);

            BigDecimal subtotal = activeItems.stream()
                    .map(SalesInvoiceItem::getTaxableAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(4, RoundingMode.HALF_UP);

            BigDecimal taxAmount = activeItems.stream()
                    .map(SalesInvoiceItem::getTaxAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(4, RoundingMode.HALF_UP);

            BigDecimal freightCharges = invoice.getFreightCharges() != null ? invoice.getFreightCharges()
                    : BigDecimal.ZERO;
            invoice.setFreightCharges(freightCharges);

            BigDecimal otherCharges = invoice.getOtherCharges() != null ? invoice.getOtherCharges()
                    : BigDecimal.ZERO;
            invoice.setOtherCharges(otherCharges);

            BigDecimal tdsAmount = BigDecimal.ZERO; // Or get it from invoice if available
            BigDecimal totalBeforeRoundOff = com.erp.account.util.InvoiceCalculationHelper
                    .calculateTotalAmount(subtotal, taxAmount, tdsAmount, freightCharges, otherCharges);
            BigDecimal roundOff = com.erp.account.util.InvoiceCalculationHelper.calculateRoundOff(totalBeforeRoundOff);
            BigDecimal totalAmount = totalBeforeRoundOff.add(roundOff).setScale(4, RoundingMode.HALF_UP);

            invoice.setSubtotal(subtotal);
            invoice.setTaxAmount(taxAmount);
            invoice.setTotalBeforeRoundOff(totalBeforeRoundOff);
            invoice.setRoundOff(roundOff);
            invoice.setTotalAmount(totalAmount);
        }
    }

    /**
     * Enriches response with additional calculated fields
     */
    private SalesInvoiceResponse enrichAndReturnResponse(SalesInvoiceResponse response, SalesInvoice invoice) {
        BigDecimal received = invoice.getReceivedAmount() != null ? invoice.getReceivedAmount() : BigDecimal.ZERO;
        BigDecimal total = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal outstanding = invoice.getOutstandingAmount() != null ? invoice.getOutstandingAmount()
                : total.subtract(received);

        response.setSubtotal(invoice.getSubtotal());
        response.setTaxAmount(invoice.getTaxAmount());
        response.setFreightCharges(invoice.getFreightCharges() != null ? invoice.getFreightCharges() : BigDecimal.ZERO);
        response.setOtherCharges(invoice.getOtherCharges() != null ? invoice.getOtherCharges() : BigDecimal.ZERO);
        response.setTotalBeforeRoundOff(invoice.getTotalBeforeRoundOff());
        response.setRoundOff(invoice.getRoundOff() != null ? invoice.getRoundOff() : BigDecimal.ZERO);
        response.setTotalAmount(total);
        response.setReceivedAmount(received);
        response.setOutstandingAmount(outstanding);
        response.setPaymentStatus(invoice.getPaymentStatus());

        if (total.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal paymentPct = received.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
            if (paymentPct.compareTo(new BigDecimal("100")) > 0) {
                paymentPct = new BigDecimal("100");
            }
            response.setPaymentPercentage(paymentPct);
        } else {
            response.setPaymentPercentage(BigDecimal.ZERO);
        }

        response.setItemCount(invoice.getSalesInvoiceItems() == null ? 0
                : (int) invoice.getSalesInvoiceItems().stream()
                        .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                        .count());
        response.setCgstAmount(sumTaxComponent(invoice, SalesInvoiceItem::getCgstAmount));
        response.setSgstAmount(sumTaxComponent(invoice, SalesInvoiceItem::getSgstAmount));
        response.setIgstAmount(sumTaxComponent(invoice, SalesInvoiceItem::getIgstAmount));

        // Effective overall tax rate percentage
        if (invoice.getSubtotal() != null && invoice.getSubtotal().compareTo(BigDecimal.ZERO) > 0
                && invoice.getTaxAmount() != null) {
            BigDecimal taxRate = invoice.getTaxAmount().multiply(new BigDecimal("100"))
                    .divide(invoice.getSubtotal(), 2, RoundingMode.HALF_UP);
            response.setTaxRate(taxRate);
        }

        if (invoice.getPlaceOfSupplyStateId() != null && response.getPlaceOfSupply() == null) {
            gstStateCodeRepository.findById(invoice.getPlaceOfSupplyStateId())
                    .ifPresent(state -> response.setPlaceOfSupply(state.getStateName()));
        }

        return response;
    }

    private UUID findAccountIdByNames(UUID companyId, String... names) {
        for (String name : names) {
            Optional<ChartOfAccount> account = chartOfAccountRepository
                    .findByCompanyIdAndAccountNameIgnoreCaseAndIsDeletedFalse(companyId, name);
            if (account.isPresent()) {
                return account.get().getId();
            }
        }
        return null;
    }

    private void resolveDefaultAccounts(SalesInvoice invoice, UUID companyId) {
        if (invoice.getReceivableAccountId() == null) {
            invoice.setReceivableAccountId(findAccountIdByNames(companyId, "Accounts receivable", "Account Receivable",
                    "Trade Receivables", "Sundry Debtors"));
        }
        if (invoice.getRevenueAccountId() == null) {
            invoice.setRevenueAccountId(findAccountIdByNames(companyId, "Sales revenue", "Sales Account", "Sales",
                    "Revenue from Operations", "Revenue"));
        }
        if (invoice.getOutputCgstAccountId() == null) {
            invoice.setOutputCgstAccountId(findAccountIdByNames(companyId, "Output CGST", "CGST Payable", "CGST"));
        }
        if (invoice.getOutputSgstAccountId() == null) {
            invoice.setOutputSgstAccountId(findAccountIdByNames(companyId, "Output SGST", "SGST Payable", "SGST"));
        }
        if (invoice.getOutputIgstAccountId() == null) {
            invoice.setOutputIgstAccountId(findAccountIdByNames(companyId, "Output IGST", "IGST Payable", "IGST"));
        }
        if (invoice.getOutputCessAccountId() == null) {
            invoice.setOutputCessAccountId(findAccountIdByNames(companyId, "Output CESS", "CESS Payable", "CESS"));
        }

        List<String> missingAccounts = new ArrayList<>();
        if (invoice.getReceivableAccountId() == null) {
            missingAccounts.add("Accounts Receivable");
        }
        if (invoice.getRevenueAccountId() == null) {
            missingAccounts.add("Sales Revenue");
        }

        if (!missingAccounts.isEmpty()) {
            throw new ValidationException(
                    "Default ledger accounts are missing for this company. Please ensure the following accounts exist in the Chart of Accounts: "
                            + String.join(", ", missingAccounts) + ".");
        }
    }

    // validateGstConsistency bypassed because we calculate internally

    private void validatePostingAccounts(SalesInvoice invoice, UUID companyId) {
        log.info(
                "Validating Posting Accounts - Receivable: {}, Revenue: {}, Output CGST: {}, Output SGST: {}, Output IGST: {}, Output CESS: {}",
                invoice.getReceivableAccountId(), invoice.getRevenueAccountId(),
                invoice.getOutputCgstAccountId(), invoice.getOutputSgstAccountId(),
                invoice.getOutputIgstAccountId(), invoice.getOutputCessAccountId());

        accountingValidationService.postingAccount(invoice.getReceivableAccountId(), companyId, "Accounts receivable");
        accountingValidationService.postingAccount(invoice.getRevenueAccountId(), companyId, "Sales revenue");

        BigDecimal cgst = sumTaxComponent(invoice, SalesInvoiceItem::getCgstAmount);
        if (cgst.signum() > 0 && invoice.getOutputCgstAccountId() != null) {
            accountingValidationService.postingAccount(invoice.getOutputCgstAccountId(), companyId, "Output CGST");
        }

        BigDecimal sgst = sumTaxComponent(invoice, SalesInvoiceItem::getSgstAmount);
        if (sgst.signum() > 0 && invoice.getOutputSgstAccountId() != null) {
            accountingValidationService.postingAccount(invoice.getOutputSgstAccountId(), companyId, "Output SGST");
        }

        BigDecimal igst = sumTaxComponent(invoice, SalesInvoiceItem::getIgstAmount);
        if (igst.signum() > 0 && invoice.getOutputIgstAccountId() != null) {
            accountingValidationService.postingAccount(invoice.getOutputIgstAccountId(), companyId, "Output IGST");
        }

        BigDecimal cess = sumTaxComponent(invoice, SalesInvoiceItem::getCessAmount);
        if (cess.signum() > 0 && invoice.getOutputCessAccountId() != null) {
            accountingValidationService.postingAccount(invoice.getOutputCessAccountId(), companyId, "Output CESS");
        }
    }

    private void validateCreditLimit(UUID invoiceId, SalesInvoice invoice, Customer customer, UUID companyId) {
        BigDecimal creditLimit = customer.getCreditLimit();
        if (creditLimit == null || creditLimit.signum() <= 0) {
            return;
        }
        BigDecimal currentOutstanding = money(
                salesInvoiceRepository.sumOutstandingByCustomerAndCompany(customer.getId(), companyId));
        if (invoiceId != null) {
            SalesInvoice existing = salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId)
                    .orElseThrow(() -> SalesInvoiceNotFoundException.ofId(invoiceId));
            currentOutstanding = currentOutstanding.subtract(money(existing.getOutstandingAmount()));
        }
        BigDecimal projectedOutstanding = currentOutstanding.add(money(invoice.getTotalAmount()));
        if (projectedOutstanding.compareTo(creditLimit) > 0) {
            throw new ValidationException(
                    "Customer credit limit exceeded. Projected outstanding: " + projectedOutstanding);
        }
    }

    private List<GlJournalLineRequest> buildGlLines(SalesInvoice invoice) {
        List<GlJournalLineRequest> lines = new ArrayList<>();
        String currency = invoice.getInvoiceCurrency() != null ? invoice.getInvoiceCurrency()
                : invoice.getCompany().getBaseCurrency();
        BigDecimal exchangeRate = invoice.getExchangeRate() != null ? invoice.getExchangeRate() : BigDecimal.ONE;

        lines.add(debitLine(invoice.getReceivableAccountId(), money(invoice.getTotalAmount()), currency, exchangeRate,
                "Accounts receivable"));
        lines.add(creditLine(invoice.getRevenueAccountId(), money(invoice.getSubtotal()), currency, exchangeRate,
                "Sales revenue"));

        // Granular GST lines
        BigDecimal cgst = sumTaxComponent(invoice, SalesInvoiceItem::getCgstAmount);
        if (cgst.signum() > 0 && invoice.getOutputCgstAccountId() != null) {
            lines.add(creditLine(invoice.getOutputCgstAccountId(), cgst, currency, exchangeRate, "Output CGST"));
        }

        BigDecimal sgst = sumTaxComponent(invoice, SalesInvoiceItem::getSgstAmount);
        if (sgst.signum() > 0 && invoice.getOutputSgstAccountId() != null) {
            lines.add(creditLine(invoice.getOutputSgstAccountId(), sgst, currency, exchangeRate, "Output SGST"));
        }

        BigDecimal igst = sumTaxComponent(invoice, SalesInvoiceItem::getIgstAmount);
        if (igst.signum() > 0 && invoice.getOutputIgstAccountId() != null) {
            lines.add(creditLine(invoice.getOutputIgstAccountId(), igst, currency, exchangeRate, "Output IGST"));
        }

        BigDecimal cess = sumTaxComponent(invoice, SalesInvoiceItem::getCessAmount);
        if (cess.signum() > 0 && invoice.getOutputCessAccountId() != null) {
            lines.add(creditLine(invoice.getOutputCessAccountId(), cess, currency, exchangeRate, "Output CESS"));
        }

        return lines;
    }

    private GlJournalLineRequest debitLine(UUID accountId, BigDecimal amount, String currency, BigDecimal exchangeRate,
            String description) {
        return glLine(accountId, amount, BigDecimal.ZERO, currency, exchangeRate, description);
    }

    private GlJournalLineRequest creditLine(UUID accountId, BigDecimal amount, String currency, BigDecimal exchangeRate,
            String description) {
        return glLine(accountId, BigDecimal.ZERO, amount, currency, exchangeRate, description);
    }

    private GlJournalLineRequest glLine(UUID accountId, BigDecimal debit, BigDecimal credit, String currency,
            BigDecimal exchangeRate,
            String description) {
        GlJournalLineRequest line = new GlJournalLineRequest();
        line.setAccountId(accountId);
        line.setDebitAmount(debit.signum() > 0 ? debit : null);
        line.setCreditAmount(credit.signum() > 0 ? credit : null);
        line.setCurrencyCode(currency);
        line.setExchangeRate(exchangeRate);
        line.setLineDescription(description);
        return line;
    }

    private BigDecimal sumRequestTax(SalesInvoiceRequest invoice,
            Function<SalesInvoiceItemRequest, BigDecimal> extractor) {
        return invoice.getItems().stream()
                .map(extractor)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal sumTaxComponent(SalesInvoice invoice,
            Function<SalesInvoiceItem, BigDecimal> extractor) {
        if (invoice.getSalesInvoiceItems() == null) {
            return BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        }
        return invoice.getSalesInvoiceItems().stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .map(extractor)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal money(BigDecimal amount) {
        return (amount == null ? BigDecimal.ZERO : amount).setScale(4, RoundingMode.HALF_UP);
    }

    private void resolveSettingsForCreate(UUID companyId, SalesInvoiceRequest request, SalesInvoice invoice) {
        if (request.getPaymentTermId() != null) {
            paymentTermRepository.findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(
                    request.getPaymentTermId(), companyId,
                    com.erp.account.modules.common.enums.SalesDocumentType.INVOICE).ifPresent(pt -> {
                        invoice.setPaymentTermId(pt.getId());
                        invoice.setPaymentTerms(pt.getDescription());
                    });
        } else if (request.getPaymentTerms() != null) {
            invoice.setPaymentTerms(request.getPaymentTerms());
        } else {
            paymentTermRepository.findByCompanyIdAndDocumentTypeAndIsDefaultTrueAndIsDeletedFalse(
                    companyId, com.erp.account.modules.common.enums.SalesDocumentType.INVOICE).ifPresent(pt -> {
                        invoice.setPaymentTermId(pt.getId());
                        invoice.setPaymentTerms(pt.getDescription());
                    });
        }

        if (request.getTermsConditionId() != null) {
            termsConditionRepository.findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(
                    request.getTermsConditionId(), companyId,
                    com.erp.account.modules.common.enums.SalesDocumentType.INVOICE).ifPresent(tc -> {
                        invoice.setTermsConditionId(tc.getId());
                        invoice.setTermsAndConditions(tc.getContent());
                    });
        } else if (request.getTermsAndConditions() != null) {
            invoice.setTermsAndConditions(request.getTermsAndConditions());
        } else {
            termsConditionRepository.findByCompanyIdAndDocumentTypeAndIsDefaultTrueAndIsDeletedFalse(
                    companyId, com.erp.account.modules.common.enums.SalesDocumentType.INVOICE).ifPresent(tc -> {
                        invoice.setTermsConditionId(tc.getId());
                        invoice.setTermsAndConditions(tc.getContent());
                    });
        }
    }

    private void resolveSettingsForUpdate(UUID companyId, SalesInvoiceRequest request, SalesInvoice invoice) {
        if (request.getPaymentTermId() != null) {
            paymentTermRepository.findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(
                    request.getPaymentTermId(), companyId,
                    com.erp.account.modules.common.enums.SalesDocumentType.INVOICE).ifPresent(pt -> {
                        invoice.setPaymentTermId(pt.getId());
                        invoice.setPaymentTerms(pt.getDescription());
                    });
        } else if (request.getPaymentTerms() != null) {
            invoice.setPaymentTerms(request.getPaymentTerms());
            invoice.setPaymentTermId(null);
        }

        if (request.getTermsConditionId() != null) {
            termsConditionRepository.findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(
                    request.getTermsConditionId(), companyId,
                    com.erp.account.modules.common.enums.SalesDocumentType.INVOICE).ifPresent(tc -> {
                        invoice.setTermsConditionId(tc.getId());
                        invoice.setTermsAndConditions(tc.getContent());
                    });
        } else if (request.getTermsAndConditions() != null) {
            invoice.setTermsAndConditions(request.getTermsAndConditions());
            invoice.setTermsConditionId(null);
        }
    }
}
