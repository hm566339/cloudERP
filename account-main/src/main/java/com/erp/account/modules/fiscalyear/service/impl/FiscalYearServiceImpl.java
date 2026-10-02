package com.erp.account.modules.fiscalyear.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodCreateRequest;
import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodRequest;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus;
import com.erp.account.modules.accountingperiod.enums.PeriodType;
import com.erp.account.modules.accountingperiod.repository.AccountingPeriodRepository;
import com.erp.account.modules.accountingperiod.service.AccountingPeriodService;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.enums.AccountNature;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.account.modules.fiscalyear.dto.response.*;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.fiscalyear.dto.request.FiscalYearRequest;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.BusinessException;
import com.erp.account.common.exception.DuplicateResourceException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.UnauthorizedException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.modules.fiscalyear.enums.FiscalYearPreset;
import com.erp.account.modules.fiscalyear.enums.FiscalYearStatus;
import com.erp.account.modules.fiscalyear.mapper.FiscalYearMapper;
import com.erp.account.modules.fiscalyear.dto.request.FiscalYearFilterDto;
import com.erp.account.modules.fiscalyear.specification.FiscalYearSpecification;
import org.springframework.data.jpa.domain.Specification;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.fiscalyear.repository.FiscalYearRepository;
import com.erp.account.modules.fiscalyear.service.FiscalYearService;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class FiscalYearServiceImpl implements FiscalYearService {

    private final FiscalYearRepository fiscalYearRepository;
    private final CompanyRepository companyRepository;
    private final FiscalYearMapper fiscalYearMapper;
    private final AccountingPeriodService accountingPeriodService;
    private final AccountingPeriodRepository accountingPeriodRepository;
    private final SalesInvoiceRepository salesInvoiceRepository;
    private final ApInvoiceRepository apInvoiceRepository;
    private final ReceiptVoucherRepository receiptVoucherRepository;
    private final PaymentVoucherRepository paymentVoucherRepository;
    private final GlJournalEntryRepository glJournalEntryRepository;

    @Override
    @Transactional
    public PostResponse createFiscalYear(RequestWrapper<FiscalYearRequest> fiscalYearRequestWrapper, UUID companyId) {
        FiscalYearRequest fiscalYearRequest = fiscalYearRequestWrapper.unwrap();
        prepareFiscalYearRequest(fiscalYearRequest);

           UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        final UUID targetCompanyId = resolvedCompanyId;
        log.info("Creating fiscal year for company with id: {}", targetCompanyId);

        Company company = companyRepository.findById(targetCompanyId)
                .orElseThrow(() -> {
                    log.error("Company not found with id: {}", targetCompanyId);
                    return new DuplicateResourceException("Company not found with id: " + targetCompanyId);
                });

        FiscalYear fiscalYear = fiscalYearMapper.toEntity(fiscalYearRequest);
        fiscalYear.setCompany(company);
        if (fiscalYear.getStatus() == null) {
            fiscalYear.setStatus(FiscalYearStatus.OPEN);
        }

        validateFiscalYearRules(fiscalYear, null);
        fiscalYear = fiscalYearRepository.save(fiscalYear);

        if (shouldGenerateAccountingPeriods(fiscalYearRequest)) {
            createAccountingPeriodsForFiscalYear(fiscalYear, fiscalYearRequest);
        }

        log.info("Fiscal year created successfully with id: {}", fiscalYear.getId());

        return PostResponse.builder()
                .message("Fiscal year created successfully with id: " + fiscalYear.getId())
                .build();
    }

    @Override
    public PostResponse updateFiscalYear(RequestWrapper<FiscalYearRequest> fiscalYearRequestWrapper, UUID id) {
        FiscalYearRequest fiscalYearRequest = fiscalYearRequestWrapper.unwrap();
        prepareFiscalYearRequest(fiscalYearRequest);
        log.info("Updating fiscal year with id: {}", id);

        FiscalYear fiscalYear = fiscalYearRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Fiscal year not found with id: {}", id);
                    return new ResourceNotFoundException("Fiscal year not found with id: " + id);
                });

        if (!TenantUtils.isSystemAdmin()) {
            UUID resolvedCompanyId = TenantUtils.resolveCompanyId(TenantUtils.getCurrentCompanyId());
            if (fiscalYear.getCompany() == null || !fiscalYear.getCompany().getId().equals(resolvedCompanyId)) {
                throw new UnauthorizedException("Unauthorized access to fiscal year");
            }
        }

        FiscalYearStatus resolvedStatus = resolveRequestedStatus(fiscalYearRequest, fiscalYear);
        fiscalYearMapper.updateEntity(fiscalYearRequest, fiscalYear);
        if (resolvedStatus != null) {
            fiscalYear.setStatus(resolvedStatus);
        }
        validateFiscalYearRules(fiscalYear, fiscalYear.getId());
        fiscalYearRepository.save(fiscalYear);

        log.info("Fiscal year updated successfully with id: {}", id);

        return PostResponse.builder()
                .message("Fiscal year updated successfully with id: " + id)
                .build();
    }

    @Override
    public PostResponse deleteFiscalYear(UUID id) {
        log.info("Deleting fiscal year with id: {}", id);

        FiscalYear fiscalYear = fiscalYearRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Fiscal year not found with id: {}", id);
                    return new ResourceNotFoundException("Fiscal year not found with id: " + id);
                });

        if (!TenantUtils.isSystemAdmin()) {
            UUID resolvedCompanyId = TenantUtils.resolveCompanyId(TenantUtils.getCurrentCompanyId());
            if (fiscalYear.getCompany() == null || !fiscalYear.getCompany().getId().equals(resolvedCompanyId)) {
                throw new UnauthorizedException("Unauthorized access to fiscal year");
            }
        }

        throw new BusinessException("Fiscal years cannot be deleted. Use status changes to close or lock the fiscal year instead.");
    }

    public void prepareFiscalYearRequest(FiscalYearRequest fiscalYearRequest) {
        if (fiscalYearRequest == null) {
            throw new BadRequestException("Fiscal year request cannot be null");
        }

        FiscalYearPreset preset = fiscalYearRequest.getPreset();
        if (preset == null) {
            preset = FiscalYearPreset.CUSTOM;
        }

        if (preset == FiscalYearPreset.CUSTOM) {
            if (fiscalYearRequest.getStartDate() == null || fiscalYearRequest.getEndDate() == null) {
                throw new BadRequestException("For CUSTOM preset, start date and end date are required");
            }
            if (fiscalYearRequest.getFiscalYear() == null || fiscalYearRequest.getFiscalYear().isBlank()) {
                throw new BadRequestException("Fiscal year is required for CUSTOM preset");
            }
            return;
        }

        if (fiscalYearRequest.getBaseYear() == null) {
            throw new BadRequestException("Base year is required for preset generation");
        }

        FiscalYearPresetGenerator presetGenerator = new FiscalYearPresetGenerator();
        FiscalYearPresetGenerator.FiscalYearRange range = presetGenerator.generate(preset, fiscalYearRequest.getBaseYear());

        fiscalYearRequest.setPreset(preset);
        fiscalYearRequest.setStartDate(range.getStartDate());
        fiscalYearRequest.setEndDate(range.getEndDate());
        fiscalYearRequest.setFiscalYear(range.getFiscalYearLabel());
    }

    @Override
    @Transactional(readOnly = true)
    public FiscalYearProfileResponse getFiscalYearById(UUID id) {
        log.info("Fetching fiscal year profile with id: {}", id);

        FiscalYear fiscalYear;
        if (TenantUtils.isSystemAdmin()) {
            fiscalYear = fiscalYearRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Fiscal year not found with id: " + id));
        } else {
            UUID resolvedCompanyId = TenantUtils.resolveCompanyId(TenantUtils.getCurrentCompanyId());
            fiscalYear = fiscalYearRepository.findByIdAndCompanyId(id, resolvedCompanyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Fiscal year not found with id: " + id));
        }

        FiscalYearProfileResponse profile = buildBaseProfile(fiscalYear);
        enrichProfile(profile, fiscalYear);
        return profile;
    }

    private FiscalYearProfileResponse buildBaseProfile(FiscalYear fy) {
        return FiscalYearProfileResponse.builder()
            .id(fy.getId())
            .companyId(fy.getCompany() != null ? fy.getCompany().getId() : null)
            .companyName(fy.getCompany() != null ? fy.getCompany().getCompanyName() : null)
            .fiscalYear(fy.getFiscalYear())
            .startDate(fy.getStartDate())
            .endDate(fy.getEndDate())
            .isClosed(fy.getIsClosed())
            .currentStatus(fy.getStatus() != null ? fy.getStatus().name() : null)
            .build();
    }

    private void enrichProfile(FiscalYearProfileResponse profile, FiscalYear fy) {
        UUID companyId = fy.getCompany() != null ? fy.getCompany().getId() : null;
        LocalDate startDate = fy.getStartDate();
        LocalDate endDate = fy.getEndDate();

        // 1. Company Information
        if (fy.getCompany() != null) {
            Company c = fy.getCompany();
            profile.setCompanyInformation(FyCompanyInfoDto.builder()
                .companyId(c.getId())
                .companyName(c.getCompanyName())
                .companyCode(c.getCompanyCode())
                .gstin(c.getGstin())
                .pan(null)
                .currency(c.getBaseCurrency())
                .financialYearFormat(fy.getFiscalYear())
                .build());
        }

        // 2. Accounting Periods
        List<AccountingPeriod> periods = companyId != null
            ? accountingPeriodRepository.findAllByCompanyIdAndFiscalYearId(companyId, fy.getId())
            : List.of();

        List<FyAccountingPeriodDto> periodDtos = periods.stream().map(p -> {
            Long txCount = companyId != null ? glJournalEntryRepository.countPostedEntries(
                companyId, p.getStartDate(), p.getEndDate()) : 0L;
            return FyAccountingPeriodDto.builder()
                .periodId(p.getId())
                .periodNumber(p.getPeriodNumber())
                .periodName(p.getPeriodName())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .periodType(p.getPeriodType() != null ? p.getPeriodType().name() : null)
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .totalTransactions(txCount != null ? txCount.intValue() : 0)
                .build();
        }).collect(Collectors.toList());
        profile.setAccountingPeriods(periodDtos);

        // 3. Fetch transactions for the fiscal year date range
        List<SalesInvoice> salesInvoices = companyId != null
            ? salesInvoiceRepository.findByDateRangeAndCompany(companyId, startDate, endDate)
            : List.of();
        List<ApInvoice> purchaseInvoices = companyId != null
            ? apInvoiceRepository.findInvoicesByDateRange(companyId, startDate, endDate, Pageable.unpaged()).getContent()
            : List.of();
        List<ReceiptVoucher> receipts = receiptVoucherRepository.findByReceiptDateBetween(startDate, endDate)
            .stream().filter(r -> r.getCompany() != null && companyId != null && companyId.equals(r.getCompany().getId()))
            .collect(Collectors.toList());
        List<PaymentVoucher> payments = paymentVoucherRepository.findByVoucherDateBetween(startDate, endDate)
            .stream().filter(p -> p.getCompany() != null && companyId != null && companyId.equals(p.getCompany().getId()))
            .collect(Collectors.toList());

        // GL Journal Entries for this fiscal year
        List<GlJournalEntry> journals = glJournalEntryRepository
            .findByFiscalYearAndStatus(fy.getId(), com.erp.account.enums.PostingStatus.POSTED, Pageable.unpaged())
            .getContent();

        // 4. Transaction Summary
        profile.setTransactionSummary(FyTransactionSummaryDto.builder()
            .totalJournalEntries(companyId != null ? glJournalEntryRepository.countPostedEntries(companyId, startDate, endDate).intValue() : 0)
            .totalSalesInvoices(salesInvoices.size())
            .totalPurchaseBills(purchaseInvoices.size())
            .totalReceipts(receipts.size())
            .totalPayments(payments.size())
            .totalCreditNotes(0)
            .totalDebitNotes(0)
            .build());

        // 5. Financial Summary (from GL journal lines)
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal totalAssets = BigDecimal.ZERO;
        BigDecimal totalLiabilities = BigDecimal.ZERO;
        BigDecimal tbDebit = BigDecimal.ZERO;
        BigDecimal tbCredit = BigDecimal.ZERO;

        for (GlJournalEntry je : journals) {
            tbDebit = tbDebit.add(je.getTotalDebit() != null ? je.getTotalDebit() : BigDecimal.ZERO);
            tbCredit = tbCredit.add(je.getTotalCredit() != null ? je.getTotalCredit() : BigDecimal.ZERO);
            if (je.getJournalLines() != null) {
                for (GlJournalLine jl : je.getJournalLines()) {
                    if (jl.getAccount() != null && jl.getAccount().getAccountType() != null) {
                        AccountNature nature = jl.getAccount().getAccountType();
                        BigDecimal dr = jl.getDebitAmount() != null ? jl.getDebitAmount() : BigDecimal.ZERO;
                        BigDecimal cr = jl.getCreditAmount() != null ? jl.getCreditAmount() : BigDecimal.ZERO;
                        if (AccountNature.CREDIT.equals(nature)) {
                            totalRevenue = totalRevenue.add(cr).subtract(dr);
                            totalLiabilities = totalLiabilities.add(cr);
                        } else if (AccountNature.DEBIT.equals(nature)) {
                            totalExpenses = totalExpenses.add(dr).subtract(cr);
                            totalAssets = totalAssets.add(dr);
                        }
                    }
                }
            }
        }

        BigDecimal grossProfit = totalRevenue.subtract(totalExpenses);
        BigDecimal equity = totalAssets.subtract(totalLiabilities);

        profile.setFinancialSummary(FyFinancialSummaryDto.builder()
            .openingBalance(BigDecimal.ZERO)
            .closingBalance(BigDecimal.ZERO)
            .totalRevenue(totalRevenue)
            .totalExpenses(totalExpenses)
            .grossProfit(grossProfit)
            .netProfit(grossProfit)
            .totalAssets(totalAssets)
            .totalLiabilities(totalLiabilities)
            .totalEquity(equity)
            .build());

        // 6. Financial Reports Summary
        BigDecimal receiptsAmt = receipts.stream().map(r -> r.getReceiptAmount() != null ? r.getReceiptAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paymentsAmt = payments.stream().map(p -> p.getPaymentAmount() != null ? p.getPaymentAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);

        profile.setFinancialReportsSummary(FyReportsDto.builder()
            .trialBalanceTotalDebit(tbDebit)
            .trialBalanceTotalCredit(tbCredit)
            .trialBalanceDifference(tbDebit.subtract(tbCredit).abs())
            .plTotalRevenue(totalRevenue)
            .plTotalExpenses(totalExpenses)
            .plNetProfit(grossProfit)
            .bsTotalAssets(totalAssets)
            .bsTotalLiabilities(totalLiabilities)
            .bsEquity(equity)
            .cfTotalReceipts(receiptsAmt)
            .cfTotalPayments(paymentsAmt)
            .cfNetCashFlow(receiptsAmt.subtract(paymentsAmt))
            .build());

        // 7. Statistics
        long openCount = periods.stream().filter(p -> p.getStatus() == AccountingPeriodStatus.OPEN).count();
        long closedCount = periods.stream().filter(p -> p.getStatus() != AccountingPeriodStatus.OPEN).count();
        LocalDate lastTxDate = journals.stream().map(GlJournalEntry::getVoucherDate)
            .filter(Objects::nonNull).max(LocalDate::compareTo).orElse(null);

        profile.setStatistics(FyStatisticsDto.builder()
            .totalAccountingPeriods(periods.size())
            .openPeriods((int) openCount)
            .closedPeriods((int) closedCount)
            .totalTransactions(journals.size())
            .totalVouchers(salesInvoices.size() + purchaseInvoices.size() + receipts.size() + payments.size())
            .lastTransactionDate(lastTxDate)
            .build());

        // 8. Recent Transactions (last 20)
        List<FyRecentTransactionDto> recentTx = new ArrayList<>();
        salesInvoices.forEach(s -> recentTx.add(FyRecentTransactionDto.builder()
            .transactionId(s.getId()).transactionType("SALES_INVOICE")
            .voucherNumber(s.getInvoiceNumber()).transactionDate(s.getInvoiceDate())
            .partyName(s.getCustomer() != null ? s.getCustomer().getCustomerName() : "N/A")
            .amount(s.getTotalAmount() != null ? s.getTotalAmount() : BigDecimal.ZERO)
            .status(s.getStatus().name()).build()));
        purchaseInvoices.forEach(p -> recentTx.add(FyRecentTransactionDto.builder()
            .transactionId(p.getId()).transactionType("PURCHASE_INVOICE")
            .voucherNumber(p.getInvoiceNo()).transactionDate(p.getInvoiceDate())
            .partyName(p.getVendor() != null ? p.getVendor().getVendorName() : "N/A")
            .amount(p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO)
            .status(p.getStatus().name()).build()));
        receipts.forEach(r -> recentTx.add(FyRecentTransactionDto.builder()
            .transactionId(r.getId()).transactionType("RECEIPT")
            .voucherNumber(r.getReceiptNo()).transactionDate(r.getReceiptDate())
            .partyName(r.getCustomer() != null ? r.getCustomer().getCustomerName() : "N/A")
            .amount(r.getReceiptAmount() != null ? r.getReceiptAmount() : BigDecimal.ZERO)
            .status("N/A").build()));
        payments.forEach(p -> recentTx.add(FyRecentTransactionDto.builder()
            .transactionId(p.getId()).transactionType("PAYMENT")
            .voucherNumber(p.getVoucherNo()).transactionDate(p.getVoucherDate())
            .partyName(p.getVendor() != null ? p.getVendor().getVendorName() : "N/A")
            .amount(p.getPaymentAmount() != null ? p.getPaymentAmount() : BigDecimal.ZERO)
            .status("N/A").build()));
        recentTx.sort((a, b) -> {
            if (a.getTransactionDate() == null) return 1;
            if (b.getTransactionDate() == null) return -1;
            return b.getTransactionDate().compareTo(a.getTransactionDate());
        });
        profile.setRecentTransactions(recentTx.stream().limit(20).collect(Collectors.toList()));

        // 9. Year-End Closing Information
        profile.setYearEndClosingInformation(FyYearEndInfoDto.builder()
            .closingStatus(fy.getStatus() != null ? fy.getStatus().name() : null)
            .closedBy(null)
            .closedDate(FiscalYearStatus.CLOSED.equals(fy.getStatus()) || FiscalYearStatus.LOCKED.equals(fy.getStatus()) ? fy.getEndDate() : null)
            .closingRemarks(null)
            .build());

        // 10. Audit Information
        profile.setAuditInformation(FyAuditInfoDto.builder()
            .createdBy(fy.getCreatedBy())
            .createdAt(fy.getCreatedAt())
            .updatedBy(fy.getUpdatedBy())
            .updatedAt(fy.getUpdatedAt())
            .build());
    }

    @Override
    @Transactional(readOnly = true)
    public FiscalYearResponseList getAllFiscalYears(FiscalYearFilterDto filter, Pageable pageable, UUID companyId) {

        log.info("Fetching all fiscal years with filter and pagination");

            UUID resolvedCompanyId = TenantUtils.resolveCompanyId(filter.getCompanyId());

        Specification<FiscalYear> spec = FiscalYearSpecification.getFilterSpecification(filter, resolvedCompanyId);

        Page<FiscalYear> fiscalYearPage = fiscalYearRepository.findAll(spec, pageable);

        List<FiscalYearResponse> responses = fiscalYearPage.getContent()
                .stream()
                .map(fiscalYearMapper::toResponse)
                .toList();

        PaginationResponse pagination = PaginationResponse.builder()
                .page(fiscalYearPage.getNumber() + 1)
                .size(fiscalYearPage.getSize())
                .totalPages(fiscalYearPage.getTotalPages())
                .totalElements(fiscalYearPage.getTotalElements())
                .first(fiscalYearPage.isFirst())
                .last(fiscalYearPage.isLast())
                .build();

        return FiscalYearResponseList.builder()
                .fiscalYears(responses)
                .paginationResponse(pagination)
                .build();
    }

    @Override
    public PostResponse changeIsClose(boolean status, UUID id) {
        FiscalYear fiscalYear = fiscalYearRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Fiscal year not found with id: {}", id);
                    return new ResourceNotFoundException("Fiscal year not found with id: " + id);
                });

        if (!TenantUtils.isSystemAdmin()) {
            UUID resolvedCompanyId = TenantUtils.resolveCompanyId(TenantUtils.getCurrentCompanyId());
            if (fiscalYear.getCompany() == null || !fiscalYear.getCompany().getId().equals(resolvedCompanyId)) {
                throw new UnauthorizedException("Unauthorized access to fiscal year");
            }
        }

        FiscalYearStatus nextStatus = determineNextStatus(fiscalYear, status);
        fiscalYear.setStatus(nextStatus);
        if (FiscalYearStatus.OPEN.equals(nextStatus)) {
            validateOpenFiscalYearRule(fiscalYear, fiscalYear.getId());
        }
        fiscalYearRepository.save(fiscalYear);

        log.info("Fiscal year status updated successfully with id: {}", id);

        return PostResponse.builder()
                .message("Fiscal year status updated successfully with id: " + id)
                .build();
    }

    private boolean shouldGenerateAccountingPeriods(FiscalYearRequest fiscalYearRequest) {
        return fiscalYearRequest != null && fiscalYearRequest.getPreset() != null
                && fiscalYearRequest.getPreset() != FiscalYearPreset.CUSTOM;
    }

    private void createAccountingPeriodsForFiscalYear(FiscalYear fiscalYear, FiscalYearRequest fiscalYearRequest) {
        PeriodType periodType = fiscalYearRequest.getPeriodType() != null
                ? fiscalYearRequest.getPeriodType()
                : PeriodType.MONTHLY;

        AccountingPeriodCreateRequest request = AccountingPeriodCreateRequest.builder()
                .periodType(periodType)
                .fiscalYearId(fiscalYear.getId())
                .build();

        accountingPeriodService.createAccountingPeriodsForFiscalYear(fiscalYear, periodType);
    }

    private FiscalYearStatus resolveRequestedStatus(FiscalYearRequest fiscalYearRequest, FiscalYear fiscalYear) {
        if (fiscalYearRequest.getIsClosed() == null) {
            return fiscalYear.getStatus();
        }
        return Boolean.TRUE.equals(fiscalYearRequest.getIsClosed()) ? FiscalYearStatus.CLOSED : FiscalYearStatus.OPEN;
    }

    private FiscalYearStatus determineNextStatus(FiscalYear fiscalYear, boolean status) {
        if (status) {
            if (fiscalYear.getStatus() == FiscalYearStatus.LOCKED) {
                throw new BusinessException("Locked fiscal years cannot be transitioned further.");
            }
            return fiscalYear.getStatus() == FiscalYearStatus.CLOSED ? FiscalYearStatus.LOCKED : FiscalYearStatus.CLOSED;
        }

        if (fiscalYear.getStatus() == FiscalYearStatus.LOCKED) {
            throw new BusinessException("Locked fiscal years cannot be reopened.");
        }
        return fiscalYear.getStatus() == FiscalYearStatus.CLOSED ? FiscalYearStatus.OPEN : fiscalYear.getStatus();
    }

    private void validateFiscalYearRules(FiscalYear fiscalYear, UUID ignoreId) {
        validateDateRange(fiscalYear.getStartDate(), fiscalYear.getEndDate());
        validateNoOverlappingFiscalYears(fiscalYear, ignoreId);
        validateOpenFiscalYearRule(fiscalYear, ignoreId);
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new BadRequestException("Start date and end date are required");
        }
        if (!startDate.isBefore(endDate)) {
            throw new ValidationException("Start date must be before end date");
        }
    }

    private void validateNoOverlappingFiscalYears(FiscalYear fiscalYear, UUID ignoreId) {
        if (fiscalYear.getCompany() == null || fiscalYear.getStartDate() == null || fiscalYear.getEndDate() == null) {
            return;
        }

        boolean overlapping = fiscalYearRepository.hasOverlappingFiscalYear(
                fiscalYear.getCompany().getId(),
                fiscalYear.getStartDate(),
                fiscalYear.getEndDate(),
                ignoreId);

        if (overlapping) {
            throw new ValidationException("Fiscal year dates overlap with another fiscal year for the same company");
        }
    }

    private void validateOpenFiscalYearRule(FiscalYear fiscalYear, UUID ignoreId) {
        if (fiscalYear.getStatus() != FiscalYearStatus.OPEN || fiscalYear.getCompany() == null) {
            return;
        }

        boolean anotherOpenFiscalYearExists = ignoreId == null
                ? fiscalYearRepository.existsByCompanyIdAndStatus(fiscalYear.getCompany().getId(), FiscalYearStatus.OPEN)
                : fiscalYearRepository.existsByCompanyIdAndStatusAndIdNot(
                        fiscalYear.getCompany().getId(),
                        FiscalYearStatus.OPEN,
                        ignoreId);

        if (anotherOpenFiscalYearExists) {
            throw new BusinessException("Only one open fiscal year is allowed per company");
        }
    }

}
