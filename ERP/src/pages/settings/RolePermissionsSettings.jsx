import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Save, Loader2, Search, Plus, Copy, Info, 
  ChevronRight, ChevronDown, CheckCircle2, Users, LayoutGrid
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectSelectedCompany } from '../../features/company-management/companySlice';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { addAlert } from '../../features/notifications/notificationSlice';
import { getRoles, getRolePermissions, syncRolePermissions, createRole } from '../../api/sso/role';
import { getAllFeatures } from '../../api/sso/feature';
import { getAllPermissions } from '../../api/sso/permission';
import PageHeader from '../../components/common/PageHeader';
import ModuleTabs, { userTabs } from '../../components/module-tabs';
import Modal from '../../components/common/Modal';

const ACTIONS = [
  { label: 'Read', value: 'READ' },
  { label: 'Create', value: 'CREATE' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Write', value: 'WRITE' },
  { label: 'Delete', value: 'DELETE' },
  { label: 'Approve', value: 'APPROVE' },
  { label: 'Reject', value: 'REJECT' },
  { label: 'Return', value: 'RETURN' },
  { label: 'Delegate', value: 'DELEGATE' },
  { label: 'Cancel', value: 'CANCEL' },
  { label: 'Activate', value: 'ACTIVATE' },
  { label: 'Deactivate', value: 'DEACTIVATE' },
  { label: 'Export', value: 'EXPORT' }
];

const PermissionCheckbox = ({ checked, indeterminate, disabled, onChange }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  if (disabled) return <div className="w-4 h-4 mx-auto opacity-20 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700" title="Not applicable" />;

  return (
    <div className="flex justify-center">
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-emerald-600 dark:text-emerald-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 rounded focus:ring-emerald-500 cursor-pointer transition-all"
      />
    </div>
  );
};

export default function RolePermissionsSettings() {
  const dispatch = useAppDispatch();
  const routeParams = useParams();
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const currentUser = useAppSelector(selectCurrentUser);
  const companyId = routeParams?.companyId || selectedCompany?.id || currentUser?.companyId || currentUser?.companyCode || (() => {
    try {
      return JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
    } catch {
      return null;
    }
  })();

  const [roles, setRoles] = useState([]);
  const [features, setFeatures] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [expandedModules, setExpandedModules] = useState(new Set());
  
  const [selectedPerms, setSelectedPerms] = useState(new Set());
  
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Create Role State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRoleData, setNewRoleData] = useState({ name: '', description: '', active: true, roleType: 'SYSTEM' });
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Initial Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingRoles(true);
      try {
        const [rolesData, featuresData, permissionsData] = await Promise.all([
          getRoles({ companyId, pageSize: 100 }),
          getAllFeatures(),
          getAllPermissions()
        ]);
        const rolesList = Array.isArray(rolesData) ? rolesData : rolesData?.roles || rolesData?.content || [];
        setRoles(rolesList);
        setFeatures(featuresData || []);
        setAvailablePermissions(permissionsData || []);
        
        if (rolesList.length > 0) {
          setSelectedRoleId(rolesList[0].id);
        }
      } catch (error) {
        dispatch(addAlert({ type: 'error', message: 'Failed to load initial data.' }));
      } finally {
        setIsLoadingRoles(false);
      }
    };
    if (companyId) fetchData();
  }, [companyId, dispatch]);

  // Load selected role permissions
  useEffect(() => {
    if (!selectedRoleId) return;
    const fetchPermissions = async () => {
      setIsLoadingMatrix(true);
      try {
        const perms = await getRolePermissions(selectedRoleId);
        const permsList = Array.isArray(perms) ? perms : perms?.permissions || perms?.content || perms?.data || [];
        const newSet = new Set();
        permsList.forEach(p => {
          if (!p.featureCode || !p.action) return;
          if (p.active !== false && p.enabled !== false && p.allowed !== false) {
            const featureCode = p.featureCode.toUpperCase().trim();
            let action = p.action.toUpperCase().trim();
            if (action === 'VIEW') action = 'READ';
            newSet.add(`${featureCode}:${action}`);
          }
        });
        setSelectedPerms(newSet);
      } catch (error) {
        dispatch(addAlert({ type: 'error', message: 'Failed to load role permissions.' }));
      } finally {
        setIsLoadingMatrix(false);
      }
    };
    fetchPermissions();
  }, [selectedRoleId, dispatch]);

  // Supported feature actions derived from permissions catalog
  const supportedFeatureActions = useMemo(() => {
    const map = new Map();
    (availablePermissions || []).forEach(p => {
      if (!p.featureCode || !p.action) return;
      const fCode = p.featureCode.toUpperCase().trim();
      const act = p.action.toUpperCase().trim();
      if (!map.has(fCode)) {
        map.set(fCode, new Set());
      }
      map.get(fCode).add(act);
    });
    return map;
  }, [availablePermissions]);

  const getFeatureSupportedActions = (featureCode) => {
    if (!featureCode) return new Set();
    const fCode = featureCode.toUpperCase().trim();
    const actions = new Set(supportedFeatureActions.get(fCode) || []);
    // Also include any permission the role currently has enabled
    ACTIONS.forEach(a => {
      if (selectedPerms.has(`${fCode}:${a.value}`)) {
        actions.add(a.value);
      }
    });
    return actions;
  };

  const isActionSupported = (featureCode, action) => {
    if (!featureCode || !action) return false;
    const fCode = featureCode.toUpperCase().trim();
    const act = action.toUpperCase().trim();
    return getFeatureSupportedActions(fCode).has(act);
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setIsSaving(true);
    try {
      let catalog = availablePermissions;
      if (!catalog || catalog.length === 0) {
        try {
          const freshPerms = await getAllPermissions();
          catalog = Array.isArray(freshPerms) ? freshPerms : freshPerms?.permissions || freshPerms?.content || [];
          setAvailablePermissions(catalog);
        } catch (e) {
          console.error('Could not fetch available permissions catalog', e);
        }
      }

      // Collect all unique feature permissions from catalog and currently assigned role permissions
      const permissionMap = new Map();
      const validActionSet = new Set(ACTIONS.map(a => a.value));

      (catalog || []).forEach(p => {
        if (!p.featureCode || !p.action) return;
        const featureCode = p.featureCode.toUpperCase().trim();
        const action = p.action.toUpperCase().trim();
        // Filter out non-canonical actions that violate backend validation (e.g. SUBMIT, RELEASE, etc.)
        if (!validActionSet.has(action)) return;

        const key = `${featureCode}:${action}`;
        permissionMap.set(key, {
          featureCode,
          action,
          enabled: selectedPerms.has(key)
        });
      });

      // Include any currently active role permissions not already in catalog map
      selectedPerms.forEach(permKey => {
        const [featCode, act] = permKey.split(':');
        if (featCode && act) {
          const featureCode = featCode.toUpperCase().trim();
          const action = act.toUpperCase().trim();
          if (!validActionSet.has(action)) return;

          const key = `${featureCode}:${action}`;
          if (!permissionMap.has(key)) {
            permissionMap.set(key, {
              featureCode,
              action,
              enabled: true
            });
          }
        }
      });

      const payload = Array.from(permissionMap.values());

      await syncRolePermissions(selectedRoleId, payload);
      dispatch(addAlert({ type: 'success', message: 'Permissions saved successfully.' }));
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to save permissions.' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleData.name.trim()) {
      dispatch(addAlert({ type: 'error', message: 'Role Name is required.' }));
      return;
    }
    setIsCreatingRole(true);
    try {
      const created = await createRole(companyId, {
        name: newRoleData.name,
        code: newRoleData.name.toUpperCase().replace(/\s+/g, '_'),
        description: newRoleData.description,
        roleType: newRoleData.roleType,
        status: newRoleData.active,
        companyId
      });
      dispatch(addAlert({ type: 'success', message: 'Role created successfully.' }));
      setRoles(prev => [...prev, created]);
      setSelectedRoleId(created.id);
      setIsRoleModalOpen(false);
      setNewRoleData({ name: '', description: '', active: true, roleType: 'SYSTEM' });
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to create role.' }));
    } finally {
      setIsCreatingRole(false);
    }
  };

  const modules = useMemo(() => {
    const modMap = {};
    features.forEach(f => {
      if (!modMap[f.moduleName]) {
        modMap[f.moduleName] = { name: f.moduleName, features: [] };
      }
      modMap[f.moduleName].features.push(f);
    });
    return Object.values(modMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [features]);

  const filteredRoles = useMemo(() => {
    if (!searchRole.trim()) return roles;
    return roles.filter(r => r.name.toLowerCase().includes(searchRole.toLowerCase()));
  }, [roles, searchRole]);

  const toggleModuleExpanded = (modName) => {
    const next = new Set(expandedModules);
    if (next.has(modName)) next.delete(modName);
    else next.add(modName);
    setExpandedModules(next);
  };

  // ----- Selection Helpers -----
  
  const toggleFeatureAction = (featureCode, action) => {
    const fCode = featureCode.toUpperCase().trim();
    const act = action.toUpperCase().trim();
    const key = `${fCode}:${act}`;
    const newSet = new Set(selectedPerms);
    if (newSet.has(key)) {
      newSet.delete(key);
      if (act === 'READ') {
        newSet.delete(`${fCode}:WRITE`);
        newSet.delete(`${fCode}:DELETE`);
      }
    } else {
      newSet.add(key);
      if (act === 'WRITE' || act === 'DELETE') {
        if (isActionSupported(fCode, 'READ')) {
          newSet.add(`${fCode}:READ`);
        }
      }
    }
    setSelectedPerms(newSet);
  };

  const toggleFeatureAll = (featureCode, isChecked) => {
    const fCode = featureCode.toUpperCase().trim();
    const supportedActions = getFeatureSupportedActions(fCode);
    const newSet = new Set(selectedPerms);
    supportedActions.forEach(act => {
      const key = `${fCode}:${act}`;
      if (isChecked) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
    });
    setSelectedPerms(newSet);
  };

  const toggleModuleAction = (moduleName, action, isChecked) => {
    const act = action.toUpperCase().trim();
    const newSet = new Set(selectedPerms);
    const modFeatures = features.filter(f => f.moduleName === moduleName);
    modFeatures.forEach(f => {
      const fCode = f.code.toUpperCase().trim();
      if (isActionSupported(fCode, act)) {
        const key = `${fCode}:${act}`;
        if (isChecked) {
          newSet.add(key);
          if (act === 'WRITE' || act === 'DELETE') {
            if (isActionSupported(fCode, 'READ')) {
              newSet.add(`${fCode}:READ`);
            }
          }
        } else {
          newSet.delete(key);
          if (act === 'READ') {
            newSet.delete(`${fCode}:WRITE`);
            newSet.delete(`${fCode}:DELETE`);
          }
        }
      }
    });
    setSelectedPerms(newSet);
  };

  const toggleModuleAll = (moduleName, isChecked) => {
    const newSet = new Set(selectedPerms);
    const modFeatures = features.filter(f => f.moduleName === moduleName);
    modFeatures.forEach(f => {
      const fCode = f.code.toUpperCase().trim();
      const supportedActions = getFeatureSupportedActions(fCode);
      supportedActions.forEach(act => {
        const key = `${fCode}:${act}`;
        if (isChecked) {
          newSet.add(key);
        } else {
          newSet.delete(key);
        }
      });
    });
    setSelectedPerms(newSet);
  };

  // ----- State Calculators -----
  
  const getFeatureState = (featureCode) => {
    const fCode = featureCode.toUpperCase().trim();
    const supportedActions = getFeatureSupportedActions(fCode);
    if (supportedActions.size === 0) {
      return { checked: false, indeterminate: false, disabled: true };
    }
    let checkedCount = 0;
    supportedActions.forEach(act => {
      if (selectedPerms.has(`${fCode}:${act}`)) {
        checkedCount++;
      }
    });
    return {
      checked: checkedCount === supportedActions.size && supportedActions.size > 0,
      indeterminate: checkedCount > 0 && checkedCount < supportedActions.size,
      disabled: false
    };
  };

  const getModuleActionState = (moduleName, action) => {
    const act = action.toUpperCase().trim();
    const modFeatures = features.filter(f => f.moduleName === moduleName);
    const applicableFeatures = modFeatures.filter(f => isActionSupported(f.code, act));
    if (applicableFeatures.length === 0) {
      return { checked: false, indeterminate: false, disabled: true };
    }
    const checkedCount = applicableFeatures.filter(f => 
      selectedPerms.has(`${f.code.toUpperCase().trim()}:${act}`)
    ).length;
    return {
      checked: checkedCount === applicableFeatures.length,
      indeterminate: checkedCount > 0 && checkedCount < applicableFeatures.length,
      disabled: false
    };
  };

  const getModuleAllState = (moduleName) => {
    const modFeatures = features.filter(f => f.moduleName === moduleName);
    let totalSupported = 0;
    let totalChecked = 0;
    modFeatures.forEach(f => {
      const fCode = f.code.toUpperCase().trim();
      const supportedActions = getFeatureSupportedActions(fCode);
      totalSupported += supportedActions.size;
      supportedActions.forEach(act => {
        if (selectedPerms.has(`${fCode}:${act}`)) {
          totalChecked++;
        }
      });
    });
    return {
      checked: totalChecked === totalSupported && totalSupported > 0,
      indeterminate: totalChecked > 0 && totalChecked < totalSupported,
      disabled: totalSupported === 0
    };
  };

  const selectedRoleData = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="flex flex-col h-full bg-[#E8E9DF] dark:bg-[#0F1117] relative">
      <PageHeader
        title="Role & Permissions"
        description="Configure module access and actions for each organizational role"
      >
        <button 
          onClick={() => setIsRoleModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Create Role</span>
        </button>
      </PageHeader>
      
      <ModuleTabs tabs={userTabs} activeKey="role-permissions" />

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
        
        {/* LEFT PANEL: Role List */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Roles</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Select a role to view and manage permissions</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={15} />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchRole}
                onChange={e => setSearchRole(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-blue-500/20 focus:border-zinc-900 dark:focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoadingRoles ? (
              <div className="p-8 text-center text-zinc-400"><Loader2 className="animate-spin mx-auto" /></div>
            ) : filteredRoles.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">No roles found.</div>
            ) : (
              filteredRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedRoleId === role.id 
                      ? 'bg-blue-50/50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/40 ring-1 ring-blue-500/10' 
                      : 'bg-white dark:bg-[#161922] border-zinc-100 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-[#1D212C]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-md ${selectedRoleId === role.id ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                        <Users size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">{role.name}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                          <span>{role.roleType || 'System Role'}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                          <span>{role.usersCount ?? 0} users</span>
                        </div>
                      </div>
                    </div>
                    {role.active !== false && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/30">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Permissions Matrix */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
          {selectedRoleData ? (
            <>
              {/* Role Header */}
              <div className="p-5 border-b border-zinc-100 dark:border-[#2A2F3D] shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{selectedRoleData.name}</h2>
                      {selectedRoleData.active !== false && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/30">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      <span>{selectedRoleData.roleType || 'System Role'}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                      <span>{selectedRoleData.usersCount ?? 0} assigned users</span>
                      {selectedRoleData.description && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                          <span>{selectedRoleData.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors shadow-sm">
                      <Copy size={16} /> Duplicate Role
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving || isLoadingMatrix}
                      className="btn-primary flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <div className="px-5 py-4 bg-blue-50/50 dark:bg-blue-500/10 border-b border-blue-100 dark:border-blue-500/20 flex items-start gap-3 shrink-0">
                <Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  These permissions control access to modules and features. Some permissions may be inherited from higher-level roles.
                </p>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-auto min-w-0 max-w-full custom-scrollbar">
                {isLoadingMatrix ? (
                  <div className="p-12 flex justify-center text-zinc-400"><Loader2 className="animate-spin w-8 h-8" /></div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[1200px]" aria-label="Role Permissions Matrix">
                    <thead className="sticky top-0 bg-zinc-50 dark:bg-[#1D212C] z-20 border-b border-zinc-200 dark:border-[#2A2F3D]">
                      <tr>
                        <th scope="col" className="py-3 px-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-[#2A2F3D] min-w-[220px]">
                          Feature
                        </th>
                        <th scope="col" className="py-3 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-center border-b border-zinc-200 dark:border-[#2A2F3D] w-20">
                          Select all
                        </th>
                        {ACTIONS.map(action => (
                          <th key={action.value} scope="col" className="py-3 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-center border-b border-zinc-200 dark:border-[#2A2F3D] w-16 min-w-[64px]">
                            {action.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                      {modules.map(mod => {
                        const isExpanded = expandedModules.has(mod.name);
                        const modAllState = getModuleAllState(mod.name);
                        return (
                          <React.Fragment key={mod.name}>
                            {/* Module Row */}
                            <tr className={`group transition-colors ${isExpanded ? 'bg-zinc-50/50 dark:bg-[#1D212C]/60' : 'bg-white dark:bg-[#161922] hover:bg-zinc-50 dark:hover:bg-[#1D212C]'}`}>
                              <td className="py-3 px-6 min-w-[220px]">
                                <button 
                                  onClick={() => toggleModuleExpanded(mod.name)}
                                  className="flex items-center gap-2.5 w-full text-left font-bold text-zinc-800 dark:text-zinc-200 text-sm"
                                >
                                  <div className={`text-zinc-400 dark:text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={16} />
                                  </div>
                                  <LayoutGrid size={16} className="text-zinc-400 dark:text-zinc-500" />
                                  {mod.name}
                                </button>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <PermissionCheckbox 
                                  checked={modAllState.checked}
                                  indeterminate={modAllState.indeterminate}
                                  disabled={modAllState.disabled}
                                  onChange={(checked) => toggleModuleAll(mod.name, checked)}
                                />
                              </td>
                              {ACTIONS.map(action => {
                                const modActionState = getModuleActionState(mod.name, action.value);
                                return (
                                  <td key={action.value} className="py-3 px-2 text-center">
                                    {modActionState.disabled ? (
                                      <span className="text-zinc-300 dark:text-zinc-600 text-xs font-medium select-none" title="Unsupported in module">—</span>
                                    ) : (
                                      <PermissionCheckbox 
                                        checked={modActionState.checked}
                                        indeterminate={modActionState.indeterminate}
                                        disabled={false}
                                        onChange={(checked) => toggleModuleAction(mod.name, action.value, checked)}
                                      />
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                            
                            {/* Feature Rows */}
                            {isExpanded && mod.features.map(feature => {
                              const featAllState = getFeatureState(feature.code);
                              return (
                                <tr key={feature.code} className="bg-white dark:bg-[#161922] hover:bg-zinc-50/50 dark:hover:bg-[#1D212C]/50 transition-colors">
                                  <td className="py-2.5 px-6 pl-14 min-w-[220px]">
                                    <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{feature.name}</div>
                                  </td>
                                  <td className="py-2.5 px-2 bg-zinc-50/30 dark:bg-[#1D212C]/30 text-center">
                                    <PermissionCheckbox 
                                      checked={featAllState.checked}
                                      indeterminate={featAllState.indeterminate}
                                      disabled={featAllState.disabled}
                                      onChange={(checked) => toggleFeatureAll(feature.code, checked)}
                                    />
                                  </td>
                                  {ACTIONS.map(action => {
                                    const supported = isActionSupported(feature.code, action.value);
                                    if (!supported) {
                                      return (
                                        <td key={action.value} className="py-2.5 px-2 text-center">
                                          <span className="text-zinc-300 dark:text-zinc-600 text-xs font-medium select-none" title="Not supported">—</span>
                                        </td>
                                      );
                                    }
                                    const isChecked = selectedPerms.has(`${feature.code.toUpperCase().trim()}:${action.value}`);
                                    return (
                                      <td key={action.value} className="py-2.5 px-2 text-center">
                                        <PermissionCheckbox 
                                          checked={isChecked}
                                          disabled={false}
                                          onChange={() => toggleFeatureAction(feature.code, action.value)}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Footer Actions */}
              <div className="p-5 border-t border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/80 dark:bg-[#1D212C]/80 flex justify-end gap-3 mt-auto shrink-0">
                <button 
                  className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-[#161922] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg shadow-sm hover:bg-zinc-50 dark:hover:bg-[#1D212C] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || isLoadingMatrix}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-[#161922]">
              Select a role from the left panel to configure its permissions.
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => !isCreatingRole && setIsRoleModalOpen(false)}
        title="Create New Role"
      >
        <form onSubmit={handleCreateRole} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Role Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newRoleData.name}
              onChange={(e) => setNewRoleData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Finance Manager"
              className="w-full px-3 py-2 bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-blue-500/20 focus:border-zinc-900 dark:focus:border-blue-500"
              disabled={isCreatingRole}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              value={newRoleData.description}
              onChange={(e) => setNewRoleData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Role description..."
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-blue-500/20 focus:border-zinc-900 dark:focus:border-blue-500 resize-none"
              disabled={isCreatingRole}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="role-active"
              checked={newRoleData.active}
              onChange={(e) => setNewRoleData(prev => ({ ...prev, active: e.target.checked }))}
              className="w-4 h-4 text-zinc-900 dark:text-blue-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 rounded focus:ring-zinc-900 dark:focus:ring-blue-500 accent-zinc-900 dark:accent-blue-500"
              disabled={isCreatingRole}
            />
            <label htmlFor="role-active" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Active Status
            </label>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-[#2A2F3D] mt-6">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              disabled={isCreatingRole}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#161922] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#1D212C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingRole || !newRoleData.name.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isCreatingRole ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Create Role
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
