import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Layers, Globe, Clock, ShieldCheck, Key, Copy, Eye, EyeOff,
  RefreshCw, AlertCircle, Edit2, ArrowLeft, CheckCircle2,
  XCircle, Trash2, Check, ChevronRight, Briefcase, Building2,
  Calendar, ExternalLink, ShieldAlert, Cpu
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
    <div className="p-3.5 bg-zinc-50/70 rounded-xl border border-zinc-200/80 hover:border-zinc-300 transition-colors">
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">{label}</label>
      {children ?? (
        <div className={`text-xs font-semibold text-zinc-800 break-all ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
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
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
          : 'bg-white dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] text-zinc-400 dark:text-[#A0A6B5] hover:text-zinc-700 dark:hover:text-[#E6E8EE] shadow-sm'
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
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = async () => {
    if (!id) return;
    try {
      await copyToClipboard(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      dispatch(addAlert({ type: 'info', message: 'Module ID copied to clipboard' }));
    } catch {
      dispatch(addAlert({ type: 'error', message: 'Failed to copy module ID' }));
    }
  };

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
      <div className="max-w-4xl mx-auto p-12 text-center bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-rose-200 dark:border-rose-900/60 mt-10">
        <AlertCircle size={48} className="mx-auto text-rose-400 mb-4" />
        <h2 className="text-xl font-bold text-rose-700 dark:text-rose-400">Failed to Load Module</h2>
        <p className="text-rose-600/80 dark:text-rose-300/80 mt-2 max-w-md mx-auto mb-6">
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
    <div className="w-full px-5 lg:px-8 py-6 space-y-6 animate-fade-in pb-16">
      {/* ── Breadcrumb & Top Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <Link
            to={buildPath('/super-admin/dashboard')}
            className="hover:text-zinc-700 transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={13} /> Global Console
          </Link>
          <ChevronRight size={12} className="text-zinc-300" />
          <Link
            to={buildPath('/super-admin/modules')}
            className="hover:text-zinc-700 transition-colors"
          >
            Modules
          </Link>
          <ChevronRight size={12} className="text-zinc-300" />
          <span className="text-zinc-800 font-semibold">{data.name}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchModule}
            className="btn-secondary h-8 px-3 text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
            disabled={loading}
            title="Refresh details"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-zinc-500" : "text-zinc-500"} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleToggleStatus}
            className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 shadow-2xs ${
              isActive
                ? 'text-amber-700 border-amber-200 bg-amber-50/70 hover:bg-amber-100'
                : 'text-emerald-700 border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100'
            }`}
          >
            {isActive ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
            <span>{isActive ? 'Deactivate' : 'Activate'}</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-8 px-3 rounded-lg text-xs font-semibold text-rose-700 border border-rose-200 bg-rose-50/70 hover:bg-rose-100 transition-all inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* ── Executive Hero Card ── */}
      <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          {/* Avatar & Title */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-sm border border-indigo-200 dark:border-indigo-800">
              <Layers size={28} />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
                  {data.name}
                </h1>

                {isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Operational • Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Suspended • Inactive
                  </span>
                )}
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs text-zinc-500">
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="font-mono text-[11px] text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 transition-colors inline-flex items-center gap-1.5 group"
                  title="Click to copy Module UUID"
                >
                  <span className="text-zinc-400">ID:</span>
                  <span>{id?.slice(0, 10)}...</span>
                  {copiedId ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : (
                    <Copy size={12} className="text-zinc-400 group-hover:text-zinc-700" />
                  )}
                </button>

                {data.host && (
                  <a
                    href={data.host.startsWith('http') ? data.host : `http://${data.host}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] font-semibold text-zinc-900 hover:text-zinc-700 bg-blue-50/80 hover:bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-200/80 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Globe size={12} />
                    <span>{data.host}</span>
                    <ExternalLink size={10} />
                  </a>
                )}

                {data.createdAt && (
                  <span className="inline-flex items-center gap-1 text-zinc-400 text-[11px]">
                    <Calendar size={12} />
                    <span>Created {new Date(data.createdAt).toLocaleDateString()}</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
                  <Cpu size={12} />
                  System Service
                </span>
              </div>
            </div>
          </div>

          {/* Edit Action Button */}
          <button 
            onClick={() => setFormModalState({ isOpen: true })}
            className="btn-primary h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs shrink-0 self-start md:self-auto"
          >
            <Edit2 size={13} />
            <span>Edit Module</span>
          </button>
        </div>

        {/* ── 4 Executive KPI Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-5 border-t border-zinc-100">
          <div className="p-3.5 bg-zinc-50/70 rounded-xl border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] block mb-1">Assigned Workspaces</span>
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold text-zinc-900">{usedByCompanies.length}</span>
              <Briefcase size={16} className="text-zinc-400" />
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">Active tenant allocations</span>
          </div>
          
          <div className="p-3.5 bg-zinc-50/70 rounded-xl border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] block mb-1">Gateway Endpoint</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-800 truncate max-w-[130px]">{data.host || 'Default Gateway'}</span>
              <Globe size={16} className="text-zinc-400" />
            </div>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Online routing</span>
          </div>

          <div className="p-3.5 bg-zinc-50/70 rounded-xl border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] block mb-1">SSO Auth Status</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800">{data.clientId ? 'Provisioned' : 'Pending'}</span>
              <ShieldCheck size={16} className="text-emerald-500" />
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">OIDC client binding</span>
          </div>

          <div className="p-3.5 bg-zinc-50/70 rounded-xl border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] block mb-1">Audit Synchronized</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800">{data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : 'Active'}</span>
              <Clock size={16} className="text-zinc-400" />
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">Telemetry timestamp</span>
          </div>
        </div>
      </div>

      {/* ── Content Grid: Configuration & Security ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: General Configuration & Audit */}
        <div className="space-y-6">
          {/* Service Configuration */}
          <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                <Globe size={15} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">Service Configuration</h2>
                <p className="text-[11px] text-zinc-400 dark:text-[#6B7184]">Runtime host specifications and route bindings</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 gap-3.5">
              <InfoRow label="Module Name" value={data.name} />
              <InfoRow label="Host URL" value={data.host} mono />
              <InfoRow label="Operational Status">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                  <span className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE]">{isActive ? 'Active • Receiving Traffic' : 'Inactive • Traffic Suspended'}</span>
                </div>
              </InfoRow>
            </div>
          </div>

          {/* Audit & Telemetry */}
          <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                <Clock size={15} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">Audit & Governance</h2>
                <p className="text-[11px] text-zinc-400 dark:text-[#6B7184]">Creation timestamps and deployment synchronizations</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <InfoRow label="Created At" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : '—'} />
              <InfoRow label="Last Updated" value={data.updatedAt ? new Date(data.updatedAt).toLocaleString() : '—'} />
            </div>
          </div>
        </div>

        {/* Right Column: Security & API Credentials */}
        <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                <ShieldCheck size={15} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">API Credentials</h2>
                <p className="text-[11px] text-zinc-400 dark:text-[#6B7184]">OAuth2/OIDC gateway secrets</p>
              </div>
            </div>
            <button
              onClick={() => setRotateSecretModal({ isOpen: true })}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 px-2.5 py-1.5 rounded-lg border border-rose-200/80 dark:border-rose-900/60 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Key size={13} /> Rotate Secret
            </button>
          </div>
          
          <div className="p-5 space-y-5 flex-1 flex flex-col justify-center">
            {/* Client ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider">Client ID</label>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex-1 bg-zinc-50/90 dark:bg-[#1D212C] border border-zinc-200/80 dark:border-[#2A2F3D] rounded-xl px-3.5 py-2.5 font-mono text-xs text-zinc-800 dark:text-[#E6E8EE] break-all shadow-inner">
                  {data.clientId || 'Not generated'}
                </div>
                <CopyButton text={data.clientId} label="Client ID" dispatch={dispatch} />
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-[#2A2F3D]" />

            {/* Client Secret */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider">Client Secret</label>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] hover:text-zinc-700 dark:hover:text-[#A0A6B5] flex items-center gap-1.5 cursor-pointer"
                >
                  {showSecret ? <><EyeOff size={13} /> Hide Secret</> : <><Eye size={13} /> Reveal Secret</>}
                </button>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="flex-1 bg-zinc-50/90 dark:bg-[#1D212C] border border-zinc-200/80 dark:border-[#2A2F3D] rounded-xl px-3.5 py-2.5 font-mono text-xs text-zinc-800 dark:text-[#E6E8EE] break-all shadow-inner">
                  {data.clientSecret ? (
                    showSecret ? data.clientSecret : '•'.repeat(40)
                  ) : (
                    <span className="text-zinc-400 dark:text-[#6B7184] italic font-sans text-xs">Secret masked by backend</span>
                  )}
                </div>
                <CopyButton text={data.clientSecret} label="Client Secret" dispatch={dispatch} />
              </div>
              <p className="mt-2.5 text-[11px] text-zinc-500 dark:text-[#A0A6B5] flex items-center gap-1.5 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                <AlertCircle size={13} className="text-amber-500 shrink-0" />
                <span>These credentials are used by the gateway to authenticate internal RPC routing and SSO session delegation.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Assigned Companies & Workspaces ── */}
      <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#222736] text-zinc-700 dark:text-[#E6E8EE] flex items-center justify-center border border-zinc-200/80 dark:border-[#2A2F3D]">
              <Building2 size={15} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">Assigned Workspaces & Tenant Companies</h2>
              <p className="text-[11px] text-zinc-400 dark:text-[#6B7184]">Multi-tenant client workspaces with this module service deployed</p>
            </div>
          </div>
          <div className="text-[11px] font-bold text-zinc-700 dark:text-[#E6E8EE] bg-zinc-100 dark:bg-[#222736] border border-zinc-200/80 dark:border-[#2A2F3D] px-2.5 py-1 rounded-full">
            {loadingCompanyModules ? 'Loading...' : `${usedByCompanies.length} Total Allocations`}
          </div>
        </div>
        <div className="p-0">
          {loadingCompanyModules ? (
            <div className="p-8 text-center text-xs text-zinc-400 font-medium">Loading companies...</div>
          ) : usedByCompanies.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center bg-zinc-50/30">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 border border-blue-100">
                <Building2 size={22} />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 mb-1">No workspaces assigned to this module</h4>
              <p className="text-xs text-zinc-500 mb-4 max-w-sm">
                Allocate this module to client company workspaces via the Companies & Workspaces console.
              </p>
              <Link
                to={buildPath('/super-admin/companies')}
                className="btn-primary text-xs inline-flex items-center gap-1.5 px-3.5 py-2"
              >
                <Briefcase size={13} /> View Companies
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-100 dark:border-[#2A2F3D] text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    <th className="py-3 px-4 w-12 text-center text-[10px] uppercase tracking-wider text-zinc-400">#</th>
                    <th className="px-5 py-3">Company Workspace</th>
                    <th className="px-5 py-3">Tenant Code</th>
                    <th className="px-5 py-3 text-center">Runtime Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {usedByCompanies.map((cm, idx) => {
                    const compName = cm.company?.companyName || cm.company?.name || 'Workspace';
                    const isAllocActive = cm.active !== false;
                    return (
                      <tr key={cm.id || idx} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-medium text-zinc-400">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-3 font-semibold text-zinc-900">
                          <Link
                            to={buildPath('/super-admin/companies')}
                            className="hover:text-blue-600 transition-colors inline-flex items-center gap-2"
                          >
                            <span className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-700 flex items-center justify-center text-[10px] font-bold border border-zinc-200">
                              {compName.charAt(0).toUpperCase()}
                            </span>
                            {compName}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-[11px] font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/80">
                            {cm.company?.companyCode || cm.company?.code || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isAllocActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAllocActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                            {isAllocActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            to={buildPath('/super-admin/companies')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-blue-600 px-2.5 py-1 rounded-md hover:bg-zinc-100 transition-colors"
                          >
                            Manage <ChevronRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
