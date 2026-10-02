package com.erp.account.modules.proformainvoice.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.repository.CustomerRepository;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
import com.erp.account.modules.proformainvoice.dto.request.PIConversionRequest;
import com.erp.account.modules.proformainvoice.dto.request.PIUpdateRequest;
import com.erp.account.modules.proformainvoice.dto.request.ProformaInvoiceDirectCreateRequest;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherRequest;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherAllocationRequest;
import com.erp.account.modules.receiptvoucher.service.ReceiptVoucherService;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.proformainvoice.dto.response.ProformaInvoiceResponse;
import com.erp.account.modules.proformainvoice.dto.response.profile.ProformaInvoiceProfileResponse;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceItem;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
import com.erp.account.modules.common.repository.ReceiptAllocationRepository;
import com.erp.account.modules.common.entity.ReceiptAllocation;
import com.erp.account.modules.common.enums.SalesDocumentType;
import com.erp.account.modules.proformainvoice.dto.response.profile.PiPaymentSummaryDto;
import com.erp.account.modules.proformainvoice.dto.response.profile.PiReceiptDto;
import com.erp.account.enums.ReceiptVoucherStatus;
import com.erp.account.modules.proformainvoice.mapper.ProformaInvoiceMapper;
import com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
import com.erp.account.modules.proformainvoice.service.ProformaInvoiceService;
import com.erp.account.modules.quotation.dto.response.QuotationSummaryDTO;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationItem;
import com.erp.account.modules.quotation.entity.QuotationStatus;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import com.erp.account.util.CustomerAddressUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProformaInvoiceServiceImpl implements ProformaInvoiceService {

    private final ProformaInvoiceRepository proformaInvoiceRepository;
    private final QuotationRepository quotationRepository;
    private final CompanyRepository companyRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final ProformaInvoiceMapper proformaInvoiceMapper;
    private final com.erp.account.modules.settings.repository.PaymentTermRepository paymentTermRepository;
    private final com.erp.account.modules.settings.repository.TermsConditionRepository termsConditionRepository;
    private final HsnSacMasterRepository hsnSacMasterRepository;
    private final CustomerRepository customerRepository;
    private final ReceiptAllocationRepository receiptAllocationRepository;
    private final ReceiptVoucherService receiptVoucherService;
    private final com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository receiptVoucherRepository;
    private final com.erp.account.modules.proformainvoice.validator.ProformaInvoiceLifecycleValidator lifecycleValidator;

    @Override
    @Transactional
    public ProformaInvoiceResponse createFromQuotation(UUID companyId, UUID quotationId, PIConversionRequest request) {
        log.info("[PI-CREATE] STEP 1 - SERVICE ENTERED: quotationId={}, companyId={}, piDate={}, piValidTill={}",
                quotationId, companyId,
                request != null ? request.getPiDate() : "NULL",
                request != null ? request.getPiValidTill() : "NULL");

        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("[PI-CREATE] STEP 2 - COMPANY RESOLVED: resolvedCompanyId={}", resolvedCompanyId);

        Quotation quotation = quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Quotation not found"));
        log.info("[PI-CREATE] STEP 3 - QUOTATION LOADED: quotationNumber={}, status={}, customerId={}",
                quotation.getQuotationNumber(), quotation.getStatus(), quotation.getCustomerId());

        if (quotation.getStatus() != QuotationStatus.ACCEPTED) {
            throw new BadRequestException("Only ACCEPTED quotations can be converted into a Proforma Invoice");
        }
        log.info("[PI-CREATE] STEP 4 - QUOTATION STATUS VERIFIED: ACCEPTED");

        java.util.List<ProformaInvoice> existingPIs = proformaInvoiceRepository
                .findBySourceQuotationIdAndCompanyId(quotationId, resolvedCompanyId);

        boolean duplicateExists = false;
        if (existingPIs.isEmpty()) {
            log.info("quotationId={} existingPIId=null existingPISourceQuotationId=null duplicateCheckResult=false",
                    quotationId);
        } else {
            for (ProformaInvoice existing : existingPIs) {
                boolean isDup = !Boolean.TRUE.equals(existing.getIsDeleted());
                if (isDup) {
                    duplicateExists = true;
                }
                log.info(
                        "quotationId={} existingPIId={} existingPISourceQuotationId={} existingPIIsDeleted={} duplicateCheckResult={}",
                        quotationId, existing.getId(), existing.getSourceQuotationId(), existing.getIsDeleted(), isDup);
            }
        }

        if (duplicateExists) {
            throw new BadRequestException("A Proforma Invoice already exists for this quotation");
        }

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Company not found"));
        log.info("[PI-CREATE] STEP 6 - COMPANY ENTITY LOADED: companyId={}", company.getId());

        // Generate PI number first — runs in REQUIRES_NEW transaction
        String piNumber = voucherSequenceService.generateNextProformaInvoiceNumber(resolvedCompanyId,
                request.getPiDate());
        log.info("[PI-CREATE] STEP 7 - PI NUMBER GENERATED: piNumber={}", piNumber);

        // ---- Build PI entity using MapStruct ----
        ProformaInvoice pi = proformaInvoiceMapper.toProformaInvoiceEntity(quotation, request, piNumber, company,
                TenantUtils.getCurrentUserId());

        if (pi.getAdvanceRequired() != null && pi.getAdvanceRequired()) {
            if (pi.getAdvanceAmount() == null || pi.getAdvanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Advance amount must be greater than zero when advance is required");
            }
            if (pi.getTotalAmount() != null && pi.getAdvanceAmount().compareTo(pi.getTotalAmount()) > 0) {
                throw new BadRequestException("Advance amount cannot exceed PI total amount");
            }
        }

        log.info("[PI-CREATE] STEP 8 & 9 - PI MAPPED: piNumber={}, status={}, companyId={}, " +
                "sourceQuotationId={}, customerId={}, currency={}, totalAmount={}, isDeleted={}, itemsCount={}",
                pi.getPiNumber(), pi.getStatus(), pi.getCompanyId(),
                pi.getSourceQuotationId(), pi.getCustomerId(), pi.getCurrency(),
                pi.getTotalAmount(), pi.getIsDeleted(), pi.getItems() != null ? pi.getItems().size() : 0);

        if (pi.getItems() == null || pi.getItems().isEmpty()) {
            log.warn("[PI-CREATE] STEP 9 - QUOTATION HAS NO ITEMS!");
        }

        // ---- Persist ----
        log.info("[PI-CREATE] STEP 10 - CALLING saveAndFlush. itemCount={}, isDeleted={}",
                pi.getItems() != null ? pi.getItems().size() : "NULL", pi.getIsDeleted());
        try {
            ProformaInvoice saved = proformaInvoiceRepository.saveAndFlush(pi);
            log.info("[PI-CREATE] STEP 11 - SAVE SUCCESS: savedId={}, piNumber={}, status={}",
                    saved.getId(), saved.getPiNumber(), saved.getStatus());

            // Auto-create receipt if advance is required and payment mode is provided
            if (saved.getAdvanceRequired() != null && saved.getAdvanceRequired()
                    && saved.getAdvanceAmount() != null
                    && saved.getAdvanceAmount().compareTo(java.math.BigDecimal.ZERO) > 0
                    && request.getPaymentMode() != null) {

                if (request.getReceivableAccountId() == null || request.getReceiptAccountId() == null) {
                    throw new BadRequestException(
                            "receivableAccountId and receiptAccountId are required to auto-create an advance receipt");
                }

                ReceiptVoucherRequest rvRequest = new ReceiptVoucherRequest();
                rvRequest.setCustomerId(saved.getCustomerId());
                rvRequest.setBankAccountId(request.getBankAccountId());
                LocalDate receiptDate = (saved.getPiDate() != null && !saved.getPiDate().isAfter(java.time.LocalDate.now()))
                        ? saved.getPiDate()
                        : java.time.LocalDate.now();
                rvRequest.setReceiptDate(receiptDate);
                rvRequest.setReceiptAmount(saved.getAdvanceAmount());
                rvRequest.setPaymentMode(request.getPaymentMode());
                rvRequest.setReceivableAccountId(request.getReceivableAccountId());
                rvRequest.setReceiptAccountId(request.getReceiptAccountId());
                rvRequest.setReferenceNo("ADV-" + saved.getPiNumber());

                ReceiptVoucherAllocationRequest allocation = ReceiptVoucherAllocationRequest.builder()
                        .proformaInvoiceId(saved.getId())
                        .allocatedAmount(saved.getAdvanceAmount())
                        .build();
                rvRequest.setAllocations(java.util.Collections.singletonList(allocation));

                receiptVoucherService.createReceipt(resolvedCompanyId, RequestWrapper.of(rvRequest));
                log.info("[PI-CREATE] STEP 15 - AUTO RECEIPT CREATED for PI id={}", saved.getId());
            }

            return toResponseWithQuotation(saved, resolvedCompanyId);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            String cause = e.getCause() != null && e.getCause().getMessage() != null
                    ? e.getCause().getMessage().toLowerCase()
                    : "";

            if (msg.contains("idx_pi_source_quotation") || cause.contains("idx_pi_source_quotation")) {
                log.error("[PI-CREATE] STEP 11 - SAVE FAILED (Concurrent Duplicate): {}", e.getMessage());
                throw new BadRequestException(
                        "A Proforma Invoice already exists for this quotation (Concurrent creation detected).");
            } else {
                log.error("[PI-CREATE] STEP 11 - SAVE FAILED (Data Integrity Violation): {}", e.getMessage());
                throw e;
            }
        } catch (Exception e) {
            log.error("[PI-CREATE] STEP 11 - SAVE FAILED: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public ProformaInvoiceResponse createDirectProformaInvoice(UUID companyId,
            ProformaInvoiceDirectCreateRequest request) {
        log.info("[PI-CREATE-DIRECT] STEP 1 - SERVICE ENTERED: companyId={}, piDate={}, piValidTill={}",
                companyId, request.getPiDate(), request.getPiValidTill());

        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Company not found"));

        Customer customer = customerRepository
                .findByIdAndCompanyIdAndIsDeletedFalse(request.getCustomerId(), resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Customer not found or does not belong to current company"));

        if (request.getAdvanceRequired() != null && request.getAdvanceRequired()) {
            if (request.getAdvanceAmount() == null || request.getAdvanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Advance amount must be greater than zero when advance is required");
            }
        }

        String piNumber = voucherSequenceService.generateNextProformaInvoiceNumber(resolvedCompanyId,
                request.getPiDate());

        ProformaInvoice pi = new ProformaInvoice();
        pi.setCompanyId(resolvedCompanyId);
        pi.setCompany(company);
        pi.setPiNumber(piNumber);
        pi.setPiDate(request.getPiDate());
        pi.setPiValidTill(request.getPiValidTill());
        pi.setCustomerId(customer.getId());
        pi.setCustomer(customer);
        pi.setSourceQuotationId(null);
        pi.setSourceQuotationNumber(null);
        pi.setAdvanceRequired(request.getAdvanceRequired() != null ? request.getAdvanceRequired() : false);
        pi.setAdvanceAmount(request.getAdvanceAmount() != null ? request.getAdvanceAmount() : BigDecimal.ZERO);
        pi.setBankAccountId(request.getBankAccountId());

        resolveSettingsForCreate(resolvedCompanyId, request, pi);

        pi.setDeliveryTerms(request.getDeliveryTerms());
        pi.setNotes(request.getNotes());
        pi.setStatus(ProformaInvoiceStatus.DRAFT);
        pi.setIsDeleted(false);
        pi.setCreatedBy(TenantUtils.getCurrentUserId());
        pi.setCurrency("INR");

        if (CustomerAddressUtils.getDefaultAddress(customer) != null
                && CustomerAddressUtils.getDefaultAddress(customer).getGstState() != null) {
            pi.setPlaceOfSupplyStateCode(CustomerAddressUtils.getDefaultAddress(customer).getGstState().getStateCode());
        }

        for (com.erp.account.modules.proformainvoice.dto.request.DirectPIItemRequest itemReq : request.getItems()) {
            ProformaInvoiceItem item = new ProformaInvoiceItem();
            item.setCompanyId(resolvedCompanyId);
            item.setCompany(company);
            item.setIsDeleted(false);
            item.setSourceQuotationItemId(null);

            item.setItemId(itemReq.getItemId());
            item.setItemName(itemReq.getItemName());
            item.setDescription(itemReq.getDescription());
            item.setQuantity(itemReq.getQuantity());
            item.setUnit(itemReq.getUnit());
            item.setUnitPrice(itemReq.getUnitPrice());
            item.setDiscountPercent(itemReq.getDiscountPercent());

            item.setNotes(itemReq.getNotes());
            item.setCreatedBy(TenantUtils.getCurrentUserId());

            com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster hsnSac = hsnSacMasterRepository
                    .findByCodeAndIsDeletedFalse(itemReq.getHsnSacCode())
                    .orElseThrow(() -> new BadRequestException("Invalid HSN/SAC code: " + itemReq.getHsnSacCode()));
            item.setHsnSacMaster(hsnSac);

            item.calculateLineAmount();
            calculateItemTax(item, hsnSac, resolvedCompanyId, pi.getPlaceOfSupplyStateCode());
            item.calculateTotalAmount();
            item.calculateRemainingQuantity();

            pi.addProformaInvoiceItem(item);
        }

        calculatePITotals(pi);

        if (pi.getAdvanceRequired() && pi.getAdvanceAmount().compareTo(pi.getTotalAmount()) > 0) {
            throw new BadRequestException("Advance amount cannot exceed PI total amount");
        }

        ProformaInvoice saved = proformaInvoiceRepository.saveAndFlush(pi);
        log.info("[PI-CREATE] STEP 14 - PI SAVED: id={}", saved.getId());

        // Auto-create receipt if advance is required and payment mode is provided
        if (saved.getAdvanceRequired() != null && saved.getAdvanceRequired()
                && saved.getAdvanceAmount() != null && saved.getAdvanceAmount().compareTo(java.math.BigDecimal.ZERO) > 0
                && request.getPaymentMode() != null) {

            if (request.getReceivableAccountId() == null || request.getReceiptAccountId() == null) {
                throw new BadRequestException(
                        "receivableAccountId and receiptAccountId are required to auto-create an advance receipt");
            }

            ReceiptVoucherRequest rvRequest = new ReceiptVoucherRequest();
            rvRequest.setCustomerId(saved.getCustomerId());
            rvRequest.setBankAccountId(request.getBankAccountId());
            LocalDate receiptDate = (saved.getPiDate() != null && !saved.getPiDate().isAfter(java.time.LocalDate.now()))
                    ? saved.getPiDate()
                    : java.time.LocalDate.now();
            rvRequest.setReceiptDate(receiptDate);
            rvRequest.setReceiptAmount(saved.getAdvanceAmount());
            rvRequest.setPaymentMode(request.getPaymentMode());
            rvRequest.setReceivableAccountId(request.getReceivableAccountId());
            rvRequest.setReceiptAccountId(request.getReceiptAccountId());
            rvRequest.setReferenceNo("ADV-" + saved.getPiNumber());

            ReceiptVoucherAllocationRequest allocation = ReceiptVoucherAllocationRequest.builder()
                    .proformaInvoiceId(saved.getId())
                    .allocatedAmount(saved.getAdvanceAmount())
                    .build();
            rvRequest.setAllocations(java.util.Collections.singletonList(allocation));

            receiptVoucherService.createReceipt(resolvedCompanyId, RequestWrapper.of(rvRequest));
            log.info("[PI-CREATE] STEP 15 - AUTO RECEIPT CREATED for PI id={}", saved.getId());
        }

        return toResponseWithQuotation(saved, resolvedCompanyId);
    }

    @Override
    @Transactional(readOnly = true)
    public ProformaInvoiceProfileResponse getProformaInvoiceById(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        ProformaInvoice pi = proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Proforma Invoice not found"));

        ProformaInvoiceProfileResponse response = proformaInvoiceMapper.toProfileResponse(pi);
        response.setQuotation(findQuotationSummary(pi.getSourceQuotationId(), resolvedCompanyId));
        response.setPaymentSummary(buildPaymentSummary(pi));
        return response;
    }

    @Override
    @Transactional
    public ProformaInvoiceResponse changeStatus(UUID companyId, UUID id, ProformaInvoiceStatus newStatus) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        ProformaInvoice pi = proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Proforma Invoice not found"));

        lifecycleValidator.validateTransition(pi.getStatus(), newStatus);

        pi.setStatus(newStatus);
        pi.setUpdatedBy(TenantUtils.getCurrentUserId());
        return toResponseWithQuotation(proformaInvoiceRepository.save(pi), resolvedCompanyId);
    }

    @Override
    @Transactional
    public ProformaInvoiceResponse sendPI(UUID companyId, UUID id) {
        return changeStatus(companyId, id, ProformaInvoiceStatus.ISSUED);
    }

    @Override
    @Transactional
    public ProformaInvoiceResponse confirmPI(UUID companyId, UUID id) {
        return changeStatus(companyId, id, ProformaInvoiceStatus.CONFIRMED);
    }

    @Override
    @Transactional
    public ProformaInvoiceResponse cancelPI(UUID companyId, UUID id) {
        return changeStatus(companyId, id, ProformaInvoiceStatus.CANCELLED);
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<ProformaInvoiceResponse> getAllProformaInvoices(UUID companyId,
            com.erp.account.modules.proformainvoice.dto.request.PIFilterDto filter,
            org.springframework.data.domain.Pageable pageable) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        org.springframework.data.jpa.domain.Specification<ProformaInvoice> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            predicates.add(cb.equal(root.get("companyId"), resolvedCompanyId));
            predicates.add(cb.or(
                    cb.isNull(root.get("isDeleted")),
                    cb.isFalse(root.get("isDeleted"))));

            if (filter != null) {
                                if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
                    String searchPattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
                    jakarta.persistence.criteria.Join<ProformaInvoice, com.erp.account.modules.customer.entity.Customer> customerJoin = root.join("customer", jakarta.persistence.criteria.JoinType.LEFT);
                    predicates.add(cb.or(
                        cb.like(cb.lower(root.get("piNumber")), searchPattern),
                        cb.like(cb.lower(customerJoin.get("name")), searchPattern)
                    ));
                }
                
                if (filter.getPiNumber() != null && !filter.getPiNumber().trim().isEmpty()) {
                    predicates.add(cb.like(cb.lower(root.get("piNumber")),
                            "%" + filter.getPiNumber().trim().toLowerCase() + "%"));
                }
                if (filter.getCustomerId() != null) {
                    predicates.add(cb.equal(root.get("customerId"), filter.getCustomerId()));
                }
                if (filter.getStatus() != null) {
                    predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                }
                if (filter.getSourceQuotationId() != null) {
                    predicates.add(cb.equal(root.get("sourceQuotationId"), filter.getSourceQuotationId()));
                }
                if (filter.getStartDate() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("piDate"), filter.getStartDate()));
                }
                if (filter.getEndDate() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("piDate"), filter.getEndDate()));
                }
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<ProformaInvoice> piPage = proformaInvoiceRepository.findAll(spec, pageable);

        List<UUID> sourceQuotationIds = piPage.getContent().stream()
                .map(ProformaInvoice::getSourceQuotationId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        final Map<UUID, QuotationSummaryDTO> quotationById;
        if (sourceQuotationIds.isEmpty()) {
            quotationById = Collections.emptyMap();
        } else {
            quotationById = quotationRepository
                    .findAllByIdInAndCompanyIdAndIsDeletedFalse(sourceQuotationIds, resolvedCompanyId)
                    .stream()
                    .collect(Collectors.toMap(Quotation::getId, proformaInvoiceMapper::toQuotationSummaryDTO,
                            (a, b) -> a));
        }

        return piPage.map(pi -> {
            ProformaInvoiceResponse response = proformaInvoiceMapper.toResponse(pi);
            UUID quoteId = pi.getSourceQuotationId();
            if (quoteId != null) {
                response.setQuotation(quotationById.get(quoteId));
            }
            return response;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public ProformaInvoiceProfileResponse getProformaInvoiceByNumber(UUID companyId, String piNumber) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        ProformaInvoice pi = proformaInvoiceRepository
                .findByPiNumberAndCompanyIdAndIsDeletedFalse(piNumber, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Proforma Invoice not found"));
        ProformaInvoiceProfileResponse response = proformaInvoiceMapper.toProfileResponse(pi);
        response.setQuotation(findQuotationSummary(pi.getSourceQuotationId(), resolvedCompanyId));
        response.setPaymentSummary(buildPaymentSummary(pi));
        return response;
    }

    @Override
    @Transactional
    public void deleteProformaInvoice(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        ProformaInvoice pi = proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Proforma Invoice not found"));

        if (!pi.isEditable()) {
            throw new BadRequestException("Only DRAFT Proforma Invoices can be deleted.");
        }

        pi.setIsDeleted(true);
        pi.setDeletedAt(java.time.LocalDateTime.now());
        proformaInvoiceRepository.save(pi);
    }

    @Override
    @Transactional
    public ProformaInvoiceResponse updateProformaInvoice(UUID companyId, UUID id,
            PIUpdateRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Updating PI ID: {} for company: {}", id, resolvedCompanyId);

        if (request.getPiValidTill().isBefore(request.getPiDate())) {
            throw new BadRequestException("Valid till date cannot be before PI date");
        }

        ProformaInvoice pi = proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Proforma Invoice not found"));

        if (!pi.isEditable()) {
            throw new BadRequestException(
                    "Proforma Invoice cannot be updated in its current status: " + pi.getStatus());
        }

        pi.setPiDate(request.getPiDate());
        pi.setPiValidTill(request.getPiValidTill());
        pi.setAdvanceRequired(request.getAdvanceRequired() != null ? request.getAdvanceRequired() : false);
        pi.setAdvanceAmount(request.getAdvanceAmount() != null ? request.getAdvanceAmount() : BigDecimal.ZERO);
        pi.setBankAccountId(request.getBankAccountId());

        resolveSettingsForUpdate(resolvedCompanyId, request, pi);

        pi.setDeliveryTerms(request.getDeliveryTerms());
        pi.setNotes(request.getNotes());

        pi.setUpdatedBy(TenantUtils.getCurrentUserId());

        // Update items securely mapping local calculation
        pi.getItems().clear();

        for (com.erp.account.modules.proformainvoice.dto.request.PIItemRequest itemReq : request.getItems()) {
            ProformaInvoiceItem item = new ProformaInvoiceItem();
            item.setCompanyId(resolvedCompanyId);
            item.setCompany(pi.getCompany());
            item.setIsDeleted(false);

            // We need to keep source quotation mapping consistent but we cannot invent them
            // for newly added items from UI easily
            // In a strict ERP, items cannot be added arbitrarily if tied to a quotation,
            // but we enforce the same properties for calculation.
            item.setItemId(itemReq.getItemId());
            item.setItemName(itemReq.getItemName());
            item.setDescription(itemReq.getDescription());
            item.setQuantity(itemReq.getQuantity());
            item.setUnit(itemReq.getUnit());
            item.setUnitPrice(itemReq.getUnitPrice());
            item.setDiscountPercent(itemReq.getDiscountPercent());

            item.setNotes(itemReq.getNotes());

            com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster hsnSac = hsnSacMasterRepository
                    .findByCodeAndIsDeletedFalse(itemReq.getHsnSacCode())
                    .orElseThrow(() -> new BadRequestException("Invalid HSN/SAC code: " + itemReq.getHsnSacCode()));
            item.setHsnSacMaster(hsnSac);

            item.calculateLineAmount();
            calculateItemTax(item, hsnSac, resolvedCompanyId, pi.getPlaceOfSupplyStateCode());
            item.calculateTotalAmount();
            item.calculateRemainingQuantity();

            item.setCreatedBy(TenantUtils.getCurrentUserId());
            pi.addProformaInvoiceItem(item);
        }

        calculatePITotals(pi);
        return toResponseWithQuotation(proformaInvoiceRepository.save(pi), resolvedCompanyId);
    }

    private void calculateItemTax(ProformaInvoiceItem item,
            com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster hsnSac, UUID companyId,
            String placeOfSupplyStateCode) {
        Company company = companyRepository.findById(companyId).orElseThrow();
        String companyStateCode = "";
        if (company.getGstin() != null && company.getGstin().length() >= 2) {
            companyStateCode = company.getGstin().substring(0, 2);
        }

        java.math.BigDecimal cgstRate = java.math.BigDecimal.ZERO;
        java.math.BigDecimal sgstRate = java.math.BigDecimal.ZERO;
        java.math.BigDecimal igstRate = java.math.BigDecimal.ZERO;
        java.math.BigDecimal cessRate = java.math.BigDecimal.ZERO;

        java.math.BigDecimal cgstAmount = java.math.BigDecimal.ZERO;
        java.math.BigDecimal sgstAmount = java.math.BigDecimal.ZERO;
        java.math.BigDecimal igstAmount = java.math.BigDecimal.ZERO;
        java.math.BigDecimal cessAmount = java.math.BigDecimal.ZERO;

        java.math.BigDecimal taxableAmount = item.getTaxableAmount() != null ? item.getTaxableAmount()
                : java.math.BigDecimal.ZERO;

        if (hsnSac.getGstSlab() != null) {
            if (companyStateCode != null && companyStateCode.equals(placeOfSupplyStateCode)) {
                cgstRate = hsnSac.getGstSlab().getCgstRate();
                sgstRate = hsnSac.getGstSlab().getSgstRate();
                cgstAmount = calculatePercentage(taxableAmount, cgstRate);
                sgstAmount = calculatePercentage(taxableAmount, sgstRate);
            } else {
                igstRate = hsnSac.getGstSlab().getIgstRate();
                igstAmount = calculatePercentage(taxableAmount, igstRate);
            }
            cessRate = hsnSac.getGstSlab().getCessRate();
            cessAmount = calculatePercentage(taxableAmount, cessRate);
        }

        item.setCgstRate(cgstRate);
        item.setCgstAmount(cgstAmount);
        item.setSgstRate(sgstRate);
        item.setSgstAmount(sgstAmount);
        item.setIgstRate(igstRate);
        item.setIgstAmount(igstAmount);
        item.setCessRate(cessRate);
        item.setCessAmount(cessAmount);

        item.calculateTaxAmount();
    }

    private java.math.BigDecimal calculatePercentage(java.math.BigDecimal amount, java.math.BigDecimal percentage) {
        if (amount == null || percentage == null || percentage.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return java.math.BigDecimal.ZERO;
        }
        return amount.multiply(percentage).divide(new java.math.BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);
    }

    private ProformaInvoiceResponse toResponseWithQuotation(ProformaInvoice pi, UUID resolvedCompanyId) {
        ProformaInvoiceResponse response = proformaInvoiceMapper.toResponse(pi);
        response.setQuotation(findQuotationSummary(pi.getSourceQuotationId(), resolvedCompanyId));
        if (pi.getId() != null) {
            response.setPaymentSummary(buildPaymentSummary(pi));
        }
        return response;
    }

    private QuotationSummaryDTO findQuotationSummary(UUID sourceQuotationId, UUID companyId) {
        if (sourceQuotationId == null) {
            return null;
        }
        return quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(sourceQuotationId, companyId)
                .map(proformaInvoiceMapper::toQuotationSummaryDTO)
                .orElse(null);
    }

    private PiPaymentSummaryDto buildPaymentSummary(ProformaInvoice pi) {
        Boolean required = pi.getAdvanceRequired() != null ? pi.getAdvanceRequired() : false;
        BigDecimal expected = required && pi.getAdvanceAmount() != null ? pi.getAdvanceAmount() : BigDecimal.ZERO;

        List<PiReceiptDto> receiptDtos = new java.util.ArrayList<>();
        BigDecimal received = BigDecimal.ZERO;
        java.util.Set<UUID> seenReceiptIds = new java.util.HashSet<>();

        // 1. Fetch allocations linked to this Proforma Invoice
        List<ReceiptAllocation> allocations = receiptAllocationRepository.findByProformaInvoiceId(pi.getId());
        if (allocations != null) {
            for (ReceiptAllocation alloc : allocations) {
                if (Boolean.TRUE.equals(alloc.getIsDeleted())) continue;
                com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher rv = alloc.getReceiptVoucher();
                if (rv != null && !Boolean.TRUE.equals(rv.getIsDeleted())
                        && rv.getReceiptStatus() != ReceiptVoucherStatus.CANCELLED
                        && rv.getReceiptStatus() != ReceiptVoucherStatus.REVERSED
                        && rv.getReceiptStatus() != ReceiptVoucherStatus.REJECTED) {
                    BigDecimal allocAmt = alloc.getAllocatedAmount() != null ? alloc.getAllocatedAmount() : BigDecimal.ZERO;
                    received = received.add(allocAmt);
                    if (rv.getId() != null) {
                        seenReceiptIds.add(rv.getId());
                    }
                    receiptDtos.add(PiReceiptDto.builder()
                            .receiptId(rv.getId())
                            .receiptNo(rv.getReceiptNo())
                            .receiptDate(rv.getReceiptDate())
                            .amount(allocAmt)
                            .paymentMode(rv.getPaymentMode())
                            .referenceNo(rv.getReferenceNo())
                            .build());
                }
            }
        }

        // 2. Also check any legacy unallocated receipts linked by referenceNo ("ADV-" + piNumber)
        if (pi.getPiNumber() != null) {
            String refNo = "ADV-" + pi.getPiNumber();
            List<com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher> advanceReceipts = receiptVoucherRepository
                    .findByReferenceNoAndCompanyIdAndIsDeletedFalse(refNo, pi.getCompanyId());
            if (advanceReceipts != null) {
                for (com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher rv : advanceReceipts) {
                    if (!seenReceiptIds.contains(rv.getId())
                            && rv.getReceiptStatus() != ReceiptVoucherStatus.CANCELLED
                            && rv.getReceiptStatus() != ReceiptVoucherStatus.REVERSED
                            && rv.getReceiptStatus() != ReceiptVoucherStatus.REJECTED) {
                        BigDecimal rvAmt = rv.getReceiptAmount() != null ? rv.getReceiptAmount() : BigDecimal.ZERO;
                        received = received.add(rvAmt);
                        seenReceiptIds.add(rv.getId());
                        receiptDtos.add(PiReceiptDto.builder()
                                .receiptId(rv.getId())
                                .receiptNo(rv.getReceiptNo())
                                .receiptDate(rv.getReceiptDate())
                                .amount(rvAmt)
                                .paymentMode(rv.getPaymentMode())
                                .referenceNo(rv.getReferenceNo())
                                .build());
                    }
                }
            }
        }

        BigDecimal remaining = expected.subtract(received);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }

        String paymentStatus = "NOT_REQUIRED";
        if (required) {
            if (received.compareTo(BigDecimal.ZERO) == 0) {
                paymentStatus = "PENDING";
            } else if (received.compareTo(expected) < 0) {
                paymentStatus = "PARTIALLY_PAID";
            } else {
                paymentStatus = "PAID";
            }
        }

        return PiPaymentSummaryDto.builder()
                .advanceRequired(required)
                .advanceAmount(expected)
                .receivedAmount(received)
                .remainingAdvance(remaining)
                .paymentStatus(paymentStatus)
                .receipts(receiptDtos)
                .build();
    }

    private void calculatePITotals(ProformaInvoice pi) {
        java.math.BigDecimal subtotal = java.math.BigDecimal.ZERO;
        java.math.BigDecimal discountAmount = java.math.BigDecimal.ZERO;
        java.math.BigDecimal taxAmount = java.math.BigDecimal.ZERO;

        for (ProformaInvoiceItem item : pi.getItems()) {
            subtotal = subtotal
                    .add(item.getTaxableAmount() != null ? item.getTaxableAmount() : java.math.BigDecimal.ZERO);
            discountAmount = discountAmount
                    .add(item.getDiscountAmount() != null ? item.getDiscountAmount() : java.math.BigDecimal.ZERO);
            taxAmount = taxAmount.add(item.getTaxAmount() != null ? item.getTaxAmount() : java.math.BigDecimal.ZERO);
        }

        pi.setSubtotal(subtotal);
        pi.setDiscountAmount(discountAmount);
        pi.setTaxAmount(taxAmount);

        java.math.BigDecimal freight = pi.getFreightCharges() != null ? pi.getFreightCharges()
                : java.math.BigDecimal.ZERO;
        java.math.BigDecimal other = pi.getOtherCharges() != null ? pi.getOtherCharges() : java.math.BigDecimal.ZERO;

        java.math.BigDecimal totalBeforeRound = subtotal.add(taxAmount).add(freight).add(other);
        pi.setTotalBeforeRoundOff(totalBeforeRound);

        java.math.BigDecimal roundedTotal = totalBeforeRound.setScale(0, java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal roundOff = roundedTotal.subtract(totalBeforeRound);

        pi.setRoundOff(roundOff);
        pi.setRoundOff(roundOff);
        pi.setTotalAmount(roundedTotal.setScale(4, java.math.RoundingMode.HALF_UP));
    }

    private void resolveSettingsForCreate(UUID companyId, ProformaInvoiceDirectCreateRequest request,
            ProformaInvoice pi) {
        if (request.getPaymentTermId() != null) {
            paymentTermRepository.findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(
                    request.getPaymentTermId(), companyId, SalesDocumentType.PROFORMA_INVOICE).ifPresent(pt -> {
                        pi.setPaymentTermId(pt.getId());
                        pi.setPaymentTerms(pt.getDescription());
                    });
        } else if (request.getPaymentTerms() != null) {
            pi.setPaymentTerms(request.getPaymentTerms());
        } else {
            paymentTermRepository.findByCompanyIdAndDocumentTypeAndIsDefaultTrueAndIsDeletedFalse(
                    companyId, SalesDocumentType.PROFORMA_INVOICE).ifPresent(pt -> {
                        pi.setPaymentTermId(pt.getId());
                        pi.setPaymentTerms(pt.getDescription());
                    });
        }

        if (request.getTermsConditionId() != null) {
            termsConditionRepository.findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(
                    request.getTermsConditionId(), companyId, SalesDocumentType.PROFORMA_INVOICE).ifPresent(tc -> {
                        pi.setTermsConditionId(tc.getId());
                        pi.setTermsAndConditions(tc.getContent());
                    });
        } else if (request.getTermsAndConditions() != null) {
            pi.setTermsAndConditions(request.getTermsAndConditions());
        } else {
            termsConditionRepository.findByCompanyIdAndDocumentTypeAndIsDefaultTrueAndIsDeletedFalse(
                    companyId, SalesDocumentType.PROFORMA_INVOICE).ifPresent(tc -> {
                        pi.setTermsConditionId(tc.getId());
                        pi.setTermsAndConditions(tc.getContent());
                    });
        }
    }

    private void resolveSettingsForUpdate(UUID companyId, PIUpdateRequest request, ProformaInvoice pi) {
        if (request.getPaymentTermId() != null) {
            paymentTermRepository.findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(
                    request.getPaymentTermId(), companyId, SalesDocumentType.PROFORMA_INVOICE).ifPresent(pt -> {
                        pi.setPaymentTermId(pt.getId());
                        pi.setPaymentTerms(pt.getDescription());
                    });
        } else if (request.getPaymentTerms() != null) {
            pi.setPaymentTerms(request.getPaymentTerms());
            pi.setPaymentTermId(null);
        }

        if (request.getTermsConditionId() != null) {
            termsConditionRepository.findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(
                    request.getTermsConditionId(), companyId, SalesDocumentType.PROFORMA_INVOICE).ifPresent(tc -> {
                        pi.setTermsConditionId(tc.getId());
                        pi.setTermsAndConditions(tc.getContent());
                    });
        } else if (request.getTermsAndConditions() != null) {
            pi.setTermsAndConditions(request.getTermsAndConditions());
            pi.setTermsConditionId(null);
        }
    }
}
