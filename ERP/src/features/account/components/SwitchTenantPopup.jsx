import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Building2,
  Check,
  ChevronRight,
  Loader2,
  Search,
  X,
  AlertCircle,
  Building,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  selectAuthContext,
  selectCurrentUser,
  selectAccessibleCompanies,
  setCredentials,
  setSsoContext,
} from '../../auth/authSlice';
import {
  selectSelectedCompany,
  selectCompanyList,
  setSelectedCompany,
} from '../../company-management/companySlice';
import {
  selectAccountCompanies,
  setAccountSelectedCompany,
  fetchAccountCompanies,
} from '../store/accountCompanySlice';
import {
  useSelectCompanyMutation,
  useSwitchCompanyMutation,
  authApi,
} from '../../auth/services/authApi';
import { useGetCompaniesQuery } from '../../../api/sso/company.api';
import { useGetOrganizationCompaniesQuery } from '../../../api/sso/organization.api';
import { baseApi } from '../../../api/common/baseApi';
import { addAlert } from '../../notifications/notificationSlice';
import { applySwitchedAuthTokens } from '../utils/switchTenantTokens';

/**
 * Normalizes a company object from any slice/API into a consistent shape.
 */
function normalizeCompanyRecord(c) {
  if (!c || typeof c !== 'object') return null;
  const rawId = c.id || c.companyId || c._id || c.code;
  if (!rawId) return null;
  const id = String(rawId).trim();
  const name = String(c.companyName || c.name || c.legalName || 'Unnamed Company').trim();
  const code = String(c.companyCode || c.code || id).trim();
  const active = c.active !== undefined ? Boolean(c.active) : (c.status ? c.status === 'ACTIVE' : true);
  const logoUrl = c.logoUrl || c.logo || '';
  const initials = (name.replace(/^[^a-zA-Z0-9]+/, '').charAt(0) || 'C').toUpperCase();

  return {
    ...c,
    id,
    companyId: id,
    name,
    companyName: name,
    code,
    companyCode: code,
    legalName: c.legalName || name,
    active,
    logoUrl,
    initials,
  };
}

  export default function SwitchTenantPopup({
    open,
    onClose,
    className = '',
    placement = 'bottom-up',
    triggerRef = null,
  }) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [isSwitching, setIsSwitching] = useState(false);
    const [switchingTargetId, setSwitchingTargetId] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const authContext = useAppSelector(selectAuthContext);
    const currentUser = useAppSelector(selectCurrentUser);
    const selectedCompany = useAppSelector(selectSelectedCompany);
    const authCompanies = useAppSelector(selectAccessibleCompanies);
    const accountCompanies = useAppSelector(selectAccountCompanies);
    const reduxCompanyList = useAppSelector(selectCompanyList);

    const effectiveUser = currentUser || authContext?.user;
    const rawRole = effectiveUser?.role || 'employee';
    const userRole = String(
      Array.isArray(rawRole) ? (rawRole[0]?.name || rawRole[0]) : (rawRole?.name || rawRole)
    ).toLowerCase();
    const isSuperAdmin = userRole === 'super_admin';
    const isOwner =
      authContext?.membership?.memberType === 'OWNER' ||
      userRole === 'owner' ||
      Boolean(authContext?.isOwner);

    const organization = authContext?.organization || effectiveUser?.organization;
    const organizationId = organization?.id || effectiveUser?.organizationId;
    const organizationName = organization?.name || effectiveUser?.organizationName || 'Organization';

    const hasAuthoritativeCompanies =
      (Array.isArray(authCompanies) && authCompanies.length > 0) ||
      (Array.isArray(authContext?.companies) && authContext.companies.length > 0);
    const canQueryOrgCompanies = isSuperAdmin || isOwner;

    // Lazy queries ONLY for super-admin/owner when authoritative company list isn't populated
    const { data: ssoCompaniesData } = useGetCompaniesQuery(
      { page: 0, pageSize: 200 },
    { skip: !open || !isSuperAdmin || hasAuthoritativeCompanies }
    );

    const { data: orgCompaniesData } = useGetOrganizationCompaniesQuery(
      { organizationId },
    { skip: !open || !canQueryOrgCompanies || !organizationId || hasAuthoritativeCompanies }
    );

    // Trigger account companies fetch only when owner/super-admin needs fallback list
    useEffect(() => {
        if (open && canQueryOrgCompanies && !hasAuthoritativeCompanies && accountCompanies.length === 0) {
          dispatch(fetchAccountCompanies());
        }
  }, [open, canQueryOrgCompanies, hasAuthoritativeCompanies, accountCompanies.length, dispatch]);

  // Focus search input when opened
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setErrorMessage(null);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [open]);

  // Click outside and ESC key listener
  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e) {
      if (triggerRef?.current && triggerRef.current.contains(e.target)) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Merge and deduplicate companies, strictly scoping regular members to authorized companies
  const companyList = useMemo(() => {
    const rawList = [];

    // 1. Auth context companies (canonical SSO /me)
    if (Array.isArray(authCompanies) && authCompanies.length > 0) {
      rawList.push(...authCompanies);
    }
    if (Array.isArray(authContext?.companies) && authContext.companies.length > 0) {
      rawList.push(...authContext.companies);
    }

      // 2. Owner/SuperAdmin-only fallback sources when org/all companies are permitted
      if (isSuperAdmin || isOwner) {
        if (Array.isArray(accountCompanies) && accountCompanies.length > 0) {
          rawList.push(...accountCompanies);
        }
        if (Array.isArray(reduxCompanyList) && reduxCompanyList.length > 0) {
          rawList.push(...reduxCompanyList);
        }
        if (ssoCompaniesData?.companies && Array.isArray(ssoCompaniesData.companies)) {
          rawList.push(...ssoCompaniesData.companies);
        }
        if (orgCompaniesData?.companies && Array.isArray(orgCompaniesData.companies)) {
          rawList.push(...orgCompaniesData.companies);
        }
      }

      // 3. Fallback to current company if list is still empty
      if (rawList.length === 0) {
        if (selectedCompany) rawList.push(selectedCompany);
        if (authContext?.currentCompany) rawList.push(authContext.currentCompany);
        if (effectiveUser?.companyId || effectiveUser?.companyCode) {
          rawList.push({
            id: effectiveUser.companyId || effectiveUser.companyCode,
            name: effectiveUser.companyName || 'Assigned Company',
            code: effectiveUser.companyCode || effectiveUser.companyId,
            active: true,
          });
        }
      }

      // Deduplicate by normalized id and omit inactive companies
      const seen = new Set();
      const result = [];

      for (const item of rawList) {
        const norm = normalizeCompanyRecord(item);
        if (!norm || norm.active === false) continue;
        const key = norm.id.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(norm);
        }
      }

      return result;
    }, [
      isSuperAdmin,
      isOwner,
      authCompanies,
      authContext?.companies,
      authContext?.currentCompany,
      accountCompanies,
      reduxCompanyList,
      ssoCompaniesData,
      orgCompaniesData,
      selectedCompany,
      effectiveUser,
    ]);

  // Active company identifiers
  const activeCompanyId = String(
    params?.companyId ||
    selectedCompany?.id ||
    selectedCompany?.companyId ||
    authContext?.currentCompany?.id ||
    effectiveUser?.companyId ||
    ''
  ).toLowerCase();

  const activeCompanyCode = String(
    selectedCompany?.code ||
    selectedCompany?.companyCode ||
    authContext?.currentCompany?.code ||
    effectiveUser?.companyCode ||
    ''
  ).toLowerCase();

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companyList;
    const lower = searchTerm.toLowerCase().trim();
    return companyList.filter((c) =>
      c.name.toLowerCase().includes(lower) ||
      c.code.toLowerCase().includes(lower) ||
      (c.legalName && c.legalName.toLowerCase().includes(lower))
    );
  }, [companyList, searchTerm]);

  const [selectCompanyApi] = useSelectCompanyMutation();
  const [switchCompanyApi] = useSwitchCompanyMutation();

  /**
   * Handle switching to target company
   */
  const handleSelectCompany = async (targetCompany) => {
    if (isSwitching) return;

    const targetId = String(targetCompany.id || targetCompany.companyId || '').trim();
    const targetCode = String(targetCompany.code || targetCompany.companyCode || '').trim();

    // If target is already active, simply close popup
    const isAlreadyActive =
      (activeCompanyId && targetId && activeCompanyId === targetId.toLowerCase()) ||
      (activeCompanyCode && targetCode && activeCompanyCode === targetCode.toLowerCase());

    if (isAlreadyActive) {
      onClose();
      return;
    }

    // Security & authorization check:
    // Ensure the target company is authorized for the current user
    const isAuthorized =
      isSuperAdmin ||
      isOwner ||
      companyList.some(
        (c) =>
          c.id.toLowerCase() === targetId.toLowerCase() ||
          (targetCode && c.code.toLowerCase() === targetCode.toLowerCase())
      );

    if (!isAuthorized) {
      setErrorMessage('You are not authorized to switch to this company.');
      return;
    }

    setIsSwitching(true);
    setSwitchingTargetId(targetId);
    setErrorMessage(null);

    try {
      let switchSuccess = false;
      let newMeContext = null;

      // 1. Call authenticated backend company-switch endpoint to validate access,
      // update session.company, and rotate JWT/refresh tokens cleanly without re-login.
      try {
        const switchRes = await switchCompanyApi({ companyId: targetCompany.id }).unwrap();
        const switchData = switchRes?.data || switchRes;
        applySwitchedAuthTokens(switchData);
        switchSuccess = true;
      } catch (switchErr) {
        console.warn('[SwitchTenant] switchCompanyApi failed:', switchErr);
        const status = switchErr?.status || switchErr?.originalStatus;
        if (status === 401 || status === 403) {
          throw new Error(
            switchErr?.data?.message || 'Access denied: You do not have permission to access this company.'
          );
        }
      }

      // 2. Clear cached domain/API queries BEFORE fetching fresh company context
      dispatch(baseApi.util.resetApiState());

      // 3. Backend validation & Context Fetch via ssoGetMe using rotated JWT
      try {
        const meResult = await dispatch(
          authApi.endpoints.ssoGetMe.initiate(
            { companyId: targetCompany.id },
            { forceRefetch: true }
          )
        ).unwrap();

        if (meResult) {
          newMeContext = meResult?.data || meResult;
          switchSuccess = true;
        }
      } catch (meErr) {
        console.warn('[SwitchTenant] ssoGetMe with companyId failed:', meErr);
        if (meErr?.status === 403 || meErr?.originalStatus === 403) {
          throw new Error('Access denied: You do not have permission to access this company.');
        }
      }

      // 4. Secondary fallback (select-company mutation) only if switch & ssoGetMe both failed
      if (!switchSuccess) {
        try {
          const orgCode = organization?.code || effectiveUser?.organizationCode;
          const selectRes = await selectCompanyApi({
            companyId: targetCompany.id,
            organizationCode: orgCode,
          }).unwrap();

          const selectData = selectRes?.data || selectRes;
          const { newToken } = applySwitchedAuthTokens(selectData);
          if (newToken) {
            switchSuccess = true;
          }
        } catch (selErr) {
          console.warn('[SwitchTenant] selectCompanyApi failed:', selErr);
        }
      }

      if (!switchSuccess) {
        throw new Error('Unable to switch company session. Please try again.');
      }

      // 3. Prepare normalized company record
      const normalizedTarget = {
        id: targetCompany.id,
        companyId: targetCompany.id,
        name: targetCompany.name,
        companyName: targetCompany.name,
        code: targetCompany.code,
        companyCode: targetCompany.code,
        legalName: targetCompany.legalName || targetCompany.name,
        active: targetCompany.active,
        logoUrl: targetCompany.logoUrl,
      };

      // 4. Update Redux states and storage
      // A) Company management slice
      dispatch(setSelectedCompany(normalizedTarget));

      // B) Account company slice (updates WorkspaceCard and account modules)
      dispatch(setAccountSelectedCompany(normalizedTarget));

      // C) Auth slice context
      if (newMeContext) {
        dispatch(setSsoContext(newMeContext));
      } else {
        dispatch(
          setCredentials({
            user: {
              ...effectiveUser,
              companyId: targetCompany.id,
              companyCode: targetCompany.code,
              companyName: targetCompany.name,
            },
            organization: authContext?.organization || organization,
            currentCompany: normalizedTarget,
            companies: authContext?.companies || companyList,
            membership: authContext?.membership,
            subscription: authContext?.subscription,
            accessMode: authContext?.accessMode,
            modules: authContext?.modules,
            features: authContext?.features,
            permissions: authContext?.permissions,
          })
        );
      }

      // D) Persist auth_user update in localStorage
      try {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem(
            'auth_user',
            JSON.stringify({
              ...parsed,
              companyId: targetCompany.id,
              companyCode: targetCompany.code,
              companyName: targetCompany.name,
            })
          );
        }
      } catch (storageErr) {
        console.warn('[SwitchTenant] Could not update auth_user in storage:', storageErr);
      }

      // 5. Notify user, close popup & load the selected company's dashboard/workspace
      dispatch(
        addAlert({
          type: 'success',
          message: `Switched active workspace to ${targetCompany.name}`,
        })
      );
      onClose();

      if (targetCompany?.id) {
        navigate(`/company/${encodeURIComponent(targetCompany.id)}/dashboard`);
      } else {
        navigate('/company-select');
      }
    } catch (err) {
      console.error('[SwitchTenant] Error during company switch:', err);
      const msg = err?.data?.message || err?.message || 'Failed to switch company. Please try again.';
      setErrorMessage(msg);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsSwitching(false);
      setSwitchingTargetId(null);
    }
  };

  if (!open) return null;

  const placementClasses =
    placement === 'top-left'
      ? 'top-full left-0 mt-2 w-80 sm:w-96'
      : placement === 'top-right'
        ? 'top-full right-0 mt-2 w-80 sm:w-96'
        : 'bottom-full left-0 right-0 mb-2 w-full';

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="switch-tenant-title"
      className={`absolute ${placementClasses} min-w-[280px] sm:min-w-[320px] bg-[var(--color-surface)] dark:bg-[#161922] border border-[var(--color-border)] dark:border-[#2A2F3D] rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95 ${className}`}
    >
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[var(--color-border)] dark:border-[#2A2F3D] bg-[var(--color-surface-2)]/70 dark:bg-[#1D212C]/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-2)] dark:bg-zinc-800 border border-[var(--color-border)] dark:border-zinc-700 flex items-center justify-center text-[var(--color-text-primary)] dark:text-[#A0A6B5] shrink-0">
            <Building2 size={15} />
          </div>
          <div className="min-w-0">
            <h3 id="switch-tenant-title" className="text-xs font-bold text-[var(--color-text-primary)] dark:text-[#E6E8EE] truncate">
              Switch Tenant
            </h3>
            <p className="text-[10px] text-[var(--color-text-secondary)] dark:text-[#A0A6B5] truncate">
              {organizationName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Switch Tenant dialog"
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── Error Banner if Switch Failed ── */}
      {errorMessage && (
        <div className="mx-3 mt-2.5 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-[#F0616D] text-xs flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span className="flex-1 leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* ── Search Input (visible if 3+ companies) ── */}
      {companyList.length > 2 && (
        <div className="px-3 pt-2.5 pb-1">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-400 dark:text-[#A0A6B5]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search companies..."
              disabled={isSwitching}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[var(--color-surface)] dark:bg-[#1D212C] border border-[var(--color-border)] dark:border-[#2A2F3D] text-[var(--color-text-primary)] dark:text-[#E6E8EE] placeholder-[var(--color-text-muted)] dark:placeholder-[#6B7184] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] transition-all disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {/* ── Company List (Scrollable) ── */}
      <div className="p-3 space-y-1.5 max-h-60 sm:max-h-72 overflow-y-auto custom-scrollbar">
        {filteredCompanies.length === 0 ? (
          <div className="py-6 px-4 text-center">
            <Building size={24} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-1.5" />
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              No companies found
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {searchTerm ? 'Try a different search term' : 'No available tenants for this account'}
            </p>
          </div>
        ) : (
          filteredCompanies.map((comp) => {
            const isCompActive =
              (activeCompanyId && comp.id.toLowerCase() === activeCompanyId) ||
              (activeCompanyCode && comp.code.toLowerCase() === activeCompanyCode);

            const isThisSwitching = isSwitching && switchingTargetId === comp.id;

            return (
              <button
                key={comp.id}
                type="button"
                disabled={isSwitching}
                onClick={() => handleSelectCompany(comp)}
                className={`w-full group flex items-center justify-between gap-3 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer select-none active:scale-[0.99] disabled:pointer-events-none ${isCompActive
                  ? 'bg-[var(--color-surface-2)] dark:bg-zinc-800 border-[var(--color-border)] dark:border-zinc-700 shadow-2xs'
                  : 'bg-[var(--color-surface)] dark:bg-[#1D212C]/60 hover:bg-[var(--color-surface-2)] dark:hover:bg-[#222736] border-[var(--color-border)] dark:border-[#2A2F3D]'
                  }`}
              >
                {/* Logo / Initials */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-[#1D212C] dark:to-[#222736] border border-zinc-200/60 dark:border-[#2A2F3D] text-zinc-700 dark:text-[#E6E8EE] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                  {comp.logoUrl ? (
                    <img
                      src={comp.logoUrl}
                      alt={comp.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    comp.initials
                  )}
                </div>

                {/* Company Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-xs font-semibold truncate ${isCompActive
                        ? 'text-[#2E3D28] dark:text-[#4C8DFF]'
                        : 'text-zinc-800 dark:text-[#E6E8EE] group-hover:text-zinc-900 dark:group-hover:text-white'
                        }`}
                    >
                      {comp.name}
                    </p>
                  </div>
                  <p className="text-[9.5px] text-zinc-400 dark:text-[#A0A6B5] truncate mt-0.5">
                    Code: <span className="font-mono">{comp.code}</span>
                  </p>
                </div>

                {/* Right Action / Active Indicator */}
                <div className="shrink-0">
                  {isThisSwitching ? (
                    <Loader2 size={15} className="animate-spin text-blue-600 dark:text-[#4C8DFF]" />
                  ) : isCompActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                      <Check size={11} className="stroke-[2.5]" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-zinc-400 group-hover:text-[#2E3D28] dark:group-hover:text-[#4C8DFF] flex items-center gap-0.5 transition-colors">
                      Switch
                      <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ── Bottom Footer Summary ── */}
      <div className="px-3.5 py-2 border-t border-[#D5D8CA] dark:border-[#2A2F3D] bg-[#EDEEE4]/50 dark:bg-[#1D212C]/40 flex items-center justify-between text-[9.5px] text-zinc-400 dark:text-[#A0A6B5]">
        <span>{companyList.length} total {companyList.length === 1 ? 'company' : 'companies'}</span>
        {isSwitching ? (
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-[#4C8DFF] font-medium">
            <Loader2 size={11} className="animate-spin" />
            Switching workspace...
          </span>
        ) : (
          <span>Click any company to switch</span>
        )}
      </div>
    </div>
  );
}

