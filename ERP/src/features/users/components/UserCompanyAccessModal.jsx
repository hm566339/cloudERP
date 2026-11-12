import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import {
  getUserCompanyAccess,
  getMemberCompanyAccess,
  grantMemberCompanyAccess,
  updateMemberCompanyRole,
  addMemberCompanyRole,
  removeMemberCompanyRole,
  syncMemberCompanyRoles,
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
  Check,
} from 'lucide-react';
import { confirmDialog } from '../../../utils/confirmDialog';

const EMPTY_ARRAY = [];

// Module-level caches and single-flight promise registries
export const moduleAccessCache = new Map();
export const moduleAccessPromiseMap = new Map();
export let moduleCompaniesCache = null;
export let moduleCompaniesPromise = null;
export const moduleRolesCache = new Map();
export const moduleRolesPromiseMap = new Map();

/**
 * Reset module-level caches for unit testing or cache invalidation.
 */
export const clearUserCompanyAccessCaches = () => {
  moduleAccessCache.clear();
  moduleAccessPromiseMap.clear();
  moduleCompaniesCache = null;
  moduleCompaniesPromise = null;
  moduleRolesCache.clear();
  moduleRolesPromiseMap.clear();
};

/**
 * UserCompanyAccessModal
 * 
 * Comprehensive modal for managing Multi-Company User Access and Company-Wise Multi-Role Assignments.
 * - Displays all companies accessible by the user and all roles assigned to that user in each company.
 * - Allows assigning the user to additional companies under the same organization without duplicating records.
 * - Allows adding multiple roles to the same user in a company (e.g. Accountant + Auditor).
 * - Allows removing an individual role independently without affecting other roles or companies.
 * - Allows revoking company access completely while keeping other companies intact.
 */
