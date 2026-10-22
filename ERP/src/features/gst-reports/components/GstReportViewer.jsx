import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Printer, RefreshCw, AlertCircle, Search, Lock } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import usePermission from '../../../hooks/usePermission';
import { useGstReport } from '../hooks/useGstReport';
import { gstReportsApi } from '../../../api/account/reports/gst';
import SummaryCards from '../../../components/reports/SummaryCards';
import ServerTable from '../../../components/reports/ServerTable';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../notifications/notificationSlice';
import CustomSelect from '../../../components/common/CustomSelect';

const MODULE = 'GST_REPORTS';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDefaultPeriod() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  return { month, year };
}

function extractRows(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const body = res.data ?? res;
  if (Array.isArray(body)) return body;
  return (
    body?.rows ??
    body?.content ??
    body?.records ??
    body?.items ??
    (Array.isArray(body?.data) ? body.data : [])
  );
}

function extractSummary(res) {
  if (!res) return {};
  const body = res.data ?? res;
  return body?.summary ?? body?.totals ?? {};
}

function extractPagination(res) {
  if (!res) return null;
  const body = res.data ?? res;
  return body?.pagination ?? res.pagination ?? null;
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default function GstReportViewer({ reportType, meta, fetcher }) {
  const dispatch = useDispatch();
  const canRead = usePermission(MODULE, 'READ');
  const canExport = usePermission(MODULE, 'EXPORT');
  const canPrint = usePermission(MODULE, 'PRINT');

  const selectedCompany = useAppSelector((s) => s.company.selectedCompany);
  const companyId = selectedCompany?.id || selectedCompany?.code || '';

  const [period, setPeriod] = useState(getDefaultPeriod);
  const [gstin, setGstin] = useState('');
  const [exporting, setExporting] = useState(false);

  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user')) || {};
    } catch {
      return {};
    }
  })();
  
  const isSystemAdmin =
    authUser?.loginType === 'ADMIN' ||
    authUser?.role === 'SYSTEM_ADMIN' ||
    authUser?.roles?.includes('SYSTEM_ADMIN') ||
    authUser?.roles?.includes('ROLE_SYSTEM_ADMIN');

  const buildPayload = useCallback(() => {
    // Convert selected month/year to fromDate and toDate
    const start = new Date(period.year, period.month - 1, 1);
    const end = new Date(period.year, period.month, 0); // Last day of month

    const pad = (n) => String(n).padStart(2, '0');
    const fromDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const toDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;

    const payload = {
      fromDate,
      toDate,
      // The backend DTO doesn't have a 'gstin' string field, it has 'gstRegistrationId' (UUID).
      // Assuming 'gstRegistrationId' cannot just take a raw string GSTIN, we omit it or adapt it 
      // based on if the user gave a valid UUID vs a string. For now we only pass dates.
    };
    
    if (isSystemAdmin) {
      payload.companyId = companyId;
    }
    
    return payload;
  }, [companyId, period, isSystemAdmin]);

  const { data, isLoading, error, refetch } = useGstReport({ fetcher });

  useEffect(() => {
    if (companyId) {
      refetch(buildPayload());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleGenerate = () => refetch(buildPayload());

  const handleExport = async () => {
    if (!canExport || exporting) return;
    setExporting(true);
    try {
      const blob = await gstReportsApi.exportReport(reportType, buildPayload());
      if (!blob || blob.size === 0) {
        dispatch(addAlert({ type: 'error', message: 'Export returned an empty file' }));
        return;
      }
      downloadBlob(blob, `${reportType}-${buildPayload().returnPeriod}.json`);
      dispatch(addAlert({ type: 'success', message: 'Report exported successfully' }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err.message || 'Failed to export report' }));
    } finally {
      setExporting(false);
    }
  };

  const rows = useMemo(() => extractRows(data), [data]);
  const summary = useMemo(() => extractSummary(data), [data]);
  const pagination = useMemo(() => extractPagination(data), [data]);
  const generatedAt = data?.generatedAt ?? data?.generatedOn ?? data?.timestamp;

  const summaryCards = useMemo(
    () =>
      meta.summaryCards.map((card) => ({
        label: card.label,
        value: summary[card.key] ?? summary[card.key.replace('total', '')] ?? '-',
        isCurrency: !!card.currency,
        color: card.color,
      })),
    [meta, summary]
  );

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <Lock size={22} className="text-zinc-400" />
        </div>
        <h3 className="text-base font-bold text-zinc-800">No access to GST Reports</h3>
        <p className="text-sm text-zinc-500 mt-1">You need the READ permission on GST_REPORTS to view this report.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Page header with permission-gated actions */}
      <div className="page-header mb-0">
        <div>
          <h1 className="page-title">{meta.title}</h1>
          <p className="page-subtitle">{meta.subtitle}</p>
          {generatedAt && (
            <p className="text-[8.8px] text-zinc-400 mt-1 font-medium">
              Generated at: {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canPrint && (
            <button onClick={() => window.print()} className="btn-secondary" type="button">
              <Printer size={15} className="text-zinc-500" />
              Print
            </button>
          )}
          {canExport && (
            <button onClick={handleExport} disabled={exporting || isLoading} className="btn-primary" type="button">
              {exporting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={15} />
              )}
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
          <div className="text-[10.4px] font-medium text-red-700">{error}</div>
        </div>
      )}

      {/* Period filters */}
      <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div className="space-y-1.5">
            <label className="block text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Return Month</label>
            <CustomSelect
              value={period.month}
              onChange={(e) => setPeriod((p) => ({ ...p, month: Number(e.target.value) }))}
              className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-300 dark:border-border-dark text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </CustomSelect>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Return Year</label>
            <CustomSelect
              value={period.year}
              onChange={(e) => setPeriod((p) => ({ ...p, year: Number(e.target.value) }))}
              className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-300 dark:border-border-dark text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none"
            >
              {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </CustomSelect>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">GSTIN (optional)</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g. 27AABCU9603R1ZM"
              maxLength={15}
              className="w-full h-9 px-3 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none"
            />
          </div>
          <div>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-[10.4px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              type="button"
            >
              {isLoading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
              {isLoading ? 'Generating…' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      <SummaryCards cards={summaryCards} isLoading={isLoading} />

      <ServerTable
        columns={meta.columns}
        data={rows}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={() => {}}
        emptyMessage={`No ${meta.title} data found for the selected period.`}
      />
    </div>
  );
}
