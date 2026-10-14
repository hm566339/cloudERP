import React, { useMemo } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import {
  Building2, Users, Box, ShoppingCart,
  Briefcase, Banknote, Factory, Shield,
  Layers, Lock, Globe, ShieldCheck
} from 'lucide-react';
import { normalizeModuleKey, getCompanyModuleAssignments, getUnifiedNavigationModules } from '../../../utils/moduleAccess';

const MODULES_MAP = {
  'finance': { name: 'Finance & Accounts', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', path: 'accounts/dashboard' },
  'accounting': { name: 'Finance & Accounts', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', path: 'accounts/dashboard' },
  'account': { name: 'Finance & Accounts', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', path: 'accounts/dashboard' },
  'crm': { name: 'Sales & CRM', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: 'sales' },
  'inventory': { name: 'Inventory Management', icon: Box, color: 'text-amber-600', bg: 'bg-amber-50', path: 'inventory' },
  'sales': { name: 'Sales & CRM', icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50', path: 'sales' },
  'purchase': { name: 'Purchase Management', icon: Briefcase, color: 'text-rose-600', bg: 'bg-rose-50', path: 'purchases' },
  'purchases': { name: 'Purchase Management', icon: Briefcase, color: 'text-rose-600', bg: 'bg-rose-50', path: 'purchases' },
  'hr': { name: 'HR & Employees', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', path: 'hr' },
  'manufacturing': { name: 'Manufacturing', icon: Factory, color: 'text-orange-600', bg: 'bg-orange-50', path: 'manufacturing' },
  'admin': { name: 'SSO & Administration', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', path: 'admin' },
  'sso': { name: 'SSO & Administration', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', path: 'admin' },
  'dashboard': { name: 'Company Dashboard', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50', path: 'company-dashboard' }
};

export default function CompanyModules() {
  const navigate = useNavigate();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const outletCtx = useOutletContext() || {};
  const { accessibleModuleKeys = [], accessLoading = false, companyModulesData, authContext, isOwner } = outletCtx;

  const handleModuleClick = (path, active) => {
    if (!active) return;
    const cleanPath = path?.startsWith('/') ? path.slice(1) : (path || 'dashboard');
    if (companyId) {
      navigate(`/company/${companyId}/${cleanPath}`);
    } else {
      navigate(`/${cleanPath}`);
    }
  };

  const displayModules = useMemo(() => {
    // Start with the standard dashboard card
    const modules = [{
      id: 'dashboard',
      name: 'Company Dashboard',
      technicalKey: 'dashboard',
      icon: Layers,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      path: 'company-dashboard',
      active: true
    }];

    const unified = getUnifiedNavigationModules({
      authContext,
      companyModulesData,
      companyId,
      userRole: isOwner ? 'owner' : undefined,
    });

    const seenKeys = new Set(['dashboard']);

    unified.forEach((mod) => {
      const key = mod.key;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const config = MODULES_MAP[key] || {
        name: mod.name,
        icon: mod.icon || Globe,
        color: mod.color || 'text-zinc-600',
        bg: mod.bg || 'bg-zinc-100',
        path: mod.path || key,
      };

      modules.push({
        id: mod.id,
        name: mod.name || config.name,
        technicalKey: mod.technicalKey || key,
        icon: config.icon || mod.icon || Globe,
        color: config.color || mod.color,
        bg: config.bg || mod.bg,
        path: config.path || mod.path,
        active: mod.active,
      });
    });

    return modules;
  }, [companyModulesData, authContext, companyId, isOwner]);

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] w-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-zinc-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-none px-6 sm:px-8 py-6 space-y-6 animate-fade-in pb-12"
      style={{ width: '100%', maxWidth: 'none' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-zinc-900 tracking-tight">Modules</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Select a module to access dashboard and capabilities.</p>
        </div>
        {displayModules.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 bg-zinc-100/80 border border-zinc-200/80 px-3 py-1.5 rounded-lg w-fit">
            <span>{displayModules.filter(m => m.active).length} Active</span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-500">{displayModules.length} Total</span>
          </div>
        )}
      </div>

      {/* Modules Grid */}
      {displayModules.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-white/50 backdrop-blur-sm">
          <Layers className="mx-auto text-zinc-300 mb-4" size={32} />
          <p className="text-base font-bold text-zinc-700">No modules available</p>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">This tenant does not have any modules assigned yet, or they have been disabled.</p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px'
          }}
        >
          {displayModules.map((mod, index) => {
            const Icon = mod.icon;

            return (
              <div
                key={`${mod.id}-${index}`}
                onClick={() => handleModuleClick(mod.path, mod.active)}
                role={mod.active ? "button" : undefined}
                tabIndex={mod.active ? 0 : undefined}
                onKeyDown={(e) => {
                  if (mod.active && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleModuleClick(mod.path, mod.active);
                  }
                }}
                className={`w-full min-h-[170px] p-5 bg-white rounded-xl border flex flex-col items-center justify-between text-center transition-all duration-200 ease-out select-none group ${mod.active
                    ? 'border-zinc-200 hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                    : 'border-zinc-200/60 bg-zinc-50/40 opacity-65 grayscale cursor-not-allowed'
                  }`}
              >
                <div className="flex flex-col items-center w-full">
                  {/* Module Icon Container */}
                  <div className={`w-12 h-12 rounded-xl ${mod.bg} border border-zinc-100 flex items-center justify-center mb-3.5 transition-transform duration-200 group-hover:scale-105 shadow-2xs`}>
                    <Icon className={mod.color} size={22} strokeWidth={1.75} />
                  </div>

                  {/* Module Display Name */}
                  <h3 className={`text-[15px] font-semibold text-center leading-snug line-clamp-1 ${mod.active ? 'text-zinc-900' : 'text-zinc-500'}`}>
                    {mod.name}
                  </h3>

                  {/* Technical Module Identifier */}
                  <span className="text-[12px] font-mono text-zinc-400 mt-1 block tracking-tight">
                    {mod.technicalKey || '\u00A0'}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-1">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${mod.active
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                      : 'text-zinc-500 bg-zinc-100 border border-zinc-200/60'
                    }`}>
                    {mod.active ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </>
                    ) : (
                      <>
                        <Lock size={12} className="text-zinc-400" />
                        Locked
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
