import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers, Globe, Clock, ShieldCheck, Key, Copy, Eye, EyeOff,
  RefreshCw, AlertCircle, Edit2, ArrowLeft, CheckCircle2,
  XCircle, Trash2, Check
} from 'lucide-react';
import { getModuleById, updateModuleStatus, deleteModule } from '../../../api/sso/module';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import { copyToClipboard } from '../../../utils/clipboard';
import { useGetCompanyModulesQuery } from '../../../api/sso';

import ModuleFormModal from '../components/ModuleFormModal';
import RotateSecretDialog from '../components/RotateSecretDialog';
import { useRoutePath } from "../../../hooks/useRoutePath";

/* ─── Sub-components ───────────────────────────────────────────────────────── */
function InfoRow({ label, value, mono = false, children }) {
  return (
    <div className="p-4 bg-zinc-50/80 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors">
      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">{label}</label>
      {children ?? (
        <div className={`text-sm font-medium text-zinc-800 break-all ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
      )}
    </div>
  );
}

function CopyButton({ text, label, dispatch }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!text) return;
    try {
      await copyToClipboard(text);
      setCopied(true);
      dispatch(addAlert({ type: 'success', message: `${label} copied` }));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: `Failed to copy ${label}` }));
    }
  };
  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md border transition-all ${
        copied
          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 shadow-sm'
      }`}
      title={`Copy ${label}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function ModuleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const [showSecret, setShowSecret] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formModalState, setFormModalState] = useState({ isOpen: false });
  const [rotateSecretModal, setRotateSecretModal] = useState({ isOpen: false });

  const fetchModule = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getModuleById(id);
      setData(response);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch module details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchModule();
  }, [fetchModule]);

  const { data: companyModulesData, isLoading: loadingCompanyModules } = useGetCompanyModulesQuery(
    { page: 1, pageSize: 1000 },
    { skip: !id }
  );

  const usedByCompanies = (companyModulesData?.companyModules || []).filter(
    (cm) => cm.module?.id === id || cm.modulesid === id || cm.module?.id === Number(id) || cm.modulesid === Number(id)
  );

  if (loading && !data) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="h-8 w-24 bg-zinc-200 rounded animate-pulse" />
        <div className="h-32 bg-zinc-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-zinc-100 rounded-2xl animate-pulse" />
          <div className="h-48 bg-zinc-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-xl shadow-sm border border-rose-200 mt-10">
        <AlertCircle size={48} className="mx-auto text-rose-400 mb-4" />
        <h2 className="text-xl font-bold text-rose-700">Failed to Load Module</h2>
        <p className="text-rose-600/80 mt-2 max-w-md mx-auto mb-6">
          {error || 'The module could not be found.'}
        </p>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  const isActive = data.moduleStatus;

  // Actions
  const handleToggleStatus = async () => {
    if (!(await confirmDialog({
      title: isActive ? 'Deactivate Module' : 'Activate Module',
      message: `Are you sure you want to ${isActive ? 'deactivate' : 'activate'} "${data.name}"?`,
      isDestructive: isActive
    }))) return;
    try {
      await updateModuleStatus(id, !isActive);
      dispatch(addAlert({ type: 'info', message: `Module "${data.name}" status updated` }));
      fetchModule();
    } catch {
      dispatch(addAlert({ type: 'error', message: 'Failed to toggle module status' }));
    }
  };

  const handleDelete = async () => {
    if (!(await confirmDialog({
      title: 'Delete Module',
      message: `Permanently delete "${data.name}"? This action cannot be undone.`,
      isDestructive: true
    }))) return;
    try {
      await deleteModule(id);
      dispatch(addAlert({ type: 'success', message: `Module "${data.name}" deleted` }));
      navigate(buildPath('/super-admin/modules')); // Assuming route
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to delete module' }));
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-6 space-y-6 animate-fade-in pb-12">
      {/* ── Header Nav ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Modules
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchModule}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={handleToggleStatus}
            className={`btn-action py-1.5 px-3 text-xs flex items-center gap-1.5 border rounded-lg shadow-sm font-semibold transition-colors ${
              isActive 
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
            {isActive ? 'Deactivate Module' : 'Activate Module'}
          </button>
          <button
            onClick={handleDelete}
            className="btn-action py-1.5 px-3 text-xs flex items-center gap-1.5 bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 border rounded-lg shadow-sm font-semibold transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* ── Header Banner ── */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-zinc-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-900 pointer-events-none">
          <Layers size={160} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
              <Layers size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{data.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                }`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                <Globe size={14} className="text-zinc-400" />
                <a href={data.host} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline transition-colors">
                  {data.host}
                </a>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setFormModalState({ isOpen: true })}
            className="btn-secondary bg-white shadow-sm flex items-center gap-2 shrink-0"
          >
            <Edit2 size={16} /> Edit Details
          </button>
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* General & Audit Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
              <Globe size={18} className="text-zinc-500" />
              <h2 className="font-bold text-zinc-800">General Information</h2>
            </div>
            <div className="p-5 grid grid-cols-1 gap-4">
              <InfoRow label="Module Name" value={data.name} />
              <InfoRow label="Host URL" value={data.host} mono />
              <InfoRow label="Status">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                  <span className="text-sm font-medium text-zinc-800">{isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </InfoRow>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
              <Clock size={18} className="text-zinc-500" />
              <h2 className="font-bold text-zinc-800">Audit Information</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Created At" value={new Date(data.createdAt).toLocaleString()} />
              <InfoRow label="Last Updated" value={new Date(data.updatedAt).toLocaleString()} />
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-zinc-500" />
              <h2 className="font-bold text-zinc-800">API Credentials</h2>
            </div>
            <button
              onClick={() => setRotateSecretModal({ isOpen: true })}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-100 transition-colors flex items-center gap-1.5"
            >
              <Key size={14} /> Rotate Secret
            </button>
          </div>
          
          <div className="p-6 space-y-6 flex-1 flex flex-col justify-center">
            {/* Client ID */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Client ID</label>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono text-sm text-zinc-700 break-all shadow-inner">
                  {data.clientId || 'Not generated'}
                </div>
                <CopyButton text={data.clientId} label="Client ID" dispatch={dispatch} />
              </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Client Secret */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Client Secret</label>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
                >
                  {showSecret ? <><EyeOff size={14} /> Hide Secret</> : <><Eye size={14} /> Reveal Secret</>}
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono text-sm text-zinc-700 break-all shadow-inner">
                  {data.clientSecret ? (
                    showSecret ? data.clientSecret : '•'.repeat(40)
                  ) : (
                    <span className="text-zinc-400 italic font-sans">Secret masked by backend</span>
                  )}
                </div>
                <CopyButton text={data.clientSecret} label="Client Secret" dispatch={dispatch} />
              </div>
              <p className="mt-3 text-xs text-zinc-500 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-500" />
                These credentials are used to authenticate this module with the SSO system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Companies Using This Module ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-zinc-500" />
            <h2 className="font-bold text-zinc-800">Assigned Companies</h2>
          </div>
          <div className="text-sm font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
            {loadingCompanyModules ? 'Loading...' : `${usedByCompanies.length} Companies`}
          </div>
        </div>
        <div className="p-0">
          {loadingCompanyModules ? (
            <div className="p-8 text-center text-zinc-400">Loading companies...</div>
          ) : usedByCompanies.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">No companies are currently using this module.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-100 text-[8px] uppercase tracking-wider text-zinc-500 font-bold">
                    <th className="px-5 py-3">Company Name</th>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {usedByCompanies.map(cm => (
                    <tr key={cm.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-zinc-800">
                        {cm.company?.companyName || cm.company?.name || 'Unknown Company'}
                      </td>
                      <td className="px-5 py-3 text-sm text-zinc-500">
                        <code className="bg-zinc-100 px-1.5 py-0.5 rounded">{cm.company?.companyCode || cm.company?.code || '—'}</code>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          cm.active !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${cm.active !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                          {cm.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ModuleFormModal
        isOpen={formModalState.isOpen}
        onClose={() => setFormModalState({ isOpen: false })}
        initialData={data}
        onSuccess={fetchModule}
      />

      <RotateSecretDialog
        isOpen={rotateSecretModal.isOpen}
        onClose={(didRotate) => {
          setRotateSecretModal({ isOpen: false });
          if (didRotate) fetchModule();
        }}
        moduleData={data}
      />
    </div>
  );
}
