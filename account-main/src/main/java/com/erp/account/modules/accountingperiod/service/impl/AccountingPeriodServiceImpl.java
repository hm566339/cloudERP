package com.erp.account.modules.accountingperiod.service.impl;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodResponse;
import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.BusinessException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.common.exception.UnauthorizedException;
import com.erp.account.enums.AccountNature;
import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodCreateRequest;
import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodFilterDto;
import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodRequest;
import com.erp.account.modules.accountingperiod.dto.response.*;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus;
import com.erp.account.modules.accountingperiod.enums.PeriodType;
import com.erp.account.modules.accountingperiod.mapper.AccountingPeriodMapper;
import com.erp.account.modules.accountingperiod.repository.AccountingPeriodRepository;
import com.erp.account.modules.accountingperiod.service.AccountingPeriodService;
import com.erp.account.modules.accountingperiod.specification.AccountingPeriodSpecification;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.fiscalyear.repository.FiscalYearRepository;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AccountingPeriodServiceImpl implements AccountingPeriodService {

        private final FiscalYearRepository fiscalYearRepository;
        private final AccountingPeriodRepository accountingPeriodRepository;
        private final CompanyRepository companyRepository;
        private final AccountingPeriodMapper accountingPeriodMapper;
        private final SalesInvoiceRepository salesInvoiceRepository;
        private final ApInvoiceRepository apInvoiceRepository;
        private final ReceiptVoucherRepository receiptVoucherRepository;
        private final PaymentVoucherRepository paymentVoucherRepository;
        private final GlJournalEntryRepository glJournalEntryRepository;

        @Override
        public PostResponse createAccountingPeriod(
                        RequestWrapper<AccountingPeriodRequest> requestWrapper,
                        UUID fiscalYearId) {

                AccountingPeriodRequest request = requestWrapper.unwrap();
                log.info("Creating custom accounting period for fiscal year ID: {}", fiscalYearId);

                FiscalYear fiscalYear = loadFiscalYear(fiscalYearId);
                validateFiscalYearOpen(fiscalYear);
                validateDateRange(request.getStartDate(), request.getEndDate());
                validatePeriodWithinFiscalYear(fiscalYear, request);
                validatePeriodUniqueness(fiscalYear, request);

                AccountingPeriod accountingPeriod = accountingPeriodMapper.toEntity(request);
                accountingPeriod.setFiscalYear(fiscalYear);
                accountingPeriod.setCompany(fiscalYear.getCompany());
                accountingPeriod.setPeriodType(PeriodType.CUSTOM);
                accountingPeriod.setPeriodNumber(determineNextPeriodNumber(fiscalYear));
                accountingPeriod.setStatus(AccountingPeriodStatus.OPEN);

                AccountingPeriod savedAccountingPeriod = accountingPeriodRepository.save(accountingPeriod);

                log.info("Accounting period created successfully with ID: {}", savedAccountingPeriod.getId());

                return PostResponse.builder()
                                .message("Accounting period created successfully" + savedAccountingPeriod.getId())
                                .build();
        }

        @Transactional
        public AccountingPeriodCreateResponse createAccountingPeriodsFromPreset(
                        RequestWrapper<AccountingPeriodCreateRequest> requestWrapper) {

                AccountingPeriodCreateRequest request = requestWrapper.unwrap();
                log.info("Creating accounting periods from period type {} for fiscal year ID: {}", request.getPeriodType(), request.getFiscalYearId());

                FiscalYear fiscalYear = loadFiscalYear(request.getFiscalYearId());
                validateFiscalYearOpen(fiscalYear);

                if (request.getPeriodType() == PeriodType.CUSTOM) {
                        if (request.getCustomPeriods() == null || request.getCustomPeriods().isEmpty()) {
                                throw new BadRequestException("At least one custom accounting period is required for CUSTOM period type");
                        }
                        return createCustomPeriods(fiscalYear, request);
                }

                return createPresetPeriods(fiscalYear, request);
        }

        @Override
        @Transactional(propagation = Propagation.MANDATORY)
        public AccountingPeriodCreateResponse createAccountingPeriodsForFiscalYear(FiscalYear fiscalYear, PeriodType periodType) {
                log.info("Creating accounting periods for fiscal year ID: {} using period type {}", fiscalYear.getId(), periodType);
                validateFiscalYearOpen(fiscalYear);
                return createPresetPeriods(fiscalYear, periodType);
        }

        @Override
        public PostResponse updateAccountingPeriod(RequestWrapper<AccountingPeriodRequest> requestWrapper,
                        UUID accountingPeriodId) {
                AccountingPeriodRequest request = requestWrapper.unwrap();
                log.info("Updating accounting period with ID: {}", accountingPeriodId);

                AccountingPeriod existingAccountingPeriod = accountingPeriodRepository.findById(accountingPeriodId)
                                .orElseThrow(() -> {
                                        log.error("Accounting period not found with ID: {}", accountingPeriodId);
                                        return new ResourceNotFoundException(
                                                         "Accounting period not found with ID: " + accountingPeriodId);
                                });

                if (!TenantUtils.isSystemAdmin()) {
                        UUID companyId = TenantUtils.getCurrentCompanyId();
                        if (existingAccountingPeriod.getCompany() == null || !existingAccountingPeriod.getCompany().getId().equals(companyId)) {
                                throw new UnauthorizedException("Unauthorized access to accounting period");
                        }
                }

                validateFiscalYearOpen(existingAccountingPeriod.getFiscalYear());
                validateDateRange(request.getStartDate(), request.getEndDate());
                validatePeriodWithinFiscalYear(existingAccountingPeriod.getFiscalYear(), request);
                validatePeriodUniqueness(existingAccountingPeriod.getFiscalYear(), request, existingAccountingPeriod.getId());

                accountingPeriodMapper.updateEntity(request, existingAccountingPeriod);
                AccountingPeriod updatedAccountingPeriod = accountingPeriodRepository.save(existingAccountingPeriod);

                log.info(
                                "Accounting period updated successfully with ID: {}",
                                updatedAccountingPeriod.getId());

                return PostResponse.builder()
                                .message("Accounting period updated successfully" + updatedAccountingPeriod.getId())
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        public AccountingPeriodProfileResponse getAccountingPeriodById(UUID accountingPeriodId) {
                log.info("Retrieving accounting period with ID: {}", accountingPeriodId);

                AccountingPeriod accountingPeriod;
                if (TenantUtils.isSystemAdmin()) {
                        accountingPeriod = accountingPeriodRepository.findById(accountingPeriodId)
                                        .orElseThrow(() -> {
                                                log.error("Accounting period not found with ID: {}", accountingPeriodId);
                                                return new ResourceNotFoundException(
                                                                "Accounting period not found with ID: " + accountingPeriodId);
                                        });
                } else {
                        UUID companyId = TenantUtils.getCurrentCompanyId();
                        accountingPeriod = accountingPeriodRepository.findByIdAndCompanyId(accountingPeriodId, companyId)
                                        .orElseThrow(() -> {
                                                log.error("Accounting period not found with ID: {} for company: {}", accountingPeriodId, companyId);
                                                return new ResourceNotFoundException(
                                                                "Accounting period not found with ID: " + accountingPeriodId);
                                        });
                }

                log.info("Accounting period retrieved successfully with ID: {}", accountingPeriod.getId());

                AccountingPeriodProfileResponse profile = new AccountingPeriodProfileResponse();
                org.springframework.beans.BeanUtils.copyProperties(accountingPeriodMapper.toResponse(accountingPeriod), profile);
                
                enrichAccountingPeriodProfile(profile, accountingPeriod);

                return profile;
        }

        private void enrichAccountingPeriodProfile(AccountingPeriodProfileResponse profile, AccountingPeriod period) {
                UUID companyId = period.getCompany().getId();
                LocalDate startDate = period.getStartDate();
                LocalDate endDate = period.getEndDate();

                // Fiscal Year Info
                if (period.getFiscalYear() != null) {
                        profile.setFiscalYearInformation(ApFiscalYearInfoDto.builder()
                                .fiscalYearId(period.getFiscalYear().getId())
                                .fiscalYearName(period.getFiscalYear().getFiscalYear())
                                .financialYearStartDate(period.getFiscalYear().getStartDate())
                                .financialYearEndDate(period.getFiscalYear().getEndDate())
                                .currentStatus(period.getFiscalYear().getStatus().name())
                                .build());
                }

                // Fetch Related Entities in Date Range
                List<SalesInvoice> salesInvoices = salesInvoiceRepository.findByDateRangeAndCompany(companyId, startDate, endDate);
                List<ApInvoice> purchaseInvoices = apInvoiceRepository.findInvoicesByDateRange(companyId, startDate, endDate, Pageable.unpaged()).getContent();
                List<ReceiptVoucher> receipts = receiptVoucherRepository.findByReceiptDateBetween(startDate, endDate)
                                .stream()
                                .filter(r -> r.getCompany() != null && companyId.equals(r.getCompany().getId()))
                                .collect(java.util.stream.Collectors.toList());
                List<PaymentVoucher> payments = paymentVoucherRepository.findByVoucherDateBetween(startDate, endDate)
                                .stream()
                                .filter(p -> p.getCompany() != null && companyId.equals(p.getCompany().getId()))
                                .collect(java.util.stream.Collectors.toList());
                
                List<GlJournalEntry> journalEntries = glJournalEntryRepository.findByAccountingPeriod(period.getId(), Pageable.unpaged()).getContent();

                // Mappings
                List<ApSalesTransactionDto> salesTx = salesInvoices.stream().map(inv -> ApSalesTransactionDto.builder()
                        .invoiceId(inv.getId())
                        .invoiceNumber(inv.getInvoiceNumber())
                        .customerName(inv.getCustomer() != null ? inv.getCustomer().getCustomerName() : "Unknown")
                        .invoiceDate(inv.getInvoiceDate())
                        .invoiceAmount(inv.getTotalAmount())
                        .status(inv.getStatus().name())
                        .build()).collect(java.util.stream.Collectors.toList());

                List<ApPurchaseTransactionDto> purchaseTx = purchaseInvoices.stream().map(inv -> ApPurchaseTransactionDto.builder()
                        .invoiceId(inv.getId())
                        .invoiceNumber(inv.getInvoiceNo())
                        .vendorName(inv.getVendor() != null ? inv.getVendor().getVendorName() : "Unknown")
                        .invoiceDate(inv.getInvoiceDate())
                        .invoiceAmount(inv.getTotalAmount())
                        .status(inv.getStatus().name())
                        .build()).collect(java.util.stream.Collectors.toList());
                        
                List<ApReceiptPaymentDto> receiptPaymentTx = new ArrayList<>();
                receipts.forEach(r -> receiptPaymentTx.add(ApReceiptPaymentDto.builder()
                        .voucherId(r.getId())
                        .voucherNumber(r.getReceiptNo())
                        .voucherType("RECEIPT")
                        .date(r.getReceiptDate())
                        .partyName(r.getCustomer() != null ? r.getCustomer().getCustomerName() : "Unknown")
                        .amount(r.getReceiptAmount() != null ? r.getReceiptAmount() : BigDecimal.ZERO)
                        .paymentMode(r.getPaymentMode() != null ? r.getPaymentMode().name() : "N/A")
                        .build()));
                payments.forEach(p -> receiptPaymentTx.add(ApReceiptPaymentDto.builder()
                        .voucherId(p.getId())
                        .voucherNumber(p.getVoucherNo())
                        .voucherType("PAYMENT")
                        .date(p.getVoucherDate())
                        .partyName(p.getVendor() != null ? p.getVendor().getVendorName() : "Unknown")
                        .amount(p.getPaymentAmount() != null ? p.getPaymentAmount() : BigDecimal.ZERO)
                        .paymentMode(p.getPaymentMode() != null ? p.getPaymentMode().name() : "N/A")
                        .build()));
                        
                List<ApJournalEntryDto> journalTx = journalEntries.stream().map(j -> ApJournalEntryDto.builder()
                        .journalId(j.getId())
                        .voucherNumber(j.getVoucherNo())
                        .voucherType(j.getSourceModule() != null ? j.getSourceModule().name() : "MANUAL")
                        .transactionDate(j.getVoucherDate())
                        .totalDebit(j.getTotalDebit())
                        .totalCredit(j.getTotalCredit())
                        .status(j.getStatus().name())
                        .build()).collect(java.util.stream.Collectors.toList());

                profile.setSalesTransactions(salesTx);
                profile.setPurchaseTransactions(purchaseTx);
                profile.setReceiptsAndPayments(receiptPaymentTx);
                profile.setJournalEntries(journalTx);

                // Summary Counts
                profile.setPeriodSummary(ApPeriodSummaryDto.builder()
                        .totalJournalEntries(journalEntries.size())
                        .totalSalesInvoices(salesInvoices.size())
                        .totalPurchaseBills(purchaseInvoices.size())
                        .totalReceipts(receipts.size())
                        .totalPayments(payments.size())
                        .totalCreditNotes(0)
                        .totalDebitNotes(0)
                        .build());

                // Financial & Trial Balance Calculation
                BigDecimal totalRevenue = BigDecimal.ZERO;
                BigDecimal totalExpenses = BigDecimal.ZERO;
                BigDecimal totalAssets = BigDecimal.ZERO;
                BigDecimal totalLiabilities = BigDecimal.ZERO;
                
                BigDecimal tbDebit = BigDecimal.ZERO;
                BigDecimal tbCredit = BigDecimal.ZERO;

                for (GlJournalEntry je : journalEntries) {
                        if ("POSTED".equals(je.getStatus().name())) {
                                tbDebit = tbDebit.add(je.getTotalDebit() != null ? je.getTotalDebit() : BigDecimal.ZERO);
                                tbCredit = tbCredit.add(je.getTotalCredit() != null ? je.getTotalCredit() : BigDecimal.ZERO);
                                // Since AccountNature only has DEBIT/CREDIT:
                                // DEBIT nature (Assets, Expenses) → accumulate debit-side amounts
                                // CREDIT nature (Liabilities, Income) → accumulate credit-side amounts
                                if (je.getJournalLines() != null) {
                                        for (GlJournalLine jl : je.getJournalLines()) {
                                                if (jl.getAccount() != null && jl.getAccount().getAccountType() != null) {
                                                        AccountNature nature = jl.getAccount().getAccountType();
                                                        BigDecimal dr = jl.getDebitAmount() != null ? jl.getDebitAmount() : BigDecimal.ZERO;
                                                        BigDecimal cr = jl.getCreditAmount() != null ? jl.getCreditAmount() : BigDecimal.ZERO;
                                                        
                                                        if (AccountNature.CREDIT.equals(nature)) {
                                                                // CREDIT nature = Liabilities + Income
                                                                totalRevenue = totalRevenue.add(cr).subtract(dr);
                                                                totalLiabilities = totalLiabilities.add(cr);
                                                        } else if (AccountNature.DEBIT.equals(nature)) {
                                                                // DEBIT nature = Assets + Expenses
                                                                totalExpenses = totalExpenses.add(dr).subtract(cr);
                                                                totalAssets = totalAssets.add(dr);
                                                        }
                                                }
                                        }
                                }
                        }
                }
                
                BigDecimal grossProfit = totalRevenue.subtract(totalExpenses);
                BigDecimal netProfit = grossProfit;

                profile.setFinancialSummary(ApFinancialSummaryDto.builder()
                        .totalRevenue(totalRevenue)
                        .totalExpenses(totalExpenses)
                        .grossProfit(grossProfit)
                        .netProfit(netProfit)
                        .totalAssets(totalAssets)
                        .totalLiabilities(totalLiabilities)
                        .openingBalance(BigDecimal.ZERO)
                        .closingBalance(BigDecimal.ZERO)
                        .build());

                profile.setTrialBalanceSummary(ApTrialBalanceSummaryDto.builder()
                        .totalDebit(tbDebit)
                        .totalCredit(tbCredit)
                        .difference(tbDebit.subtract(tbCredit).abs())
                        .build());

                // Statistics
                BigDecimal salesAmount = salesInvoices.stream().map(s -> s.getTotalAmount() != null ? s.getTotalAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal purchasesAmount = purchaseInvoices.stream().map(p -> p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal receiptsAmount = receipts.stream().map(r -> r.getReceiptAmount() != null ? r.getReceiptAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal paymentsAmount = payments.stream().map(p -> p.getPaymentAmount() != null ? p.getPaymentAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
                
                LocalDate lastDate = journalEntries.stream().map(GlJournalEntry::getVoucherDate).filter(java.util.Objects::nonNull).max(LocalDate::compareTo).orElse(null);

                profile.setStatistics(ApStatisticsDto.builder()
                        .totalTransactions(journalEntries.size())
                        .totalVouchers(salesInvoices.size() + purchaseInvoices.size() + receipts.size() + payments.size())
                        .totalSales(salesAmount)
                        .totalPurchases(purchasesAmount)
                        .totalReceipts(receiptsAmount)
                        .totalPayments(paymentsAmount)
                        .lastTransactionDate(lastDate)
                        .build());
                        
                // Recent Transactions
                List<ApRecentTransactionDto> recentTx = new ArrayList<>();
                salesTx.forEach(s -> recentTx.add(ApRecentTransactionDto.builder().transactionId(s.getInvoiceId()).transactionType("SALES_INVOICE").voucherNumber(s.getInvoiceNumber()).transactionDate(s.getInvoiceDate()).partyName(s.getCustomerName()).amount(s.getInvoiceAmount()).status(s.getStatus()).build()));
                purchaseTx.forEach(p -> recentTx.add(ApRecentTransactionDto.builder().transactionId(p.getInvoiceId()).transactionType("PURCHASE_INVOICE").voucherNumber(p.getInvoiceNumber()).transactionDate(p.getInvoiceDate()).partyName(p.getVendorName()).amount(p.getInvoiceAmount()).status(p.getStatus()).build()));
                receiptPaymentTx.forEach(rp -> recentTx.add(ApRecentTransactionDto.builder().transactionId(rp.getVoucherId()).transactionType(rp.getVoucherType()).voucherNumber(rp.getVoucherNumber()).transactionDate(rp.getDate()).partyName(rp.getPartyName()).amount(rp.getAmount()).status("N/A").build()));
                
                recentTx.sort((a, b) -> {
                        if (a.getTransactionDate() == null && b.getTransactionDate() == null) return 0;
                        if (a.getTransactionDate() == null) return 1;
                        if (b.getTransactionDate() == null) return -1;
                        return b.getTransactionDate().compareTo(a.getTransactionDate());
                });
                
                profile.setRecentTransactions(recentTx.stream().limit(20).collect(java.util.stream.Collectors.toList()));
                
                profile.setAuditInformation(ApAuditInfoDto.builder()
                        .createdBy(period.getCreatedBy())
                        .createdAt(period.getCreatedAt())
                        .updatedBy(period.getUpdatedBy())
                        .updatedAt(period.getUpdatedAt())
                        .build());
        }

        @Override
        public AccountingPeriodResponseList getAllAccountingPeriods(
                        AccountingPeriodFilterDto filter,
                        Pageable pageable) {

                log.info("Get Accounting Periods with pagination and filter");

                Specification<AccountingPeriod> spec = AccountingPeriodSpecification.getFilterSpecification(filter);

                Page<AccountingPeriod> accountingPeriodPage = accountingPeriodRepository.findAll(spec, pageable);

                List<AccountingPeriodResponse> accountingPeriodResponses = new ArrayList<>();
                for (AccountingPeriod ap : accountingPeriodPage.getContent()) {
                        AccountingPeriodResponse response = accountingPeriodMapper.toResponse(ap);
                        accountingPeriodResponses.add(response);
                }

                PaginationResponse paginationResponse = PaginationResponse.builder()
                                .page(accountingPeriodPage.getNumber() + 1)
                                .size(accountingPeriodPage.getSize())
                                .totalPages(accountingPeriodPage.getTotalPages())
                                .totalElements(accountingPeriodPage.getTotalElements())
                                .first(accountingPeriodPage.isFirst())
                                .last(accountingPeriodPage.isLast())
                                .build();

                return AccountingPeriodResponseList.builder()
                                .accountingPeriods(accountingPeriodResponses)
                                .pagination(paginationResponse)
                                .build();
        }

        @Override
        public PostResponse deleteAccountingPeriod(UUID accountingPeriodId) {
                log.info("Deleting accounting period with ID: {}", accountingPeriodId);

                AccountingPeriod accountingPeriod = accountingPeriodRepository.findById(accountingPeriodId)
                                .orElseThrow(() -> {
                                        log.error("Accounting period not found with ID: {}", accountingPeriodId);
                                        return new ResourceNotFoundException(
                                                         "Accounting period not found with ID: " + accountingPeriodId);
                                });

                if (!TenantUtils.isSystemAdmin()) {
                        UUID companyId = TenantUtils.getCurrentCompanyId();
                        if (accountingPeriod.getCompany() == null || !accountingPeriod.getCompany().getId().equals(companyId)) {
                                throw new UnauthorizedException("Unauthorized access to accounting period");
                        }
                }

                throw new BusinessException("Accounting periods cannot be deleted as they are part of the accounting lifecycle and may be referenced by journal entries.");
        }

        @Override
        public PostResponse toggleAccountingPeriodStatus(UUID accountingPeriodId) {
                log.info("Toggling status of accounting period with ID: {}", accountingPeriodId);

                AccountingPeriod accountingPeriod = accountingPeriodRepository.findById(accountingPeriodId)
                                .orElseThrow(() -> {
                                        log.error("Accounting period not found with ID: {}", accountingPeriodId);
                                        return new ResourceNotFoundException(
                                                         "Accounting period not found with ID: " + accountingPeriodId);
                                });

                if (!TenantUtils.isSystemAdmin()) {
                        UUID companyId = TenantUtils.getCurrentCompanyId();
                        if (accountingPeriod.getCompany() == null || !accountingPeriod.getCompany().getId().equals(companyId)) {
                                throw new UnauthorizedException("Unauthorized access to accounting period");
                        }
                }

                accountingPeriod.setStatus(determineNextPeriodStatus(accountingPeriod.getStatus()));
                AccountingPeriod updatedAccountingPeriod = accountingPeriodRepository.save(accountingPeriod);

                log.info(
                                "Accounting period status toggled successfully with ID: {}",
                                updatedAccountingPeriod.getId());

                return PostResponse.builder()
                                .message("Accounting period status toggled successfully"
                                                 + updatedAccountingPeriod.getId())
                                .build();
        }

        private FiscalYear loadFiscalYear(UUID fiscalYearId) {
                FiscalYear fiscalYear = fiscalYearRepository.findById(fiscalYearId)
                                .orElseThrow(() -> {
                                        log.error("Fiscal year not found with ID: {}", fiscalYearId);
                                        return new ResourceNotFoundException("Fiscal year not found with ID: " + fiscalYearId);
                                });

                if (!TenantUtils.isSystemAdmin()) {
                        UUID companyId = TenantUtils.getCurrentCompanyId();
                        if (fiscalYear.getCompany() == null || !fiscalYear.getCompany().getId().equals(companyId)) {
                                throw new UnauthorizedException("Unauthorized access to fiscal year");
                        }
                }
                return fiscalYear;
        }

        private void validateFiscalYearOpen(FiscalYear fiscalYear) {
                if (fiscalYear.getIsClosed()) {
                        throw new ValidationException("Cannot create or update accounting period for a closed fiscal year");
                }
        }

        private void validateDateRange(LocalDate startDate, LocalDate endDate) {
                if (startDate == null || endDate == null) {
                        throw new BadRequestException("Start date and end date are required");
                }
                if (!startDate.isBefore(endDate)) {
                        throw new ValidationException("Start date must be before end date");
                }
        }

        private void validatePeriodWithinFiscalYear(FiscalYear fiscalYear, AccountingPeriodRequest request) {
                if (fiscalYear.getStartDate() == null || fiscalYear.getEndDate() == null) {
                        return;
                }

                if (request.getStartDate().isBefore(fiscalYear.getStartDate())
                                || request.getEndDate().isAfter(fiscalYear.getEndDate())) {
                        throw new ValidationException("Accounting period dates must fall completely within the fiscal year range");
                }
        }

        private void validatePeriodUniqueness(FiscalYear fiscalYear, AccountingPeriodRequest request) {
                validatePeriodUniqueness(fiscalYear, request, null);
        }

        private void validatePeriodUniqueness(FiscalYear fiscalYear, AccountingPeriodRequest request, UUID ignoreId) {
                List<AccountingPeriod> existingPeriods = accountingPeriodRepository.findAllByCompanyIdAndFiscalYearId(
                                fiscalYear.getCompany().getId(), fiscalYear.getId());

                boolean duplicateName = existingPeriods.stream()
                                .filter(period -> ignoreId == null || !ignoreId.equals(period.getId()))
                                .anyMatch(period -> period.getPeriodName() != null && period.getPeriodName().equalsIgnoreCase(request.getPeriodName()));
                if (duplicateName) {
                        throw new ValidationException("Duplicate period name within the same fiscal year");
                }

                boolean overlap = existingPeriods.stream()
                                .filter(period -> ignoreId == null || !ignoreId.equals(period.getId()))
                                .anyMatch(period -> !(request.getEndDate().isBefore(period.getStartDate()) || request.getStartDate().isAfter(period.getEndDate())));
                if (overlap) {
                        throw new ValidationException("Accounting period dates overlap with an existing period");
                }
        }

        private void validateGeneratedPeriodUniqueness(FiscalYear fiscalYear, AccountingPeriodRequest request) {
                List<AccountingPeriod> existingPeriods = accountingPeriodRepository.findAllByCompanyIdAndFiscalYearId(
                                fiscalYear.getCompany().getId(), fiscalYear.getId());

                boolean duplicateName = existingPeriods.stream()
                                .anyMatch(period -> period.getPeriodName() != null && period.getPeriodName().equalsIgnoreCase(request.getPeriodName()));
                if (duplicateName) {
                        throw new ValidationException("Duplicate period name within the same fiscal year");
                }

                boolean overlap = existingPeriods.stream()
                                .anyMatch(period -> !(request.getEndDate().isBefore(period.getStartDate()) || request.getStartDate().isAfter(period.getEndDate())));
                if (overlap) {
                        throw new ValidationException("Accounting period dates overlap with an existing period");
                }
        }

        private int determineNextPeriodNumber(FiscalYear fiscalYear) {
                return accountingPeriodRepository.findAllByCompanyIdAndFiscalYearId(
                                fiscalYear.getCompany().getId(), fiscalYear.getId())
                                .stream()
                                .map(AccountingPeriod::getPeriodNumber)
                                .filter(number -> number != null)
                                .max(Integer::compareTo)
                                .map(number -> number + 1)
                                .orElse(1);
        }

        private AccountingPeriodCreateResponse createCustomPeriods(FiscalYear fiscalYear, AccountingPeriodCreateRequest request) {
                List<AccountingPeriodResponse> responses = new ArrayList<>();
                int nextPeriodNumber = determineNextPeriodNumber(fiscalYear);
                for (AccountingPeriodRequest customRequest : request.getCustomPeriods()) {
                        validateDateRange(customRequest.getStartDate(), customRequest.getEndDate());
                        validatePeriodUniqueness(fiscalYear, customRequest);
                        AccountingPeriod accountingPeriod = accountingPeriodMapper.toEntity(customRequest);
                        accountingPeriod.setFiscalYear(fiscalYear);
                        accountingPeriod.setCompany(fiscalYear.getCompany());
                        accountingPeriod.setPeriodType(PeriodType.CUSTOM);
                        accountingPeriod.setPeriodNumber(nextPeriodNumber++);
                        accountingPeriod.setStatus(AccountingPeriodStatus.OPEN);
                        accountingPeriodRepository.save(accountingPeriod);
                        responses.add(accountingPeriodMapper.toResponse(accountingPeriod));
                }
                return AccountingPeriodCreateResponse.builder()
                                .fiscalYearId(fiscalYear.getId())
                                .createdCount(responses.size())
                                .periods(responses)
                                .build();
        }

        private AccountingPeriodCreateResponse createPresetPeriods(FiscalYear fiscalYear, AccountingPeriodCreateRequest request) {
                return createPresetPeriods(fiscalYear, request.getPeriodType());
        }

        private AccountingPeriodCreateResponse createPresetPeriods(FiscalYear fiscalYear, PeriodType periodType) {
                List<AccountingPeriodResponse> responses = new ArrayList<>();
                List<AccountingPeriod> existingPeriods = accountingPeriodRepository.findAllByCompanyIdAndFiscalYearId(
                                fiscalYear.getCompany().getId(), fiscalYear.getId());
                if (!existingPeriods.isEmpty()) {
                        throw new ValidationException("Accounting periods already exist for this fiscal year. Preset generation is not allowed for an already populated fiscal year");
                }

                LocalDate startDate = fiscalYear.getStartDate();
                LocalDate endDate = fiscalYear.getEndDate();
                if (startDate == null || endDate == null) {
                        throw new BadRequestException("Fiscal year start and end dates are required for preset generation");
                }

                int count = switch (periodType) {
                        case MONTHLY -> 12;
                        case QUARTERLY -> 4;
                        case HALF_YEARLY -> 2;
                        case YEARLY -> 1;
                        default -> throw new BadRequestException("Unsupported period type");
                };

                LocalDate currentStart = startDate;
                for (int i = 1; i <= count; i++) {
                        LocalDate currentEnd = calculatePeriodEnd(currentStart, periodType, i, fiscalYear, count);
                        AccountingPeriodRequest periodRequest = AccountingPeriodRequest.builder()
                                        .periodName(buildPeriodName(periodType, i, currentStart, fiscalYear))
                                        .startDate(currentStart)
                                        .endDate(currentEnd)
                                        .build();
                        validateGeneratedPeriodUniqueness(fiscalYear, periodRequest);
                        AccountingPeriod accountingPeriod = accountingPeriodMapper.toEntity(periodRequest);
                        accountingPeriod.setFiscalYear(fiscalYear);
                        accountingPeriod.setCompany(fiscalYear.getCompany());
                        accountingPeriod.setPeriodType(periodType);
                        accountingPeriod.setPeriodNumber(i);
                        accountingPeriod.setStatus(AccountingPeriodStatus.OPEN);
                        accountingPeriodRepository.save(accountingPeriod);
                        responses.add(accountingPeriodMapper.toResponse(accountingPeriod));
                        currentStart = currentEnd.plusDays(1);
                }

                return AccountingPeriodCreateResponse.builder()
                                .fiscalYearId(fiscalYear.getId())
                                .createdCount(responses.size())
                                .periods(responses)
                                .build();
        }

        private LocalDate calculatePeriodEnd(LocalDate startDate, PeriodType periodType, int index, FiscalYear fiscalYear, int count) {
                LocalDate fiscalEnd = fiscalYear.getEndDate();
                return switch (periodType) {
                        case MONTHLY -> {
                                LocalDate estimatedEnd = startDate.plusMonths(1).minusDays(1);
                                yield index == count ? fiscalEnd : estimatedEnd;
                        }
                        case QUARTERLY -> {
                                LocalDate estimatedEnd = startDate.plusMonths(3).minusDays(1);
                                yield index == count ? fiscalEnd : estimatedEnd;
                        }
                        case HALF_YEARLY -> {
                                LocalDate estimatedEnd = startDate.plusMonths(6).minusDays(1);
                                yield index == count ? fiscalEnd : estimatedEnd;
                        }
                        case YEARLY -> fiscalEnd;
                        default -> throw new BadRequestException("Unsupported period type");
                };
        }

        private String buildPeriodName(PeriodType periodType, int index, LocalDate startDate, FiscalYear fiscalYear) {
                return switch (periodType) {
                        case MONTHLY -> String.format("%s %d", startDate.getMonth().name().substring(0, 1).toUpperCase() + startDate.getMonth().name().substring(1).toLowerCase(), startDate.getYear());
                        case QUARTERLY -> String.format("Q%d %s", index, buildFiscalYearLabel(fiscalYear));
                        case HALF_YEARLY -> String.format("H%d %s", index, buildFiscalYearLabel(fiscalYear));
                        case YEARLY -> String.format("%s", buildFiscalYearLabel(fiscalYear));
                        default -> throw new BadRequestException("Unsupported period type");
                };
        }

        private String buildFiscalYearLabel(FiscalYear fiscalYear) {
                int startYear = fiscalYear.getStartDate().getYear();
                int endYear = fiscalYear.getEndDate().getYear();
                return String.format("FY%d-%02d", startYear, endYear % 100);
        }

        private AccountingPeriodStatus determineNextPeriodStatus(AccountingPeriodStatus currentStatus) {
                return switch (currentStatus) {
                        case OPEN -> AccountingPeriodStatus.CLOSED;
                        case CLOSED -> AccountingPeriodStatus.LOCKED;
                        case LOCKED -> throw new BusinessException("Locked accounting periods cannot be reopened.");
                };
        }
}
