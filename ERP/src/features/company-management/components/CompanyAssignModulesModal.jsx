import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Layers, X, Check, Plus } from "lucide-react";
import { TableSkeleton } from "../../../components/common/SkeletonLoader";

/**
 * Modal to assign modules to a tenant company.
 */
export default function CompanyAssignModulesModal({
  assignTenant,
  setAssignTenant,
  modulesLoading,
  companyModulesLoading,
  modulesData,
  companyModulesData,
  handleToggleAssign,
  onClose
}) {
  const handleClose = () => {
    if (onClose) onClose();
    if (setAssignTenant) setAssignTenant(null);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (assignTenant) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [assignTenant]);

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && assignTenant) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [assignTenant]);

  if (!assignTenant) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const modulesList = Array.isArray(modulesData) ? modulesData : (modulesData?.modules || []);
  const companyModules = companyModulesData?.companyModuleResponse || (Array.isArray(companyModulesData) ? companyModulesData : []);

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in"
    >
      <div 
        className="bg-white dark:bg-card-dark w-[calc(100vw-24px)] sm:w-[560px] max-w-[560px] max-h-[calc(100vh-32px)] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-border-dark my-auto shrink-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-modules-title"
      >
        {/* ── Fixed Header ── */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-100 dark:border-[#2A2F3D] shrink-0 bg-zinc-50/50">
          <div className="flex items-start gap-3 min-w-0 pr-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-2xs">
              <Layers size={18} />
            </div>
            <div className="min-w-0">
              <h3 id="assign-modules-title" className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight leading-snug truncate">
                Assign Modules
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                Manage capabilities for <span className="font-semibold text-zinc-800">{assignTenant.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-lg transition-colors active:scale-95 shrink-0 cursor-pointer"
            aria-label="Close dialog"
            title="Close"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* ── Scrollable Module List ── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-2.5 custom-scrollbar bg-white dark:bg-card-dark">
          {modulesLoading || companyModulesLoading ? (
            <div className="p-4 w-full"><TableSkeleton columns={3} rows={3} /></div>
          ) : modulesList.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 text-xs">
              No application modules available to assign.
            </div>
          ) : (
            modulesList.map((m) => {
              const assignedCompanyModule = companyModules.find((cm) => {
                const assignedModuleId = cm.module?.id || cm.moduleId || cm.module || cm.id;
                const assignedCompanyId = cm.company?.id || cm.companyId || cm.company;
                const companyMatches = !assignedCompanyId || assignedCompanyId?.toString() === assignTenant.id?.toString();
                return companyMatches && assignedModuleId?.toString() === m.id?.toString();
              });
              const isAssigned = !!assignedCompanyModule;

              return (
                <div 
                  key={m.id} 
                  className="flex items-center justify-between p-3 sm:p-3.5 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors bg-zinc-50/50 hover:bg-zinc-50 group"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <h4 className="font-semibold text-zinc-900 text-sm truncate" title={m.name}>
                      {m.name}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-zinc-500 font-mono mt-0.5 truncate" title={m.host}>
                      {m.host || "No host pattern"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAssign(m, isAssigned, assignedCompanyModule)}
                    className={`shrink-0 h-[32px] px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isAssigned
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 group/btn'
                        : 'bg-white dark:bg-surface-dark border border-zinc-300 dark:border-border-dark text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-hover-dark/40 hover:text-zinc-900 active:scale-95'
                    }`}
                    title={isAssigned ? "Click to unassign module" : "Click to assign module"}
                    aria-label={`${isAssigned ? 'Unassign' : 'Assign'} ${m.name}`}
                  >
                    {isAssigned ? (
                      <>
                        <Check size={13} strokeWidth={2.5} className="group-hover/btn:hidden" />
                        <span className="group-hover/btn:hidden">Assigned ✓</span>
                        <X size={13} strokeWidth={2.5} className="hidden group-hover/btn:inline" />
                        <span className="hidden group-hover/btn:inline">Remove</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} strokeWidth={2.5} />
                        <span>Assign</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* ── Fixed Footer ── */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 shrink-0 bg-zinc-50/40">
          <button
            type="button"
            onClick={handleClose}
            className="w-full h-[38px] flex items-center justify-center font-semibold text-xs text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
