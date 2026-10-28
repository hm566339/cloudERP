import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Search,
  ExternalLink,
  ChevronsUpDown,
  FileText
} from 'lucide-react';

const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
};

/**
 * Reusable Financial Statement Table for Profit & Loss and Balance Sheet.
 * Matches General Ledger table styling, column visibility, and dark/light mode theme.
 */
export default function FinancialStatementTable({
  sections = [],
  grandTotals = [],
  loading = false,
  onAccountClick = null,
  emptyMessage = 'No financial statement data available',
  emptyDescription = 'Try adjusting your date range or filters above to generate the report.',
  hideToolbar = false,
  searchTerm: externalSearchTerm,
  visibleColumns = ['accountCode', 'accountName', 'category', 'amount'],
  collapsedSections: externalCollapsedSections,
  onToggleSection = null,
  className = ''
}) {
  const [internalCollapsedSections, setInternalCollapsedSections] = useState({});
  const [internalSearchTerm, setInternalSearchTerm] = useState('');

  const collapsedSections = externalCollapsedSections !== undefined
    ? externalCollapsedSections
    : internalCollapsedSections;

  const searchTerm = externalSearchTerm !== undefined
    ? externalSearchTerm
    : internalSearchTerm;

  const toggleSection = (id) => {
    if (onToggleSection) {
      onToggleSection(id);
    } else {
      setInternalCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const toggleAll = () => {
    const allCollapsed = sections.every(s => collapsedSections[s.id]);
    const next = {};
    sections.forEach(s => {
      next[s.id] = !allCollapsed;
    });
    setInternalCollapsedSections(next);
  };

  // Filter rows within sections by search term
  const filteredSections = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return sections;
    const lower = searchTerm.toLowerCase().trim();

    return sections.map(section => {
      const matchedRows = (section.rows || []).filter(r =>
        (r.accountCode && String(r.accountCode).toLowerCase().includes(lower)) ||
        (r.accountName && String(r.accountName).toLowerCase().includes(lower)) ||
        (r.name && String(r.name).toLowerCase().includes(lower)) ||
        (r.accountType && String(r.accountType).toLowerCase().includes(lower)) ||
        (r.category && String(r.category).toLowerCase().includes(lower)) ||
        (r.notes && String(r.notes).toLowerCase().includes(lower))
      );
      return {
        ...section,
        rows: matchedRows
      };
    }).filter(section => (section.rows && section.rows.length > 0) || section.title.toLowerCase().includes(lower));
  }, [sections, searchTerm]);

  const totalRowCount = useMemo(() => {
    return sections.reduce((acc, s) => acc + (s.rows?.length || 0), 0);
  }, [sections]);

  const showCode = visibleColumns.includes('accountCode');
  const showName = visibleColumns.includes('accountName');
  const showCategory = visibleColumns.includes('category');
  const showAmount = visibleColumns.includes('amount');

  const textColSpan = Math.max(
    1,
    (showCode ? 1 : 0) + (showName ? 1 : 0) + (showCategory ? 1 : 0)
  );

  const totalVisibleCols = (showCode ? 1 : 0) + (showName ? 1 : 0) + (showCategory ? 1 : 0) + (showAmount ? 1 : 0);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-[#161922] ${hideToolbar ? '' : 'border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-2xs'} p-6 space-y-4 animate-pulse`}>
        <div className="h-9 bg-zinc-100 dark:bg-[#1D212C] rounded-lg w-1/3" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-zinc-50 dark:bg-[#1D212C]/60 rounded-lg border border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between px-4">
              <div className="h-4 bg-zinc-200 dark:bg-[#2A2F3D] rounded w-1/4" />
              <div className="h-4 bg-zinc-200 dark:bg-[#2A2F3D] rounded w-1/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (totalRowCount === 0 && !loading) {
    return (
      <div className={`bg-white dark:bg-[#161922] ${hideToolbar ? '' : 'border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-2xs'} p-12 text-center flex flex-col items-center justify-center`}>
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-[#1D212C] flex items-center justify-center text-zinc-400 dark:text-[#A0A6B5] mb-3">
          <FileText size={24} />
        </div>
        <h4 className="text-base font-semibold text-zinc-800 dark:text-[#E6E8EE]">{emptyMessage}</h4>
        <p className="text-xs text-zinc-500 dark:text-[#6B7184] mt-1 max-w-sm">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-[#161922] ${hideToolbar ? '' : 'border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-2xs'} overflow-hidden flex flex-col ${className}`}>
      {/* Table Toolbar if not embedded in a parent card */}
      {!hideToolbar && (
        <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#161922] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184]" />
            <input
              type="text"
              value={internalSearchTerm}
              onChange={(e) => setInternalSearchTerm(e.target.value)}
              placeholder="Filter accounts..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-zinc-800 dark:text-[#E6E8EE] focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-[#4C8DFF] transition-all placeholder:text-zinc-400 dark:placeholder-[#6B7184]"
            />
          </div>

          <button
            type="button"
            onClick={toggleAll}
            className="h-8 px-2.5 text-[11px] font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <ChevronsUpDown size={13} />
            <span>Toggle All Sections</span>
          </button>
        </div>
      )}

      {/* Main Hierarchical Statement Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-zinc-50/80 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-[#A0A6B5] text-[10px] font-bold uppercase tracking-wider">
            <tr>
              {showCode && <th className="py-3 px-4 w-36 whitespace-nowrap">Account Code</th>}
              {showName && <th className="py-3 px-4 min-w-[220px]">Account Name &amp; Description</th>}
              {showCategory && <th className="py-3 px-4 w-40 text-left whitespace-nowrap">Category / Type</th>}
              {showAmount && <th className="py-3 px-4 w-44 text-right whitespace-nowrap">Amount</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
            {filteredSections.map((section) => {
              const isCollapsed = !!collapsedSections[section.id];
              const sectionRows = section.rows || [];
              const subtotalAmt = section.subtotal != null
                ? section.subtotal
                : sectionRows.reduce((sum, r) => sum + Number(r.amount ?? r.closingBalance ?? 0), 0);

              return (
                <React.Fragment key={section.id}>
                  {/* Section Header Row */}
                  <tr
                    onClick={() => toggleSection(section.id)}
                    className="bg-zinc-100/70 dark:bg-[#1D212C]/70 hover:bg-zinc-100 dark:hover:bg-[#222736] cursor-pointer border-y border-zinc-200/80 dark:border-[#2A2F3D] transition-colors select-none"
                  >
                    <td colSpan={textColSpan} className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 dark:text-[#A0A6B5]">
                          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-xs tracking-wider uppercase">
                          {section.title}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-[#A0A6B5] font-semibold ml-1 bg-zinc-200/70 dark:bg-[#2A2F3D] px-2 py-0.5 rounded-full">
                          {sectionRows.length} {sectionRows.length === 1 ? 'account' : 'accounts'}
                        </span>
                      </div>
                    </td>
                    {showAmount && (
                      <td className="py-2.5 px-4 text-right font-bold text-xs text-zinc-900 dark:text-[#E6E8EE] tabular-nums font-mono">
                        {formatINR(subtotalAmt)}
                      </td>
                    )}
                  </tr>

                  {/* Section Line Rows */}
                  {!isCollapsed && (
                    <>
                      {sectionRows.length === 0 ? (
                        <tr>
                          <td colSpan={totalVisibleCols} className="py-3 px-8 text-center text-zinc-400 dark:text-[#6B7184] italic text-[11px]">
                            No accounts recorded under this section for the selected period.
                          </td>
                        </tr>
                      ) : (
                        sectionRows.map((row, rIdx) => {
                          const amt = Number(row.amount ?? row.closingBalance ?? row.netAmount ?? 0);
                          const isClickable = typeof onAccountClick === 'function';

                          return (
                            <tr
                              key={row.accountId || row.accountCode || rIdx}
                              onClick={() => isClickable && onAccountClick(row.accountId || row.id, row)}
                              className={`group hover:bg-zinc-50/90 dark:hover:bg-[#1D212C]/60 transition-colors ${
                                isClickable ? 'cursor-pointer' : ''
                              }`}
                            >
                              {showCode && (
                                <td className="py-2.5 px-4 font-mono text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] pl-8">
                                  <span className="group-hover:text-zinc-900 dark:group-hover:text-[#E6E8EE] transition-colors">
                                    {row.accountCode || '—'}
                                  </span>
                                </td>
                              )}
                              {showName && (
                                <td className="py-2.5 px-4 text-zinc-800 dark:text-[#E6E8EE]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-xs group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                      {row.accountName || row.name || 'Unnamed Account'}
                                    </span>
                                    {isClickable && (
                                      <ExternalLink
                                        size={12}
                                        className="text-zinc-400 dark:text-[#6B7184] group-hover:text-[#4C8DFF] transition-colors opacity-0 group-hover:opacity-100"
                                        title="View in General Ledger"
                                      />
                                    )}
                                  </div>
                                  {row.notes && (
                                    <p className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">{row.notes}</p>
                                  )}
                                </td>
                              )}
                              {showCategory && (
                                <td className="py-2.5 px-4 text-zinc-500 dark:text-[#A0A6B5]">
                                  <span className="inline-flex items-center text-[8.5px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]">
                                    {row.accountType || row.category || 'General'}
                                  </span>
                                </td>
                              )}
                              {showAmount && (
                                <td className="py-2.5 px-4 text-right font-medium text-xs text-zinc-800 dark:text-[#E6E8EE] tabular-nums font-mono">
                                  {formatINR(amt)}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}

                      {/* Section Subtotal Row */}
                      <tr className="bg-zinc-50/60 dark:bg-[#161922]/60 border-t border-zinc-200/70 dark:border-[#2A2F3D] font-semibold text-xs">
                        <td colSpan={textColSpan} className="py-2.5 px-4 pl-8 text-zinc-600 dark:text-[#A0A6B5] text-[11px] uppercase tracking-wider">
                          {section.subtotalLabel || `Total ${section.title}`}
                        </td>
                        {showAmount && (
                          <td className="py-2.5 px-4 text-right font-bold text-xs text-zinc-900 dark:text-[#E6E8EE] border-t border-zinc-200 dark:border-[#2A2F3D] tabular-nums font-mono">
                            {formatINR(subtotalAmt)}
                          </td>
                        )}
                      </tr>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Grand Totals Footer */}
          {grandTotals.length > 0 && (
            <tfoot className="border-t-2 border-zinc-300 dark:border-[#2A2F3D] bg-zinc-50/90 dark:bg-[#161922] divide-y divide-zinc-200 dark:divide-[#2A2F3D]">
              {grandTotals.map((gt, idx) => {
                const amt = Number(gt.amount || 0);
                const isProfit = amt >= 0;

                return (
                  <tr key={idx} className="font-bold text-xs">
                    <td colSpan={textColSpan} className="py-3 px-4 text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wide text-[11px]">
                      <div className="flex items-center gap-2">
                        <span>{gt.label}</span>
                        {gt.isBalanced !== undefined && (
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
                              gt.isBalanced
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}
                          >
                            {gt.isBalanced ? 'Balanced' : 'Discrepancy'}
                          </span>
                        )}
                      </div>
                    </td>
                    {showAmount && (
                      <td
                        className={`py-3 px-4 text-right text-sm tabular-nums font-mono ${
                          gt.color
                            ? gt.color
                            : gt.isNetProfit !== undefined
                            ? isProfit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                            : 'text-zinc-900 dark:text-[#E6E8EE]'
                        }`}
                      >
                        {formatINR(amt)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
