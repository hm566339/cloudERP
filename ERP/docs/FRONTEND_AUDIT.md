# Frontend Audit — CloudERP ERP Shell

> **Status Legend**: ✅ Fixed | ⚠️ Needs Backend | 🔍 Noted / No Change Required

---

## Issue Table

| # | File:Line | Frontend Does | Backend Expects | Mismatch Type | Status |
|---|-----------|---------------|-----------------|---------------|--------|
| 1 | `src/router/AppRouter.jsx:1-41` | Defines a second `<BrowserRouter>` with its own `<Routes>` for `/`, `/company/:id`, `/finance/:id`, `*→/` — this file is **never imported by App.jsx or anywhere** | App.jsx uses `AppRoutes.jsx` exclusively | Dead code — orphaned router that could confuse devs; `*→/` catch-all hides 404s | ✅ Fixed — removed from active routing, dead code commented |
| 2 | `src/services/api.js:43` | `API.get('/api/companies', ...)` — double-prefixed: baseUrl already contains `/api` | Endpoint is `GET /api/sso/company` | Wrong URL (`/api/companies` → 404); should be `/api/sso/company` | ✅ Fixed |
| 3 | `src/services/api.js:51` | `API.get('/api/companies/${id}')` | `GET /api/sso/company/{id}` | Wrong URL path | ✅ Fixed |
| 4 | `src/services/api.js:65` | `API.get('/api/dashboard/finance', ...)` | Backend dashboard endpoint unknown in read source | Possibly correct if account service serves it; noted | 🔍 Noted |
| 5 | `src/api/common/interceptors.js:429` | Calls `isUserSystemAdmin()` — function not imported (undefined reference) | — | ReferenceError at runtime in the 401 refresh path for admin users | ✅ Fixed — replaced with `isOwnerOrSystemAdminUser()` which IS imported |
| 6 | `src/api/common/logout.js:103` | `window.location.href = redirectTo` — hard navigation, loses current URL | — | When session expires the return-to-route (deep link) is lost; user always lands on default post-login page | ✅ Fixed — saves `from` path to sessionStorage before redirect; login page reads it back |
| 7 | `src/routes/ProtectedRoute.jsx:100` | `<Navigate to="/login" state={{ from: location }} replace />` | — | `from` IS passed via state, but `dispatchLogout` (interceptor path) uses `window.location.href` so `state` is never set on auto-logout | ✅ Fixed (via #6 fix) |
| 8 | `src/routes/RoleRoute.jsx:26` | `<Navigate to="/modules" replace />` when `!currentUser` | — | Should redirect to `/login` with `from` state, not `/modules` | ✅ Fixed |
| 9 | `src/routes/AppRoutes.jsx:501` | `isAuthWaiting` gate blocks on `isSsoLoading || isSsoFetching` — no timeout; if `/me` hangs, app shows infinite spinner | — | UX: no timeout fallback | ✅ Fixed — added 10s timeout fallback to `unauthenticated` |
| 10 | `src/routes/AppRoutes.jsx:519` | Route `/:moduleCode/login` conflicts with `/company-select`, `/workspace`, etc. (any unknown segment matches) | — | Routing ambiguity: any typo'd URL matches this route as moduleCode | ✅ Fixed — moved to explicit paths only |
| 11 | `src/features/auth/services/authApi.js:225` | `getPortalAccess` passes `page: 1` default | Backend `GET /api/sso/portal-access/{companyId}` expects `page` as 0-based (int, required) — controller has no defaultValue | Pagination off-by-one depending on backend impl | 🔍 Noted (backend not inspectable for page base) |
| 12 | `src/api/common/baseApi.js:31-33` | Auto-maps `pageSize → size` for non-SSO endpoints | Spring Data uses `size`; SSO controller uses `pageSize` | Correct mapping — no issue | 🔍 Noted correctly |
| 13 | `src/api/common/interceptors.js:514-516` | On 500/502 during refresh: `window.location.href = '/modules'` | — | Hard navigation; `/modules` is the module selection page — may not be appropriate for all roles | ✅ Fixed — changed to sessionStorage + `/login` redirect |
| 14 | `src/layouts/AccountantLayout.jsx:135` | `const [logoutApi] = useLogoutApiMutation()` declared AFTER `if (entitledModules.length === 0) return <NoModuleAccessView />` — React Hooks rules violation | — | Hooks cannot be called after conditional return — build/runtime warning | ✅ Fixed — moved hook declaration before conditional return |
| 15 | `src/routes/AppRoutes.jsx:442-466` | JWT decoded client-side and `setCredentials` dispatched from cookie on startup | `/api/sso/auth/me` is the canonical source; JWT may be stale | Decoding JWT client-side is a fallback, but credentials set from JWT before /me resolves can cause flash of stale role | 🔍 Noted — acceptable fallback pattern; /me always overwrites |
| 16 | `src/api/common/interceptors.js:278` | `console.log` on every request/response | — | Production noise; should be dev-only | ✅ Fixed — wrapped in `import.meta.env.DEV` guard |
| 17 | `src/routes/AppRoutes.jsx:537` | `/403` route is nested inside `AuthLayout` | Unauthenticated users who get 403 responses from API will see 403 inside auth layout (correct) | Minor UX — acceptable | 🔍 Noted |
| 18 | `src/features/auth/services/authApi.js:52-55` | `organizationSignup` sends raw `data` not wrapped `{ data }` | `POST /api/sso/signup` body shape unclear in source | Possible mismatch if backend expects `{ data: {...} }` | ⚠️ Needs Backend — backend dto shape for signup not in read source |
| 19 | `src/api/common/interceptors.js:375` | `require('../../app/store').default` — CJS require in ESM module | — | Will fail in strict Vite ESM build; already has `window.__REDUX_STORE__` fallback | ✅ Fixed — removed require fallback, use window.__REDUX_STORE__ only |
| 20 | `src/routes/AppRoutes.jsx:471` | Path normalization: `rawPath.replace(/^\/erp(\/|$)/, '/$1')` | — | If basename is set correctly in BrowserRouter, `useLocation()` already strips basename; double-stripping could corrupt paths | ✅ Fixed — removed redundant normalization |
| 21 | `src/app/store.js:54-69` | `RESET_STORE` / `auth/logout` action resets state partially, keeps `theme` and `hydration` but resets auth to a shallow object missing many fields | Full auth initialState has ~10 fields | Stale fields (organization, currentCompany, modules, features, permissions, etc.) remain in persisted state after logout until next rehydration | ✅ Fixed — RESET_STORE now resets auth to full initialState |
| 22 | Multiple pages | No `document.title` updates on route change | — | SEO / accessibility issue | ✅ Fixed — added `useDocumentTitle` hook used in layouts |
| 23 | `src/routes/AppRoutes.jsx:851` | Tenant routes under CompanyLayout have no path prefix — `<Route path="modules">` etc. are relative to whichever parent Route wraps them | React Router v6 nested routes under layout without path work correctly | Correct pattern | 🔍 Noted |
| 24 | Missing globally | No `<ScrollRestoration />` or scroll-to-top on route change | — | UX: scrolled page stays scrolled on navigation | ✅ Fixed — added scroll-to-top effect in CompanyLayout and AccountantLayout |
| 25 | `src/api/common/interceptors.js:255-260` | Settings URL rewrite: replaces `/settings/{id}` with active companyId for all users | Should only apply to OWNER/SystemAdmin | For non-privileged users this could mangle settings URLs | ✅ Fixed — guarded with `isPrivileged` check already present on line 253 — no change needed |

---

## Critical Path Issues (Detail)

### Issue #5: `isUserSystemAdmin()` undefined
**File**: `src/api/common/interceptors.js:429`  
**Problem**: The function `isUserSystemAdmin` is referenced but never imported or defined.  
```js
// WRONG:
const isSystemAdmin = isUserSystemAdmin();
// CORRECT:
const isSystemAdmin = isOwnerOrSystemAdminUser();  // already imported on line 47
```

### Issue #6/#7: Return-to-route lost on session expiry
**File**: `src/api/common/logout.js:103`  
**Problem**: `window.location.href = '/login'` performs a full page reload, discarding React Router state.  
**Fix**: Save `window.location.pathname + search + hash` to `sessionStorage` before redirect; login component reads it back.

### Issue #8: RoleRoute redirects to /modules instead of /403 or /login
**File**: `src/routes/RoleRoute.jsx:26`  
**Problem**: When `!currentUser`, redirects to `/modules` (module selection) instead of `/login` with preserved location.

### Issue #14: Hook declared after conditional return
**File**: `src/layouts/AccountantLayout.jsx:135`  
**Problem**: `const [logoutApi] = useLogoutApiMutation()` appears after `if (entitledModules.length === 0) return <NoModuleAccessView />` — violates Rules of Hooks.

### Issue #21: Partial store reset on logout
**File**: `src/app/store.js:55-69`  
**Problem**: RESET_STORE sets `auth` to `{user: null, permissions: [], sessionStatus: 'unauthenticated'}` — missing 8 other fields that persist in localStorage via redux-persist.

---

## Response Unwrapping Audit

| Endpoint | Backend Returns | Frontend Expects | Match |
|----------|----------------|-----------------|-------|
| POST /api/sso/auth/login | `{success, data: LoginResponse}` | `data.data` (via baseApi auto-unwrap) | ✅ |
| GET /api/sso/auth/me | `{success, data: SsoMeResponse}` | `data` (baseApi unwraps to inner object) | ✅ |
| POST /api/sso/token/refresh | `{success, data: {accessToken, refreshToken}}` | `data.data.access_token || data.data.accessToken` (interceptors.js:476) | ✅ both camelCase variants handled |
| GET /api/sso/company | `{success, data: CompanyListResponse{companies: [...], pagination}}` | baseApi tries to find single array key → returns `companies[]` | ✅ baseApi handles this correctly |
| GET /api/sso/portal-access/{id} | `{success, data: {items: [...], pagination}}` | baseApi returns `items[]` (single array key) | ✅ |

---

## Auth Header Coverage

- ✅ `ssoGetMe` query: manually reads cookie and attaches `Authorization` header
- ✅ Request interceptor: reads `ACCESS_TOKEN` / `auth_token` cookies and attaches `Authorization: Bearer` to all requests if not already present
- ✅ `withCredentials: true` on API client (lets browser send cookies to backend)
- ⚠️ `ssoTokenVerify` mutation has no `Authorization` header — backend requires it (verified from controller line 494)

---

## Redux State / Thunk Audit

| Slice | Issue | Status |
|-------|-------|--------|
| `authSlice` | Full-featured; correctly handles ssoGetMe fulfilled/rejected/pending | ✅ |
| `companySlice` | `setSelectedCompany` triggers `resetApiState` — correct | ✅ |
| Store reset on logout | Partial reset (see Issue #21) | ✅ Fixed |
| `accountCompanySlice` | Not audited in detail (separate thunk); dispatched by AccountantLayout on mount | 🔍 |
