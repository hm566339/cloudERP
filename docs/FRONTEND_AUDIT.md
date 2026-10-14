# Frontend Audit — CloudERP Multi-Service Integration

> **Audit Context**: Comprehensive evaluation of frontend code against the backend API contract across SSO, Account, Inventory, Workflow, and Communication services.  
> **Status Legend**:  
> - ✅ Fixed (Resolved in frontend code)  
> - ⚠️ Needs Backend (Backend issue identified; recorded under Backend Issues, frontend adapted)  
> - 🔍 Verified / Expected (Validated against backend contract; no mismatch)

---

## 1. Issue & Audit Table

| # | File:Line | Frontend Does | Backend Expects | Mismatch Type | Status |
|---|-----------|---------------|-----------------|---------------|--------|
| 1 | `src/router/AppRouter.jsx:1-41` | Defines redundant `<BrowserRouter>` with orphaned routes never imported by `App.jsx` | `App.jsx` uses `AppRoutes.jsx` exclusively | Dead code / routing ambiguity | ✅ Fixed |
| 2 | `src/services/api.js:43` | `API.get('/api/companies')` double-prefixes `/api` | `GET /api/sso/company` | Wrong URL path | ✅ Fixed |
| 3 | `src/services/api.js:51` | `API.get('/api/companies/${id}')` | `GET /api/sso/company/{id}` | Wrong URL path | ✅ Fixed |
| 4 | `src/api/common/interceptors.js:429` | Reference to undefined `isUserSystemAdmin()` | Uses `isOwnerOrSystemAdminUser()` | Runtime ReferenceError in refresh path | ✅ Fixed |
| 5 | `src/api/common/interceptors.js:519` | `window.location.href = '/login'` | Subpath `/erp/login` under `/erp/` deployment | Hardcoded path breaks under reverse proxy | ✅ Fixed |
| 6 | `src/api/common/logout.js:54-57` | `redirectTo` defaults to `/erp/` landing page | Canonical post-logout destination is `/erp/login` | Redirect destination | ✅ Fixed |
| 7 | `src/api/common/logout.js:98` | Return-to-route state preserved in `sessionStorage` (`auth_return_to`) | Login restores destination via `from` / `auth_return_to` / `?redirect=` | Return-to-route preservation | ✅ Fixed |
| 8 | `src/routes/RoleRoute.jsx:26` | When `!currentUser`, redirects to `/modules` | Must redirect to `/login` with `from` state | Broken unauthenticated redirect | ✅ Fixed |
| 9 | `src/routes/AppRoutes.jsx:1090` | `<Route path="*" element={<SmartRedirect />} />` silently redirects | Catch-all must render dedicated 404 Not Found view | Missing 404 catch-all view | ✅ Fixed |
| 10 | `src/features/auth/pages/Register.jsx:23` | Already logged-in users visiting `/register` can register again | Logged-in users should redirect to role home | Missing logged-in guard on register | ✅ Fixed |
| 11 | `src/layouts/CompanyLayout.jsx:182` | Module mismatch redirects silently to `dashboard` | Unauthorized module access must navigate to `/403` | Silent redirect instead of 403 guard | ✅ Fixed |
| 12 | `src/layouts/AccountantLayout.jsx:131` | `useLogoutApiMutation()` hook called after conditional return | React rules of hooks: hook called unconditionally | React hook ordering error | ✅ Fixed |
| 13 | `src/app/store.js:54-69` | `RESET_STORE` sets shallow `auth` object on logout | Must reset full `initialState` to purge stale auth fields | Memory & persistent state leakage | ✅ Fixed |
| 14 | `src/features/auth/services/authApi.js:52-55` | `signup` sends raw unwrapped body | `POST /api/sso/signup` expects unwrapped body (unlike other auth APIs) | Inconsistent backend DTO wrapper | 🔍 Verified (Frontend matches backend) |
| 15 | `src/features/auth/services/authApi.js:225` | `getPortalAccess` requires `page` and `pageSize` | `GET /api/sso/portal-access/{companyId}` has no defaults on controller | Backend requires mandatory query params | ⚠️ Needs Backend (Frontend supplies both) |
| 16 | `src/api/common/interceptors.js:255` | Injects `companyId` query param for privileged roles only | Non-privileged roles fail if `companyId` query param is sent | Tenancy scoping | 🔍 Verified (Frontend correctly gates) |
| 17 | `src/api/common/interceptors.js:375` | Used CJS `require('../../app/store')` | Strict ESM build in Vite | ESM compatibility | ✅ Fixed |
| 18 | `src/routes/paths.js` | Paths were scattered across components | Central single source of truth for paths & routes | Hardcoded paths | ✅ Fixed |
| 19 | `src/components/common/Can.jsx` | Missing component-level permission wrapper | Required `<Can permission="...">` component | Gating & authorization | ✅ Fixed |
| 20 | `src/hooks/useAuth.js` | Missing unified `useAuth()` hook | Expose `useAuth()`, `hasRole()`, `can()` | Unified auth context | ✅ Fixed |

