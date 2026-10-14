import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Printer, RefreshCw, AlertCircle, Calendar, Filter } from 'lucide-react';
import api from '../../services/api';
import { getReportConfig } from '../../metadata/reportRegistry';
import { useAuth } from '../../hooks/useAuth';
import RelationSelect from './RelationSelect';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Universal Dynamic Report Engine
 */
export default function ReportView({
  report: reportId,
  title: customTitle,
  subtitle: customSubtitle,
  className = '',
}) {
  const config = useMemo(() => getReportConfig(reportId), [reportId]);
  const { organization } = useAuth();
  const orgCurrency = organization?.currency || 'INR';

  // Initialize filter state
  const [filters, setFilters] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const initial = {};
    if (config?.filters) {
      config.filters.forEach((f) => {
        if (f.defaultToday) {
          initial[f.name] = today;
        } else if (f.name === 'startDate' || f.name === 'fromDate') {
          // Default to first day of current month
          const d = new Date();
          const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
          initial[f.name] = firstDay;
        }
      });
    }
    return initial;
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!config?.endpoint) return;

    // Check required filters
    for (const f of config.filters || []) {
      if (f.required && !filters[f.name]) {
        setData([]);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(config.endpoint, { params: filters });
      const payload = res.data?.data !== undefined ? res.data.data : res.data;
      let rows = [];
      if (Array.isArray(payload)) {
        rows = payload;
      } else if (payload?.rows && Array.isArray(payload.rows)) {
        rows = payload.rows;
      } else if (payload?.content && Array.isArray(payload.content)) {
        rows = payload.content;
      } else if (typeof payload === 'object' && payload !== null) {
        // Flatten object sections
        rows = Object.entries(payload).map(([k, v]) => ({
          accountName: k,
          amount: typeof v === 'number' ? v : v?.amount || 0,
        }));
      }
      setData(rows);
    } catch (err) {
      console.error(`[ReportView] Error loading ${reportId}:`, err);
      setError(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [config, filters, reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleFilterChange = (name, val) => {
    setFilters((prev) => ({ ...prev, [name]: val }));
  };

  const handleExport = async (formatType = 'csv') => {
    if (!config?.exportEndpoint) {
      window.print();
      return;
    }
    setExporting(true);
    try {
      const res = await api.get(config.exportEndpoint, {
        params: { ...filters, format: formatType },
        responseType: 'blob',
      });
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${reportId}-${new Date().toISOString().split('T')[0]}.${formatType}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  // Compute column totals
  const totals = useMemo(() => {
    if (!config?.totals || !data.length) return {};
    const sumMap = {};
    config.totals.forEach((key) => {
      sumMap[key] = data.reduce((acc, row) => acc + (Number(row[key]) || 0), 0);
    });
    return sumMap;
  }, [config, data]);

  if (!config) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Report &lsquo;{reportId}&rsquo; is not configured in the registry.
      </div>
    );
  }

  const columns = config.columns || [];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {customTitle || config.title}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {customSubtitle || config.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {config.exportEndpoint && (
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={exporting || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Exporting...' : 'Export'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            title="Reload Report"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Parameters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {config.filters?.map((fld) => (
          <div key={fld.name} className="flex items-center gap-2">
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              {fld.label}:
            </label>
            {fld.type === 'relation' ? (
              <div className="w-48">
                <RelationSelect
                  resource={fld.relationResource}
                  value={filters[fld.name]}
                  onChange={(val) => handleFilterChange(fld.name, val)}
                  placeholder={`Select ${fld.label}...`}
                />
              </div>
            ) : (
              <input
                type={fld.type}
                value={filters[fld.name] || ''}
                onChange={(e) => handleFilterChange(fld.name, e.target.value)}
                className="text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100"
              />
            )}
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        {error ? (
          <div className="p-8 text-center text-rose-500">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs font-semibold">{error.message || 'Failed to load report.'}</p>
          </div>
        ) : loading ? (
          <div className="p-12 text-center text-zinc-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
            <p className="text-xs">Generating report data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs">
            No records found for the selected report filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  {columns.map((col) => (
                    <th key={col.id} className="px-4 py-3">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    {columns.map((col) => {
                      const val = row[col.accessorKey || col.id];
                      return (
                        <td key={col.id} className="px-4 py-2.5 whitespace-nowrap">
                          {col.type === 'currency'
                            ? formatCurrency(val, orgCurrency)
                            : col.type === 'date'
                            ? formatDate(val)
                            : val ?? '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              {/* Totals Row */}
              {Object.keys(totals).length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    {columns.map((col, idx) => {
                      if (idx === 0) {
                        return (
                          <td key="tot-label" className="px-4 py-3 uppercase tracking-wider">
                            Total
                          </td>
                        );
                      }
                      if (totals[col.accessorKey || col.id] !== undefined) {
                        return (
                          <td key={col.id} className="px-4 py-3">
                            {formatCurrency(totals[col.accessorKey || col.id], orgCurrency)}
                          </td>
                        );
                      }
                      return <td key={col.id} className="px-4 py-3" />;
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

