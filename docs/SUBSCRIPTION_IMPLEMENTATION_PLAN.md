# CloudERP Subscription Frontend Implementation Plan

> **Authoritative Frontend Engineering Blueprint**  
> Target: Frontend Directory `c:\Users\Aditya\OneDrive\Desktop\cloudERP\ERP` (`FRONTEND_DIR`)  
> Scope: Pure Frontend implementation. Backend is strictly READ-ONLY.  
> Derived from: `SUBSCRIPTION_API_CONTRACT.md` and `SUBSCRIPTION_FRONTEND_AUDIT.md`.  
> Date: 2026-10-14  

---

## 1. Role x Action Matrix (Backend-Derived Authority)

| Action | SYSTEM_ADMIN / SUPER_ADMIN | OWNER / ORG_ADMIN | COMPANY_ADMIN / ACCOUNTANT | REGULAR MEMBER / EMPLOYEE | Backend Authority Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **View Plan Catalog** (`GET /subscription-plans`) | **Allowed** | **Allowed** | **Allowed** (if `SUBSCRIPTION_PLAN:READ`) | **Denied** (unless granted in DB) | `SsoAuthorizationService: resolveFeatureCode('SUBSCRIPTION_PLAN')` |
| **Create Plan** (`POST /subscription-plans`) | **Allowed** | **Denied** | **Denied** | **Denied** | `SsoAuthorizationService` & `PlatformSecurityUtil.isElevatedAdmin()` |
| **Update Plan** (`PUT /subscription-plans/{id}`) | **Allowed** | **Denied** | **Denied** | **Denied** | `SsoAuthorizationService` & `PlatformSecurityUtil.isElevatedAdmin()` |
| **Toggle Plan Status** (`PATCH /subscription-plans/{id}/status`) | **Allowed** | **Denied** | **Denied** | **Denied** | `SsoAuthorizationService` & `PlatformSecurityUtil.isElevatedAdmin()` |
| **Assign Modules to Plan** (`PUT /subscription-plans/{id}/modules`) | **Allowed** | **Denied** | **Denied** | **Denied** | `SsoAuthorizationService` & `PlatformSecurityUtil.isElevatedAdmin()` |
| **Delete Plan (Deactivate)** (`DELETE /subscription-plans/{id}`) | **Allowed** | **Denied** | **Denied** | **Denied** | `SubscriptionPlanServiceImpl.deletePlan` |
| **Start / Activate Trial** (`POST /subscriptions/{orgId}/activate-trial`) | **Allowed** | **Allowed** | **Denied** | **Denied** | `SubscriptionBillingServiceImpl.assertOrganizationManagementAccess` |
| **Initiate Checkout** (`POST /subscriptions/{orgId}/checkout`) | **Allowed** | **Allowed** | **Denied** (Buy disabled with explanation) | **Denied** | `SubscriptionBillingServiceImpl.assertOrganizationManagementAccess` |
| **Verify Payment** (`POST /subscriptions/{orgId}/verify-payment`) | **Allowed** | **Allowed** | **Denied** | **Denied** | `SubscriptionBillingServiceImpl.assertOrganizationManagementAccess` & HMAC verify |
| **Cancel Active Subscription** (`POST /subscriptions/{id}/cancel`) | **Allowed** | **Allowed** | **Denied** | **Denied** | `SubscriptionBillingServiceImpl.assertOrganizationManagementAccess` |
| **Cancel Pending Order** (`POST /subscriptions/{orgId}/checkout/cancel`) | **Allowed** | **Allowed** | **Denied** | **Denied** | `SubscriptionBillingServiceImpl.assertOrganizationManagementAccess` |
| **View Org Subscription** (`GET /subscriptions/{orgId}/current`) | **Allowed** | **Allowed** | **Allowed** (if permitted in org) | **Denied** | `SubscriptionBillingServiceImpl.assertOrganizationManagementAccess` |
| **View Org Invoices / Payments** (Tenant level) | **Backend-Undefined** | **Backend-Undefined** | **Backend-Undefined** | **Backend-Undefined** | Backend gap: No tenant endpoint exists under `/api/sso/subscriptions/{orgId}/payments` |
| **View All Orgs' Subscriptions** (`GET /api/sso/admin/organizations/...`) | **Allowed** | **Denied** | **Denied** | **Denied** | `PlatformOrganizationController` elevated check |

