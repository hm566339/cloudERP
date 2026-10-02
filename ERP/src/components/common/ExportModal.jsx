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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Download size={18} className="text-zinc-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Export Report</h2>
              {effectiveSelectedCount > 0 && (
                <p className="text-xs text-zinc-500 font-medium">
                  {effectiveSelectedCount} record{effectiveSelectedCount > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {effectiveSelectedCount > 0 && (
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
              <span className="text-zinc-600 font-medium">Export Scope:</span>
              <span className="font-semibold text-zinc-900 bg-white px-2 py-0.5 border border-zinc-200 rounded shadow-2xs">
                {effectiveSelectedCount} selected record{effectiveSelectedCount > 1 ? 's' : ''} only
              </span>
            </div>
          )}
          {!hideDateRange && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10.4px] font-semibold text-zinc-700">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10.4px] font-semibold text-zinc-700">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10.4px] font-semibold text-zinc-700">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat('PDF')}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${
                  format === 'PDF' 
                    ? 'border-red-500 bg-red-50/50 text-red-700 shadow-sm' 
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600'
                }`}
              >
                <File size={24} className={format === 'PDF' ? 'text-red-600' : 'text-zinc-400'} />
                <span className="text-xs font-semibold mt-2">PDF</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormat('XLSX')}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${
                  format === 'XLSX' 
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm' 
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600'
                }`}
              >
                <FileSpreadsheet size={24} className={format === 'XLSX' ? 'text-emerald-600' : 'text-zinc-400'} />
                <span className="text-xs font-semibold mt-2">Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('CSV')}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${
                  format === 'CSV' 
                    ? 'border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm' 
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600'
                }`}
              >
                <FileText size={24} className={format === 'CSV' ? 'text-blue-600' : 'text-zinc-400'} />
                <span className="text-xs font-semibold mt-2">CSV</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm"
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
