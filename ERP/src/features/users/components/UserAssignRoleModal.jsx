import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { getRoles } from '../../../api/sso/role';
import {
  syncMemberCompanyRoles,
  grantMemberCompanyAccess,
} from '../../../api/sso/organization.api';
import CustomSelect from '../../../components/common/CustomSelect';
import {
  Key,
  Building2,
  Briefcase,
  Shield,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  RefreshCw,
  Users,
  Info,
} from 'lucide-react';

/**
 * Standard enterprise role descriptions for fallback when custom descriptions are not set.
 */
  const ROLE_DESCRIPTIONS = {
    OWNER: 'Full organization and tenant root administration across all modules, companies, and settings.',
    ADMIN: 'Full administrative access to manage all company operations, workflows, user privileges, and settings.',
    COMPANY_ADMIN: 'Full administrative access to manage all company operations, workflows, user privileges, and settings.',
    ACCOUNTANT: 'Manage invoices, payments, vouchers, reconciliation, and financial ledgers.',
    GL_ACCOUNTANT: 'General ledger management, journal entries, trial balance, and financial period closing.',
    AUDITOR: 'Read-only audit trails, compliance verification, and financial reports inspection.',
    SALES_EXECUTIVE: 'Create quotations, sales orders, delivery challans, and customer invoices.',
    PURCHASE_MANAGER: 'Manage vendor purchase orders, goods receipts, and vendor bills.',
    INVENTORY_MANAGER: 'Track stock levels, warehouse transfers, item valuation, and adjustments.',
    STORE_KEEPER: 'Maintain store inventory, bin tracking, and stock movement logs.',
    MANAGER: 'Oversee department operations, review team workflows, and approve transactions.',
    VIEWER: 'Read-only access to view company dashboards, reports, and records without editing.',
    STAFF: 'Standard company staff access for day-to-day routine tasks.',
    MEMBER: 'Standard organization member access within assigned company workflows.',
  };

  /**
   * Helper to determine a descriptive, user-friendly description for any role.
   */
  function getRoleDescription(role) {
    if (role.description && typeof role.description === 'string' && role.description.trim()) {
      return role.description.trim();
    }
    const rawName = (role.name || role.roleName || '')
      .toUpperCase()
      .replace(/^ROLE_/, '')
      .replace(/[\s-]+/g, '_');

    for (const [key, desc] of Object.entries(ROLE_DESCRIPTIONS)) {
      if (rawName === key || rawName.includes(key)) {
        return desc;
      }
    }
    return 'Company role defining permissions and functional access.';
  }

  /**
   * UserAssignRoleModal
   *
   * Comprehensive modal to assign single or multiple company-level roles to an organization member or user.
   * Supports:
   * - Displaying selected user identity (Name, Email, ID, Membership Type).
   * - Displaying organization context and associated company / company selector.
   * - Dynamic fetching of available company roles from the backend API.
   * - Role names with clear, helpful functional descriptions.
   * - Multi-role selection according to the PostgreSQL composite key (user_id, role_id).
   * - Prominent indicators showing currently assigned roles.
   * - Loading indicators during role fetch and submission.
   * - Clear success notification, error handling, and instant table refresh.
   */
  export default function UserAssignRoleModal({
    isOpen,
    onClose,
    user,
    organization,
    companies: passedCompanies = [],
    availableRoles: passedRoles,
    assignUserRoleMutation,
    onUpdated,
    onSuccess,
  }) {
    const dispatch = useAppDispatch();

    // Search & Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [roleFetchError, setRoleFetchError] = useState(null);
    const [rolesCache, setRolesCache] = useState({});

    // Normalize user company access details
    const userCompanyAccesses = useMemo(() => {
      if (!user) return [];
      if (Array.isArray(user.companyAccess) && user.companyAccess.length > 0) {
        return user.companyAccess;
      }
      if (Array.isArray(user.authorizedCompanies) && user.authorizedCompanies.length > 0) {
        return user.authorizedCompanies.map((cName, idx) => ({
          companyId: user.authorizedCompanyIds?.[idx] || String(idx),
          companyName: cName,
          active: true,
          roleName: user.role || 'Member',
        }));
      }
      return [];
    }, [user]);

    // Determine available companies for selection
    const availableCompanies = useMemo(() => {
      if (userCompanyAccesses.length > 0) {
        return userCompanyAccesses.map((ca) => ({
          id: String(ca.companyId),
          name: ca.companyName || ca.name || 'Company',
          roleName: ca.roleName,
          roleNames: ca.roleNames,
          roleId: ca.roleId,
          roleIds: ca.roleIds,
          active: ca.active !== false,
        }));
      }
      if (Array.isArray(passedCompanies) && passedCompanies.length > 0) {
        return passedCompanies.map((c) => ({
          id: String(c.id || c.companyId),
          name: c.companyName || c.name || c.legalName || 'Company',
          active: true,
        }));
      }
      return [];
    }, [userCompanyAccesses, passedCompanies]);

    // Initialize selected company when opening modal
    useEffect(() => {
        if (isOpen && availableCompanies.length > 0) {
          const exists = availableCompanies.some((c) => c.id === selectedCompanyId);
          if (!selectedCompanyId || !exists) {
            setSelectedCompanyId(availableCompanies[0].id);
          }
        }
      }, [isOpen, availableCompanies, selectedCompanyId]);

    // Current company access record for the active company
    const currentCompanyAccess = useMemo(() => {
      return userCompanyAccesses.find((ca) => String(ca.companyId) === String(selectedCompanyId)) || null;
    }, [userCompanyAccesses, selectedCompanyId]);

    // IDs of roles currently assigned in this company
    const currentlyAssignedRoleIds = useMemo(() => {
      if (!currentCompanyAccess) return [];
      if (Array.isArray(currentCompanyAccess.roleIds) && currentCompanyAccess.roleIds.length > 0) {
        return currentCompanyAccess.roleIds.map(String);
      }
      if (currentCompanyAccess.roleId) {
        return [String(currentCompanyAccess.roleId)];
      }
      return [];
    }, [currentCompanyAccess]);

    // Names of roles currently assigned in this company
    const currentlyAssignedRoleNames = useMemo(() => {
      if (!currentCompanyAccess) return [];
      if (Array.isArray(currentCompanyAccess.roleNames) && currentCompanyAccess.roleNames.length > 0) {
        return currentCompanyAccess.roleNames.map((r) => String(r).toUpperCase());
      }
      if (currentCompanyAccess.roleName) {
        return currentCompanyAccess.roleName
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
      }
    return [];
  }, [currentCompanyAccess]);

  // Fetch available roles from backend API for selected company
  const fetchRolesForCompany = useCallback(async (compId) => {
    if (!compId) return;
    if (rolesCache[compId]) return;

    setIsLoadingRoles(true);
    setRoleFetchError(null);
    try {
      const res = await getRoles({ companyId: compId, page: 0, pageSize: 200 });
      let rolesList = [];
      if (Array.isArray(res)) rolesList = res;
      else if (Array.isArray(res?.roles)) rolesList = res.roles;
      else if (Array.isArray(res?.content)) rolesList = res.content;
      else if (Array.isArray(res?.data?.content)) rolesList = res.data.content;
      else if (Array.isArray(res?.data)) rolesList = res.data;

      setRolesCache((prev) => ({ ...prev, [compId]: rolesList }));
    } catch (err) {
      console.error('Failed to fetch roles for company:', err);
      setRoleFetchError(err?.response?.data?.message || err?.message || 'Failed to fetch roles');
    } finally {
      setIsLoadingRoles(false);
    }
  }, [rolesCache]);

  // Trigger fetch when company changes or modal opens
  useEffect(() => {
    if (isOpen && selectedCompanyId && (!passedRoles || passedRoles.length === 0)) {
      fetchRolesForCompany(selectedCompanyId);
    }
  }, [isOpen, selectedCompanyId, passedRoles, fetchRolesForCompany]);

  // Resolved list of available roles for the active company
  const availableRoles = useMemo(() => {
    if (Array.isArray(passedRoles) && passedRoles.length > 0) {
      return passedRoles;
    }
    return rolesCache[selectedCompanyId] || [];
  }, [passedRoles, rolesCache, selectedCompanyId]);

  // Initialize selected roles matching current assignment
  useEffect(() => {
    if (isOpen && availableRoles.length > 0) {
      const matchedIds = availableRoles
        .filter((r) => {
          const idMatches = currentlyAssignedRoleIds.includes(String(r.id));
          const nameMatches = currentlyAssignedRoleNames.includes(
            (r.name || r.roleName || '').toUpperCase()
          );
          return idMatches || nameMatches;
        })
        .map((r) => String(r.id));

      setSelectedRoleIds(matchedIds);
    } else if (isOpen && availableRoles.length === 0) {
      setSelectedRoleIds([]);
    }
  }, [isOpen, selectedCompanyId, availableRoles, currentlyAssignedRoleIds, currentlyAssignedRoleNames]);

  // Reset search term on modal open/close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setRoleFetchError(null);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  // Filter roles based on user search
  const filteredRoles = availableRoles.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = (r.name || r.roleName || '').toLowerCase().includes(term);
    const descMatch = getRoleDescription(r).toLowerCase().includes(term);
    return nameMatch || descMatch;
  });

  // Toggle selection for a role
  const handleToggleRole = (roleId) => {
    const strId = String(roleId);
    setSelectedRoleIds((prev) =>
      prev.includes(strId) ? prev.filter((id) => id !== strId) : [...prev, strId]
    );
  };

  // Select all visible roles
  const handleSelectAll = () => {
    const allVisibleIds = filteredRoles.map((r) => String(r.id));
    setSelectedRoleIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
  };

  // Deselect all roles
  const handleDeselectAll = () => {
    setSelectedRoleIds([]);
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

      if (selectedRoleIds.length === 0) {
        dispatch(addAlert({ type: 'warning', message: 'Please select at least one role to assign' }));
        return;
      }


      if (!selectedCompanyId) {
        dispatch(addAlert({ type: 'warning', message: 'Please select an associated company' }));
        return;
      }

      setIsSubmitting(true);
      try {
        // Legacy single-role mutation fallback (UserList / UserDetails)
        if (
          typeof assignUserRoleMutation === 'function' &&
          !user.memberId &&
          (!user.companyAccess || user.companyAccess.length === 0)
        ) {
          await assignUserRoleMutation(user.id || user.userId, selectedRoleIds[0]);
        } else {
          // Organization Member Multi-Company Role Assignment
          const effectiveMemberId = user.memberId || user.id;
          const effectiveUserId = user.userId || user.id;
          const targetId = effectiveMemberId || effectiveUserId;
          const isUserId = !effectiveMemberId;

          const hasActiveCompanyAccess = (user.companyAccess || []).some(
            (ca) => String(ca.companyId) === String(selectedCompanyId) && ca.active !== false
          );

          if (hasActiveCompanyAccess) {
            try {
              await syncMemberCompanyRoles(targetId, selectedCompanyId, selectedRoleIds, isUserId);
            } catch (syncErr) {
              // If the user access record was deactivated, fallback to grant
              if (
                syncErr?.response?.data?.message?.includes('active access') ||
                syncErr?.response?.status === 400
              ) {
                await grantMemberCompanyAccess(targetId, selectedCompanyId, selectedRoleIds, isUserId);
              } else {
                throw syncErr;
              }
            }
          } else {
            await grantMemberCompanyAccess(targetId, selectedCompanyId, selectedRoleIds, isUserId);
          }
        }

        const userName = user.fullName || user.name || user.email || 'User';
        const targetCompany = availableCompanies.find((c) => String(c.id) === String(selectedCompanyId));
        const compName = targetCompany ? targetCompany.name : 'Company';

        dispatch(
          addAlert({
            type: 'success',
            message: `Roles updated successfully for ${userName} in ${compName}`,
          })
        );

        onSuccess?.();
        onUpdated?.();
        onClose();
      } catch (error) {
        console.error('Assign role error:', error);
        dispatch(
          addAlert({
            type: 'error',
            message: error?.response?.data?.message || error?.message || 'Failed to update roles',
          })
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    const orgName = organization?.name || organization?.organizationName || 'Current Organization';
    const selectedCompanyName =
      availableCompanies.find((c) => String(c.id) === String(selectedCompanyId))?.name || 'Company';

    return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto"
                onClick={(e) => {
                  if (e.target === e.currentTarget && !isSubmitting) onClose();
                }}
              >
                <div className="card max-w-2xl w-full p-6 space-y-6 animate-slide-up max-h-[92vh] flex flex-col bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] shadow-2xl rounded-2xl">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-zinc-100 dark:border-[#2A2F3D] pb-4 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold border border-purple-200/60 dark:border-purple-800/60 shrink-0">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">
                          Assign Roles
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5">
                          Assign and configure company permissions for{' '}
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {user.fullName || user.name || user.email}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE] transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                      {/* Scrollable Modal Content */}
                      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                        {/* User & Organization Context Banner */}
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                                {(user.fullName || user.name || user.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                  {user.fullName || user.name || 'User'}
                                </h4>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email || '-'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200">
                                <Shield size={11} className="text-zinc-500" />
                                {user.memberType || 'MEMBER'}
                              </span>
                              {user.empId && user.empId !== '-' && (
                                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                  ID: {user.empId}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-xs">
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                              <Building2 size={14} className="text-zinc-400 shrink-0" />
                              <span className="text-zinc-500 dark:text-zinc-400">Organization:</span>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{orgName}</span>
                            </div>

                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                              <Briefcase size={14} className="text-zinc-400 shrink-0" />
                              <span className="text-zinc-500 dark:text-zinc-400">Associated Company:</span>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {selectedCompanyName}
                              </span>
                            </div>
                          </div>
                        </div>

                          {/* Company Selector (if user has access to multiple companies or selecting unassigned) */}
                          {availableCompanies.length > 1 && (
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                <span>Select Company to Manage Roles</span>
                                <span className="text-[11px] font-normal text-zinc-500">
                                  User belongs to {availableCompanies.length} companies
                                </span>
                              </label>
                              <CustomSelect
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full text-xs"
                              >
                                {availableCompanies.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} {c.roleName ? `(${c.roleName})` : ''}
                                  </option>
                                ))}
                              </CustomSelect>
                            </div>
                          )}

                          {/* Currently Assigned Roles Summary */}
                          {currentlyAssignedRoleNames.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                                Current Roles in {selectedCompanyName}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {currentlyAssignedRoleNames.map((rName, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                  >
                                    <CheckCircle2 size={12} className="text-indigo-500" />
                                    {rName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Roles Selection Section */}
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-[#A0A6B5] flex items-center gap-1.5">
                                  <Shield className="w-4 h-4 text-purple-600" />
                                  Available Company Roles ({availableRoles.length})
                                </h4>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                  {selectedRoleIds.length} Selected
                                </span>
                              </div>

                              {availableRoles.length > 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                  <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    disabled={isSubmitting || isLoadingRoles}
                                    className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
                                  >
                                    Select All
                                  </button>
                                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                  <button
                                    type="button"
                                    onClick={handleDeselectAll}
                                    disabled={isSubmitting || isLoadingRoles}
                                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
                                  >
                                    Clear All
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Search Box */}
                            {availableRoles.length > 3 && (
                              <div className="relative">
                                <Search
                                  size={14}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                                />
                                <input
                                  type="text"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  placeholder="Filter roles by name or description..."
                                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                />
                              </div>
                            )}

                            {/* Role Fetching Loader */}
                            {isLoadingRoles && (
                              <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                <RefreshCw size={24} className="text-purple-500 animate-spin" />
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  Loading roles for {selectedCompanyName}...
                                </p>
                              </div>
                            )}

                            {/* Role Fetch Error */}
                            {!isLoadingRoles && roleFetchError && (
                              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center justify-between text-xs text-red-600 dark:text-red-400">
                                <div className="flex items-center gap-2">
                                  <AlertCircle size={16} className="shrink-0" />
                                  <span>{roleFetchError}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => fetchRolesForCompany(selectedCompanyId)}
                                  className="px-2.5 py-1 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200 font-medium hover:bg-red-200"
                                >
                                  Retry
                                </button>
                              </div>
                            )}

                            {/* Empty Roles List */}
                            {!isLoadingRoles && !roleFetchError && filteredRoles.length === 0 && (
                              <div className="p-6 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                <Shield size={24} className="mx-auto text-zinc-400" />
                                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                  {searchTerm ? 'No roles match your search' : 'No roles available for this company'}
                                </p>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {searchTerm
                                    ? 'Try clearing the search filter.'
                                    : 'Configure roles in Organization Settings → Role Management to deploy them here.'}
                                </p>
                              </div>
                            )}

                            {/* Role Cards List */}
                            {!isLoadingRoles && !roleFetchError && filteredRoles.length > 0 && (
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {filteredRoles.map((role) => {
                                  const roleIdStr = String(role.id);
                                  const isChecked = selectedRoleIds.includes(roleIdStr);
                                  const isCurrentlyAssigned =
                                    currentlyAssignedRoleIds.includes(roleIdStr) ||
                                    currentlyAssignedRoleNames.includes((role.name || role.roleName || '').toUpperCase());
                                  const description = getRoleDescription(role);

                                  return (
                                    <div
                                      key={roleIdStr}
                                      onClick={() => !isSubmitting && handleToggleRole(roleIdStr)}
                                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${isChecked
                                          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm'
                                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-800/40'
                                        }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleRole(roleIdStr)}
                                        disabled={isSubmitting}
                                        className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-purple-600 focus:ring-purple-500"
                                        onClick={(e) => e.stopPropagation()}
                                      />

                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                            {role.name || role.roleName}
                                          </span>

                                          <div className="flex items-center gap-1.5">
                                            {isCurrentlyAssigned && (
                                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                                                <Check size={10} /> Currently Assigned
                                              </span>
                                            )}
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                                              Active
                                            </span>
                                          </div>
                                        </div>

                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                          {description}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sticky Modal Footer */}
                        <div className="pt-4 border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between gap-3 shrink-0">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {selectedRoleIds.length === 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                <Info size={13} /> Select at least one role
                              </span>
                            ) : (
                              <span>
                                <strong className="text-zinc-800 dark:text-zinc-200">{selectedRoleIds.length}</strong>{' '}
                                {selectedRoleIds.length === 1 ? 'role' : 'roles'} selected for {selectedCompanyName}
                              </span>
                            )}
                          </p>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={onClose}
                              disabled={isSubmitting}
                              className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                              <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || selectedRoleIds.length === 0}
                                className="btn-primary flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm"
                              >
                                {isSubmitting ? (
                                  <>
                                    <RefreshCw size={13} className="animate-spin" />
                                    Saving Roles...
                                  </>
                                ) : (
                                  <>
                                    <Key size={13} />
                                    Save Role Assignment
                                  </>
                                )}
                              </button>
                          </div>
                      </div>
                    </div>
                </div>
                );
}