---

## 2. Screens and Routes Architecture

### 2.1 Screen 1: Plan Catalog Management (`SYSTEM_ADMIN`)
- **Route Path**: `/super-admin/plans` and `/settings/plans`
- **Allowed Roles**: `SYSTEM_ADMIN` / `ROLE_SYSTEM_ADMIN` only.
- **Components**:
  - `PlanTable`: Search input, active/all filter pill, sort by creation/price, status toggle switch with confirmation, edit trigger, module count badge, delete button.
  - `PlanFormModal`: Clean form with fields `code`, `name`, `description`, `durationDays`, `price`, `currency`, `active`, `isTrial`, `maxCompanies` (with "Unlimited" toggle), `maxUsersPerCompany` (with "Unlimited" toggle), `moduleIds` selector.
  - `PlanDetailsModal`: Comprehensive view of plan limits, pricing version, and provisioned modules.
- **API Calls**:
  - `GET /api/sso/subscription-plans?active=...&search=...`
  - `GET /api/sso/module?status=true&page=0&pageSize=100`
  - `POST /api/sso/subscription-plans` with `{ data: { ... } }`
  - `PUT /api/sso/subscription-plans/{id}` with `{ data: { ... } }`
  - `PATCH /api/sso/subscription-plans/{id}/status?active=...`
  - `DELETE /api/sso/subscription-plans/{id}`

### 2.2 Screen 2: Subscription & Pricing Selection (`OWNER`, Tenant Admin, User)
- **Route Path**: `/subscription`
- **Allowed Roles**: Any authenticated user with organization membership.
- **Role Degradation**:
  - `OWNER` / `ADMIN`: Sees active plan status, days remaining, "Upgrade Plan", "Change Plan", "Cancel Subscription".
  - Other roles (`ACCOUNTANT`, `MEMBER`): Can view current plan details, but "Buy" / "Upgrade" buttons are disabled with tooltip: *"Only Organization Owners or Administrators can manage billing and subscriptions"*.
- **Components**:
  - `CurrentSubscriptionHero`: Displays active plan badge, trial progress bar (if trialing), renewal/expiry date, access mode indicator (`FULL` vs `READ_ONLY`).
  - `PlanPricingGrid`: Dynamic plan cards displaying monthly/annual duration labels based on backend `durationDays`, list of included modules (`Finance`, `Inventory`, `CRM`, `Purchase`, `Workflow`), highlight on current plan with "Current Plan" pill.
  - `CancelSubscriptionDialog`: Modal with confirmation and warning about read-only downgrade upon cancellation.

### 2.3 Screen 3: Razorpay Checkout & Cryptographic Verification Flow
- **Component**: `SubscriptionCheckoutModal`
- **Flow**:
  1. User clicks "Upgrade" on desired plan.
  2. Modal shows plan summary, duration, price in INR, included modules.
  3. User clicks "Proceed to Payment" (debounced, double-click prevented).
  4. Backend order creation: `POST /api/sso/subscriptions/{orgId}/checkout` with `{ planId }`.
  5. Response returns `keyId`, `orderId`, and `amountInPaise`.
  6. Loads Razorpay Checkout SDK (from `https://checkout.razorpay.com/v1/checkout.js`).
  7. Opens Razorpay modal with `order_id` and test/live publishable `keyId`.
  8. **User Dismissal (`ondismiss`)**: Calls `POST /api/sso/subscriptions/{orgId}/checkout/cancel` with `{ orderId }` to release backend lock; resets modal state.
  9. **Payment Failure (`payment.failed`)**: Calls `POST /api/sso/subscriptions/{orgId}/checkout/cancel`; shows clear error message.
  10. **Payment Success (`handler`)**: Calls `POST /api/sso/subscriptions/{orgId}/verify-payment` with `{ orderId, paymentId, signature }`.
  11. On 200 OK: Dispatches `authApi.endpoints.ssoGetMe.initiate(undefined, { forceRefetch: true })` to instantly refresh app-wide `/me` context, shows success checkmark, auto-closes modal after delay without full page reload.

