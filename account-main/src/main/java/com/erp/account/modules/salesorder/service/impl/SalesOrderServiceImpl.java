package com.erp.account.modules.salesorder.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceItem;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
import com.erp.account.modules.proformainvoice.repository.ProformaInvoiceItemRepository;
import com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
import com.erp.account.modules.common.repository.ReceiptAllocationRepository;
import com.erp.account.modules.common.entity.ReceiptAllocation;
import com.erp.account.enums.ReceiptVoucherStatus;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationItem;
import com.erp.account.modules.quotation.entity.QuotationStatus;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.salesinvoice.service.SalesInvoiceService;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.salesorder.dto.request.SOConversionRequest;
import com.erp.account.modules.salesorder.dto.request.SOItemConversionRequest;
import com.erp.account.modules.salesorder.dto.request.SalesOrderUpdateRequest;
import com.erp.account.modules.salesorder.dto.request.SalesOrderItemUpdateRequest;
import com.erp.account.modules.salesorder.dto.response.SalesOrderResponse;
import com.erp.account.modules.salesorder.dto.response.profile.SalesOrderProfileResponse;
import com.erp.account.modules.salesorder.repository.spec.SalesOrderSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDate;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.entity.SalesOrderItem;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import com.erp.account.modules.salesorder.mapper.SalesOrderMapper;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.salesorder.service.SalesOrderService;
import com.erp.account.modules.auditlog.dto.AuditMapper;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.stream.Collectors;

