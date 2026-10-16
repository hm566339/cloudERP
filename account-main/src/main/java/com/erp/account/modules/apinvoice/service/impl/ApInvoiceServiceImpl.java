package com.erp.account.modules.apinvoice.service.impl;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.enums.ItcEligibility;
import com.erp.account.enums.PurchaseNature;
import com.erp.account.modules.apinvoice.specification.ApInvoiceSpecification;
import org.springframework.data.jpa.domain.Specification;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.*;
import com.erp.account.modules.apinvoice.mapper.ApInvoiceItemMapper;
import com.erp.account.modules.apinvoice.mapper.ApInvoiceMapper;

import com.erp.account.modules.apinvoice.repository.ApInvoiceItemRepository;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.entity.VendorAddress;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.modules.apinvoice.service.GlPostingService;
import com.erp.account.modules.apinvoice.service.InvoiceCalculationService;
import com.erp.account.modules.apinvoice.service.InvoiceWorkflowService;
import com.erp.account.modules.apinvoice.service.PurchaseInvoiceValidationService;
import com.erp.account.modules.apinvoice.service.ThreeWayMatchingService;
import com.erp.account.util.AgingReportHelper;
import com.erp.account.util.ApInvoiceConstants;
import com.erp.account.util.Invoice;
import com.erp.account.util.InvoiceCalculationHelper;
import com.erp.account.util.InvoiceValidationUtil;
import com.erp.account.util.TenantUtils;
import com.erp.account.security.CurrentUserContext;
import org.springframework.security.core.context.SecurityContextHolder;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.apinvoice.service.ApInvoiceService;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.entity.ApInvoiceItem;
import com.erp.account.common.exception.ApInvoiceNotFoundException;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ClosedPeriodException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.common.exception.DuplicateInvoiceException;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.modules.gst.entity.GstStateCode;
import com.erp.account.common.exception.InvalidInvoiceStatusException;
import com.erp.account.common.exception.InvalidVendorException;
import com.erp.account.common.exception.InvoiceAlreadyPostedException;
import com.erp.account.common.exception.InvoiceApprovalException;
import com.erp.account.common.exception.InvoicePaymentException;

/**
 * Service implementation for AP Invoice Management
 * 
 * Implements:
 * - Invoice lifecycle management
 * - Approval workflow
 * - GL posting with double-entry accounting
 * - Payment tracking
 * - Financial reporting
 * - Tax calculations
 * - Multi-currency support
 * - Multi-company isolation
 * 
 * All operations are transaction-managed and include comprehensive logging
 */
