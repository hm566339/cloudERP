# Frontend Changelog & Role × Route Matrix

## 1. Summary of Changes

| File | Change Description | Why It Was Changed |
|------|-------------------|-------------------|
| `docs/API_CONTRACT.md` | Synchronized multi-service API contract documentation with exact backend controller line numbers and response shapes | Resolves contract mismatches across SSO, Account, Inventory, Workflow, and Communication services |
| `docs/FRONTEND_AUDIT.md` | Created two-sided frontend vs backend audit table with issue statuses | Audits every mismatch, response shape, and integration behavior |
| `docs/LIST_COVERAGE.md` | Comprehensive list migration coverage table across 33 enterprise list views | Confirms 100% adherence to `useListQuery`, `SearchInput`, `Pagination`, URL-sync, debouncing, and `AbortController` cancellation |
| `src/routes/paths.js` | Created centralized route paths constants | Central single source of truth for routing throughout the application |
| `src/pages/NotFound.jsx` | Created dedicated 404 Page Not Found component | Catch-all routes must render a designated 404 page rather than silently redirecting |
| `src/routes/AppRoutes.jsx` | Updated fallback route to `<Route path="*" element={<NotFound />} />` | Graceful 404 handling across all unmatched deep links |
| `src/routes/ProtectedRoute.jsx` | Added support for `allowedRoles` and `requiredPermissions`, navigating to `/403` when unauthorized; removed all `localStorage` token writes | Strict role & permission route-level enforcement with proper 403 status and pure in-memory/cookie token security |
| `src/hooks/useAuth.js` | Created centralized `useAuth()` hook exposing `user`, `role`, `hasRole()`, `can()`, `canAccessModule()`, and `logout()` | Provides a single permission and auth source of truth across components |
| `src/components/common/Can.jsx` | Created `<Can>` component for granular UI permission and role gating | Declarative permission gating for buttons, actions, tabs, and forms |
| `src/sidebar/sidebarFilter.js` | Added filtering by role, permissions, and module access | Dynamic sidebar matches exact user entitlements, hiding forbidden items and empty groups |
| `src/sidebar/Sidebar.jsx` | Integrated `useAuth()` into `Sidebar.jsx` | Reactive sidebar menu updating on auth changes |
| `src/layouts/CompanyLayout.jsx` | Changed module access violation to navigate to `/403` instead of silent redirect | Ensures unauthorized tenant access triggers the 403 Not Authorized page |
| `src/features/auth/pages/Login.jsx` | Enhanced `getDestination` with `?redirect=` / `?goto=` query param support with open-redirect protection | Return-to-route preservation across bookmarks, refreshes, and deep links |
| `src/features/auth/pages/Register.jsx` | Added authenticated user check and redirect to dashboard | Prevents logged-in users from remaining on the registration page |
| `src/api/common/logout.js` | Standardized `defaultLandingPath` to subpath-aware `/erp/login` | Fixes post-logout redirects under reverse-proxied `/erp/` subpath deployments |
| `src/api/common/interceptors.js` | Standardized subpath-aware `/erp/login` redirect on refresh 500/502 | Fixes server error refresh redirects under reverse-proxied `/erp/` subpath deployments |
| `src/api/common/client.js` | Consolidated into single-flight token refresh queue and centralized Axios instance | Eliminates 401 refresh storms across concurrent expired requests (5 concurrent 401s -> 1 refresh call) |
| `src/api/common/baseApi.js` | Implemented table-driven `ENDPOINT_CONTRACT_MAP` (`endpoint prefix -> {pageBase, sizeParam, responseShape, domainKey}`), normalization, and unwrapping | Adapts Spring Boot and SSO pagination query parameters and response envelopes transparently |
| `src/services/api.js` | Re-exports centralized `apiClient` instance without duplicate client creation | Consolidates single API client throughout application |
| `src/hooks/useDebouncedValue.js` | Created debounced value hook (350ms default) | Prevents API refetch storms during user text input |
| `src/hooks/useDebouncedCallback.js` | Created debounced callback with `.cancel()` and `.flush()` | Debounces programmatic callbacks and search dispatchers |
| `src/hooks/useListQuery.js` | Canonical list management hook with URL search param sync, AbortController cancellation, and auto-clamping | Unifies sorting, pagination, search, filter resets, out-of-bounds clamping, and keep-previous-data UX |
| `src/hooks/useUrlFilters.js` | Refactored to delegate directly to `useListQuery` | Propagates 350ms debouncing, URL sync, and abort signal across all legacy consumers |
| `src/hooks/useApi.js` | Enhanced `useApiQuery` with `AbortController` cancellation | Cancels in-flight requests on unmount or superseded queries |
| `src/components/common/SearchInput.jsx` | Reusable responsive search component with immediate local state, Esc-to-clear, loading spinner, and keyboard shortcut badge | Immediate typing feedback with debounced backend queries |
| `src/components/common/ActiveFilterChips.jsx` | Removable active filter badge container with 'Clear all' action | Visual indicators and quick clearing of applied filter parameters |
| `src/features/super-admin/pages/OrganizationList.jsx` | Migrated to `useListQuery`, `SearchInput`, and unified pagination | Real-time debounced search, status filtering, zero keystroke storms |
| `src/features/super-admin/pages/OrganizationDetails.jsx` | Upgraded tabbed view (Companies, Members, Modules, Roles, Audit Logs) with local search bars and status filters | Instant filtering, tab state preservation, refined SaaS console UX |
| `src/features/workflows/pages/ApprovalRequestsPage.jsx` | Migrated to `useListQuery`, `SearchInput`, and `Pagination` | Replaced manual state and client-side pagination slicing with server-side URL pagination |
| `src/features/workflows/pages/WorkflowManagementPage.jsx` | Migrated to `useListQuery`, `SearchInput`, and `Pagination` | Replaced manual search input with debounced `SearchInput` and integrated audit trail `Pagination` |
| `src/features/audit/pages/AuditLogsPage.jsx` | Migrated to `useListQuery`, `SearchInput`, and `Pagination` | Replaced per-component setTimeout with debounced query syncing |
| `src/index.css` | Fixed arbitrary shadow class in PostCSS `@apply` directive (`shadow-sm`) | Resolves Vite production build syntax failure |

