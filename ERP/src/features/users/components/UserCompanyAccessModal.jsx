import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import {
  getUserCompanyAccess,
  grantMemberCompanyAccess,
  updateMemberCompanyRole,
  revokeMemberCompanyAccess,
} from '../../../api/sso/organization.api';
import { getRoles } from '../../../api/sso/role';
import { getCompanies } from '../../../api/sso/company';
import CustomSelect from '../../../components/common/CustomSelect';
import {
  Building2,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  ArrowRight,
  UserCheck,
  X,
  Info,
} from 'lucide-react';
import { confirmDialog } from '../../../utils/confirmDialog';

/**
 * UserCompanyAccessModal
 * 
 * Comprehensive modal for managing Multi-Company User Access and Company-Wise Roles.
 * - Displays all companies accessible by the user and their specific role in each company.
 * - Allows assigning the user to additional companies under the same organization without duplicating records.
 * - Allows updating the user's role independently for each company.
 * - Allows removing user access from a particular company while keeping other company access intact.
 */
export default function UserCompanyAccessModal({
  isOpen,
  onClose,
  user,
  memberId: initialMemberId,
  allCompanies: passedCompanies = [],
  onUpdated,
}) {
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [accessList, setAccessList] = useState([]);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [companyRolesMap, setCompanyRolesMap] = useState({});
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [targetRoleId, setTargetRoleId] = useState('');
  const [targetRoles, setTargetRoles] = useState([]);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [editingRoleCompanyId, setEditingRoleCompanyId] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const userId = user?.id || user?.userId;
  const memberId = initialMemberId || user?.memberId;

  // Load user's company access list
  const loadAccessData = useCallback(async () => {
    if (!userId && !memberId) return;
    setIsLoading(true);
    try {
      let data = [];
      if (userId) {
        data = await getUserCompanyAccess(userId);
      }
      setAccessList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load user company access list:', err);
      // Fallback: parse companyAccess or authorizedCompanies from user object if available
      if (user?.companyAccess && Array.isArray(user.companyAccess)) {
        setAccessList(user.companyAccess);
      } else if (user?.authorizedCompanies && Array.isArray(user.authorizedCompanies)) {
        const fallback = user.authorizedCompanies.map((name, idx) => ({
          companyId: user.authorizedCompanyIds?.[idx] || String(idx),
          companyName: name,
          active: true,
          roleName: user.role || 'USER',
        }));
        setAccessList(fallback);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, memberId, user]);

  // Load organization companies
  const loadOrganizationCompanies = useCallback(async () => {
    try {
      if (passedCompanies && passedCompanies.length > 0) {
        setAvailableCompanies(passedCompanies);
        return;
      }
      const res = await getCompanies({ page: 0, pageSize: 200 });
      const comps = Array.isArray(res)
        ? res
        : (res?.companies || res?.content || res?.data?.content || res?.data || []);
      setAvailableCompanies(
        (Array.isArray(comps) ? comps : []).map(c => ({
          ...c,
          id: c.id || c.companyId,
          name: c.companyName || c.name || c.code || 'Unnamed Company',
        }))
      );
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  }, [passedCompanies]);

  useEffect(() => {
    if (isOpen) {
      setTargetCompanyId('');
      setTargetRoleId('');
      setTargetRoles([]);
      setEditingRoleCompanyId(null);
      loadAccessData();
      loadOrganizationCompanies();
    }
  }, [isOpen, loadAccessData, loadOrganizationCompanies]);

  // Fetch roles for a specific company on demand and cache them
  const fetchRolesForCompany = useCallback(async (compId) => {
    if (!compId) return [];
    if (companyRolesMap[compId]) return companyRolesMap[compId];

    try {
      const res = await getRoles({ companyId: compId, page: 0, pageSize: 200 });
      const roles = Array.isArray(res)
        ? res
        : (res?.roles || res?.content || res?.data?.content || res?.data || []);
      const validRoles = Array.isArray(roles) ? roles : [];
      setCompanyRolesMap(prev => ({ ...prev, [compId]: validRoles }));
      return validRoles;
    } catch (err) {
      console.warn(`Failed to fetch roles for company ${compId}:`, err);
      return [];
    }
  }, [companyRolesMap]);

  // When targetCompanyId changes in "Assign to Company" form, load that company's roles
  useEffect(() => {
    if (!targetCompanyId) {
      setTargetRoles([]);
      setTargetRoleId('');
      return;
    }

    let isMounted = true;
    setIsRolesLoading(true);
    fetchRolesForCompany(targetCompanyId).then(roles => {
      if (isMounted) {
        setTargetRoles(roles);
        setIsRolesLoading(false);
        if (roles.length > 0) {
          // Pre-select first non-admin or first available role
          setTargetRoleId(roles[0].id);
        } else {
          setTargetRoleId('');
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [targetCompanyId, fetchRolesForCompany]);

  // Handle assigning user to a new company
  const handleAssignToCompany = async (e) => {
    e.preventDefault();
    if (!targetCompanyId) {
      dispatch(addAlert({ type: 'warning', message: 'Please select a company to assign' }));
      return;
    }

    const effectiveMemberId = memberId || user?.memberId;
    const effectiveUserId = userId || user?.id || user?.userId;
    const targetId = effectiveMemberId || effectiveUserId;
    const isUserId = !effectiveMemberId;

    if (!targetId) {
      dispatch(addAlert({ type: 'error', message: 'Organization member or User ID not found. Cannot assign company.' }));
      return;
    }

    setIsAssigning(true);
    try {
      await grantMemberCompanyAccess(targetId, targetCompanyId, targetRoleId || undefined, isUserId);
      dispatch(addAlert({
        type: 'success',
        message: `Successfully granted company access${targetRoleId ? ' and assigned role' : ''}!`,
      }));

      setTargetCompanyId('');
      setTargetRoleId('');
      setTargetRoles([]);
      await loadAccessData();
      onUpdated?.();
    } catch (err) {
      console.error('Failed to grant company access:', err);
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to grant company access',
      }));
    } finally {
      setIsAssigning(false);
    }
  };

  // Open role editor for an existing company access
  const handleOpenEditRole = async (compId, currentRoleId) => {
    setEditingRoleCompanyId(compId);
    setSelectedNewRole(currentRoleId || '');
    const roles = await fetchRolesForCompany(compId);
    if (!currentRoleId && roles.length > 0) {
      setSelectedNewRole(roles[0].id);
    }
  };

  // Submit role update for an existing company access
  const handleSaveRole = async (compId) => {
    if (!selectedNewRole) {
      dispatch(addAlert({ type: 'warning', message: 'Please select a role' }));
      return;
    }

    const effectiveMemberId = memberId || user?.memberId;
    const effectiveUserId = userId || user?.id || user?.userId;
    const targetId = effectiveMemberId || effectiveUserId;
    const isUserId = !effectiveMemberId;

    setIsUpdatingRole(true);
    try {
      await updateMemberCompanyRole(targetId, compId, selectedNewRole, isUserId);
      dispatch(addAlert({
        type: 'success',
        message: 'Role updated successfully for this company!',
      }));
      setEditingRoleCompanyId(null);
      await loadAccessData();
      onUpdated?.();
    } catch (err) {
      console.error('Failed to update company role:', err);
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to update company role',
      }));
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Handle removing company access
  const handleRevokeCompany = async (compId, compName) => {
    const activeCount = accessList.filter(a => a.active).length;
    if (activeCount <= 1) {
      dispatch(addAlert({
        type: 'warning',
        message: 'Cannot revoke the user\'s only remaining active company access. Delete the user to fully remove their account.',
      }));
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Revoke Company Access',
      message: `Are you sure you want to remove ${user?.fullName || user?.name || 'this user'}'s access from "${compName}"? Other companies and the main user account will remain untouched.`,
      confirmText: 'Revoke Access',
      cancelText: 'Cancel',
      danger: true,
    });

    if (!confirmed) return;

    const effectiveMemberId = memberId || user?.memberId;
    const effectiveUserId = userId || user?.id || user?.userId;
    const targetId = effectiveMemberId || effectiveUserId;
    const isUserId = !effectiveMemberId;

    try {
      await revokeMemberCompanyAccess(targetId, compId, isUserId);
      dispatch(addAlert({
        type: 'success',
        message: `Company access revoked for "${compName}".`,
      }));
      await loadAccessData();
      onUpdated?.();
    } catch (err) {
      console.error('Failed to revoke company access:', err);
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to revoke company access',
      }));
    }
  };

  if (!isOpen) return null;

  // Filter companies that the user doesn't already have ACTIVE access to
  const assignedCompanyIds = new Set(
    accessList.filter(a => a.active).map(a => String(a.companyId))
  );

  const unassignedCompanies = availableCompanies.filter(
    c => !assignedCompanyIds.has(String(c.id || c.companyId))
  );

  const activeAccessList = accessList.filter(a => a.active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="card max-w-2xl w-full p-6 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] shadow-2xl rounded-xl">

        {/* Header */}
        <div className="flex justify-between items-start border-b border-zinc-100 dark:border-[#2A2F3D] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-200/60 dark:border-indigo-800/60">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">
                Manage Company Access & Roles
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">
                {user?.fullName || user?.name} ({user?.email || user?.username}) • User ID: <span className="font-mono">{userId ? String(userId).slice(0, 8) : '—'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE] transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Active Company Access List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-[#A0A6B5] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              Active Company Memberships ({activeAccessList.length})
            </h4>
            <span className="text-[11px] font-medium text-zinc-400">
              Max 4 Companies per Organization Plan
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-6 text-zinc-400 text-sm gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading company access details...
            </div>
          ) : activeAccessList.length === 0 ? (
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] text-center text-xs text-zinc-500">
              No active company access found for this user.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden bg-white dark:bg-[#161922]">
              {activeAccessList.map((access) => {
                const compId = access.companyId;
                const isEditingThisRole = editingRoleCompanyId === compId;
                const currentRolesList = companyRolesMap[compId] || [];

                return (
                  <div key={compId} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-[#1D212C]/60 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-[#E6E8EE]">
                          {access.companyName || 'Company'}
                        </span>
                        {access.companyCode && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]">
                            {access.companyCode}
                          </span>
                        )}
                      </div>

                      {/* Current Role display */}
                      {!isEditingThisRole && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <span>Role:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50">
                            {access.roleName || user?.role || 'User'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Role edit / actions */}
                    <div className="flex items-center gap-2">
                      {isEditingThisRole ? (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <CustomSelect
                            value={selectedNewRole}
                            onChange={(e) => setSelectedNewRole(e.target.value)}
                            className="text-xs py-1.5 px-2.5 rounded-lg border border-zinc-300 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE]"
                          >
                            <option value="">-- Select Role --</option>
                            {currentRolesList.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name || r.roleName}
                              </option>
                            ))}
                          </CustomSelect>
                          <button
                            type="button"
                            onClick={() => handleSaveRole(compId)}
                            disabled={isUpdatingRole || !selectedNewRole}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRoleCompanyId(null)}
                            disabled={isUpdatingRole}
                            className="px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditRole(compId, access.roleId)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 transition-colors"
                          >
                            Change Role
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeCompany(compId, access.companyName)}
                            disabled={activeAccessList.length <= 1}
                            title={activeAccessList.length <= 1 ? "Cannot revoke the user's only company access" : "Revoke Company Access"}
                            className={`p-1.5 text-xs font-semibold rounded-lg border transition-colors ${activeAccessList.length <= 1
                                ? 'text-zinc-300 dark:text-zinc-700 border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                                : 'text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Assign to Additional Company */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-[#A0A6B5] flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            Assign to Additional Company
          </h4>

          {unassignedCompanies.length === 0 ? (
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] text-xs text-zinc-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>This user is already assigned to all active companies in this organization.</span>
            </div>
          ) : (
            <form onSubmit={handleAssignToCompany} className="p-4 rounded-xl bg-zinc-50/80 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Company Select */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600 dark:text-[#A0A6B5] block">
                    Target Company *
                  </label>
                  <CustomSelect
                    value={targetCompanyId}
                    onChange={(e) => setTargetCompanyId(e.target.value)}
                    className="input-field text-xs"
                    required
                  >
                    <option value="">-- Choose Company --</option>
                    {unassignedCompanies.map((c) => (
                      <option key={c.id || c.companyId} value={c.id || c.companyId}>
                        {c.name || c.companyName} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </CustomSelect>
                </div>

                {/* Role in that Company Select */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600 dark:text-[#A0A6B5] block">
                    Role in Target Company *
                  </label>
                  {isRolesLoading ? (
                    <div className="text-xs text-zinc-400 p-2.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Loading roles...
                    </div>
                  ) : !targetCompanyId ? (
                    <div className="text-xs text-zinc-400 p-2.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                      Select a company first to load its roles
                    </div>
                  ) : targetRoles.length === 0 ? (
                    <div className="text-xs text-amber-600 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
                      No roles defined in this company
                    </div>
                  ) : (
                    <CustomSelect
                      value={targetRoleId}
                      onChange={(e) => setTargetRoleId(e.target.value)}
                      className="input-field text-xs"
                      required
                    >
                      <option value="">-- Choose Role in Selected Company --</option>
                      {targetRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name || r.roleName}
                        </option>
                      ))}
                    </CustomSelect>
                  )}
                </div>
              </div>

              {/* Informational callout */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200/80 dark:border-blue-800/60 text-xs text-blue-700 dark:text-blue-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Reusing User ID:</span> The user will access this company with their existing login credentials. Their role and permissions in this company will be completely independent from other companies.
                </div>
              </div>

              {/* Submit button */}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isAssigning || !targetCompanyId || !targetRoleId}
                  className="btn-primary flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm"
                >
                  {isAssigning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Assign to Company & Set Role</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}