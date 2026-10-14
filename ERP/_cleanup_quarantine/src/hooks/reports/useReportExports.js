import { useState } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { reportsApiSlice } from '../../api/account';
import { addAlert } from '../../features/notifications/notificationSlice';

export const useReportExports = () => {
  const dispatch = useAppDispatch();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExport = async (type, endpoint, params, filename) => {
    const isPdf = type === 'pdf';
    const setExporting = isPdf ? setIsExportingPdf : setIsExportingExcel;
    
    setExporting(true);
    try {
      const result = await dispatch(endpoint.initiate(params)).unwrap();
      const url = window.URL.createObjectURL(new Blob([result]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      dispatch(addAlert({ type: 'success', message: `${isPdf ? 'PDF' : 'Excel'} export downloaded successfully!` }));
    } catch (err) {
      console.error(`Failed to export ${type}:`, err);
      dispatch(addAlert({ type: 'error', message: `Failed to generate ${isPdf ? 'PDF' : 'Excel'} export.` }));
    } finally {
      setExporting(false);
    }
  };

  const exportTrialBalancePdf = (params, filename = 'Trial_Balance.pdf') => 
    handleExport('pdf', reportsApiSlice.endpoints.getTrialBalancePdf, params, filename);

  const exportTrialBalanceExcel = (params, filename = 'Trial_Balance.xlsx') => 
    handleExport('excel', reportsApiSlice.endpoints.getTrialBalanceExcel, params, filename);

  const exportCashFlowPdf = (params, filename = 'Cash_Flow.pdf') => 
    handleExport('pdf', reportsApiSlice.endpoints.getCashFlowReportPdf, params, filename);

  return {
    isExportingPdf,
    isExportingExcel,
    exportTrialBalancePdf,
    exportTrialBalanceExcel,
    exportCashFlowPdf
  };
};