### 2.4 Screen 4: Super Admin Organization Subscription View
- **Route Path**: `/super-admin/organizations/:organizationId?tab=subscription`
- **Allowed Roles**: `SYSTEM_ADMIN` / `ROLE_SUPER_ADMIN`.
- **Components**:
  - `OrganizationSubscriptionTab` in `OrganizationDetails.jsx`.
  - Displays current plan, status, access mode, trial start/end, period start/end, razorpay order ID, next billing date.
  - Displays payments table (`GET /api/sso/admin/organizations/{id}/payments`) and invoices table (`.../invoices`).

### 2.5 Screen 5: Global Access Mode Guards (`READ_ONLY` & `BLOCKED`)
- **Hook**: `useSubscriptionAccess()`
- **Components**:
  - `ReadOnlyBanner`: Rendered in `OwnerLayout`, `CompanyLayout`, `AccountantLayout` whenever `accessMode === 'READ_ONLY'`. Explains that subscription/trial expired and links to `/subscription`.
  - Mutation Blocking: In `Can.jsx` and `useAuth.js`, all mutating actions (`CREATE`, `UPDATE`, `WRITE`, `DELETE`, `POST`, `APPROVE`, `CANCEL`) return `false` in `READ_ONLY` mode, rendering disabled buttons with explanatory tooltips.
  - `BlockedAccessScreen`: Full-screen restriction view when `accessMode === 'BLOCKED'`. Displays account restriction notice, allows logout, and allows OWNER to navigate to `/subscription` to settle invoice.

---

## 3. Data Layer Architecture

### 3.1 Constants & Enums (`src/constants/subscriptionConstants.js`)
```javascript
export const SUBSCRIPTION_STATUS = Object.freeze({
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  PAST_DUE: 'PAST_DUE',
  PAUSED: 'PAUSED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  SUSPENDED: 'SUSPENDED',
});

export const ACCESS_MODE = Object.freeze({
  FULL: 'FULL',
  READ_ONLY: 'READ_ONLY',
  BLOCKED: 'BLOCKED',
});

export const SUBSCRIPTION_ENDPOINTS = Object.freeze({
  PLANS: '/api/sso/subscription-plans',
  PLAN_BY_ID: (id) => `/api/sso/subscription-plans/${id}`,
  PLAN_BY_CODE: (code) => `/api/sso/subscription-plans/code/${code}`,
  PLAN_STATUS: (id) => `/api/sso/subscription-plans/${id}/status`,
  PLAN_MODULES: (id) => `/api/sso/subscription-plans/${id}/modules`,
  CHECKOUT: (orgId) => `/api/sso/subscriptions/${orgId}/checkout`,
  CANCEL_CHECKOUT: (orgId) => `/api/sso/subscriptions/${orgId}/checkout/cancel`,
  VERIFY_PAYMENT: (orgId) => `/api/sso/subscriptions/${orgId}/verify-payment`,
  CANCEL_SUBSCRIPTION: (id) => `/api/sso/subscriptions/${id}/cancel`,
  ACTIVATE_TRIAL: (orgId) => `/api/sso/subscriptions/${orgId}/activate-trial`,
  ORG_SUBSCRIPTION: (orgId) => `/api/sso/subscriptions/${orgId}/current`,
  ADMIN_ORG_SUBSCRIPTION: (orgId) => `/api/sso/admin/organizations/${orgId}/subscription`,
  ADMIN_ORG_PAYMENTS: (orgId) => `/api/sso/admin/organizations/${orgId}/payments`,
  ADMIN_ORG_INVOICES: (orgId) => `/api/sso/admin/organizations/${orgId}/invoices`,
  ME: '/api/sso/auth/me',
  MODULES: '/api/sso/module',
});
```

