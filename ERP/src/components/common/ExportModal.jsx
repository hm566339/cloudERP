import React, { useState } from 'react';
import { X, FileText, Download, FileSpreadsheet, File } from 'lucide-react';
import API from '../../services/api';
import { useAppDispatch } from '../../app/hooks';
import { addAlert } from '../../features/notifications/notificationSlice';

const ExportModal = ({
  isOpen,
  onClose,
  reportName,
  defaultFilters = {},
  hideDateRange = false,
  selectedIds = [],
  selectedCount = 0,
  onExportCustom = null
}) => {
  const dispatch = useAppDispatch();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [format, setFormat] = useState('XLSX');
  const [isExporting, setIsExporting] = useState(false);

  const effectiveSelectedCount = selectedCount || (Array.isArray(selectedIds) ? selectedIds.length : 0);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (typeof onExportCustom === 'function') {
        await onExportCustom({
          format,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          selectedIds,
          selectedCount: effectiveSelectedCount
        });
        dispatch(addAlert({ type: 'success', message: 'Report exported successfully!' }));
        onClose();
        return;
      }

      let isSystemAdmin = false;
      try {
        const persistedRoot = JSON.parse(localStorage.getItem('persist:root'));
        if (persistedRoot && persistedRoot.auth) {
          const authState = JSON.parse(persistedRoot.auth);
          const rawRole = authState?.user?.role || '';
          const stripped = String(rawRole).toLowerCase().replace(/[\s_]/g, '');
          isSystemAdmin = stripped === 'superadmin' || stripped === 'systemadmin';
        }
        if (!isSystemAdmin) {
          const authUser = JSON.parse(localStorage.getItem('auth_user'));
          if (authUser) {
            const rawRole = Array.isArray(authUser.roles)
              ? (authUser.roles[0]?.name || authUser.roles[0] || '')
              : (authUser.role || '');
            const stripped = String(rawRole).toLowerCase().replace(/[\s_]/g, '');
            isSystemAdmin =
              authUser.loginType === 'ADMIN' ||
              stripped === 'superadmin' ||
              stripped === 'systemadmin' ||
              String(rawRole).toUpperCase().includes('SYSTEM_ADMIN');
          }
        }
      } catch (e) {
        // ignore
      }

      const companyId = isSystemAdmin ? (JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode) : undefined;

      const payload = {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        format: format,
        filters: {
          ...defaultFilters,
          ...(effectiveSelectedCount > 0 ? { selectedIds, ids: selectedIds } : {})
        }
      };

      if (effectiveSelectedCount > 0) {
        payload.selectedIds = selectedIds;
        payload.ids = selectedIds;
      }

      if (companyId) {
        payload.companyId = companyId;
      }

      let apiUrl = `/api/account/reports/export/${reportName}`;
      let finalPayload = { ...payload };

      const gstTaxReports = ['gstr1-export', 'gstr2a-export', 'gstr2b-export', 'gstr3b-export', 'hsnsummary-export', 'itc-export', 'gstsummary-export'];
      const isGstReport = gstTaxReports.includes(reportName.toLowerCase());

      if (isGstReport) {
        let backendReportName = reportName.replace('-export', '').replace('page', '').toUpperCase();
        if (backendReportName === 'HSNSUMMARY') backendReportName = 'HSN_SUMMARY';

        apiUrl = `/api/account/reports/gst/export/${format}?reportName=${backendReportName}`;

        // Map properties for GST
        finalPayload.fromDate = finalPayload.dateFrom;
        finalPayload.toDate = finalPayload.dateTo;
        delete finalPayload.dateFrom;
        delete finalPayload.dateTo;
        delete finalPayload.format;
      }

      const response = await API.post(
        apiUrl,
        { data: finalPayload },
        {
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let fileName = `${reportName}_export.${format.toLowerCase()}`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      dispatch(addAlert({ type: 'success', message: 'Report exported successfully!' }));
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      dispatch(addAlert({ type: 'error', message: 'Failed to export report' }));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1D212C] border border-zinc-200/80 dark:border-[#2A2F3D] rounded-xl shadow-xl dark:shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#161922]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-center text-zinc-700 dark:text-[#4C8DFF]">
              <Download size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#E6E8EE]">Export Report</h2>
              {effectiveSelectedCount > 0 && (
                <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] font-medium">
                  {effectiveSelectedCount} record{effectiveSelectedCount > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 bg-white dark:bg-[#1D212C]">
          {effectiveSelectedCount > 0 && (
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs">
              <span className="text-zinc-600 dark:text-[#A0A6B5] font-medium">Export Scope:</span>
              <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] px-2 py-0.5 border border-zinc-200 dark:border-[#2A2F3D] rounded shadow-2xs">
                {effectiveSelectedCount} selected record{effectiveSelectedCount > 1 ? 's' : ''} only
              </span>
            </div>
          )}
          {!hideDateRange && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10.4px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-10 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-sm text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-[#4C8DFF]/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10.4px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-10 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-sm text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-[#4C8DFF]/20 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10.4px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat('PDF')}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${format === 'PDF'
                    ? 'border-red-500 dark:border-[#F0616D] bg-red-50/50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] shadow-sm'
                    : 'border-zinc-200 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-[#3A4154] hover:bg-zinc-50 dark:hover:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5]'
                  }`}
              >
                <File size={24} className={format === 'PDF' ? 'text-red-600 dark:text-[#F0616D]' : 'text-zinc-400 dark:text-[#6B7184]'} />
                <span className="text-xs font-semibold mt-2">PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('XLSX')}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${format === 'XLSX'
                    ? 'border-emerald-500 dark:border-[#34C38F] bg-emerald-50/50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] shadow-sm'
                    : 'border-zinc-200 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-[#3A4154] hover:bg-zinc-50 dark:hover:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5]'
                  }`}
              >
                <FileSpreadsheet size={24} className={format === 'XLSX' ? 'text-emerald-600 dark:text-[#34C38F]' : 'text-zinc-400 dark:text-[#6B7184]'} />
                <span className="text-xs font-semibold mt-2">Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('CSV')}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${format === 'CSV'
                    ? 'border-blue-500 dark:border-[#4C8DFF] bg-blue-50/50 dark:bg-[#4C8DFF]/15 text-blue-700 dark:text-[#4C8DFF] shadow-sm'
                    : 'border-zinc-200 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-[#3A4154] hover:bg-zinc-50 dark:hover:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5]'
                  }`}
              >
                <FileText size={24} className={format === 'CSV' ? 'text-blue-600 dark:text-[#4C8DFF]' : 'text-zinc-400 dark:text-[#6B7184]'} />
                <span className="text-xs font-semibold mt-2">CSV</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#161922] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-zinc-900 dark:bg-[#4C8DFF] hover:bg-zinc-800 dark:hover:bg-[#6AA1FF] rounded-lg disabled:opacity-50 transition-colors shadow-sm"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>
                  Export {format === 'XLSX' ? 'Excel' : format}
                  {effectiveSelectedCount > 0 ? ` (${effectiveSelectedCount})` : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
