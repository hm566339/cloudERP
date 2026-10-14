# CloudERP Subscription Frontend Audit

> **Comprehensive Source-Code Level Audit**  
> Frontend Directory: `c:\Users\Aditya\OneDrive\Desktop\cloudERP\ERP` (`FRONTEND_DIR`)  
> Focus: Alignment with backend `ERP_System` security, contracts, DTO payloads, price units, access modes, and role checks.  
> Date: 2026-10-14  

---

## 1. Audit Summary Matrix

| File & Line | What Exists in Frontend | What Backend Expects | Gap or Bug | Planned Change |
| :--- | :--- | :--- | :--- | :--- |
| `src/api/sso/subscriptionPlan.api.js:3-14` | `getSubscriptionPlans(params)` converts `{ active }` to query params | `GET /api/sso/subscription-plans?active=...&search=...` | Handles `'ALL'` by omitting param, but doesn't pass search or sort cleanly | Ensure `active` is boolean or omitted, add `search` support cleanly |
| `src/api/sso/subscriptionPlan.api.js:21-29` | `createSubscriptionPlan` and `updateSubscriptionPlan` wrap payload in `{ data: planData }` | Backend expects `RequestWrapper<SubscriptionPlanRequest>` (`{ data: { ... } }`) | Correctly aligned with backend `@Valid @RequestBody RequestWrapper` | Maintain `{ data: payload }` wrapping |
| `src/api/sso/subscriptionPlan.api.js:31-34` | `deleteSubscriptionPlan(id)` calls `DELETE /api/sso/subscription-plans/${id}` | Backend soft-deletes / deactivates plan (`plan.setActive(false)`) | Backend returns `{ "message": "Subscription plan deactivated successfully" }` | Keep delete method; add confirmation dialog noting plan deactivation |
| `src/api/sso/subscriptionPlan.api.js:58-61` | `createSubscriptionCheckout(orgId, data)` sends raw body | Backend parses both `{ data: ... }` and raw `{ ... }` | Properly aligned | Keep clean payload |
| `src/api/sso/subscriptionPlan.api.js` (NEW) | Missing platform admin subscription endpoints | Backend has `/api/sso/admin/organizations/{id}/subscription`, `/payments`, `/invoices` | Missing endpoints for super-admin organization view | Add `getAdminOrganizationSubscription`, `getAdminOrganizationPayments`, `getAdminOrganizationInvoices` |
| `src/pages/settings/SubscriptionPlansSettings.jsx:56-65` | Role check string matching: `user?.role === 'super_admin'`, `user?.role === 'owner'` | Backend `/api/sso/auth/me` returns `roles: [{ name: 'SYSTEM_ADMIN' }]` and `membership.memberType: 'OWNER'` | Fragile string check fails if role is `SYSTEM_ADMIN` or stored in `roles` array | Refactor to centralized `canManagePlans(authContext)` and `canBuySubscription(authContext)` permission helpers |
| `src/pages/settings/SubscriptionPlansSettings.jsx:130-145` | Fetches plans and modules on mount | Backend `GET /api/sso/subscription-plans` and `GET /api/sso/module?status=true&page=0&pageSize=100` | Aligned | Ensure empty/loading/error states are graceful |
| `src/pages/subscription/SubscriptionPage.jsx:108-117` | Client-side 20% annual discount formula calculated on the fly | Backend stores exact immutable plan price in database (`plan.price` per `durationDays`) | Fake pricing calculation can lead to mismatched checkout amount | Align annual toggle with actual annual plans (e.g. 365 days) or explain billing duration cleanly without modifying server price |
| `src/pages/subscription/SubscriptionPage.jsx:234-237` | `window.location.reload()` on checkout success | Redux single-source-of-truth via `authApi.endpoints.ssoGetMe` | Hard reload breaks SPA state and is jarring | Replace with `dispatch(authApi.endpoints.ssoGetMe.initiate(undefined, { forceRefetch: true }))` and local refetch |
| `src/pages/subscription/SubscriptionPage.jsx:182-194` | Plan detection matches by trial flag or code | Backend `/me` returns `subscription.planCode` and `subscription.status` | Fallbacks work, but need explicit check for `PENDING` order state | Show pending payment notice banner if order in-flight |
| `src/components/subscription/SubscriptionCheckoutModal.jsx:141-145` | Sends `{ planId: selectedPlan.code || selectedPlan.id, totalCount: 12 }` | Backend resolves plan by UUID or code | Aligned with `resolvePlan` in `SubscriptionBillingServiceImpl` | Keep robust fallback |
| `src/components/subscription/SubscriptionCheckoutModal.jsx:163-175` | Reads `keyId` from checkout response; amount in paise | Backend returns `amountInPaise` (integer) and `keyId` (e.g. `rzp_test_...`) | Aligned; Razorpay requires paise for INR | Key ID strictly from response; never hardcoded |
| `src/components/subscription/SubscriptionCheckoutModal.jsx:185-215` | Calls `verifySubscriptionPayment` then refetches `/me` | Backend performs cryptographic HMAC check + server check | Client never marks payment successful without backend verify | Maintain double-verify guard; debounce button clicks |
| `src/components/subscription/SubscriptionCheckoutModal.jsx:234-241` | `ondismiss` calls `cancelPendingCheckout(orgId, orderId)` | Backend cancels pending order and releases lock | Excellent pattern; prevents stale pending lock | Keep and ensure error logging is quiet |
| `src/components/common/Can.jsx:45-48` | `if (isSuperAdmin || isOwner) return <>{children}</>;` | Backend strictly restricts plan management to `SYSTEM_ADMIN` | OWNER could erroneously see super-admin plan management actions | Fix `Can.jsx` or use explicit `canManagePlans` check so only `SYSTEM_ADMIN` can modify plan catalog |
| `src/hooks/useAccessMode.js:23-60` | Checks `ssoSubscription` and `ssoAccessMode` | Backend `/api/sso/auth/me` provides `accessMode: "FULL" | "READ_ONLY" | "BLOCKED"` | Aligned | Provide unified `useSubscriptionAccess()` wrapper |
| `src/components/common/ReadOnlyBanner.jsx:9-15` | Shows banner when `accessMode === 'READ_ONLY'` | Backend sets `READ_ONLY` when trial expires or subscription is unpaid | Aligned | Ensure banner has clear "Choose a plan" action |
| `src/components/common/SubscriptionNoticeBanner.jsx:13-31` | Shows full alert when `isBlocked` or `isReadOnly` | Backend sets `BLOCKED` when org is blocked | Aligned | Ensure BLOCKED mode shows full screen blocker |
| `src/features/super-admin/pages/OrganizationDetails.jsx:57-65` | Tabs: `overview`, `companies`, `members`, `modules`, `roles`, `audit` | Super admin needs to inspect tenant subscription, plan, and billing | Missing Subscription & Billing tab | Add dedicated Subscription tab calling `/api/sso/admin/organizations/{id}/subscription`, `/payments`, `/invoices` |
| `src/components/subscription/PlanFormModal.jsx:26-40` | Form includes code, name, durationDays, price, currency, limits, moduleIds | Backend `SubscriptionPlanRequest` schema | Matches backend DTO fields exactly | Validate server errors mapping to form fields |

