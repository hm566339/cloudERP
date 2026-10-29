import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, Download, Printer, RefreshCw, AlertCircle, Lock } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import usePermission from '../../../hooks/usePermission';
import { useGstReport } from '../hooks/useGstReport';
import { gstReportsApi } from '../../../api/account/reports/gst';
import ServerTable from '../../../components/reports/ServerTable';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../notifications/notificationSlice';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { gstTabs } from '../../../components/module-tabs';
import { GstPeriodFilter, getDefaultPeriod, GstKpiCards } from '../components';

const MODULE = 'GST_REPORTS';

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
  const currency = selectedCompany?.baseCurrency || 'INR';

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
    const start = new Date(period.year, period.month - 1, 1);
    const end = new Date(period.year, period.month, 0);

    const pad = (n) => String(n).padStart(2, '0');
    const fromDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const toDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;

    const payload = {
      fromDate,
      toDate,
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
  }, [companyId, refetch, buildPayload]);

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
      downloadBlob(blob, `${reportType}-${buildPayload().returnPeriod || 'data'}.json`);
      dispatch(addAlert({ type: 'success', message: 'Report exported successfully' }));
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err.message || 'Failed to export report',
        })
      );
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
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-card-dark border border-zinc-200 dark:border-border-dark flex items-center justify-center mb-4">
          <Lock size={22} className="text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">No access to GST Reports</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          You need the READ permission on GST_REPORTS to view this report.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-6.5rem)] h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* Website Standard PageHeader */}
      <PageHeader
        title={meta.title}
        description={
          generatedAt
            ? `${meta.subtitle} • Generated at: ${new Date(generatedAt).toLocaleString()}`
            : meta.subtitle
        }
        actions={
          <div className="flex items-center gap-2">
            {canPrint && (
              <button
                onClick={() => window.print()}
                className="btn-secondary h-9 px-3 flex items-center gap-1.5"
                type="button"
              >
                <Printer size={15} />
                <span>Print</span>
              </button>
            )}
            {canExport && (
              <button
                onClick={handleExport}
                disabled={exporting || isLoading}
                className="btn-primary h-9 px-3 flex items-center gap-1.5"
                type="button"
              >
                {exporting ? (
                  <RefreshCw size={15} className="animate-spin text-white" />
                ) : (
                  <Download size={15} />
                )}
                <span>{exporting ? 'Exporting…' : 'Export'}</span>
              </button>
            )}
          </div>
        }
      />

      {/* Cross-report Navigation Tabs */}
      <ModuleTabs tabs={gstTabs} />

      <div className="p-6 space-y-6 flex-1">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 p-4 rounded-xl flex items-start gap-3 shadow-xs">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs font-medium">{error}</div>
        </div>
      )}

      {/* Filter Component */}
      <GstPeriodFilter
        period={period}
        onPeriodChange={setPeriod}
        gstin={gstin}
        onGstinChange={setGstin}
        onSearch={handleGenerate}
        onReset={() => {
          setPeriod(getDefaultPeriod());
          setGstin('');
        }}
        isLoading={isLoading}
        searchButtonText="Generate Report"
        showAdvanced={false}
      />

      {/* KPI Cards */}
      <GstKpiCards cards={summaryCards} currency={currency} isLoading={isLoading} />

      {/* Report Table */}
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-xs border border-zinc-200 dark:border-border-dark overflow-hidden">
        <ServerTable
          columns={meta.columns}
          data={rows}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={() => {}}
          emptyMessage={`No ${meta.title} data found for the selected period.`}
        />
      </div>
          </div>
    </div>
  );
}
