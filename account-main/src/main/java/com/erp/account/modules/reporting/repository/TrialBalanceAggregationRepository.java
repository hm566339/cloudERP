package com.erp.account.modules.reporting.repository;

import java.util.List;

/**
 * Native SQL aggregation for the Trial Balance report.
 *
 * A single grouped query answers both the current page (LIMIT/OFFSET) and the
 * full-dataset summary, so there is no N+1 behaviour and no loading of the
 * whole result set into memory even for 100k+ journal lines.
 */
public interface TrialBalanceAggregationRepository {

    /**
     * @return rows for the requested page, already ordered.
     */
    List<TrialBalanceAggregateRow> findAggregated(TrialBalanceQuery query, int page, int pageSize);

    /**
     * @return summary totals over the whole filtered/grouped result set.
     */
    TrialBalanceAggregateSummary findSummary(TrialBalanceQuery query);
}
