import React, { useEffect, useState } from 'react';
import { Activity, User } from 'lucide-react';
import Pagination from '../../../components/common/Pagination';
import { ListSkeleton } from '../../../components/common/SkeletonLoader';
import ErrorState from '../../../components/common/ErrorState';
import { workflowAuditApi } from '../services/workflowService';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <span className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
        <Icon size={14} className="text-zinc-700" />
        {label}
      </span>
      <span className="text-xs font-bold text-zinc-900">{value}</span>
    </div>
  );
}

const formatDateTime = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function WorkflowAuditTrailPanel({ companyId, module, selectedId, currentUser }) {
  const [status, setStatus] = useState('loading');
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setEntries([]);
    workflowAuditApi.getAuditTrail({ companyId, moduleName: module, entityId: selectedId, page: 0, size: 30 })
      .then((result) => {
        if (!active) return;
        setEntries(result.entries || []);
        setPagination(result.pagination || null);
        setStatus('ready');
      })
      .catch((error) => {
        if (!active) return;
        console.error('Failed to load workflow audit trail', error);
        setErrorMessage(error?.response?.data?.message || error?.message || 'Failed to load the audit trail.');
        setStatus('error');
      });
    return () => { active = false; };
  }, [companyId, module, selectedId, fetchKey]);

  const latest = entries[entries.length - 1] || entries[0];

  if (status === 'loading') return <div className="space-y-2"><ListSkeleton items={3} /></div>;
  if (status === 'error') return <ErrorState title="Audit trail unavailable" message={errorMessage} onRetry={() => setFetchKey((key) => key + 1)} />;

  return (
    <div className="space-y-3">
      <InfoRow icon={Activity} label="Last updated" value={latest ? formatDateTime(latest.performedAt) : 'No changes recorded yet'} />
      <InfoRow icon={User} label="Updated by" value={latest?.performedBy || currentUser?.name || currentUser?.email || 'No changes recorded yet'} />
      {entries.length === 0 && (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-xs text-zinc-500 leading-relaxed">
          No audit entries found for this workflow. Entries appear here via <span className="font-mono text-zinc-700">GET /api/account/audit-logs</span> once a step is approved, rejected, or changed under this company.
        </p>
      )}
      {entries.length > 0 && (
        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          {entries.map((entry) => (
            <div key={entry.id || `${entry.performedAt}-${entry.actionType}`} className="flex items-start gap-3 p-3 hover:bg-zinc-50/50 transition-colors">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-900" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-900">{entry.performedBy || 'System'}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{(entry.entityName || module)} · {String(entry.actionType || 'ACTION').toUpperCase()}</p>
                <p className="mt-0.5 text-[10px] text-zinc-400">{formatDateTime(entry.performedAt)}{entry.ipAddress ? ` · ${entry.ipAddress}` : ''}</p>
                {entry.description && <p className="mt-1 text-xs text-zinc-600 bg-zinc-50 p-2 rounded-md">{entry.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {pagination && pagination.totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            page={pagination.page || 0}
            totalPages={pagination.totalPages}
            totalElements={pagination.totalElements}
            pageSize={30}
            onPageChange={(p) => workflowAuditApi.getAuditTrail({ companyId, moduleName: module, entityId: selectedId, page: p, size: 30 })}
          />
        </div>
      )}
    </div>
  );
}