import com.erp.account.modules.apinvoice.dto.request.*;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ApInvoiceServiceImpl implements ApInvoiceService {

        // Repositories
        private final ApInvoiceRepository apInvoiceRepository;
        private final ApInvoiceItemRepository apInvoiceItemRepository;
        private final VendorRepository vendorRepository;
        private final CompanyRepository companyRepository;
        private final ChartOfAccountRepository chartOfAccountRepository;
        private final GlPostingService glPostingService;
        private final AccountingValidationService accountingValidationService;
        private final InvoiceCalculationService invoiceCalculationService;
        private final InvoiceWorkflowService invoiceWorkflowService;
        private final InventoryIntegrationService inventoryIntegrationService;

        // New Dependencies for GST and Address
        private final com.erp.account.modules.gst.repository.GstStateCodeRepository gstStateCodeRepository;
        private final com.erp.account.modules.vendor.repository.VendorAddressRepository vendorAddressRepository;
        private final com.erp.account.common.service.GstCalculationService gstCalculationService;
        private final com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository hsnSacMasterRepository;

        // Procurement validation and 3-way matching
        private final PurchaseInvoiceValidationService purchaseInvoiceValidationService;
        private final ThreeWayMatchingService threeWayMatchingService;
        private final com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository purchaseOrderRepository;
        private final com.erp.account.modules.goodsreceipt.repository.GoodsReceiptRepository goodsReceiptRepository;
        private final com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository paymentVoucherRepository;
        private final com.erp.account.modules.accounting.service.AccountingPostingService accountingPostingService;

        // Mappers
        private final ApInvoiceMapper apInvoiceMapper;
        private final ApInvoiceItemMapper apInvoiceItemMapper;
        private final WorkflowClient workflowClient;

        // ============================================================
        // INVOICE LIFECYCLE MANAGEMENT
        // ============================================================

        @Override
        public ApInvoiceResponse createInvoice(UUID companyId, RequestWrapper<ApInvoiceRequest> requestWrapper) {

                ApInvoiceRequest request = requestWrapper.unwrap();

                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

                if (request.getInvoiceNo() == null || request.getInvoiceNo().trim().isEmpty()) {
                        request.setInvoiceNo("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                }

                log.info("Creating AP invoice for company: {} with invoice number: {}", companyId,
                                request.getInvoiceNo());

                purchaseInvoiceValidationService.normalizeAndValidateClassification(request);

                // Validate company exists
                Company company = companyRepository.findById(resolvedCompanyId)
                                .orElseThrow(() -> new BadRequestException("Company not found", "COMPANY_NOT_FOUND"));

                // Validate invoice data
                validateInvoice(request, resolvedCompanyId);

                // Validate procurement references (PO and GRN) and 3-way matching
                var validatedRefs = purchaseInvoiceValidationService.validateProcurementReferences(resolvedCompanyId,
                                request);
                threeWayMatchingService.validateThreeWayMatch(request, validatedRefs.purchaseOrder(),
                                validatedRefs.goodsReceipt());

                // Check for duplicate invoice number
                validateDuplicateInvoiceNumber(request.getInvoiceNo(), resolvedCompanyId);

                // Validate vendor
                Vendor vendor = validateAndGetVendor(request.getVendorId(), resolvedCompanyId);

                // Place of Supply
                if (request.getPlaceOfSupplyStateId() == null) {
                        throw new BadRequestException("Place of supply state ID is required", "POS_REQUIRED");
                }
                GstStateCode posState = gstStateCodeRepository.findById(request.getPlaceOfSupplyStateId())
                                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                                .orElseThrow(() -> new BadRequestException("Invalid or inactive Place of Supply state",
                                                "INVALID_POS_STATE"));

                // Vendor Address
                VendorAddress finalAddress = null;
                if (Boolean.TRUE.equals(request.getSaveNewVendorAddress()) && request.getNewVendorAddress() != null) {
                        VendorAddress newAddress = new VendorAddress();
                        newAddress.setVendor(vendor);
                        newAddress.setAddressLine1(request.getNewVendorAddress().getAddressLine1());
                        newAddress.setAddressLine2(request.getNewVendorAddress().getAddressLine2());
                        newAddress.setCity(request.getNewVendorAddress().getCity());
                        newAddress.setGstState(posState);
                        newAddress.setAddressType("BILLING");
                        newAddress.setCountry(request.getNewVendorAddress().getCountry());
                        newAddress.setPostalCode(request.getNewVendorAddress().getPostalCode());
                        newAddress.setIsDefault(false);
                        newAddress.setIsActive(true);
                        finalAddress = vendorAddressRepository.save(newAddress);
                } else if (request.getVendorAddressId() != null) {
                        finalAddress = vendorAddressRepository
                                        .findByIdAndVendorIdAndIsDeletedFalse(request.getVendorAddressId(),
                                                        vendor.getId())
                                        .orElseThrow(() -> new BadRequestException("Vendor address not found",
                                                        "ADDRESS_NOT_FOUND"));
                } else {
                        // Fallback to default billing address
                        finalAddress = vendorAddressRepository.findByVendorIdAndIsDeletedFalse(vendor.getId())
                                        .stream().filter(a -> Boolean.TRUE.equals(a.getIsDefault())).findFirst()
                                        .orElse(null);
                }

                // Create entity
                ApInvoice invoice = apInvoiceMapper.requestToEntity(request);
                invoice.setCompany(company);
                invoice.setVendor(vendor);
                invoice.setStatus(InvoiceStatus.DRAFT);
                invoice.setGlPostingStatus(PostingStatus.DRAFT);

                invoice.setPlaceOfSupplyStateId(posState.getId());
                invoice.setPlaceOfSupplyStateCode(posState.getStateCode());

                if (finalAddress != null) {
                        invoice.setVendorAddressId(finalAddress.getId());
                        invoice.setPurchaseAddressLine1(finalAddress.getAddressLine1());
                        invoice.setPurchaseAddressLine2(finalAddress.getAddressLine2());
                        invoice.setPurchaseCity(finalAddress.getCity());
                        invoice.setPurchaseState(
                                        finalAddress.getGstState() != null ? finalAddress.getGstState().getStateName()
                                                        : null);
                        invoice.setPurchaseCountry(finalAddress.getCountry());
                        invoice.setPurchasePostalCode(finalAddress.getPostalCode());
                } else {
                        invoice.setPurchaseAddressLine1(vendor.getAddressLine1());
                        invoice.setPurchaseAddressLine2(null);
                        invoice.setPurchaseCity(vendor.getCity());
                        invoice.setPurchaseState(vendor.getState());
                        invoice.setPurchaseCountry(vendor.getCountry());
                        invoice.setPurchasePostalCode(vendor.getPinCode());
                }

                // Create line items
                List<ApInvoiceItem> items = request.getItems().stream()
                                .map(itemRequest -> {
                                        ApInvoiceItem item = apInvoiceItemMapper.requestToEntity(itemRequest);
                                        item.setCompany(company);
                                        item.setApInvoice(invoice);
                                        item.setHsnSacId(itemRequest.getHsnSacId());

                                        com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster hsnSacMaster = null;
                                        if (itemRequest.getHsnSacId() != null) {
                                                hsnSacMaster = hsnSacMasterRepository
                                                                .findByIdAndIsDeletedFalse(itemRequest.getHsnSacId())
                                                                .orElse(null);
                                        }

                                        gstCalculationService.calculateItemTaxes(item, company, posState.getStateCode(),
                                                        hsnSacMaster);

                                        return item;
                                })
                                .collect(Collectors.toList());

                invoice.setItems(items);

                purchaseInvoiceValidationService.validateCalculatedTaxTreatment(request,
                                items.stream().map(ApInvoiceItem::getTaxAmount).reduce(BigDecimal.ZERO,
                                                BigDecimal::add));
                invoice.setIsReverseCharge(
                                request.getGstTreatment() == com.erp.account.enums.GstTreatment.REVERSE_CHARGE);

                // Set default values and calculate totals
                if (request.getPaidAmount() == null) {
                        request.setPaidAmount(BigDecimal.ZERO);
                }

                // Recalculate invoice totals based on calculated items
                BigDecimal subtotal = items.stream().map(ApInvoiceItem::getTaxableAmount).reduce(BigDecimal.ZERO,
                                BigDecimal::add);
                BigDecimal totalTax = items.stream().map(ApInvoiceItem::getTaxAmount).reduce(BigDecimal.ZERO,
                                BigDecimal::add);
                BigDecimal cgst = items.stream().map(ApInvoiceItem::getCgstAmount).reduce(BigDecimal.ZERO,
                                BigDecimal::add);
                BigDecimal sgst = items.stream().map(ApInvoiceItem::getSgstAmount).reduce(BigDecimal.ZERO,
                                BigDecimal::add);
                BigDecimal igst = items.stream().map(ApInvoiceItem::getIgstAmount).reduce(BigDecimal.ZERO,
                                BigDecimal::add);
                BigDecimal cess = items.stream().map(ApInvoiceItem::getCessAmount).reduce(BigDecimal.ZERO,
                                BigDecimal::add);

                invoice.setSubtotal(subtotal);
                invoice.setTaxAmount(totalTax);
                invoice.setCgstAmount(cgst);
                invoice.setSgstAmount(sgst);
                invoice.setIgstAmount(igst);
                invoice.setCessAmount(cess);

                // Keep TDS amount from request or default to 0
                BigDecimal tds = request.getTdsAmount() != null ? request.getTdsAmount() : BigDecimal.ZERO;
                invoice.setTdsAmount(tds);

                // Add Freight Charges
                BigDecimal freightCharges = request.getFreightCharges() != null ? request.getFreightCharges()
                                : BigDecimal.ZERO;
                invoice.setFreightCharges(freightCharges);

                BigDecimal totalBeforeRoundOff = InvoiceCalculationHelper.calculateTotalAmount(subtotal, totalTax, tds,
                                freightCharges);
                BigDecimal roundOff = InvoiceCalculationHelper.calculateRoundOff(totalBeforeRoundOff);
                BigDecimal total = totalBeforeRoundOff.add(roundOff).setScale(4, RoundingMode.HALF_UP);

                invoice.setTotalBeforeRoundOff(totalBeforeRoundOff);
                invoice.setRoundOff(roundOff);
                invoice.setTotalAmount(total);
                invoice.setOutstandingAmount(total.subtract(request.getPaidAmount()));

                // Save invoice
                ApInvoice savedInvoice = apInvoiceRepository.save(invoice);
                log.info(ApInvoiceConstants.LOG_INVOICE_CREATED, savedInvoice.getInvoiceNo(), vendor.getVendorName());

                return enrichInvoiceResponse(apInvoiceMapper.entityToResponse(savedInvoice));
        }

        @Override
        public ApInvoiceResponse updateInvoice(UUID invoiceId, RequestWrapper<ApInvoiceRequest> requestWrapper) {
                ApInvoiceRequest request = requestWrapper.unwrap();
                log.info("Updating AP invoice: {}", invoiceId);

                ApInvoice invoice = getApInvoiceEntity(invoiceId);

                // Check if editable
                InvoiceValidationUtil.validateInvoiceEditable(invoice.getStatus().toString());

                // Validate invoice data
                purchaseInvoiceValidationService.normalizeAndValidateClassification(request);
                validateInvoice(request, invoice.getCompany().getId());

                // Validate procurement references (PO and GRN) and 3-way matching
                var validatedRefs = purchaseInvoiceValidationService
                                .validateProcurementReferences(invoice.getCompany().getId(), request);
                threeWayMatchingService.validateThreeWayMatch(request, validatedRefs.purchaseOrder(),
                                validatedRefs.goodsReceipt());

                // Place of Supply
                if (request.getPlaceOfSupplyStateId() == null) {
                        throw new BadRequestException("Place of supply state ID is required", "POS_REQUIRED");
                }
                com.erp.account.modules.gst.entity.GstStateCode posState = gstStateCodeRepository
                                .findById(request.getPlaceOfSupplyStateId())
                                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                                .orElseThrow(() -> new BadRequestException("Invalid or inactive Place of Supply state",
                                                "INVALID_POS_STATE"));

                // Vendor Address
                com.erp.account.modules.vendor.entity.VendorAddress finalAddress = null;
                if (Boolean.TRUE.equals(request.getSaveNewVendorAddress()) && request.getNewVendorAddress() != null) {
                        com.erp.account.modules.vendor.entity.VendorAddress newAddress = new com.erp.account.modules.vendor.entity.VendorAddress();
                        newAddress.setVendor(invoice.getVendor());
                        newAddress.setAddressLine1(request.getNewVendorAddress().getAddressLine1());
                        newAddress.setAddressLine2(request.getNewVendorAddress().getAddressLine2());
                        newAddress.setCity(request.getNewVendorAddress().getCity());
                        newAddress.setGstState(posState);
                        newAddress.setAddressType("BILLING");
                        newAddress.setCountry(request.getNewVendorAddress().getCountry());
                        newAddress.setPostalCode(request.getNewVendorAddress().getPostalCode());
                        newAddress.setIsDefault(false);
                        newAddress.setIsActive(true);
                        finalAddress = vendorAddressRepository.save(newAddress);
                } else if (request.getVendorAddressId() != null) {
                        finalAddress = vendorAddressRepository
                                        .findByIdAndVendorIdAndIsDeletedFalse(request.getVendorAddressId(),
                                                        invoice.getVendor().getId())
                                        .orElseThrow(() -> new BadRequestException("Vendor address not found",
                                                        "ADDRESS_NOT_FOUND"));
                }

                // Update invoice
                apInvoiceMapper.updateEntityFromRequest(request, invoice);

                invoice.setPlaceOfSupplyStateId(posState.getId());
                invoice.setPlaceOfSupplyStateCode(posState.getStateCode());

                if (finalAddress != null) {
                        invoice.setVendorAddressId(finalAddress.getId());
                        invoice.setPurchaseAddressLine1(finalAddress.getAddressLine1());
                        invoice.setPurchaseAddressLine2(finalAddress.getAddressLine2());
                        invoice.setPurchaseCity(finalAddress.getCity());
                        invoice.setPurchaseState(
                                        finalAddress.getGstState() != null ? finalAddress.getGstState().getStateName()
                                                        : null);
                        invoice.setPurchaseCountry(finalAddress.getCountry());
                        invoice.setPurchasePostalCode(finalAddress.getPostalCode());
                }

                // Update line items
                if (request.getItems() != null && !request.getItems().isEmpty()) {
                        softDeleteInvoiceItems(invoiceId, invoice.getCompany().getId());

                        List<ApInvoiceItem> newItems = request.getItems().stream()
                                        .map(itemRequest -> {
                                                ApInvoiceItem item = apInvoiceItemMapper.requestToEntity(itemRequest);
                                                item.setCompany(invoice.getCompany());
                                                item.setApInvoice(invoice);
                                                item.setHsnSacId(itemRequest.getHsnSacId());

                                                com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster hsnSacMaster = null;
                                                if (itemRequest.getHsnSacId() != null) {
                                                        hsnSacMaster = hsnSacMasterRepository
                                                                        .findByIdAndIsDeletedFalse(
                                                                                        itemRequest.getHsnSacId())
                                                                        .orElse(null);
                                                }

                                                gstCalculationService.calculateItemTaxes(item, invoice.getCompany(),
                                                                posState.getStateCode(), hsnSacMaster);

                                                return item;
                                        })
                                        .collect(Collectors.toList());

                        invoice.setItems(newItems);

                        purchaseInvoiceValidationService.validateCalculatedTaxTreatment(request,
                                        newItems.stream().map(ApInvoiceItem::getTaxAmount).reduce(BigDecimal.ZERO,
                                                        BigDecimal::add));
                        invoice.setIsReverseCharge(
                                        request.getGstTreatment() == com.erp.account.enums.GstTreatment.REVERSE_CHARGE);
                }

                // Recalculate invoice totals based on calculated items
                BigDecimal subtotal = invoice.getItems().stream().map(ApInvoiceItem::getTaxableAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalTax = invoice.getItems().stream().map(ApInvoiceItem::getTaxAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal cgst = invoice.getItems().stream().map(ApInvoiceItem::getCgstAmount).reduce(BigDecimal.ZERO,
                                BigDecimal::add);
                BigDecimal sgst = invoice.getItems().stream().map(ApInvoiceItem::getSgstAmount).reduce(BigDecimal.ZERO,
                                BigDecimal::add);
                BigDecimal igst = invoice.getItems().stream().map(ApInvoiceItem::getIgstAmount).reduce(BigDecimal.ZERO,
                                BigDecimal::add);
                BigDecimal cess = invoice.getItems().stream().map(ApInvoiceItem::getCessAmount).reduce(BigDecimal.ZERO,
                                BigDecimal::add);

                invoice.setSubtotal(subtotal);
                invoice.setTaxAmount(totalTax);
                invoice.setCgstAmount(cgst);
                invoice.setSgstAmount(sgst);
                invoice.setIgstAmount(igst);
                invoice.setCessAmount(cess);

                // Keep TDS amount from request or default to 0
                BigDecimal tds = request.getTdsAmount() != null ? request.getTdsAmount() : BigDecimal.ZERO;
                invoice.setTdsAmount(tds);

                // Add Freight Charges
                BigDecimal freightCharges = request.getFreightCharges() != null ? request.getFreightCharges()
                                : BigDecimal.ZERO;
                invoice.setFreightCharges(freightCharges);

                BigDecimal totalBeforeRoundOff = InvoiceCalculationHelper.calculateTotalAmount(subtotal, totalTax, tds,
                                freightCharges);
                BigDecimal roundOff = InvoiceCalculationHelper.calculateRoundOff(totalBeforeRoundOff);
                BigDecimal total = totalBeforeRoundOff.add(roundOff).setScale(4, RoundingMode.HALF_UP);

                invoice.setTotalBeforeRoundOff(totalBeforeRoundOff);
                invoice.setRoundOff(roundOff);
                invoice.setTotalAmount(total);

                BigDecimal paid = request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO;
                invoice.setOutstandingAmount(total.subtract(paid));

                ApInvoice updatedInvoice = apInvoiceRepository.save(invoice);
                log.info(ApInvoiceConstants.LOG_INVOICE_UPDATED, updatedInvoice.getInvoiceNo(), getCurrentUserId());

                return enrichInvoiceResponse(apInvoiceMapper.entityToResponse(updatedInvoice));
        }

        @Override
        public void deleteInvoice(UUID invoiceId) {
                log.info("Deleting AP invoice: {}", invoiceId);

                ApInvoice invoice = getApInvoiceEntity(invoiceId);

                if (invoice.getStatus() != InvoiceStatus.DRAFT
                                || invoice.getGlPostingStatus() == com.erp.account.enums.PostingStatus.POSTED) {
                        throw new InvalidInvoiceStatusException(
                                        invoice.getStatus().toString(), "DELETE", "AP_INVOICE_DELETE_FORBIDDEN");
                }

                // Soft-delete line items first
                softDeleteInvoiceItems(invoiceId, invoice.getCompany().getId());

                // Soft delete invoice
                invoice.setIsDeleted(true);
                apInvoiceRepository.save(invoice);

                log.info(ApInvoiceConstants.LOG_INVOICE_DELETED, invoice.getInvoiceNo(), getCurrentUserId());
        }

        @Override
        @Transactional(readOnly = true)
        public ApInvoiceProfileResponse getInvoiceById(UUID invoiceId) {
                ApInvoice invoice = getApInvoiceEntity(invoiceId);
                return buildApInvoiceProfileResponse(invoice);
        }

        @Override
        public ApInvoiceProfileResponse adjustAdvance(UUID invoiceId,
                        com.erp.account.modules.apinvoice.dto.request.AdvanceAdjustmentRequest request) {
                ApInvoice invoice = getApInvoiceEntity(invoiceId);

                if (invoice.getStatus() != com.erp.account.enums.InvoiceStatus.POSTED &&
                                invoice.getStatus() != com.erp.account.enums.InvoiceStatus.PARTIALLY_PAID) {
                        throw new BadRequestException(
                                        "Only POSTED or PARTIALLY_PAID invoices can be adjusted with advances.");
                }

                com.erp.account.modules.paymentvoucher.entity.PaymentVoucher advanceVoucher = paymentVoucherRepository
                                .findById(request.getPaymentVoucherId())
                                .orElseThrow(() -> new BadRequestException("Advance payment voucher not found"));

                if (!advanceVoucher.getVendor().getId().equals(invoice.getVendor().getId())) {
                        throw new BadRequestException(
                                        "Advance voucher does not belong to the same vendor as the invoice.");
                }

                if (advanceVoucher.getPurchaseOrderId() != null && invoice.getPurchaseOrderId() != null &&
                                !advanceVoucher.getPurchaseOrderId().equals(invoice.getPurchaseOrderId())) {
                        throw new BadRequestException("Advance voucher PO does not match the invoice PO.");
                }

                BigDecimal unallocated = advanceVoucher.getPaymentAmount()
                                .subtract(advanceVoucher.getTotalAllocatedAmount() != null
                                                ? advanceVoucher.getTotalAllocatedAmount()
                                                : BigDecimal.ZERO);
                if (request.getAmount().compareTo(unallocated) > 0) {
                        throw new BadRequestException(
                                        "Adjustment amount exceeds unallocated balance of the advance voucher.");
                }

                if (request.getAmount().compareTo(invoice.getOutstandingAmount()) > 0) {
                        throw new BadRequestException("Adjustment amount exceeds outstanding amount of the invoice.");
                }

                // Allocate
                com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation allocation = com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation
                                .builder()
                                .paymentVoucher(advanceVoucher)
                                .apInvoice(invoice)
                                .allocatedAmount(request.getAmount())
                                .build();

                advanceVoucher.getAllocations().add(allocation);
                advanceVoucher.setTotalAllocatedAmount((advanceVoucher.getTotalAllocatedAmount() != null
                                ? advanceVoucher.getTotalAllocatedAmount()
                                : BigDecimal.ZERO).add(request.getAmount()));

                invoice.setPaidAmount((invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO)
                                .add(request.getAmount()));
                invoice.setOutstandingAmount(invoice.getTotalAmount().subtract(invoice.getPaidAmount()));

                if (invoice.getOutstandingAmount().compareTo(BigDecimal.ZERO) == 0) {
                        invoice.setStatus(com.erp.account.enums.InvoiceStatus.FULLY_PAID);
                } else {
                        invoice.setStatus(com.erp.account.enums.InvoiceStatus.PARTIALLY_PAID);
                }

                paymentVoucherRepository.save(advanceVoucher);
                apInvoiceRepository.save(invoice);

                // Accounting Postings (Debit AP, Credit Supplier Advance)
                if (advanceVoucher.getPayableAccount() != null && invoice.getVendor().getPayableAccount() != null) {
                        com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest journalRequest = new com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest();

                        journalRequest.setVoucherDate(java.time.LocalDate.now());
                        journalRequest.setReferenceNo("ADV-ADJ-" + invoice.getInvoiceNo());
                        journalRequest.setNarration("Advance adjustment against Invoice " + invoice.getInvoiceNo());

                        java.util.List<com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest> lines = new java.util.ArrayList<>();

                        // Debit AP
                        com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest apLine = new com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest();
                        apLine.setAccountId(invoice.getVendor().getPayableAccount().getId());
                        apLine.setDebitAmount(request.getAmount());
                        apLine.setCreditAmount(BigDecimal.ZERO);
                        apLine.setLineDescription("Advance adjustment - Accounts Payable");
                        lines.add(apLine);

                        // Credit Supplier Advance
                        com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest advanceLine = new com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest();
                        advanceLine.setAccountId(advanceVoucher.getPayableAccount().getId());
                        advanceLine.setDebitAmount(BigDecimal.ZERO);
                        advanceLine.setCreditAmount(request.getAmount());
                        advanceLine.setLineDescription("Advance adjustment - Supplier Advance");
                        lines.add(advanceLine);

                        journalRequest.setJournalLines(lines);

                        UUID companyId = invoice.getCompany().getId();
                        com.erp.account.modules.fiscalyear.entity.FiscalYear fy = accountingValidationService
                                        .fiscalYearFor(journalRequest.getVoucherDate(), companyId);
                        com.erp.account.modules.accountingperiod.entity.AccountingPeriod period = accountingValidationService
                                        .accountingPeriodFor(journalRequest.getVoucherDate(), companyId);

                        accountingPostingService.postJournalEntry(journalRequest, invoice.getCompany(), fy, period,
                                        journalRequest.getVoucherDate(), TenantUtils.getCurrentUserId());
                }

                return buildApInvoiceProfileResponse(invoice);
        }

        private ApInvoiceProfileResponse buildApInvoiceProfileResponse(ApInvoice inv) {
                Company comp = inv.getCompany();
                Vendor vend = inv.getVendor();

                // Fetch Warehouse Information from Inventory MS
                java.util.Map<UUID, com.erp.account.common.dto.inventory.response.ProductStockIntegrationResponse> stockCache = new java.util.HashMap<>();
                java.util.Set<PiWarehouseSummaryDto> uniqueWarehouses = new java.util.HashSet<>();

                // 4. Purchase Items
                List<PiItemDto> items = new java.util.ArrayList<>();
                if (inv.getItems() != null) {
                        for (ApInvoiceItem item : inv.getItems()) {
                                if (Boolean.TRUE.equals(item.getIsDeleted()))
                                        continue;

                                PurchaseItemInventoryResponse inventoryDto = null;
                                if (item.getItemId() != null && comp != null
                                                && item.getItemType() == com.erp.account.enums.ItemType.PRODUCT) {
                                        try {
                                                UUID pId = item.getItemId();
                                                log.info("Fetching inventory stock for AP invoice={}, companyId={}, productId={}",
                                                                inv.getId(), comp.getId(), pId);

                                                com.erp.account.common.dto.inventory.response.ProductStockIntegrationResponse stockData = stockCache
                                                                .get(pId);
                                                if (!stockCache.containsKey(pId)) {
                                                        List<com.erp.account.common.dto.inventory.response.ProductStockIntegrationResponse> res = inventoryIntegrationService
                                                                        .getGroupedStock(comp.getId(), pId);

                                                        log.info("Inventory stock response for AP invoice={}, productId={}, success={}, dataSize={}",
                                                                        inv.getId(), pId, true,
                                                                        res != null ? res.size() : 0);

                                                        if (res != null && !res.isEmpty()) {
                                                                stockData = res.get(0);
                                                        } else {
                                                                log.warn("No inventory stock found for AP invoice={}, companyId={}, productId={}",
                                                                                inv.getId(), comp.getId(), pId);
                                                        }
                                                        stockCache.put(pId, stockData);
                                                }

                                                if (stockData != null && stockData.getWarehouses() != null
                                                                && !stockData.getWarehouses().isEmpty()) {
                                                        com.erp.account.common.dto.inventory.response.WarehouseStockIntegrationResponse selectedWarehouse = null;

                                                        if (item.getWarehouseId() != null) {
                                                                selectedWarehouse = stockData.getWarehouses().stream()
                                                                                .filter(w -> w.getWarehouseId() != null
                                                                                                && w.getWarehouseId()
                                                                                                                .equals(item.getWarehouseId()))
                                                                                .findFirst().orElse(null);
                                                        }
                                                        if (selectedWarehouse == null) {
                                                                selectedWarehouse = stockData.getWarehouses().get(0);
                                                        }

                                                        if (selectedWarehouse != null
                                                                        && selectedWarehouse.getLocations() != null
                                                                        && !selectedWarehouse.getLocations()
                                                                                        .isEmpty()) {
                                                                com.erp.account.common.dto.inventory.response.LocationStockIntegrationResponse selectedLocation = null;
                                                                if (item.getLocationId() != null) {
                                                                        selectedLocation = selectedWarehouse
                                                                                        .getLocations().stream()
                                                                                        .filter(l -> l.getLocationId() != null
                                                                                                        && l.getLocationId()
                                                                                                                        .equals(item.getLocationId()))
                                                                                        .findFirst().orElse(null);
                                                                }
                                                                if (selectedLocation == null) {
                                                                        selectedLocation = selectedWarehouse
                                                                                        .getLocations().get(0);
                                                                }

                                                                if (selectedLocation != null) {
                                                                        inventoryDto = PurchaseItemInventoryResponse
                                                                                        .builder()
                                                                                        .warehouseId(selectedWarehouse
                                                                                                        .getWarehouseId())
                                                                                        .warehouseName(selectedWarehouse
                                                                                                        .getWarehouseName())
                                                                                        .locationId(selectedLocation
                                                                                                        .getLocationId())
                                                                                        .locationName(selectedLocation
                                                                                                        .getLocationName())
                                                                                        .batchId(selectedLocation
                                                                                                        .getBatchId())
                                                                                        .batchCode(selectedLocation
                                                                                                        .getBatchCode())
                                                                                        .stockQuantity(selectedLocation
                                                                                                        .getQuantity())
                                                                                        .reservedQuantity(
                                                                                                        selectedLocation.getReservedQuantity())
                                                                                        .availableQuantity(
                                                                                                        selectedLocation.getAvailableQuantity())
                                                                                        .inventoryFetchStatus("SUCCESS")
                                                                                        .build();

                                                                        // Add to unique warehouses summary
                                                                        final com.erp.account.common.dto.inventory.response.WarehouseStockIntegrationResponse finalWh = selectedWarehouse;
                                                                        PiLocationSummaryDto locSummary = PiLocationSummaryDto
                                                                                        .builder()
                                                                                        .locationId(selectedLocation
                                                                                                        .getLocationId())
                                                                                        .locationName(selectedLocation
                                                                                                        .getLocationName())
                                                                                        .build();

                                                                        PiWarehouseSummaryDto whSummary = uniqueWarehouses
                                                                                        .stream()
                                                                                        .filter(w -> w.getWarehouseId()
                                                                                                        .equals(finalWh.getWarehouseId()))
                                                                                        .findFirst().orElseGet(() -> {
                                                                                                PiWarehouseSummaryDto w = PiWarehouseSummaryDto
                                                                                                                .builder()
                                                                                                                .warehouseId(finalWh
                                                                                                                                .getWarehouseId())
                                                                                                                .warehouseName(finalWh
                                                                                                                                .getWarehouseName())
                                                                                                                .locations(new java.util.ArrayList<>())
                                                                                                                .build();
                                                                                                uniqueWarehouses.add(w);
                                                                                                return w;
                                                                                        });

                                                                        if (whSummary.getLocations().stream().noneMatch(
                                                                                        l -> l.getLocationId().equals(
                                                                                                        locSummary.getLocationId()))) {
                                                                                whSummary.getLocations()
                                                                                                .add(locSummary);
                                                                        }
                                                                }
                                                        }
                                                }
                                        } catch (Exception e) {
                                                log.error("Failed to fetch inventory stock for AP invoice={}, companyId={}, productId={}",
                                                                inv.getId(), comp.getId(), item.getItemId(), e);
                                                inventoryDto = PurchaseItemInventoryResponse.builder()
                                                                .inventoryFetchStatus("FAILED").build();
                                        }
                                }

                                if (inventoryDto == null
                                                && item.getItemType() == com.erp.account.enums.ItemType.PRODUCT) {
                                        inventoryDto = PurchaseItemInventoryResponse.builder()
                                                        .inventoryFetchStatus("NOT_FOUND").build();
                                }

                                String expAccName = item.getExpenseAccountId() != null
                                                ? chartOfAccountRepository.findById(
                                                                item.getExpenseAccountId())
                                                                .map(ChartOfAccount::getAccountName)
                                                                .orElse(null)
                                                : null;
                                items.add(PiItemDto.builder()
                                                .itemId(item.getItemId() != null
                                                                ? item.getItemId()
                                                                : item.getId())
                                                .itemCode(null)
                                                .itemName(item.getDescription())
                                                .sku(null)
                                                .description(item.getDescription())
                                                .hsnSacCode(null)
                                                .gstSlab(null)
                                                .quantity(item.getQuantity())
                                                .unit(item.getUnit())
                                                .unitPrice(item.getUnitPrice())
                                                .discountPercentage(BigDecimal.ZERO)
                                                .discountAmount(BigDecimal.ZERO)
                                                .taxableAmount(
                                                                item.getTaxableAmount() != null
                                                                                ? item.getTaxableAmount()
                                                                                : BigDecimal.ZERO)
                                                .cgst(BigDecimal.ZERO)
                                                .sgst(BigDecimal.ZERO)
                                                .igst(BigDecimal.ZERO)
                                                .cess(BigDecimal.ZERO)
                                                .taxAmount(item.getTaxAmount() != null
                                                                ? item.getTaxAmount()
                                                                : BigDecimal.ZERO)
                                                .totalAmount(
                                                                item.getTotalAmount() != null
                                                                                ? item.getTotalAmount()
                                                                                : BigDecimal.ZERO)
                                                .expenseAccount(expAccName)
                                                .warehouse(inventoryDto != null ? inventoryDto.getWarehouseName()
                                                                : null)
                                                .batchNumber(null)
                                                .serialNumber(null)
                                                .expiryDate(null)
                                                .costCenter(null)
                                                .inventory(inventoryDto)
                                                .build());
                        }
                }

                // Financial calculations
                BigDecimal total = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
                BigDecimal paid = inv.getPaidAmount() != null ? inv.getPaidAmount() : BigDecimal.ZERO;
                BigDecimal outstanding = inv.getOutstandingAmount() != null ? inv.getOutstandingAmount()
                                : total.subtract(paid);

                BigDecimal paidPct = total.compareTo(BigDecimal.ZERO) > 0
                                ? paid.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP)
                                : BigDecimal.ZERO;

                int daysOverdue = 0;
                int daysOutstanding = 0;
                if (inv.getDueDate() != null) {
                        LocalDate today = LocalDate.now();
                        if (today.isAfter(inv.getDueDate()) && outstanding.compareTo(BigDecimal.ZERO) > 0) {
                                daysOverdue = (int) java.time.temporal.ChronoUnit.DAYS.between(inv.getDueDate(), today);
                        }
                        if (inv.getInvoiceDate() != null) {
                                daysOutstanding = (int) java.time.temporal.ChronoUnit.DAYS.between(inv.getInvoiceDate(),
                                                today);
                        }
                }

                // Helper for ledger names
                String cgstLedger = inv.getInputCgstAccountId() != null
                                ? chartOfAccountRepository.findById(inv.getInputCgstAccountId())
                                                .map(ChartOfAccount::getAccountName)
                                                .orElse(null)
                                : null;
                String sgstLedger = inv.getInputSgstAccountId() != null
                                ? chartOfAccountRepository.findById(inv.getInputSgstAccountId())
                                                .map(ChartOfAccount::getAccountName)
                                                .orElse(null)
                                : null;
                String igstLedger = inv.getInputIgstAccountId() != null
                                ? chartOfAccountRepository.findById(inv.getInputIgstAccountId())
                                                .map(ChartOfAccount::getAccountName)
                                                .orElse(null)
                                : null;
                String cessLedger = inv.getInputCessAccountId() != null
                                ? chartOfAccountRepository.findById(inv.getInputCessAccountId())
                                                .map(ChartOfAccount::getAccountName)
                                                .orElse(null)
                                : null;
                String apLedger = vend != null && vend.getPayableAccount() != null
                                ? vend.getPayableAccount().getAccountName()
                                : null;

                return ApInvoiceProfileResponse.builder()
                                // 1. Purchase Invoice Master
                                .id(inv.getId())
                                .invoiceNumber(inv.getInvoiceNo())
                                .invoiceDate(inv.getInvoiceDate())
                                .dueDate(inv.getDueDate())
                                .status(inv.getStatus() != null ? inv.getStatus().name() : null)
                                .approvalStatus(inv.getApprovedBy() != null ? "APPROVED"
                                                : (inv.getStatus() != null ? inv.getStatus().name() : "DRAFT"))
                                .paymentStatus(outstanding.compareTo(BigDecimal.ZERO) == 0 ? "PAID"
                                                : (paid.compareTo(BigDecimal.ZERO) > 0 ? "PARTIALLY_PAID" : "UNPAID"))
                                .currency(inv.getInvoiceCurrency() != null ? inv.getInvoiceCurrency()
                                                : (comp != null ? comp.getBaseCurrency() : "INR"))
                                .exchangeRate(inv.getExchangeRate() != null ? inv.getExchangeRate() : BigDecimal.ONE)
                                .baseCurrencyAmount(total)
                                .referenceNumber(null)
                                .notes(null)
                                .purchaseSource(inv.getPurchaseSource())
                                .documentType(inv.getDocumentType())
                                .purchaseNature(inv.getPurchaseNature())
                                .paymentType(inv.getPaymentType())
                                .gstTreatment(inv.getGstTreatment())
                                .itcEligibility(inv.getItcEligibility())
                                .itcReason(inv.getItcReason())
                                .supplierInvoiceNumber(inv.getSupplierInvoiceNumber())
                                .supplierInvoiceDate(inv.getSupplierInvoiceDate())

                                // 2. Company Information
                                .companyInformation(comp != null ? PiCompanyInfoDto.builder()
                                                .companyId(comp.getId())
                                                .companyName(comp.getCompanyName())
                                                .gstin(comp.getGstin())
                                                .pan(null)
                                                .address(comp.getAddressLine1() + " " + comp.getAddressLine2() + " "
                                                                + comp.getCity() + " " + comp.getState() + " "
                                                                + comp.getCountry() + " " + comp.getPostalCode())
                                                .baseCurrency(comp.getBaseCurrency())
                                                .build() : null)

                                // 3. Vendor Information
                                .vendorInformation(vend != null ? PiVendorInfoDto.builder()
                                                .vendorId(vend.getId())
                                                .vendorCode(vend.getVendorCode())
                                                .vendorName(vend.getVendorName())
                                                .gstin(vend.getGstin())
                                                .pan(vend.getPanNo())
                                                .email(vend.getEmail())
                                                .phone(vend.getPhone())
                                                .billingAddress(vend.getAddressLine1() != null
                                                                ? (vend.getAddressLine1() + (vend.getCity() != null
                                                                                ? ", " + vend.getCity()
                                                                                : ""))
                                                                : null)
                                                .paymentTerms(vend.getPaymentTermDays() != null
                                                                ? vend.getPaymentTermDays() + " Days"
                                                                : null)
                                                .creditPeriod(vend.getPaymentTermDays())
                                                .outstandingBalance(
                                                                vend.getOpeningBalance() != null
                                                                                ? vend.getOpeningBalance()
                                                                                : BigDecimal.ZERO)
                                                .availableCredit(vend.getCreditLimit() != null ? vend.getCreditLimit()
                                                                : BigDecimal.ZERO)
                                                .build() : null)

                                // 4. Purchase Items
                                .purchaseItems(items)

                                // 5. Inventory Information
                                .inventoryInformation(PiInventoryInfoDto.builder()
                                                .inventoryTransactionId(null)
                                                .warehouses(new java.util.ArrayList<>(uniqueWarehouses))
                                                .stockBeforePurchase(null)
                                                .stockAfterPurchase(null)
                                                .stockMovementDetails(List.of())
                                                .build())

                                // 6. Tax Summary
                                .taxSummary(PiTaxSummaryDto.builder()
                                                .taxableAmount(inv.getSubtotal() != null ? inv.getSubtotal()
                                                                : BigDecimal.ZERO)
                                                .cgstAmount(inv.getCgstAmount() != null ? inv.getCgstAmount()
                                                                : BigDecimal.ZERO)
                                                .sgstAmount(inv.getSgstAmount() != null ? inv.getSgstAmount()
                                                                : BigDecimal.ZERO)
                                                .igstAmount(inv.getIgstAmount() != null ? inv.getIgstAmount()
                                                                : BigDecimal.ZERO)
                                                .cessAmount(inv.getCessAmount() != null ? inv.getCessAmount()
                                                                : BigDecimal.ZERO)
                                                .tdsAmount(inv.getTdsAmount() != null ? inv.getTdsAmount()
                                                                : BigDecimal.ZERO)
                                                .roundOff(BigDecimal.ZERO)
                                                .totalTax(inv.getTaxAmount() != null ? inv.getTaxAmount()
                                                                : BigDecimal.ZERO)
                                                .grandTotal(total)
                                                .build())

                                // 7. Payment Information
                                .paymentInformation(PiPaymentInfoDto.builder()
                                                .totalPaid(paid)
                                                .outstandingAmount(outstanding)
                                                .paymentPercentage(paidPct)
                                                .lastPaymentDate(null)
                                                .paymentHistory(List.of())
                                                .paymentReferences(null)
                                                .paymentMode(null)
                                                .build())

                                // 8. Vendor Ledger
                                .vendorLedger(PiVendorLedgerDto.builder()
                                                .openingBalance(vend != null && vend.getOpeningBalance() != null
                                                                ? vend.getOpeningBalance()
                                                                : BigDecimal.ZERO)
                                                .currentBalance(vend != null && vend.getOpeningBalance() != null
                                                                ? vend.getOpeningBalance()
                                                                : BigDecimal.ZERO)
                                                .closingBalance(vend != null && vend.getOpeningBalance() != null
                                                                ? vend.getOpeningBalance()
                                                                : BigDecimal.ZERO)
                                                .ledgerEntries(List.of())
                                                .build())

                                // 9. Journal Entry
                                .journalEntry(inv.getGlJournalEntryId() != null ? PiJournalEntryDto.builder()
                                                .journalEntryId(inv.getGlJournalEntryId())
                                                .reverseJournalEntryId(inv.getReverseGlJournalEntryId())
                                                .voucherNumber(inv.getInvoiceNo())
                                                .postingDate(inv.getGlPostingTime() != null
                                                                ? inv.getGlPostingTime().toLocalDate()
                                                                : inv.getInvoiceDate())
                                                .postingStatus(inv.getGlPostingStatus() != null
                                                                ? inv.getGlPostingStatus().name()
                                                                : null)
                                                .ledgerEntries(List.of())
                                                .debitEntries(List.of())
                                                .creditEntries(List.of())
                                                .build() : null)

                                // 10. Ledger Impact
                                .ledgerImpact(PiLedgerImpactDto.builder()
                                                .accountsPayableLedger(apLedger)
                                                .purchaseLedger("Purchase Account")
                                                .expenseLedger("Expense Account")
                                                .inputCgstLedger(cgstLedger)
                                                .inputSgstLedger(sgstLedger)
                                                .inputIgstLedger(igstLedger)
                                                .inputCessLedger(cessLedger)
                                                .tdsLedger("TDS Payable")
                                                .build())

                                // 11. Related Documents
                                .relatedDocuments(PiRelatedDocumentsDto.builder()
                                                .purchaseOrder(null)
                                                .goodsReceiptNote(null)
                                                .debitNotes(List.of())
                                                .creditNotes(List.of())
                                                .vendorPayments(List.of())
                                                .build())

                                // 12. Approval Workflow
                                .approvalWorkflow(PiApprovalWorkflowDto.builder()
                                                .approvalStatus(inv.getApprovedBy() != null ? "APPROVED"
                                                                : (inv.getStatus() != null ? inv.getStatus().name()
                                                                                : "DRAFT"))
                                                .approvedBy(inv.getApprovedBy())
                                                .approvedDate(inv.getApprovedAt())
                                                .approvalNotes(null)
                                                .workflowHistory(List.of())
                                                .build())

                                // 13. Attachments
                                .attachments(PiAttachmentsDto.builder()
                                                .invoicePdf(null)
                                                .vendorInvoiceCopy(null)
                                                .supportingDocuments(List.of())
                                                .build())

                                // 14. Audit Information
                                .auditInformation(PiAuditInfoDto.builder()
                                                .createdBy(inv.getCreatedBy())
                                                .createdAt(inv.getCreatedAt())
                                                .updatedBy(inv.getUpdatedBy())
                                                .updatedAt(inv.getUpdatedAt())
                                                .editable(inv.getStatus() == InvoiceStatus.DRAFT)
                                                .deletable(inv.getStatus() == InvoiceStatus.DRAFT)
                                                .postable(inv.getStatus() == InvoiceStatus.APPROVED)
                                                .payable(outstanding.compareTo(BigDecimal.ZERO) > 0)
                                                .build())

                                // 15. Statistics
                                .statistics(PiStatisticsDto.builder()
                                                .itemCount(items.size())
                                                .paymentCount(0)
                                                .debitNoteCount(0)
                                                .creditNoteCount(0)
                                                .daysOutstanding(daysOutstanding)
                                                .daysOverdue(daysOverdue)
                                                .build())

                                // 16. Related Transactions
                                .relatedTransactions(PiRelatedTransactionsDto.builder()
                                                .vendorPayments(List.of())
                                                .journalEntries(inv.getGlJournalEntryId() != null
                                                                ? List.of(PiJournalEntryDto.builder()
                                                                                .journalEntryId(inv
                                                                                                .getGlJournalEntryId())
                                                                                .voucherNumber(inv.getInvoiceNo())
                                                                                .postingDate(inv.getGlPostingTime() != null
                                                                                                ? inv.getGlPostingTime()
                                                                                                                .toLocalDate()
                                                                                                : inv.getInvoiceDate())
                                                                                .postingStatus(
                                                                                                inv.getGlPostingStatus() != null
                                                                                                                ? inv.getGlPostingStatus()
                                                                                                                                .name()
                                                                                                                : null)
                                                                                .build())
                                                                : List.of())
                                                .inventoryTransactions(List.of())
                                                .vendorLedgerEntries(List.of())
                                                .purchaseReturns(List.of())
                                                .debitNotes(List.of())
                                                .creditNotes(List.of())
                                                .build())
                                .build();
        }

        // ============================================================
        // STATUS UPDATES
        // ============================================================

        @Override
        @Deprecated(since = "2.0", forRemoval = true)
        public ApInvoiceResponse updateInvoiceStatus(UUID invoiceId, InvoiceStatus targetStatus) {
                log.info("Deprecated API called. Updating AP invoice status: {} to {}", invoiceId, targetStatus);
                switch (targetStatus) {
                        case PENDING_APPROVAL:
                                return submitForApproval(invoiceId);
                        case APPROVED:
                                return approveInvoice(invoiceId);
                        case REJECTED:
                                return rejectInvoice(invoiceId);
                        case CANCELLED:
                                return cancelInvoice(invoiceId);
                        case PAID:
                                ApInvoice invoice = getApInvoiceEntity(invoiceId);
                                if (invoice.getStatus() == InvoiceStatus.CANCELLED
                                                || invoice.getStatus() == InvoiceStatus.REJECTED) {
                                        throw new InvoicePaymentException(invoice.getInvoiceNo(),
                                                        "Cannot pay invoice with status: " + invoice.getStatus());
                                }
                                throw new InvoicePaymentException(invoice.getInvoiceNo(),
                                                "Payments must be allocated through the AP Payment module");
                        default:
                                throw new BadRequestException(
                                                "Direct transition to " + targetStatus + " is not supported.",
                                                "UNSUPPORTED_TRANSITION");
                }
        }

        @Override
        @Deprecated(since = "2.0", forRemoval = true)
        @Transactional(noRollbackFor = BadRequestException.class)
        public ApInvoiceResponse updatePostingStatus(UUID invoiceId, com.erp.account.enums.PostingStatus targetStatus) {
                log.info("Deprecated API called. Updating AP invoice posting status: {} to {}", invoiceId,
                                targetStatus);
                if (targetStatus == com.erp.account.enums.PostingStatus.POSTED) {
                        return postInvoice(invoiceId);
                } else if (targetStatus == com.erp.account.enums.PostingStatus.REVERSED) {
                        return reverseInvoice(invoiceId);
                } else {
                        throw new BadRequestException("Direct transition to " + targetStatus + " is not supported.",
                                        "UNSUPPORTED_TRANSITION");
                }
        }

        @Override
        public ApInvoiceResponse submitForApproval(UUID invoiceId) {
                return submitForApproval(invoiceId, null);
        }

        @Override
        public ApInvoiceResponse submitForApproval(UUID invoiceId, String comments) {
                log.info("Submitting AP invoice for approval: {}", invoiceId);
                ApInvoice invoice = getApInvoiceEntity(invoiceId);
                UUID companyId = invoice.getCompany() != null ? invoice.getCompany().getId() : TenantUtils.getCurrentCompanyId();

                // Prevent duplicate workflow submission
                try {
                        WorkflowTransactionDto existingTx = workflowClient.getWorkflowByDocument(companyId, "AP_INVOICE", invoice.getId());
                        if (existingTx != null && ("PENDING".equalsIgnoreCase(existingTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existingTx.getStatus()))) {
                                throw new BadRequestException("AP Invoice is already submitted for approval with transaction: " + existingTx.getId());
                        }
                } catch (BadRequestException e) {
                        throw e;
                } catch (Exception e) {
                        log.debug("No existing workflow transaction found for AP invoice {}", invoiceId);
                }

                try {
                        workflowClient.submitWorkflow(
                                        companyId,
                                        "AP_INVOICE",
                                        invoice.getId(),
                                        invoice.getInvoiceNo(),
                                        comments != null ? comments : "Submitted AP invoice for approval"
                        );
                        log.info("AP invoice {} submitted for approval to workflow-service", invoice.getInvoiceNo());
                } catch (BadRequestException e) {
                        throw e;
                } catch (Exception e) {
                        log.error("Workflow engine submission failed for AP invoice {}. Error: {}", invoiceId, e.getMessage());
                        throw new BadRequestException("Failed to submit AP invoice for workflow approval: " + e.getMessage());
                }

                invoiceWorkflowService.submitForApproval(invoice);

                return enrichInvoiceResponse(apInvoiceMapper.entityToResponse(apInvoiceRepository.save(invoice)));
        }


        @Override
        public ApInvoiceResponse approveInvoice(UUID invoiceId) {
                log.info("Approving AP invoice: {}", invoiceId);
                ApInvoice invoice = getApInvoiceEntity(invoiceId);
                UUID companyId = invoice.getCompany() != null ? invoice.getCompany().getId() : TenantUtils.getCurrentCompanyId();

                if (invoice.getCreatedBy() != null && invoice.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
                        throw new SecurityException("Creator cannot approve their own document.");
                }

                // Prevent bypassing active pending workflow
                try {
                        WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(companyId, "AP_INVOICE", invoiceId);
                        if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                                throw new BadRequestException("AP Invoice cannot be approved directly while workflow approval is pending. Please approve via the workflow.");
                        }
                } catch (BadRequestException e) {
                        throw e;
                } catch (Exception e) {
                        log.debug("Workflow check skipped for AP invoice {}: {}", invoiceId, e.getMessage());
                }

                // 3-Way match validation before approval
                if (invoice.getPurchaseOrderId() != null || invoice.getGoodsReceiptId() != null) {
                        com.erp.account.modules.purchaseorder.entity.PurchaseOrder po = invoice
                                        .getPurchaseOrderId() != null
                                                        ? purchaseOrderRepository
                                                                        .findByIdAndIsDeletedFalse(
                                                                                        invoice.getPurchaseOrderId())
                                                                        .orElse(null)
                                                        : null;
                        com.erp.account.modules.goodsreceipt.entity.GoodsReceipt grn = invoice
                                        .getGoodsReceiptId() != null
                                                        ? goodsReceiptRepository
                                                                        .findByIdAndIsDeletedFalse(
                                                                                        invoice.getGoodsReceiptId())
                                                                        .orElse(null)
                                                        : null;
                        threeWayMatchingService.validateThreeWayMatchOnApproval(invoice, po, grn);
                }

                invoiceWorkflowService.approve(invoice);

                // Physical inventory receipt is owned strictly by GRN for PO-based procurement.
                // An invoice MUST NOT trigger stock-in if it is backed by a GRN or PO.
                // Only legitimate standalone invoices (no PO and no GRN) trigger direct
                // stock-in.
                if (shouldInvoiceCreateStockIn(invoice)) {
                        inventoryIntegrationService.scheduleStockIn(invoice);
                }

                return enrichInvoiceResponse(apInvoiceMapper.entityToResponse(apInvoiceRepository.save(invoice)));
        }

        /**
         * Determines whether an AP Invoice should trigger physical inventory stock-in.
         *
         * Procurement Stock Ownership Rules:
         * 1. GRN-backed invoice (goodsReceiptId != null):
         * GRN owns the physical receipt event (GRN_STOCK_IN). The invoice is financial
         * only;
         * it must NEVER trigger stock-in.
         * 2. PO-backed invoice without GRN (purchaseOrderId != null && goodsReceiptId
         * == null):
         * A Purchase Order is an authorization/commercial agreement, not physical goods
         * delivery.
         * Physical receipt is strictly owned by the GRN when goods arrive and are
         * confirmed.
         * The invoice MUST NOT perform early or duplicate stock-in.
         * 3. Standalone invoice (purchaseOrderId == null && goodsReceiptId == null):
         * Preserves existing legacy standalone direct purchase behavior where direct
         * vendor bills
         * without PO/GRN documents trigger immediate stock-in upon approval.
         */
        public boolean shouldInvoiceCreateStockIn(ApInvoice invoice) {
                if (invoice.getPurchaseNature() == PurchaseNature.EXPENSE) {
                        log.info("Invoice {} is an expense purchase. Skipping inventory stock-in.",
                                        invoice.getInvoiceNo());
                        return false;
                }
                if (invoice.getGoodsReceiptId() != null) {
                        log.info("Invoice {} is linked to GRN {}. Physical stock-in is owned by GRN; skipping invoice stock-in.",
                                        invoice.getInvoiceNo(), invoice.getGoodsReceiptId());
                        return false;
                }
                if (invoice.getPurchaseOrderId() != null) {
                        log.info("Invoice {} is linked to PO {}. Physical stock-in is owned by GRN workflow; skipping invoice stock-in.",
                                        invoice.getInvoiceNo(), invoice.getPurchaseOrderId());
                        return false;
                }
                log.info("Invoice {} is a standalone invoice without PO/GRN. Scheduling direct invoice stock-in.",
                                invoice.getInvoiceNo());
                return true;
        }

        @Override
        public ApInvoiceResponse rejectInvoice(UUID invoiceId) {
                log.info("Rejecting AP invoice: {}", invoiceId);
                ApInvoice invoice = getApInvoiceEntity(invoiceId);
                UUID companyId = invoice.getCompany() != null ? invoice.getCompany().getId() : TenantUtils.getCurrentCompanyId();

                // Prevent bypassing active pending workflow
                try {
                        WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(companyId, "AP_INVOICE", invoiceId);
                        if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                                throw new BadRequestException("AP Invoice cannot be rejected directly while workflow approval is pending. Please reject via the workflow.");
                        }
                } catch (BadRequestException e) {
                        throw e;
                } catch (Exception e) {
                        log.debug("Workflow check skipped for AP invoice {}: {}", invoiceId, e.getMessage());
                }

                invoiceWorkflowService.reject(invoice);
                return enrichInvoiceResponse(apInvoiceMapper.entityToResponse(apInvoiceRepository.save(invoice)));
        }


        @Override
        public ApInvoiceResponse cancelInvoice(UUID invoiceId) {
                log.info("Cancelling AP invoice: {}", invoiceId);
                ApInvoice invoice = getApInvoiceEntity(invoiceId);
                invoiceWorkflowService.cancel(invoice);

                // Cancel pending inventory task if standalone invoice scheduled stock-in
                if (shouldInvoiceCreateStockIn(invoice)) {
                        inventoryIntegrationService.cancelPendingStockIn(invoice.getId());
                }

                return enrichInvoiceResponse(apInvoiceMapper.entityToResponse(apInvoiceRepository.save(invoice)));
        }

        @Override
        @Transactional(noRollbackFor = BadRequestException.class)
        public ApInvoiceResponse postInvoice(UUID invoiceId) {
                log.info("Posting AP invoice to GL: {}", invoiceId);
                ApInvoice invoice = getApInvoiceEntity(invoiceId);

                if (invoice.getGlPostingStatus() == com.erp.account.enums.PostingStatus.POSTED) {
                        throw new InvoiceAlreadyPostedException(invoice.getInvoiceNo());
                }

                if (invoice.getStatus() != InvoiceStatus.APPROVED) {
                        throw new InvalidInvoiceStatusException(
                                        "Invoice must be APPROVED to post. Current status: " + invoice.getStatus(),
                                        "INVALID_POST_STATUS");
                }

                if (invoice.getCreatedBy() != null && invoice.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
                        throw new SecurityException("Creator cannot post their own document.");
                }

                try {
                        accountingValidationService.validatePostingDate(invoice.getInvoiceDate(),
                                        invoice.getCompany().getId());
                        GlJournalEntry journal = glPostingService.createGlPosting(invoice);
                        invoice.setGlJournalEntryId(journal.getId());
                        invoiceWorkflowService.markPosted(invoice);
                } catch (RuntimeException ex) {
                        invoiceWorkflowService.markPostingFailed(invoice);
                        apInvoiceRepository.save(invoice);
                        log.error("AP invoice GL posting failed for invoice {}", invoice.getInvoiceNo(), ex);
                        throw new BadRequestException("AP invoice GL posting failed: " + ex.getMessage(), ex);
                }

                return enrichInvoiceResponse(apInvoiceMapper.entityToResponse(apInvoiceRepository.save(invoice)));
        }

        @Override
        @Transactional(noRollbackFor = BadRequestException.class)
        public ApInvoiceResponse reverseInvoice(UUID invoiceId) {
                log.info("Reversing AP invoice GL posting: {}", invoiceId);
                ApInvoice invoice = getApInvoiceEntity(invoiceId);

                invoiceWorkflowService.reverse(invoice);

                try {
                        GlJournalEntry reverseJournal = glPostingService.createReversePosting(invoice);
                        invoice.setReverseGlJournalEntryId(reverseJournal.getId());
                } catch (RuntimeException ex) {
                        log.error("AP invoice GL reversal failed for invoice {}", invoice.getInvoiceNo(), ex);
                        throw new BadRequestException("AP invoice GL reversal failed: " + ex.getMessage(), ex);
                }

                return enrichInvoiceResponse(apInvoiceMapper.entityToResponse(apInvoiceRepository.save(invoice)));
        }

        @Override
        public ApInvoiceResponse voidInvoice(UUID invoiceId) {
                log.info("Voiding AP invoice: {}", invoiceId);
                ApInvoice invoice = getApInvoiceEntity(invoiceId);
                invoiceWorkflowService.voidInvoice(invoice);
                return enrichInvoiceResponse(apInvoiceMapper.entityToResponse(apInvoiceRepository.save(invoice)));
        }

        @Override
        public ApInvoiceResponse writeOffInvoice(UUID invoiceId) {
                log.info("Writing off AP invoice: {}", invoiceId);
                ApInvoice invoice = getApInvoiceEntity(invoiceId);
                invoiceWorkflowService.writeOff(invoice);
                return enrichInvoiceResponse(apInvoiceMapper.entityToResponse(apInvoiceRepository.save(invoice)));
        }

        @Override
        public ApInvoiceResponse markAsPartiallyPaid(UUID invoiceId, BigDecimal paidAmount) {
                log.info("Marking AP invoice as partially paid: {} with amount: {}", invoiceId, paidAmount);

                ApInvoice invoice = getApInvoiceEntity(invoiceId);

                throw new InvoicePaymentException(invoice.getInvoiceNo(),
                                "Partial payments must be allocated through the AP Payment module");
        }

        // ============================================================
        // INVOICE SEARCH & RETRIEVAL
        // ============================================================

        @Override
        @Transactional(readOnly = true)
        public Page<ApInvoiceResponse> getAllInvoices(UUID companyId, ApInvoiceFilterDto filter, Pageable pageable) {

                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

                Specification<ApInvoice> spec = ApInvoiceSpecification.getFilterSpecification(filter,
                                resolvedCompanyId);
                return apInvoiceRepository.findAll(spec, pageable)
                                .map(invoice -> enrichInvoiceResponse(apInvoiceMapper.entityToResponse(invoice)));
        }

        @Override
        @Transactional(readOnly = true)
        public Page<ApInvoiceResponse> getInvoicesByStatus(UUID companyId, InvoiceStatus status, Pageable pageable) {
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                return getAllInvoices(resolvedCompanyId, ApInvoiceFilterDto.builder().statuses(List.of(status)).build(),
                                pageable);
        }

        @Override
        @Transactional(readOnly = true)
        public Page<ApInvoiceResponse> getInvoicesByDateRange(UUID companyId, LocalDate startDate, LocalDate endDate,
                        Pageable pageable) {
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                return getAllInvoices(resolvedCompanyId,
                                ApInvoiceFilterDto.builder().invoiceDateFrom(startDate).invoiceDateTo(endDate).build(),
                                pageable);
        }

        @Override
        @Transactional(readOnly = true)
        public Page<ApInvoiceResponse> getInvoicesByAmountRange(UUID companyId, BigDecimal minAmount,
                        BigDecimal maxAmount, Pageable pageable) {
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                return getAllInvoices(resolvedCompanyId,
                                ApInvoiceFilterDto.builder().minTotalAmount(minAmount).maxTotalAmount(maxAmount)
                                                .build(),
                                pageable);
        }

        // ============================================================
        // PAYMENT TRACKING
        // ============================================================

        @Override
        @Transactional(readOnly = true)
        public Page<ApInvoiceResponse> getPendingApprovalInvoices(UUID companyId, Pageable pageable) {
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                return getAllInvoices(resolvedCompanyId,
                                ApInvoiceFilterDto.builder().statuses(List.of(InvoiceStatus.PENDING_APPROVAL)).build(),
                                pageable);
        }

        // ============================================================
        // OVERDUE ANALYSIS
        // ============================================================

        @Override
        @Transactional(readOnly = true)
        public int getDaysOverdue(UUID invoiceId) {
                ApInvoice invoice = getApInvoiceEntity(invoiceId);

                return AgingReportHelper.calculateDaysOverdue(invoice.getDueDate(), LocalDate.now());
        }

        // ============================================================
        // AGING ANALYSIS
        // ============================================================

        @Override
        @Transactional(readOnly = true)
        public Map<String, AgingReportHelper.AgingBucketSummary> getInvoiceAgingReport(UUID companyId) {
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                List<ApInvoice> invoices = apInvoiceRepository.findOutstandingInvoices(resolvedCompanyId,
                                PageRequest.of(0, Integer.MAX_VALUE)).getContent();

                List<ApInvoiceResponse> responses = invoices.stream()
                                .map(apInvoiceMapper::entityToResponse)
                                .map(this::enrichInvoiceResponse)
                                .collect(Collectors.toList());

                return AgingReportHelper.generateAgingSummary(responses, LocalDate.now());
        }

        @Override
        @Transactional(readOnly = true)
        public Page<ApInvoiceResponse> getInvoicesByAgingBucket(UUID companyId, int minDays, int maxDays,
                        Pageable pageable) {
                LocalDate endDate = LocalDate.now().minusDays(minDays);
                LocalDate startDate = LocalDate.now().minusDays(maxDays);

                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                return apInvoiceRepository.getInvoicesByAgingBucket(resolvedCompanyId, startDate, endDate, pageable)
                                .map(invoice -> enrichInvoiceResponse(apInvoiceMapper.entityToResponse(invoice)));
        }

        // ============================================================
        // VENDOR TRANSACTION HISTORY
        // ============================================================

        @Override
        @Transactional(readOnly = true)
        public Page<ApInvoiceResponse> getVendorTransactionHistory(UUID companyId, UUID vendorId,
                        LocalDate startDate, LocalDate endDate, Pageable pageable) {
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                return getAllInvoices(resolvedCompanyId, ApInvoiceFilterDto.builder().vendorId(vendorId)
                                .invoiceDateFrom(startDate).invoiceDateTo(endDate).build(), pageable);
        }

        @Override
        @Transactional(readOnly = true)
        public BigDecimal getVendorInvoicedAmount(UUID vendorId, LocalDate startDate, LocalDate endDate) {
                UUID companyId = TenantUtils.getCurrentCompanyId();
                if (companyId == null) {
                        companyId = vendorRepository.findByIdAndNotDeleted(vendorId)
                                        .map(vendor -> vendor.getCompany() != null ? vendor.getCompany().getId() : null)
                                        .orElse(null);
                }
                if (companyId == null) {
                        return BigDecimal.ZERO;
                }

                List<ApInvoice> invoices = apInvoiceRepository.findVendorInvoicesByDateRange(companyId, vendorId,
                                startDate,
                                endDate);

                return invoices.stream()
                                .filter(invoice -> !Boolean.TRUE.equals(invoice.getIsDeleted()))
                                .map(ApInvoice::getTotalAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // ============================================================
        // FINANCIAL REPORTING
        // ============================================================

        @Override
        @Transactional(readOnly = true)
        public BigDecimal getTotalOutstandingAmount(UUID companyId) {
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                return apInvoiceRepository.getTotalOutstandingAmount(resolvedCompanyId);
        }

        @Override
        @Transactional(readOnly = true)
        public BigDecimal getTotalPostedAmount(UUID companyId) {
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                return apInvoiceRepository.getTotalPostedAmount(resolvedCompanyId);
        }

        @Override
        @Transactional(readOnly = true)
        public BigDecimal getTotalPaidAmount(UUID companyId) {
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                return apInvoiceRepository.getTotalPaidAmount(resolvedCompanyId);
        }

        // ============================================================
        // VALIDATION HELPERS
        // ============================================================

        @Override
        public void validateInvoice(ApInvoiceRequest request, UUID companyId) {

                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

                log.debug("Validating AP invoice request for company: {}", resolvedCompanyId);

                // Date validations
                InvoiceValidationUtil.validateInvoiceDate(request.getInvoiceDate());
                InvoiceValidationUtil.validateDueDateAfterInvoiceDate(request.getInvoiceDate(), request.getDueDate());

                // Invoice number validation
                InvoiceValidationUtil.validateInvoiceNumberFormat(request.getInvoiceNo());

                // Amount validations
                InvoiceValidationUtil.validateSubtotal(request.getSubtotal());
                InvoiceValidationUtil.validateTaxAmount(request.getTaxAmount());
                InvoiceValidationUtil.validateTdsAmount(request.getTdsAmount());
                InvoiceValidationUtil.validateTotalAmount(request.getSubtotal(), request.getTaxAmount(),
                                request.getTdsAmount(), request.getFreightCharges(), request.getTotalAmount());
                InvoiceValidationUtil.validatePaidAmount(request.getPaidAmount(), request.getTotalAmount());

                // Currency validations
                InvoiceValidationUtil.validateCurrencyCode(request.getInvoiceCurrency());
                Company company = companyRepository.findById(resolvedCompanyId)
                                .orElseThrow(() -> new BadRequestException("Company not found", "COMPANY_NOT_FOUND"));
                InvoiceValidationUtil.validateExchangeRateForMultiCurrency(request.getInvoiceCurrency(),
                                company.getBaseCurrency(), request.getExchangeRate());

                // Line items validation
                InvoiceValidationUtil.validateLineItems(request.getItems() != null ? request.getItems().size() : 0);

                log.debug("AP invoice request validation passed");
        }

        @Override
        public void validateDuplicateInvoiceNumber(String invoiceNo, UUID companyId) {
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                Optional<ApInvoice> existing = apInvoiceRepository.findByInvoiceNoAndCompanyIdAndIsDeletedFalse(
                                invoiceNo,
                                resolvedCompanyId);
                if (existing.isPresent()) {
                        throw new DuplicateInvoiceException(invoiceNo, resolvedCompanyId.toString());
                }
        }

        public void validateDuplicateInvoiceNumber(String invoiceNo, UUID vendorId, UUID companyId) {
                validateDuplicateInvoiceNumber(invoiceNo, companyId);
        }

        @Override
        public void validateVendor(UUID vendorId, UUID companyId) {
                validateAndGetVendor(vendorId, companyId);
        }

        // ============================================================
        // HELPER METHODS
        // ============================================================

        /**
         * Validate and get vendor
         */
        private Vendor validateAndGetVendor(UUID vendorId, UUID companyId) {
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
                Vendor vendor = vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, resolvedCompanyId)
                                .orElseThrow(() -> new InvalidVendorException(vendorId.toString()));

                if (!vendor.getCompany().getId().equals(resolvedCompanyId)) {
                        throw new InvalidVendorException("Vendor does not belong to the specified company");
                }

                if (!vendor.getIsActive()) {
                        throw new InvalidVendorException("Vendor is inactive");
                }

                return vendor;
        }

        /**
         * Get current user ID
         */
        private UUID getCurrentUserId() {
                return TenantUtils.getCurrentUserId();
        }

        private ApInvoice getApInvoiceEntity(UUID invoiceId) {
                if (TenantUtils.isSystemAdmin()) {
                        return apInvoiceRepository.findByIdAndIsDeletedFalse(invoiceId)
                                        .orElseThrow(() -> new ApInvoiceNotFoundException(invoiceId.toString()));
                } else {
                        UUID companyId = TenantUtils.getCurrentCompanyId();
                        return apInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId)
                                        .orElseThrow(() -> new ApInvoiceNotFoundException(invoiceId.toString()));
                }
        }

        /**
         * Enrich invoice response with calculated fields
         */
        private void softDeleteInvoiceItems(UUID invoiceId, UUID companyId) {
                apInvoiceItemRepository.softDeleteByInvoiceId(invoiceId, companyId, CurrentUserContext.getUserId(),
                                CurrentUserContext.getUsername());
        }

        private ApInvoiceResponse enrichInvoiceResponse(ApInvoiceResponse response) {
                if (response != null) {
                        // Calculate days overdue
                        int daysOverdue = AgingReportHelper.calculateDaysOverdue(response.getDueDate(),
                                        LocalDate.now());
                        response.setDaysOverdue(daysOverdue);

                        // Calculate payment percentage
                        if (response.getTotalAmount() != null
                                        && response.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
                                BigDecimal paymentPct = InvoiceCalculationHelper.calculatePaymentPercentage(
                                                response.getPaidAmount(), response.getTotalAmount());
                                response.setPaymentPercentage(paymentPct);
                        }

                        // Set item count
                        if (response.getItems() != null) {
                                response.setItemCount(response.getItems().size());
                        }

                        // Set action permissions
                        setActionPermissions(response);

                        // Calculate multi-currency equivalent
                        if (response.getExchangeRate() != null && response.getInvoiceCurrency() != null) {
                                response.setBaseCurrencyTotal(InvoiceCalculationHelper.convertToBaseCurrency(
                                                response.getTotalAmount(), response.getExchangeRate()));
                        }
                }

                return response;
        }

        /**
         * Set action permission flags
         */
        private void setActionPermissions(ApInvoiceResponse response) {
                InvoiceStatus status = response.getStatus();

                response.setEditable(status == InvoiceStatus.DRAFT || status == InvoiceStatus.PENDING_APPROVAL);
                response.setDeletable(status == InvoiceStatus.DRAFT);
                response.setApprovable(status == InvoiceStatus.PENDING_APPROVAL);
                response.setPostable(status == InvoiceStatus.APPROVED);
                response.setPayable(status == InvoiceStatus.POSTED || status == InvoiceStatus.PARTIALLY_PAID);
        }

        @Override
        public ApInvoiceResponse createInvoiceFromGrn(UUID companyId, UUID grnId) {
                log.info("Creating draft AP Invoice from GRN: {}", grnId);
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

                com.erp.account.modules.goodsreceipt.entity.GoodsReceipt grn = goodsReceiptRepository
                                .findByIdAndIsDeletedFalse(grnId)
                                .orElseThrow(() -> new BadRequestException("Goods Receipt not found for ID: " + grnId,
                                                "GRN_NOT_FOUND"));

                UUID grnCompanyId = grn.getCompany() != null ? grn.getCompany().getId() : grn.getCompanyId();
                if (resolvedCompanyId != null && grnCompanyId != null && !resolvedCompanyId.equals(grnCompanyId)) {
                        throw new BadRequestException("Goods Receipt does not belong to current company",
                                        "CROSS_COMPANY_ACCESS");
                }

                if (grn.getStatus() != com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus.CONFIRMED
                                && grn.getStatus() != com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus.POSTED) {
                        throw new BadRequestException(
                                        "Only CONFIRMED or POSTED Goods Receipts can be converted to an invoice. Current status: "
                                                        + grn.getStatus(),
                                        "GRN_NOT_CONFIRMED");
                }

                com.erp.account.modules.purchaseorder.entity.PurchaseOrder po = purchaseOrderRepository
                                .findByIdAndIsDeletedFalse(grn.getPurchaseOrderId())
                                .orElseThrow(() -> new BadRequestException(
                                                "Purchase Order not found for GRN: " + grn.getPurchaseOrderId(),
                                                "PO_NOT_FOUND"));

                Vendor vendor = grn.getVendor() != null ? grn.getVendor() : po.getVendor();
                if (vendor == null) {
                        throw new BadRequestException("Vendor not found for Goods Receipt", "VENDOR_NOT_FOUND");
                }

                List<com.erp.account.modules.apinvoice.dto.request.ApInvoiceItemRequest> itemRequests = new java.util.ArrayList<>();
                if (grn.getItems() != null) {
                        for (var grnItem : grn.getItems()) {
                                if (Boolean.TRUE.equals(grnItem.getIsDeleted()))
                                        continue;
                                BigDecimal acceptedQty = grnItem.getAcceptedQuantity() != null
                                                ? grnItem.getAcceptedQuantity()
                                                : BigDecimal.ZERO;
                                if (acceptedQty.compareTo(BigDecimal.ZERO) <= 0)
                                        continue;

                                com.erp.account.modules.purchaseorder.entity.PurchaseOrderItem matchingPoItem = null;
                                if (po.getItems() != null) {
                                        matchingPoItem = po.getItems().stream()
                                                        .filter(pi -> !Boolean.TRUE.equals(pi.getIsDeleted()))
                                                        .filter(pi -> (grnItem.getPurchaseOrderItemId() != null
                                                                        && grnItem.getPurchaseOrderItemId()
                                                                                        .equals(pi.getId()))
                                                                        || (grnItem.getItemId() != null && grnItem
                                                                                        .getItemId()
                                                                                        .equals(pi.getItemId())))
                                                        .findFirst()
                                                        .orElse(null);
                                }

                                BigDecimal unitPrice = matchingPoItem != null && matchingPoItem.getUnitPrice() != null
                                                ? matchingPoItem.getUnitPrice()
                                                : BigDecimal.ZERO;
                                BigDecimal discountPercent = matchingPoItem != null
                                                && matchingPoItem.getDiscountPercent() != null
                                                                ? matchingPoItem.getDiscountPercent()
                                                                : BigDecimal.ZERO;
                                UUID hsnSacId = matchingPoItem != null && matchingPoItem.getHsnSacMaster() != null
                                                ? matchingPoItem.getHsnSacMaster().getId()
                                                : null;
                                BigDecimal lineTaxable = unitPrice.multiply(acceptedQty);
                                String itemDesc = grnItem.getDescription() != null
                                                && !grnItem.getDescription().isBlank() ? grnItem.getDescription()
                                                                : grnItem.getItemName();

                                com.erp.account.modules.apinvoice.dto.request.ApInvoiceItemRequest itemRequest = com.erp.account.modules.apinvoice.dto.request.ApInvoiceItemRequest
                                                .builder()
                                                .itemId(grnItem.getItemId())
                                                .description(itemDesc)
                                                .unit(grnItem.getUnit() != null ? grnItem.getUnit() : "PCS")
                                                .quantity(acceptedQty)
                                                .unitPrice(unitPrice)
                                                .taxableAmount(lineTaxable)
                                                .taxAmount(BigDecimal.ZERO)
                                                .totalAmount(lineTaxable)
                                                .hsnSacId(hsnSacId)
                                                .warehouseId(grnItem.getWarehouseId() != null ? grnItem.getWarehouseId()
                                                                : grn.getWarehouseId())
                                                .locationId(grnItem.getLocationId())
                                                .itemType(grnItem.getItemType() != null ? grnItem.getItemType()
                                                                : com.erp.account.enums.ItemType.PRODUCT)
                                                .build();

                                itemRequests.add(itemRequest);
                        }
                }

                if (itemRequests.isEmpty()) {
                        throw new BadRequestException("Goods Receipt has no accepted items to invoice",
                                        "NO_ACCEPTED_ITEMS");
                }

                String invoiceNo = "INV-GRN-" + grn.getGrnNumber();
                if (apInvoiceRepository.findByInvoiceNoAndCompanyIdAndIsDeletedFalse(invoiceNo, resolvedCompanyId)
                                .isPresent()) {
                        invoiceNo = invoiceNo + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                }

                ApInvoiceRequest invoiceRequest = ApInvoiceRequest.builder()
                                .vendorId(vendor.getId())
                                .purchaseOrderId(po.getId())
                                .goodsReceiptId(grn.getId())
                                .invoiceNo(invoiceNo)
                                .invoiceDate(LocalDate.now())
                                .dueDate(LocalDate.now().plusDays(30))
                                .placeOfSupplyStateId(po.getPlaceOfSupplyStateId())
                                .vendorAddressId(po.getVendorAddressId())
                                .invoiceCurrency(po.getCurrency() != null ? po.getCurrency() : "INR")
                                .exchangeRate(po.getExchangeRate() != null ? po.getExchangeRate() : BigDecimal.ONE)
                                .notes("Created from Goods Receipt: " + grn.getGrnNumber() + " (PO: " + po.getPoNumber()
                                                + ")")
                                .items(itemRequests)
                                .build();

                RequestWrapper<ApInvoiceRequest> wrapper = new RequestWrapper<>();
                wrapper.setData(invoiceRequest);
                return createInvoice(resolvedCompanyId, wrapper);
        }
}
