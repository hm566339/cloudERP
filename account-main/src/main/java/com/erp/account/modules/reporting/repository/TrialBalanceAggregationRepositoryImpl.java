package com.erp.account.modules.reporting.repository;

import com.erp.account.modules.reporting.enums.GroupBy;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.Tuple;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Native SQL aggregation for the Trial Balance report.
 *
 * The query is assembled dynamically because the GROUP BY / select list depends on the
 * requested grouping mode. Line-level dimension filters (branch/cost center/project/
 * department/currency) are pushed into the LEFT JOIN so accounts always appear even when
 * they have no matching lines; account-level filters live in WHERE. Date and status
 * predicates are pushed into the entry JOIN so the database can use the existing
 * (company_id, voucher_date, status) indexes instead of scanning the whole table.
 */
@Repository
@RequiredArgsConstructor
public class TrialBalanceAggregationRepositoryImpl implements TrialBalanceAggregationRepository {

    @PersistenceContext
    private final EntityManager entityManager;

    @Override
    public List<TrialBalanceAggregateRow> findAggregated(TrialBalanceQuery query, int page, int pageSize) {
        List<String> params = new ArrayList<>();
        params.add("startDate");
        String sql = buildInner(query, params)
                + orderBy(query)
                + " LIMIT :pageSize OFFSET :offset";

        Query nativeQuery = entityManager.createNativeQuery(sql, Tuple.class);
        bind(nativeQuery, query, params);
        nativeQuery.setParameter("pageSize", pageSize);
        nativeQuery.setParameter("offset", Math.max(0, (long) page) * pageSize);

        List<?> result = nativeQuery.getResultList();
        List<TrialBalanceAggregateRow> rows = new ArrayList<>(result.size());
        for (Object o : result) {
            rows.add(map((Tuple) o));
        }
        return rows;
    }

    @Override
    public TrialBalanceAggregateSummary findSummary(TrialBalanceQuery query) {
        List<String> params = new ArrayList<>();
        params.add("startDate");
        String inner = buildInner(query, params);

        String sql = "SELECT COUNT(*) AS totalGroups, "
                + "COALESCE(SUM(t.openingBalance), 0) AS totalOpening, "
                + "COALESCE(SUM(t.openingDebit), 0) AS totalOpeningDebit, "
                + "COALESCE(SUM(t.openingCredit), 0) AS totalOpeningCredit, "
                + "COALESCE(SUM(t.periodDebit), 0) AS totalPeriodDebit, "
                + "COALESCE(SUM(t.periodCredit), 0) AS totalPeriodCredit, "
                + "COALESCE(SUM(CASE WHEN t.closingBalance >= 0 THEN t.closingBalance ELSE 0 END), 0) AS totalClosingDebit, "
                + "COALESCE(SUM(CASE WHEN t.closingBalance < 0 THEN -t.closingBalance ELSE 0 END), 0) AS totalClosingCredit, "
                + "COALESCE(SUM(CASE WHEN t.transactionCount > 0 THEN 1 ELSE 0 END), 0) AS accountsWithTransactions "
                + "FROM (" + inner + ") t";

        Query nativeQuery = entityManager.createNativeQuery(sql, Tuple.class);
        bind(nativeQuery, query, params);

        Tuple t = (Tuple) nativeQuery.getSingleResult();
        return mapSummary(t);
    }

