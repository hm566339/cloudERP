import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { exchangeToken } from '../../../api/sso/token'
import { useLazySsoGetMeQuery } from '../../../features/auth/services/authApi'
import { setCredentials } from '../authSlice'
import { setSelectedCompany } from '../../company-management/companySlice'
import { baseApi } from '../../../api/common/baseApi'
import { addAlert } from '../../notifications/notificationSlice'
import { extractRoleFromToken, parseJwt } from '../../../utils/rbac'
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function SSOCallback() {
  const { buildPath } = useRoutePath();

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [triggerSsoGetMe] = useLazySsoGetMeQuery()

  useEffect(() => {
    const processSsoCallback = async () => {
      const code = searchParams.get('code')
      if (!code) {
        dispatch(addAlert({ type: 'error', message: 'No authorization code found in URL.' }))
        navigate(buildPath('/login'))
        return
      }

      try {
        const response = await exchangeToken({
          code,
          clientId: 'app',
          clientSecret: ''
        })

        const tokenData = response?.data || response;
        const accessToken = tokenData?.access_token || tokenData?.accessToken;
        
        let tokenRole = 'viewer';
        if (accessToken) {
          const decoded = parseJwt(accessToken);
          if (decoded) {
            tokenRole = extractRoleFromToken(accessToken, decoded) || 'viewer';
          }
        }

        const meResult = await triggerSsoGetMe().unwrap()
        const ssoData = meResult?.data || meResult

        dispatch(setCredentials({
          user: ssoData?.user || ssoData,
          organization: ssoData?.organization,
          currentCompany: ssoData?.currentCompany,
          companies: ssoData?.companies,
          membership: ssoData?.membership,
          subscription: ssoData?.subscription,
          accessMode: ssoData?.accessMode,
          modules: ssoData?.modules,
          features: ssoData?.features,
          permissions: ssoData?.permissions,
        }))

        if (ssoData?.currentCompany) {
          dispatch(setSelectedCompany({
            id: ssoData.currentCompany.id || ssoData.currentCompany.code,
            name: ssoData.currentCompany.name || ssoData.currentCompany.code,
            code: ssoData.currentCompany.code
          }))
        }

        let rawRole = ssoData?.role || ssoData?.roles || ssoData?.membership?.memberType
        if (typeof rawRole === 'string') tokenRole = rawRole.toLowerCase()
        else if (Array.isArray(rawRole)) tokenRole = (rawRole[0]?.name || String(rawRole[0])).toLowerCase()
        else if (rawRole && typeof rawRole === 'object') tokenRole = (rawRole.name || 'viewer').toLowerCase()

        if (tokenRole === 'super_admin') {
          navigate('/super-admin/dashboard', { replace: true })
        } else {
          // Navigate to the Common ERP Shell workspace.
          // The workspace will load the SSO /me context (org, company, subscription, modules)
          // and redirect to the appropriate module dashboard automatically.
          navigate('/workspace', { replace: true })
        }
      } catch (err) {
        console.error("SSO Callback failed", err)
        dispatch(addAlert({ type: 'error', message: err?.data?.message || err.message || 'SSO Authentication failed.' }))
        navigate(buildPath('/login'))
      }
    }

    processSsoCallback()
  }, [searchParams, exchangeToken, navigate, dispatch])

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] w-full animate-fade-in">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-6" />
      <h2 className="text-xl font-bold text-zinc-800">Authenticating...</h2>
      <p className="text-sm text-zinc-500 mt-2">Please wait while we verify your SSO credentials.</p>
    </div>
  )
}
