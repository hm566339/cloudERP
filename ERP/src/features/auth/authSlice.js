import { createSlice, createSelector } from '@reduxjs/toolkit';
import { authApi } from './services/authApi.js';
import {
  normalizeModuleName,
  normalizeRole,
  normalizeModulesList,
  normalizeFeaturesList,
  normalizePermissionsList,
  buildAuthContext,
} from '../../utils/moduleNormalization.js';

const initialState = {
  user: null,
  // Global ERP shell context — sourced canonically from SSO /me
  organization: null,       // { id, code, name, status, accessMode, timezone, currency }
  activeOrganizationId: null, // UUID of active organization
  activeCompanyId: null,      // UUID of active company
  currentCompany: null,     // { id, code, name, legalName, active, membership, modules }
  companies: [],            // All accessible companies for the org member
  membership: null,         // { memberId, memberType, membershipStatus, joinedAt }
  subscription: null,       // { id, planCode, status, accessMode, trialing, daysRemaining, trialEndsAt, ... }
  accessMode: 'FULL',       // Effective access mode: FULL | READ_ONLY | BLOCKED
  modules: [],              // Authorized module contexts: [{ id, name, code, canonical, host, active }]
  features: [],             // Authorized feature contexts: [{ featureCode, featureName, moduleName, active }]
  permissions: [],          // Authorized permissions: [{ featureCode, action, permissionCode, moduleName, active, allowed }]
  sessionStatus: 'idle',    // 'idle' | 'checking' | 'authenticated' | 'unauthenticated'
};

/**
 * Apply the rich SSO /me response shape to the Redux state.
 * Sourced canonically from GET /api/sso/auth/me
 */