---

## 2. API Response Unwrapping Verification

| Domain | Endpoint | Backend Shape | Frontend Handling | Result |
|--------|----------|---------------|-------------------|--------|
| Auth | `POST /api/sso/auth/login` | `{ success: true, data: { accessToken, user, ... } }` | `baseApi` auto-unwraps `response.data` | ✅ Compatible |
| Auth | `GET /api/sso/auth/me` | `{ success: true, data: SsoMeResponse }` | `useSsoGetMeQuery` accesses `data` directly | ✅ Compatible |
| Auth | `POST /api/sso/token/refresh` | `{ success: true, data: { accessToken, refreshToken } }` | Handles both `accessToken` and `access_token` | ✅ Compatible |
| Company | `GET /api/sso/company` | `{ success: true, data: { companies: [...], pagination: {...} } }` | Unwraps array to `companies` | ✅ Compatible |
| Accounts | `GET /api/account/customers` | `{ success: true, data: { content: [...], totalElements: N } }` | Unwraps `content` for list, preserves meta | ✅ Compatible |
| Accounts | `GET /api/account/dashboard` | `ApiResponse<DashboardResponse>` | Aggregated 7-widget response consumed in 1 call | ✅ Compatible |
| Inventory | `GET /api/inventory/products` | `ApiResponse<Page<Product>>` | Unwraps `data.content` | ✅ Compatible |
| Workflow | `GET /api/v1/workflow/definitions` | `ApiResponse<List<WorkflowDefinition>>` | Unwraps `data` array | ✅ Compatible |

---

## 3. Known Problems & Live Trace Remediation (Problems A – M)

