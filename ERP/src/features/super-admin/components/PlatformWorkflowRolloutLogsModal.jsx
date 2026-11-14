import React, { useEffect, useState } from 'react';
import { X, History, RefreshCw, CheckCircle, AlertTriangle, XCircle, Building2 } from 'lucide-react';
import { platformWorkflowTemplatesApi } from '../../../api/account/workflowDefinitions';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

const getModeBadge = (mode) => {
  switch (mode) {
    case 'FORCE_ALL':
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
          FORCE ALL
        </span>
      );
    case 'NON_CUSTOMIZED':
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400">
          NON-CUSTOMIZED
        </span>
      );
    case 'NEW_ORGS_ONLY':
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
          NEW ORGS ONLY
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
          {mode || 'UNKNOWN'}
        </span>
      );
  }
};

const getStatusBadge = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'SUCCESS' || s === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
        <CheckCircle size={12} />
        {status}
      </span>
    );
  }
  if (s === 'PARTIAL') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
        <AlertTriangle size={12} />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
      <XCircle size={12} />
      {status || 'FAILED'}
    </span>
  );
};

export default function PlatformWorkflowRolloutLogsModal({ isOpen, onClose, template }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    if (!template?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await platformWorkflowTemplatesApi.getRolloutLogs(template.id);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch rollout logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && template?.id) {
      fetchLogs();
    }
  }, [isOpen, template?.id]);

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#161922] rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-scale-up border border-zinc-200 dark:border-[#2A2F3D] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#11131a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">
                Rollout Logs & Audit History
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">
                {template.templateName} ({template.templateCode}) • v{template.version || 1}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded-lg transition-colors"
              title="Refresh logs"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 dark:text-[#A0A6B5] hover:text-zinc-600 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="py-12 text-center">
              <RefreshCw size={24} className="animate-spin text-indigo-500 mx-auto mb-3" />
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">Loading rollout history...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-[#222736] flex items-center justify-center text-zinc-400 dark:text-zinc-500 mx-auto mb-3">
                <History size={24} />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-[#E6E8EE]">No Rollout History</h3>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-1 max-w-sm mx-auto">
                This platform template has not been rolled out yet. Use the Rollout action to distribute it to organizations.
              </p>
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-[#2A2F3D] text-[11px] uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Rollout Scope</th>
                    <th className="py-3 px-3 text-center">Orgs Affected</th>
                    <th className="py-3 px-3 text-center">Companies</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-[#1a1e29]/50 transition-colors">
                      <td className="py-3.5 px-3 font-mono text-zinc-600 dark:text-[#A0A6B5]">
                        {formatDateTime(log.rolledOutAt || log.createdAt)}
                      </td>
                      <td className="py-3.5 px-3">
                        {getModeBadge(log.rolloutMode)}
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-zinc-800 dark:text-[#E6E8EE]">
                        {log.affectedOrganizationsCount ?? 0}
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-zinc-800 dark:text-[#E6E8EE]">
                        {log.affectedCompaniesCount ?? 0}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-500 dark:text-[#A0A6B5] max-w-[200px] truncate" title={log.comment}>
                        {log.comment || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-[#2A2F3D] flex justify-end bg-white dark:bg-[#161922]">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

