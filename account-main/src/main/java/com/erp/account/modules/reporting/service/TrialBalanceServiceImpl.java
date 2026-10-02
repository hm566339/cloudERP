package com.erp.account.modules.reporting.service;

import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.enums.BalanceType;
import com.erp.account.modules.company.dto.response.CompanyResponse;
import com.erp.account.modules.company.service.CompanyService;
import com.erp.account.modules.fiscalyear.repository.FiscalYearRepository;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository.IdParentProjection;
import com.erp.account.modules.report.dto.response.TrialBalanceResponse;
import com.erp.account.modules.report.dto.response.TrialBalanceRow;
import com.erp.account.modules.report.dto.response.TrialBalanceSummaryResponse;
import com.erp.account.modules.reporting.dto.request.TrialBalanceRequest;
import com.erp.account.modules.reporting.enums.GroupBy;
import com.erp.account.modules.reporting.repository.TrialBalanceAggregationRepository;
import com.erp.account.modules.reporting.repository.TrialBalanceAggregateRow;
import com.erp.account.modules.reporting.repository.TrialBalanceAggregateSummary;
import com.erp.account.modules.reporting.repository.TrialBalanceQuery;
import com.erp.account.util.TenantUtils;

import com.erp.account.common.exception.BusinessException;
import com.erp.account.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrialBalanceServiceImpl implements TrialBalanceService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "accountCode", "accountName", "periodDebit", "periodCredit",
            "transactionCount", "lastTransactionDate");

    private final CompanyService companyService;
    private final FiscalYearRepository fiscalYearRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final TrialBalanceAggregationRepository trialBalanceAggregationRepository;

    @Override
    @Transactional(readOnly = true)
    public TrialBalanceResponse generateTrialBalance(TrialBalanceRequest request) {

        UUID companyId = TenantUtils.resolveCompanyIdForQuery(request.getCompanyId());

        if (companyId != null) {
            companyService.getCompany(companyId);
        }

        log.info("Generating Trial Balance for company {}", companyId);

        if (request.getFromDate() != null
                && request.getToDate() != null
                && request.getFromDate().isAfter(request.getToDate())) {
            throw new BusinessException("fromDate cannot be after toDate");
        }

        validateFiscalYear(request.getFiscalYearId(), companyId);
        validateAccounts(request, companyId);

        LocalDate start = request.getFromDate() != null
                ? request.getFromDate()
                : LocalDate.of(1900, 1, 1);

        LocalDate end = request.getToDate() != null
                ? request.getToDate()
                : LocalDate.now();

        GroupBy groupBy = parseGroupBy(request.getGroupBy());
        String sortBy = validateSortBy(request.getSortBy());
        String sortDirection = "DESC".equalsIgnoreCase(request.getSortDirection()) ? "DESC" : "ASC";

        boolean onlyPosted = request.getOnlyPostedEntries() == null || request.getOnlyPostedEntries();
        boolean includeOpening = request.getIncludeOpeningBalance() == null || request.getIncludeOpeningBalance();
        boolean includeZero = request.getIncludeZeroBalance() == null || request.getIncludeZeroBalance();
        boolean onlyLeaf = Boolean.TRUE.equals(request.getOnlyLeafAccounts());
        boolean includeInactive = request.getIncludeInactiveAccounts() == null || request.getIncludeInactiveAccounts();
        boolean includeSub = Boolean.TRUE.equals(request.getIncludeSubAccounts());

        UUID accountId = request.getAccountId();
        List<UUID> accountIds = request.getAccountIds();
        if (includeSub) {
            Set<UUID> expanded = expandSubAccounts(accountId, accountIds, companyId);
            if (expanded != null) {
                if (expanded.isEmpty()) {
                    accountIds = List.of();
                    accountId = null;
                } else {
                    accountIds = new ArrayList<>(expanded);
                    accountId = null;
                }
            }
        }

        TrialBalanceQuery query = TrialBalanceQuery.builder()
                .companyId(companyId)
                .startDate(start)
                .endDate(end)
                .fiscalYearId(request.getFiscalYearId())
                .accountId(accountId)
                .accountIds(accountIds)
                .accountCode(request.getAccountCode())
                .search(request.getSearch())
                .accountType(request.getAccountType() != null ? request.getAccountType().name() : null)
                .accountGroupId(request.getAccountGroupId())
                .categoryId(request.getCategoryId())
                .parentAccountId(request.getParentAccountId())
                .branchId(request.getBranchId())
                .costCenterId(request.getCostCenterId())
                .projectId(request.getProjectId())
                .departmentId(request.getDepartmentId())
                .currencyCode(request.getCurrencyCode())
                .onlyPostedEntries(onlyPosted)
                .includeOpeningBalance(includeOpening)
                .includeZeroBalance(includeZero)
                .onlyLeafAccounts(onlyLeaf)
                .includeInactiveAccounts(includeInactive)
                .includeSubAccounts(includeSub)
                .groupBy(groupBy)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        List<TrialBalanceAggregateRow> aggregates = trialBalanceAggregationRepository.findAggregated(query, request.getPage(), request.getPageSize());
        TrialBalanceAggregateSummary summaryAgg = trialBalanceAggregationRepository.findSummary(query);

        String baseCurrency = resolveCurrencyCode(companyId, request.getCurrencyCode());

        List<TrialBalanceRow> rows = aggregates.stream()
                .map(a -> mapRow(a, groupBy, baseCurrency))
                .collect(Collectors.toList());

        TrialBalanceSummaryResponse summary = buildSummary(summaryAgg);

        PaginationResponse pagination = buildPagination(request.getPage(), request.getPageSize(), rows.size(), summaryAgg.getTotalGroups());

        log.info("Trial Balance generated - GroupBy: {}, Rows: {}, TotalGroups: {}, Opening: {}, Debit: {}, Credit: {}",
                groupBy, rows.size(), summaryAgg.getTotalGroups(),
                summaryAgg.getTotalOpening(), summaryAgg.getTotalPeriodDebit(), summaryAgg.getTotalPeriodCredit());

        return TrialBalanceResponse.builder()
                .rows(rows)
                .summary(summary)
                .pagination(pagination)
                .groupBy(groupBy.name())
                .currencyCode(baseCurrency)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private TrialBalanceRow mapRow(TrialBalanceAggregateRow a, GroupBy groupBy, String baseCurrency) {
        BigDecimal openingBalance = a.getOpeningDebit()
                .subtract(a.getOpeningCredit())
                .add(a.getOpeningBalanceStatic());
        BigDecimal closingBalance = openingBalance
                .add(a.getPeriodDebit())
                .subtract(a.getPeriodCredit());

        boolean debitSide = closingBalance.compareTo(BigDecimal.ZERO) >= 0;
        BigDecimal closingDebit = debitSide ? closingBalance : BigDecimal.ZERO;
        BigDecimal closingCredit = debitSide ? BigDecimal.ZERO : closingBalance.abs();

        return TrialBalanceRow.builder()
                .accountId(a.getGroupId())
                .accountCode(a.getGroupCode())
                .accountName(displayGroupName(groupBy, a))
                .parentAccountName(a.getParentAccountName())
                .accountType(displayAccountType(a.getAccountType()))
                .accountGroup(a.getAccountGroup())
                .openingDebit(a.getOpeningDebit())
                .openingCredit(a.getOpeningCredit())
                .periodDebit(a.getPeriodDebit())
                .periodCredit(a.getPeriodCredit())
                .openingBalance(openingBalance)
                .debitTotal(a.getPeriodDebit())
                .creditTotal(a.getPeriodCredit())
                .closingBalance(closingBalance)
                .closingDebit(closingDebit)
                .closingCredit(closingCredit)
                .balanceType(debitSide ? BalanceType.DR : BalanceType.CR)
                .transactionCount(a.getTransactionCount())
                .lastTransactionDate(a.getLastTransactionDate())
                .currencyCode(baseCurrency)
                .build();
    }

    private TrialBalanceSummaryResponse buildSummary(TrialBalanceAggregateSummary agg) {
        BigDecimal totalClosing = agg.getTotalOpening()
                .add(agg.getTotalPeriodDebit())
                .subtract(agg.getTotalPeriodCredit());

        BigDecimal difference = agg.getTotalClosingDebit().subtract(agg.getTotalClosingCredit());

        return TrialBalanceSummaryResponse.builder()
                .totalOpening(agg.getTotalOpening())
                .totalDebit(agg.getTotalPeriodDebit())
                .totalCredit(agg.getTotalPeriodCredit())
                .totalClosing(totalClosing)
                .totalOpeningDebit(agg.getTotalOpeningDebit())
                .totalOpeningCredit(agg.getTotalOpeningCredit())
                .totalPeriodDebit(agg.getTotalPeriodDebit())
                .totalPeriodCredit(agg.getTotalPeriodCredit())
                .totalClosingDebit(agg.getTotalClosingDebit())
                .totalClosingCredit(agg.getTotalClosingCredit())
                .difference(difference)
                .isBalanced(difference.compareTo(BigDecimal.ZERO) == 0)
                .totalAccounts(agg.getTotalGroups())
                .accountsWithTransactions(agg.getAccountsWithTransactions())
                .build();
    }

    private PaginationResponse buildPagination(int page, int pageSize, int numberOfElements, long totalElements) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, pageSize);
        int totalPages = (int) Math.ceil((double) totalElements / safeSize);

        return PaginationResponse.builder()
                .page(safePage + 1)
                .size(safeSize)
                .currentPage(safePage)
                .pageSize(safeSize)
                .totalPages(totalPages)
                .totalElements(totalElements)
                .numberOfElements(numberOfElements)
                .first(safePage == 0)
                .last(safePage + 1 >= totalPages)
                .hasNext(safePage + 1 < totalPages)
                .hasPrevious(safePage > 0)
                .build();
    }

    private GroupBy parseGroupBy(String raw) {
        if (raw == null || raw.isBlank()) {
            return GroupBy.ACCOUNT;
        }
        try {
            return GroupBy.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("groupBy must be one of "
                    + Arrays.stream(GroupBy.values()).map(Enum::name).collect(Collectors.joining(", ")));
        }
    }

    private String validateSortBy(String raw) {
        if (raw == null || raw.isBlank()) {
            return "accountCode";
        }
        String value = raw.trim();
        if (!ALLOWED_SORT_FIELDS.contains(value)) {
            throw new ValidationException("sortBy must be one of " + String.join(", ", ALLOWED_SORT_FIELDS));
        }
        return value;
    }

    private void validateFiscalYear(UUID fiscalYearId, UUID companyId) {
        if (fiscalYearId == null) {
            return;
        }
        boolean exists = companyId != null
                ? fiscalYearRepository.findByIdAndCompanyId(fiscalYearId, companyId).isPresent()
                : fiscalYearRepository.existsById(fiscalYearId);
        if (!exists) {
            throw new ValidationException("Invalid fiscal year: " + fiscalYearId);
        }
    }

    private void validateAccounts(TrialBalanceRequest request, UUID companyId) {
        if (request.getAccountId() != null) {
            ensureAccountExists(request.getAccountId(), companyId);
        }
        if (request.getAccountIds() != null) {
            for (UUID id : request.getAccountIds()) {
                ensureAccountExists(id, companyId);
            }
        }
        if (request.getParentAccountId() != null) {
            ensureAccountExists(request.getParentAccountId(), companyId);
        }
    }

    private void ensureAccountExists(UUID accountId, UUID companyId) {
        boolean exists = companyId != null
                ? chartOfAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(accountId, companyId).isPresent()
                : chartOfAccountRepository.findByIdAndIsDeletedFalse(accountId).isPresent();
        if (!exists) {
            throw new ValidationException("Invalid account: " + accountId);
        }
    }

    /**
     * Expands the requested account filter to include all descendant (sub) accounts.
     * Returns null when no account filter was provided (nothing to expand).
     */
    private Set<UUID> expandSubAccounts(UUID accountId, List<UUID> accountIds, UUID companyId) {
        Set<UUID> roots = new LinkedHashSet<>();
        if (accountId != null) {
            roots.add(accountId);
        }
        if (accountIds != null) {
            roots.addAll(accountIds);
        }
        if (roots.isEmpty()) {
            return null;
        }

        Map<UUID, List<UUID>> childrenByParent = new HashMap<>();
        List<IdParentProjection> all = chartOfAccountRepository.findAllIdAndParentId(companyId);
        for (IdParentProjection p : all) {
            if (p.getParentId() != null) {
                childrenByParent.computeIfAbsent(p.getParentId(), k -> new ArrayList<>()).add(p.getId());
            }
        }

        Set<UUID> result = new LinkedHashSet<>(roots);
        Deque<UUID> queue = new ArrayDeque<>(roots);
        while (!queue.isEmpty()) {
            UUID current = queue.poll();
            List<UUID> children = childrenByParent.get(current);
            if (children != null) {
                for (UUID child : children) {
                    if (result.add(child)) {
                        queue.add(child);
                    }
                }
            }
        }
        return result;
    }

    private String resolveCurrencyCode(UUID companyId, String requestedCurrencyCode) {
        if (requestedCurrencyCode != null && !requestedCurrencyCode.isBlank()) {
            return requestedCurrencyCode;
        }
        if (companyId != null) {
            CompanyResponse company = companyService.getCompany(companyId);
            if (company != null && company.getBaseCurrency() != null) {
                return company.getBaseCurrency();
            }
        }
        return null;
    }

    private String displayGroupName(GroupBy groupBy, TrialBalanceAggregateRow a) {
        if (groupBy == GroupBy.ACCOUNT_TYPE && a.getGroupName() != null) {
            return displayAccountType(a.getGroupName());
        }
        return a.getGroupName();
    }

    private String displayAccountType(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            return com.erp.account.enums.AccountNature.valueOf(raw).getDisplayName();
        } catch (IllegalArgumentException e) {
            return raw;
        }
    }
}