export default function UserCompanyAccessModal({
  isOpen,
  onClose,
  user,
  memberId: initialMemberId,
  allCompanies,
  companies: legacyCompanies,
  onUpdated,
  onSuccess,
}) {
  const dispatch = useAppDispatch();

  const userId = user?.id || user?.userId || '';
  const memberId = initialMemberId || user?.memberId || '';
  const userIdentifier = String(userId || memberId || '');

  // Passed companies normalization (supports allCompanies or companies prop)
  const passedCompanies = allCompanies || legacyCompanies || EMPTY_ARRAY;

  const [isLoading, setIsLoading] = useState(() => {
    if (!isOpen) return false;
    if (Array.isArray(user?.companyAccess) && user.companyAccess.length > 0) return false;
    if (userIdentifier && moduleAccessCache.has(userIdentifier)) return false;
    return Boolean(userIdentifier);
  });
  const [accessError, setAccessError] = useState(null);
  const [accessList, setAccessList] = useState(() => {
    if (Array.isArray(user?.companyAccess) && user.companyAccess.length > 0) {
      return user.companyAccess;
    }
    if (userIdentifier && moduleAccessCache.has(userIdentifier)) {
      return moduleAccessCache.get(userIdentifier);
    }
    return EMPTY_ARRAY;
  });
  const [fetchedCompanies, setFetchedCompanies] = useState(() => {
    if (Array.isArray(passedCompanies) && passedCompanies.length > 0) return EMPTY_ARRAY;
    if (moduleCompaniesCache && moduleCompaniesCache.length > 0) return moduleCompaniesCache;
    return EMPTY_ARRAY;
  });
  const [companyRolesMap, setCompanyRolesMap] = useState({});

  // Target assignment to a new company
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [targetRoleIds, setTargetRoleIds] = useState(EMPTY_ARRAY);
  const [targetRoles, setTargetRoles] = useState(EMPTY_ARRAY);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [rolesLoadError, setRolesLoadError] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Inline role addition to an existing company
  const [addingRoleCompanyId, setAddingRoleCompanyId] = useState(null);
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState('');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isRemovingRole, setIsRemovingRole] = useState(false);

  // Decoupled refs to prevent re-render function churn
  const userRef = useRef(user);
  const passedCompaniesRef = useRef(passedCompanies);
  const initialMemberIdRef = useRef(initialMemberId);
  userRef.current = user;
  passedCompaniesRef.current = passedCompanies;
  initialMemberIdRef.current = initialMemberId;

  // Dedicated cache and in-flight tracking refs (retained for backward compatibility)
  const inFlightAccessRef = useRef(null);
  const inFlightCompaniesRef = useRef(false);
  const inFlightRolesRef = useRef({});
  const rolesCacheRef = useRef({});
  const companiesCacheRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const activeUserIdRef = useRef(null);
  const abortControllersRef = useRef({ access: null, companies: null, roles: {} });
  const activeAccessRequestIdRef = useRef(0);
  const sessionUserRef = useRef(null);

  // Resolve available companies: prioritize passedCompanies from parent, fallback to fetched
  const availableCompanies = useMemo(() => {
    const listToUse = Array.isArray(passedCompanies) && passedCompanies.length > 0
      ? passedCompanies
      : fetchedCompanies;
    return (Array.isArray(listToUse) ? listToUse : []).map(c => ({
      ...c,
      id: c.id || c.companyId,
      name: c.companyName || c.name || c.code || 'Unnamed Company',
    }));
  }, [passedCompanies, fetchedCompanies]);

  // Load user's company access list safely with module-level caching and single-flight deduplication
  const loadAccessData = useCallback(async (forceRefresh = false) => {
    const effectiveUserId = userRef.current?.userId || (userRef.current?.id !== userRef.current?.memberId ? userRef.current?.id : null);
    const effectiveMemberId = initialMemberIdRef.current || userRef.current?.memberId || userRef.current?.id;

    if (!effectiveUserId && !effectiveMemberId) {
      setIsLoading(false);
      return [];
    }

    const userKey = String(effectiveUserId || effectiveMemberId);

    // 1. Cache hit: immediately set state without firing any network call
    if (!forceRefresh && moduleAccessCache.has(userKey)) {
      const cached = moduleAccessCache.get(userKey);
      setAccessList(cached);
      setAccessError(null);
      setIsLoading(false);
      return cached;
    }

    // 2. Single-flight deduplication: reuse active in-flight request
    if (!forceRefresh && moduleAccessPromiseMap.has(userKey)) {
      setIsLoading(true);
      try {
        const data = await moduleAccessPromiseMap.get(userKey);
        setAccessList(data);
        setAccessError(null);
        return data;
      } catch (err) {
        const fallbackUser = userRef.current;
        if (fallbackUser?.companyAccess && Array.isArray(fallbackUser.companyAccess)) {
          setAccessList(fallbackUser.companyAccess);
          setAccessError(null);
          return fallbackUser.companyAccess;
        }
        setAccessError(err?.response?.data?.message || err?.message || 'Failed to load company access details');
        return [];
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    setAccessError(null);
    inFlightAccessRef.current = userKey;

    const promise = (async () => {
      try {
        let resData = [];
        if (effectiveUserId) {
          try {
            resData = await getUserCompanyAccess(effectiveUserId);
          } catch (err) {
            if (effectiveMemberId && effectiveMemberId !== effectiveUserId) {
              resData = await getMemberCompanyAccess(effectiveMemberId);
            } else {
              throw err;
            }
          }
        } else if (effectiveMemberId) {
          resData = await getMemberCompanyAccess(effectiveMemberId);
        }
        const validList = Array.isArray(resData) ? resData : (resData?.data || []);
        moduleAccessCache.set(userKey, validList);
        return validList;
      } finally {
        moduleAccessPromiseMap.delete(userKey);
        inFlightAccessRef.current = null;
      }
    })();

    moduleAccessPromiseMap.set(userKey, promise);

    try {
      const result = await promise;
      setAccessList(result);
      setAccessError(null);
      return result;
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
        return [];
      }
      console.warn('Failed to load user company access list:', err);
      // Fallback: parse companyAccess or authorizedCompanies from user object if available
      const fallbackUser = userRef.current;
      if (fallbackUser?.companyAccess && Array.isArray(fallbackUser.companyAccess)) {
        setAccessList(fallbackUser.companyAccess);
        setAccessError(null);
        return fallbackUser.companyAccess;
      } else if (fallbackUser?.authorizedCompanies && Array.isArray(fallbackUser.authorizedCompanies)) {
        const fallback = fallbackUser.authorizedCompanies.map((name, idx) => ({
          companyId: fallbackUser.authorizedCompanyIds?.[idx] || String(idx),
          companyName: name,
          active: true,
          roleName: fallbackUser.role || 'USER',
        }));
        setAccessList(fallback);
        setAccessError(null);
        return fallback;
      } else {
        setAccessError(err?.response?.data?.message || err?.message || 'Failed to load company access details');
        return [];
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load organization companies safely with module-level caching and single-flight deduplication
  const loadOrganizationCompanies = useCallback(async (forceRefresh = false) => {
    const currentPassed = passedCompaniesRef.current;
    if (Array.isArray(currentPassed) && currentPassed.length > 0) {
      return currentPassed;
    }

    // 1. Module cache hit: return cached companies with 0 network calls
    if (!forceRefresh && moduleCompaniesCache && moduleCompaniesCache.length > 0) {
      setFetchedCompanies(moduleCompaniesCache);
      companiesCacheRef.current = moduleCompaniesCache;
      return moduleCompaniesCache;
    }

    // 2. Single-flight deduplication: return existing in-flight request
    if (!forceRefresh && moduleCompaniesPromise) {
      try {
        const comps = await moduleCompaniesPromise;
        setFetchedCompanies(comps);
        return comps;
      } catch (err) {
        return [];
      }
    }

    inFlightCompaniesRef.current = true;

    const promise = (async () => {
      try {
        const res = await getCompanies({ page: 0, pageSize: 200 });
        const comps = Array.isArray(res)
          ? res
          : (res?.companies || res?.content || res?.data?.content || res?.data || []);
        const mapped = (Array.isArray(comps) ? comps : []).map(c => ({
          ...c,
          id: c.id || c.companyId,
          name: c.companyName || c.name || c.code || 'Unnamed Company',
        }));
        moduleCompaniesCache = mapped;
        companiesCacheRef.current = mapped;
        return mapped;
      } finally {
        moduleCompaniesPromise = null;
        inFlightCompaniesRef.current = false;
      }
    })();

    moduleCompaniesPromise = promise;

    try {
      const result = await promise;
      setFetchedCompanies(result);
      return result;
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
        return [];
      }
      console.error('Failed to load companies:', err);
      return [];
    }
  }, []);

  // Fetch roles for a specific company on demand and cache them permanently per company
  const fetchRolesForCompany = useCallback(async (compId, forceRefresh = false) => {
    if (!compId) return [];

    // 1. Cache hit
    if (!forceRefresh && moduleRolesCache.has(compId)) {
      const cached = moduleRolesCache.get(compId);
      rolesCacheRef.current[compId] = cached;
      setCompanyRolesMap(prev => ({ ...prev, [compId]: cached }));
      return cached;
    }

    // 2. Single-flight promise
    if (!forceRefresh && moduleRolesPromiseMap.has(compId)) {
      try {
        const roles = await moduleRolesPromiseMap.get(compId);
        setCompanyRolesMap(prev => ({ ...prev, [compId]: roles }));
        return roles;
      } catch (err) {
        throw err;
      }
    }

    const promise = (async () => {
      try {
        const res = await getRoles({ companyId: compId, page: 0, pageSize: 200 });
        const roles = Array.isArray(res)
          ? res
          : (res?.roles || res?.content || res?.data?.roles || res?.data?.content || res?.data || []);
        const validRoles = (Array.isArray(roles) ? roles : []).map(r => ({
          ...r,
          id: r.id || r.roleId,
          name: r.name || r.roleName || r.code || 'Role',
        }));
        moduleRolesCache.set(compId, validRoles);
        rolesCacheRef.current[compId] = validRoles;
        return validRoles;
      } finally {
        moduleRolesPromiseMap.delete(compId);
      }
    })();

    moduleRolesPromiseMap.set(compId, promise);

    try {
      const result = await promise;
      setCompanyRolesMap(prev => ({ ...prev, [compId]: result }));
      return result;
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
        return rolesCacheRef.current[compId] || [];
      }
      console.warn(`Failed to fetch roles for company ${compId}:`, err);
      throw err;
    }
  }, []);

  // Main lifecycle effect: triggers exactly ONCE per open modal session
  useEffect(() => {
    if (!isOpen) {
      sessionUserRef.current = null;
      hasInitializedRef.current = false;
      activeUserIdRef.current = null;
      setIsLoading(false);
      return;
    }

    if (!userIdentifier) return;

    // Guard: Prevent re-running when modal is already open for this user
    if (sessionUserRef.current === userIdentifier) {
      return;
    }

    sessionUserRef.current = userIdentifier;
    hasInitializedRef.current = true;
    activeUserIdRef.current = userIdentifier;

    setTargetCompanyId('');
    setTargetRoleIds(EMPTY_ARRAY);
    setTargetRoles(EMPTY_ARRAY);
    setRolesLoadError(null);
    setAddingRoleCompanyId(null);
    setSelectedRoleToAdd('');
    setAccessError(null);

    loadAccessData(false);
    loadOrganizationCompanies(false);

    // CRITICAL: Do NOT wipe caches, abort requests, or reset sessionUserRef in cleanup on ordinary re-renders.
    // Resetting happens strictly when isOpen transitions to false above.
  }, [isOpen, userIdentifier, loadAccessData, loadOrganizationCompanies]);

  // When targetCompanyId changes in "Assign to Company" form, load that company's roles
  useEffect(() => {
    if (!isOpen || !targetCompanyId) {
      setTargetRoles([]);
      setTargetRoleIds([]);
      setIsRolesLoading(false);
      setRolesLoadError(null);
      return;
    }

    let isMounted = true;
    setRolesLoadError(null);

    if (moduleRolesCache.has(targetCompanyId) || rolesCacheRef.current[targetCompanyId]) {
      const cached = moduleRolesCache.get(targetCompanyId) || rolesCacheRef.current[targetCompanyId];
      setTargetRoles(cached);
      setTargetRoleIds(cached.length > 0 ? [cached[0].id] : []);
      setIsRolesLoading(false);
      return;
    }

    setIsRolesLoading(true);
    fetchRolesForCompany(targetCompanyId).then(roles => {
      if (isMounted) {
        setTargetRoles(roles);
        setIsRolesLoading(false);
        setRolesLoadError(null);
        if (roles.length > 0) {
          setTargetRoleIds([roles[0].id]);
        } else {
          setTargetRoleIds([]);
        }
      }
    }).catch((err) => {
      if (isMounted) {
        setTargetRoles([]);
        setTargetRoleIds([]);
        setIsRolesLoading(false);
        setRolesLoadError(err?.response?.data?.message || err?.message || 'Failed to load roles for selected company');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetCompanyId, fetchRolesForCompany]);

  // Toggle role selection for target company assignment
  const handleToggleTargetRole = (roleId) => {
    setTargetRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

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
      await grantMemberCompanyAccess(targetId, targetCompanyId, targetRoleIds, isUserId);
      dispatch(addAlert({
        type: 'success',
        message: `Successfully granted company access and assigned roles!`,
      }));

      setTargetCompanyId('');
      setTargetRoleIds([]);
      setTargetRoles([]);
      moduleAccessCache.delete(String(targetId));
      await loadAccessData(true);
      (onUpdated || onSuccess)?.();
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

  // Open inline add role for an existing company
  const handleOpenAddRole = async (compId) => {
    setAddingRoleCompanyId(compId);
    setSelectedRoleToAdd('');
    const roles = await fetchRolesForCompany(compId);
    // Find unassigned roles
    const currentAccess = accessList.find(a => a.companyId === compId);
    const assignedIds = new Set(
      Array.isArray(currentAccess?.roleIds) ? currentAccess.roleIds : (currentAccess?.roleId ? [currentAccess.roleId] : [])
    );
    const unassigned = roles.filter(r => !assignedIds.has(r.id));
    if (unassigned.length > 0) {
      setSelectedRoleToAdd(unassigned[0].id);
    }
  };

  // Submit adding role to existing company
  const handleAddRoleToCompany = async (compId) => {
    if (!selectedRoleToAdd) {
      dispatch(addAlert({ type: 'warning', message: 'Please select a role to add' }));
      return;
    }

    const effectiveMemberId = memberId || user?.memberId;
    const effectiveUserId = userId || user?.id || user?.userId;
    const targetId = effectiveMemberId || effectiveUserId;
    const isUserId = !effectiveMemberId;

    setIsAddingRole(true);
    try {
      await addMemberCompanyRole(targetId, compId, selectedRoleToAdd, isUserId);
      dispatch(addAlert({
        type: 'success',
        message: 'Role added successfully to this company!',
      }));
      setAddingRoleCompanyId(null);
      setSelectedRoleToAdd('');
      moduleAccessCache.delete(String(targetId));
      await loadAccessData(true);
      (onUpdated || onSuccess)?.();
    } catch (err) {
      console.error('Failed to add company role:', err);
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to add role',
      }));
    } finally {
      setIsAddingRole(false);
    }
  };

  // Submit removing role from existing company
  const handleRemoveRoleFromCompany = (compId, roleId, roleName, compName) => {
    confirmDialog(
      'Remove Role Assignment',
      `Are you sure you want to remove the role "${roleName}" from "${compName}" for this user? Access to other roles and other companies will remain unaffected.`,
      async () => {
        const effectiveMemberId = memberId || user?.memberId;
        const effectiveUserId = userId || user?.id || user?.userId;
        const targetId = effectiveMemberId || effectiveUserId;
        const isUserId = !effectiveMemberId;

        setIsRemovingRole(true);
        try {
          await removeMemberCompanyRole(targetId, compId, roleId, isUserId);
          dispatch(addAlert({
            type: 'success',
            message: `Role "${roleName}" removed successfully from "${compName}".`,
          }));
          moduleAccessCache.delete(String(targetId));
          await loadAccessData(true);
          (onUpdated || onSuccess)?.();
        } catch (err) {
          console.error('Failed to remove company role:', err);
          dispatch(addAlert({
            type: 'error',
            message: err?.response?.data?.message || err?.message || 'Failed to remove role',
          }));
        } finally {
          setIsRemovingRole(false);
        }
      }
    );
  };

  // Handle removing company access completely
  const handleRevokeCompany = (compId, compName) => {
    const activeCount = accessList.filter(a => a.active).length;
    if (activeCount <= 1) {
      dispatch(addAlert({
        type: 'warning',
        message: 'Cannot revoke the user\'s only remaining active company access. Deactivate the member to disable their entire account.',
      }));
      return;
    }

    confirmDialog(
      'Revoke Company Access',
      `Are you sure you want to remove ${user?.fullName || user?.name || 'this user'}'s access from "${compName}"? Other companies and the main user account will remain untouched.`,
      async () => {
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
          moduleAccessCache.delete(String(targetId));
          await loadAccessData(true);
          (onUpdated || onSuccess)?.();
        } catch (err) {
          console.error('Failed to revoke company access:', err);
          dispatch(addAlert({
            type: 'error',
            message: err?.response?.data?.message || err?.message || 'Failed to revoke company access',
          }));
        }
      }
    );
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
                Multi-Company Role Assignment
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

        {/* Section 1: Active Company Access & Roles List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-[#A0A6B5] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              Assigned Companies & Roles ({activeAccessList.length})
            </h4>
            <span className="text-[11px] font-medium text-zinc-400">
              Multiple roles per company supported
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-6 text-zinc-400 text-sm gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading company access details...
            </div>
          ) : accessError ? (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex items-center justify-between text-xs text-red-600 dark:text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{accessError}</span>
              </div>
              <button
                type="button"
                onClick={() => loadAccessData(true)}
                className="font-medium underline hover:text-red-700 dark:hover:text-red-300 ml-2"
              >
                Retry
              </button>
            </div>
          ) : activeAccessList.length === 0 ? (
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] text-center text-xs text-zinc-500">
              No active company access found for this user.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden bg-white dark:bg-[#161922]">
              {activeAccessList.map((access) => {
                const compId = access.companyId;
                const isAddingThisRole = addingRoleCompanyId === compId;
                const currentRolesList = companyRolesMap[compId] || [];

                // Resolve multi-roles
                const rawNames = Array.isArray(access.roleNames) && access.roleNames.length > 0
                  ? access.roleNames
                  : (access.roleName ? access.roleName.split(',').map(s => s.trim()) : []);
                const rawIds = Array.isArray(access.roleIds) && access.roleIds.length > 0
                  ? access.roleIds
                  : (access.roleId ? [access.roleId] : []);

                const rolePairs = rawNames.map((name, idx) => ({
                  id: rawIds[idx] || null,
                  name,
                }));

                const assignedRoleIds = new Set(rawIds.map(String));
                const unassignedRoles = currentRolesList.filter(r => !assignedRoleIds.has(String(r.id)));

                return (
                  <div key={compId} className="p-3.5 space-y-2 hover:bg-zinc-50/60 dark:hover:bg-[#1D212C]/60 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-[#E6E8EE]">
                          {access.companyName || 'Company'}
                        </span>
                        {access.companyCode && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]">
                            {access.companyCode}
                          </span>
                        )}
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          Active
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRevokeCompany(compId, access.companyName)}
                          disabled={activeAccessList.length <= 1}
                          title={activeAccessList.length <= 1 ? "Cannot revoke the user's only company access" : "Revoke Company Access"}
                          className={`p-1 text-xs font-semibold rounded-lg border transition-colors ${activeAccessList.length <= 1
                            ? 'text-zinc-300 dark:text-zinc-700 border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                            : 'text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Role Badges with inline Revoke and "+ Add Role" */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {rolePairs.length > 0 ? (
                        rolePairs.map((r, rIdx) => (
                          <span
                            key={r.id || rIdx}
                            className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300 text-[11px] px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs"
                          >
                            <span>{r.name}</span>
                            {r.id && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRoleFromCompany(compId, r.id, r.name, access.companyName)}
                                disabled={isRemovingRole}
                                title={`Remove role ${r.name}`}
                                className="text-indigo-400 hover:text-rose-600 transition-colors p-0.5 rounded hover:bg-rose-50"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-400 italic">No roles assigned</span>
                      )}

                      {!isAddingThisRole && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddRole(compId)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/60 px-2 py-0.5 rounded border border-dashed border-emerald-300 dark:border-emerald-800 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Role</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Add Role Form */}
                    {isAddingThisRole && (
                      <div className="flex items-center gap-2 pt-2">
                        <CustomSelect
                          value={selectedRoleToAdd}
                          onChange={(e) => setSelectedRoleToAdd(e.target.value)}
                          className="text-xs py-1 px-2 rounded-lg border border-zinc-300 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE]"
                        >
                          <option value="">-- Choose Role to Add --</option>
                          {unassignedRoles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name || r.roleName}
                            </option>
                          ))}
                        </CustomSelect>
                        <button
                          type="button"
                          onClick={() => handleAddRoleToCompany(compId)}
                          disabled={isAddingRole || !selectedRoleToAdd}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                        >
                          {isAddingRole ? 'Adding...' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingRoleCompanyId(null);
                            setSelectedRoleToAdd('');
                          }}
                          className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Assign to Additional Company with Multi-Role */}
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

                {/* Roles Checkboxes / Multi-select */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600 dark:text-[#A0A6B5] block">
                    Roles in Target Company *
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
                  ) : rolesLoadError ? (
                    <div className="text-xs text-red-600 dark:text-red-400 p-2.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                        <span className="truncate">{rolesLoadError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (targetCompanyId) {
                            setIsRolesLoading(true);
                            setRolesLoadError(null);
                            fetchRolesForCompany(targetCompanyId, true)
                              .then(roles => {
                                setTargetRoles(roles);
                                setIsRolesLoading(false);
                                if (roles.length > 0) setTargetRoleIds([roles[0].id]);
                              })
                              .catch(err => {
                                setIsRolesLoading(false);
                                setRolesLoadError(err?.response?.data?.message || err?.message || 'Failed to load roles');
                              });
                          }
                        }}
                        className="text-xs underline font-semibold shrink-0 hover:text-red-700"
                      >
                        Retry
                      </button>
                    </div>
                  ) : targetRoles.length === 0 ? (
                    <div className="text-xs text-amber-600 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
                      No roles defined in this company
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] max-h-36 overflow-y-auto">
                      {targetRoles.map((r) => {
                        const isSelected = targetRoleIds.includes(r.id);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => handleToggleTargetRole(r.id)}
                            className={`text-xs px-2.5 py-1 rounded-md font-medium border flex items-center gap-1.5 transition-colors ${isSelected
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-[#161922] dark:border-[#2A2F3D] dark:text-[#A0A6B5]'
                              }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${isSelected ? 'bg-indigo-600 text-white' : 'border border-zinc-300 dark:border-zinc-600'
                              }`}>
                              {isSelected ? <Check className="w-2.5 h-2.5" /> : null}
                            </span>
                            <span>{r.name || r.roleName}</span>
                          </button>
                        );
                      })}
                    </div>
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
                  disabled={isAssigning || !targetCompanyId || targetRoleIds.length === 0}
                  className="btn-primary flex items-center gap-1.5 text-xs py-2 px-4 shadow-xs"
                >
                  {isAssigning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Assign to Company & Set Roles</span>
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
