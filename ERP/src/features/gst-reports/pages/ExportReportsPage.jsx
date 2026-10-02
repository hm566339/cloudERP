import React, { useState } from 'react';
import { Download, Lock, AlertCircle } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import usePermission from '../../../hooks/usePermission';
import { gstExportOptions } from '../gstReportsConfig';
import { gstReportsApi } from '../../../api/account/reports/gst';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../notifications/notificationSlice';
import { useRoutePath } from "../../../hooks/useRoutePath";
import CustomSelect from '../../../components/common/CustomSelect';

const MODULE = 'GST_REPORTS';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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
  const { buildPath } = useRoutePath();

  const dispatch = useDispatch();
  const canRead = usePermission(MODULE, 'READ');
  const canExport = usePermission(MODULE, 'EXPORT');

  const selectedCompany = useAppSelector((s) => s.company.selectedCompany);
  const companyId = selectedCompany?.id || selectedCompany?.code || '';

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
  const [year, setYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [exportingId, setExportingId] = useState(null);
  const [error, setError] = useState(null);

  const buildPayload = () => ({
    companyId,
    returnPeriod: `${String(month).padStart(2, '0')}${year}`,
    month,
    year,
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
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <Lock size={22} className="text-zinc-400" />
        </div>
        <h3 className="text-base font-bold text-zinc-800">No access to GST Reports</h3>
        <p className="text-sm text-zinc-500 mt-1">You need the READ permission on GST_REPORTS to view this page.</p>
      </div>
    );
  }


  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm pt-4 pb-4 mb-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Export Reports</h1>
              <p className="text-sm font-medium text-zinc-500 mt-1">Download GST filing data for a selected return period.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm">
            <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div className="text-[10.4px] font-medium text-red-700">{error}</div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end max-w-2xl">
            <div className="space-y-1.5">
              <label className="block text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Return Month</label>
              <CustomSelect
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 outline-none transition-all cursor-pointer"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </CustomSelect>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Return Year</label>
              <CustomSelect
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 outline-none transition-all cursor-pointer"
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </CustomSelect>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gstExportOptions.map((option) => (
            <div
              key={option.id}
              className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 flex flex-col justify-between gap-5 hover:shadow-md transition-all hover:-translate-y-0.5 group"
            >
              <div>
                <h3 className="text-base font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">{option.label}</h3>
                <p className="text-[10.4px] text-zinc-500 mt-2 leading-relaxed">{option.description}</p>
                <div className="mt-4 px-2.5 py-1.5 bg-zinc-50 rounded text-[8px] font-mono text-zinc-400 break-all border border-zinc-100">
                  POST /api/reports/gst/export/{option.type}
                </div>
              </div>
              {canExport ? (
                <button
                  onClick={() => handleExport(option)}
                  disabled={exportingId !== null}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg text-[10.4px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]"
                  type="button"
                >
                  {exportingId === option.id ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {exportingId === option.id ? 'Exporting…' : `Export ${option.label}`}
                </button>
              ) : (
                <div className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-lg text-[9.6px] font-semibold text-zinc-400 bg-zinc-50 border border-zinc-200">
                  <Lock size={14} />
                  Requires EXPORT permission
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
