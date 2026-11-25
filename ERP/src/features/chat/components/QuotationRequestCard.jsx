import React, { useState } from 'react';
import {
  FileText,
  User,
  Phone,
  Mail,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import Badge from '../../../components/common/Badge';

const formatINR = (val) => {
  if (val == null || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export default function QuotationRequestCard({
  message,
  onUpdateStatus,
  isUpdating = false,
}) {
  const metadata = message.metadata || {};
  const status = message.actionStatus || 'OPEN';
  const [comment, setComment] = useState('');
  const [isActionOpen, setIsActionOpen] = useState(false);

  const getStatusBadge = () => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="success" dot size="sm">
            COMPLETED
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="info" dot size="sm">
            IN PROGRESS
          </Badge>
        );
      case 'OPEN':
      default:
        return (
          <Badge variant="warning" dot size="sm">
            OPEN
          </Badge>
        );
    }
  };

  const handleStatusChange = (newStatus) => {
    if (onUpdateStatus) {
      onUpdateStatus(message.id, newStatus, comment);
      setIsActionOpen(false);
      setComment('');
    }
  };

  return (
    <div className="rounded-xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/10 p-4 max-w-lg shadow-2xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 dark:border-amber-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white uppercase">
              Quotation Request
            </h4>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {message.referenceId ? `Ref: ${String(message.referenceId).substring(0, 8)}...` : 'New CRM RFQ'}
            </span>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Content Summary */}
      <div className="py-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
        {message.content}
      </div>

      {/* Structured Details Grid */}
      <div className="grid grid-cols-2 gap-2 py-2 text-[11px] bg-white/70 dark:bg-zinc-900/40 rounded-lg p-2.5 border border-zinc-200/60 dark:border-zinc-800">
        {metadata.clientName && (
          <div className="col-span-2 flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-semibold">
            <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{metadata.clientName}</span>
          </div>
        )}
        {metadata.clientPhone && (
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="truncate">{metadata.clientPhone}</span>
          </div>
        )}
        {metadata.clientEmail && (
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="truncate">{metadata.clientEmail}</span>
          </div>
        )}
        {(metadata.estimatedAmount != null || metadata.amount != null) && (
          <div className="col-span-2 pt-1 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="text-zinc-500 dark:text-zinc-400">Estimated Value:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
              {formatINR(metadata.estimatedAmount || metadata.amount)}
            </span>
          </div>
        )}
      </div>

      {/* Action Controls for Accounts / Sales */}
      {status !== 'COMPLETED' && (
        <div className="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-amber-500/20 flex flex-wrap items-center justify-end gap-2">
          {status === 'OPEN' && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800/40 transition-colors disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
              Accept & Start
            </button>
          )}

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => setIsActionOpen(!isActionOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-3 h-3" />
            Mark Completed
          </button>
        </div>
      )}

      {/* Complete with Comment Dialog */}
      {isActionOpen && (
        <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add quote # or notes (e.g. Quote QT-2026-0042 sent)..."
            className="w-full text-xs px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsActionOpen(false)}
              className="px-2 py-1 text-[10px] text-zinc-600 dark:text-zinc-400 hover:underline"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleStatusChange('COMPLETED')}
              className="px-2.5 py-1 text-[10px] font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Confirm Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
