import React from 'react';
import { ShieldX, LogOut, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectAuthContext, logout as logoutAction } from '../../features/auth/authSlice';
import { clearSelectedCompany } from '../../features/company-management/companySlice';
import { removeCookie } from '../../utils/cookieHelper';

export default function NoModuleAccessView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authContext = useAppSelector(selectAuthContext);

  const orgName = authContext.organization?.name || authContext.organization?.code || 'Organization';
  const companyName = authContext.currentCompany?.name || authContext.currentCompany?.code || 'Company';

  const handleSwitchCompany = () => {
    dispatch(clearSelectedCompany());
    navigate('/company-select');
  };

  const handleLogout = () => {
    removeCookie('auth_token');
    removeCookie('ACCESS_TOKEN');
    removeCookie('ACCESS_TOKEN_REFRESH');
    localStorage.clear();
    sessionStorage.clear();
    dispatch(logoutAction());
    navigate('/', { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-6">
      <div className="bg-white dark:bg-card-dark p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-border-dark max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldX size={32} />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">No Modules Assigned</h1>
        <p className="text-zinc-600 mb-4 leading-relaxed">
          Your account is active in <strong className="text-zinc-800">{orgName}</strong> (Company: <strong className="text-zinc-800">{companyName}</strong>), but no application modules have been entitled to your membership.
        </p>
        <p className="text-xs text-zinc-400 mb-8">
          Contact your organization administrator to assign module entitlements (Account, Inventory, or CRM).
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleSwitchCompany}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-zinc-200 font-medium text-zinc-700 hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors"
          >
            <ArrowLeftRight size={16} />
            <span>Switch Company</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
