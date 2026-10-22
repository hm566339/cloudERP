import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Building2, Calendar, Edit2, 
  Trash2, Plus, Shield, CheckCircle2, UserCog, User, X, Layers,
  Key, Lock, ChevronRight, XCircle, ShieldCheck, ShieldAlert, Info,
  RefreshCw, Loader2, Hash, Clock, AlertCircle, ExternalLink, Check
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

import { 
  getUserById,
  updateUser,
  updateUserStatus,
  verifyUserEmail,
  assignRole,
  removeRole,
  grantPortalAccess,
  removePortalAccess,
  togglePortalAccess,
  resendSetupEmail
} from '../../../api/sso/user';
import { getRoles } from '../../../api/sso/role';
import { getCompanyModulesByCompany } from '../../../api/sso/companyModules';
import { getCompanySessions } from '../../../api/sso/session';
import { getUserEffectivePermissions } from '../../../api/sso/permission';
import { getUserActiveFeatures } from '../../../api/sso/feature';
import { useRBAC } from '../../../utils/rbac';
import { confirmDialog } from '../../../utils/confirmDialog';

import EntityHeader from '../../../components/common/EntityHeader';
import InfoCard, { InfoField } from '../../../components/common/InfoCard';
import EmptyState from '../../../components/common/EmptyState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import UserAssignRoleModal from '../components/UserAssignRoleModal';
import UserModuleAccessModal from '../components/UserModuleAccessModal';

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { canEdit } = useRBAC();
  
  const companyId = JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [availableRoles, setAvailableRoles] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [isCompanyModulesLoading, setIsCompanyModulesLoading] = useState(false);
  const [companyModulesError, setCompanyModulesError] = useState(null);

  // Effective permissions state (GET /api/sso/permissions/user/{userId}/effective)
  const [effectiveData, setEffectiveData] = useState(null);
  const [isEffectiveLoading, setIsEffectiveLoading] = useState(false);
  const [effectiveError, setEffectiveError] = useState(null);

  // Fetch user details
  const fetchUser = useCallback(async () => {
    try {
      const data = await getUserById(id);
      setUser(data);
    } catch (err) {
      setIsError(true);
      console.error('Failed to fetch user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch effective permissions & features (GET /api/sso/permissions/user/{userId}/effective + GET /api/sso/features/user/{userId}/active)
  const fetchEffectivePermissions = useCallback(async () => {
    if (!id) return;
    setIsEffectiveLoading(true);
    setEffectiveError(null);
    try {
      const [effRes, activeFeaturesRes] = await Promise.allSettled([
        getUserEffectivePermissions(id),
        getUserActiveFeatures(id),
      ]);

      const effData = effRes.status === 'fulfilled' ? effRes.value : null;
      const activeFeats = activeFeaturesRes.status === 'fulfilled' ? activeFeaturesRes.value : null;

      let combinedFeatures = Array.isArray(effData?.features) ? [...effData.features] : [];

      // Enrich with active features if any missing
      const activeCodes = activeFeats?.activeFeatures || (Array.isArray(activeFeats) ? activeFeats : []);
      if (Array.isArray(activeCodes) && activeCodes.length > 0) {
        const existingCodes = new Set(combinedFeatures.map(f => f.featureCode || f.code));
        activeCodes.forEach(code => {
          const codeStr = typeof code === 'string' ? code : (code?.code || code?.featureCode);
          if (codeStr && !existingCodes.has(codeStr)) {
            combinedFeatures.push({
              featureCode: codeStr,
              featureName: codeStr,
              moduleName: 'SYSTEM',
              source: 'USER',
            });
            existingCodes.add(codeStr);
          }
        });
      }

      setEffectiveData({
        features: combinedFeatures,
        permissions: Array.isArray(effData?.permissions) ? effData.permissions : [],
      });
    } catch (err) {
      console.error("Error fetching effective permissions:", err);
      setEffectiveError(err?.message || "Failed to load effective permissions");
    } finally {
      setIsEffectiveLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
    fetchEffectivePermissions();
  }, [fetchUser, fetchEffectivePermissions]);

  const targetCompanyId = user?.companyId || companyId;

  const fetchDependencies = useCallback(async () => {
    if (companyId) {
      try {
        const roles = await getRoles({ companyId });
        setAvailableRoles(roles.roles || (Array.isArray(roles) ? roles : []));
      } catch (e) {
        console.error('Failed to load roles:', e);
      }
      try {
        const sessions = await getCompanySessions(companyId, { page: 1, pageSize: 100 });
        setAllSessions(sessions.sessions || sessions.content || sessions || []);
      } catch (e) {
        console.error('Failed to load sessions:', e);
      }
    }
  }, [companyId]);

  const fetchCompanyModules = useCallback(async () => {
    if (!targetCompanyId) return;
    setIsCompanyModulesLoading(true);
    setCompanyModulesError(null);
    try {
      const res = await getCompanyModulesByCompany(targetCompanyId, { active: true });
      const rawList = res?.data || res?.companyModuleResponse || res?.content || (Array.isArray(res) ? res : []);
      setAvailableModules(Array.isArray(rawList) ? rawList : []);
    } catch (err) {
      setCompanyModulesError(err);
    } finally {
      setIsCompanyModulesLoading(false);
    }
  }, [targetCompanyId]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchCompanyModules();
  }, [fetchCompanyModules]);

  // Filter sessions for this user
  const activeSessions = allSessions.filter(s => 
    s.user?.id === id || s.username === user?.username || s.userId === id
  );

  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
  const [isAssignPortalModalOpen, setIsAssignPortalModalOpen] = useState(false);

  // Edit user state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    empId: '',
    email: '',
    accountStatus: '',
    emailStatus: ''
  });

  const getModuleValues = (item = {}) => ({
    ids: [
      item.id,
      item.moduleId,
      item.companyModuleId,
      item.module?.id,
      item.companyModule?.id,
      item.globalId,
    ].filter(Boolean).map(String),
    names: [
      item.moduleName,
      item.name,
      item.label,
      item.module?.name,
      item.module?.moduleName,
      item.companyModule?.name,
      item.companyModule?.moduleName,
    ].filter(Boolean).map((value) => String(value).toLowerCase()),
    hosts: [
      item.host,
      item.hostUrl,
      item.module?.host,
      item.companyModule?.host,
    ].filter(Boolean).map(String),
  });

  const getPortalActionModuleId = (portalAccess = {}) => {
    const portalValues = getModuleValues(portalAccess);
    const matchedModule = availableModules.find((mod) => {
      const moduleValues = getModuleValues(mod);
      return (
        portalValues.ids.some((id) => moduleValues.ids.includes(id)) ||
        portalValues.names.some((name) => moduleValues.names.includes(name)) ||
        portalValues.hosts.some((host) => moduleValues.hosts.includes(host))
      );
    });

    return (
      matchedModule?.id ||
      matchedModule?.companyModuleId ||
      matchedModule?.moduleId ||
      matchedModule?.module?.id ||
      portalAccess.moduleId ||
      portalAccess.companyModuleId ||
      portalAccess.module?.id ||
      portalAccess.companyModule?.id ||
      portalAccess.id
    );
  };

  const handleEditToggle = () => {
    if (!isEditingInfo) {
      setEditForm({
        fullName: user?.fullName || '',
        username: user?.username || '',
        empId: user?.empId || '',
        email: user?.email || '',
        accountStatus: user?.accountStatus || 'ACTIVE',
        emailStatus: user?.emailStatus || 'VERIFIED'
      });
    }
    setIsEditingInfo(!isEditingInfo);
  };

  const handleSaveInfo = async () => {
    try {
      const nameRegex = /^[a-zA-Z\s'-]+$/;
      if (editForm.fullName && !nameRegex.test(editForm.fullName.trim())) {
        dispatch(addAlert({ type: 'warning', message: 'Full Name should only contain letters, spaces, hyphens, and apostrophes' }));
        return;
      }
      if (
        editForm.fullName !== user.fullName || 
        editForm.username !== user.username || 
        editForm.empId !== user.empId || 
        editForm.email !== user.email
      ) {
        await updateUser(user.id, {
          empId: editForm.empId,
          username: editForm.username,
          email: editForm.email,
          fullName: editForm.fullName
        });
      }
      if (editForm.accountStatus !== user.accountStatus) {
        await updateUserStatus(user.id, editForm.accountStatus);
      }
      if (editForm.emailStatus !== user.emailStatus) {
        await verifyUserEmail(user.id, editForm.emailStatus);
      }
      dispatch(addAlert({ type: 'success', message: 'User information updated successfully' }));
      setIsEditingInfo(false);
      fetchUser();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to update user' }));
    }
  };

  const handleRemoveRole = async (roleId, roleName) => {
    const confirmed = await confirmDialog({
      title: 'Remove Role',
      message: `Are you sure you want to remove the role "${roleName || 'selected'}" from this user?`,
    });
    if (!confirmed) return;

    try {
      await removeRole(user.id, roleId);
      dispatch(addAlert({ type: 'success', message: 'Role removed successfully' }));
      fetchUser();
      fetchEffectivePermissions();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to remove role' }));
    }
  };

  const handleRemovePortalAccess = async (pa) => {
    const moduleId = getPortalActionModuleId(pa);
    const confirmed = await confirmDialog({
      title: 'Revoke Portal Access',
      message: `Are you sure you want to revoke portal access to "${pa.moduleName || 'this module'}"?`,
    });
    if (!confirmed) return;

    try {
      await removePortalAccess(user.id, moduleId);
      dispatch(addAlert({ type: 'success', message: 'Portal access revoked' }));
      fetchUser();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to revoke portal access' }));
    }
  };

  const handleTogglePortalAccess = async (pa) => {
    const moduleId = getPortalActionModuleId(pa);
    try {
      await togglePortalAccess(user.id, moduleId);
      dispatch(addAlert({ type: 'success', message: 'Portal access status updated' }));
      fetchUser();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to update access status' }));
    }
  };

  const handleResendSetupEmail = async () => {
    try {
      const res = await resendSetupEmail(user.id);
      dispatch(addAlert({
        type: 'success',
        message: res?.message || `Password setup email sent to ${user.email}`
      }));
    } catch (err) {
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to resend setup email'
      }));
    }
  };

  const handleToggleAccountStatus = async () => {
    const newStatus = user.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmed = await confirmDialog({
      title: `${newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} User`,
      message: `Are you sure you want to set this user account status to ${newStatus}?`,
    });
    if (!confirmed) return;

    try {
      await updateUserStatus(user.id, newStatus);
      dispatch(addAlert({ type: 'success', message: `User account ${newStatus.toLowerCase()} successfully` }));
      fetchUser();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to update user status' }));
    }
  };

  /* ── Loading state ── */
  if (isLoading) return <PageLoader message="Loading user details…" />;

  /* ── Error / not-found state ── */
  if (isError || !user) {
    return (
      <div className="p-8 mt-12 max-w-lg mx-auto bg-white dark:bg-[#161922] rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-sm text-center animate-fade-in">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] mb-2">User Not Found</h2>
        <p className="text-sm text-zinc-500 dark:text-[#A0A6B5] mb-6">We couldn't find the requested user record.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-zinc-900 dark:bg-primary hover:bg-zinc-800 dark:hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  /* ── Header configuration ── */
  const headerMetadata = [
    { icon: Hash, label: user.username || 'N/A' },
    { icon: User, label: user.empId ? `EMP: ${user.empId}` : 'No Employee ID' },
    { icon: Mail, label: user.email || 'No Email' },
    {
      icon: Clock,
      label: `Updated ${user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}`,
    },
  ];

  const headerActions = [
    ...(canEdit() ? [
      {
        label: isEditingInfo ? 'Cancel Edit' : 'Edit Profile',
        icon: Edit2,
        variant: isEditingInfo ? 'danger' : 'secondary',
        onClick: handleEditToggle,
      },
    ] : []),
    {
      label: 'More Actions',
      type: 'dropdown',
      variant: 'primary',
      items: [
        ...(canEdit() ? [
          {
            label: 'Assign Role',
            icon: Plus,
            onClick: () => setIsAssignRoleModalOpen(true),
          },
          {
            label: 'Assign Portal',
            icon: Layers,
            onClick: () => setIsAssignPortalModalOpen(true),
          },
          { type: 'divider' },
        ] : []),
        {
          label: 'Refresh Permissions',
          icon: RefreshCw,
          onClick: () => {
            fetchUser();
            fetchEffectivePermissions();
          },
        },
        ...(canEdit() ? [
          { type: 'divider' },
          ...(user.emailStatus !== 'VERIFIED' ? [
            {
              label: 'Resend Setup Email',
              icon: Mail,
              onClick: handleResendSetupEmail,
            },
          ] : []),
          {
            label: user.accountStatus === 'ACTIVE' ? 'Deactivate User' : 'Activate User',
            icon: user.accountStatus === 'ACTIVE' ? XCircle : CheckCircle2,
            onClick: handleToggleAccountStatus,
          },
        ] : []),
      ],
    },
  ];

  const initialPermissions = user.portalAccess || [];

  // Effective data calculations
  const effectiveFeatures = effectiveData?.features?.length 
    ? effectiveData.features 
    : (user.features?.length ? user.features : []);
    
  const effectivePermissions = effectiveData?.permissions?.length 
    ? effectiveData.permissions 
    : (user.permissions?.length ? user.permissions : []);

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">
      {/* ── EntityHeader (sticky, matching CustomerDetails) ── */}
      <EntityHeader
        onBack={() => navigate(-1)}
        title={user.fullName || user.username}
        badge={{
          isActive: user.accountStatus === 'ACTIVE',
          label: user.accountStatus || 'ACTIVE',
        }}
        metadata={headerMetadata}
        actions={headerActions}
        sticky
      />

      {/* ── Page Body ── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ══════════════════════════════════════════════════════════
             LEFT SIDEBAR (30%) — Information Card
          ══════════════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[30%] space-y-5">
            <InfoCard
              title="User Information"
              icon={User}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              action={
                canEdit() && (
                  <button
                    onClick={handleEditToggle}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                    title={isEditingInfo ? 'Cancel' : 'Edit Information'}
                  >
                    {isEditingInfo ? <X size={15} /> : <Edit2 size={15} />}
                  </button>
                )
              }
            >
              {isEditingInfo ? (
                /* Edit Mode */
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] mb-1 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] mb-1 block">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full text-xs font-mono px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="e.g. jdoe"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] mb-1 block">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={editForm.empId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, empId: e.target.value }))}
                      className="w-full text-xs font-mono px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="e.g. EMP001"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] mb-1 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="e.g. user@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] mb-1 block">
                      Account Status
                    </label>
                    <select
                      value={editForm.accountStatus}
                      onChange={(e) => setEditForm(prev => ({ ...prev, accountStatus: e.target.value }))}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-primary bg-white dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE]"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] mb-1 block">
                      Email Status
                    </label>
                    <select
                      value={editForm.emailStatus}
                      onChange={(e) => setEditForm(prev => ({ ...prev, emailStatus: e.target.value }))}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-primary bg-white dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE]"
                    >
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="UNVERIFIED">UNVERIFIED</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={handleSaveInfo}
                      className="flex-1 py-2 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="px-3 py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-4">
                  <InfoField label="Full Name" value={user.fullName || '-'} />
                  <InfoField label="Username" value={user.username || '-'} mono />
                  <InfoField label="Employee ID" value={user.empId || '-'} mono highlight />
                  <InfoField label="Email Address" value={user.email || '-'} />
                  
                  <div>
                    <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] mb-1">
                      Email Status
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      user.emailStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {user.emailStatus || 'UNVERIFIED'}
                    </span>
                  </div>

                  <div>
                    <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] mb-1">
                      Account Status
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      user.accountStatus === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {user.accountStatus || 'ACTIVE'}
                    </span>
                  </div>

                  {user.notes && (
                    <div className="pt-2 border-t border-zinc-100">
                      <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] mb-1.5">
                        Onboarding Notes
                      </p>
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                        {user.notes}
                      </div>
                    </div>
                  )}

                  {user.emailStatus !== 'VERIFIED' && (
                    <div className="pt-1">
                      <button
                        onClick={handleResendSetupEmail}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
                      >
                        <Mail size={13} />
                        <span>Resend Setup Email</span>
                      </button>
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-100 space-y-3">
                    <InfoField 
                      label="Created At" 
                      value={user.createdAt ? new Date(user.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'} 
                    />
                    <InfoField 
                      label="Last Updated" 
                      value={user.updatedAt ? new Date(user.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'} 
                    />
                  </div>
                </div>
              )}
            </InfoCard>
          </div>

          {/* ══════════════════════════════════════════════════════════
             RIGHT CONTENT (70%) — Roles, Portals, Sessions, Permissions
          ══════════════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[70%] space-y-6">

            {/* 1. System Roles */}
            <InfoCard
              title="System Roles"
              icon={Shield}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              action={
                canEdit() && (
                  <button
                    onClick={() => setIsAssignRoleModalOpen(true)}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg font-semibold"
                  >
                    <Plus size={14} /> Assign Role
                  </button>
                )
              }
            >
              {(!user.role || (Array.isArray(user.role) && user.role.length === 0)) ? (
                <EmptyState
                  title="No roles assigned"
                  description="Assign a system role to give this user predefined access and permissions."
                  icon={Shield}
                />
              ) : (
                <div className="flex flex-wrap gap-3">
                  {(Array.isArray(user.role) ? user.role : [user.role]).map((r, idx) => {
                    const roleName = typeof r === 'object' ? (r.name || r.roleName) : r;
                    const roleObj = typeof r === 'object' ? r : availableRoles.find(ar => ar.name === r);
                    const status = roleObj?.status || 'ACTIVE';
                    
                    return (
                      <div 
                        key={idx} 
                        className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl p-3.5 flex items-center justify-between gap-4 min-w-[200px] shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wide truncate">
                              {roleName}
                            </span>
                            <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider border ${
                              status === 'ACTIVE' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {status}
                            </span>
                          </div>
                          <p className="text-[9.5px] text-zinc-400">
                            Created: {roleObj?.createdAt ? new Date(roleObj.createdAt).toLocaleDateString() : '-'}
                          </p>
                        </div>
                        {canEdit() && (
                          <button 
                            onClick={() => roleObj?.id && handleRemoveRole(roleObj.id, roleName)}
                            className="text-zinc-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                            title="Remove Role"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </InfoCard>

            {/* 2. Portal Access */}
            <InfoCard
              title="Portal Access"
              icon={Layers}
              iconBg="bg-violet-50"
              iconColor="text-violet-600"
              action={
                canEdit() && (
                  <button
                    onClick={() => setIsAssignPortalModalOpen(true)}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg font-semibold"
                  >
                    <Plus size={14} /> Assign Portal
                  </button>
                )
              }
              noPadding
            >
              {(!user.portalAccess || user.portalAccess.length === 0) ? (
                <EmptyState
                  title="No portal access"
                  description="This user has not been granted access to any company modules or portals yet."
                  icon={Layers}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/80">
                        <th className="w-12 text-center py-2.5 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">S.No.</th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Module Name</th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Username</th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Host URL</th>
                        <th className="text-center py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                        <th className="text-right py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Created At</th>
                        {canEdit() && <th className="text-right py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {user.portalAccess.map((pa, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="text-center font-medium text-zinc-500 py-3 px-3">{idx + 1}</td>
                          <td className="font-semibold text-zinc-900 py-3 px-4">{pa.moduleName || pa.moduleId || '-'}</td>
                          <td className="font-mono text-zinc-600 py-3 px-4">{pa.username || user.username}</td>
                          <td className="text-zinc-500 py-3 px-4 truncate max-w-[200px]" title={pa.host || pa.hostUrl || '-'}>
                            {pa.host || pa.hostUrl || '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              pa.status === true || pa.status === 'ACTIVE' || pa.status === undefined 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {pa.status === true || pa.status === 'ACTIVE' || pa.status === undefined ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="text-right text-zinc-500 py-3 px-4">
                            {pa.createdAt ? new Date(pa.createdAt).toLocaleDateString() : '-'}
                          </td>
                          {canEdit() && (
                            <td className="text-right py-3 px-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleTogglePortalAccess(pa)}
                                  className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Toggle Status"
                                >
                                  <CheckCircle2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleRemovePortalAccess(pa)}
                                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Revoke Access"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </InfoCard>

            {/* 3. Active Sessions */}
            <InfoCard
              title="Active Sessions"
              icon={UserCog}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              noPadding
            >
              {activeSessions.length === 0 ? (
                <EmptyState
                  title="No active sessions"
                  description="This user currently has no active login sessions across any modules."
                  icon={Clock}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/80 dark:bg-[#1D212C]">
                        <th className="w-12 text-center py-2.5 px-3 text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">S.No.</th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">Module Name</th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">IP Address</th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">User Agent</th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">Login Time</th>
                        <th className="text-right py-2.5 px-4 text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">Token Valid Till</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                      {activeSessions.map((session, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-[#1D212C]/60 transition-colors">
                          <td className="text-center font-medium text-zinc-500 dark:text-[#A0A6B5] py-3 px-3">{idx + 1}</td>
                          <td className="font-semibold text-zinc-900 dark:text-[#E6E8EE] py-3 px-4">{session.moduleName || '-'}</td>
                          <td className="font-mono text-zinc-600 dark:text-[#A0A6B5] py-3 px-4">{session.ipAddress || '-'}</td>
                          <td className="text-zinc-500 dark:text-[#A0A6B5] py-3 px-4 truncate max-w-[200px]" title={session.userAgent || '-'}>
                            {session.userAgent || '-'}
                          </td>
                          <td className="text-zinc-600 dark:text-[#A0A6B5] py-3 px-4">
                            {session.loginTime ? new Date(session.loginTime).toLocaleString() : '-'}
                          </td>
                          <td className="text-right text-zinc-500 dark:text-[#A0A6B5] py-3 px-4">
                            {session.accessTokenValidTill ? new Date(session.accessTokenValidTill).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </InfoCard>

            {/* 4. Effective Access & Permissions (Always Visible) */}
            <InfoCard
              title="Effective Access & Permissions"
              icon={ShieldCheck}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              action={
                <button
                  onClick={fetchEffectivePermissions}
                  disabled={isEffectiveLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                  title="Refresh Effective Permissions"
                >
                  <RefreshCw size={13} className={isEffectiveLoading ? "animate-spin text-emerald-600" : ""} />
                  <span>Refresh</span>
                </button>
              }
            >
              {/* Subtle Loading indicator */}
              {isEffectiveLoading && !effectiveData && (
                <div className="flex items-center justify-center py-6 text-zinc-400 gap-2 mb-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <Loader2 size={16} className="animate-spin text-emerald-600" />
                  <span className="text-xs">Loading effective permissions from SSO...</span>
                </div>
              )}

              {/* Error Banner */}
              {effectiveError && (
                <div className="p-3 mb-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                  <span>{effectiveError}</span>
                  <button
                    onClick={fetchEffectivePermissions}
                    className="underline font-semibold ml-2 hover:text-amber-900"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Subsection A: Effective Features */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-zinc-500" /> Effective Features
                    <span className="ml-1 text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">
                      {effectiveFeatures.length}
                    </span>
                  </h4>
                  <span className="text-[10px] font-medium text-zinc-400">
                    From roles + direct user overrides
                  </span>
                </div>

                {effectiveFeatures.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {effectiveFeatures.map((feat, idx) => (
                      <div
                        key={`${feat.featureCode || feat.code}-${idx}`}
                        className="bg-white dark:bg-[#161922] border border-zinc-200/90 dark:border-[#2A2F3D] rounded-xl p-3 shadow-2xs hover:shadow-xs transition-shadow flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-zinc-900 dark:text-[#E6E8EE] truncate">
                            {feat.featureName || feat.name || feat.featureCode}
                          </p>
                          <p className="font-mono text-[9.5px] text-zinc-500 dark:text-[#A0A6B5] mt-0.5">
                            {feat.featureCode || feat.code}
                          </p>
                          {feat.moduleName && (
                            <p className="text-[9px] font-semibold text-indigo-600 uppercase tracking-wide mt-1">
                              {feat.moduleName}
                            </p>
                          )}
                        </div>
                        <span className={`shrink-0 text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                          feat.source === 'USER'
                            ? 'bg-violet-50 text-violet-700 border-violet-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {feat.source || 'ROLE'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-200 rounded-xl p-6 text-center bg-zinc-50/50">
                    <Layers size={20} className="mx-auto mb-2 text-zinc-300" />
                    <p className="text-xs font-semibold text-zinc-600">No effective features found</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Assign roles or grant direct features to see effective features here.</p>
                  </div>
                )}
              </div>

              {/* Subsection B: Effective Action Permissions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={14} className="text-zinc-500" /> Effective Action Permissions
                    <span className="ml-1 text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">
                      {effectivePermissions.length}
                    </span>
                  </h4>
                </div>

                {effectivePermissions.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-zinc-200 shadow-2xs">
                    <table className="w-full text-xs min-w-[560px]">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50/80">
                          <th className="text-left font-bold text-zinc-500 uppercase tracking-wider px-4 py-2.5 text-[10px]">Feature</th>
                          <th className="text-left font-bold text-zinc-500 uppercase tracking-wider px-4 py-2.5 text-[10px]">Action</th>
                          <th className="text-left font-bold text-zinc-500 uppercase tracking-wider px-4 py-2.5 text-[10px]">Permission Code</th>
                          <th className="text-center font-bold text-zinc-500 uppercase tracking-wider px-4 py-2.5 text-[10px]">Source</th>
                          <th className="text-center font-bold text-zinc-500 uppercase tracking-wider px-4 py-2.5 text-[10px]">Allowed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {effectivePermissions.map((perm, idx) => (
                          <tr key={`${perm.featureCode}-${perm.action}-${idx}`} className="hover:bg-zinc-50/60 transition-colors">
                            <td className="px-4 py-2.5 font-semibold text-zinc-900">
                              {perm.featureCode}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                                {perm.action}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-500">
                              {perm.permissionCode || `${perm.featureCode}_${perm.action}`}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider border ${
                                perm.source === 'USER'
                                  ? 'bg-violet-50 text-violet-700 border-violet-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}>
                                {perm.source || 'ROLE'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {perm.allowed ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check size={11} strokeWidth={2.5} /> Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <X size={11} strokeWidth={2.5} /> No
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-200 rounded-xl p-6 text-center bg-zinc-50/50">
                    <Key size={20} className="mx-auto mb-2 text-zinc-300" />
                    <p className="text-xs font-semibold text-zinc-600">No effective action permissions found</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Configure role permissions or grant direct permissions to see effective action permissions here.</p>
                  </div>
                )}
              </div>
            </InfoCard>

          </div>
        </div>
      </div>

      {/* ── Assign Role Modal ── */}
      <UserAssignRoleModal 
        isOpen={isAssignRoleModalOpen}
        onClose={() => setIsAssignRoleModalOpen(false)}
        user={user}
        availableRoles={availableRoles}
        assignUserRoleMutation={assignRole}
        onUpdated={() => {
          fetchUser();
          fetchEffectivePermissions();
        }}
      />

      {/* ── Assign Portal Access Modal ── */}
      <UserModuleAccessModal 
        isOpen={isAssignPortalModalOpen}
        onClose={() => setIsAssignPortalModalOpen(false)}
        user={user}
        companyId={targetCompanyId || user?.companyId}
        availableModules={availableModules}
        initialPermissions={initialPermissions}
        grantPortalAccessMutation={grantPortalAccess}
        revokePortalAccessMutation={removePortalAccess}
        togglePortalAccessMutation={togglePortalAccess}
        canAssignModules={canEdit()}
        modulesLoading={isCompanyModulesLoading}
        modulesError={companyModulesError}
        onUpdated={fetchUser}
      />
    </div>
  );
}
