package com.erp.account.modules.customer.service.impl;

import com.erp.account.modules.customer.dto.request.CustomerFilterDto;
import com.erp.account.modules.customer.dto.request.CustomerRequest;
import com.erp.account.modules.customer.dto.request.CustomerAddressRequest;
import com.erp.account.modules.customer.dto.response.CustomerResponse;
import com.erp.account.modules.ledger.dto.response.CustomerLedgerResponse;
import com.erp.account.util.CustomerHelper;
import com.erp.account.util.CustomerLedgerHelper;
import com.erp.account.util.CustomerValidationUtil;
import com.erp.account.util.GstValidationUtil;
import com.erp.account.util.TenantUtils;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.*;
import com.erp.account.modules.customer.dto.response.*;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Comparator;
import com.erp.account.util.CustomerValidationUtil;
import com.erp.account.util.GstValidationUtil;
import com.erp.account.util.TenantUtils;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.*;
import com.erp.account.modules.customer.mapper.CustomerMapper;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.entity.CustomerAddress;
import com.erp.account.modules.customer.repository.CustomerRepository;
import com.erp.account.modules.gst.entity.GstStateCode;
import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import com.erp.account.modules.customer.service.CustomerService;
import com.erp.account.modules.customer.specification.CustomerSpecification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import com.erp.account.common.exception.CustomerNotFoundException;
import com.erp.account.common.exception.CustomerTransactionExistsException;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final GstStateCodeRepository gstStateCodeRepository;
    private final CustomerMapper customerMapper;
    private final CustomerValidationUtil customerValidationUtil;
    private final CustomerHelper customerHelper;
    private final CustomerLedgerHelper customerLedgerHelper;
    private final SalesInvoiceRepository salesInvoiceRepository;
    private final ReceiptVoucherRepository receiptVoucherRepository;

    @Override
    public CustomerResponse createCustomer(RequestWrapper<CustomerRequest> requestWrapper, UUID companyId) {

        CustomerRequest request = requestWrapper.unwrap();
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        String normalizedCode = request.getCustomerCode() == null ? null : request.getCustomerCode().trim();
        if (normalizedCode == null || normalizedCode.isEmpty()) {
            request.setCustomerCode(generateUniqueCustomerCode(resolvedCompanyId));
        } else {
            request.setCustomerCode(normalizedCode);
        }

        log.info("Creating customer: {} for company: {}", request.getCustomerCode(), resolvedCompanyId);

        validateCustomer(request);
        customerValidationUtil.validateCustomerCodeForCreation(
                request.getCustomerCode(), resolvedCompanyId);

        Customer customer = customerMapper.requestToEntity(request);

        customer.setCompany(new Company());
        customer.getCompany().setId(resolvedCompanyId);
        customer.setIsDeleted(false);

        Customer saved = customerRepository.save(customer);
        synchronizeAddresses(saved, request.getAddresses());
        saved = customerRepository.save(saved);

        log.info("Customer created: {}", saved.getId());

        return enrichCustomerResponse(customerMapper.entityToResponse(saved), saved);
    }

    @Override
    public CustomerResponse updateCustomer(UUID customerId, RequestWrapper<CustomerRequest> requestWrapper) {
        CustomerRequest request = requestWrapper.unwrap();
        log.info("Updating customer: {}", customerId);
        Customer customer = getCustomerEntityById(customerId);
        customerValidationUtil.validateCustomerNotDeleted(customer);

        String normalizedCode = request.getCustomerCode() == null ? null : request.getCustomerCode().trim();
        if (normalizedCode == null || normalizedCode.isEmpty()) {
            request.setCustomerCode(customer.getCustomerCode());
        } else {
            request.setCustomerCode(normalizedCode);
        }

        customerValidationUtil.validateCustomerCodeForUpdate(request.getCustomerCode(), customer.getCompany().getId(),
                customerId);
        validateCustomer(request);

        customerMapper.updateEntityFromRequest(request, customer);
        synchronizeAddresses(customer, request.getAddresses());
        Customer updated = customerRepository.save(customer);
        log.info("Customer updated: {}", customerId);
        return enrichCustomerResponse(customerMapper.entityToResponse(updated), updated);
    }

    @Override
    public void deleteCustomer(UUID customerId) {
        log.info("Deleting customer: {}", customerId);
        Customer customer = getCustomerEntityById(customerId);
        customerValidationUtil.validateCustomerNotDeleted(customer);

        // Check if customer has existing transactions
        long invoiceCount = customerRepository.countInvoices(customerId);
        long receiptCount = customerRepository.countReceipts(customerId);

        if (invoiceCount > 0 || receiptCount > 0) {
            log.warn("Cannot delete customer with existing transactions: {}", customerId);
            throw new CustomerTransactionExistsException(customer.getCustomerName());
        }

        customer.setIsDeleted(true);
        customerRepository.save(customer);
        log.info("Customer deleted: {}", customerId);
    }

    @Override
    public void activateCustomer(UUID customerId) {
        log.info("Activating customer: {}", customerId);
        Customer customer = getCustomerEntityById(customerId);
        customerValidationUtil.validateCustomerNotDeleted(customer);
        customer.setIsActive(true);
        customerRepository.save(customer);
    }

    @Override
    public void deactivateCustomer(UUID customerId) {
        log.info("Deactivating customer: {}", customerId);
        Customer customer = getCustomerEntityById(customerId);
        customerValidationUtil.validateCustomerNotDeleted(customer);
        customer.setIsActive(false);
        customerRepository.save(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerProfileResponse getCustomerById(UUID customerId) {
        Customer customer = getCustomerEntityById(customerId);
        CustomerResponse baseResponse = enrichCustomerResponse(customerMapper.entityToResponse(customer), customer);
        CustomerProfileResponse profile = new CustomerProfileResponse();
        BeanUtils.copyProperties(baseResponse, profile);
        enrichCustomerProfile(profile, customer);
        return profile;
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByCode(String customerCode) {
        Customer customer;
        if (TenantUtils.isSystemAdmin()) {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            if (companyId != null) {
                customer = customerRepository.findByCustomerCodeAndCompanyId(customerCode, companyId)
                        .orElseThrow(() -> CustomerNotFoundException.byCode(customerCode));
            } else {
                customer = customerRepository.findAll().stream()
                        .filter(c -> customerCode.equals(c.getCustomerCode()) && !c.getIsDeleted())
                        .findFirst()
                        .orElseThrow(() -> CustomerNotFoundException.byCode(customerCode));
            }
        } else {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            customer = customerRepository.findByCustomerCodeAndCompanyId(customerCode, companyId)
                    .orElseThrow(() -> CustomerNotFoundException.byCode(customerCode));
        }
        return enrichCustomerResponse(customerMapper.entityToResponse(customer), customer);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponse> getAllCustomers(CustomerFilterDto filter, Pageable pageable) {
        return getAllCustomers(filter, pageable, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponse> getAllCustomers(CustomerFilterDto filter, Pageable pageable, UUID companyId) {
        UUID requestedCompanyId = companyId != null ? companyId : (filter != null ? filter.getCompanyId() : null);
        log.info("Fetching customers with filters: {}, requestedCompanyId: {}", filter, requestedCompanyId);

        UUID resolvedCompanyId;
        if (TenantUtils.isSystemAdmin()) {
            resolvedCompanyId = requestedCompanyId;
        } else {
            UUID currentCompanyId = TenantUtils.getCurrentCompanyId();
            if (currentCompanyId != null) {
                if (requestedCompanyId != null && !requestedCompanyId.equals(currentCompanyId)) {
                    log.warn("Unauthorized cross-company customer access attempt: user company={}, requested company={}",
                            currentCompanyId, requestedCompanyId);
                    throw new AccessDeniedException(
                            "Access denied: User does not have access to company " + requestedCompanyId);
                }
                resolvedCompanyId = currentCompanyId;
            } else {
                resolvedCompanyId = requestedCompanyId;
            }
        }

        log.info("Using companyId for customer filtering: {}", resolvedCompanyId);

        Specification<Customer> spec = CustomerSpecification.getFilterSpecification(filter, resolvedCompanyId);

        Page<Customer> customers = customerRepository.findAll(spec, pageable);
        // Debug: when system-admin, log distinct company ids returned by the query
        if (TenantUtils.isSystemAdmin()) {
            try {
                var distinctCompanyIds = customers.getContent().stream()
                        .map(c -> c.getCompany() != null ? c.getCompany().getId() : null)
                        .distinct()
                        .toList();
                log.info("SYSTEM_ADMIN query returned {} customers; distinct companyIds={}",
                        customers.getNumberOfElements(), distinctCompanyIds);
            } catch (Exception ex) {
                log.warn("Failed to log company ids for SYSTEM_ADMIN customers: {}", ex.getMessage());
            }
        }
        return customers.map(c -> enrichCustomerResponse(customerMapper.entityToResponse(c), c));
    }

    @Override
    public void validateCustomer(CustomerRequest request) {
        customerValidationUtil.validateCustomerFormat(request.getCustomerCode(), request.getCustomerName(),
                request.getEmail(), request.getPhone(), request.getCreditLimit());

        if (request.getGstin() != null && !request.getGstin().isEmpty()) {
            GstValidationUtil.validateGstinAndPan(request.getGstin(), request.getPanNo());
        } else if (request.getPanNo() != null && !request.getPanNo().isEmpty()) {
            GstValidationUtil.validatePan(request.getPanNo());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerLedgerResponse getCustomerLedger(UUID customerId, LocalDate fromDate, LocalDate toDate) {
        Customer customer = getCustomerEntityById(customerId);

        BigDecimal openingBalance = customerLedgerHelper.getOpeningBalance(customerId, fromDate);
        BigDecimal invoiceAmount = customerRepository.getInvoiceAmountForPeriod(customerId, fromDate, toDate);
        BigDecimal receiptAmount = customerRepository.getReceiptAmountForPeriod(customerId, fromDate, toDate);
        BigDecimal closingBalance = openingBalance.add(invoiceAmount).subtract(receiptAmount);

        return CustomerLedgerResponse.builder()
                .customerId(customerId)
                .customerCode(customer.getCustomerCode())
                .customerName(customer.getCustomerName())
                .fromDate(fromDate)
                .toDate(toDate)
                .openingBalance(openingBalance)
                .invoiceAmount(invoiceAmount)
                .receiptAmount(receiptAmount)
                .closingBalance(closingBalance)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerLedgerResponse getCustomerTransactions(UUID customerId, LocalDate fromDate, LocalDate toDate) {
        return getCustomerLedger(customerId, fromDate, toDate);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByGstin(String gstin) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        Customer customer = customerRepository.findByGstinAndCompanyId(gstin, companyId)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with GSTIN: " + gstin));
        return enrichCustomerResponse(customerMapper.entityToResponse(customer), customer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByPan(String pan) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        Customer customer = customerRepository.findByPanNoAndCompanyId(pan, companyId)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with PAN: " + pan));
        return enrichCustomerResponse(customerMapper.entityToResponse(customer), customer);
    }

    private Customer getCustomerEntityById(UUID customerId) {
        if (TenantUtils.isSystemAdmin()) {
            return customerRepository.findByIdAndIsDeletedFalse(customerId)
                    .orElseThrow(() -> CustomerNotFoundException.byId(customerId));
        } else {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            return customerRepository.findByIdAndCompanyIdAndIsDeletedFalse(customerId, companyId)
                    .orElseThrow(() -> CustomerNotFoundException.byId(customerId));
        }
    }

    private CustomerResponse enrichCustomerResponse(CustomerResponse response, Customer customer) {
        BigDecimal outstanding = customerRepository.getOutstandingAmount(customer.getId());
        BigDecimal availableCredit = customerLedgerHelper.calculateAvailableCredit(customer);
        long invoiceCount = customerRepository.countInvoices(customer.getId());
        long receiptCount = customerRepository.countReceipts(customer.getId());

        response.setOutstandingBalance(outstanding);
        response.setAvailableCredit(availableCredit);
        response.setTotalInvoices(invoiceCount);
        response.setTotalReceipts(receiptCount);
        response.setAddresses(getAddressResponses(customer));
        return response;
    }

    private void enrichCustomerProfile(CustomerProfileResponse profile, Customer customer) {
        UUID companyId = customer.getCompany().getId();
        UUID customerId = customer.getId();

        // 1. Ledger Information
        BigDecimal outstanding = profile.getOutstandingBalance() != null ? profile.getOutstandingBalance()
                : BigDecimal.ZERO;
        CustomerLedgerInfoDto ledgerInfo = CustomerLedgerInfoDto.builder()
                .creditLimit(customer.getCreditLimit() != null ? customer.getCreditLimit() : BigDecimal.ZERO)
                .availableCredit(profile.getAvailableCredit() != null ? profile.getAvailableCredit() : BigDecimal.ZERO)
                .currentBalance(outstanding)
                .openingBalance(BigDecimal.ZERO)
                .closingBalance(outstanding)
                .build();
        profile.setLedgerInformation(ledgerInfo);

        // 2. Sales Invoices
        java.util.List<SalesInvoice> invoices = salesInvoiceRepository.findByCustomerIdAndCompanyIdAndIsDeletedFalse(
                customerId, companyId, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "invoiceDate"))).getContent();

        java.util.List<CustomerInvoiceDto> invoiceDtos = invoices.stream().map(inv -> CustomerInvoiceDto.builder()
                .invoiceId(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .invoiceDate(inv.getInvoiceDate())
                .dueDate(inv.getDueDate())
                .invoiceAmount(inv.getTotalAmount())
                .paidAmount(inv.getReceivedAmount())
                .pendingAmount(inv.getOutstandingAmount())
                .status(inv.getStatus() != null ? inv.getStatus().name() : null)
                .build()).collect(Collectors.toList());
        profile.setSalesInvoices(invoiceDtos);

        // 3. Receipts
        java.util.List<ReceiptVoucher> receipts = receiptVoucherRepository
                .findByCustomerIdAndCompanyIdAndIsDeletedFalse(
                        customerId, companyId, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "receiptDate")))
                .getContent();

        java.util.List<CustomerReceiptDto> receiptDtos = receipts.stream().map(rec -> CustomerReceiptDto.builder()
                .receiptId(rec.getId())
                .receiptNumber(rec.getReceiptNo())
                .receiptDate(rec.getReceiptDate())
                .amount(rec.getReceiptAmount())
                .paymentMode(rec.getPaymentMode() != null ? rec.getPaymentMode().name() : null)
                .referenceNumber(rec.getReferenceNo())
                .build()).collect(Collectors.toList());
        profile.setReceipts(receiptDtos);

        // 4. Outstanding Details & Ageing
        BigDecimal overdue = salesInvoiceRepository.sumOverdueAmountByCustomerAndCompany(customerId, companyId,
                LocalDate.now());
        if (overdue == null)
            overdue = BigDecimal.ZERO;

        CustomerOutstandingDto outstandingDto = CustomerOutstandingDto.builder()
                .totalOutstanding(outstanding)
                .overdueAmount(overdue)
                .notYetDueAmount(outstanding.subtract(overdue).max(BigDecimal.ZERO))
                .ageingSummary(new java.util.HashMap<>()) // placeholder for detailed buckets
                .build();
        profile.setOutstandingDetails(outstandingDto);

        // 5. Recent Transactions & Ledger Entries
        java.util.List<CustomerTransactionDto> transactions = new ArrayList<>();
        for (CustomerInvoiceDto inv : invoiceDtos) {
            transactions.add(CustomerTransactionDto.builder()
                    .date(inv.getInvoiceDate())
                    .transactionType("INVOICE")
                    .referenceNumber(inv.getInvoiceNumber())
                    .amount(inv.getInvoiceAmount())
                    .status(inv.getStatus())
                    .build());
        }
        for (CustomerReceiptDto rec : receiptDtos) {
            transactions.add(CustomerTransactionDto.builder()
                    .date(rec.getReceiptDate())
                    .transactionType("RECEIPT")
                    .referenceNumber(rec.getReceiptNumber())
                    .amount(rec.getAmount())
                    .status("COMPLETED")
                    .build());
        }
        transactions.sort(Comparator.comparing(CustomerTransactionDto::getDate).reversed());
        profile.setRecentTransactions(transactions.stream().limit(20).collect(Collectors.toList()));

        // Ledger Entries
        java.util.List<CustomerLedgerEntryDto> entries = new ArrayList<>();
        BigDecimal runningBalance = BigDecimal.ZERO;
        java.util.List<CustomerTransactionDto> ascTransactions = new ArrayList<>(transactions);
        ascTransactions.sort(Comparator.comparing(CustomerTransactionDto::getDate));
        for (CustomerTransactionDto tx : ascTransactions) {
            CustomerLedgerEntryDto entry = CustomerLedgerEntryDto.builder()
                    .date(tx.getDate())
                    .voucherType(tx.getTransactionType())
                    .voucherNumber(tx.getReferenceNumber())
                    .debit(tx.getTransactionType().equals("INVOICE") ? tx.getAmount() : BigDecimal.ZERO)
                    .credit(tx.getTransactionType().equals("RECEIPT") ? tx.getAmount() : BigDecimal.ZERO)
                    .build();
            runningBalance = runningBalance.add(entry.getDebit()).subtract(entry.getCredit());
            entry.setBalance(runningBalance);
            entries.add(entry);
        }
        java.util.Collections.reverse(entries); // newest first
        profile.setLedgerEntries(entries);

        // 6. Statistics
        BigDecimal totalSales = salesInvoiceRepository.sumTotalAmountByCustomerAndCompany(customerId, companyId);
        BigDecimal totalReceipts = salesInvoiceRepository.sumReceivedAmountByCustomerAndCompany(customerId, companyId);

        CustomerStatisticsDto stats = CustomerStatisticsDto.builder()
                .totalSales(totalSales != null ? totalSales : BigDecimal.ZERO)
                .totalReceipts(totalReceipts != null ? totalReceipts : BigDecimal.ZERO)
                .totalPending(outstanding)
                .totalInvoices(profile.getTotalInvoices())
                .averagePaymentDays(0)
                .lastInvoiceDate(invoiceDtos.isEmpty() ? null : invoiceDtos.get(0).getInvoiceDate())
                .lastPaymentDate(receiptDtos.isEmpty() ? null : receiptDtos.get(0).getReceiptDate())
                .build();
        profile.setStatistics(stats);

        // 7. Contacts & Addresses
        CustomerContactDto contact = CustomerContactDto.builder()
                .contactPerson(customer.getCustomerName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .build();
        profile.setContacts(java.util.Collections.singletonList(contact));

        profile.setAddresses(getAddressResponses(customer));

        // 8. Audit Info
        CustomerAuditInfoDto auditInfo = CustomerAuditInfoDto.builder()
                .createdBy(customer.getCreatedBy())
                .createdAt(customer.getCreatedAt())
                .updatedBy(customer.getUpdatedBy())
                .updatedAt(customer.getUpdatedAt())
                .build();
        profile.setAuditInformation(auditInfo);
    }

    private String generateUniqueCustomerCode(UUID companyId) {
        String code;

        do {
            code = "CUST-" + UUID.randomUUID()
                    .toString()
                    .substring(0, 8)
                    .toUpperCase();
        } while (customerRepository.existsByCustomerCodeAndCompany_Id(code, companyId));

        return code;
    }

    private void synchronizeAddresses(Customer customer, java.util.List<CustomerAddressRequest> requests) {
        if (requests == null) {
            return;
        }

        long defaultCount = requests.stream()
                .filter(request -> Boolean.TRUE.equals(request.getIsDefault()))
                .count();
        if (defaultCount > 1) {
            throw new InvalidCustomerException("A customer can have only one default address");
        }

        long distinctAddressTypes = requests.stream()
                .map(CustomerAddressRequest::getAddressType)
                .filter(java.util.Objects::nonNull)
                .map(String::trim)
                .map(String::toUpperCase)
                .distinct()
                .count();
        if (distinctAddressTypes != requests.size()) {
            throw new InvalidCustomerException("Address type must be unique for a customer");
        }

        if (customer.getAddresses() == null) {
            customer.setAddresses(new ArrayList<>());
        }

        java.util.Map<String, CustomerAddress> existingByType = customer.getAddresses().stream()
                .filter(address -> !Boolean.TRUE.equals(address.getIsDeleted()))
                .filter(address -> address.getAddressType() != null)
                .collect(Collectors.toMap(address -> address.getAddressType().trim().toUpperCase(), address -> address,
                        (first, second) -> first));
        java.util.Set<String> retainedTypes = requests.stream()
                .map(CustomerAddressRequest::getAddressType)
                .filter(java.util.Objects::nonNull)
                .map(String::trim)
                .map(String::toUpperCase)
                .collect(Collectors.toSet());

        for (CustomerAddress address : customer.getAddresses()) {
            String addressType = address.getAddressType() == null ? null
                    : address.getAddressType().trim().toUpperCase();
            if (!retainedTypes.contains(addressType) && !Boolean.TRUE.equals(address.getIsDeleted())) {
                address.setIsDeleted(true);
                address.setIsActive(false);
                address.setIsDefault(false);
            }
        }

        for (CustomerAddressRequest request : requests) {
            String addressType = request.getAddressType().trim().toUpperCase();
            CustomerAddress address = existingByType.get(addressType);
            if (address == null) {
                address = new CustomerAddress();
                customer.getAddresses().add(address);
            }
            address.setCustomer(customer);

            GstStateCode gstState = request.getGstStateId() == null ? null
                    : gstStateCodeRepository.findById(request.getGstStateId())
                            .filter(state -> !Boolean.TRUE.equals(state.getIsDeleted()))
                            .orElseThrow(() -> new InvalidCustomerException(
                                    "GST state not found: " + request.getGstStateId()));

            address.setAddressType(request.getAddressType());
            address.setAddressLine1(request.getAddressLine1());
            address.setAddressLine2(request.getAddressLine2());
            address.setGstState(gstState);
            address.setCity(request.getCity());
            address.setCountry(request.getCountry());
            address.setPostalCode(request.getPostalCode());
            address.setIsDefault(Boolean.TRUE.equals(request.getIsDefault()));
            address.setIsActive(request.getIsActive() == null || Boolean.TRUE.equals(request.getIsActive()));
            address.setIsDeleted(false);
        }

        if (defaultCount == 1) {
            CustomerAddress selectedDefault = customer.getAddresses().stream()
                    .filter(address -> retainedTypes.contains(address.getAddressType() == null ? null
                            : address.getAddressType().trim().toUpperCase()))
                    .filter(address -> Boolean.TRUE.equals(address.getIsDefault()))
                    .findFirst()
                    .orElse(null);
            for (CustomerAddress address : customer.getAddresses()) {
                if (address != selectedDefault) {
                    address.setIsDefault(false);
                }
            }
        }
    }

    private java.util.List<CustomerAddressResponse> getAddressResponses(Customer customer) {
        if (customer.getAddresses() == null) {
            return java.util.Collections.emptyList();
        }
        return customer.getAddresses().stream()
                .filter(address -> !Boolean.TRUE.equals(address.getIsDeleted()))
                .map(customerMapper::addressEntityToResponse)
                .collect(Collectors.toList());
    }
}
