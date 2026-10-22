import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Plus,
  RotateCcw,
  Search,
  Info,
  Key,
  Lock,
  CheckCircle2,
  XCircle,
  Layers,
  Shield,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRBAC } from '../../../utils/rbac';
import {
  getUserFeatures,
  getUserActiveFeatures,
  getAllFeatures,
  grantUserFeature,
  revokeUserFeature,
  syncUserFeatures,
} from '../../../api/sso/feature';
import {
  getAllPermissions,
  getUserPermissions,
  getUserEffectivePermissions,
  grantUserPermission,
  revokeUserPermission,
  syncUserPermissions,
} from '../../../api/sso/permission';

// ─── Source Badge ──────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
  const styles =
    source === 'USER'
      ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/40'
      : source === 'ROLE'
        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40'
        : 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D]';
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${styles}`}
    >
      {source || 'SYSTEM'}
    </span>
  );
}

// ─── Allowed Badge ─────────────────────────────────────────────────────────────
function AllowedBadge({ allowed }) {
  return allowed ? (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
      <CheckCircle2 size={9} /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40">
      <XCircle size={9} /> No
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1: FEATURE ACCESS
// ══════════════════════════════════════════════════════════════════════════════
function FeatureAccessTab({ user, onRefresh }) {
  const dispatch = useAppDispatch();
  const { isAdmin } = useRBAC();

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userFeatures, setUserFeatures] = useState([]);
  const [activeCodes, setActiveCodes] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showGrantSection, setShowGrantSection] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState('');

  const [revokingFeature, setRevokingFeature] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  const [syncMode, setSyncMode] = useState(false);
  const [syncSelectedCodes, setSyncSelectedCodes] = useState([]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [uFeatures, uActive, catalog] = await Promise.all([
        getUserFeatures(user.id),
        getUserActiveFeatures(user.id).catch(() => ({ activeFeatures: [] })),
        getAllFeatures(),
      ]);

      const userFeaturesArray = Array.isArray(uFeatures) ? uFeatures : [];
      const activeArray = Array.isArray(uActive?.activeFeatures)
        ? uActive.activeFeatures
        : userFeaturesArray.filter((f) => !f.revoked).map((f) => f.featureCode || f.code);

      setUserFeatures(userFeaturesArray);
      setActiveCodes(activeArray);
      setAllFeatures(Array.isArray(catalog) ? catalog : []);
      setSyncSelectedCodes(activeArray);
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to load user features' }));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!selectedFeatureId) return;
    const featureObj = allFeatures.find((f) => String(f.id) === String(selectedFeatureId));
    if (!featureObj) return;
    setIsSubmitting(true);
    try {
      await grantUserFeature(user.id, { featureCode: featureObj.code, featureId: featureObj.id });
      dispatch(addAlert({ type: 'success', message: `Feature "${featureObj.name}" granted` }));
      setSelectedFeatureId('');
      setShowGrantSection(false);
      await loadData();
      if (onRefresh) onRefresh();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to grant feature' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    if (!revokingFeature || !revokeReason.trim()) return;
    setIsSubmitting(true);
    try {
      await revokeUserFeature(user.id, {
        featureCode: revokingFeature.featureCode || revokingFeature.code,
        featureId: revokingFeature.featureId || revokingFeature.id,
        reason: revokeReason.trim(),
      });
      dispatch(addAlert({ type: 'success', message: `Feature "${revokingFeature.featureName || revokingFeature.featureCode}" revoked` }));
      setRevokingFeature(null);
      setRevokeReason('');
      await loadData();
      if (onRefresh) onRefresh();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to revoke feature' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSync = async () => {
    setIsSubmitting(true);
    try {
      await syncUserFeatures(user.id, syncSelectedCodes);
      dispatch(addAlert({ type: 'success', message: 'User features synchronized' }));
      setSyncMode(false);
      await loadData();
      if (onRefresh) onRefresh();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to sync features' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFeatures = userFeatures.filter((uf) => {
    if (statusFilter === 'ACTIVE' && uf.revoked) return false;
    if (statusFilter === 'REVOKED' && !uf.revoked) return false;
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      uf.featureCode?.toLowerCase().includes(t) ||
      uf.featureName?.toLowerCase().includes(t) ||
      uf.moduleName?.toLowerCase().includes(t)
    );
  });

  const availableToGrant = allFeatures.filter((f) => !activeCodes.includes(f.code));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search feature codes, names, modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10/20"
            />
          </div>
          <div className="flex items-center bg-zinc-100 dark:bg-[#1D212C] p-0.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-[#A0A6B5] shrink-0">
            {['ALL', 'ACTIVE', 'REVOKED'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === f ? 'bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] shadow-2xs font-semibold' : 'hover:text-zinc-900 dark:hover:text-[#E6E8EE]'}`}
              >
                {f === 'ALL' ? 'All' : f === 'ACTIVE' ? `Active (${activeCodes.length})` : 'Revoked'}
              </button>
            ))}
          </div>
        </div>
        {isAdmin && !syncMode && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSyncMode(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] rounded-lg text-xs font-semibold transition-all shadow-2xs"
            >
              <RotateCcw size={13} /> Bulk Sync
            </button>
            <button
              onClick={() => setShowGrantSection(!showGrantSection)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
            >
              <Plus size={14} /> Grant Feature
            </button>
          </div>
        )}
      </div>

      {/* Grant Form */}
      {showGrantSection && isAdmin && (
        <form onSubmit={handleGrant} className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-3 animate-slide-down">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key size={13} className="text-indigo-600 dark:text-indigo-400" /> Grant Feature
            </h3>
            <button type="button" onClick={() => setShowGrantSection(false)} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-[#E6E8EE]">Cancel</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <select
              value={selectedFeatureId}
              onChange={(e) => setSelectedFeatureId(e.target.value)}
              className="flex-1 px-3 py-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10/20 cursor-pointer"
            >
              <option value="">Select feature to grant...</option>
              {availableToGrant.map((feat) => (
                <option key={feat.id} value={feat.id}>
                  {feat.name} ({feat.code}) — {feat.moduleName || 'GLOBAL'}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedFeatureId || isSubmitting}
              className="px-4 py-2 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {isSubmitting ? 'Granting...' : 'Confirm Grant'}
            </button>
          </div>
        </form>
      )}

      {/* Revoke Form */}
      {revokingFeature && (
        <form onSubmit={handleConfirmRevoke} className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-3 animate-slide-down">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-rose-600 dark:text-rose-400" /> Revoke: {revokingFeature.featureName || revokingFeature.featureCode}
            </h3>
            <button type="button" onClick={() => setRevokingFeature(null)} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-[#E6E8EE]">Cancel</button>
          </div>
          <div>
            <label className="text-[11px] font-medium text-rose-800 dark:text-rose-300 block mb-1">Reason (required):</label>
            <input
              type="text"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Role changed, temporary access expired..."
              className="w-full px-3 py-2 bg-white dark:bg-[#161922] border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-zinc-900 dark:text-[#E6E8EE] outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRevokingFeature(null)} className="px-3 py-1.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] rounded-lg text-xs font-medium">Cancel</button>
            <button type="submit" disabled={!revokeReason.trim() || isSubmitting} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50">
              {isSubmitting ? 'Revoking...' : 'Confirm Revocation'}
            </button>
          </div>
        </form>
      )}

      {/* Bulk Sync Mode */}
      {syncMode && (
        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-3 animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Bulk Feature Sync Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSyncMode(false)} className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] font-medium">Cancel</button>
              <button
                onClick={handleBulkSync}
                disabled={isSubmitting}
                className="px-3.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Syncing...' : `Sync (${syncSelectedCodes.length} selected)`}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-400">Select exactly which features should be active. Unselected features will be revoked.</p>
          <div className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-white dark:bg-[#161922] rounded-lg border border-amber-200/80 dark:border-amber-900/40">
            {allFeatures.map((feat) => {
              const isChecked = syncSelectedCodes.includes(feat.code);
              return (
                <label
                  key={feat.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${isChecked ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 font-medium' : 'border-zinc-100 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5]'}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      setSyncSelectedCodes((prev) =>
                        e.target.checked ? [...prev, feat.code] : prev.filter((c) => c !== feat.code)
                      );
                    }}
                    className="rounded border-zinc-300 dark:border-zinc-600 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate text-zinc-900 dark:text-[#E6E8EE]">{feat.name}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-[#A0A6B5] font-mono truncate">{feat.code}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature List */}
      {isLoading ? (
        <div className="space-y-2 py-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3.5 border border-zinc-100 dark:border-[#2A2F3D] rounded-xl">
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-zinc-100 dark:bg-[#1D212C] rounded w-1/3" />
                <div className="h-3 bg-zinc-50 dark:bg-[#161922] rounded w-1/2" />
              </div>
              <div className="h-6 w-16 bg-zinc-100 dark:bg-[#1D212C] rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredFeatures.length > 0 ? (
        <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-[#2A2F3D] shadow-2xs">
          {filteredFeatures.map((uf) => {
            const isRevoked = uf.revoked;
            return (
              <div
                key={uf.id || `${uf.featureCode}-${uf.grantedAt}`}
                className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${isRevoked ? 'bg-zinc-50/40 dark:bg-[#161922]/50 opacity-70' : 'bg-white dark:bg-[#161922] hover:bg-zinc-50/60 dark:hover:bg-[#1D212C]'}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-[#E6E8EE]">{uf.featureName || uf.featureCode}</span>
                    <span className="font-mono text-[10px] text-zinc-500 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1D212C] px-1.5 py-0.5 rounded">{uf.featureCode}</span>
                    {uf.moduleName && (
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-1.5 py-0.5 rounded font-medium">{uf.moduleName}</span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isRevoked ? 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40'}`}>
                      {isRevoked ? 'REVOKED' : 'ACTIVE'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 dark:text-[#A0A6B5] mt-1 flex items-center gap-3 flex-wrap">
                    {uf.grantedAt && <span>Granted: {new Date(uf.grantedAt).toLocaleDateString()} by {uf.grantedBy || 'Admin'}</span>}
                    {isRevoked && uf.revokeReason && (
                      <span className="text-rose-600 dark:text-rose-400 font-medium">Reason: "{uf.revokeReason}"</span>
                    )}
                  </div>
                </div>
                {isAdmin && !isRevoked && (
                  <button
                    onClick={() => { setRevokingFeature(uf); setRevokeReason('Access revoked by administrator'); }}
                    disabled={isSubmitting}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-lg transition-colors shrink-0"
                  >
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-zinc-200 dark:border-[#2A2F3D] rounded-xl p-8 text-center bg-zinc-50/50 dark:bg-[#161922]/50 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-[#1D212C] flex items-center justify-center text-zinc-400 dark:text-[#A0A6B5] mb-2.5"><ShieldCheck size={20} /></div>
          <h3 className="text-xs font-bold text-zinc-700 dark:text-[#E6E8EE]">No feature overrides found</h3>
          <p className="text-[11px] text-zinc-400 dark:text-[#A0A6B5] mt-0.5 max-w-xs mx-auto">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No features matched your filter.'
              : `${user.fullName} inherits permissions from assigned roles.`}
          </p>
          {isAdmin && !searchTerm && statusFilter === 'ALL' && (
            <button onClick={() => setShowGrantSection(true)} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              <Plus size={13} /> Grant Custom Feature
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2: ACTION PERMISSIONS
// ══════════════════════════════════════════════════════════════════════════════
function ActionPermissionsTab({ user, allFeatures }) {
  const dispatch = useAppDispatch();
  const { isAdmin } = useRBAC();

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allPermissions, setAllPermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [effectivePermissions, setEffectivePermissions] = useState([]);

  // Local staged state for sync
  const [stagedPermissions, setStagedPermissions] = useState({});
  const [initialStaged, setInitialStaged] = useState({});
  const [syncMode, setSyncMode] = useState(false);

  // Revoke dialog state
  const [revokingPermission, setRevokingPermission] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  const [permSearch, setPermSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('effective'); // 'effective' | 'matrix'

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [catalog, userPerms, effective] = await Promise.all([
        getAllPermissions(),
        getUserPermissions(user.id).catch(() => []),
        getUserEffectivePermissions(user.id).catch(() => ({})),
      ]);

      const catalogArray = Array.isArray(catalog) ? catalog : [];
      const userPermsArray = Array.isArray(userPerms) ? userPerms : [];
      const effectivePermsArray = Array.isArray(effective?.permissions)
        ? effective.permissions
        : Array.isArray(effective)
          ? effective
          : [];

      setAllPermissions(catalogArray);
      setUserPermissions(userPermsArray);
      setEffectivePermissions(effectivePermsArray);

      // Build staged state from user's direct permissions
      const staged = {};
      userPermsArray.forEach((p) => {
        const key = `${p.featureCode}::${p.action}`;
        staged[key] = p.allowed !== false && p.active !== false;
      });
      setStagedPermissions(staged);
      setInitialStaged(staged);
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to load permissions' }));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group all permissions by featureCode → list of actions
  const groupedByFeature = useMemo(() => {
    const map = {};
    allPermissions.forEach((p) => {
      if (!map[p.featureCode]) {
        map[p.featureCode] = {
          featureCode: p.featureCode,
          featureName: p.featureName || p.featureCode,
          actions: {},
          moduleName: allFeatures.find((f) => f.code === p.featureCode)?.moduleName || p.moduleName || 'CORE',
        };
      }
      map[p.featureCode].actions[p.action] = p;
    });
    return map;
  }, [allPermissions, allFeatures]);

  // All unique actions across all permissions
  const allActions = useMemo(() => {
    const set = new Set(allPermissions.map((p) => p.action));
    const order = ['READ', 'WRITE', 'DELETE', 'APPROVE', 'EXPORT', 'PRINT'];
    return [...order.filter((a) => set.has(a)), ...Array.from(set).filter((a) => !order.includes(a))];
  }, [allPermissions]);

  // Available modules
  const availableModules = useMemo(() => {
    const set = new Set(Object.values(groupedByFeature).map((f) => f.moduleName));
    return Array.from(set);
  }, [groupedByFeature]);

  // Filtered features
  const filteredFeatures = useMemo(() => {
    const term = permSearch.toLowerCase();
    return Object.values(groupedByFeature).filter((f) => {
      if (moduleFilter !== 'ALL' && f.moduleName !== moduleFilter) return false;
      if (term) {
        return (
          f.featureCode.toLowerCase().includes(term) ||
          f.featureName.toLowerCase().includes(term) ||
          f.moduleName.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [groupedByFeature, permSearch, moduleFilter]);

  const hasUnsavedChanges = useMemo(() => {
    const keys = new Set([...Object.keys(stagedPermissions), ...Object.keys(initialStaged)]);
    for (const k of keys) {
      if (stagedPermissions[k] !== initialStaged[k]) return true;
    }
    return false;
  }, [stagedPermissions, initialStaged]);

  // Get effective state for a permission
  const getEffectiveState = (featureCode, action) => {
    return effectivePermissions.find((p) => p.featureCode === featureCode && p.action === action) || null;
  };

  const getUserDirectState = (featureCode, action) => {
    return userPermissions.find((p) => p.featureCode === featureCode && p.action === action) || null;
  };

  const handleStagedToggle = (featureCode, action) => {
    const key = `${featureCode}::${action}`;
    setStagedPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGrantDirect = async (featureCode, action) => {
    setIsSubmitting(true);
    try {
      await grantUserPermission(user.id, { featureCode, action });
      dispatch(addAlert({ type: 'success', message: `Permission ${featureCode}_${action} granted` }));
      await loadData();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to grant permission' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateRevoke = (featureCode, action) => {
    setRevokingPermission({ featureCode, action });
    setRevokeReason('');
  };

  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    if (!revokingPermission || !revokeReason.trim()) return;
    setIsSubmitting(true);
    try {
      await revokeUserPermission(user.id, {
        featureCode: revokingPermission.featureCode,
        action: revokingPermission.action,
        reason: revokeReason.trim(),
      });
      dispatch(addAlert({ type: 'success', message: `Permission ${revokingPermission.featureCode}_${revokingPermission.action} revoked` }));
      setRevokingPermission(null);
      setRevokeReason('');
      await loadData();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to revoke permission' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncPermissions = async () => {
    const permissions = [];
    Object.entries(stagedPermissions).forEach(([key, enabled]) => {
      const [featureCode, action] = key.split('::');
      permissions.push({ featureCode, action, enabled });
    });
    setIsSubmitting(true);
    try {
      await syncUserPermissions(user.id, permissions);
      dispatch(addAlert({ type: 'success', message: 'User action permissions synchronized' }));
      setSyncMode(false);
      await loadData();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to sync permissions' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search features or permissions..."
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10/20"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-700 dark:text-[#E6E8EE] outline-none focus:border-zinc-400 cursor-pointer min-w-[120px]"
          >
            <option value="ALL">All Modules</option>
            {availableModules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-zinc-100 dark:bg-[#1D212C] p-0.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">
            <button onClick={() => setViewMode('effective')} className={`px-2.5 py-1 rounded-md transition-colors ${viewMode === 'effective' ? 'bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] shadow-2xs font-semibold' : 'hover:text-zinc-900 dark:hover:text-[#E6E8EE]'}`}>Effective</button>
            <button onClick={() => setViewMode('matrix')} className={`px-2.5 py-1 rounded-md transition-colors ${viewMode === 'matrix' ? 'bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] shadow-2xs font-semibold' : 'hover:text-zinc-900 dark:hover:text-[#E6E8EE]'}`}>Matrix</button>
          </div>
          {isAdmin && syncMode && (
            <button
              onClick={handleSyncPermissions}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Save size={13} /> {isSubmitting ? 'Syncing...' : 'Sync Changes'}
            </button>
          )}
          {isAdmin && !syncMode && (
            <button
              onClick={() => setSyncMode(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] rounded-lg text-xs font-semibold transition-all"
            >
              <RotateCcw size={13} /> Sync Mode
            </button>
          )}
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {syncMode && hasUnsavedChanges && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <span>You have unsaved permission changes in Sync Mode.</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setStagedPermissions(initialStaged); setSyncMode(false); }} className="px-2.5 py-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] font-medium">Reset</button>
            <button onClick={handleSyncPermissions} disabled={isSubmitting} className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold">
              {isSubmitting ? 'Syncing...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Revoke Dialog */}
      {revokingPermission && (
        <form onSubmit={handleConfirmRevoke} className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-3 animate-slide-down">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-rose-600 dark:text-rose-400" />
              Revoke: {revokingPermission.featureCode}_{revokingPermission.action}
            </h3>
            <button type="button" onClick={() => setRevokingPermission(null)} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-[#E6E8EE]">Cancel</button>
          </div>
          <div>
            <label className="text-[11px] font-medium text-rose-800 dark:text-rose-300 block mb-1">Reason (required):</label>
            <input
              type="text"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Write access no longer needed..."
              className="w-full px-3 py-2 bg-white dark:bg-[#161922] border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-zinc-900 dark:text-[#E6E8EE] outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRevokingPermission(null)} className="px-3 py-1.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] rounded-lg text-xs font-medium">Cancel</button>
            <button type="submit" disabled={!revokeReason.trim() || isSubmitting} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50">
              {isSubmitting ? 'Revoking...' : 'Confirm Revoke'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-2 py-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse p-4 border border-zinc-100 dark:border-[#2A2F3D] rounded-xl">
              <div className="flex gap-4">
                <div className="h-4 bg-zinc-100 dark:bg-[#1D212C] rounded w-1/4" />
                <div className="h-4 bg-zinc-100 dark:bg-[#1D212C] rounded w-16" />
                <div className="h-4 bg-zinc-100 dark:bg-[#1D212C] rounded w-16" />
                <div className="h-4 bg-zinc-100 dark:bg-[#1D212C] rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'effective' ? (
        // ── EFFECTIVE VIEW ──
        <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-2xs">
          <div className="hidden md:grid grid-cols-[2fr_1fr_2fr_1fr_1fr_auto] items-center px-4 py-2.5 bg-zinc-50/90 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider gap-3">
            <div>Feature</div>
            <div>Action</div>
            <div>Permission Code</div>
            <div>Source</div>
            <div>Allowed</div>
            {isAdmin && <div className="w-20">Actions</div>}
          </div>
          {effectivePermissions.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 dark:text-[#A0A6B5] text-xs">
              <Lock size={24} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
              No effective permissions found. Assign roles or grant direct permissions.
            </div>
          ) : (
            effectivePermissions
              .filter((p) => {
                if (permSearch) {
                  const t = permSearch.toLowerCase();
                  return p.featureCode?.toLowerCase().includes(t) || p.action?.toLowerCase().includes(t) || p.permissionCode?.toLowerCase().includes(t);
                }
                return true;
              })
              .map((p, idx) => (
                <div key={`${p.featureCode}-${p.action}-${idx}`} className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr_auto] items-center px-4 py-2.5 gap-3 border-b border-zinc-100 dark:border-[#2A2F3D] last:border-0 hover:bg-zinc-50/60 dark:hover:bg-[#1D212C] text-xs">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{p.featureCode}</div>
                  </div>
                  <div>
                    <span className="font-mono text-zinc-700 dark:text-[#E6E8EE] bg-zinc-100 dark:bg-[#1D212C] px-1.5 py-0.5 rounded text-[10px]">{p.action}</span>
                  </div>
                  <div className="font-mono text-[10px] text-zinc-500 dark:text-[#A0A6B5] truncate">{p.permissionCode}</div>
                  <div><SourceBadge source={p.source} /></div>
                  <div><AllowedBadge allowed={p.allowed} /></div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 w-20">
                      {!p.allowed || p.source === 'ROLE' ? (
                        <button
                          onClick={() => handleGrantDirect(p.featureCode, p.action)}
                          disabled={isSubmitting}
                          className="px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded transition-colors"
                          title="Grant direct permission"
                        >
                          Grant
                        </button>
                      ) : (
                        <button
                          onClick={() => initiateRevoke(p.featureCode, p.action)}
                          disabled={isSubmitting}
                          className="px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded transition-colors"
                          title="Revoke direct permission"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      ) : (
        // ── MATRIX VIEW ──
        <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
          {filteredFeatures.length === 0 ? (
            <div className="border border-dashed border-zinc-200 dark:border-[#2A2F3D] rounded-xl p-8 text-center text-zinc-400 dark:text-[#A0A6B5] text-xs">
              <Shield size={24} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
              No permissions matched your search.
            </div>
          ) : (
            filteredFeatures.map((feature) => (
              <div key={feature.featureCode} className="border border-zinc-200 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 bg-zinc-50/90 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={13} className="text-zinc-500 dark:text-[#A0A6B5]" />
                    <span className="font-bold text-xs text-zinc-800 dark:text-[#E6E8EE]">{feature.featureName}</span>
                    <span className="font-mono text-[10px] text-zinc-500 dark:text-[#A0A6B5] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] px-1.5 py-0.5 rounded">{feature.featureCode}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">{feature.moduleName}</span>
                  </div>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                  {allActions.filter((action) => feature.actions[action]).map((action) => {
                    const perm = feature.actions[action];
                    const effectiveState = getEffectiveState(feature.featureCode, action);
                    const userDirect = getUserDirectState(feature.featureCode, action);
                    const key = `${feature.featureCode}::${action}`;
                    const stagedOn = syncMode ? (stagedPermissions[key] ?? false) : null;

                    return (
                      <div key={action} className="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-zinc-50/60 dark:hover:bg-[#1D212C] text-xs">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="font-mono text-zinc-700 dark:text-[#E6E8EE] bg-zinc-100 dark:bg-[#1D212C] px-2 py-0.5 rounded text-[10px] shrink-0">{action}</span>
                          <span className="text-zinc-500 dark:text-[#A0A6B5] text-[11px] truncate">{perm.description || `${feature.featureCode} ${action} permission`}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {effectiveState && <SourceBadge source={effectiveState.source} />}
                          {effectiveState && <AllowedBadge allowed={effectiveState.allowed} />}
                          {isAdmin && (
                            <div className="flex items-center gap-1.5">
                              {syncMode ? (
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={stagedOn}
                                  onClick={() => handleStagedToggle(feature.featureCode, action)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${stagedOn ? 'bg-zinc-900 dark:bg-blue-600' : 'bg-zinc-200 dark:bg-[#2A2F3D]'}`}
                                >
                                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${stagedOn ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                              ) : (
                                <>
                                  {!effectiveState?.allowed || effectiveState?.source === 'ROLE' ? (
                                    <button
                                      onClick={() => handleGrantDirect(feature.featureCode, action)}
                                      disabled={isSubmitting}
                                      className="px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded transition-colors"
                                    >
                                      Grant
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => initiateRevoke(feature.featureCode, action)}
                                      disabled={isSubmitting}
                                      className="px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded transition-colors"
                                    >
                                      Revoke
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN MODAL
// ══════════════════════════════════════════════════════════════════════════════
export default function UserFeaturePermissionModal({ user, isOpen, onClose, onSuccess, selectedRole }) {
  const [activeTab, setActiveTab] = useState('features');
  const [allFeatures, setAllFeatures] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('features');
      getAllFeatures()
        .then((res) => setAllFeatures(Array.isArray(res) ? res : []))
        .catch(() => { });
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const tabs = [
    { id: 'features', label: 'Feature Access', icon: Key },
    { id: 'permissions', label: 'Action Permissions', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white dark:bg-[#161922] w-full max-w-4xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden flex flex-col max-h-[92vh] animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ufpm-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50/70 dark:bg-[#1D212C] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
              {user.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 id="ufpm-title" className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE] flex items-center gap-2 flex-wrap">
                <span>{user.fullName}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-[#161922] text-zinc-700 dark:text-[#A0A6B5] border border-transparent dark:border-[#2A2F3D] font-mono">
                  {user.empId || user.username}
                </span>
                {selectedRole && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-transparent dark:border-indigo-800/40">
                    {selectedRole.name}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5">User Permission Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-[#E6E8EE] hover:bg-zinc-200/50 dark:hover:bg-[#161922] flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-2 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 flex items-center gap-2 text-xs text-blue-900 dark:text-blue-300 shrink-0">
          <Info size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            Feature Access grants module-level access. Action Permissions control granular READ / WRITE / DELETE capabilities.
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-zinc-200 dark:border-[#2A2F3D] px-6 bg-white dark:bg-[#161922] shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${activeTab === tab.id
                    ? 'border-zinc-900 dark:border-blue-500 text-indigo-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE] hover:border-zinc-300 dark:hover:border-[#2A2F3D]'
                  }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-[#161922]">
          {activeTab === 'features' ? (
            <FeatureAccessTab user={user} onRefresh={onSuccess} />
          ) : (
            <ActionPermissionsTab user={user} allFeatures={allFeatures} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-[#1D212C] border-t border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-400 dark:text-[#A0A6B5]">Changes take effect on subsequent sessions and API calls.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-100 dark:hover:bg-[#222736] text-zinc-700 dark:text-[#E6E8EE] rounded-lg text-xs font-medium transition-all shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
