import React from 'react';
import { FileCheck, CheckCircle2, Download, ExternalLink, Hash, DollarSign } from 'lucide-react';
import Badge from '../../../components/common/Badge';

const formatINR = (val) => {
  if (val == null || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export default function QuotationReadyCard({ message }) {
  const metadata = message.metadata || {};

  return (
    <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 p-4 max-w-lg shadow-2xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60 dark:border-emerald-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white uppercase">
              Quotation Ready
            </h4>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {metadata.quotationNumber ? `Quote #${metadata.quotationNumber}` : 'Generated & Approved'}
            </span>
          </div>
        </div>
        <Badge variant="success" dot size="sm">
          READY
        </Badge>
      </div>

      {/* Content */}
      <div className="py-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
        {message.content}
      </div>

      {/* Details Box */}
      <div className="bg-white/70 dark:bg-zinc-900/40 rounded-lg p-2.5 border border-zinc-200/60 dark:border-zinc-800 space-y-1.5 text-[11px]">
        {metadata.quotationNumber && (
          <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Hash className="w-3 h-3" /> Quotation No:
            </span>
            <span className="font-mono font-semibold">{metadata.quotationNumber}</span>
          </div>
        )}
        {(metadata.totalAmount != null || metadata.amount != null) && (
          <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Final Amount:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
              {formatINR(metadata.totalAmount || metadata.amount)}
            </span>
          </div>
        )}
      </div>

      {/* Download / View Button */}
      {metadata.pdfUrl && (
        <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-500/20 flex justify-end">
          <a
            href={metadata.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Quotation PDF
          </a>
        </div>
      )}
    </div>
  );
}
