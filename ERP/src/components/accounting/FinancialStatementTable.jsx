import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Search,
  ExternalLink,
  ChevronsUpDown,
  FileText,
  AlertCircle
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
 *
 * @param {Array} sections - [{
 *    id: string,
 *    title: string,
 *    subtotalLabel: string,
 *    subtotal: number,
 *    colorClass?: string,
 *    rows: [{ accountId, accountCode, accountName, accountType, amount, notes, closingBalance, openingBalance, ... }]
 * }]
 * @param {Array} grandTotals - [{ label: string, amount: number, isNetProfit?: boolean, isBalanced?: boolean, color?: string }]
 * @param {boolean} loading - Loading state
 * @param {Function} onAccountClick - Drilldown callback (accountId, row) => void
 * @param {string} emptyMessage
 * @param {string} emptyDescription
 */
export default function FinancialStatementTable({
  sections = [],
  grandTotals = [],
  loading = false,
  onAccountClick = null,
  emptyMessage = 'No financial statement data available',
  emptyDescription = 'Try adjusting your date range or filters above to generate the report.'
}) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSection = (id) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const allCollapsed = sections.every(s => collapsedSections[s.id]);
    const next = {};
    sections.forEach(s => {
      next[s.id] = !allCollapsed;
    });
    setCollapsedSections(next);
  };

  // Filter rows within sections by search term
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const lower = searchTerm.toLowerCase().trim();

    return sections.map(section => {
      const matchedRows = (section.rows || []).filter(r =>
        (r.accountCode && String(r.accountCode).toLowerCase().includes(lower)) ||
        (r.accountName && String(r.accountName).toLowerCase().includes(lower)) ||
        (r.accountType && String(r.accountType).toLowerCase().includes(lower))
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

  if (loading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs p-6 space-y-4 animate-pulse">
        <div className="h-9 bg-zinc-100 rounded-lg w-1/3" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-between px-4">
              <div className="h-4 bg-zinc-200 rounded w-1/4" />
              <div className="h-4 bg-zinc-200 rounded w-1/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (totalRowCount === 0 && !loading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
          <FileText size={24} />
        </div>
        <h4 className="text-base font-semibold text-zinc-800">{emptyMessage}</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-3 sm:p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter accounts..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
          />
        </div>

        <button
          type="button"
          onClick={toggleAll}
          className="h-8 px-2.5 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 shadow-2xs"
        >
          <ChevronsUpDown size={13} />
          <span>Toggle All Sections</span>
        </button>
      </div>

      {/* Main Hierarchical Statement Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-32">Account Code</th>
              <th className="py-3 px-4">Account Name &amp; Description</th>
              <th className="py-3 px-4 w-40 text-left">Category / Type</th>
              <th className="py-3 px-4 w-44 text-right">Amount</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
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
                    className="bg-zinc-100/70 hover:bg-zinc-100 cursor-pointer border-y border-zinc-200/80 transition-colors select-none"
                  >
                    <td colSpan={3} className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">
                          {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                        </span>
                        <span className="font-bold text-zinc-900 text-xs tracking-wider uppercase">
                          {section.title}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-semibold ml-1 bg-zinc-200/70 px-1.5 py-0.5 rounded-full">
                          {sectionRows.length} {sectionRows.length === 1 ? 'account' : 'accounts'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-zinc-900">
                      {formatINR(subtotalAmt)}
                    </td>
                  </tr>

                  {/* Section Line Rows */}
                  {!isCollapsed && (
                    <>
                      {sectionRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-3 px-8 text-center text-zinc-400 italic text-[11px]">
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
                              className={`group hover:bg-zinc-50/90 transition-colors ${
                                isClickable ? 'cursor-pointer' : ''
                              }`}
                            >
                              <td className="py-2.5 px-4 font-mono text-zinc-600 pl-8">
                                <span className="group-hover:text-zinc-900 font-medium">
                                  {row.accountCode || '—'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-zinc-800">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold group-hover:text-zinc-900">
                                    {row.accountName || row.name || 'Unnamed Account'}
                                  </span>
                                  {isClickable && (
                                    <ExternalLink
                                      size={11}
                                      className="text-zinc-300 group-hover:text-zinc-600 transition-colors opacity-0 group-hover:opacity-100"
                                      title="View Ledger"
                                    />
                                  )}
                                </div>
                                {row.notes && (
                                  <p className="text-[10px] text-zinc-400 mt-0.5">{row.notes}</p>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-zinc-500">
                                <span className="inline-block text-[9.5px] uppercase font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                                  {row.accountType || row.category || 'General'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right font-medium text-zinc-800 tabular-nums">
                                {formatINR(amt)}
                              </td>
                            </tr>
                          );
                        })
                      )}

                      {/* Section Subtotal Row */}
                      <tr className="bg-zinc-50/50 border-t border-zinc-200/60 font-semibold text-zinc-900 text-xs">
                        <td colSpan={3} className="py-2 px-4 pl-8 text-zinc-600 text-[11px] uppercase tracking-wider">
                          {section.subtotalLabel || `Total ${section.title}`}
                        </td>
                        <td className="py-2 px-4 text-right font-bold text-zinc-900 border-t border-zinc-200">
                          {formatINR(subtotalAmt)}
                        </td>
                      </tr>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Grand Totals Footer */}
          {grandTotals.length > 0 && (
            <tfoot className="border-t-2 border-zinc-300 bg-zinc-50 divide-y divide-zinc-200">
              {grandTotals.map((gt, idx) => {
                const amt = Number(gt.amount || 0);
                const isProfit = amt >= 0;

                return (
                  <tr key={idx} className="font-bold text-xs">
                    <td colSpan={3} className="py-3 px-4 text-zinc-900 uppercase tracking-wide text-[11.5px]">
                      <div className="flex items-center gap-2">
                        <span>{gt.label}</span>
                        {gt.isBalanced !== undefined && (
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
                              gt.isBalanced
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {gt.isBalanced ? 'Balanced' : 'Discrepancy'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className={`py-3 px-4 text-right text-sm tabular-nums ${
                        gt.color
                          ? gt.color
                          : gt.isNetProfit !== undefined
                          ? isProfit
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                          : 'text-zinc-900'
                      }`}
                    >
                      {formatINR(amt)}
                    </td>
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
