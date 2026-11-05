import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Globe,
  Layers,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  ChevronRight,
  Boxes,
  Briefcase,
  Users,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import PortalAccessList from '../../../portal-access/pages/PortalAccessList';
import {
  getCompanyModulesByCompany,
  updateCompanyModuleStatus,
} from '../../../../api/sso/companyModules';

/**
 * OrgPortalAccessView
 *
 * Organization-level Portal & Module Access management console.
 * Enables Organization Owners to:
 * 1. View all operating companies under the organization.
 * 2. View and manage enabled module access for each company.
 * 3. View and manage user-to-module portal access.
 * 4. Enforce company and organization-level security boundaries.
 */
export default function OrgPortalAccessView({ organization, companies = [] }) {
  const dispatch = useAppDispatch();
  const orgName = organization?.name || organization?.code || 'Organization';
  const orgCode = (organization?.code || '').toUpperCase();

  // Active company selection
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    return companies.length > 0 ? companies[0].id : '';
  });

  // Keep selected company synchronized if companies list changes
  useEffect(() => {
    if (companies.length > 0) {
      const exists = companies.some((c) => c.id === selectedCompanyId);
      if (!exists) {
        setSelectedCompanyId(companies[0].id);
      }
    } else {
      setSelectedCompanyId('');
    }
  }, [companies, selectedCompanyId]);

  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;
  }, [companies, selectedCompanyId]);

  // Company Modules state
  const [companyModules, setCompanyModules] = useState([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isUpdatingModule, setIsUpdatingModule] = useState(null);

  // Fetch modules for selected company
  const loadCompanyModules = useCallback(async (companyId) => {
    if (!companyId) {
      setCompanyModules([]);
      return;
    }
    setIsLoadingModules(true);
    try {
      const res = await getCompanyModulesByCompany(companyId);
      const list = res?.companyModuleResponse || res?.data || res?.content || (Array.isArray(res) ? res : []);
      setCompanyModules(list);
    } catch (err) {
      console.error('Failed to load company modules', err);
      dispatch(
        addAlert({
          type: 'error',
          message: 'Failed to load modules for the selected company.',
        })
      );
    } finally {
      setIsLoadingModules(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (selectedCompanyId) {
      loadCompanyModules(selectedCompanyId);
    }
  }, [selectedCompanyId, loadCompanyModules]);

  // Handle module toggle
  const handleToggleModuleStatus = async (mod) => {
    const moduleId = mod.id || mod.companyModuleId;
    if (!moduleId) return;

    const currentStatus = Boolean(mod.active ?? mod.isActive ?? true);
    const newStatus = !currentStatus;

    setIsUpdatingModule(moduleId);
    try {
      await updateCompanyModuleStatus(moduleId, newStatus);
      dispatch(
        addAlert({
          type: 'success',
          message: `Module "${mod.moduleName || mod.name || 'Module'}" ${newStatus ? 'enabled' : 'disabled'} for ${selectedCompany?.name || 'company'}.`,
        })
      );
      // Reload modules
      loadCompanyModules(selectedCompanyId);
    } catch (err) {
      console.error('Failed to toggle module status', err);
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || 'Failed to update company module status.',
        })
      );
    } finally {
      setIsUpdatingModule(null);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* ── Overview Banner ── */}
      <div className="p-5 rounded-2xl bg-[var(--color-surface)] dark:bg-[#1D212C] border border-[var(--color-border)] dark:border-[#2A2F3D] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)] dark:bg-[#222736] text-[var(--color-primary)] dark:text-primary shrink-0 border border-[var(--color-border)] dark:border-[#2A2F3D]">
              <Globe size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] dark:text-[#E6E8EE]">
                Portal & Module Access
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] dark:text-[#A0A6B5] mt-0.5">
                Centralized company module entitlements and user-level portal access across {orgName}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {orgCode && (
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[var(--color-surface-2)] dark:bg-[#222736] text-[var(--color-text-primary)] dark:text-[#E6E8EE] border border-[var(--color-border)] dark:border-[#2A2F3D]">
                {orgCode}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 size={13} />
              <span>Multi-Tenant Access</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Empty State if No Companies ── */}
      {companies.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[var(--color-surface)] dark:bg-[#1D212C] border border-[var(--color-border)] dark:border-[#2A2F3D]">
          <Building2 size={36} className="mx-auto text-zinc-400 mb-3" />
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] dark:text-[#E6E8EE]">
            No Operating Companies Found
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] dark:text-[#A0A6B5] mt-1 max-w-md mx-auto">
            Please register or create an operating company first under Companies Management to manage module entitlements and user portal access.
          </p>
        </div>
      ) : (
        <>
          {/* ── 1. Company Selection Tabs ── */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[#1D212C] border border-[var(--color-border)] dark:border-[#2A2F3D]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[var(--color-primary)] dark:text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] dark:text-[#E6E8EE]">
                  Select Operating Company ({companies.length})
                </h3>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] dark:text-[#A0A6B5]">
                Switch company to view modules & user access
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {companies.map((comp) => {
                const isSelected = comp.id === selectedCompanyId;
                const compName = comp.name || comp.legalName || 'Unnamed Company';
                const compCode = (comp.code || '').toUpperCase();

                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setSelectedCompanyId(comp.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${isSelected
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-2xs'
                        : 'bg-white dark:bg-[#161922] text-[var(--color-text-primary)] dark:text-[#E6E8EE] border-[var(--color-border)] dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#222736]'
                      }`}
                  >
                    <Briefcase size={14} className={isSelected ? 'text-white' : 'text-zinc-500'} />
                    <span>{compName}</span>
                    {compCode && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5]'
                          }`}
                      >
                        {compCode}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 2. Company Enabled Modules Overview Card ── */}
          <div className="p-5 rounded-2xl bg-[var(--color-surface)] dark:bg-[#1D212C] border border-[var(--color-border)] dark:border-[#2A2F3D]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--color-border)] dark:border-[#2A2F3D]">
              <div className="flex items-center gap-2.5">
                <Layers size={18} className="text-[var(--color-primary)] dark:text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] dark:text-[#E6E8EE]">
                    Company Module Entitlements: {selectedCompany?.name || selectedCompany?.legalName}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] dark:text-[#A0A6B5]">
                    Modules provisioned and active for this specific company workspace.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadCompanyModules(selectedCompanyId)}
                disabled={isLoadingModules}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE]"
              >
                <RefreshCw size={12} className={isLoadingModules ? 'animate-spin' : ''} />
                <span>Refresh Modules</span>
              </button>
            </div>

            {isLoadingModules ? (
              <div className="py-6 flex justify-center items-center gap-2 text-xs text-zinc-500">
                <RefreshCw size={14} className="animate-spin" />
                <span>Loading company modules...</span>
              </div>
            ) : companyModules.length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-500">
                No active module records found for this company.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {companyModules.map((mod) => {
                  const isActive = Boolean(mod.active ?? mod.isActive ?? true);
                  const modName = mod.moduleName || mod.name || mod.canonicalName || 'Module';
                  const modId = mod.id || mod.companyModuleId;
                  const isUpdating = isUpdatingModule === modId;

                  return (
                    <div
                      key={modId || modName}
                      className="p-3 rounded-xl bg-white dark:bg-[#161922] border border-[var(--color-border)] dark:border-[#2A2F3D] flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-zinc-100 text-zinc-400 dark:bg-[#1D212C] dark:text-[#6B7184]'
                            }`}
                        >
                          <Boxes size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[var(--color-text-primary)] dark:text-[#E6E8EE] truncate">
                            {modName}
                          </div>
                          <span
                            className={`inline-block text-[10px] font-semibold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'
                              }`}
                          >
                            {isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      {modId && (
                        <button
                          type="button"
                          onClick={() => handleToggleModuleStatus(mod)}
                          disabled={isUpdating}
                          className={`p-1.5 rounded-lg border transition-all shrink-0 ${isActive
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                              : 'text-zinc-500 bg-zinc-100 border-zinc-200 hover:bg-zinc-200 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D]'
                            }`}
                          title={isActive ? 'Click to disable module' : 'Click to enable module'}
                        >
                          {isUpdating ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <Power size={13} />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 3. User-to-Module Portal Access Console ── */}
          <div className="w-full">
            <PortalAccessList companyId={selectedCompanyId} />
          </div>
        </>
      )}
    </div>
  );
}
