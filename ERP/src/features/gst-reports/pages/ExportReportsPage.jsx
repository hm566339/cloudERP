import React, { useState } from 'react';
import { Download, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import usePermission from '../../../hooks/usePermission';
import { gstExportOptions } from '../gstReportsConfig';
import { gstReportsApi } from '../../../api/account/reports/gst';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../notifications/notificationSlice';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { gstTabs } from '../../../components/module-tabs';
import { GstPeriodFilter, getDefaultPeriod } from '../components';

const MODULE = 'GST_REPORTS';

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

export default function ExportReportsPage() {
  const dispatch = useDispatch();
  const canRead = usePermission(MODULE, 'READ');
  const canExport = usePermission(MODULE, 'EXPORT');

  const selectedCompany = useAppSelector((s) => s.company.selectedCompany);
  const companyId = selectedCompany?.id || selectedCompany?.code || '';

  const defaultPeriod = getDefaultPeriod();
  const [period, setPeriod] = useState({ month: defaultPeriod.month, year: defaultPeriod.year });
  const [exportingId, setExportingId] = useState(null);
  const [error, setError] = useState(null);

  const buildPayload = () => ({
    companyId,
    returnPeriod: `${String(period.month).padStart(2, '0')}${period.year}`,
    month: period.month,
    year: period.year,
  });

  const handleExport = async (option) => {
    if (!canExport || exportingId) return;
    setExportingId(option.id);
    setError(null);
    try {
      const blob = await gstReportsApi.exportReport(option.type, buildPayload());
      if (!blob || blob.size === 0) {
        setError(`Export for ${option.label} returned an empty file.`);
        return;
      }
      downloadBlob(blob, `${option.type}-${buildPayload().returnPeriod}.json`);
      dispatch(addAlert({ type: 'success', message: `${option.label} exported successfully` }));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || `Failed to export ${option.label}`);
    } finally {
      setExportingId(null);
    }
  };

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-card-dark border border-zinc-200 dark:border-border-dark flex items-center justify-center mb-4">
          <Lock size={22} className="text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">No access to GST Reports</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          You need the READ permission on GST_REPORTS to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-6.5rem)] h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* Website Standard PageHeader */}
      <PageHeader
        title="Export GST Reports"
        description="Download government-compliant GST filing JSON and datasets for return periods"
        icon={Download}
      />

      {/* Cross-report Navigation Tabs */}
      <ModuleTabs tabs={gstTabs} />

      <div className="p-6 space-y-6 flex-1">
      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 p-4 rounded-xl flex items-start gap-3 shadow-xs">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs font-medium">{error}</div>
        </div>
      )}

      {/* Period Selector */}
      <GstPeriodFilter
        period={period}
        onPeriodChange={setPeriod}
        showGstin={false}
        searchButtonText="Select Period"
        onSearch={() => {}}
        onReset={() => setPeriod({ month: defaultPeriod.month, year: defaultPeriod.year })}
        showAdvanced={false}
      />

      {/* Export Options Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gstExportOptions.map((option) => (
          <div
            key={option.id}
            className="bg-white dark:bg-card-dark rounded-xl border border-zinc-200 dark:border-border-dark shadow-xs p-5 flex flex-col justify-between gap-4 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] group-hover:text-primary transition-colors">
                  {option.label}
                </h3>
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-surface-dark text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-border-dark">
                  JSON
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                {option.description}
              </p>
              <div className="mt-4 px-2.5 py-1.5 bg-zinc-50 dark:bg-surface-dark/70 rounded-md text-[9px] font-mono text-zinc-500 dark:text-zinc-400 break-all border border-zinc-100 dark:border-border-dark/50">
                POST /api/reports/gst/export/{option.type}
              </div>
            </div>

            {canExport ? (
              <button
                onClick={() => handleExport(option)}
                disabled={exportingId !== null}
                className="btn-primary w-full h-9 text-xs font-semibold flex items-center justify-center gap-2"
                type="button"
              >
                {exportingId === option.id ? (
                  <RefreshCw size={14} className="animate-spin text-white" />
                ) : (
                  <Download size={14} />
                )}
                <span>
                  {exportingId === option.id ? 'Generating Export…' : `Export ${option.label}`}
                </span>
              </button>
            ) : (
              <div className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-[10px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark">
                <Lock size={13} />
                <span>Requires EXPORT permission</span>
              </div>
            )}
          </div>
        ))}
      </div>
          </div>
    </div>
  );
}