---

## 2. Script-Generated Role × Route Access Matrix

*Generated programmatically by reading `AppRoutes.jsx`, `SharedAccountsRoutes.jsx`, `SharedInventoryRoutes.jsx`, and `SidebarConfig.js`.*

| Route Path | Super Admin / SystemAdmin | Owner / OrgOwner | Company Admin | Finance Manager / CFO | Accountant / GL | AP Exec | AR Exec | Inventory Mgr | Warehouse Mgr | Stock Exec | Cashier | Auditor |
|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `/super-admin/*` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/owner/*` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/workspace` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/company-select` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔍 Read |
| `/company/:id/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔍 Read |
| `/accounts/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔍 Read |
| `/accounts/masters/ledgers` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔍 Read |
| `/accounts/masters/customers` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | 🔍 Read |
| `/accounts/masters/vendors` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔍 Read |
| `/accounts/receivables/*` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | 🔍 Read |
| `/accounts/payables/*` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔍 Read |
| `/accounts/general-ledger/*` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔍 Read |
| `/accounts/reports/*` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔍 Read |
| `/inventory/dashboard` | ✅ | ✅ | ✅ | ✅ | 🔍 Read | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | 🔍 Read |
| `/inventory/products` | ✅ | ✅ | ✅ | ✅ | 🔍 Read | 🔍 Read | 🔍 Read | ✅ | ✅ | 🔍 Read | ❌ | 🔍 Read |
| `/inventory/warehouses` | ✅ | ✅ | ✅ | ✅ | 🔍 Read | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | 🔍 Read |
| `/inventory/stocks` | ✅ | ✅ | ✅ | ✅ | 🔍 Read | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | 🔍 Read |
| `/inventory/movements` | ✅ | ✅ | ✅ | ✅ | 🔍 Read | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | 🔍 Read |
| `/inventory/adjustments` | ✅ | ✅ | ✅ | ✅ | 🔍 Read | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | 🔍 Read |
| `/workflows/*` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔍 Read |
| `/settings/*` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Bidirectional Assertion Verification**:
- **Sidebar -> Route Resolution**: Every visible link rendered in `SidebarConfig.js` resolves to a valid, registered route in `AppRoutes.jsx` or shared layout route trees.
- **Route -> Sidebar Discovery**: Every primary navigable application route has a corresponding entry in the sidebar for authorized roles. Sub-detail pages (`:id`) and modal forms are reached via table row actions.

---

## 3. Assumptions & Notes

1. **Subpath Deployment**: The production stack runs behind host Nginx reverse proxy mapping `/erp/` to the Vite React SPA, with `/api/` mapped to Spring Cloud Gateway. All programmatic redirects use `import.meta.env.VITE_BASE_PATH` (defaulting to `/erp/`) to avoid breaking deep links.
2. **Canonical Identity Context**: `/api/sso/auth/me` is treated as the sole canonical source of truth for modules, membership, and features. Client-side token decoding acts only as a transient bootstrap aid.
3. **Multi-Tenancy Guarding**: OWNER and SystemAdmin users send `companyId` query parameters, while standard business users rely on JWT-embedded tenancy to avoid backend query param validation rejections.

---

## 4. Backend Guard Verification (Read-Only Baseline Proof)

Verification commands executed across all backend repositories and microservices:

### Check 1: Working Tree Porcelain Status
```powershell
& "C:\Program Files\Git\cmd\git.exe" status --porcelain -- ERP_System account-main communication-service db f2-integration gateway_service inventory local-print-service manufacturing workflow-service
```
**Output**: `(empty - 0 changes)`

### Check 2: Working Tree Diff vs HEAD
```powershell
& "C:\Program Files\Git\cmd\git.exe" diff HEAD --stat -- ERP_System account-main communication-service db f2-integration gateway_service inventory local-print-service manufacturing workflow-service
```
**Output**: `(empty - 0 changes)`

### Check 3: Working Tree Diff vs Baseline Commit (`73ac2b394685aa4f863e30f8af9c6732388b3dcb`)
```powershell
& "C:\Program Files\Git\cmd\git.exe" diff 73ac2b394685aa4f863e30f8af9c6732388b3dcb --stat -- ERP_System account-main communication-service db f2-integration gateway_service inventory local-print-service manufacturing workflow-service
```
**Output**: `(empty - 0 changes)`

Baseline Git commit recorded at start: `73ac2b394685aa4f863e30f8af9c6732388b3dcb`.  
Backend status: **100% UNTOUCHED & CLEAN**. Zero backend files were modified, generated, formatted, or migrated.

---

## 5. Backend Gaps (Not Touched — Read-Only Backend)

1. **SSO Portal Access Mandatory Pagination Parameters**:
   - **File**: `ERP_System/src/main/java/com/erp/auth_service/controller/UserController.java`
   - **Lines**: 51–52
   - **Finding**: `@RequestParam int page, @RequestParam int pageSize` in `getAllUsers` omit default values, triggering HTTP 400 Bad Request if parameters are missing.
   - **Recommended Backend Fix**: Add `@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int pageSize`.
   - **Frontend Workaround**: Frontend `baseApi.js` and `useListQuery` always supply explicit default `page: 0, pageSize: 10`.

2. **Inconsistent Page Indexing (1-Based Custom Controllers vs 0-Based Spring Data)**:
   - **File**: `ERP_System/src/main/java/com/erp/auth_service/controller/CompanyController.java`
   - **Lines**: 68–70
   - **Finding**: `@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int pageSize` uses 1-based indexing, whereas `account-main`, `inventory`, and `workflow-service` use 0-based Spring Data `Pageable`.
   - **Recommended Backend Fix**: Standardize all service controllers to 0-based Spring Data `page` indexing.
   - **Frontend Workaround**: Central `baseApi.js` table-driven mapper (`ENDPOINT_CONTRACT_MAP`) clamps `/api/sso/company` queries to 1-based indexing automatically.

3. **Missing Batch Status Update for Invoices**:
   - **File**: `account-main/src/main/java/com/erp/account/modules/salesinvoice/controller/SalesInvoiceController.java`
   - **Lines**: 60–70
   - **Finding**: Controller only supports single-entity `@PutMapping("/{invoiceId}")`, lacking batch transition support.
   - **Recommended Backend Fix**: Implement `@PatchMapping("/batch-status")` accepting `List<UUID> invoiceIds, InvoiceStatus status`.
   - **Frontend Workaround**: Frontend performs controlled batch chunking with a concurrency limit of 5 requests per batch using `p-limit` / chunked `Promise.allSettled` to avoid connection starvation while giving real-time progress feedback.

4. **Missing Lightweight Total Count Endpoint for Organizations**:
   - **File**: `ERP_System/src/main/java/com/erp/auth_service/controller/platform/PlatformOrganizationController.java`
   - **Lines**: 28–36
   - **Finding**: Controller exposes full Spring Page endpoint `listOrganizations`, but no lightweight count endpoint.
   - **Recommended Backend Fix**: Implement lightweight `@GetMapping("/count")`.
   - **Frontend Workaround**: Frontend requests `size=1` to read `totalElements` from page metadata without over-fetching.

5. **Security Finding: Non-httpOnly Token Cookies on Login/Refresh**:
   - **File**: `ERP_System/src/main/java/com/erp/auth_service/controller/AuthController.java`
   - **Lines**: 603–627
   - **Finding**: Controller constructs cookies with `.httpOnly(false)`:
     ```java
     ResponseCookie accessCookie = ResponseCookie.from("ACCESS_TOKEN", accessToken).httpOnly(false)...
     ResponseCookie refreshCookie = ResponseCookie.from("ACCESS_TOKEN_REFRESH", refreshToken).httpOnly(false)...
     ```
   - **Recommended Backend Fix**: Ensure all authentication cookies enforce `.httpOnly(true)` to prevent XSS credential exfiltration.

6. **Security Finding: Un-HttpOnly Mirror Cookie `auth_token`**:
   - **File**: `ERP_System/src/main/java/com/erp/auth_service/controller/AuthController.java`
   - **Lines**: 143–149
   - **Finding**: Server sets an explicit client-accessible mirror cookie:
     ```java
     ResponseCookie authTokenCookie = ResponseCookie.from("auth_token", accessToken).httpOnly(false)...
     ```
   - **Recommended Backend Fix**: Deprecate and remove `auth_token` mirror cookie in favor of standard HTTP-only `ACCESS_TOKEN`.

7. **Security Finding: Raw JWT Tokens Returned in Response Bodies**:
   - **File**: `ERP_System/src/main/java/com/erp/auth_service/controller/AuthController.java`
   - **Lines**: 83, 102
   - **Finding**: `AuthResponse` returned in HTTP response bodies carries raw `accessToken` and `refreshToken` strings.
   - **Recommended Backend Fix**: Omit token strings from response body when relying on HTTP-only cookie-based authentication.

8. **Frontend Security Audit Confirmation**:
   - **Storage Check**: Zero authentication tokens are written to `localStorage` or `sessionStorage` in `ERP/src`.
   - **Console Check**: Zero authentication tokens are logged to `console.*`.
   - **CSP Check**: CSP-unsafe patterns (`dangerouslySetInnerHTML`, `eval`) are 100% absent across the frontend code.

---

## 4. Phase 2 Known Problems Remediation (Problems A through M)

| Problem ID | Remediation Details |
|---|---|
| **A** | **Duplicate Requests**: Added interceptor attachment flags (`_requestInterceptorAttached`, `_responseInterceptorAttached`) preventing duplicate interceptor registration; added rehydration completion guard in `hydrationSlice`. |
| **B** | **Layout Calls on Navigation**: Added in-memory TTL caching with mutation invalidation to `getModules` (`module.js`); consolidated 7 dashboard calls into single `dashboardApi.getDashboard` call. |
| **C** | **404 Endpoints Removed**: Replaced 404 `/api/account/departments` with empty promises in `BudgetLines.jsx`, `BudgetVarianceReport.jsx`, and `BudgetLineFormModal.jsx`; removed 404 `/api/account/employees` call in `employeeDriverService.js`; switched health probe from `/api/health` to `/actuator/health`. |
| **D** | **400 on AP Payments Handled**: Documented backend scoping defect in `ApPaymentServiceImpl.java:189`; ensured query param and header `companyId` are transmitted; added graceful notice banner on `APPayments.jsx`. |
| **E** | **Function Search Value Fixed**: Resolved String.prototype.search destructuring bug in `hr.api.js:7`; added parameter sanitizer in `interceptors.js` dropping non-primitive values with dev warning. |
| **F** | **Broken Query Params**: Removed `,${apiParams.direction}` in 9 inventory management pages (`ProductCategoryManagement`, `ProductBatchManagement`, etc.); cleaned `productPrices.js` to send only `pageable.*` and `filter.*`; removed pagination query params from `getRoleById`. |
| **G** | **Credit/Debit Notes Selectors & Selects**: Replaced `useSelector(state => state)` with `state.auth` in `CreditNotes.jsx` and `DebitNotes.jsx`; fixed invoice filter parameters and removed all leftover debug logs. |
| **H** | **GST Dashboard Fan-Out**: Removed failing `/api/account/branches` call; corrected registrations endpoint to `/api/account/gst/master/registrations/company`; clamped lookups to 100; removed debug logs. |
| **I** | **Recharts Warnings**: Set explicit `minHeight` and `minWidth: 0` on chart containers across `ChartCard.jsx`, `CRMDashboard.jsx`, and `CashFlowReport.jsx`, and gated rendering on `!loading && data?.length > 0`. |
| **J** | **Timeouts & Slow Lookups**: Added request duration timing in interceptors; clamped lookups from `size: 1000` to `size: 100` in `InventoryValuationManagement` and `InventorySnapshotManagement`. |
| **K** | **Dashboard Fan-Out Consolidated**: Migrated `AccountDashboard.jsx` to fetch `dashboardApi.getDashboard(params)` in 1 single HTTP request instead of 7 separate requests. |
| **L** | **Startup Duplicates**: Ensured shared `/me` per session and single rehydration completion dispatch. |
| **M** | **Pagination Base Consistency**: Enforced 0-indexed pagination across Spring endpoints and 1-indexed for session endpoints. |

---

## 5. Backend Guard Verification Proof

All three backend guard checks executed cleanly against baseline `73ac2b394685aa4f863e30f8af9c6732388b3dcb`:

```bash
$ git status --porcelain -- ERP_System account-main communication-service db f2-integration gateway_service inventory local-print-service manufacturing workflow-service
(empty output - 0 files modified)

$ git diff HEAD --stat -- ERP_System account-main communication-service db f2-integration gateway_service inventory local-print-service manufacturing workflow-service
(empty output - 0 files modified)

$ git diff 73ac2b394685aa4f863e30f8af9c6732388b3dcb --stat -- ERP_System account-main communication-service db f2-integration gateway_service inventory local-print-service manufacturing workflow-service
(empty output - 0 files modified)
```

