import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { exchangeToken } from '../../../api/sso/token';
import { useLazyGetMeQuery, useLazySsoGetMeQuery } from '../../../features/auth/services/authApi';
import { setCredentials } from '../authSlice';
import { setSelectedCompany } from '../../company-management/companySlice';
import { extractRoleFromToken, parseJwt } from '../../../utils/rbac';
import { getCookie } from '../../../utils/cookieHelper';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useDispatch();
  const [triggerGetMe] = useLazyGetMeQuery();
  const [triggerSsoGetMe] = useLazySsoGetMeQuery();
  const [error, setError] = useState(null);
  
  // Prevent strict mode double-firing which can consume single-use auth codes
  const hasProcessed = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const code = searchParams.get('code');
      const queryToken = searchParams.get('token') || searchParams.get('accessToken') || searchParams.get('access_token');
      
      // If we got a token in the query params, save it to cookies so the proxy can attach it
      if (queryToken) {
        document.cookie = `ACCESS_TOKEN=${queryToken}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `auth_token=${queryToken}; path=/; max-age=86400; SameSite=Lax`;
      }
      
      const cookieToken = queryToken || getCookie('ACCESS_TOKEN') || getCookie('auth_token') || getCookie('access_token');
      
      try {
        let activeToken = cookieToken;
        if (code && !activeToken) {
          const customClientId = searchParams.get('clientId');
          const customClientSecret = searchParams.get('clientSecret');
          try {
            // Generic ERP Callback exchanges authorization code directly with SSO service
            const exchangePayload = { code };
            if (customClientId) exchangePayload.clientId = customClientId;
            if (customClientSecret) exchangePayload.clientSecret = customClientSecret;

            const exchangeResult = await exchangeToken(exchangePayload);
            const tokenData = exchangeResult?.data || exchangeResult;
            const newAccessToken = tokenData?.access_token || tokenData?.accessToken;
            const newRefreshToken = tokenData?.refresh_token || tokenData?.refreshToken;
            if (newAccessToken) {
              document.cookie = `ACCESS_TOKEN=${newAccessToken}; path=/; max-age=86400; SameSite=Lax`;
              document.cookie = `auth_token=${newAccessToken}; path=/; max-age=86400; SameSite=Lax`;
              activeToken = newAccessToken;
            }
            if (newRefreshToken) {
              document.cookie = `ACCESS_TOKEN_REFRESH=${newRefreshToken}; path=/; max-age=604800; SameSite=Lax`;
            }
          } catch (exchangeErr) {
            console.error('[AuthCallback] SSO authorization code exchange failed:', exchangeErr);
            const msg = exchangeErr?.response?.data?.message || exchangeErr?.message || 'Failed to exchange authorization code';
            setError(msg);
            setTimeout(() => navigate(buildPath('/login')), 3000);
            return;
          }
        }
        let decodedToken = null;
        let tokenRole = 'viewer';
        if (activeToken) {
          decodedToken = parseJwt(activeToken);
          if (decodedToken) {
            tokenRole = extractRoleFromToken(activeToken, decodedToken) || 'viewer';
          }
        }
        
        const isAdminContext = tokenRole === 'super_admin';

        let finalUser = decodedToken ? { ...decodedToken } : {};

        let meData = null;
        try {
          // Global ERP Shell: always use SSO /me as the single canonical source of truth
          const meResult = await triggerSsoGetMe().unwrap();
          meData = meResult?.data || meResult;
          finalUser = { ...finalUser, ...meData };
        } catch (meErr) {
          console.warn('Could not fetch user profile from me endpoint, continuing with token session', meErr);
        }
        let userRole = tokenRole;
        let mappedPermissions = finalUser.permissions || [];

        if (decodedToken) {
          finalUser = { ...finalUser, ...decodedToken };
          mappedPermissions = meData?.permissions || decodedToken.permissions || decodedToken.modules || finalUser.permissions || (userRole === 'super_admin' ? ['all'] : ['dashboard']);
        } else {
           userRole = extractRoleFromToken(null, finalUser) || 'viewer';
           mappedPermissions = meData?.permissions || finalUser.permissions || (userRole === 'super_admin' ? ['all'] : ['dashboard']);
        }

        const mergedUser = { ...finalUser, role: userRole };

        const orgCode = mergedUser.organizationCode || decodedToken?.organizationCode || meData?.organization?.code;
        if (orgCode && !mergedUser.subscription && !meData?.subscription) {
          try {
            const cachedSub = sessionStorage.getItem(`trial_sub_${orgCode.toLowerCase()}`);
            if (cachedSub) {
              mergedUser.subscription = JSON.parse(cachedSub);
            }
          } catch (e) {}
        }

        dispatch(setCredentials({
          user: mergedUser,
          organization: meData?.organization,
          currentCompany: meData?.currentCompany,
          companies: meData?.companies,
          membership: meData?.membership,
          subscription: meData?.subscription || mergedUser.subscription,
          accessMode: meData?.accessMode,
          modules: meData?.modules,
          features: meData?.features,
          permissions: mappedPermissions,
        }));

        if (mergedUser.companyCode || mergedUser.companyId) {
          dispatch(setSelectedCompany({
            id: mergedUser.companyCode || mergedUser.companyId,
            name: mergedUser.companyName || 'Assigned Company',
            code: mergedUser.companyCode
          }));
        }

        // Redirect to intended destination
        const destination = sessionStorage.getItem('auth_redirect') || '/';
        sessionStorage.removeItem('auth_redirect');
        
        // Ensure destination is a relative path or frontend URL
        if (destination.startsWith('http') && !destination.startsWith(window.location.origin)) {
          window.location.href = destination;
        } else {
          let path = destination;
          if (path.startsWith(window.location.origin)) {
            path = path.replace(window.location.origin, '');
          }
          if (path.startsWith('/erp/')) {
            path = path.replace(/^\/erp/, '');
          }
          if (!path || path === '/' || path === '/login' || path === '/accounts/dashboard' || path === '/account/dashboard') {
            path = isAdminContext ? '/super-admin/dashboard' : '/workspace';
          }
          navigate(path, { replace: true });
        }
      } catch (err) {
        console.error("SSO Callback failed", err);
        const msg = err?.response?.data?.message || err.message || 'Authentication failed';
        setError(msg);
        setTimeout(() => navigate(buildPath('/login')), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate, triggerGetMe, dispatch]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Authenticating...</h2>
        <p className="text-sm text-gray-500">Please wait while we verify your session.</p>
      </div>
    </div>
  );
}
