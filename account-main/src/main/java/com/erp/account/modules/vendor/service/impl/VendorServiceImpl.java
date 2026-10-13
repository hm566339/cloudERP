package com.erp.account.modules.vendor.service.impl;

import com.erp.account.modules.vendor.dto.request.VendorRequest;
import com.erp.account.modules.vendor.dto.response.*;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.appayment.repository.ApPaymentRepository;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.appayment.entity.ApPayment;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.erp.account.modules.ledger.dto.response.VendorLedgerResponse;
import com.erp.account.modules.vendor.dto.request.VendorFilterDto;
import com.erp.account.modules.vendor.specification.VendorSpecification;
import org.springframework.data.jpa.domain.Specification;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.*;
import com.erp.account.modules.vendor.mapper.VendorMapper;

import com.erp.account.modules.vendor.repository.VendorAddressRepository;
import com.erp.account.modules.vendor.entity.VendorAddress;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;

import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.purchaseorder.mapper.PurchaseOrderMapper;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;

import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptRepository;
import com.erp.account.modules.goodsreceipt.mapper.GoodsReceiptMapper;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;

import com.erp.account.modules.debitnote.repository.DebitNoteRepository;
import com.erp.account.modules.debitnote.mapper.DebitNoteMapper;
import com.erp.account.modules.debitnote.entity.DebitNote;
import com.erp.account.modules.vendor.service.VendorService;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.util.GstValidationUtil;
import com.erp.account.util.TenantUtils;
import com.erp.account.util.VendorLedgerHelper;
import com.erp.account.util.VendorValidationUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final VendorMapper vendorMapper;
    private final VendorValidationUtil vendorValidationUtil;
    private final VendorLedgerHelper vendorLedgerHelper;
    private final CompanyRepository companyRepository;
    private final ApInvoiceRepository apInvoiceRepository;
    private final ApPaymentRepository apPaymentRepository;
    private final VendorAddressRepository vendorAddressRepository;

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderMapper purchaseOrderMapper;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final GoodsReceiptMapper goodsReceiptMapper;
    private final DebitNoteRepository debitNoteRepository;
    private final DebitNoteMapper debitNoteMapper;

    @Override
    public VendorResponse createVendor(UUID companyId1, RequestWrapper<VendorRequest> requestWrapper) {
        VendorRequest request = requestWrapper.unwrap();
        UUID companyId = TenantUtils.resolveCompanyId(companyId1);
        log.info("Creating vendor: {} for company: {}", request.getVendorCode(), companyId);
        validateVendor(request);
        vendorValidationUtil.validateVendorForCreation(request.getVendorCode(), companyId);
        vendorValidationUtil.validateDuplicateGstin(normalizeUpper(request.getGstin()), companyId, null);
        vendorValidationUtil.validateDuplicatePan(normalizeUpper(request.getPanNo()), companyId, null);
        ChartOfAccount payableAccount = resolvePayableAccount(request.getPayableAccountId(), companyId);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException("Company not found with ID: " + companyId));

        Vendor vendor = vendorMapper.requestToEntity(request);
        if (request.getVendorCode() != null && !request.getVendorCode().isBlank()) {
            vendor.setVendorCode(request.getVendorCode().trim());
        } else {
            vendor.setVendorCode(generateUniqueVendorCode());
        }
        vendor.setCompany(company);
        vendor.setPayableAccount(payableAccount);
        normalizeVendor(vendor);
        vendor.setIsDeleted(false);

        Vendor saved = vendorRepository.save(vendor);
        log.info("Vendor created: {}", saved.getId());
        return enrichVendorResponse(vendorMapper.entityToResponse(saved), saved);
    }

    @Override
    public VendorResponse updateVendor(UUID vendorId, RequestWrapper<VendorRequest> requestWrapper) {
        VendorRequest request = requestWrapper.unwrap();
        log.info("Updating vendor: {}", vendorId);
        Vendor vendor = getVendorEntityById(vendorId);
        vendorValidationUtil.validateVendorIsNotDeleted(vendor);
        vendorValidationUtil.validateVendorForUpdate(request.getVendorCode(), vendor.getCompany().getId(), vendorId);
        vendorValidationUtil.validateDuplicateGstin(normalizeUpper(request.getGstin()), vendor.getCompany().getId(),
                vendorId);
        vendorValidationUtil.validateDuplicatePan(normalizeUpper(request.getPanNo()), vendor.getCompany().getId(),
                vendorId);
        ChartOfAccount payableAccount = resolvePayableAccount(request.getPayableAccountId(),
                vendor.getCompany().getId());
        vendorMapper.updateEntityFromRequest(request, vendor);
        vendor.setPayableAccount(payableAccount);
        normalizeVendor(vendor);
        Vendor updated = vendorRepository.save(vendor);
        return enrichVendorResponse(vendorMapper.entityToResponse(updated), updated);
    }

    @Override
    public void deleteVendor(UUID vendorId) {
        log.info("Deleting vendor: {}", vendorId);
        Vendor vendor = getVendorEntityById(vendorId);
        vendorValidationUtil.validateVendorIsNotDeleted(vendor);
        vendorValidationUtil.validateVendorNotInTransaction(vendorId, vendor.getCompany().getId());
        vendor.setIsDeleted(true);
        vendorRepository.save(vendor);
    }

    @Override
    public void activateVendor(UUID vendorId) {
        log.info("Activating vendor: {}", vendorId);
        Vendor vendor = getVendorEntityById(vendorId);
        vendor.setIsActive(true);
        vendorRepository.save(vendor);
    }

    @Override
    public void deactivateVendor(UUID vendorId) {
        log.info("Deactivating vendor: {}", vendorId);
        Vendor vendor = getVendorEntityById(vendorId);
        vendor.setIsActive(false);
        vendorRepository.save(vendor);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorProfileResponse getVendorById(UUID vendorId) {
        Vendor vendor = getVendorEntityById(vendorId);
        VendorProfileResponse response = new VendorProfileResponse();

        // Copy basic vendor details
        VendorResponse baseResponse = vendorMapper.entityToResponse(vendor);
        org.springframework.beans.BeanUtils.copyProperties(baseResponse, response);

        enrichVendorResponse(response, vendor);
        enrichVendorProfile(response, vendor);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public VendorResponse getVendorByCode(String vendorCode) {
        Vendor vendor;
        if (TenantUtils.isSystemAdmin()) {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            if (companyId != null) {
                vendor = vendorRepository.findByVendorCodeAndCompanyId(vendorCode, companyId)
                        .orElseThrow(() -> VendorNotFoundException.byCode(vendorCode));
            } else {
                vendor = vendorRepository.findAll().stream()
                        .filter(v -> vendorCode.equals(v.getVendorCode()) && !v.getIsDeleted())
                        .findFirst()
                        .orElseThrow(() -> VendorNotFoundException.byCode(vendorCode));
            }
        } else {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            vendor = vendorRepository.findByVendorCodeAndCompanyId(vendorCode, companyId)
                    .orElseThrow(() -> VendorNotFoundException.byCode(vendorCode));
        }
        return enrichVendorResponse(vendorMapper.entityToResponse(vendor), vendor);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorResponse> getAllVendors(VendorFilterDto filter, Pageable pageable) {
        UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        Specification<Vendor> spec = VendorSpecification.getFilterSpecification(filter, companyId);
        Page<Vendor> vendors = vendorRepository.findAll(spec, pageable);
        return vendors.map(v -> enrichVendorResponse(vendorMapper.entityToResponse(v), v));
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorResponse> getActiveVendors() {
        if (TenantUtils.isSystemAdmin()) {
            return vendorRepository.findAll().stream()
                    .filter(v -> v.getIsActive() && !v.getIsDeleted())
                    .map(v -> enrichVendorResponse(vendorMapper.entityToResponse(v), v))
                    .collect(Collectors.toList());
        } else {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            List<Vendor> vendors = vendorRepository.findActiveVendors(companyId);
            return vendors.stream()
                    .map(v -> enrichVendorResponse(vendorMapper.entityToResponse(v), v))
                    .collect(Collectors.toList());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorResponse> searchVendors(String query, Pageable pageable) {
        VendorFilterDto filter = VendorFilterDto.builder().searchKey(query).build();
        return getAllVendors(filter, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorResponse> searchVendorsByCity(String city, Pageable pageable) {
        VendorFilterDto filter = VendorFilterDto.builder().city(city).build();
        return getAllVendors(filter, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorResponse> searchVendorsByState(String state, Pageable pageable) {
        VendorFilterDto filter = VendorFilterDto.builder().state(state).build();
        return getAllVendors(filter, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorResponse> searchVendorsByCountry(String country, Pageable pageable) {
        VendorFilterDto filter = VendorFilterDto.builder().country(country).build();
        return getAllVendors(filter, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateOutstandingBalance(UUID vendorId) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        return vendorRepository.getOutstandingBalance(vendorId, companyId);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateAvailableCredit(UUID vendorId) {
        Vendor vendor = getVendorEntityById(vendorId);
        return vendorLedgerHelper.calculateAvailableCredit(vendor);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isCreditLimitExceeded(UUID vendorId, BigDecimal invoiceAmount) {
        Vendor vendor = getVendorEntityById(vendorId);
        return vendorLedgerHelper.isCreditLimitExceeded(vendor, invoiceAmount);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorLedgerResponse getVendorLedger(UUID vendorId, LocalDate fromDate, LocalDate toDate) {
        Vendor vendor = getVendorEntityById(vendorId);
        return vendorLedgerHelper.generateVendorLedger(vendor, fromDate, toDate);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorLedgerResponse getVendorTransactions(UUID vendorId, LocalDate fromDate, LocalDate toDate) {
        return getVendorLedger(vendorId, fromDate, toDate);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorResponse getVendorByGstin(String gstin) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        Vendor vendor = vendorRepository.findByGstinAndCompanyId(gstin, companyId)
                .orElseThrow(() -> new VendorNotFoundException("Vendor not found with GSTIN: " + gstin));
        return enrichVendorResponse(vendorMapper.entityToResponse(vendor), vendor);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorResponse getVendorByPan(String pan) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        Vendor vendor = vendorRepository.findByPanNoAndCompanyId(pan, companyId)
                .orElseThrow(() -> new VendorNotFoundException("Vendor not found with PAN: " + pan));
        return enrichVendorResponse(vendorMapper.entityToResponse(vendor), vendor);
    }

    @Override
    public void validateVendor(VendorRequest request) {
        vendorValidationUtil.validateVendorCodeFormat(request.getVendorCode());
        vendorValidationUtil.validateVendorNameFormat(request.getVendorName());
        vendorValidationUtil.validateEmail(request.getEmail());
        vendorValidationUtil.validatePhone(request.getPhone());
        vendorValidationUtil.validateCreditLimit(request.getCreditLimit());
        vendorValidationUtil.validateOpeningBalance(request.getOpeningBalance());
        vendorValidationUtil.validatePaymentTermDays(request.getPaymentTermDays());
        vendorValidationUtil.validateTds(request.getTdsApplicable(), request.getTdsSection(), request.getTdsRate());
        validateDefaultCurrency(request.getDefaultCurrency());

        if (request.getGstin() != null && !request.getGstin().isBlank()) {
            GstValidationUtil.validateGstinAndPan(request.getGstin(), request.getPanNo());
        }
    }

    private Vendor getVendorEntityById(UUID vendorId) {
        if (TenantUtils.isSystemAdmin()) {
            return vendorRepository.findByIdAndNotDeleted(vendorId)
                    .orElseThrow(() -> VendorNotFoundException.byId(vendorId));
        } else {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            return vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, companyId)
                    .orElseThrow(() -> VendorNotFoundException.byId(vendorId));
        }
    }

    private VendorResponse enrichVendorResponse(VendorResponse response, Vendor vendor) {
        response.setOutstandingBalance(calculateOutstandingBalance(vendor.getId()));
        if (response.getCreditLimit() != null && response.getOutstandingBalance() != null) {
            response.setAvailableCredit(response.getCreditLimit().subtract(response.getOutstandingBalance()));
        }
        response.setTotalInvoices((long) (vendor.getApInvoices() != null ? vendor.getApInvoices().size() : 0));
        response.setTotalPayments((long) (vendor.getApPayments() != null ? vendor.getApPayments().size() : 0));
        return response;
    }

    private void enrichVendorProfile(VendorProfileResponse profile, Vendor vendor) {
        UUID companyId = vendor.getCompany().getId();
        UUID vendorId = vendor.getId();

        // 1. Ledger Information
        BigDecimal outstanding = profile.getOutstandingBalance() != null ? profile.getOutstandingBalance()
                : BigDecimal.ZERO;
        VendorLedgerInfoDto ledgerInfo = VendorLedgerInfoDto.builder()
                .creditLimit(vendor.getCreditLimit() != null ? vendor.getCreditLimit() : BigDecimal.ZERO)
                .availableCredit(profile.getAvailableCredit() != null ? profile.getAvailableCredit() : BigDecimal.ZERO)
                .currentBalance(outstanding)
                .openingBalance(vendor.getOpeningBalance() != null ? vendor.getOpeningBalance() : BigDecimal.ZERO)
                .closingBalance(outstanding)
                .outstandingBalance(outstanding)
                .build();
        profile.setLedgerInformation(ledgerInfo);

        // 2. Purchase Bills (Invoices)
        List<ApInvoice> invoices = apInvoiceRepository.findByVendor(
                companyId, vendorId, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "invoiceDate"))).getContent();

        List<VendorInvoiceDto> invoiceDtos = invoices.stream().map(inv -> VendorInvoiceDto.builder()
                .invoiceId(inv.getId())
                .invoiceNumber(inv.getInvoiceNo())
                .invoiceDate(inv.getInvoiceDate())
                .dueDate(inv.getDueDate())
                .purchaseAmount(inv.getTotalAmount())
                .taxAmount(inv.getTaxAmount())
                .paidAmount(inv.getPaidAmount())
                .pendingAmount(inv.getOutstandingAmount())
                .status(inv.getStatus() != null ? inv.getStatus().name() : null)
                .build()).collect(Collectors.toList());
        profile.setPurchaseBills(invoiceDtos);

        // 3. Payments Made
        List<ApPayment> payments = apPaymentRepository.findByVendorIdAndCompanyIdAndIsDeletedFalse(
                vendorId, companyId, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "paymentDate"))).getContent();

        List<VendorPaymentDto> paymentDtos = payments.stream().map(pay -> VendorPaymentDto.builder()
                .paymentId(pay.getId())
                .paymentNumber(pay.getPaymentNo())
                .paymentDate(pay.getPaymentDate())
                .amount(pay.getPaymentAmount())
                .paymentMode(pay.getPaymentMode() != null ? pay.getPaymentMode().name() : null)
                .bankCashAccount(pay.getBankAccount() != null ? pay.getBankAccount().getBankName() : null)
                .referenceNumber(pay.getReferenceNo())
                .remarks(pay.getRemarks())
                .build()).collect(Collectors.toList());
        profile.setPaymentsMade(paymentDtos);

        // 4. Outstanding Payables
        VendorOutstandingDto outstandingDto = VendorOutstandingDto.builder()
                .totalOutstanding(outstanding)
                .overdueAmount(BigDecimal.ZERO)
                .notYetDueAmount(outstanding)
                .ageingSummary(new java.util.HashMap<>())
                .build();
        profile.setOutstandingPayables(outstandingDto);

        // 4.1 Fetch other domain objects
        List<PurchaseOrder> pos = purchaseOrderRepository.findByCompanyIdAndVendorIdAndIsDeletedFalse(companyId,
                vendorId);
        profile.setPurchaseOrders(pos.stream().map(purchaseOrderMapper::toResponse).collect(Collectors.toList()));

        List<GoodsReceipt> grns = goodsReceiptRepository.findByCompanyIdAndVendorIdAndIsDeletedFalse(companyId,
                vendorId);
        profile.setGoodsReceiptNotes(grns.stream().map(goodsReceiptMapper::toResponse).collect(Collectors.toList()));

        List<DebitNote> dns = debitNoteRepository.findAllByCompanyIdAndApInvoiceVendorIdAndIsDeletedFalse(companyId,
                vendorId);
        profile.setDebitNotes(dns.stream().map(debitNoteMapper::toResponse).collect(Collectors.toList()));

        // 5. Recent Transactions
        List<VendorTransactionDto> transactions = new java.util.ArrayList<>();
        for (VendorInvoiceDto inv : invoiceDtos) {
            transactions.add(VendorTransactionDto.builder()
                    .date(inv.getInvoiceDate())
                    .transactionType("INVOICE")
                    .referenceNumber(inv.getInvoiceNumber())
                    .amount(inv.getPurchaseAmount())
                    .status(inv.getStatus())
                    .build());
        }
        for (VendorPaymentDto pay : paymentDtos) {
            transactions.add(VendorTransactionDto.builder()
                    .date(pay.getPaymentDate())
                    .transactionType("PAYMENT")
                    .referenceNumber(pay.getPaymentNumber())
                    .amount(pay.getAmount())
                    .status(pay.getPaymentMode())
                    .build());
        }
        transactions.sort(java.util.Comparator.comparing(VendorTransactionDto::getDate).reversed());
        profile.setRecentTransactions(transactions.stream().limit(20).collect(Collectors.toList()));

        // 6. Ledger Entries
        List<VendorLedgerEntryDto> entries = new java.util.ArrayList<>();
        BigDecimal runningBalance = vendor.getOpeningBalance() != null ? vendor.getOpeningBalance() : BigDecimal.ZERO;

        List<VendorTransactionDto> ascTransactions = new java.util.ArrayList<>(transactions);
        ascTransactions.sort(java.util.Comparator.comparing(VendorTransactionDto::getDate));
        for (VendorTransactionDto tx : ascTransactions) {
            VendorLedgerEntryDto entry = VendorLedgerEntryDto.builder()
                    .date(tx.getDate())
                    .voucherType(tx.getTransactionType())
                    .voucherNumber(tx.getReferenceNumber())
                    .credit("INVOICE".equals(tx.getTransactionType()) ? tx.getAmount() : BigDecimal.ZERO)
                    .debit("PAYMENT".equals(tx.getTransactionType()) ? tx.getAmount() : BigDecimal.ZERO)
                    .build();
            runningBalance = runningBalance.add(entry.getCredit()).subtract(entry.getDebit());
            entry.setBalance(runningBalance);
            entries.add(entry);
        }
        java.util.Collections.reverse(entries); // newest first
        profile.setLedgerEntries(entries);

        // 7. Statistics
        BigDecimal totalPayments = apPaymentRepository.getTotalVendorPayments(vendorId);

        VendorStatisticsDto stats = VendorStatisticsDto.builder()
                .totalPurchaseAmount(apInvoiceRepository.getVendorTotalPurchaseAmount(vendorId))
                .totalPurchaseBills(profile.getTotalInvoices())
                .totalPayments(totalPayments != null ? totalPayments : BigDecimal.ZERO)
                .totalOutstanding(outstanding)
                .averagePaymentDays(0)
                .lastPurchaseDate(invoiceDtos.isEmpty() ? null : invoiceDtos.get(0).getInvoiceDate())
                .lastPaymentDate(paymentDtos.isEmpty() ? null : paymentDtos.get(0).getPaymentDate())
                .build();
        profile.setStatistics(stats);

        // 8. Contacts & Addresses
        VendorContactDto contact = VendorContactDto.builder()
                .contactPerson(vendor.getVendorName())
                .email(vendor.getEmail())
                .phone(vendor.getPhone())
                .mobile(vendor.getPhone())
                .build();
        profile.setContacts(java.util.Collections.singletonList(contact));

        VendorAddressDto address = VendorAddressDto.builder()
                .type("BILLING")
                .addressLine1(vendor.getAddressLine1())
                .city(vendor.getCity())
                .state(vendor.getState())
                .country(vendor.getCountry())
                .pinCode(vendor.getPinCode())
                .build();
        profile.setAddresses(java.util.Collections.singletonList(address));

        // 9. Audit Info
        VendorAuditInfoDto auditInfo = VendorAuditInfoDto.builder()
                .createdBy(vendor.getCreatedBy())
                .createdAt(vendor.getCreatedAt())
                .updatedBy(vendor.getUpdatedBy())
                .updatedAt(vendor.getUpdatedAt())
                .build();
        profile.setAuditInformation(auditInfo);
    }

    private ChartOfAccount resolvePayableAccount(UUID accountId, UUID companyId) {
        if (accountId == null) {
            throw new ValidationException("Payable account is required");
        }
        ChartOfAccount account = chartOfAccountRepository.findByIdAndIsDeletedFalse(accountId)
                .orElseThrow(() -> new ValidationException("Invalid payable account: " + accountId));
        if (account.getCompany() == null || !companyId.equals(account.getCompany().getId())) {
            throw new ValidationException("Payable account must belong to the vendor company");
        }
        if (!Boolean.TRUE.equals(account.getIsActive())) {
            throw new ValidationException("Payable account must be active");
        }
        if (!Boolean.TRUE.equals(account.getPostingAllowed())) {
            throw new ValidationException("Payable account must allow posting");
        }
        return account;
    }

    private void validateDefaultCurrency(String currencyCode) {
        if (currencyCode == null || currencyCode.isBlank()) {
            return;
        }
        vendorValidationUtil.validateDefaultCurrency(currencyCode);
    }

    private void normalizeVendor(Vendor vendor) {
        vendor.setVendorCode(normalizeUpper(vendor.getVendorCode()));
        vendor.setGstin(normalizeUpper(vendor.getGstin()));
        vendor.setPanNo(normalizeUpper(vendor.getPanNo()));
        String curr = normalizeUpper(vendor.getDefaultCurrency());
        if (curr != null && curr.length() > 3) {
            curr = curr.substring(0, 3);
        }
        vendor.setDefaultCurrency(curr);
        vendor.setTdsApplicable(Boolean.TRUE.equals(vendor.getTdsApplicable()));
        if (!Boolean.TRUE.equals(vendor.getTdsApplicable())) {
            vendor.setTdsSection(null);
            vendor.setTdsRate(null);
        }
    }

    private String normalizeUpper(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase();
    }

    private String generateUniqueVendorCode() {
        String vendorCode;

        do {
            vendorCode = "VEN" + System.currentTimeMillis(); // Example: VEN1753983456789
        } while (vendorRepository.existsByVendorCode(vendorCode));

        return vendorCode;
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorAddressResponse> getVendorAddresses(UUID vendorId) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + vendorId));

        if (!vendor.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Vendor not found with id: " + vendorId);
        }

        List<VendorAddress> addresses = vendorAddressRepository.findByVendorIdAndIsDeletedFalse(vendorId);

        return addresses.stream().map(address -> VendorAddressResponse.builder()
                .id(address.getId())
                .vendorId(vendor.getId())
                .addressType(address.getAddressType())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .gstStateId(address.getGstState() != null ? address.getGstState().getId() : null)
                .country(address.getCountry())
                .postalCode(address.getPostalCode())
                .isDefault(address.getIsDefault())
                .isActive(address.getIsActive())
                .build()).collect(Collectors.toList());
    }
}