    private String buildInner(TrialBalanceQuery q, List<String> params) {
        GroupBy mode = q.getGroupBy() != null ? q.getGroupBy() : GroupBy.ACCOUNT;
        GroupConfig cfg = config(mode);

        String openingDebit = q.isIncludeOpeningBalance()
                ? "COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.debit_amount ELSE 0 END), 0)"
                : "0";
        String openingCredit = q.isIncludeOpeningBalance()
                ? "COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.credit_amount ELSE 0 END), 0)"
                : "0";
        String openingBalanceStatic = q.isIncludeOpeningBalance() ? cfg.openingBalanceStatic() : "0";
        String periodDebit = "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.debit_amount ELSE 0 END), 0)";
        String periodCredit = "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.credit_amount ELSE 0 END), 0)";
        String openingBalance = "(" + openingDebit + ") - (" + openingCredit + ") + (" + openingBalanceStatic + ")";
        String closingBalance = "(" + openingDebit + ") - (" + openingCredit + ") + (" + openingBalanceStatic
                + ") + (" + periodDebit + ") - (" + periodCredit + ")";

        // Line-level dimension filters live in the LEFT JOIN so accounts still appear.
        List<String> linePreds = new ArrayList<>();
        if (q.getCompanyId() != null) {
            linePreds.add("l.company_id = :companyId");
            params.add("companyId");
        }
        if (q.getBranchId() != null) {
            linePreds.add("l.branch_id = :branchId");
            params.add("branchId");
        }
        if (q.getCostCenterId() != null) {
            linePreds.add("l.cost_center_id = :costCenterId");
            params.add("costCenterId");
        }
        if (q.getProjectId() != null) {
            linePreds.add("l.project_id = :projectId");
            params.add("projectId");
        }
        if (q.getDepartmentId() != null) {
            linePreds.add("l.department_id = :departmentId");
            params.add("departmentId");
        }
        if (q.getCurrencyCode() != null) {
            linePreds.add("l.currency_code = :currencyCode");
            params.add("currencyCode");
        }

        // Entry-level predicates also live in the LEFT JOIN ON so the index can be used.
        List<String> entryPreds = new ArrayList<>();
        if (q.getFiscalYearId() != null) {
            entryPreds.add("e.fiscal_year_id = :fiscalYearId");
            params.add("fiscalYearId");
        }
        if (q.isOnlyPostedEntries()) {
            entryPreds.add("e.status = 'POSTED'");
        }
        entryPreds.add("e.voucher_date <= :endDate");
        params.add("endDate");

        // Account-level predicates in WHERE.
        List<String> wherePreds = new ArrayList<>();
        if (q.getCompanyId() != null) {
            wherePreds.add("a.company_id = :companyId");
        }
        wherePreds.add("COALESCE(a.is_deleted, false) = false");
        if (!q.isIncludeInactiveAccounts()) {
            wherePreds.add("COALESCE(a.is_active, false) = true");
        }
        if (q.getAccountId() != null) {
            wherePreds.add("a.id = :accountId");
            params.add("accountId");
        } else if (q.getAccountIds() != null) {
            if (q.getAccountIds().isEmpty()) {
                wherePreds.add("1 = 0");
            } else {
                StringBuilder in = new StringBuilder("a.id IN (");
                for (int i = 0; i < q.getAccountIds().size(); i++) {
                    if (i > 0) {
                        in.append(", ");
                    }
                    in.append(":accountId").append(i);
                    params.add("accountId" + i);
                }
                in.append(")");
                wherePreds.add(in.toString());
            }
        }
        if (q.getAccountCode() != null) {
            wherePreds.add("a.account_code LIKE :accountCode");
            params.add("accountCode");
        }
        if (q.getSearch() != null && !q.getSearch().isEmpty()) {
            wherePreds.add("(LOWER(a.account_name) LIKE LOWER(:search) OR LOWER(a.account_code) LIKE LOWER(:search))");
            params.add("search");
        }
        if (q.getAccountType() != null) {
            wherePreds.add("a.account_type = :accountType");
            params.add("accountType");
        }
        if (q.getAccountGroupId() != null) {
            wherePreds.add("a.group_id = :accountGroupId");
            params.add("accountGroupId");
        }
        if (q.getCategoryId() != null) {
            wherePreds.add("ag.category_id = :categoryId");
            params.add("categoryId");
        }
        if (q.getParentAccountId() != null) {
            wherePreds.add("a.parent_account_id = :parentAccountId");
            params.add("parentAccountId");
        }
        if (q.isOnlyLeafAccounts()) {
            wherePreds.add("NOT EXISTS (SELECT 1 FROM chart_of_account c WHERE c.parent_account_id = a.id "
                    + "AND COALESCE(c.is_deleted, false) = false)");
        }

        String lineClause = linePreds.isEmpty() ? "" : " AND " + String.join(" AND ", linePreds);
        String entryClause = " AND " + String.join(" AND ", entryPreds);

        String sql = "SELECT "
                + cfg.groupId() + " AS groupId, "
                + cfg.groupCode() + " AS groupCode, "
                + cfg.groupName() + " AS groupName, "
                + cfg.accountType() + " AS accountType, "
                + cfg.accountGroup() + " AS accountGroup, "
                + cfg.parentAccountName() + " AS parentAccountName, "
                + openingDebit + " AS openingDebit, "
                + openingCredit + " AS openingCredit, "
                + periodDebit + " AS periodDebit, "
                + periodCredit + " AS periodCredit, "
                + openingBalanceStatic + " AS openingBalanceStatic, "
                + "COUNT(l.id) AS transactionCount, "
                + "MAX(e.voucher_date) AS lastTransactionDate, "
                + openingBalance + " AS openingBalance, "
                + closingBalance + " AS closingBalance "
                + "FROM chart_of_account a "
                + "JOIN account_group ag ON a.group_id = ag.id AND COALESCE(ag.is_deleted, false) = false "
                + "LEFT JOIN chart_of_account pa ON a.parent_account_id = pa.id AND COALESCE(pa.is_deleted, false) = false "
                + "LEFT JOIN gl_journal_line l ON l.account_id = a.id AND COALESCE(l.is_deleted, false) = false" + lineClause + " "
                + "LEFT JOIN gl_journal_entry e ON l.journal_entry_id = e.id AND COALESCE(e.is_deleted, false) = false" + entryClause + " "
                + "WHERE " + String.join(" AND ", wherePreds) + " "
                + "GROUP BY " + cfg.groupByColumns();

        if (!q.isIncludeZeroBalance()) {
            sql += " HAVING COALESCE(SUM(COALESCE(l.debit_amount, 0) + COALESCE(l.credit_amount, 0)), 0)"
                    + " + (" + openingBalanceStatic + ") <> 0";
        }

        return sql;
    }