---

## 2. Key Audit Insights & Decisions

### 2.1 Currency & Price Units
- **Database / DTO**: `SubscriptionPlan.price` is a `BigDecimal` in Rupees (e.g. `4999.00`).
- **Checkout Response**: `RazorpayCheckoutResponse.amountInPaise` is `499900` (`amount * 100`).
- **Display**: Formatted as Indian Rupees (`₹4,999`) using `Intl.NumberFormat('en-IN')`.
- **Payment Verification**: Handled in integer paise by Razorpay Checkout SDK, verified by backend cryptographic HMAC.

### 2.2 Security & Role Checks
- Replace scattered `user?.role === 'super_admin'` with `canManagePlans(authContext)`:
  - Checks if user has role `SYSTEM_ADMIN`, `ROLE_SYSTEM_ADMIN`, or permission `SUBSCRIPTION_PLAN:CREATE` / `WRITE`.
- Replace `user?.role === 'owner'` with `canManageSubscription(authContext)`:
  - Checks `membership?.memberType === 'OWNER'` or `memberType === 'ADMIN'`, or role `OWNER`, or elevated admin.
- Roles without manage permission view plan pricing cards in read-only mode with disabled buy buttons showing reasons (e.g., "Only Organization Owners can purchase or upgrade subscriptions").

### 2.3 Access Mode Handling
- Global `useSubscriptionAccess()` hook:
  - `accessMode`: `'FULL' | 'READ_ONLY' | 'BLOCKED'`
  - `isReadOnly`: true if `READ_ONLY` (trial expired, unpaid)
  - `isBlocked`: true if `BLOCKED` (organization suspended)
  - `isTrial`: true if `TRIALING`
  - `daysRemaining`: days left in period
- Mutation actions disabled across all forms and tables when `isReadOnly` is active.