### 3.2 Permission Helpers (`src/utils/subscriptionPermissions.js`)
- `isSystemAdminUser(authContext)`: Returns true if user has role `SYSTEM_ADMIN`, `ROLE_SYSTEM_ADMIN`, `super_admin`, or `SUPER_ADMIN`.
- `isOrganizationOwner(authContext)`: Returns true if membership `memberType === 'OWNER'` or role `OWNER`.
- `isOrganizationAdmin(authContext)`: Returns true if membership `memberType === 'ADMIN'`.
- `canManagePlans(authContext)`: True strictly for `isSystemAdminUser(authContext)` or `SUBSCRIPTION_PLAN:CREATE` in DB permissions.
- `canManageSubscription(authContext)`: True if `isOrganizationOwner` or `isOrganizationAdmin` or `isSystemAdminUser`.
- `canViewPlans(authContext)`: True for all authenticated users who have access to the app.

---

## 4. File-by-File Implementation Plan

1. **`src/constants/subscriptionConstants.js` (NEW)**:
   - Centralizes status enums, access modes, endpoint paths, price formatters.
2. **`src/utils/subscriptionPermissions.js` (NEW)**:
   - Strict role & permission verification helpers sourced from `/api/sso/auth/me`.
3. **`src/hooks/useSubscriptionAccess.js` (NEW)**:
   - Unified hook providing `accessMode`, `isReadOnly`, `isBlocked`, `isTrial`, `isActive`, `daysRemaining`, `planName`, and action permission helpers.
4. **`src/api/sso/subscriptionPlan.api.js` (UPDATE)**:
   - Add admin organization subscription, payments, and invoices endpoints.
   - Clean up query parameter serialization.
5. **`src/components/subscription/SubscriptionCheckoutModal.jsx` (UPDATE)**:
   - Protect against double submission / double verification.
   - Guard against missing Razorpay key or configuration errors.
   - Dispatch `/me` refresh on success and invoke callback without page reload.
6. **`src/pages/subscription/SubscriptionPage.jsx` (UPDATE)**:
   - Remove `window.location.reload()`.
   - Remove misleading client-calculated annual pricing; display real backend pricing and duration.
   - Add cancel subscription confirmation dialog with explanation.
   - Add graceful empty / pending order handling.
7. **`src/pages/settings/SubscriptionPlansSettings.jsx` (UPDATE)**:
   - Replace brittle role string checks with `canManagePlans` and `canManageSubscription`.
   - Hide create/edit/delete actions from non-system-admin users.
8. **`src/components/common/Can.jsx` & `src/hooks/useAuth.js` (UPDATE)**:
   - Respect `READ_ONLY` mode globally for mutations.
   - Ensure plan management permissions are restricted to `SYSTEM_ADMIN`.
9. **`src/features/super-admin/pages/OrganizationDetails.jsx` (UPDATE)**:
   - Add Subscription & Billing tab for super-admin inspection.
10. **`src/routes/AppRoutes.jsx` (UPDATE)**:
    - Route guards ensuring `/super-admin/plans` and `/settings/plans` check `canManagePlans` or appropriate view permissions.

---

## 5. Verification & Testing Strategy

1. **Unit Tests**:
   - `src/utils/__tests__/subscriptionPermissions.test.js`: Validates `canManagePlans`, `canManageSubscription`, `canViewPlans` across roles (`SYSTEM_ADMIN`, `OWNER`, `ACCOUNTANT`, `VIEWER`).
   - `src/hooks/__tests__/useSubscriptionAccess.test.js`: Validates `FULL`, `READ_ONLY`, `BLOCKED`, and `TRIALING` calculations.
   - `src/components/subscription/__tests__/subscriptionCheckout.test.js`: Validates price units (paise vs rupees), double-click prevention, dismissal handling, verify payload structure.
2. **Build & Lint Verification**:
   - Run `npm test` to ensure 100% of existing and new tests pass.
   - Run `npm run build` to confirm zero compilation errors.
3. **Scope Check**:
   - Confirm with `git status --porcelain` that all modified files are strictly within `FRONTEND_DIR`.
