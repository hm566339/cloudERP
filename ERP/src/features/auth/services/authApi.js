import { baseApi } from '../../../api/common/baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ──────────────────────────────────────────────────────────────────────────
    // SSO Auth Controller (/api/sso/auth/*)
    // ──────────────────────────────────────────────────────────────────────────

    /** POST /api/sso/auth/login — Regular user login */
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/sso/auth/login',
        method: 'POST',
        data: { data: credentials },
      }),
      invalidatesTags: ['Auth', 'Session', 'User'],
    }),

    /** POST /api/sso/auth/admin-login — Super admin login */
    adminLogin: builder.mutation({
      query: (credentials) => ({
        url: '/api/sso/auth/admin-login',
        method: 'POST',
        data: { data: credentials },
      }),
      invalidatesTags: ['Auth', 'Session', 'User'],
    }),

    /** POST /api/sso/auth/logout — SSO logout (requires Authorization header) */
    logoutApi: builder.mutation({
      query: () => ({
        url: '/api/sso/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'Session', 'User', 'Company'],
    }),

    /** POST /api/sso/auth/register — Register a new user */
    register: builder.mutation({
      query: (data) => ({
        url: '/api/sso/auth/register',
        method: 'POST',
        data: { data },
      }),
      invalidatesTags: ['User'],
    }),

    /** POST /api/sso/signup — Register organization for 30-day free trial */
    organizationSignup: builder.mutation({
      query: (data) => ({
        url: '/api/sso/signup',
        method: 'POST',
        data,
      }),
    }),

    /** GET /api/sso/organization/{organizationCode} — Lookup organization for login */
    getOrganization: builder.query({
      query: (organizationCode) => ({
        url: `/api/sso/organization/${encodeURIComponent(organizationCode)}`,
        method: 'GET',
      }),
      providesTags: ['Organization'],
    }),

    /** POST /api/sso/auth/select-company — Select company within organization */
    selectCompany: builder.mutation({
      query: (data) => ({
        url: '/api/sso/auth/select-company',
        method: 'POST',
        data: { data },
      }),
      invalidatesTags: ['Auth', 'Session', 'Company'],
    }),

    /** GET /api/sso/auth/me — Get current SSO user profile (Authorization header) */
    ssoGetMe: builder.query({
      query: (arg) => {
        let token = '';
        if (typeof document !== 'undefined') {
          const match = document.cookie.match(new RegExp('(^| )ACCESS_TOKEN=([^;]+)')) ||
                        document.cookie.match(new RegExp('(^| )auth_token=([^;]+)')) ||
                        document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
          if (match) token = match[2];
        }
        let requestedCompanyId = null;
        if (typeof arg === 'string' || typeof arg === 'number') {
          requestedCompanyId = arg;
        } else if (arg && typeof arg === 'object') {
          requestedCompanyId = arg.companyId || arg.id;
        }
        if (!requestedCompanyId && typeof window !== 'undefined') {
          try {
            const saved = localStorage.getItem('selected_company');
            if (saved) {
              const parsed = JSON.parse(saved);
              const id = parsed?.id || parsed?.companyId;
              if (id && id !== 'undefined' && id !== 'null') {
                requestedCompanyId = id;
              }
            }
          } catch (e) {}
        }
        return {
          url: '/api/sso/auth/me',
          method: 'GET',
          params: requestedCompanyId ? { companyId: requestedCompanyId } : undefined,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        };
      },
      providesTags: ['Auth', 'User'],
    }),

    // ──────────────────────────────────────────────────────────────────────────
    // Account Auth Controller (/api/account/auth/*)
    // ──────────────────────────────────────────────────────────────────────────

    /** GET /api/account/auth/me — Get current user from cookie session */
    getMe: builder.query({
      query: () => ({
        url: '/api/account/auth/me',
        method: 'GET',
      }),
      providesTags: ['Auth', 'Session', 'User'],
    }),

    /** GET /api/account/auth/verify — Verify ACCESS_TOKEN cookie */
    accountVerify: builder.query({
      query: () => ({
        url: '/api/account/auth/verify',
        method: 'GET',
      }),
      providesTags: ['Auth', 'Session'],
    }),

    /** POST /api/account/auth/logout — Logout from account (cookie-based) */
    accountLogout: builder.mutation({
      query: () => ({
        url: '/api/account/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'Session', 'User', 'Company'],
    }),

    /** GET /api/account/auth/login?companyCode=... — OAuth redirect login */
    accountOAuthLogin: builder.query({
      query: (companyCode) => ({
        url: '/api/account/auth/login',
        method: 'GET',
        params: { companyCode },
      }),
    }),

    /** GET /api/account/auth/callback?code=... — OAuth callback */
    accountCallback: builder.query({
      query: (code) => ({
        url: '/api/account/auth/callback',
        method: 'GET',
        params: { code },
      }),
    }),

    // ──────────────────────────────────────────────────────────────────────────
    // SSO Token Controller (/api/sso/token/*)
    // ──────────────────────────────────────────────────────────────────────────

    /** POST /api/sso/token/refresh — Refresh access token */
    refreshToken: builder.mutation({
      query: (data) => ({
        url: '/api/sso/token/refresh',
        method: 'POST',
        data: { data },
      }),
    }),

    /** POST /api/sso/admin/token/refresh — Refresh admin access token */
    adminRefreshToken: builder.mutation({
      query: (data) => ({
        url: '/api/sso/admin/token/refresh',
        method: 'POST',
        data: { data },
      }),
    }),

    /** POST /api/sso/token/verify — Verify SSO token (Authorization header) */
    ssoTokenVerify: builder.mutation({
      query: () => ({
        url: '/api/sso/token/verify',
        method: 'POST',
      }),
      // No invalidation, read-only verification
    }),

    /** POST /api/sso/token/exchange — Exchange auth code for tokens */
    ssoTokenExchange: builder.mutation({
      query: (data) => ({
        url: '/api/sso/token/exchange',
        method: 'POST',
        data: { data },
      }),
    }),

    /** POST /api/sso/token/revoke — Revoke a token */
    ssoTokenRevoke: builder.mutation({
      query: (data) => ({
        url: '/api/sso/token/revoke',
        method: 'POST',
        data: { data },
      }),
      invalidatesTags: ['Auth', 'Session'],
    }),

    // ──────────────────────────────────────────────────────────────────────────
    // SSO Portal Access & Authorization
    // ──────────────────────────────────────────────────────────────────────────

    /** GET /api/sso/portal-access/{companyId} — List portal access entries */
    getPortalAccess: builder.query({
      query: ({ companyId, page = 1, pageSize = 5, search, status }) => ({
        url: `/api/sso/portal-access/${companyId}`,
        method: 'GET',
        params: { page, pageSize, search, status },
      }),
      providesTags: ['PortalAccess'],
    }),

    /** GET /api/sso/authorize — Authorize user for a module */
    ssoAuthorize: builder.query({
      query: ({ userId, moduleId }) => ({
        url: '/api/sso/authorize',
        method: 'GET',
        params: { user_id: userId, module_id: moduleId },
      }),
    }),
  }),
});

export const {
  // SSO Auth
  useLoginMutation,
  useAdminLoginMutation,
  useLogoutApiMutation,
  useRegisterMutation,
  useOrganizationSignupMutation,
  useGetOrganizationQuery,
  useLazyGetOrganizationQuery,
  useSelectCompanyMutation,
  useSsoGetMeQuery,
  useLazySsoGetMeQuery,

  // Account Auth
  useGetMeQuery,
  useLazyGetMeQuery,
  useAccountVerifyQuery,
  useLazyAccountVerifyQuery,
  useAccountLogoutMutation,
  useAccountOAuthLoginQuery,
  useLazyAccountOAuthLoginQuery,
  useAccountCallbackQuery,
  useLazyAccountCallbackQuery,

  // Token
  useRefreshTokenMutation,
  useAdminRefreshTokenMutation,
  useSsoTokenVerifyMutation,
  useSsoTokenExchangeMutation,
  useSsoTokenRevokeMutation,

  // Portal Access & Authorization
  useGetPortalAccessQuery,
  useLazyGetPortalAccessQuery,
  useSsoAuthorizeQuery,
  useLazySsoAuthorizeQuery,
} = authApi;
