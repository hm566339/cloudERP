import React, { useState, useEffect } from 'react';
import {
  X, Layers, Globe, Clock, ShieldCheck, Key, Copy, Eye, EyeOff,
  RefreshCw, AlertCircle, Edit2, Check, ArrowLeft, CheckCircle2,
  XCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useGetModuleByIdQuery, useUpdateModuleMutation } from '../../../api/sso';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { copyToClipboard } from '../../../utils/clipboard';

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

/* ─── Edit Form (embedded) ─────────────────────────────────────────────────── */
function EditForm({ data, onCancel, onSaved }) {
  const dispatch = useAppDispatch();
  const [updateModule, { isLoading }] = useUpdateModuleMutation();

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: { name: data?.name || '', host: data?.host || '' }
  });

  const onSubmit = async (formData) => {
    try {
      await updateModule({ id: data.id, ...formData }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Module updated successfully' }));
      onSaved();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to update module' }));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
        <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
          <Edit2 size={12} /> Editing module — only Name and Host URL can be changed.
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Module Name <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            {...register('name', { required: 'Module name is required', setValueAs: v => v?.trim() })}
            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all
              ${errors.name ? 'border-rose-300 focus:ring-rose-200' : 'border-zinc-200 focus:ring-indigo-200 focus:border-indigo-400'}`}
            placeholder="e.g. Human Resources"
            autoFocus
          />
          <Layers size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        </div>
        {errors.name && (
          <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
            <AlertCircle size={11} /> {errors.name.message}
          </p>
        )}
      </div>

      {/* Host */}
      <div>
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Host URL <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            {...register('host', {
              required: 'Host URL is required',
              validate: (value) => {
                if (!value) return true;
                try {
                  const url = new URL(value);
                  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                    return 'URL must start with http:// or https://';
                  }
                  return true;
                } catch (e) {
                  return 'Please enter a valid URL';
                }
              },
              setValueAs: v => v?.trim()
            })}
            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all
              ${errors.host ? 'border-rose-300 focus:ring-rose-200' : 'border-zinc-200 focus:ring-indigo-200 focus:border-indigo-400'}`}
            placeholder="e.g. https://hr.example.com"
          />
          <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        </div>
        {errors.host && (
          <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
            <AlertCircle size={11} /> {errors.host.message}
          </p>
        )}
        <p className="mt-1.5 text-xs text-zinc-500">The primary endpoint where this module is hosted.</p>
      </div>

      {/* Read-only fields shown for context */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Client ID</p>
          <p className="font-mono text-xs text-zinc-500 truncate">{data?.clientId || '—'}</p>
          <p className="text-[7.2px] text-zinc-400 mt-0.5">Read-only</p>
        </div>
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</p>
          <p className="text-xs text-zinc-500">
            {data?.moduleStatus !== false ? '✓ Active' : '✗ Inactive'}
          </p>
          <p className="text-[7.2px] text-zinc-400 mt-0.5">Use toggle to change</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to Details
        </button>
        <button
          type="submit"
          disabled={isLoading || !isDirty}
          className="btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Check size={14} /> Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ─── Main Modal ───────────────────────────────────────────────────────────── */
export default function ModuleDetailsModal({ isOpen, onClose, moduleId, initialData = null }) {
  const dispatch = useAppDispatch();
  const [showSecret, setShowSecret] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: fetchedData, isLoading, isError, refetch } = useGetModuleByIdQuery(moduleId, {
    skip: !isOpen || !moduleId,
  });

  // Reset edit mode & secret visibility when modal opens/closes or module changes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setShowSecret(false);
    }
  }, [isOpen, moduleId]);

  if (!isOpen) return null;

  const data = fetchedData || initialData;
  const isActive = data?.moduleStatus !== false
    && data?.moduleStatus !== 'INACTIVE'
    && data?.moduleStatus !== 'SUSPENDED';

  const handleCopy = async (text, label) => {
    if (!text) return;
    try {
      await copyToClipboard(text);
      dispatch(addAlert({ type: 'success', message: `${label} copied to clipboard` }));
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: `Failed to copy ${label}` }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm border
              ${isActive
                ? 'bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 border-indigo-100'
                : 'bg-zinc-100 text-zinc-400 border-zinc-200'
              }`}
            >
              <Layers size={22} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <>
                  <div className="h-5 w-36 bg-zinc-200 animate-pulse rounded mb-1.5" />
                  <div className="h-3 w-24 bg-zinc-100 animate-pulse rounded" />
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-zinc-900 truncate">
                    {isEditing ? 'Edit Module' : (data?.name || 'Module Details')}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isEditing ? (
                      <span className="text-xs font-medium text-indigo-600">Editing details</span>
                    ) : (
                      <>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="text-xs font-semibold text-zinc-500">{isActive ? 'Operational' : 'Suspended'}</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isEditing && !isLoading && data && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                title="Edit module"
              >
                <Edit2 size={13} /> Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Error */}
          {isError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-rose-700 text-sm font-medium">
                <AlertCircle size={16} /> Failed to load module details.
              </div>
              <button onClick={refetch} className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1">
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-zinc-100 rounded-xl" />)}
            </div>
          )}

          {/* Edit Form */}
          {!isLoading && data && isEditing && (
            <EditForm
              data={data}
              onCancel={() => setIsEditing(false)}
              onSaved={() => { setIsEditing(false); refetch(); }}
            />
          )}

          {/* View Mode */}
          {!isLoading && data && !isEditing && (
            <>
              {/* General Info */}
              <section>
                <h3 className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Globe size={12} /> General Information
                </h3>
                <div className="grid gap-2.5">
                  <InfoRow label="Module Name" value={data.name} />
                  <InfoRow label="Host URL">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-indigo-600 break-all leading-relaxed">
                        {data.host || '—'}
                      </span>
                      {data.host && (
                        <CopyButton text={data.host} label="Host URL" dispatch={dispatch} />
                      )}
                    </div>
                  </InfoRow>
                  <InfoRow label="Status">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}>
                        {isActive
                          ? <><CheckCircle2 size={12} /> Active / Operational</>
                          : <><XCircle size={12} /> Inactive / Suspended</>
                        }
                      </span>
                    </div>
                  </InfoRow>
                </div>
              </section>

              {/* Credentials */}
              <section>
                <h3 className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Credentials
                </h3>
                <div className="space-y-2.5">
                  {/* Client ID */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Client ID</label>
                      {data.clientId && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setShowSecret(s => !s)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white shadow-sm border border-slate-200 rounded-md transition-colors"
                            title={showSecret ? 'Hide' : 'Reveal'}
                          >
                            {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <CopyButton text={data.clientId} label="Client ID" dispatch={dispatch} />
                        </div>
                      )}
                    </div>
                    <code className="text-sm font-mono font-semibold text-slate-800 break-all leading-relaxed block">
                      {data.clientId
                        ? (showSecret ? data.clientId : '•'.repeat(32))
                        : '—'}
                    </code>
                  </div>

                  {/* Client Secret */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Client Secret</label>
                      {data.clientSecret && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setShowSecret(s => !s)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white shadow-sm border border-slate-200 rounded-md transition-colors"
                            title={showSecret ? 'Hide' : 'Reveal'}
                          >
                            {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <CopyButton text={data.clientSecret} label="Client Secret" dispatch={dispatch} />
                        </div>
                      )}
                    </div>
                    <code className="text-sm font-mono font-semibold text-slate-800 break-all leading-relaxed block">
                      {data.clientSecret
                        ? (showSecret ? data.clientSecret : '•'.repeat(32))
                        : '—'}
                    </code>
                  </div>

                  <div className="flex items-center gap-1.5 px-1 pt-1">
                    <Key size={11} className="text-amber-600 shrink-0" />
                    <p className="text-[8.8px] text-amber-700 font-medium">
                      Keep credentials secure — never expose them in client-side code.
                    </p>
                  </div>
                </div>
              </section>

              {/* Audit */}
              <section>
                <h3 className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock size={12} /> Audit Trail
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <InfoRow label="Module ID">
                    <span className="font-mono text-xs text-zinc-600 break-all">{data.id || '—'}</span>
                  </InfoRow>
                  <InfoRow label="Created At" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : '—'} />
                  <InfoRow label="Last Updated" value={data.updatedAt ? new Date(data.updatedAt).toLocaleString() : '—'} />
                </div>
              </section>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-between items-center shrink-0">
          {!isEditing ? (
            <>
              <button
                onClick={refetch}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-600 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
              </button>
              <div className="flex gap-2">
                {!isLoading && data && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary flex items-center gap-1.5"
                  >
                    <Edit2 size={14} /> Edit Module
                  </button>
                )}
                <button onClick={onClose} className="btn-primary">
                  Close
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-zinc-400">Changes are saved immediately upon submission.</p>
          )}
        </div>

      </div>
    </div>
  );
}