    private String orderBy(TrialBalanceQuery q) {
        String sort = q.getSortBy() != null ? q.getSortBy().toLowerCase() : "accountcode";
        String col;
        switch (sort) {
            case "accountname" -> col = "groupName";
            case "perioddebit" -> col = "periodDebit";
            case "periodcredit" -> col = "periodCredit";
            case "transactioncount" -> col = "transactionCount";
            case "lasttransactiondate" -> col = "lastTransactionDate";
            default -> col = "groupCode";
        }
        String dir = "DESC".equalsIgnoreCase(q.getSortDirection()) ? "DESC" : "ASC";
        return " ORDER BY " + col + " " + dir;
    }

    private void bind(Query nativeQuery, TrialBalanceQuery q, List<String> params) {
        for (String p : params) {
            if ("startDate".equals(p)) {
                nativeQuery.setParameter("startDate", q.getStartDate());
            } else if ("endDate".equals(p)) {
                nativeQuery.setParameter("endDate", q.getEndDate());
            } else if ("companyId".equals(p)) {
                nativeQuery.setParameter("companyId", q.getCompanyId());
            } else if ("fiscalYearId".equals(p)) {
                nativeQuery.setParameter("fiscalYearId", q.getFiscalYearId());
            } else if ("branchId".equals(p)) {
                nativeQuery.setParameter("branchId", q.getBranchId());
            } else if ("costCenterId".equals(p)) {
                nativeQuery.setParameter("costCenterId", q.getCostCenterId());
            } else if ("projectId".equals(p)) {
                nativeQuery.setParameter("projectId", q.getProjectId());
            } else if ("departmentId".equals(p)) {
                nativeQuery.setParameter("departmentId", q.getDepartmentId());
            } else if ("currencyCode".equals(p)) {
                nativeQuery.setParameter("currencyCode", q.getCurrencyCode());
            } else if ("accountId".equals(p)) {
                nativeQuery.setParameter("accountId", q.getAccountId());
            } else if ("accountCode".equals(p)) {
                nativeQuery.setParameter("accountCode", q.getAccountCode() + "%");
            } else if ("search".equals(p)) {
                nativeQuery.setParameter("search", "%" + q.getSearch().toLowerCase() + "%");
            } else if ("accountType".equals(p)) {
                nativeQuery.setParameter("accountType", q.getAccountType());
            } else if ("accountGroupId".equals(p)) {
                nativeQuery.setParameter("accountGroupId", q.getAccountGroupId());
            } else if ("categoryId".equals(p)) {
                nativeQuery.setParameter("categoryId", q.getCategoryId());
            } else if ("parentAccountId".equals(p)) {
                nativeQuery.setParameter("parentAccountId", q.getParentAccountId());
            } else if (p.startsWith("accountId")) {
                int idx = Integer.parseInt(p.substring("accountId".length()));
                nativeQuery.setParameter(p, q.getAccountIds().get(idx));
            }
        }
    }

    private TrialBalanceAggregateRow map(Tuple t) {
        return TrialBalanceAggregateRow.builder()
                .groupId(toUUID(t.get("groupId", String.class)))
                .groupCode(str(t.get("groupCode")))
                .groupName(str(t.get("groupName")))
                .accountType(str(t.get("accountType")))
                .accountGroup(str(t.get("accountGroup")))
                .parentAccountName(str(t.get("parentAccountName")))
                .openingDebit(big(t.get("openingDebit")))
                .openingCredit(big(t.get("openingCredit")))
                .periodDebit(big(t.get("periodDebit")))
                .periodCredit(big(t.get("periodCredit")))
                .openingBalanceStatic(big(t.get("openingBalanceStatic")))
                .transactionCount(longVal(t.get("transactionCount")))
                .lastTransactionDate(date(t.get("lastTransactionDate")))
                .build();
    }

