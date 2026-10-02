import React, { useState, useEffect, useRef } from "react";
import { 
  X, User, Shield, Layers, Key, Trash2, CheckCircle2, 
  UserCog, Smartphone, Mail, Building2, Calendar
} from "lucide-react";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import CustomSelect from '../../../components/common/CustomSelect';

export default function UserDetailsModal({
  isOpen,
  onClose,
  user,
  companies,
  availableModules,
  availableRoles,
  initialPermissions,
  canAssignModules,
  canEdit,
  canDelete,
  updateUserMutation,
  assignUserRoleMutation,
  changeUserPasswordMutation,
  grantPortalAccessMutation,
  revokePortalAccessMutation,
  togglePortalAccessMutation,
  onDelete
}) {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("general");

  // General Info State
  const [name, setName] = useState("");
  const [empId, setEmpId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Role State
  const [role, setRole] = useState("employee");

  // Module State
  const [permissions, setPermissions] = useState([]);
  const [togglingModules, setTogglingModules] = useState({});
  const togglingRef = useRef(new Set());

  // Password State
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || "");
      setEmpId(user.empId || "");
      setUsername(user.username || "");
      setEmail(user.email || "");
      setRole(user.role || "employee");
      setPermissions(initialPermissions || []);
      setNewPassword("");
      setActiveTab("general");
    }
  }, [isOpen, user, initialPermissions]);

  if (!isOpen || !user) return null;

  const handleUpdateGeneral = async (e) => {
    e.preventDefault();
    if (!name || !email || !empId || !username) {
      dispatch(addAlert({ type: "warning", message: "All fields are required" }));
      return;
    }
    try {
      await updateUserMutation({
        id: user.id,
        empId,
        username,
        email,
        fullName: name,
      }).unwrap();
      dispatch(addAlert({ type: "success", message: "User details updated successfully" }));
    } catch (error) {
      const msg = error?.data?.message || error?.message || "Failed to update user details";
      dispatch(addAlert({ type: "error", message: msg }));
    }
  };

  const handleUpdateRole = async () => {
    if (!role) return;
    const mappedRole = availableRoles.find(r => 
      r.name?.toLowerCase() === role.toLowerCase() || 
      r.roleName?.toLowerCase() === role.toLowerCase()
    );
    if (!mappedRole) {
       dispatch(addAlert({ type: "error", message: "Selected role not found" }));
       return;
    }
    try {
      await assignUserRoleMutation({ id: user.id, roleId: mappedRole.id }).unwrap();
      dispatch(addAlert({ type: "success", message: "Role updated successfully" }));
    } catch (error) {
      const msg = error?.data?.message || error?.message || "Failed to assign role";
      dispatch(addAlert({ type: "error", message: msg }));
    }
  };

  const handleTogglePortalAccess = async (modId) => {
    if (!canAssignModules || togglingRef.current.has(modId)) return;
    
    togglingRef.current.add(modId);
    setTogglingModules(prev => ({ ...prev, [modId]: true }));
    
    try {
      const isSelected = permissions.includes(modId);
      let success = false;
      
      if (isSelected) {
        try {
          await revokePortalAccessMutation({ id: user.id, moduleId: modId }).unwrap();
          success = true;
        } catch (error) {
          if (error?.status === 404 || error?.status === 409) {
            try {
              await togglePortalAccessMutation({ userId: user.id, moduleId: modId }).unwrap();
              success = true;
            } catch (e) {
              if (e?.status === 404 || e?.status === 409) success = true;
            }
          }
        }
        if (success) setPermissions(permissions.filter((p) => p !== modId));
      } else {
        try {
          await grantPortalAccessMutation({ id: user.id, moduleId: modId }).unwrap();
          success = true;
        } catch (error) {
          if (error?.status === 409) {
            try {
              await togglePortalAccessMutation({ userId: user.id, moduleId: modId }).unwrap();
              success = true;
            } catch (e) {
              if (e?.status === 409) success = true;
            }
          }
        }
        if (success) setPermissions([...permissions, modId]);
      }
      
      if (success) {
        dispatch(addAlert({ type: "success", message: "Module access updated!" }));
      } else {
         dispatch(addAlert({ type: "error", message: "Failed to update module access" }));
      }
    } catch (error) {
      console.error("Portal access API error:", error);
    } finally {
      togglingRef.current.delete(modId);
      setTogglingModules(prev => ({ ...prev, [modId]: false }));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      dispatch(addAlert({ type: "warning", message: "Password must be at least 6 characters" }));
      return;
    }
    try {
      await changeUserPasswordMutation({
        id: user.id,
        newPassword
      }).unwrap();
      dispatch(addAlert({ type: "success", message: "Password changed successfully" }));
      setNewPassword("");
    } catch (error) {
      const msg = error?.data?.message || error?.message || "Failed to change password";
      dispatch(addAlert({ type: "error", message: msg }));
    }
  };

  const companyName = user.companyId 
    ? (companies?.find(c => c.id === user.companyId)?.name || user.companyId)
    : "N/A";

  const tabs = [
    { id: "general", label: "General", icon: User },
    { id: "role", label: "System Role", icon: Shield },
    { id: "modules", label: "Module Access", icon: Layers },
    { id: "security", label: "Security", icon: Key },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden shadow-xl animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg border border-indigo-100">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">{user.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                {companyName !== 'N/A' && <span className="flex items-center gap-1"><Building2 size={14} /> {companyName}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {user.active ? 'ACTIVE' : 'SUSPENDED'}
            </span>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* Sidebar Tabs */}
          <div className="md:w-56 bg-zinc-50 border-r border-zinc-100 p-4 shrink-0 overflow-y-auto">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? "text-indigo-600" : "text-zinc-400"} />
                  {tab.label}
                </button>
              ))}
            </nav>

            {canDelete && (
              <div className="mt-8 pt-8 border-t border-zinc-200 space-y-3">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-3">Danger Zone</p>
                <button
                  onClick={() => { onClose(); onDelete(user.id, user.name); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={18} className="text-rose-500" />
                  Deactivate User
                </button>
              </div>
            )}
          </div>

          {/* Main Panel */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            
            {/* TAB: GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-zinc-900">General Information</h3>
                  <p className="text-sm text-zinc-500">Update the user's basic profile details.</p>
                </div>
                <form onSubmit={handleUpdateGeneral} className="space-y-5 max-w-md">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      disabled={!canEdit}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      disabled={!canEdit}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Username *</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field"
                      disabled={!canEdit}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Employee ID *</label>
                    <input
                      type="text"
                      value={empId}
                      onChange={(e) => setEmpId(e.target.value)}
                      className="input-field"
                      disabled={!canEdit}
                      required
                    />
                  </div>
                  <div className="pt-4 flex items-center gap-3 border-t border-zinc-100">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar size={14} /> Registered: {user.created || 'N/A'}
                    </div>
                  </div>
                  {canEdit && (
                    <button type="submit" className="btn-primary w-full">Save Changes</button>
                  )}
                </form>
              </div>
            )}

            {/* TAB: ROLE */}
            {activeTab === "role" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-zinc-900">System Role</h3>
                  <p className="text-sm text-zinc-500">Assign a primary role to control the user's overarching access level.</p>
                </div>
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-2">Select Role</label>
                    <CustomSelect
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="input-field"
                      disabled={!canAssignModules}
                    >
                      <option value="employee">Employee</option>
                      <option value="company_admin">Company Admin</option>
                      {(Array.isArray(availableRoles) ? availableRoles : []).map((r) => (
                        <option key={r.id} value={r.name || r.roleName}>
                          {r.name || r.roleName}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>
                  {canAssignModules && (
                    <button onClick={handleUpdateRole} className="btn-primary w-full">Update Role</button>
                  )}
                </div>
              </div>
            )}

            {/* TAB: MODULES */}
            {activeTab === "modules" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-zinc-900">Module Access</h3>
                  <p className="text-sm text-zinc-500">Enable or disable specific modules for this user.</p>
                </div>
                {(!Array.isArray(availableModules) || availableModules.length === 0) ? (
                  <div className="p-8 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                    <p className="text-zinc-500 text-sm">No modules are available for this company.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(Array.isArray(availableModules) ? availableModules : []).map((mod) => {
                      const modId = mod.id || mod.globalId;
                      const isSelected = permissions.includes(modId);
                      const isToggling = togglingModules[modId];
                      return (
                        <div
                          key={modId}
                          onClick={() => handleTogglePortalAccess(modId)}
                          className={`
                            relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer select-none
                            ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-zinc-200 bg-white hover:border-zinc-300'}
                            ${!canAssignModules ? 'opacity-70 pointer-events-none' : ''}
                            ${isToggling ? 'opacity-50 pointer-events-none' : ''}
                          `}
                        >
                          <div className="flex-1">
                            <h4 className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-zinc-700'}`}>
                              {mod.label || mod.name || 'Unknown Module'}
                            </h4>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'border-2 border-zinc-300'}`}>
                            {isSelected && <CheckCircle2 size={14} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-zinc-900">Security</h3>
                  <p className="text-sm text-zinc-500">Update the user's password.</p>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">New Password *</label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field"
                      disabled={!canEdit}
                      minLength={6}
                      required
                    />
                  </div>
                  {canEdit && (
                    <button type="submit" className="btn-primary w-full">Change Password</button>
                  )}
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
