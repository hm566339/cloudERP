package com.erp.account.modules.reporting.service;

import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.enums.AccountNature;
import com.erp.account.modules.report.dto.response.ProfitLossResponse;
import com.erp.account.modules.report.dto.response.ProfitLossRow;
import com.erp.account.modules.report.dto.response.ProfitLossSummaryResponse;
import com.erp.account.modules.reporting.dto.request.ProfitLossRequest;
import com.erp.account.common.exception.BusinessException;
import com.erp.account.common.exception.ReportGenerationException;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import com.erp.account.modules.reporting.service.ProfitLossService;
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
public class ProfitLossServiceImpl implements ProfitLossService {

    private final GlJournalLineRepository glJournalLineRepository;
    private final CompanyService companyService;

    @Override
    @Transactional(readOnly = true)
    public ProfitLossResponse generateProfitLoss(ProfitLossRequest request) {

        UUID companyId = TenantUtils.resolveCompanyIdForQuery(request.getCompanyId());

        if (companyId != null) {
            companyService.getCompany(companyId);
        }

        log.info("Generating Profit & Loss Report for company {}", companyId);

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
            log.error("Failed to generate Profit & Loss Report for company {}", companyId, ex);
            throw new ReportGenerationException("Unable to generate Profit & Loss Report", ex);
        }

        List<ProfitLossRow> profitLossRows = projections.stream()
                .filter(p -> isProfitLossAccount(p.getCategoryCode()))
                .map(this::mapToProfitLossRow)
                .collect(Collectors.toList());

        BigDecimal totalRevenue = profitLossRows.stream()
                .filter(row -> isRevenueAccount(row.getAccountGroup()))
                .map(row -> row.getClosingBalance() != null ? row.getClosingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = profitLossRows.stream()
                .filter(row -> isExpenseAccount(row.getAccountGroup()))
                .map(row -> row.getClosingBalance() != null ? row.getClosingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grossProfit = totalRevenue.subtract(totalExpenses);
        BigDecimal netProfit = grossProfit;

        BigDecimal totalIncome = totalRevenue;
        BigDecimal totalOtherIncome = BigDecimal.ZERO;
        BigDecimal totalCOGS = BigDecimal.ZERO;
        BigDecimal totalOperatingExpenses = totalExpenses;
        BigDecimal totalOtherExpenses = BigDecimal.ZERO;
        BigDecimal EBITDA = grossProfit;
        BigDecimal operatingProfit = grossProfit;
        BigDecimal profitBeforeTax = grossProfit;
        BigDecimal taxExpense = BigDecimal.ZERO;
        BigDecimal netProfitAfterTax = grossProfit;
        BigDecimal profitMarginPercentage = totalRevenue.compareTo(BigDecimal.ZERO) != 0 ? netProfit.divide(totalRevenue, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100")) : BigDecimal.ZERO;

        ProfitLossSummaryResponse summary = ProfitLossSummaryResponse.builder()
                .totalRevenue(totalRevenue)
                .totalExpenses(totalExpenses)
                .grossProfit(grossProfit)
                .netProfit(netProfit)
                .totalIncome(totalIncome)
                .totalOtherIncome(totalOtherIncome)
                .totalCOGS(totalCOGS)
                .totalOperatingExpenses(totalOperatingExpenses)
                .totalOtherExpenses(totalOtherExpenses)
                .EBITDA(EBITDA)
                .operatingProfit(operatingProfit)
                .profitBeforeTax(profitBeforeTax)
                .taxExpense(taxExpense)
                .netProfitAfterTax(netProfitAfterTax)
                .profitMarginPercentage(profitMarginPercentage)
                .build();

        PageRequest pageReq = PageRequest.of(Math.max(0, request.getPage()), Math.max(1, request.getPageSize()));
        int startIndex = Math.min((int) Math.max(0, pageReq.getOffset()), profitLossRows.size());
        int endIndex = Math.min(startIndex + pageReq.getPageSize(), profitLossRows.size());
        List<ProfitLossRow> pageContent = profitLossRows.subList(startIndex, endIndex);
        org.springframework.data.domain.Page<ProfitLossRow> page = new PageImpl<>(pageContent, pageReq,
                profitLossRows.size());

        PaginationResponse pagination = PaginationResponse.builder()
                .page(page.getNumber() + 1)
                .size(page.getSize())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .first(page.isFirst())
                .last(page.isLast())
                .build();

        log.info("Profit & Loss Report generated successfully - Rows: {}, Revenue: {}, Expenses: {}, Net Profit: {}",
                profitLossRows.size(), totalRevenue, totalExpenses, netProfit);

        return ProfitLossResponse.builder()
                .rows(page.getContent())
                .summary(summary)
                .pagination(pagination)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private ProfitLossRow mapToProfitLossRow(GlJournalLineRepository.TrialBalanceProjection projection) {
        BigDecimal openingDebit = safe(projection.getOpeningDebit());
        BigDecimal openingCredit = safe(projection.getOpeningCredit());
        BigDecimal periodDebit = safe(projection.getPeriodDebit());
        BigDecimal periodCredit = safe(projection.getPeriodCredit());
        BigDecimal openingBalance = calculateNatureAwareBalance(projection.getAccountType(), safe(projection.getOpeningBalance()), openingDebit, openingCredit);
        BigDecimal closingBalance = calculateNatureAwareBalance(projection.getAccountType(), openingBalance, periodDebit, periodCredit);

        return ProfitLossRow.builder()
                .accountId(projection.getAccountId() != null ? UUID.fromString(projection.getAccountId()) : null)
                .accountCode(projection.getAccountCode())
                .accountName(projection.getAccountName())
                .accountType(projection.getAccountType())
                .accountGroup(projection.getCategoryCode())
                .parentAccount(null)
                .branchName(null)
                .departmentName(null)
                .projectName(null)
                .costCenterName(null)
                .transactionCount(0)
                .openingDebit(openingDebit)
                .openingCredit(openingCredit)
                .periodDebit(periodDebit)
                .periodCredit(periodCredit)
                .openingBalance(openingBalance)
                .closingBalance(closingBalance)
                .currentPeriodAmount(closingBalance)
                .previousPeriodAmount(BigDecimal.ZERO)
                .varianceAmount(closingBalance)
                .variancePercentage(BigDecimal.ZERO)
                .budgetAmount(BigDecimal.ZERO)
                .budgetVariance(BigDecimal.ZERO)
                .notes(null)
                .build();
    }

    private boolean isProfitLossAccount(String categoryCode) {
        return isRevenueAccount(categoryCode) || isExpenseAccount(categoryCode);
    }

    private boolean isRevenueAccount(String categoryCode) {
        return categoryCode != null && categoryCode.toUpperCase().startsWith("INC");
    }

    private boolean isExpenseAccount(String categoryCode) {
        return categoryCode != null && categoryCode.toUpperCase().startsWith("EXP");
    }

    private BigDecimal calculateNatureAwareBalance(String accountNature, BigDecimal opening, BigDecimal debit, BigDecimal credit) {
        if (AccountNature.CREDIT.name().equalsIgnoreCase(accountNature)) {
            return safe(opening).add(safe(credit)).subtract(safe(debit));
        }
        return safe(opening).add(safe(debit)).subtract(safe(credit));
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