function applySsoMePayload(state, payload) {
  const data = payload?.data || payload;
  if (!data) return;

  const normalized = buildAuthContext(payload);

  state.user = {
    ...(state.user || {}),
    ...normalized.user,
  };

  if (normalized.organization) state.organization = normalized.organization;
  state.activeOrganizationId = normalized.activeOrganizationId || normalized.organization?.id || null;
  state.activeCompanyId = normalized.activeCompanyId || normalized.currentCompany?.id || null;
  if (normalized.currentCompany) state.currentCompany = normalized.currentCompany;
  if (normalized.companies && normalized.companies.length > 0) state.companies = normalized.companies;
  if (normalized.membership) state.membership = normalized.membership;
  if (normalized.subscription) state.subscription = normalized.subscription;
  if (normalized.accessMode) state.accessMode = normalized.accessMode;
  if (normalized.modules) state.modules = normalized.modules;
  if (normalized.features) state.features = normalized.features;
  if (normalized.permissions) state.permissions = normalized.permissions;

  state.sessionStatus = 'authenticated';
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      if (action.payload.permissions) {
        state.permissions = normalizePermissionsList(action.payload.permissions);
      }
      if (action.payload.features) {
        state.features = normalizeFeaturesList(action.payload.features);
      }
      if (action.payload.organization) state.organization = action.payload.organization;
      state.activeOrganizationId = action.payload.activeOrganizationId || action.payload.organization?.id || null;
      state.activeCompanyId = action.payload.activeCompanyId || action.payload.currentCompany?.id || null;
      if (action.payload.currentCompany) state.currentCompany = action.payload.currentCompany;
      if (action.payload.companies) state.companies = action.payload.companies;
      if (action.payload.membership) state.membership = action.payload.membership;
      if (action.payload.subscription) state.subscription = action.payload.subscription;
      if (action.payload.accessMode) state.accessMode = action.payload.accessMode;
      if (action.payload.modules) {
        state.modules = normalizeModulesList(action.payload.modules);
      }
      state.sessionStatus = 'authenticated';
    },

    /** Partial update of SSO context (e.g. after company switch) */
    setSsoContext: (state, action) => {
      applySsoMePayload(state, action.payload);
    },

    logout: (state) => {
      state.user = null;
      state.permissions = [];
      state.features = [];
      state.organization = null;
      state.activeOrganizationId = null;
      state.activeCompanyId = null;
      state.currentCompany = null;
      state.companies = [];
      state.membership = null;
      state.subscription = null;
      state.accessMode = 'FULL';
      state.modules = [];
      state.sessionStatus = 'unauthenticated';
    },

    clearAuthState: (state) => {
      state.user = null;
      state.permissions = [];
      state.features = [];
      state.organization = null;
      state.activeOrganizationId = null;
      state.activeCompanyId = null;
      state.currentCompany = null;
      state.companies = [];
      state.membership = null;
      state.subscription = null;
      state.accessMode = 'FULL';
      state.modules = [];
      state.sessionStatus = 'unauthenticated';
    },

    setSessionStatus: (state, action) => {
      state.sessionStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ── SSO /me pending → mark sessionStatus checking
    builder.addMatcher(
      authApi.endpoints.ssoGetMe.matchPending,
      (state) => {
        if (state.sessionStatus !== 'authenticated' || !state.modules || state.modules.length === 0) {
          state.sessionStatus = 'checking';
        }
      }
    );

    // ── SSO /me fulfilled → apply rich canonical context (PRIMARY)
    builder.addMatcher(
      authApi.endpoints.ssoGetMe.matchFulfilled,
      (state, { payload }) => {
        applySsoMePayload(state, payload);
      }
    );

    // ── Account /me fulfilled → backward-compat
    builder.addMatcher(
      authApi.endpoints.getMe.matchFulfilled,
      (state, { payload }) => {
        if (!state.organization || !state.modules || state.modules.length === 0) {
          applySsoMePayload(state, payload);
        } else {
          state.sessionStatus = 'authenticated';
        }
      }
    );

    // ── Account /me rejected → unauth on 401/403 or no active user
    builder.addMatcher(
      authApi.endpoints.getMe.matchRejected,
      (state, action) => {
        const payload = action?.payload;
        const error = action?.error;
        const status = payload?.status || payload?.originalStatus || error?.status || error?.originalStatus;
        const isAuthRejection = status === 401 || status === 403;
        let hasCookieToken = false;
        if (typeof document !== 'undefined') {
          const value = `; ${document.cookie}`;
          hasCookieToken = value.includes('; ACCESS_TOKEN=') || value.includes('; auth_token=');
        }
        if (isAuthRejection || (!hasCookieToken && !state.user)) {
          state.user = null;
          state.permissions = [];
          state.features = [];
          state.organization = null;
          state.currentCompany = null;
          state.companies = [];
          state.membership = null;
          state.subscription = null;
          state.accessMode = 'FULL';
          state.modules = [];
          state.sessionStatus = 'unauthenticated';
        } else {
          state.sessionStatus = 'unauthenticated';
        }
      }
    );

    // ── SSO /me rejected → unauth on 401 or 403
    builder.addMatcher(
      authApi.endpoints.ssoGetMe.matchRejected,
      (state, action) => {
        const payload = action?.payload;
        const error = action?.error;
        const status = payload?.status || payload?.originalStatus || error?.status || error?.originalStatus;
        const requestedCompany = action?.meta?.arg?.originalArgs || action?.meta?.arg;
        const isCompanyForbidden = status === 403 && !!requestedCompany && !!state.user;

        if (isCompanyForbidden) {
          // User is forbidden from this specific company, but still has valid user session.
          // Invalidate the company context without wiping user credentials.
          state.currentCompany = null;
          if (typeof localStorage !== 'undefined') {
            try { localStorage.removeItem('selected_company'); } catch (e) {}
          }
          return;
        }

        const isAuthRejection = status === 401 || status === 403;

        // When unauthenticated (401 or root /me forbidden) or if session fails during bootstrap
        if (isAuthRejection || !state.user) {
          state.user = null;
          state.permissions = [];
          state.features = [];
          state.organization = null;
          state.currentCompany = null;
          state.companies = [];
          state.membership = null;
          state.subscription = null;
          state.accessMode = 'FULL';
          state.modules = [];
          state.sessionStatus = 'unauthenticated';
        } else {
          // If server returned 5xx or network error, mark as unauthenticated so UI does not stay in 'checking'
          state.sessionStatus = 'unauthenticated';
        }
      }
    );

    // ── Logout fulfilled → clear everything
    builder.addMatcher(
      authApi.endpoints.logoutApi.matchFulfilled,
      (state) => {
        state.user = null;
        state.permissions = [];
        state.features = [];
        state.organization = null;
        state.currentCompany = null;
        state.companies = [];
        state.membership = null;
        state.subscription = null;
        state.accessMode = 'FULL';
        state.modules = [];
        state.sessionStatus = 'unauthenticated';
      }
    );
  },
});

