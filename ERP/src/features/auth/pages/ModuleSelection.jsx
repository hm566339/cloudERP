import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, Box, ShoppingCart,
  Briefcase, Banknote, Factory, Shield,
  ArrowRight
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectCurrentUser, selectIsAuthenticated, setCredentials } from '../authSlice';
import { getCookie } from '../../../utils/cookieHelper';
import { parseJwt, extractRoleFromToken } from '../../../utils/rbac';
import { setSelectedCompany } from '../../company-management/companySlice';
import { useRoutePath } from "../../../hooks/useRoutePath";

const MODULES = [
  { id: 'accounts', name: 'Finance & Accounts', description: 'General ledger, taxation & reporting', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { id: 'crm', name: 'CRM', description: 'Customer relationship management', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
  { id: 'inventory', name: 'Inventory', description: 'Stock, warehouses & transfers', icon: Box, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  { id: 'sales', name: 'Sales', description: 'Orders, invoicing & dispatch', icon: ShoppingCart, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  { id: 'purchase', name: 'Purchase', description: 'Procurement & vendor management', icon: Briefcase, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
  { id: 'hr', name: 'HR & Payroll', description: 'Employee management & payroll', icon: Building2, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
  { id: 'manufacturing', name: 'Manufacturing', description: 'Production & quality control', icon: Factory, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
  { id: 'sso', name: 'Super Admin', description: 'Global system configuration', icon: Shield, color: 'text-zinc-700', bg: 'bg-zinc-100', border: 'border-zinc-200', path: '/admin-login' }
];

export default function ModuleSelection() {
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    let activeUser = currentUser;
    const cookieToken = getCookie('ACCESS_TOKEN') || getCookie('auth_token');

    if (!activeUser && cookieToken) {
      const decoded = parseJwt(cookieToken);
      if (decoded) {
        const role = extractRoleFromToken(cookieToken, decoded);
        activeUser = { ...decoded, role };
        dispatch(setCredentials({
          user: activeUser,
          permissions: decoded.permissions || decoded.modules || (role === 'super_admin' ? ['all'] : [])
        }));
        if (decoded.companyCode || decoded.companyId) {
          dispatch(setSelectedCompany({
            id: decoded.companyCode || decoded.companyId,
            name: decoded.companyName || 'Assigned Company',
            code: decoded.companyCode || decoded.companyId
          }));
        }
      }
    }

    if (activeUser) {
      if (activeUser.role === 'super_admin') {
        navigate('/super-admin/dashboard', { replace: true });
      } else if (activeUser.companyCode || activeUser.companyId) {
        const compId = activeUser.companyCode || activeUser.companyId;
        navigate(`/company/${compId}/accounts/dashboard`, { replace: true });
      } else {
        navigate('/company-select', { replace: true });
      }
    }
  }, [currentUser, isAuthenticated, navigate, dispatch]);

  const handleModuleClick = (mod) => {
    if (mod.path) {
      navigate(mod.path);
    } else {
      const cookieToken = getCookie('ACCESS_TOKEN') || getCookie('auth_token');
      if (currentUser || cookieToken) {
        const compId = currentUser?.companyCode || currentUser?.companyId;
        if (compId) {
          navigate(`/company/${compId}/accounts/dashboard`);
        } else {
          navigate(buildPath('/dashboard'));
        }
      } else {
        navigate(`/company-select?module=${mod.id}`);
      }
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 sm:p-12 w-full max-w-5xl mx-auto animate-fade-in-up relative overflow-hidden">

      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="relative z-10 space-y-3 mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
          <Building2 size={24} className="text-primary" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-black text-zinc-900 tracking-tight">Enterprise Hub</h2>
        <p className="text-sm sm:text-base text-zinc-500 font-medium max-w-md mx-auto">Select a centralized module to access your workspace and manage operations.</p>
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => handleModuleClick(mod)}
              className="flex flex-col items-start p-5 bg-white border border-zinc-200/80 rounded-2xl hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group active:scale-[0.98] relative overflow-hidden text-left"
            >
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              <div className="flex items-center justify-between w-full mb-4">
                <div className={`w-12 h-12 ${mod.bg} border ${mod.border} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 shadow-sm relative z-10`}>
                  <Icon className={mod.color} size={22} strokeWidth={2} />
                </div>
                <ArrowRight size={18} className="text-zinc-300 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </div>

              <div className="relative z-10">
                <span className="block text-base font-bold text-zinc-800 mb-1 group-hover:text-primary transition-colors">{mod.name}</span>
                <span className="block text-[8.8px] font-medium text-zinc-500 leading-snug">{mod.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
