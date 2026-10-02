import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Info,
  Key
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRBAC } from '../../../utils/rbac';
import { confirmDialog } from '../../../utils/confirmDialog';
import { 
  getUserFeatures, 
  getUserActiveFeatures, 
  getAllFeatures, 
  grantUserFeature, 
  revokeUserFeature, 
  syncUserFeatures 
} from '../../../api/sso/feature';

export default function UserFeatureModal({ user, isOpen, onClose, onSuccess }) {
  const dispatch = useAppDispatch();
  const { isAdmin } = useRBAC();

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userFeatures, setUserFeatures] = useState([]);
  const [activeCodes, setActiveCodes] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'REVOKED'

  // Grant Form State
  const [showGrantSection, setShowGrantSection] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState('');

  // Revoke Reason Dialog State
  const [revokingFeature, setRevokingFeature] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Bulk Sync Mode State
  const [syncMode, setSyncMode] = useState(false);
  const [syncSelectedCodes, setSyncSelectedCodes] = useState([]);

  // Fetch user feature overrides and system feature catalog
  const loadData = useCallback(async () => {
    if (!user?.id || !isOpen) return;
    setIsLoading(true);
    try {
      const [uFeatures, uActive, catalog] = await Promise.all([
        getUserFeatures(user.id),
        getUserActiveFeatures(user.id).catch(() => ({ activeFeatures: [] })),
        getAllFeatures()
      ]);

      const userFeaturesArray = Array.isArray(uFeatures) ? uFeatures : [];
      const activeArray = Array.isArray(uActive?.activeFeatures) 
        ? uActive.activeFeatures 
        : userFeaturesArray.filter(f => !f.revoked).map(f => f.featureCode || f.code);

      setUserFeatures(userFeaturesArray);
      setActiveCodes(activeArray);
      setAllFeatures(Array.isArray(catalog) ? catalog : []);
      setSyncSelectedCodes(activeArray);
    } catch (error) {
      console.error('Failed to load user features', error);
      dispatch(addAlert({ 
        type: 'error', 
        message: error?.response?.data?.message || 'Failed to load user feature overrides' 
      }));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isOpen, dispatch]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setShowGrantSection(false);
      setRevokingFeature(null);
      setRevokeReason('');
      setSyncMode(false);
    }
  }, [isOpen, loadData]);

  // Handle Grant Feature
  const handleGrant = async (e) => {
    e.preventDefault();
    if (!selectedFeatureId) {
      dispatch(addAlert({ type: 'warning', message: 'Please select a feature to grant' }));
      return;
    }

    const featureObj = allFeatures.find(f => String(f.id) === String(selectedFeatureId));
    if (!featureObj) return;

    setIsSubmitting(true);
    try {
      await grantUserFeature(user.id, {
        featureCode: featureObj.code,
        featureId: featureObj.id
      });
      dispatch(addAlert({ type: 'success', message: `Feature "${featureObj.name}" granted to user` }));
      setSelectedFeatureId('');
      setShowGrantSection(false);
      await loadData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Grant feature failed', error);
      dispatch(addAlert({ 
        type: 'error', 
        message: error?.response?.data?.message || 'Failed to grant feature' 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Revoke Prompt
  const initiateRevoke = (uf) => {
    setRevokingFeature(uf);
    setRevokeReason('Access revoked by administrator');
  };

  // Confirm and Execute Revoke
  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    if (!revokingFeature) return;

    if (!revokeReason.trim()) {
      dispatch(addAlert({ type: 'warning', message: 'Revocation reason is required' }));
      return;
    }

    setIsSubmitting(true);
    try {
      await revokeUserFeature(user.id, {
        featureCode: revokingFeature.featureCode || revokingFeature.code,
        featureId: revokingFeature.featureId || revokingFeature.id,
        reason: revokeReason.trim()
      });
      dispatch(addAlert({ 
        type: 'success', 
        message: `Feature "${revokingFeature.featureName || revokingFeature.name || revokingFeature.featureCode}" revoked` 
      }));
      setRevokingFeature(null);
      setRevokeReason('');
      await loadData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Revoke feature failed', error);
      dispatch(addAlert({ 
        type: 'error', 
        message: error?.response?.data?.message || 'Failed to revoke feature' 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Bulk Sync
  const handleBulkSyncSubmit = async () => {
    const confirmed = await confirmDialog({
      title: 'Confirm Feature Synchronization',
      message: `Are you sure you want to synchronize ${syncSelectedCodes.length} active feature(s) for ${user.fullName}? Unselected features will be revoked.`
    });

    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await syncUserFeatures(user.id, syncSelectedCodes);
      dispatch(addAlert({ type: 'success', message: 'User features successfully synchronized' }));
      setSyncMode(false);
      await loadData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Sync features failed', error);
      dispatch(addAlert({ 
        type: 'error', 
        message: error?.response?.data?.message || 'Failed to synchronize features' 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  // Filter user features for display
  const filteredUserFeatures = userFeatures.filter(uf => {
    const isRevoked = uf.revoked;
    if (statusFilter === 'ACTIVE' && isRevoked) return false;
    if (statusFilter === 'REVOKED' && !isRevoked) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      uf.featureCode?.toLowerCase().includes(term) ||
      uf.featureName?.toLowerCase().includes(term) ||
      uf.moduleName?.toLowerCase().includes(term) ||
      uf.revokeReason?.toLowerCase().includes(term)
    );
  });

  // Features available to grant (not already active)
  const availableToGrant = allFeatures.filter(f => !activeCodes.includes(f.code));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* ── Modal Header ── */}
        <div className="px-6 py-4.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
              {user.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <span>{user.fullName}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200/80 text-zinc-700 font-mono">
                  {user.empId || user.username}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Individual Feature-Based Access Control (FBAC) Overrides
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Information Banner ── */}
        <div className="px-6 py-2.5 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-blue-600 shrink-0" />
            <span>
              User-level feature grants provide direct overrides that supplement or supersede system role permissions.
            </span>
          </div>
          <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full text-[11px] shrink-0">
            {activeCodes.length} Active Feature{activeCodes.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter feature codes, names, or modules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
              <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg text-xs font-medium text-zinc-600 shrink-0">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'hover:text-zinc-900'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'hover:text-zinc-900'}`}
                >
                  Active ({activeCodes.length})
                </button>
                <button
                  onClick={() => setStatusFilter('REVOKED')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === 'REVOKED' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'hover:text-zinc-900'}`}
                >
                  Revoked
                </button>
              </div>
            </div>

            {isAdmin && !syncMode && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSyncMode(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                  title="Bulk synchronize feature codes"
                >
                  <RotateCcw size={13} />
                  Bulk Sync
                </button>
                <button
                  onClick={() => setShowGrantSection(!showGrantSection)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
                >
                  <Plus size={14} />
                  Grant Feature
                </button>
              </div>
            )}
          </div>

          {/* Grant Feature Section */}
          {showGrantSection && isAdmin && (
            <form onSubmit={handleGrant} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3 animate-slide-down">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={13} className="text-indigo-600" />
                  Grant Feature to {user.fullName}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGrantSection(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Cancel
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <select
                  value={selectedFeatureId}
                  onChange={(e) => setSelectedFeatureId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="">Select feature to grant...</option>
                  {availableToGrant.map(feat => (
                    <option key={feat.id} value={feat.id}>
                      {feat.name} ({feat.code}) — {feat.moduleName || 'GLOBAL'}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedFeatureId || isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap shadow-2xs"
                >
                  {isSubmitting ? 'Granting...' : 'Confirm Grant'}
                </button>
              </div>
            </form>
          )}

          {/* Revoke Reason Input Prompt */}
          {revokingFeature && (
            <form onSubmit={handleConfirmRevoke} className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-3 animate-slide-down">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-rose-600" />
                  Revoke Feature: {revokingFeature.featureName || revokingFeature.featureCode}
                </h3>
                <button
                  type="button"
                  onClick={() => setRevokingFeature(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Cancel
                </button>
              </div>
              <div>
                <label className="text-[11px] font-medium text-rose-800 block mb-1">
                  Reason for revocation (required for audit logging):
                </label>
                <input
                  type="text"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Role changed, temporary access expired..."
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs text-zinc-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRevokingFeature(null)}
                  className="px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!revokeReason.trim() || isSubmitting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Revoking...' : 'Confirm Revocation'}
                </button>
              </div>
            </form>
          )}

          {/* Bulk Sync Mode Selector */}
          {syncMode && (
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3 animate-slide-down">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-amber-900">
                    Bulk Feature Synchronization Mode
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSyncMode(false)}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkSyncSubmit}
                    disabled={isSubmitting}
                    className="px-3.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all shadow-2xs"
                  >
                    {isSubmitting ? 'Syncing...' : `Save Sync (${syncSelectedCodes.length})`}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-amber-800">
                Select the exact feature codes that should be active for this user. Any unselected codes will be revoked automatically.
              </p>
              <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-white rounded-lg border border-amber-200/80">
                {allFeatures.map(feat => {
                  const isChecked = syncSelectedCodes.includes(feat.code);
                  return (
                    <label 
                      key={feat.id} 
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                        isChecked 
                          ? 'bg-amber-50/60 border-amber-300 text-amber-950 font-medium' 
                          : 'border-zinc-100 hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSyncSelectedCodes([...syncSelectedCodes, feat.code]);
                          } else {
                            setSyncSelectedCodes(syncSelectedCodes.filter(c => c !== feat.code));
                          }
                        }}
                        className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{feat.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono truncate">{feat.code}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* User Feature List */}
          {isLoading ? (
            <div className="space-y-2 py-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-3.5 border border-zinc-100 rounded-xl">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-zinc-100 rounded w-1/3" />
                    <div className="h-3 bg-zinc-50 rounded w-1/2" />
                  </div>
                  <div className="h-6 w-16 bg-zinc-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredUserFeatures.length > 0 ? (
            <div className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100 shadow-2xs">
              {filteredUserFeatures.map((uf) => {
                const isRevoked = uf.revoked;
                return (
                  <div 
                    key={uf.id || `${uf.featureCode}-${uf.grantedAt}`} 
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isRevoked ? 'bg-zinc-50/40 opacity-75' : 'bg-white hover:bg-zinc-50/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-zinc-900">
                          {uf.featureName || uf.featureCode}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                          {uf.featureCode}
                        </span>
                        {uf.moduleName && (
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-medium">
                            {uf.moduleName}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isRevoked 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/60' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        }`}>
                          {isRevoked ? 'REVOKED' : 'ACTIVE'}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-3 flex-wrap">
                        {uf.grantedAt && (
                          <span>Granted: {new Date(uf.grantedAt).toLocaleDateString()} by {uf.grantedBy || 'Admin'}</span>
                        )}
                        {isRevoked && uf.revokeReason && (
                          <span className="text-rose-600 font-medium">
                            Reason: "{uf.revokeReason}" ({new Date(uf.revokedAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && !isRevoked && (
                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => initiateRevoke(uf)}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                        >
                          Revoke Access
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center bg-zinc-50/50">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-2.5">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-xs font-bold text-zinc-700">No feature overrides found</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'No features matched your current filter criteria.'
                  : `${user.fullName} currently inherits permissions solely from assigned organizational roles.`}
              </p>
              {isAdmin && !searchTerm && statusFilter === 'ALL' && (
                <button
                  onClick={() => setShowGrantSection(true)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  <Plus size={13} />
                  Grant Custom Feature Override
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            Changes take effect on subsequent user sessions and API calls.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium transition-all shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
