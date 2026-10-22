import React, { useState } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { addAlert } from '../../features/notifications/notificationSlice';
import { useDispatch } from 'react-redux';

export default function ExportButtons({ onExportPdf, onExportExcel, onPrint, isLoading }) {
  const dispatch = useDispatch();
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const handlePdf = async () => {
    if (!onExportPdf) return;
    setExportingPdf(true);
    try {
      const blob = await onExportPdf();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: 'Failed to export PDF' }));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExcel = async () => {
    if (!onExportExcel) return;
    setExportingExcel(true);
    try {
      const blob = await onExportExcel();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: 'Failed to export Excel' }));
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="flex space-x-2">
      {onPrint && (
        <button
          onClick={onPrint}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-2 border border-zinc-300 dark:border-[#2A2F3D] shadow-sm text-sm leading-4 font-medium rounded-md text-zinc-700 dark:text-[#A0A6B5] bg-white dark:bg-[#161922] hover:bg-zinc-50 dark:hover:bg-[#222736] disabled:opacity-50"
        >
          <Printer size={16} className="mr-2 text-zinc-500" />
          Print
        </button>
      )}
      {onExportPdf && (
        <button
          onClick={handlePdf}
          disabled={isLoading || exportingPdf}
          className="inline-flex items-center px-3 py-2 border border-zinc-300 dark:border-[#2A2F3D] shadow-sm text-sm leading-4 font-medium rounded-md text-zinc-700 dark:text-[#A0A6B5] bg-white dark:bg-[#161922] hover:bg-zinc-50 dark:hover:bg-[#222736] disabled:opacity-50"
        >
          {exportingPdf ? (
            <div className="w-4 h-4 mr-2 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FileText size={16} className="mr-2 text-red-500" />
          )}
          PDF
        </button>
      )}
      {onExportExcel && (
        <button
          onClick={handleExcel}
          disabled={isLoading || exportingExcel}
          className="inline-flex items-center px-3 py-2 border border-zinc-300 dark:border-[#2A2F3D] shadow-sm text-sm leading-4 font-medium rounded-md text-zinc-700 dark:text-[#A0A6B5] bg-white dark:bg-[#161922] hover:bg-zinc-50 dark:hover:bg-[#222736] disabled:opacity-50"
        >
          {exportingExcel ? (
            <div className="w-4 h-4 mr-2 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Download size={16} className="mr-2 text-green-600" />
          )}
          Excel
        </button>
      )}
    </div>
  );
}