| Problem ID | Problem Description | File:Line | Root Cause | Implemented Fix | Audit Status |
|------------|---------------------|-----------|------------|-----------------|--------------|
| **A** | Duplicate requests everywhere | `src/api/common/interceptors.js:615`, `src/features/hydration/hydrationSlice.js:23` | Interceptors registered multiple times on axios instance; unmemoized args triggering duplicate effect runs; duplicate rehydration dispatches. | Added `instance._requestInterceptorAttached` & `instance._responseInterceptorAttached` flags; guarded `completeRehydration` state. | ✅ Fixed |
| **B** | Layout-level calls firing on navigation | `src/api/sso/module.js:5-30`, `src/features/account/pages/AccountDashboard.jsx:141` | Master data (modules, navigation, widgets) refetched on every route change without caching. | Implemented 5-minute in-memory caching with mutation invalidation for `getModules`; consolidated dashboard queries. | ✅ Fixed |
| **C** | 404s from non-existent endpoints | `BudgetLines.jsx:27`, `BudgetVarianceReport.jsx:58`, `BudgetLineFormModal.jsx:15`, `employeeDriverService.js:216`, `apiService.js:31` | Calling routes not implemented in backend: `/api/account/departments`, `/api/account/employees`, `/api/hr/**`, `/api/manufacturing/production-schedules/**`, `/api/health`. | Replaced departments calls with static empty promises; eliminated tertiary employee call in driver service; switched health check to `/actuator/health`. Documented under Backend Gaps. | ✅ Fixed |
| **D** | 400 Bad Request on `/api/account/ap-payments` | `ApPaymentServiceImpl.java:189`, `vendor.api.js:298`, `APPayments.jsx:812` | Backend bug in `ApPaymentServiceImpl.java:189`: calls `TenantUtils.resolveCompanyId(TenantUtils.getCurrentCompanyId())` which is null for system admins, ignoring request param. | Ensured `companyId` query param and header are passed; added graceful error notice banner on AP Payments view. Recorded exact backend line under Backend Gaps. | ⚠️ Needs Backend (Handled) |
| **E** | Function passed as search value (`[native code]`) | `src/api/hr/hr.api.js:7`, `src/api/common/interceptors.js:310` | Passing string `companyId` into `{ companyId, search }` destructuring evaluated `search` to `String.prototype.search` native method. | Guarded `getEmployees` query to accept string or object; added parameter sanitizer in `interceptors.js` dropping non-primitive values with dev warning. | ✅ Fixed |
| **F** | Broken query params & `,undefined` sort strings | 9 Inventory Pages (`ProductCategoryManagement.jsx:55`, `ProductSerialManagement.jsx:56`, etc.), `productPrices.js:63`, `role.js:22` | Constructing `sort: `${apiParams.sort},${apiParams.direction}`` when `apiParams.sort` is already `field,order` and `direction` is undefined; duplicate pageable params; pagination params on get-by-id. | Cleaned sort builder in all 9 pages; removed duplicated page/size/sort in `productPrices.js`; removed pagination params from `getRoleById`. | ✅ Fixed |
| **G** | Credit / Debit Notes root state selector warning & empty select | `CreditNotes.jsx:153`, `DebitNotes.jsx:136`, `DebitNotes.jsx:276` | `useAppSelector(state => state)` causing full-state re-renders; invoice query misaligned with Spring `@ModelAttribute` filters; noisy debug logs. | Replaced root selectors with targeted `state => state.auth`; updated `apInvoicesApi` filter mapping; removed all leftover console logs. | ✅ Fixed |
| **H** | GST Dashboard page fan-out | `GstSummaryDashboardPage.jsx:1-290`, `useGstReport.js:1-50`, `gst.js:15` | Firing 6 reports and lookups (branches, gst-registrations, etc.) simultaneously on mount with debug logs; calling 404 `/api/account/branches`. | Removed `/branches` call; corrected registrations URL to `/api/account/gst/master/registrations/company`; clamped lookup size to 100; removed all debug logs. | ✅ Fixed |
| **I** | Recharts width(-1)/height(-1) warnings | `ChartCard.jsx:66`, `CRMDashboard.jsx:260`, `CashFlowReport.jsx:180` | `<ResponsiveContainer>` rendered inside containers with undefined or 0 height during layout calculation. | Provided explicit `minHeight` and `minWidth: 0` on containers; rendered `<ResponsiveContainer>` only when `!loading && data?.length > 0`. | ✅ Fixed |
| **J** | 60000ms Request Timeouts | `interceptors.js:330`, `InventoryValuationManagement.jsx:57`, `InventorySnapshotManagement.jsx:100` | Lookups requesting `size: 1000` (e.g. `warehouse-locations`) causing massive database scans and timeouts; lack of timeout tracking. | Added execution duration timing in interceptors; clamped lookups to `size: 100`; used joined response fields instead of separate lookups. | ✅ Fixed |
| **K** | AccountDashboard 7-request fan-out | `AccountDashboard.jsx:141` | Component executed 7 parallel calls for cards, quick-actions, approvals, alerts, activities, charts, navigation. | Consolidated into single call to `dashboardApi.getDashboard(params)` which returns full `DashboardResponse`. | ✅ Fixed |
| **L** | Startup duplicate API calls | `authApi.js:77`, `hydrationSlice.js:23`, `store.js:90` | Redundant `/me` calls on startup and during route transitions. | Single shared `/me` per session; rehydration state guarded against duplicate dispatches. | ✅ Fixed |
| **M** | Pagination base inconsistency | `role.js:22`, `portalAccess.js:14`, `baseApi.js` | Inconsistent pagination indexing across services. | Normalized pagination parameters across services (0-indexed for Spring Data, 1-indexed for session endpoints). | ✅ Fixed |