import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.common.client.InventoryClient;
import com.erp.account.common.dto.inventory.response.ProductDetailResponse;
import com.erp.account.common.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.entity.CustomerAddress;
import com.erp.account.modules.customer.repository.CustomerRepository;
import com.erp.account.modules.customer.repository.CustomerAddressRepository;
import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import com.erp.account.modules.salesorder.dto.response.profile.SalesOrderAddressDto;
import com.erp.account.modules.salesorder.dto.response.profile.SalesOrderCustomerDto;
import com.erp.account.modules.salesorder.dto.response.profile.SalesOrderItemDto;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import java.util.ArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalesOrderServiceImpl implements SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final ProformaInvoiceRepository proformaInvoiceRepository;
    private final ProformaInvoiceItemRepository proformaInvoiceItemRepository;
    private final CompanyRepository companyRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final SalesOrderMapper salesOrderMapper;
    private final ReceiptAllocationRepository receiptAllocationRepository;
    private final QuotationRepository quotationRepository;
    private final SalesInvoiceRepository salesInvoiceRepository;
    private final com.erp.account.modules.settings.repository.PaymentTermRepository paymentTermRepository;
    private final com.erp.account.modules.settings.repository.TermsConditionRepository termsConditionRepository;
    private final SalesInvoiceService salesInvoiceService;
    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository customerAddressRepository;
    private final GstStateCodeRepository gstStateCodeRepository;
    private final InventoryClient inventoryClient;
    private final com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository receiptVoucherRepository;
    private final com.erp.account.modules.deliverychallan.repository.DeliveryChallanItemRepository deliveryChallanItemRepository;
    private final WorkflowClient workflowClient;

    private static final java.util.Set<com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus> ACTIVE_DISPATCH_STATUSES = java.util.Set.of(
            com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus.CONFIRMED,
            com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus.DRAFT
    );

    @Override
    @Transactional
    public SalesOrderResponse createFromProformaInvoice(UUID companyId, UUID piId, SOConversionRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        ProformaInvoice pi = proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(piId, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Proforma Invoice not found"));

        if (pi.getStatus() != ProformaInvoiceStatus.CONFIRMED 
                && pi.getStatus() != ProformaInvoiceStatus.APPROVED
                && pi.getStatus() != ProformaInvoiceStatus.PARTIALLY_PAID 
                && pi.getStatus() != ProformaInvoiceStatus.PAID) {
            throw new BadRequestException("Only CONFIRMED or APPROVED Proforma Invoices can be converted to Sales Orders");
        }

        if (pi.getAdvanceRequired() != null && pi.getAdvanceRequired()) {
            java.math.BigDecimal requiredAmount = pi.getAdvanceAmount() != null ? pi.getAdvanceAmount()
                    : java.math.BigDecimal.ZERO;
            java.math.BigDecimal receivedAmount = getAdvanceReceivedForProformaInvoice(pi.getId(), pi.getPiNumber(), resolvedCompanyId);
            if (receivedAmount.compareTo(requiredAmount) < 0) {
                throw new BadRequestException("Advance payment of ₹" + requiredAmount
                        + " is required before creating Sales Order. Received: ₹" + receivedAmount);
            }
        }

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Company not found"));

        SalesOrder so = new SalesOrder();
        so.setCompanyId(resolvedCompanyId);
        so.setCompany(company);

        String soNumber = voucherSequenceService.generateNextSalesOrderNumber(resolvedCompanyId, request.getSoDate());
        so.setSoNumber(soNumber);
        so.setSoDate(request.getSoDate());
        so.setStatus(SalesOrderStatus.DRAFT);

        so.setSourceProformaInvoiceId(pi.getId());
        so.setSourceProformaInvoice(pi);
        so.setSourceProformaInvoiceNumber(pi.getPiNumber());
        so.setSourceQuotationId(pi.getSourceQuotationId());
        so.setSourceQuotation(pi.getSourceQuotation());
        so.setSourceQuotationNumber(pi.getSourceQuotationNumber());

        so.setCustomerId(pi.getCustomerId());
        so.setCustomer(pi.getCustomer());

        so.setBillingAddressId(pi.getBillingAddressId());
        so.setBillingAddressSnapshot(pi.getBillingAddressSnapshot());
        so.setBillingStateCode(pi.getBillingStateCode());

        so.setDeliveryAddressId(pi.getDeliveryAddressId());
        so.setDeliveryAddressSnapshot(pi.getDeliveryAddressSnapshot());

        so.setBankAccountId(pi.getBankAccountId());
        so.setBankDetailsSnapshot(pi.getBankDetailsSnapshot());

        so.setReferenceNumber(pi.getReferenceNumber());
        so.setCurrency(pi.getCurrency());
        so.setExchangeRate(pi.getExchangeRate());
        so.setPlaceOfSupplyStateId(pi.getPlaceOfSupplyStateId());
        so.setPlaceOfSupplyStateCode(pi.getPlaceOfSupplyStateCode());

        so.setPaymentTermId(pi.getPaymentTermId());
        so.setPaymentTerms(pi.getPaymentTerms());
        so.setTermsConditionId(pi.getTermsConditionId());
        so.setTermsAndConditions(pi.getTermsAndConditions());
        so.setDeliveryTerms(pi.getDeliveryTerms());
        so.setNotes(pi.getNotes());

        so.setCreatedBy(TenantUtils.getCurrentUserId());

        // CRITICAL CONCURRENCY FIX: PESSIMISTIC_WRITE lock on PI Items to prevent
        // concurrent over-conversion
        List<ProformaInvoiceItem> piItems = proformaInvoiceItemRepository
                .findLockedByProformaInvoiceIdAndCompanyIdAndIsDeletedFalse(piId, resolvedCompanyId);
        Map<UUID, ProformaInvoiceItem> piItemMap = piItems.stream()
                .collect(Collectors.toMap(ProformaInvoiceItem::getId, item -> item));

        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (SOItemConversionRequest reqItem : request.getItems()) {
            ProformaInvoiceItem piItem = piItemMap.get(reqItem.getPiItemId());
            if (piItem == null) {
                throw new BadRequestException(
                        "PI Item ID " + reqItem.getPiItemId() + " not found or does not belong to this PI");
            }

            BigDecimal requestQty = reqItem.getQuantity();
            if (requestQty.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException(
                        "Conversion quantity must be greater than zero for item " + reqItem.getPiItemId());
            }

            if (requestQty.compareTo(piItem.getRemainingQuantity()) > 0) {
                throw new BadRequestException("Requested quantity " + requestQty + " exceeds remaining quantity "
                        + piItem.getRemainingQuantity() + " for PI item " + piItem.getId());
            }

            piItem.setConvertedQuantity(piItem.getConvertedQuantity().add(requestQty));
            proformaInvoiceItemRepository.save(piItem);

            SalesOrderItem soItem = new SalesOrderItem();
            soItem.setCompanyId(resolvedCompanyId);
            soItem.setCompany(company);
            soItem.setSourceProformaInvoiceItemId(piItem.getId());
            soItem.setSourceProformaInvoiceItem(piItem);

            soItem.setHsnSacMaster(piItem.getHsnSacMaster());
            soItem.setItemId(piItem.getItemId());
            soItem.setItemName(piItem.getItemName());
            soItem.setDescription(piItem.getDescription());

            soItem.setQuantity(requestQty);
            soItem.setUnit(piItem.getUnit());
            soItem.setUnitPrice(piItem.getUnitPrice());
            soItem.setDiscountPercent(piItem.getDiscountPercent());

            soItem.calculateLineAmount();

            if (piItem.getCgstRate() != null)
                soItem.setCgstRate(piItem.getCgstRate());
            if (piItem.getSgstRate() != null)
                soItem.setSgstRate(piItem.getSgstRate());
            if (piItem.getIgstRate() != null)
                soItem.setIgstRate(piItem.getIgstRate());
            if (piItem.getCessRate() != null)
                soItem.setCessRate(piItem.getCessRate());

            soItem.calculateTaxAmount();
            soItem.calculateTotalAmount();

            soItem.setWarehouseId(piItem.getWarehouseId());
            soItem.setLocationId(piItem.getLocationId());
            soItem.setNotes(piItem.getNotes());
            soItem.setCreatedBy(TenantUtils.getCurrentUserId());

            so.addSalesOrderItem(soItem);

            totalSubtotal = totalSubtotal.add(requestQty.multiply(soItem.getUnitPrice()));
            totalDiscount = totalDiscount
                    .add(soItem.getDiscountAmount() != null ? soItem.getDiscountAmount() : BigDecimal.ZERO);
            totalTax = totalTax.add(soItem.getTaxAmount() != null ? soItem.getTaxAmount() : BigDecimal.ZERO);
        }

        so.setSubtotal(totalSubtotal.setScale(4, RoundingMode.HALF_UP));
        so.setDiscountAmount(totalDiscount.setScale(4, RoundingMode.HALF_UP));
        so.setTaxAmount(totalTax.setScale(4, RoundingMode.HALF_UP));

        BigDecimal remainingPIValueRatio = BigDecimal.ZERO;
        if (pi.getSubtotal().compareTo(BigDecimal.ZERO) > 0) {
            remainingPIValueRatio = so.getSubtotal().divide(pi.getSubtotal(), 4, RoundingMode.HALF_UP);
        }

        BigDecimal proratedFreight = pi.getFreightCharges() != null
                ? pi.getFreightCharges().multiply(remainingPIValueRatio)
                : BigDecimal.ZERO;
        BigDecimal proratedOther = pi.getOtherCharges() != null ? pi.getOtherCharges().multiply(remainingPIValueRatio)
                : BigDecimal.ZERO;

        so.setFreightCharges(proratedFreight.setScale(4, RoundingMode.HALF_UP));
        so.setOtherCharges(proratedOther.setScale(4, RoundingMode.HALF_UP));

        BigDecimal taxableAmount = so.getSubtotal().subtract(so.getDiscountAmount());
        BigDecimal totalBeforeRound = taxableAmount.add(so.getTaxAmount()).add(so.getFreightCharges())
                .add(so.getOtherCharges());
        so.setTotalBeforeRoundOff(totalBeforeRound.setScale(4, RoundingMode.HALF_UP));

        BigDecimal grandTotal = totalBeforeRound.setScale(0, RoundingMode.HALF_UP);
        so.setRoundOff(grandTotal.subtract(totalBeforeRound).setScale(4, RoundingMode.HALF_UP));
        so.setTotalAmount(grandTotal);

        SalesOrder saved = salesOrderRepository.save(so);

        try {
            if (pi.getItems() != null && !pi.getItems().isEmpty()) {
                boolean allConverted = pi.getItems().stream()
                        .allMatch(item -> item.getRemainingQuantity() == null || item.getRemainingQuantity().compareTo(BigDecimal.ZERO) <= 0);
                pi.setStatus(allConverted ? ProformaInvoiceStatus.FULLY_CONVERTED : ProformaInvoiceStatus.PARTIALLY_CONVERTED);
                proformaInvoiceRepository.save(pi);
            }
        } catch (Exception e) {
            log.warn("Failed to update PI conversion status for PI {}: {}", pi.getId(), e.getMessage());
        }

        return salesOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public SalesOrderResponse createDirectFromQuotation(UUID companyId, UUID quotationId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Quotation quotation = quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Quotation not found"));

        if (quotation.getStatus() != QuotationStatus.ACCEPTED && quotation.getStatus() != QuotationStatus.CUSTOMER_ACCEPTED) {
            throw new BadRequestException("Only ACCEPTED or CUSTOMER_ACCEPTED quotations can be converted into a Sales Order.");
        }

        long paidInvoicesCount = salesInvoiceRepository.countFullyPaidInvoicesByCustomer(resolvedCompanyId,
                quotation.getCustomerId());
        if (paidInvoicesCount == 0) {
            throw new BadRequestException(
                    "Customer is not eligible for direct Sales Order creation. At least one previous Sales Invoice must be fully paid.");
        }

        boolean duplicateExists = salesOrderRepository
                .existsBySourceQuotationIdAndCompanyIdAndIsDeletedFalse(quotationId, resolvedCompanyId);
        if (duplicateExists) {
            throw new BadRequestException("Sales Order already exists for this quotation.");
        }

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Company not found"));

        SalesOrder so = new SalesOrder();
        so.setCompanyId(resolvedCompanyId);
        so.setCompany(company);

        String soNumber = voucherSequenceService.generateNextSalesOrderNumber(resolvedCompanyId,
                java.time.LocalDate.now());
        so.setSoNumber(soNumber);
        so.setSoDate(java.time.LocalDate.now());
        so.setStatus(SalesOrderStatus.DRAFT);

        so.setSourceProformaInvoiceId(null);
        so.setSourceProformaInvoice(null);
        so.setSourceProformaInvoiceNumber(null);
        so.setSourceQuotationId(quotation.getId());
        so.setSourceQuotation(quotation);
        so.setSourceQuotationNumber(quotation.getQuotationNumber());

        so.setCustomerId(quotation.getCustomerId());
        so.setCustomer(quotation.getCustomer());

        so.setBillingAddressId(quotation.getBillingAddressId());
        so.setBillingAddressSnapshot(null); // Quotation does not have snapshot
        so.setBillingStateCode(quotation.getBillingStateCode());

        so.setDeliveryAddressId(quotation.getDeliveryAddressId());
        so.setDeliveryAddressSnapshot(null); // Quotation does not have snapshot

        so.setBankAccountId(null); // Quotation does not have bank account ID
        so.setBankDetailsSnapshot(null); // Quotation does not have snapshot

        so.setReferenceNumber(quotation.getReferenceNumber());
        so.setCurrency(quotation.getQuotationCurrency());
        so.setExchangeRate(quotation.getExchangeRate());
        so.setPlaceOfSupplyStateId(quotation.getPlaceOfSupplyStateId());
        so.setPlaceOfSupplyStateCode(quotation.getPlaceOfSupplyStateCode());

        so.setPaymentTermId(quotation.getPaymentTermId());
        so.setPaymentTerms(quotation.getPaymentTerms());
        so.setTermsConditionId(quotation.getTermsConditionId());
        so.setTermsAndConditions(quotation.getTermsAndConditions());
        so.setDeliveryTerms(quotation.getDeliveryTerms());
        so.setNotes(quotation.getNotes());

        so.setCreatedBy(TenantUtils.getCurrentUserId());

        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (QuotationItem qItem : quotation.getQuotationItems()) {
            if (Boolean.TRUE.equals(qItem.getIsDeleted()))
                continue;

            SalesOrderItem soItem = new SalesOrderItem();
            soItem.setCompanyId(resolvedCompanyId);
            soItem.setCompany(company);
            soItem.setSourceProformaInvoiceItemId(null);
            soItem.setSourceProformaInvoiceItem(null);

            soItem.setHsnSacMaster(qItem.getHsnSacMaster());
            soItem.setItemId(qItem.getItemId());
            soItem.setItemName(qItem.getItemName());
            soItem.setDescription(qItem.getDescription());

            soItem.setQuantity(qItem.getQuantity());
            soItem.setUnit(qItem.getUnit());
            soItem.setUnitPrice(qItem.getUnitPrice());
            soItem.setDiscountPercent(qItem.getDiscountPercent());

            soItem.calculateLineAmount();

            if (qItem.getCgstRate() != null)
                soItem.setCgstRate(qItem.getCgstRate());
            if (qItem.getSgstRate() != null)
                soItem.setSgstRate(qItem.getSgstRate());
            if (qItem.getIgstRate() != null)
                soItem.setIgstRate(qItem.getIgstRate());
            if (qItem.getCessRate() != null)
                soItem.setCessRate(qItem.getCessRate());

            soItem.calculateTaxAmount();
            soItem.calculateTotalAmount();

            soItem.setWarehouseId(qItem.getWarehouseId());
            soItem.setLocationId(qItem.getLocationId());
            soItem.setNotes(qItem.getNotes());
            soItem.setCreatedBy(TenantUtils.getCurrentUserId());

            so.addSalesOrderItem(soItem);

            totalSubtotal = totalSubtotal.add(soItem.getQuantity().multiply(soItem.getUnitPrice()));
            totalDiscount = totalDiscount
                    .add(soItem.getDiscountAmount() != null ? soItem.getDiscountAmount() : BigDecimal.ZERO);
            totalTax = totalTax.add(soItem.getTaxAmount() != null ? soItem.getTaxAmount() : BigDecimal.ZERO);
        }

        so.setSubtotal(totalSubtotal.setScale(4, RoundingMode.HALF_UP));
        so.setDiscountAmount(totalDiscount.setScale(4, RoundingMode.HALF_UP));
        so.setTaxAmount(totalTax.setScale(4, RoundingMode.HALF_UP));

        BigDecimal proratedFreight = quotation.getFreightCharges() != null ? quotation.getFreightCharges()
                : BigDecimal.ZERO;
        BigDecimal proratedOther = quotation.getOtherCharges() != null ? quotation.getOtherCharges() : BigDecimal.ZERO;

        so.setFreightCharges(proratedFreight.setScale(4, RoundingMode.HALF_UP));
        so.setOtherCharges(proratedOther.setScale(4, RoundingMode.HALF_UP));

        BigDecimal taxableAmount = so.getSubtotal().subtract(so.getDiscountAmount());
        BigDecimal totalBeforeRound = taxableAmount.add(so.getTaxAmount()).add(so.getFreightCharges())
                .add(so.getOtherCharges());
        so.setTotalBeforeRoundOff(totalBeforeRound.setScale(4, RoundingMode.HALF_UP));

        BigDecimal grandTotal = totalBeforeRound.setScale(0, RoundingMode.HALF_UP);
        so.setRoundOff(grandTotal.subtract(totalBeforeRound).setScale(4, RoundingMode.HALF_UP));
        so.setTotalAmount(grandTotal);

        SalesOrder saved = salesOrderRepository.save(so);

        try {
            quotation.setStatus(QuotationStatus.CONVERTED);
            quotationRepository.save(quotation);
        } catch (Exception e) {
            log.warn("Failed to mark quotation as CONVERTED for quotation {}: {}", quotation.getId(), e.getMessage());
        }

        return salesOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SalesOrderProfileResponse getSalesOrderById(UUID companyId, UUID id) {
        log.info("Fetching complete Sales Order for ID: {} and companyId: {}", id, companyId);
        if (id == null) {
            throw new ValidationException("Sales Order ID must not be null");
        }

        UUID resolvedCompanyId = null;
        try {
            resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        } catch (Exception e) {
            resolvedCompanyId = companyId;
        }

        SalesOrder so;
        if (resolvedCompanyId != null) {
            so = salesOrderRepository
                    .findWithItemsAndCustomerByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sales Order not found with ID: " + id));
        } else {
            so = salesOrderRepository
                    .findWithItemsAndCustomerByIdAndIsDeletedFalse(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Sales Order not found with ID: " + id));
        }

        if (companyId != null && !companyId.equals(so.getCompanyId())) {
            throw new ResourceNotFoundException("Sales Order not found with ID: " + id);
        }

        return buildSalesOrderProfileResponse(so);
    }

    private SalesOrderProfileResponse buildSalesOrderProfileResponse(SalesOrder so) {
        Customer cust = so.getCustomer();
        if (cust == null && so.getCustomerId() != null) {
            cust = customerRepository.findById(so.getCustomerId()).orElse(null);
        }

        SalesOrderCustomerDto customerDto = null;
        if (cust != null) {
            SalesOrderAddressDto billingAddr = resolveBillingAddress(so, cust);
            SalesOrderAddressDto deliveryAddr = resolveDeliveryAddress(so, cust);

            customerDto = SalesOrderCustomerDto.builder()
                    .id(cust.getId())
                    .name(cust.getCustomerName())
                    .code(cust.getCustomerCode())
                    .email(cust.getEmail())
                    .phone(cust.getPhone())
                    .billingAddress(billingAddr)
                    .deliveryAddress(deliveryAddr)
                    .build();
        }

        List<SalesOrderItemDto> itemDtos = new ArrayList<>();
        Map<UUID, BigDecimal> alreadyDispatchedMap = new HashMap<>();
        if (so.getItems() != null && !so.getItems().isEmpty() && deliveryChallanItemRepository != null) {
            List<UUID> soItemIds = so.getItems().stream()
                    .map(SalesOrderItem::getId)
                    .filter(java.util.Objects::nonNull)
                    .toList();
            if (!soItemIds.isEmpty()) {
                List<Object[]> dispatchedRecords = deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(
                        soItemIds,
                        so.getCompanyId(),
                        ACTIVE_DISPATCH_STATUSES);
                if (dispatchedRecords != null) {
                    for (Object[] record : dispatchedRecords) {
                        UUID itemId = (UUID) record[0];
                        BigDecimal qty = record[1] instanceof BigDecimal bd ? bd : new BigDecimal(record[1].toString());
                        alreadyDispatchedMap.put(itemId, qty);
                    }
                }
            }
        }

        if (so.getItems() != null) {
            for (SalesOrderItem item : so.getItems()) {
                String productCode = null;
                if (inventoryClient != null && item.getItemId() != null) {
                    try {
                        ResponseEntity<ApiResponse<ProductDetailResponse>> prodResp = inventoryClient.getById(item.getItemId(), so.getCompanyId());
                        if (prodResp != null && prodResp.getBody() != null && prodResp.getBody().getData() != null) {
                            ProductDetailResponse pData = prodResp.getBody().getData();
                            if (pData.getProduct() != null && pData.getProduct().getProductCode() != null) {
                                productCode = pData.getProduct().getProductCode();
                            }
                        }
                    } catch (Exception ex) {
                        log.debug("Could not fetch product details from inventory client for item {}: {}", item.getItemId(), ex.getMessage());
                    }
                }
                String hsnSacCode = item.getHsnSacMaster() != null ? item.getHsnSacMaster().getCode() : null;
                if (productCode == null) {
                    productCode = hsnSacCode;
                }

                BigDecimal taxPercent = BigDecimal.ZERO;
                if (item.getIgstRate() != null && item.getIgstRate().compareTo(BigDecimal.ZERO) > 0) {
                    taxPercent = item.getIgstRate();
                } else {
                    BigDecimal cgst = item.getCgstRate() != null ? item.getCgstRate() : BigDecimal.ZERO;
                    BigDecimal sgst = item.getSgstRate() != null ? item.getSgstRate() : BigDecimal.ZERO;
                    taxPercent = cgst.add(sgst);
                }

                BigDecimal subtotal = item.getTaxableAmount() != null ? item.getTaxableAmount() : BigDecimal.ZERO;
                if (subtotal.compareTo(BigDecimal.ZERO) == 0 && item.getQuantity() != null && item.getUnitPrice() != null) {
                    BigDecimal gross = item.getQuantity().multiply(item.getUnitPrice());
                    BigDecimal disc = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
                    subtotal = gross.subtract(disc);
                }

                BigDecimal originalQty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                BigDecimal dispatched = alreadyDispatchedMap.getOrDefault(item.getId(), BigDecimal.ZERO);
                BigDecimal remaining = originalQty.subtract(dispatched).max(BigDecimal.ZERO);

                SalesOrderItemDto itemDto = SalesOrderItemDto.builder()
                        .id(item.getId())
                        .productId(item.getItemId())
                        .productCode(productCode)
                        .productName(item.getItemName())
                        .description(item.getDescription())
                        .hsnSac(hsnSacCode)
                        .quantity(item.getQuantity())
                        .dispatchedQuantity(dispatched)
                        .deliveredQuantity(dispatched)
                        .remainingQuantity(remaining)
                        .unit(item.getUnit())
                        .unitPrice(item.getUnitPrice())
                        .discountPercent(item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO)
                        .discountAmount(item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO)
                        .taxPercent(taxPercent)
                        .taxAmount(item.getTaxAmount() != null ? item.getTaxAmount() : BigDecimal.ZERO)
                        .cgstPercent(item.getCgstRate() != null ? item.getCgstRate() : BigDecimal.ZERO)
                        .cgstAmount(item.getCgstAmount() != null ? item.getCgstAmount() : BigDecimal.ZERO)
                        .sgstPercent(item.getSgstRate() != null ? item.getSgstRate() : BigDecimal.ZERO)
                        .sgstAmount(item.getSgstAmount() != null ? item.getSgstAmount() : BigDecimal.ZERO)
                        .igstPercent(item.getIgstRate() != null ? item.getIgstRate() : BigDecimal.ZERO)
                        .igstAmount(item.getIgstAmount() != null ? item.getIgstAmount() : BigDecimal.ZERO)
                        .subtotal(subtotal)
                        .totalAmount(item.getTotalAmount() != null ? item.getTotalAmount() : BigDecimal.ZERO)
                        .cessRate(item.getCessRate() != null ? item.getCessRate() : BigDecimal.ZERO)
                        .cessAmount(item.getCessAmount() != null ? item.getCessAmount() : BigDecimal.ZERO)
                        .warehouseId(item.getWarehouseId())
                        .locationId(item.getLocationId())
                        .notes(item.getNotes())
                        .build();

                AuditMapper.attachAudit(item, itemDto);
                itemDtos.add(itemDto);
            }
        }

        String paymentTerms = so.getPaymentTerms();
        if ((paymentTerms == null || paymentTerms.trim().isEmpty()) && so.getPaymentTermId() != null) {
            paymentTerms = paymentTermRepository.findById(so.getPaymentTermId())
                    .map(pt -> pt.getName() != null ? pt.getName() : pt.getDescription())
                    .orElse(null);
        }

        String termsAndConditions = so.getTermsAndConditions();
        if ((termsAndConditions == null || termsAndConditions.trim().isEmpty()) && so.getTermsConditionId() != null) {
            termsAndConditions = termsConditionRepository.findById(so.getTermsConditionId())
                    .map(tc -> tc.getContent() != null ? tc.getContent() : tc.getTitle())
                    .orElse(null);
        }

        String placeOfSupply = null;
        String placeOfSupplyCode = so.getPlaceOfSupplyStateCode();
        if (so.getPlaceOfSupplyStateId() != null) {
            var stateOpt = gstStateCodeRepository.findById(so.getPlaceOfSupplyStateId());
            if (stateOpt.isPresent()) {
                var state = stateOpt.get();
                placeOfSupply = state.getStateName();
                if (placeOfSupplyCode == null) {
                    placeOfSupplyCode = state.getStateCode();
                }
            }
        }
        if (placeOfSupply == null && placeOfSupplyCode != null) {
            placeOfSupply = gstStateCodeRepository.findByStateCodeAndIsDeletedFalse(placeOfSupplyCode)
                    .map(s -> s.getStateName())
                    .orElse(placeOfSupplyCode);
        }

        boolean allFullyDispatched = true;
        boolean anyDispatched = false;
        for (SalesOrderItemDto dto : itemDtos) {
            if (dto.getDispatchedQuantity() != null && dto.getDispatchedQuantity().compareTo(BigDecimal.ZERO) > 0) {
                anyDispatched = true;
            }
            if (dto.getRemainingQuantity() != null && dto.getRemainingQuantity().compareTo(BigDecimal.ZERO) > 0) {
                allFullyDispatched = false;
            }
        }
        String fulfillmentStatus = "UNFULFILLED";
        if (!itemDtos.isEmpty() && allFullyDispatched) {
            fulfillmentStatus = "FULLY_DISPATCHED";
        } else if (anyDispatched) {
            fulfillmentStatus = "PARTIALLY_DISPATCHED";
        }

        SalesOrderProfileResponse response = SalesOrderProfileResponse.builder()
                .id(so.getId())
                .soNumber(so.getSoNumber())
                .soDate(so.getSoDate())
                .status(so.getStatus() != null ? so.getStatus().name() : null)
                .fulfillmentStatus(fulfillmentStatus)
                .currency(so.getCurrency())
                .customer(customerDto)
                .customerId(so.getCustomerId())
                .customerName(cust != null ? cust.getCustomerName() : null)
                .customerCode(cust != null ? cust.getCustomerCode() : null)
                .billingAddressSnapshot(so.getBillingAddressSnapshot())
                .deliveryAddressSnapshot(so.getDeliveryAddressSnapshot())
                .items(itemDtos)
                .subtotal(so.getSubtotal())
                .discountAmount(so.getDiscountAmount())
                .taxAmount(so.getTaxAmount())
                .freightCharges(so.getFreightCharges())
                .otherCharges(so.getOtherCharges())
                .roundOff(so.getRoundOff())
                .totalAmount(so.getTotalAmount())
                .paymentTermId(so.getPaymentTermId())
                .paymentTerms(paymentTerms)
                .termsConditionId(so.getTermsConditionId())
                .termsAndConditions(termsAndConditions)
                .deliveryTerms(so.getDeliveryTerms())
                .notes(so.getNotes())
                .bankDetailsSnapshot(so.getBankDetailsSnapshot())
                .sourceProformaInvoiceId(so.getSourceProformaInvoiceId())
                .sourceProformaInvoiceNumber(so.getSourceProformaInvoiceNumber())
                .sourceQuotationId(so.getSourceQuotationId())
                .sourceQuotationNumber(so.getSourceQuotationNumber())
                .placeOfSupplyStateId(so.getPlaceOfSupplyStateId())
                .placeOfSupplyStateCode(placeOfSupplyCode)
                .placeOfSupply(placeOfSupply)
                .referenceNumber(so.getReferenceNumber())
                .exchangeRate(so.getExchangeRate())
                .createdAt(so.getCreatedAt())
                .createdBy(so.getCreatedBy())
                .updatedAt(so.getUpdatedAt())
                .updatedBy(so.getUpdatedBy())
                .build();

        AuditMapper.attachAudit(so, response);
        return response;
    }

    private SalesOrderAddressDto resolveBillingAddress(SalesOrder so, Customer cust) {
        CustomerAddress addrEntity = null;
        if (so.getBillingAddressId() != null) {
            addrEntity = customerAddressRepository.findById(so.getBillingAddressId()).orElse(null);
        }
        if (addrEntity == null && cust.getId() != null) {
            List<CustomerAddress> addresses = customerAddressRepository.findByCustomerIdAndIsDeletedFalse(cust.getId());
            addrEntity = addresses.stream()
                    .filter(a -> "BILLING".equalsIgnoreCase(a.getAddressType()))
                    .findFirst()
                    .orElse(addresses.stream()
                            .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                            .findFirst()
                            .orElse(!addresses.isEmpty() ? addresses.get(0) : null));
        }

        if (addrEntity != null) {
            String stateName = addrEntity.getGstState() != null ? addrEntity.getGstState().getStateName() : null;
            String stateCode = addrEntity.getGstState() != null ? addrEntity.getGstState().getStateCode() : so.getBillingStateCode();
            return SalesOrderAddressDto.builder()
                    .id(addrEntity.getId())
                    .addressLine1(addrEntity.getAddressLine1())
                    .addressLine2(addrEntity.getAddressLine2())
                    .city(addrEntity.getCity())
                    .state(stateName)
                    .stateCode(stateCode)
                    .country(addrEntity.getCountry())
                    .countryCode("IN")
                    .postalCode(addrEntity.getPostalCode())
                    .build();
        }

        if (com.erp.account.util.CustomerAddressUtils.getDefaultAddress(cust) != null) {
            return SalesOrderAddressDto.builder()
                    .id(null)
                    .addressLine1(com.erp.account.util.CustomerAddressUtils.getAddressLine1(cust))
                    .addressLine2(null)
                    .city(com.erp.account.util.CustomerAddressUtils.getCity(cust))
                    .state(com.erp.account.util.CustomerAddressUtils.getState(cust))
                    .stateCode(so.getBillingStateCode())
                    .country(com.erp.account.util.CustomerAddressUtils.getCountry(cust) != null ? com.erp.account.util.CustomerAddressUtils.getCountry(cust) : "India")
                    .countryCode("IN")
                    .postalCode(null)
                    .build();
        }

        return parseAddressSnapshot(so.getBillingAddressSnapshot(), so.getBillingStateCode());
    }

    private SalesOrderAddressDto resolveDeliveryAddress(SalesOrder so, Customer cust) {
        CustomerAddress addrEntity = null;
        if (so.getDeliveryAddressId() != null) {
            addrEntity = customerAddressRepository.findById(so.getDeliveryAddressId()).orElse(null);
        }
        if (addrEntity == null && cust.getId() != null) {
            List<CustomerAddress> addresses = customerAddressRepository.findByCustomerIdAndIsDeletedFalse(cust.getId());
            addrEntity = addresses.stream()
                    .filter(a -> "DELIVERY".equalsIgnoreCase(a.getAddressType()) || "SHIPPING".equalsIgnoreCase(a.getAddressType()))
                    .findFirst()
                    .orElse(addresses.stream()
                            .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                            .findFirst()
                            .orElse(!addresses.isEmpty() ? addresses.get(0) : null));
        }

        if (addrEntity != null) {
            String stateName = addrEntity.getGstState() != null ? addrEntity.getGstState().getStateName() : null;
            String stateCode = addrEntity.getGstState() != null ? addrEntity.getGstState().getStateCode() : null;
            return SalesOrderAddressDto.builder()
                    .id(addrEntity.getId())
                    .addressLine1(addrEntity.getAddressLine1())
                    .addressLine2(addrEntity.getAddressLine2())
                    .city(addrEntity.getCity())
                    .state(stateName)
                    .stateCode(stateCode)
                    .country(addrEntity.getCountry())
                    .countryCode("IN")
                    .postalCode(addrEntity.getPostalCode())
                    .build();
        }

        if (com.erp.account.util.CustomerAddressUtils.getDefaultAddress(cust) != null) {
            return SalesOrderAddressDto.builder()
                    .id(null)
                    .addressLine1(com.erp.account.util.CustomerAddressUtils.getAddressLine1(cust))
                    .addressLine2(null)
                    .city(com.erp.account.util.CustomerAddressUtils.getCity(cust))
                    .state(com.erp.account.util.CustomerAddressUtils.getState(cust))
                    .stateCode(null)
                    .country(com.erp.account.util.CustomerAddressUtils.getCountry(cust) != null ? com.erp.account.util.CustomerAddressUtils.getCountry(cust) : "India")
                    .countryCode("IN")
                    .postalCode(null)
                    .build();
        }

        return parseAddressSnapshot(so.getDeliveryAddressSnapshot(), null);
    }

    private SalesOrderAddressDto parseAddressSnapshot(String snapshot, String defaultStateCode) {
        if (snapshot == null || snapshot.trim().isEmpty()) {
            return null;
        }
        try {
            if (snapshot.trim().startsWith("{")) {
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(snapshot);
                return SalesOrderAddressDto.builder()
                        .addressLine1(node.hasNonNull("addressLine1") ? node.get("addressLine1").asText() : (node.hasNonNull("address") ? node.get("address").asText() : null))
                        .addressLine2(node.hasNonNull("addressLine2") ? node.get("addressLine2").asText() : null)
                        .city(node.hasNonNull("city") ? node.get("city").asText() : null)
                        .state(node.hasNonNull("state") ? node.get("state").asText() : null)
                        .stateCode(node.hasNonNull("stateCode") ? node.get("stateCode").asText() : defaultStateCode)
                        .country(node.hasNonNull("country") ? node.get("country").asText() : "India")
                        .countryCode("IN")
                        .postalCode(node.hasNonNull("zipCode") ? node.get("zipCode").asText() : (node.hasNonNull("postalCode") ? node.get("postalCode").asText() : null))
                        .build();
            }
        } catch (Exception ignored) {}

        return SalesOrderAddressDto.builder()
                .addressLine1(snapshot)
                .stateCode(defaultStateCode)
                .country("India")
                .countryCode("IN")
                .build();
    }

    @Override
    @Transactional
    public SalesOrderResponse changeStatus(UUID companyId, UUID id, SalesOrderStatus newStatus) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        SalesOrder so = salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Sales Order not found"));

        SalesOrderStatus current = so.getStatus();
        boolean valid = false;

        switch (current) {
            case DRAFT:
                if (newStatus == SalesOrderStatus.PENDING_APPROVAL || newStatus == SalesOrderStatus.APPROVED
                        || newStatus == SalesOrderStatus.CONFIRMED || newStatus == SalesOrderStatus.CANCELLED) {
                    valid = true;
                }
                break;
            case PENDING_APPROVAL:
                if (newStatus == SalesOrderStatus.APPROVED || newStatus == SalesOrderStatus.CONFIRMED
                        || newStatus == SalesOrderStatus.REJECTED || newStatus == SalesOrderStatus.CHANGES_REQUESTED
                        || newStatus == SalesOrderStatus.CANCELLED) {
                    valid = true;
                }
                break;
            case CHANGES_REQUESTED:
                if (newStatus == SalesOrderStatus.PENDING_APPROVAL || newStatus == SalesOrderStatus.DRAFT
                        || newStatus == SalesOrderStatus.CANCELLED) {
                    valid = true;
                }
                break;
            case APPROVED:
                if (newStatus == SalesOrderStatus.CONFIRMED || newStatus == SalesOrderStatus.COMPLETED
                        || newStatus == SalesOrderStatus.CANCELLED) {
                    valid = true;
                }
                break;
            case CONFIRMED:
                if (newStatus == SalesOrderStatus.COMPLETED || newStatus == SalesOrderStatus.CANCELLED) {
                    valid = true;
                }
                break;
            case COMPLETED:
            case REJECTED:
            case CANCELLED:
                break;
        }

        if (!valid) {
            throw new BadRequestException("Invalid SO status transition from " + current + " to " + newStatus);
        }

        // Prevent bypassing active pending workflow when confirming or cancelling
        if (newStatus == SalesOrderStatus.CONFIRMED || newStatus == SalesOrderStatus.CANCELLED) {
            try {
                WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(resolvedCompanyId, "SALES_ORDER", id);
                if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                    String action = newStatus == SalesOrderStatus.CONFIRMED ? "confirmed" : "cancelled";
                    throw new BadRequestException("Sales Order cannot be " + action + " directly while workflow approval is pending. Please approve or reject via the workflow.");
                }
            } catch (BadRequestException e) {
                throw e;
            } catch (Exception e) {
                log.debug("Workflow check skipped for sales order status change {}: {}", id, e.getMessage());
            }
        }

        so.setStatus(newStatus);
        so.setUpdatedBy(TenantUtils.getCurrentUserId());
        return salesOrderMapper.toResponse(salesOrderRepository.save(so));
    }

    @Override
    @Transactional
    public SalesOrderResponse submitForApproval(UUID companyId, UUID id) {
        return submitForApproval(companyId, id, null);
    }

    @Override
    @Transactional
    public SalesOrderResponse submitForApproval(UUID companyId, UUID id, String comments) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        SalesOrder so = salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Sales Order not found with ID: " + id));

        if (so.getStatus() != SalesOrderStatus.DRAFT && so.getStatus() != SalesOrderStatus.CHANGES_REQUESTED) {
            throw new BadRequestException("Only DRAFT or CHANGES_REQUESTED sales orders can be submitted for approval. Current status: " + so.getStatus());
        }

        // Prevent duplicate workflow submission
        try {
            WorkflowTransactionDto existingTx = workflowClient.getWorkflowByDocument(resolvedCompanyId, "SALES_ORDER", so.getId());
            if (existingTx != null && ("PENDING".equalsIgnoreCase(existingTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existingTx.getStatus()))) {
                throw new BadRequestException("Sales Order is already submitted for approval with transaction: " + existingTx.getId());
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("No existing workflow transaction found for sales order {}", id);
        }

        try {
            UUID custId = so.getCustomer() != null ? so.getCustomer().getId() : null;
            WorkflowTransactionDto tx = workflowClient.submitWorkflow(
                    resolvedCompanyId,
                    "SALES_ORDER",
                    so.getId(),
                    so.getSoNumber(),
                    comments != null ? comments : "Submitted sales order for approval",
                    so.getTotalAmount(),
                    custId,
                    java.util.Map.of("amount", so.getTotalAmount() != null ? so.getTotalAmount() : java.math.BigDecimal.ZERO)
            );
            if (tx != null && "APPROVED".equalsIgnoreCase(tx.getStatus())) {
                so.setStatus(SalesOrderStatus.APPROVED);
                log.info("Sales Order {} auto-approved by workflow engine, status updated to APPROVED", so.getSoNumber());
            } else {
                so.setStatus(SalesOrderStatus.PENDING_APPROVAL);
                log.info("Sales Order {} submitted for approval to workflow-service, status updated to PENDING_APPROVAL", so.getSoNumber());
            }
            so = salesOrderRepository.save(so);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Workflow engine submission failed for sales order {}. Error: {}", id, e.getMessage());
            throw new BadRequestException("Failed to submit sales order for workflow approval: " + e.getMessage());
        }

        return salesOrderMapper.toResponse(so);
    }

    @Override
    @Transactional
    public SalesOrderResponse confirmSO(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        // Prevent bypassing active pending workflow
        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(resolvedCompanyId, "SALES_ORDER", id);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BadRequestException("Sales Order cannot be confirmed directly while workflow approval is pending. Please approve via the workflow.");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for sales order {}: {}", id, e.getMessage());
        }

        return changeStatus(companyId, id, SalesOrderStatus.CONFIRMED);
    }

    @Override
    @Transactional
    public SalesOrderResponse approveSO(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        SalesOrder so = salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Sales Order not found"));

        if (so.getStatus() != SalesOrderStatus.DRAFT && so.getStatus() != SalesOrderStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Only DRAFT or PENDING_APPROVAL sales orders can be approved");
        }

        so.setStatus(SalesOrderStatus.APPROVED);
        so.setUpdatedBy(TenantUtils.getCurrentUserId());
        SalesOrder saved = salesOrderRepository.save(so);
        log.info("Sales Order {} marked APPROVED", so.getSoNumber());
        return salesOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public SalesOrderResponse cancelSO(UUID companyId, UUID id) {
        return changeStatus(companyId, id, SalesOrderStatus.CANCELLED);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalesOrderResponse> getAllSalesOrders(
            UUID companyId,
            Pageable pageable,
            SalesOrderStatus status,
            UUID customerId,
            LocalDate fromDate,
            LocalDate toDate,
            String search) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        Specification<SalesOrder> spec = SalesOrderSpecification.getSalesOrderSpec(
                resolvedCompanyId, status, customerId, fromDate, toDate, search);

        Page<SalesOrder> salesOrders = salesOrderRepository.findAll(spec, pageable);
        return salesOrders.map(salesOrderMapper::toResponse);
    }

    @Override
    @Transactional
    public SalesOrderResponse updateSalesOrder(UUID companyId, UUID id, SalesOrderUpdateRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        SalesOrder so = salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Sales Order not found"));

        if (so.getStatus() != SalesOrderStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT Sales Orders can be updated");
        }

        if (request.getReferenceNumber() != null)
            so.setReferenceNumber(request.getReferenceNumber());

        resolveSettingsForUpdate(resolvedCompanyId, request, so);

        if (request.getDeliveryTerms() != null)
            so.setDeliveryTerms(request.getDeliveryTerms());
        if (request.getNotes() != null)
            so.setNotes(request.getNotes());
        if (request.getBillingAddressId() != null)
            so.setBillingAddressId(request.getBillingAddressId());
        if (request.getDeliveryAddressId() != null)
            so.setDeliveryAddressId(request.getDeliveryAddressId());

        boolean recalculateTotals = false;

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            Map<UUID, SalesOrderItem> existingItemsMap = so.getItems().stream()
                    .collect(Collectors.toMap(SalesOrderItem::getId, item -> item));

            for (SalesOrderItemUpdateRequest itemReq : request.getItems()) {
                SalesOrderItem existingItem = existingItemsMap.get(itemReq.getId());
                if (existingItem == null) {
                    throw new BadRequestException("Item ID " + itemReq.getId() + " not found in this Sales Order");
                }

                existingItem.setQuantity(itemReq.getQuantity());
                existingItem.setUnitPrice(itemReq.getUnitPrice());
                if (itemReq.getDiscountPercent() != null) {
                    existingItem.setDiscountPercent(itemReq.getDiscountPercent());
                }
                if (itemReq.getNotes() != null) {
                    existingItem.setNotes(itemReq.getNotes());
                }

                existingItem.calculateLineAmount();
                existingItem.calculateTaxAmount();
                existingItem.calculateTotalAmount();

                existingItem.setUpdatedBy(TenantUtils.getCurrentUserId());
            }
            recalculateTotals = true;
        }

        if (recalculateTotals) {
            BigDecimal totalSubtotal = BigDecimal.ZERO;
            BigDecimal totalDiscount = BigDecimal.ZERO;
            BigDecimal totalTax = BigDecimal.ZERO;

            for (SalesOrderItem item : so.getItems()) {
                totalSubtotal = totalSubtotal.add(item.getQuantity().multiply(item.getUnitPrice()));
                totalDiscount = totalDiscount
                        .add(item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO);
                totalTax = totalTax.add(item.getTaxAmount() != null ? item.getTaxAmount() : BigDecimal.ZERO);
            }

            so.setSubtotal(totalSubtotal.setScale(4, RoundingMode.HALF_UP));
            so.setDiscountAmount(totalDiscount.setScale(4, RoundingMode.HALF_UP));
            so.setTaxAmount(totalTax.setScale(4, RoundingMode.HALF_UP));

            BigDecimal taxableAmount = so.getSubtotal().subtract(so.getDiscountAmount());
            BigDecimal totalBeforeRound = taxableAmount.add(so.getTaxAmount())
                    .add(so.getFreightCharges() != null ? so.getFreightCharges() : BigDecimal.ZERO)
                    .add(so.getOtherCharges() != null ? so.getOtherCharges() : BigDecimal.ZERO);

            so.setTotalBeforeRoundOff(totalBeforeRound.setScale(4, RoundingMode.HALF_UP));

            BigDecimal grandTotal = totalBeforeRound.setScale(0, RoundingMode.HALF_UP);
            so.setRoundOff(grandTotal.subtract(totalBeforeRound).setScale(4, RoundingMode.HALF_UP));
            so.setTotalAmount(grandTotal);
        }

        so.setUpdatedBy(TenantUtils.getCurrentUserId());
        SalesOrder saved = salesOrderRepository.save(so);
        return salesOrderMapper.toResponse(saved);
    }

    private void resolveSettingsForUpdate(UUID companyId, SalesOrderUpdateRequest request, SalesOrder so) {
        if (request.getPaymentTermId() != null) {
            paymentTermRepository.findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(
                    request.getPaymentTermId(), companyId,
                    com.erp.account.modules.common.enums.SalesDocumentType.SALES_ORDER).ifPresent(pt -> {
                        so.setPaymentTermId(pt.getId());
                        so.setPaymentTerms(pt.getDescription());
                    });
        } else if (request.getPaymentTerms() != null) {
            so.setPaymentTerms(request.getPaymentTerms());
            so.setPaymentTermId(null);
        }

        if (request.getTermsConditionId() != null) {
            termsConditionRepository.findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(
                    request.getTermsConditionId(), companyId,
                    com.erp.account.modules.common.enums.SalesDocumentType.SALES_ORDER).ifPresent(tc -> {
                        so.setTermsConditionId(tc.getId());
                        so.setTermsAndConditions(tc.getContent());
                    });
        } else if (request.getTermsAndConditions() != null) {
            so.setTermsAndConditions(request.getTermsAndConditions());
            so.setTermsConditionId(null);
        }
    }

    @Override
    @Transactional
    public com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse generateInvoiceFromSalesOrder(UUID companyId,
            UUID salesOrderId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        SalesOrder so = salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(salesOrderId, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Sales Order not found"));

        if (so.getStatus() != SalesOrderStatus.CONFIRMED && so.getStatus() != SalesOrderStatus.APPROVED && so.getStatus() != SalesOrderStatus.COMPLETED) {
            throw new BadRequestException("Only CONFIRMED, APPROVED, or COMPLETED Sales Orders can be invoiced");
        }

        if (salesInvoiceRepository.existsBySourceSalesOrderIdAndCompanyIdAndIsDeletedFalse(salesOrderId,
                resolvedCompanyId)) {
            throw new BadRequestException("Invoice already exists for this Sales Order");
        }

        com.erp.account.modules.salesinvoice.dto.SalesInvoiceRequest invoiceRequest = new com.erp.account.modules.salesinvoice.dto.SalesInvoiceRequest();
        invoiceRequest.setCustomerId(so.getCustomerId());
        invoiceRequest.setDeliveryAddressId(so.getDeliveryAddressId());

        invoiceRequest.setSourceSalesOrderId(so.getId());
        invoiceRequest.setSourceSalesOrderNumber(so.getSoNumber());

        invoiceRequest.setInvoiceDate(java.time.LocalDate.now());
        invoiceRequest.setDueDate(java.time.LocalDate.now());

        invoiceRequest.setInvoiceCurrency(so.getCurrency());
        invoiceRequest.setExchangeRate(so.getExchangeRate());

        invoiceRequest
                .setFreightCharges(so.getFreightCharges() != null ? so.getFreightCharges() : java.math.BigDecimal.ZERO);
        invoiceRequest.setOtherCharges(so.getOtherCharges() != null ? so.getOtherCharges() : java.math.BigDecimal.ZERO);

        BigDecimal advancePaid = BigDecimal.ZERO;
        if (so.getSourceProformaInvoiceId() != null) {
            advancePaid = getAdvanceReceivedForProformaInvoice(so.getSourceProformaInvoiceId(), 
                    so.getSourceProformaInvoiceNumber(), resolvedCompanyId);
        }
        invoiceRequest.setReceivedAmount(advancePaid);

        invoiceRequest.setPlaceOfSupplyStateId(so.getPlaceOfSupplyStateId());

        invoiceRequest.setNotes(so.getNotes());
        invoiceRequest.setPaymentTermId(so.getPaymentTermId());
        invoiceRequest.setPaymentTerms(so.getPaymentTerms());
        invoiceRequest.setTermsConditionId(so.getTermsConditionId());
        invoiceRequest.setTermsAndConditions(so.getTermsAndConditions());
        invoiceRequest.setDeliveryTerms(so.getDeliveryTerms());

        List<com.erp.account.modules.salesinvoice.dto.SalesInvoiceItemRequest> invoiceItems = so.getItems().stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .map(item -> {
                    com.erp.account.modules.salesinvoice.dto.SalesInvoiceItemRequest req = new com.erp.account.modules.salesinvoice.dto.SalesInvoiceItemRequest();
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

        invoiceRequest.setItems(invoiceItems);

        com.erp.account.common.dto.request.RequestWrapper<com.erp.account.modules.salesinvoice.dto.SalesInvoiceRequest> wrapper = new com.erp.account.common.dto.request.RequestWrapper<>();
        wrapper.setData(invoiceRequest);

        SalesInvoiceResponse response = salesInvoiceService.createInvoice(wrapper, resolvedCompanyId);

        // Link unlinked PI allocations to the newly created Sales Invoice
        if (so.getSourceProformaInvoiceId() != null && response != null && response.getId() != null) {
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

        return response;
    }

    private BigDecimal getAdvanceReceivedForProformaInvoice(UUID piId, String piNumber, UUID companyId) {
        BigDecimal receivedAmount = BigDecimal.ZERO;
        java.util.Set<UUID> countedReceiptIds = new java.util.HashSet<>();

        // 1. Query allocations directly linked to Proforma Invoice
        List<ReceiptAllocation> allocations = receiptAllocationRepository.findByProformaInvoiceId(piId);
        if (allocations != null) {
            for (ReceiptAllocation a : allocations) {
                if (Boolean.TRUE.equals(a.getIsDeleted())) continue;
                ReceiptVoucher rv = a.getReceiptVoucher();
                if (rv != null && !Boolean.TRUE.equals(rv.getIsDeleted())
                        && rv.getReceiptStatus() != ReceiptVoucherStatus.CANCELLED
                        && rv.getReceiptStatus() != ReceiptVoucherStatus.REVERSED
                        && rv.getReceiptStatus() != ReceiptVoucherStatus.REJECTED) {
                    receivedAmount = receivedAmount.add(a.getAllocatedAmount() != null ? a.getAllocatedAmount() : BigDecimal.ZERO);
                    if (rv.getId() != null) {
                        countedReceiptIds.add(rv.getId());
                    }
                }
            }
        }

        // 2. Backward compatibility: check any unallocated receipts linked by referenceNo ("ADV-" + piNumber)
        if (piNumber != null) {
            String refNo = "ADV-" + piNumber;
            List<ReceiptVoucher> legacyReceipts = receiptVoucherRepository
                    .findByReferenceNoAndCompanyIdAndIsDeletedFalse(refNo, companyId);
            if (legacyReceipts != null) {
                for (ReceiptVoucher rv : legacyReceipts) {
                    if (!countedReceiptIds.contains(rv.getId())
                            && rv.getReceiptStatus() != ReceiptVoucherStatus.CANCELLED
                            && rv.getReceiptStatus() != ReceiptVoucherStatus.REVERSED
                            && rv.getReceiptStatus() != ReceiptVoucherStatus.REJECTED) {
                        receivedAmount = receivedAmount.add(rv.getReceiptAmount() != null ? rv.getReceiptAmount() : BigDecimal.ZERO);
                        countedReceiptIds.add(rv.getId());
                    }
                }
            }
        }

        return receivedAmount;
    }
}
