import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, Layers } from "lucide-react";
import { getCompanyModulesByCompany } from "../../../api/sso/companyModules";
import { getUserById, grantPortalAccess, removePortalAccess, togglePortalAccess } from "../../../api/sso/user";

/**
 * Modal for assigning/revoking module access for a user.
 * Fetches the active modules assigned to the user's company and
 * loads the user's current permissions when opened.
 */
export default function UserModuleAccessModal({
  isOpen,
  onClose,
  user,
  companyId,
  availableModules = [],
  initialPermissions = [],
  grantPortalAccessMutation,
  revokePortalAccessMutation,
  togglePortalAccessMutation,
  canAssignModules = true,
  modulesLoading: externalLoading = false,
  modulesError: externalError = null,
  onUpdated,
}) {
  const dispatch = useAppDispatch();
  const [loadedModules, setLoadedModules] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [togglingModules, setTogglingModules] = useState({});
  const togglingRef = useRef(new Set());

  // Resolve target company ID from explicit prop, user object, or storage
  const resolvedCompanyId = useMemo(() => {
    if (companyId) return companyId;
    if (user?.companyId) return user.companyId;
    if (user?.company?.id) return user.company.id;
    if (typeof user?.company === "string" && user.company.length > 10) return user.company;
    try {
      const storedComp = JSON.parse(localStorage.getItem("selected_company") || "null");
      if (storedComp?.id) return storedComp.id;
      const authUser = JSON.parse(localStorage.getItem("auth_user") || "null");
      if (authUser?.companyId) return authUser.companyId;
    } catch {
      // ignore
    }
    return null;
  }, [companyId, user]);

  const fetchModalData = useCallback(async () => {
    if (!user) return;

    if (!resolvedCompanyId) {
      setFetchError("Unable to identify the company for this user. Please ensure a company is selected.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      // Concurrently fetch company's active modules and latest user details
      const [modulesResult, userResult] = await Promise.allSettled([
        getCompanyModulesByCompany(resolvedCompanyId, { active: true }),
        user.id ? getUserById(user.id) : Promise.resolve(null),
      ]);

      // 1. Process active company modules
      if (modulesResult.status === "fulfilled") {
        const raw = modulesResult.value;
        const rawList = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
          ? raw
          : raw?.companyModuleResponse || raw?.content || [];

        const normalizedModules = rawList
          .filter((m) => m?.status !== false && m?.status !== "INACTIVE")
          .map((m) => ({
            id: m.id || m.companyModuleId,
            companyModuleId: m.id || m.companyModuleId,
            moduleId: m.moduleId || m.module?.id,
            globalId: m.moduleId || m.module?.id,
            name: m.name || m.module?.name || m.moduleName || m.label || "Unnamed Module",
            label: m.name || m.module?.name || m.moduleName || m.label || "Unnamed Module",
            host: m.host || m.module?.host || "",
            status: m.status !== false && m.status !== "INACTIVE",
          }));

        setLoadedModules(normalizedModules);
      } else {
        console.error("Failed to load company modules:", modulesResult.reason);
        setFetchError(
          modulesResult.reason?.response?.data?.message ||
          modulesResult.reason?.message ||
          "Failed to load company modules."
        );
      }

      // 2. Process user permissions
      let userPerms = [];
      if (userResult.status === "fulfilled" && userResult.value) {
        const freshUser = userResult.value?.data || userResult.value;
        if (Array.isArray(freshUser?.portalAccess)) {
          userPerms = freshUser.portalAccess;
        }
      }

      if (userPerms.length === 0) {
        if (Array.isArray(initialPermissions) && initialPermissions.length > 0) {
          userPerms = initialPermissions;
        } else if (Array.isArray(user.portalAccess)) {
          userPerms = user.portalAccess;
        }
      }

      const activePerms = userPerms.filter((pa) => {
        if (typeof pa === "object" && pa !== null) {
          return pa.status !== false && pa.status !== "INACTIVE";
        }
        return Boolean(pa);
      });

      setPermissions(activePerms);
    } catch (err) {
      console.error("Error in fetchModalData:", err);
      setFetchError("Error loading module access data.");
    } finally {
      setIsLoading(false);
    }
  }, [user, resolvedCompanyId, initialPermissions]);

  useEffect(() => {
    if (isOpen && user) {
      fetchModalData();
    } else {
      setLoadedModules([]);
      setPermissions([]);
      setFetchError(null);
      setIsLoading(false);
    }
  }, [isOpen, user?.id, resolvedCompanyId, fetchModalData]);

  // Combine loadedModules with any prop-passed availableModules as fallback
  const activeModules = useMemo(() => {
    if (loadedModules.length > 0) return loadedModules;
    if (Array.isArray(availableModules) && availableModules.length > 0) {
      return availableModules
        .filter((mod) => mod?.status !== false && mod?.status !== "INACTIVE")
        .map((m) => ({
          id: m.id || m.companyModuleId,
          companyModuleId: m.id || m.companyModuleId,
          moduleId: m.moduleId || m.module?.id,
          globalId: m.moduleId || m.module?.id,
          name: m.name || m.module?.name || m.moduleName || m.label || "Unnamed Module",
          label: m.name || m.module?.name || m.moduleName || m.label || "Unnamed Module",
          host: m.host || m.module?.host || "",
          status: true,
        }));
    }
    return [];
  }, [loadedModules, availableModules]);

  if (!isOpen || !user) return null;

  const permissionMatchesModule = (permission, mod) => {
    if (!permission || !mod) return false;

    const modCompanyModuleId = String(mod.id || mod.companyModuleId || "");
    const modModuleId = String(mod.moduleId || mod.globalId || mod.module?.id || "");
    const modName = String(mod.name || mod.label || mod.moduleName || mod.module?.name || "").trim().toLowerCase();
    const modHost = String(mod.host || mod.module?.host || "").trim();

    if (typeof permission === "object" && permission !== null) {
      const pCompanyModuleId = String(permission.companyModuleId || permission.companyModule?.id || "");
      const pModuleId = String(permission.moduleId || permission.module?.id || "");
      const pName = String(permission.moduleName || permission.name || permission.module?.name || "").trim().toLowerCase();
      const pId = String(permission.id || "");
      const pHost = String(permission.host || permission.module?.host || "").trim();

      if (modCompanyModuleId && pCompanyModuleId && modCompanyModuleId === pCompanyModuleId) return true;
      if (modCompanyModuleId && pId && modCompanyModuleId === pId) return true;
      if (modModuleId && pModuleId && modModuleId === pModuleId) return true;
      if (modName && pName && modName === pName) return true;
      if (modHost && pHost && modHost === pHost) return true;
      return false;
    }

    const rawStr = String(permission).trim();
    if (modCompanyModuleId && modCompanyModuleId === rawStr) return true;
    if (modModuleId && modModuleId === rawStr) return true;
    if (modName && rawStr.toLowerCase() === modName) return true;
    return false;
  };

  const handleTogglePortalAccess = async (mod) => {
    const modId = mod?.id || mod?.companyModuleId;
    if (!user || !modId || togglingRef.current.has(modId)) return;

    togglingRef.current.add(modId);
    setTogglingModules((prev) => ({ ...prev, [modId]: true }));

    const isSelected = permissions.some((permission) => permissionMatchesModule(permission, mod));

    try {
      let success = false;
      const modTitle = mod.name || mod.label || "Module";

      if (isSelected) {
        try {
          if (revokePortalAccessMutation) {
            await revokePortalAccessMutation(user.id, modId);
            success = true;
          } else {
            await removePortalAccess(user.id, modId);
            success = true;
          }
        } catch (error) {
          if (error?.response?.status === 404 || error?.response?.status === 409) {
            try {
              if (togglePortalAccessMutation) {
                await togglePortalAccessMutation(user.id, modId);
              } else {
                await togglePortalAccess(user.id, modId);
              }
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
          setPermissions((prev) => prev.filter((p) => !permissionMatchesModule(p, mod)));
          dispatch(addAlert({ type: "success", message: `Revoked access to ${modTitle}` }));
          onUpdated?.();
        }
      } else {
        try {
          if (grantPortalAccessMutation) {
            await grantPortalAccessMutation(user.id, modId);
            success = true;
          } else {
            await grantPortalAccess(user.id, modId);
            success = true;
          }
        } catch (error) {
          if (error?.response?.status === 409) {
            try {
              if (togglePortalAccessMutation) {
                await togglePortalAccessMutation(user.id, modId);
              } else {
                await togglePortalAccess(user.id, modId);
              }
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
          setPermissions((prev) => [...prev.filter((p) => !permissionMatchesModule(p, mod)), mod]);
          dispatch(addAlert({ type: "success", message: `Granted access to ${modTitle}` }));
          onUpdated?.();
        }
      }
    } catch (error) {
      console.error("Portal access API error:", error);
      const msg = error?.response?.data?.message || error?.message || "Failed to update module access";
      dispatch(addAlert({ type: "error", message: msg }));
    } finally {
      togglingRef.current.delete(modId);
      setTogglingModules((prev) => ({ ...prev, [modId]: false }));
    }
  };

  const loading = isLoading || externalLoading;
  const currentError = fetchError || externalError;
  const assignedCount = activeModules.filter((mod) =>
    permissions.some((p) => permissionMatchesModule(p, mod))
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="card max-w-md w-full p-6 space-y-6 animate-slide-up bg-white rounded-2xl shadow-2xl border border-zinc-200">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-zinc-700" />
              <h3 className="text-lg font-bold text-zinc-900">
                Manage Module Access
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Assign or revoke active company modules for <strong className="text-zinc-800">{user.name || user.fullName || user.username}</strong>. Changes apply instantly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {canAssignModules && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-8 bg-zinc-50 rounded-xl text-center flex flex-col items-center justify-center gap-2 border border-zinc-100">
                <Loader2 className="animate-spin text-zinc-500" size={24} />
                <span className="text-sm font-medium text-zinc-600">
                  Loading active company modules...
                </span>
              </div>
            ) : currentError ? (
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    {typeof currentError === "string" ? currentError : currentError?.data?.message || currentError?.message || "Failed to load company modules."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchModalData}
                  className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} /> Try again
                </button>
              </div>
            ) : activeModules.length === 0 ? (
              <div className="p-6 bg-zinc-50 rounded-xl text-center text-sm text-zinc-500 border border-zinc-100 flex flex-col items-center justify-center gap-1">
                <AlertCircle className="text-zinc-400 mb-1" size={24} />
                <span className="font-medium text-zinc-700">No active company modules found.</span>
                <span className="text-xs text-zinc-500">Ensure this company has modules assigned and enabled.</span>
                <button
                  type="button"
                  onClick={fetchModalData}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-500 font-medium px-0.5">
                  <label className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">
                    Available Company Modules
                  </label>
                  <span>{assignedCount} of {activeModules.length} assigned</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {activeModules.map((mod) => {
                    const isSelected = permissions.some((permission) =>
                      permissionMatchesModule(permission, mod)
                    );
                    const isToggling = Boolean(togglingModules[mod.id]);

                    return (
                      <button
                        key={mod.id}
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleTogglePortalAccess(mod)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all text-left cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 shadow-xs"
                            : "border-zinc-200 text-zinc-600 hover:border-primary/40 hover:bg-zinc-50"
                        } ${isToggling ? "opacity-50 cursor-wait" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate font-semibold">{mod.name || mod.label || "Unnamed module"}</span>
                          {isToggling ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2 shrink-0"></div>
                          ) : (
                            isSelected && <CheckCircle2 size={16} className="text-primary flex-shrink-0 ml-2" />
                          )}
                        </div>
                        {mod.host && (
                          <p className="text-[10px] font-mono text-zinc-400 mt-1.5 truncate" title={mod.host}>
                            {mod.host}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
          <button
            type="button"
            onClick={fetchModalData}
            disabled={loading}
            className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1.5 px-2 py-1 rounded transition-colors"
            title="Reload modules"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary px-5 py-2 text-xs font-semibold rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
