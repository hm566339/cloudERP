import React, { useState } from 'react';
import { Modal, Button } from '../../../components/common';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { useImportLeadsCsvMutation } from '../../../api/sales-crm/crm.api';

export default function LeadImportModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [importLeadsCsv, { isLoading }] = useImportLeadsCsvMutation();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setErrorMsg(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setErrorMsg(null);
      const res = await importLeadsCsv({ formData, companyId }).unwrap();
      setResult(res.data);
      onSuccess?.();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to import CSV file');
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={reset}
      title="Import Leads via CSV"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {!result ? (
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-zinc-200 dark:border-[#2A2F3D] rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                id="csvInput"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="csvInput" className="cursor-pointer block">
                <UploadCloud size={36} className="mx-auto text-zinc-400 dark:text-[#6B7184] mb-2" />
                <span className="text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] block">
                  {file ? file.name : 'Click to select .CSV spreadsheet'}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-[#6B7184] mt-1 block">
                  Supports Name, Company, Email, Phone, State, GSTIN
                </span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3 bg-zinc-50 dark:bg-[#161922] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-[11px] text-zinc-600 dark:text-[#A0A6B5] space-y-1">
              <p className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">Import Specifications:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Automatic phone normalization to E.164 (+91 format)</li>
                <li>Deduplication against existing mobile numbers & emails</li>
                <li>CSV formula injection defense actively sanitized</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={reset}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!file}
                loading={isLoading}
              >
                Start Import
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center py-3">
            <CheckCircle2 size={40} className="mx-auto text-emerald-600 dark:text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
                Batch Import Completed
              </h4>
              <p className="text-xs text-zinc-500 mt-1">Status: {result.status}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center p-3 bg-zinc-50 dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D]">
              <div>
                <p className="text-xs text-zinc-500">Total</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">{result.totalRecords}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600">Imported</p>
                <p className="text-base font-bold text-emerald-600">{result.importedCount}</p>
              </div>
              <div>
                <p className="text-xs text-amber-600">Duplicate</p>
                <p className="text-base font-bold text-amber-600">{result.duplicateCount}</p>
              </div>
              <div>
                <p className="text-xs text-rose-600">Failed</p>
                <p className="text-base font-bold text-rose-600">{result.failedCount}</p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="text-left text-[11px] p-2 bg-rose-50/50 rounded-lg max-h-32 overflow-y-auto">
                <p className="font-semibold text-rose-700 mb-1">Failed Rows:</p>
                {result.errors.map((err, idx) => (
                  <p key={idx} className="text-rose-600">
                    Row {err.rowNumber}: {err.reason}
                  </p>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={reset}
              className="w-full"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

