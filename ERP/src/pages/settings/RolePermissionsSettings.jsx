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
  { label: 'View', value: 'READ' },
  { label: 'Write', value: 'WRITE' },
  { label: 'Delete', value: 'DELETE' }
];

const PermissionCheckbox = ({ checked, indeterminate, disabled, onChange }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  if (disabled) return <div className="w-4 h-4 mx-auto opacity-20 bg-zinc-100 rounded border border-zinc-200" title="Not applicable" />;

  return (
    <div className="flex justify-center">
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500 cursor-pointer transition-all"
      />
    </div>
  );
};

export default function RolePermissionsSettings() {
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
          if (p.active !== false && p.enabled !== false && p.allowed !== false) {
            const action = p.action?.toUpperCase()?.trim();
            if (action === 'WRITE' || action === 'CREATE' || action === 'UPDATE') {
              newSet.add(`${p.featureCode}:WRITE`);
            } else if (action === 'READ' || action === 'VIEW') {
              newSet.add(`${p.featureCode}:READ`);
            } else if (action === 'DELETE') {
              newSet.add(`${p.featureCode}:DELETE`);
            }
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

      // Collect all unique feature codes from features, catalog, and selected permissions
      const featureCodes = new Set();
      features.forEach(f => {
        if (f.code) featureCodes.add(f.code);
      });
      (catalog || []).forEach(ap => {
        if (ap.featureCode) featureCodes.add(ap.featureCode);
      });
      selectedPerms.forEach(permKey => {
        const [featCode] = permKey.split(':');
        if (featCode) featureCodes.add(featCode);
      });

      const payload = [];
      const seen = new Set();

      featureCodes.forEach(featureCode => {
        // Backend expects exactly 3 actions: READ, WRITE, and DELETE
        const backendActions = [
          {
            action: 'READ',
            enabled: selectedPerms.has(`${featureCode}:READ`)
          },
          {
            action: 'WRITE',
            enabled: selectedPerms.has(`${featureCode}:WRITE`) || selectedPerms.has(`${featureCode}:CREATE`) || selectedPerms.has(`${featureCode}:UPDATE`)
          },
          {
            action: 'DELETE',
            enabled: selectedPerms.has(`${featureCode}:DELETE`)
          }
        ];

        backendActions.forEach(({ action, enabled }) => {
          const key = `${featureCode}:${action}`;
          if (!seen.has(key)) {
            seen.add(key);
            payload.push({
              featureCode,
              action,
              enabled: Boolean(enabled)
            });
          }
        });
      });

      // Pre-flight check: strictly filter out virtual UI actions ('CREATE', 'UPDATE') and only allow valid backend actions
      const sanitizedPayload = payload.filter(p => 
        p.action !== 'CREATE' && p.action !== 'UPDATE' && ['READ', 'WRITE', 'DELETE'].includes(p.action)
      );

      await syncRolePermissions(selectedRoleId, sanitizedPayload);
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
    const key = `${featureCode}:${action}`;
    const newSet = new Set(selectedPerms);
    if (newSet.has(key)) {
      newSet.delete(key);
      if (action === 'READ') {
        newSet.delete(`${featureCode}:WRITE`);
        newSet.delete(`${featureCode}:DELETE`);
      }
    } else {
      newSet.add(key);
      if (action === 'WRITE' || action === 'DELETE') {
        newSet.add(`${featureCode}:READ`);
      }
    }
    setSelectedPerms(newSet);
  };

  const toggleFeatureAll = (featureCode, isChecked) => {
    const newSet = new Set(selectedPerms);
    ACTIONS.forEach(a => {
      const key = `${featureCode}:${a.value}`;
      if (isChecked) newSet.add(key);
      else newSet.delete(key);
    });
    setSelectedPerms(newSet);
  };

  const toggleModuleAction = (moduleName, action, isChecked) => {
    const newSet = new Set(selectedPerms);
    const modFeatures = features.filter(f => f.moduleName === moduleName);
    modFeatures.forEach(f => {
      const key = `${f.code}:${action}`;
      if (isChecked) {
        newSet.add(key);
        if (action === 'WRITE' || action === 'DELETE') {
          newSet.add(`${f.code}:READ`);
        }
      } else {
        newSet.delete(key);
        if (action === 'READ') {
          newSet.delete(`${f.code}:WRITE`);
          newSet.delete(`${f.code}:DELETE`);
        }
      }
    });
    setSelectedPerms(newSet);
  };

  const toggleModuleAll = (moduleName, isChecked) => {
    const newSet = new Set(selectedPerms);
    const modFeatures = features.filter(f => f.moduleName === moduleName);
    modFeatures.forEach(f => {
      ACTIONS.forEach(a => {
        const key = `${f.code}:${a.value}`;
        if (isChecked) newSet.add(key);
        else newSet.delete(key);
      });
    });
    setSelectedPerms(newSet);
  };

  // ----- State Calculators -----
  
  const getFeatureState = (featureCode) => {
    const avail = ACTIONS;
    const checkedCount = avail.filter(a => selectedPerms.has(`${featureCode}:${a.value}`)).length;
    return {
      checked: checkedCount === avail.length && avail.length > 0,
      indeterminate: checkedCount > 0 && checkedCount < avail.length,
      disabled: false
    };
  };

  const getModuleActionState = (moduleName, action) => {
    const modFeatures = features.filter(f => f.moduleName === moduleName);
    const checkedCount = modFeatures.filter(f => selectedPerms.has(`${f.code}:${action}`)).length;
    return {
      checked: checkedCount === modFeatures.length && modFeatures.length > 0,
      indeterminate: checkedCount > 0 && checkedCount < modFeatures.length,
      disabled: modFeatures.length === 0
    };
  };

  const getModuleAllState = (moduleName) => {
    const modFeatures = features.filter(f => f.moduleName === moduleName);
    const totalAvail = modFeatures.length * ACTIONS.length;
    let totalChecked = 0;
    modFeatures.forEach(f => {
      ACTIONS.forEach(a => {
        if (selectedPerms.has(`${f.code}:${a.value}`)) totalChecked++;
      });
    });
    return {
      checked: totalChecked === totalAvail && totalAvail > 0,
      indeterminate: totalChecked > 0 && totalChecked < totalAvail,
      disabled: totalAvail === 0
    };
  };

  const selectedRoleData = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 relative">
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
        <div className="md:col-span-4 lg:col-span-3 flex flex-col bg-white rounded-xl border border-zinc-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-semibold text-zinc-800 mb-1">Roles</h3>
            <p className="text-xs text-zinc-500 mb-4">Select a role to view and manage permissions</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchRole}
                onChange={e => setSearchRole(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoadingRoles ? (
              <div className="p-8 text-center text-zinc-400"><Loader2 className="animate-spin mx-auto" /></div>
            ) : filteredRoles.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">No roles found.</div>
            ) : (
              filteredRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedRoleId === role.id 
                      ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-500/10' 
                      : 'bg-white border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-md ${selectedRoleId === role.id ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>
                        <Users size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-zinc-900 tracking-tight">{role.name}</div>
                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                          <span>{role.roleType || 'System Role'}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                          <span>{role.usersCount ?? 0} users</span>
                        </div>
                      </div>
                    </div>
                    {role.active !== false && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
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
        <div className="md:col-span-8 lg:col-span-9 flex flex-col bg-white rounded-xl border border-zinc-200/90 shadow-sm overflow-hidden">
          {selectedRoleData ? (
            <>
              {/* Role Header */}
              <div className="p-5 border-b border-zinc-100 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h2 className="text-xl font-bold text-zinc-900">{selectedRoleData.name}</h2>
                      {selectedRoleData.active !== false && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-500 flex items-center gap-2">
                      <span>{selectedRoleData.roleType || 'System Role'}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                      <span>{selectedRoleData.usersCount ?? 0} assigned users</span>
                      {selectedRoleData.description && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                          <span>{selectedRoleData.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm">
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
              <div className="px-5 py-4 bg-blue-50/50 border-b border-blue-100 flex items-start gap-3 shrink-0">
                <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">
                  These permissions control access to modules and features. Some permissions may be inherited from higher-level roles.
                </p>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-auto">
                {isLoadingMatrix ? (
                  <div className="p-12 flex justify-center text-zinc-400"><Loader2 className="animate-spin w-8 h-8" /></div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 bg-white z-10 shadow-sm shadow-zinc-100">
                      <tr>
                        <th className="py-3 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                          Feature
                        </th>
                        <th className="py-3 px-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center border-b border-zinc-200 w-24">
                          Select all
                        </th>
                        {ACTIONS.map(action => (
                          <th key={action.value} className="py-3 px-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center border-b border-zinc-200 w-24">
                            {action.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {modules.map(mod => {
                        const isExpanded = expandedModules.has(mod.name);
                        const modAllState = getModuleAllState(mod.name);
                        return (
                          <React.Fragment key={mod.name}>
                            {/* Module Row */}
                            <tr className={`group transition-colors ${isExpanded ? 'bg-zinc-50/50' : 'bg-white hover:bg-zinc-50'}`}>
                              <td className="py-3 px-6">
                                <button 
                                  onClick={() => toggleModuleExpanded(mod.name)}
                                  className="flex items-center gap-2.5 w-full text-left font-bold text-zinc-800 text-sm"
                                >
                                  <div className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={16} />
                                  </div>
                                  <LayoutGrid size={16} className="text-zinc-400" />
                                  {mod.name}
                                </button>
                              </td>
                              <td className="py-3 px-4">
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
                                  <td key={action.value} className="py-3 px-4">
                                    <PermissionCheckbox 
                                      checked={modActionState.checked}
                                      indeterminate={modActionState.indeterminate}
                                      disabled={modActionState.disabled}
                                      onChange={(checked) => toggleModuleAction(mod.name, action.value, checked)}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                            
                            {/* Feature Rows */}
                            {isExpanded && mod.features.map(feature => {
                              const featAllState = getFeatureState(feature.code);
                              return (
                                <tr key={feature.code} className="bg-white hover:bg-zinc-50/50 transition-colors">
                                  <td className="py-2.5 px-6 pl-14">
                                    <div className="text-sm font-medium text-zinc-600">{feature.name}</div>
                                  </td>
                                  <td className="py-2.5 px-4 bg-zinc-50/30">
                                    <PermissionCheckbox 
                                      checked={featAllState.checked}
                                      indeterminate={featAllState.indeterminate}
                                      disabled={featAllState.disabled}
                                      onChange={(checked) => toggleFeatureAll(feature.code, checked)}
                                    />
                                  </td>
                                  {ACTIONS.map(action => {
                                    const isChecked = selectedPerms.has(`${feature.code}:${action.value}`);
                                    return (
                                      <td key={action.value} className="py-2.5 px-4">
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
              <div className="p-5 border-t border-zinc-200 bg-zinc-50/80 flex justify-end gap-3 mt-auto shrink-0">
                <button 
                  className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-300 rounded-lg shadow-sm hover:bg-zinc-50 transition-all"
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
            <div className="flex-1 flex items-center justify-center text-zinc-500 bg-zinc-50/50">
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
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Role Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newRoleData.name}
              onChange={(e) => setNewRoleData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Finance Manager"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              disabled={isCreatingRole}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Description
            </label>
            <textarea
              value={newRoleData.description}
              onChange={(e) => setNewRoleData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Role description..."
              rows={3}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              disabled={isCreatingRole}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="role-active"
              checked={newRoleData.active}
              onChange={(e) => setNewRoleData(prev => ({ ...prev, active: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
              disabled={isCreatingRole}
            />
            <label htmlFor="role-active" className="text-sm font-medium text-zinc-700">
              Active Status
            </label>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 mt-6">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              disabled={isCreatingRole}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
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
