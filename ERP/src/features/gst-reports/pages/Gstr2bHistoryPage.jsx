import React, { useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, UploadCloud, RefreshCw, FileText } from 'lucide-react';
import { gstReportsApi } from '../../../api/account/reports/gst';
import { useAppSelector } from '../../../app/hooks';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { gstTabs } from '../../../components/module-tabs';
import { GstEmptyState } from '../components';

export default function Gstr2bHistoryPage() {
  const [reconciliations, setReconciliations] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const selectedCompany = useAppSelector((state) => state.company?.selectedCompany);
  const fallbackCompanyId = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem('selected_company'))?.id ||
        JSON.parse(localStorage.getItem('auth_user'))?.companyCode
      );
    } catch {
      return null;
    }
  })();
  const companyId = selectedCompany?.id || fallbackCompanyId || '';

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const payload = {
          companyId,
          data: jsonData,
        };
        const response = await gstReportsApi.reconcileGstr2b(payload);

        if (response?.data && Array.isArray(response.data)) {
          setReconciliations((prev) => [...response.data, ...prev]);
        } else {
          setReconciliations((prev) => [
            {
              id: Date.now(),
              supplierGstin: 'Uploaded Data',
              invoiceNumber: 'MULTIPLE',
              taxableValue: '-',
              taxAmount: '-',
              matchStatus: 'MATCHED',
              reconciliationDate: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      } catch (err) {
        setError(
          err?.response?.data?.message || err.message || 'Error processing GSTR-2B JSON file'
        );
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setError('Failed to read file from disk.');
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {/* Website Standard PageHeader */}
      <PageHeader
        title="GSTR-2B Reconciliation"
        subtitle="Upload counterparty GSTR-2B auto-drafted returns and audit matched input tax credits"
        actions={
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn-primary h-9 px-4 flex items-center gap-2 text-xs font-semibold"
            type="button"
          >
            {isUploading ? (
              <RefreshCw size={14} className="animate-spin text-white" />
            ) : (
              <UploadCloud size={15} />
            )}
            <span>{isUploading ? 'Reconciling Data…' : 'Upload GSTR-2B JSON'}</span>
          </button>
        }
      />

      {/* Cross-report Navigation Tabs */}
      <ModuleTabs tabs={gstTabs} />

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 p-4 rounded-xl flex items-start gap-3 shadow-xs">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs font-medium">{error}</div>
        </div>
      )}

      {/* Upload Callout Card */}
      <div className="bg-white dark:bg-card-dark rounded-xl border border-zinc-200 dark:border-border-dark p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
            <UploadCloud size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
              Reconcile Books Against Inward Supplies
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Upload your official monthly or quarterly GSTR-2B JSON file from the GST portal to
              automatically compare supplier invoices against your purchase registers.
            </p>
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn-secondary h-9 px-4 text-xs font-semibold shrink-0 flex items-center gap-1.5"
          type="button"
        >
          <FileText size={14} />
          <span>Select JSON File</span>
        </button>
      </div>

      {/* Reconciliation Records Table */}
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-xs border border-zinc-200 dark:border-border-dark overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-border-dark flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">
              Reconciliation Audit Trail
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Recent invoice verification and match status history
            </p>
          </div>
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
            {reconciliations.length} {reconciliations.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10.4px] min-w-[700px]">
            <thead className="bg-zinc-50/80 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-border-dark text-zinc-500 dark:text-[#A0A6B5] font-semibold uppercase tracking-wider text-[8.8px] whitespace-nowrap">
              <tr>
                <th className="p-3.5">Supplier GSTIN</th>
                <th className="p-3.5">Invoice Number</th>
                <th className="p-3.5 text-right">Taxable Value</th>
                <th className="p-3.5 text-right">Tax Amount</th>
                <th className="p-3.5">Match Status</th>
                <th className="p-3.5 text-right">Reconciled At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-border-dark">
              {reconciliations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-0">
                    <GstEmptyState
                      title="No reconciliation records found"
                      description="Upload a GSTR-2B JSON file using the button above to begin automatic matching."
                    />
                  </td>
                </tr>
              ) : (
                reconciliations.map((r, idx) => (
                  <tr
                    key={r.id || idx}
                    className="hover:bg-zinc-50/70 dark:hover:bg-hover-dark/30 transition-colors"
                  >
                    <td className="p-3.5 font-mono text-zinc-700 dark:text-zinc-300">
                      {r.supplierGstin || '-'}
                    </td>
                    <td className="p-3.5 font-semibold text-zinc-900 dark:text-[#E6E8EE]">
                      {r.invoiceNumber || '-'}
                    </td>
                    <td className="p-3.5 text-right font-medium text-zinc-900 dark:text-[#E6E8EE]">
                      {r.taxableValue !== '-' ? `₹ ${r.taxableValue}` : '-'}
                    </td>
                    <td className="p-3.5 text-right font-medium text-zinc-900 dark:text-[#E6E8EE]">
                      {r.taxAmount !== '-' ? `₹ ${r.taxAmount}` : '-'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                          r.matchStatus === 'MATCHED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {r.matchStatus === 'MATCHED' ? (
                          <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertCircle size={11} className="text-amber-600 dark:text-amber-400" />
                        )}
                        <span>{r.matchStatus}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-zinc-500 dark:text-zinc-400">
                      {r.reconciliationDate
                        ? new Date(r.reconciliationDate).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : new Date().toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