export const { setCredentials, setSsoContext, logout, setSessionStatus, clearAuthState } = authSlice.actions;

export default authSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectCurrentUser = (state) => state.auth?.user ?? null;
export const selectSessionStatus = (state) => state.auth?.sessionStatus ?? 'idle';
export const selectIsAuthenticated = (state) =>
  state.auth?.sessionStatus === 'authenticated' && !!state.auth?.user;
export const selectPermissions = (state) => state.auth?.permissions ?? [];
export const selectFeatures = (state) => state.auth?.features ?? [];

// Global ERP shell selectors
export const selectOrganization = (state) => state.auth?.organization ?? null;
export const selectCurrentCompany = (state) => state.auth?.currentCompany ?? null;
export const selectAccessibleCompanies = (state) => state.auth?.companies ?? [];
export const selectMembership = (state) => state.auth?.membership ?? null;
export const selectSubscription = (state) => state.auth?.subscription ?? null;
export const selectAccessMode = (state) => state.auth?.accessMode ?? 'FULL';
export const selectAuthorizedModules = (state) => state.auth?.modules ?? [];
export const selectActiveOrganizationId = (state) => state.auth?.activeOrganizationId ?? null;
export const selectActiveCompanyId = (state) => state.auth?.activeCompanyId ?? null;

/**
 * Returns the single canonical authorization context object (memoized to prevent re-renders)
 */
export const selectAuthContext = createSelector(
  [
    (state) => state.auth?.user ?? null,
    (state) => state.auth?.organization ?? null,
    (state) => state.auth?.activeOrganizationId ?? null,
    (state) => state.auth?.activeCompanyId ?? null,
    (state) => state.auth?.currentCompany ?? null,
    (state) => state.auth?.companies ?? null,
    (state) => state.auth?.membership ?? null,
    (state) => state.auth?.subscription ?? null,
    (state) => state.auth?.accessMode ?? 'FULL',
    (state) => state.auth?.modules ?? null,
    (state) => state.auth?.features ?? null,
    (state) => state.auth?.permissions ?? null,
  ],
  (user, organization, activeOrganizationId, activeCompanyId, currentCompany, companies, membership, subscription, accessMode, modules, features, permissions) => ({
    user,
    organization,
    activeOrganizationId: activeOrganizationId || organization?.id || null,
    activeCompanyId: activeCompanyId || currentCompany?.id || null,
    currentCompany,
    companies: companies || [],
    membership,
    subscription,
    accessMode,
    modules: modules || [],
    features: features || [],
    permissions: permissions || [],
  })
);

/** true if the current session is in 30-day trial and trial has not expired */
export const selectIsTrialing = (state) => {
  const sub = state.auth?.subscription;
  return sub?.trialing === true;
};

/** Days remaining in trial (or subscription period). 0 if expired. */
export const selectDaysRemaining = (state) => {
  return state.auth?.subscription?.daysRemaining ?? 0;
};

/** true if the user has FULL access (trial or paid) */
export const selectIsFullAccess = (state) => state.auth?.accessMode === 'FULL';

/** true if the user is in READ_ONLY mode (trial expired, unpaid) */
export const selectIsReadOnly = (state) => state.auth?.accessMode === 'READ_ONLY';

/** true if the user is BLOCKED */
export const selectIsBlocked = (state) => state.auth?.accessMode === 'BLOCKED';