    private TrialBalanceAggregateSummary mapSummary(Tuple t) {
        return TrialBalanceAggregateSummary.builder()
                .totalGroups(longVal(t.get("totalGroups")))
                .totalOpening(big(t.get("totalOpening")))
                .totalOpeningDebit(big(t.get("totalOpeningDebit")))
                .totalOpeningCredit(big(t.get("totalOpeningCredit")))
                .totalPeriodDebit(big(t.get("totalPeriodDebit")))
                .totalPeriodCredit(big(t.get("totalPeriodCredit")))
                .totalClosingDebit(big(t.get("totalClosingDebit")))
                .totalClosingCredit(big(t.get("totalClosingCredit")))
                .accountsWithTransactions(longVal(t.get("accountsWithTransactions")))
                .build();
    }

    private static String str(Object o) {
        return o != null ? o.toString() : null;
    }

    private static UUID toUUID(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(s);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static BigDecimal big(Object o) {
        if (o == null) {
            return BigDecimal.ZERO;
        }
        if (o instanceof BigDecimal bd) {
            return bd;
        }
        if (o instanceof Number n) {
            return new BigDecimal(n.toString());
        }
        return new BigDecimal(o.toString());
    }

    private static long longVal(Object o) {
        if (o == null) {
            return 0L;
        }
        if (o instanceof Number n) {
            return n.longValue();
        }
        return Long.parseLong(o.toString());
    }

    private static LocalDate date(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof LocalDate d) {
            return d;
        }
        if (o instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        if (o instanceof java.util.Date d) {
            return new java.sql.Date(d.getTime()).toLocalDate();
        }
        return LocalDate.parse(o.toString());
    }

    private record GroupConfig(String groupId, String groupCode, String groupName, String accountType,
                               String accountGroup, String parentAccountName, String openingBalanceStatic,
                               String groupByColumns) {
    }

    private static GroupConfig config(GroupBy mode) {
        return switch (mode) {
            case ACCOUNT -> new GroupConfig(
                    "CAST(a.id AS varchar)", "a.account_code", "a.account_name", "a.account_type",
                    "ag.name", "pa.account_name", "COALESCE(a.opening_balance, 0)",
                    "a.id, a.account_code, a.account_name, a.account_type, ag.id, ag.name, ag.code, pa.id, pa.account_name, a.opening_balance");
            case ACCOUNT_GROUP -> new GroupConfig(
                    "CAST(ag.id AS varchar)", "ag.code", "ag.name", "NULL", "ag.name", "NULL", "0",
                    "ag.id, ag.code, ag.name");
            case ACCOUNT_TYPE -> new GroupConfig(
                    "a.account_type", "a.account_type", "a.account_type", "a.account_type", "NULL", "NULL", "0",
                    "a.account_type");
            case PARENT_ACCOUNT -> new GroupConfig(
                    "COALESCE(CAST(pa.id AS varchar), 'NO_PARENT')", "COALESCE(pa.account_code, 'NO-PARENT')",
                    "COALESCE(pa.account_name, 'No Parent')", "NULL", "NULL", "pa.account_name", "0",
                    "pa.id, pa.account_code, pa.account_name");
            case BRANCH -> new GroupConfig(
                    "COALESCE(CAST(l.branch_id AS varchar), 'NO_BRANCH')", "COALESCE(CAST(l.branch_id AS varchar), '')",
                    "COALESCE(CAST(l.branch_id AS varchar), 'No Branch')", "NULL", "NULL", "NULL", "0",
                    "l.branch_id");
            case COST_CENTER -> new GroupConfig(
                    "COALESCE(CAST(l.cost_center_id AS varchar), 'NO_COST_CENTER')", "COALESCE(CAST(l.cost_center_id AS varchar), '')",
                    "COALESCE(CAST(l.cost_center_id AS varchar), 'No Cost Center')", "NULL", "NULL", "NULL", "0",
                    "l.cost_center_id");
            case PROJECT -> new GroupConfig(
                    "COALESCE(CAST(l.project_id AS varchar), 'NO_PROJECT')", "COALESCE(CAST(l.project_id AS varchar), '')",
                    "COALESCE(CAST(l.project_id AS varchar), 'No Project')", "NULL", "NULL", "NULL", "0",
                    "l.project_id");
        };
    }
}
