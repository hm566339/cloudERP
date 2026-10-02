package com.erp.account.modules.reporting.service;

import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.modules.report.dto.response.BalanceSheetResponse;
import com.erp.account.modules.report.dto.response.BalanceSheetRow;
import com.erp.account.modules.report.dto.response.BalanceSheetSummaryResponse;
import com.erp.account.modules.reporting.dto.request.BalanceSheetRequest;
import com.erp.account.common.exception.BusinessException;
import com.erp.account.common.exception.BalanceSheetException;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import com.erp.account.modules.company.service.CompanyService;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BalanceSheetServiceImpl implements BalanceSheetService {

    private final GlJournalLineRepository glJournalLineRepository;
    private final CompanyService companyService;


    @Override
    @Transactional(readOnly = true)
    public BalanceSheetResponse generateBalanceSheet(BalanceSheetRequest request) {

        UUID companyId = TenantUtils.resolveCompanyIdForQuery(request.getCompanyId());

        if (companyId != null) {
            companyService.getCompany(companyId);
        }

        LocalDate start = request.getFromDate() != null
                ? request.getFromDate()
                : LocalDate.of(1970, 1, 1);

        LocalDate end = request.getToDate() != null
                ? request.getToDate()
                : LocalDate.now();

        if (request.getFromDate() != null
                && request.getToDate() != null
                && request.getFromDate().isAfter(request.getToDate())) {
            throw new BusinessException("fromDate cannot be after toDate");
        }

        List<GlJournalLineRepository.TrialBalanceProjection> projections;
        try {
            if (companyId != null) {
                projections = glJournalLineRepository.aggregateTrialBalance(companyId, start, end);
            } else {
                projections = glJournalLineRepository.aggregateTrialBalanceAllCompanies(start, end);
            }
        } catch (Exception ex) {
            log.error("Failed to generate Balance Sheet Report for company {}",
                    companyId, ex);
            throw new BalanceSheetException("Unable to generate Balance Sheet Report", ex);
        }

        log.info("Balance Sheet projection fetched: company={}, fromDate={}, toDate={}, projections={}",
                companyId, start, end, projections.size());

        List<BalanceSheetRow> balanceRows = projections.stream()
                .filter(p -> isBalanceSheetAccount(p.getCategoryCode()))
                .map(this::mapToBalanceSheetRow)
                .filter(row -> request.getIncludeZeroBalance() || row.getClosingBalance().compareTo(BigDecimal.ZERO) != 0)
                .collect(Collectors.toList());

        BigDecimal totalAssets = balanceRows.stream()
                .filter(row -> isAsset(row.getAccountType()))
                .map(row -> row.getClosingBalance() != null ? row.getClosingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalLiabilities = balanceRows.stream()
                .filter(row -> isLiability(row.getAccountType()))
                .map(row -> row.getClosingBalance() != null ? row.getClosingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEquity = balanceRows.stream()
                .filter(row -> isEquity(row.getAccountType()))
                .map(row -> row.getClosingBalance() != null ? row.getClosingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean balanced = totalAssets.compareTo(totalLiabilities.add(totalEquity)) == 0;

        BigDecimal totalCurrentAssets = totalAssets;
        BigDecimal totalNonCurrentAssets = BigDecimal.ZERO;
        BigDecimal totalCurrentLiabilities = totalLiabilities;
        BigDecimal totalNonCurrentLiabilities = BigDecimal.ZERO;
        BigDecimal totalCapital = totalEquity;
        BigDecimal retainedEarnings = BigDecimal.ZERO;
        BigDecimal currentYearProfit = BigDecimal.ZERO;
        BigDecimal totalLiabilitiesAndEquity = totalLiabilities.add(totalEquity);
        BigDecimal balanceDifference = totalAssets.subtract(totalLiabilitiesAndEquity);

        BalanceSheetSummaryResponse summary = BalanceSheetSummaryResponse.builder()
                .totalAssets(totalAssets)
                .totalCurrentAssets(totalCurrentAssets)
                .totalNonCurrentAssets(totalNonCurrentAssets)
                .totalLiabilities(totalLiabilities)
                .totalCurrentLiabilities(totalCurrentLiabilities)
                .totalNonCurrentLiabilities(totalNonCurrentLiabilities)
                .totalEquity(totalEquity)
                .totalCapital(totalCapital)
                .retainedEarnings(retainedEarnings)
                .currentYearProfit(currentYearProfit)
                .totalLiabilitiesAndEquity(totalLiabilitiesAndEquity)
                .balanced(balanced)
                .balanceDifference(balanceDifference)
                .build();

        PageRequest pageReq = PageRequest.of(Math.max(0, request.getPage()), Math.max(1, request.getPageSize()));
        int startIndex = Math.min((int) Math.max(0, pageReq.getOffset()), balanceRows.size());
        int endIndex = Math.min(startIndex + pageReq.getPageSize(), balanceRows.size());
        List<BalanceSheetRow> pageContent = balanceRows.subList(startIndex, endIndex);
        org.springframework.data.domain.Page<BalanceSheetRow> page = new PageImpl<>(pageContent, pageReq,
                balanceRows.size());

        PaginationResponse pagination = PaginationResponse.builder()
                .page(page.getNumber() + 1)
                .currentPage(page.getNumber() + 1)
                .size(page.getSize())
                .pageSize(page.getSize())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .numberOfElements(page.getNumberOfElements())
                .first(page.isFirst())
                .last(page.isLast())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();

        log.info("Balance Sheet pagination: page={}, pageSize={}, size={}, totalPages={}, totalElements={}, numberOfElements={}",
                pagination.getPage(), pagination.getPageSize(), pagination.getSize(),
                pagination.getTotalPages(), pagination.getTotalElements(), pagination.getNumberOfElements());

        log.info(
                "Balance Sheet Report generated successfully - Rows: {}, Assets: {}, Liabilities: {}, Equity: {}, Balanced: {}",
                balanceRows.size(), totalAssets, totalLiabilities, totalEquity, balanced);

        return BalanceSheetResponse.builder()
                .rows(page.getContent())
                .summary(summary)
                .pagination(pagination)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private BalanceSheetRow mapToBalanceSheetRow(GlJournalLineRepository.TrialBalanceProjection projection) {
        BigDecimal openingDebit = safe(projection.getOpeningDebit());
        BigDecimal openingCredit = safe(projection.getOpeningCredit());
        BigDecimal periodDebit = safe(projection.getPeriodDebit());
        BigDecimal periodCredit = safe(projection.getPeriodCredit());
        BigDecimal openingBalance = calculateNatureAwareBalance(projection.getAccountType(), safe(projection.getOpeningBalance()), openingDebit, openingCredit);
        BigDecimal closingBalance = calculateNatureAwareBalance(projection.getAccountType(), openingBalance, periodDebit, periodCredit);

        return BalanceSheetRow.builder()
                .accountId(projection.getAccountId() != null ? UUID.fromString(projection.getAccountId()) : null)
                .accountCode(projection.getAccountCode())
                .accountName(projection.getAccountName())
                .accountType(projection.getAccountType())
                .accountGroup(projection.getCategoryCode())
                .parentAccountId(null)
                .parentAccountName(null)
                .branchName(null)
                .departmentName(null)
                .projectName(null)
                .costCenterName(null)
                .currencyCode(null)
                .accountNature(isAsset(projection.getAccountType()) ? "Asset" : (isLiability(projection.getAccountType()) ? "Liability" : "Equity"))
                .accountLevel(1)
                .transactionCount(0)
                .openingDebit(openingDebit)
                .openingCredit(openingCredit)
                .periodDebit(periodDebit)
                .periodCredit(periodCredit)
                .openingBalance(openingBalance)
                .closingBalance(closingBalance)
                .currentClosingBalance(closingBalance)
                .previousClosingBalance(BigDecimal.ZERO)
                .balanceDifference(closingBalance)
                .balancePercentage(BigDecimal.ZERO)
                .notes(null)
                .build();
    }

    private boolean isBalanceSheetAccount(String categoryCode) {
        return isAsset(categoryCode) || isLiability(categoryCode) || isEquity(categoryCode);
    }

    private boolean isAsset(String categoryCode) {
        return categoryCode != null && categoryCode.toUpperCase().startsWith("AST");
    }

    private boolean isLiability(String categoryCode) {
        return categoryCode != null && categoryCode.toUpperCase().startsWith("LIA");
    }

    private boolean isEquity(String categoryCode) {
        return categoryCode != null && categoryCode.toUpperCase().startsWith("EQT");
    }

    private BigDecimal calculateNatureAwareBalance(String accountNature, BigDecimal opening, BigDecimal debit, BigDecimal credit) {
        if ("CREDIT".equalsIgnoreCase(accountNature)) {
            return safe(opening).add(safe(credit)).subtract(safe(debit));
        }
        return safe(opening).add(safe(debit)).subtract(safe(credit));
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
