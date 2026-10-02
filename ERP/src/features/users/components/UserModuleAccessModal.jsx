import React, { useState, useEffect, useRef } from "react";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import { CheckCircle2 } from "lucide-react";

/**
 * Modal for assigning/revoking module access
 */
export default function UserModuleAccessModal({
  isOpen,
  onClose,
  user,
  availableModules = [],
  initialPermissions,
  grantPortalAccessMutation,
  revokePortalAccessMutation,
  togglePortalAccessMutation,
  canAssignModules,
  modulesLoading = false,
  modulesError = null,
  onUpdated,
}) {
  const dispatch = useAppDispatch();
  const activeModules = Array.isArray(availableModules)
    ? availableModules.filter((mod) => mod?.status !== false && mod?.status !== "INACTIVE")
    : [];
  const [permissions, setPermissions] = useState([]);
  const [togglingModules, setTogglingModules] = useState({});
  const togglingRef = useRef(new Set());

  useEffect(() => {
    if (isOpen) {
      setPermissions(initialPermissions || []);
    }
  }, [isOpen, initialPermissions]);

  if (!isOpen || !user) return null;

  const permissionMatchesModule = (permission, mod) => {
    if (!permission || !mod) return false;
    const moduleIds = [
      mod.id,
      mod.globalId,
      mod.companyModuleId,
      mod.moduleId,
      mod.module?.id,
      mod.companyModule?.id,
    ].filter(Boolean).map(String);
    const moduleNames = [
      mod.label,
      mod.name,
      mod.moduleName,
      mod.module?.name,
      mod.module?.moduleName,
    ].filter(Boolean).map((value) => String(value).toLowerCase());
    const moduleHosts = [mod.host, mod.hostUrl, mod.module?.host].filter(Boolean).map(String);

    if (typeof permission === "object") {
      const permissionIds = [
        permission.id,
        permission.moduleId,
        permission.companyModuleId,
        permission.module?.id,
        permission.companyModule?.id,
      ].filter(Boolean).map(String);
      const permissionNames = [
        permission.moduleName,
        permission.name,
        permission.module?.name,
        permission.module?.moduleName,
      ].filter(Boolean).map((value) => String(value).toLowerCase());
      const permissionHosts = [permission.host, permission.hostUrl, permission.module?.host].filter(Boolean).map(String);

      return (
        permissionIds.some((id) => moduleIds.includes(id)) ||
        permissionNames.some((name) => moduleNames.includes(name)) ||
        permissionHosts.some((host) => moduleHosts.includes(host))
      );
    }

    const raw = String(permission);
    return moduleIds.includes(raw) || moduleNames.includes(raw.toLowerCase()) || moduleHosts.includes(raw);
  };

  const handleTogglePortalAccess = async (mod) => {
    const modId = mod?.id || mod?.companyModuleId || mod?.moduleId || mod?.module?.id;
    if (!user || togglingRef.current.has(modId)) return;
    
    togglingRef.current.add(modId);
    setTogglingModules(prev => ({ ...prev, [modId]: true }));
    
    try {
      const isSelected = permissions.some((permission) => permissionMatchesModule(permission, mod));
      let success = false;
      
      if (isSelected) {
        try {
          await revokePortalAccessMutation(user.id, modId);
          success = true;
        } catch (error) {
          if (error?.response?.status === 404 || error?.response?.status === 409) {
            try {
              await togglePortalAccessMutation(user.id, modId);
              success = true;
            } catch (e) {
              if (e?.response?.status === 404 || e?.response?.status === 409) success = true;
              else throw e;
            }
          } else {
            throw error;
          }
        }
        if (success) {
          setPermissions((prev) => prev.filter((p) => p !== modId));
        }
      } else {
        try {
          await grantPortalAccessMutation(user.id, modId);
          success = true;
        } catch (error) {
          if (error?.response?.status === 409) {
            try {
              await togglePortalAccessMutation(user.id, modId);
              success = true;
            } catch (e) {
              if (e?.response?.status === 409) success = true;
              else throw e;
            }
          } else {
            throw error;
          }
        }
        if (success) {
          setPermissions((prev) => [...new Set([...prev, modId])]);
        }
      }
      
      if (success) {
        dispatch(addAlert({ type: "success", message: "Portal access updated!" }));
        onUpdated?.();
      }
    } catch (error) {
      console.error("Portal access API error:", error);
    } finally {
      togglingRef.current.delete(modId);
      setTogglingModules(prev => ({ ...prev, [modId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="card max-w-md w-full p-6 space-y-6 animate-slide-up">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">
              Manage Module Access
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Assign or revoke modules for {user.name}. Changes apply instantly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-650"
          >
            ✕
          </button>
        </div>

        {canAssignModules && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-700">
                Available Company Modules
              </label>
            </div>
            {modulesLoading ? (
              <div className="p-4 bg-zinc-50 rounded-lg text-center text-sm text-zinc-500 border border-zinc-100">
                Loading active company modules...
              </div>
            ) : modulesError ? (
              <div className="p-4 bg-rose-50 rounded-lg text-center text-sm text-rose-700 border border-rose-100">
                Failed to load company modules. {modulesError?.data?.message || modulesError?.message || 'Please try again.'}
              </div>
            ) : activeModules.length === 0 ? (
              <div className="p-4 bg-zinc-50 rounded-lg text-center text-sm text-zinc-500 border border-zinc-100">
                No active company modules found.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {activeModules.map((mod) => {
                  const isSelected = permissions.some((permission) => permissionMatchesModule(permission, mod));
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      disabled={togglingModules[mod.id]}
                      onClick={() => handleTogglePortalAccess(mod)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 shadow-sm"
                          : "border-zinc-200 text-zinc-600 hover:border-primary/40 hover:bg-zinc-50"
                      } ${togglingModules[mod.id] ? "opacity-50 cursor-wait" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{mod.name || mod.label || 'Unnamed module'}</span>
                        {togglingModules[mod.id] ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2"></div>
                        ) : (
                          isSelected && <CheckCircle2 size={16} className="text-primary flex-shrink-0 ml-2" />
                        )}
                      </div>
                      {mod.host && (
                        <p className="text-[8.8px] text-zinc-500 mt-2 truncate" title={mod.host}>
                          {mod.host}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full sm:w-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
