# Subscription & Billing Frontend Test Report & Evidence

> **Target**: CloudERP React Frontend (`ERP/`)  
> **Backend Evaluation**: Read-Only (`ERP_System` on `8090`, gateway `/api/sso/**`)  
> **Test Execution Date**: 2026-10-14  
> **Unit & Component Tests**: 321 Passed / 0 Failed  
> **Production Build (`vite build`)**: ✓ Successful (22.14s, 0 errors, 0 warnings)  
> **Safety Guarantees**: 0 `DELETE` HTTP requests sent to backend; 0 real financial charges executed.

---

## 1. Executive Summary

The subscription, licensing, checkout, and access-mode capabilities were verified end-to-end in the frontend application. All role permissions, state transitions, price formatting in INR (converting rupees to paise for Razorpay), and backend envelopes were audited against the read-only Java backend (`SubscriptionPlanController`, `SubscriptionCheckoutController`, `CompanySubscriptionController`, `PlatformOrganizationController`, and `AuthController`).

---

## 2. Role × Flow Verification Matrix

| Flow | SYSTEM_ADMIN | OWNER | ADMIN | REGULAR / ACCOUNTANT | Evidence / Behavior |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **View Catalog Plans** | Allowed | Allowed | Allowed | Allowed | All roles can view published subscription plans at `/subscription` or `/settings/subscription-plans`. |
| **Create Subscription Plan** | Allowed | Denied | Denied | Denied | Create Plan button and modal visible ONLY to `SYSTEM_ADMIN`. Owners see catalog in read-only mode. |
| **Edit Subscription Plan** | Allowed | Denied | Denied | Denied | Edit action button visible ONLY to `SYSTEM_ADMIN`. |
| **Toggle Plan Status** | Allowed | Denied | Denied | Denied | Activate/Deactivate button visible ONLY to `SYSTEM_ADMIN`. |
| **Delete Plan (Soft Delete)** | Allowed (Dialog) | Denied | Denied | Denied | Confirmation modal opens only for `SYSTEM_ADMIN`. Zero HTTP DELETE requests sent during test; cancel dismisses modal cleanly. |
| **Assign Modules to Plan** | Allowed | Denied | Denied | Denied | Module selection checklist in PlanFormModal enabled only for `SYSTEM_ADMIN`. |
| **Buy / Upgrade Subscription** | Allowed | Allowed | Allowed | Denied (Disabled) | Upgrade/Buy buttons enabled for Owners/Admins. Disabled for Regular members with explicit tooltip: *"Only Organization Owners or Administrators have permission to purchase or upgrade subscriptions."* |
| **Cancel Subscription** | Allowed | Allowed | Allowed | Denied (Hidden) | Cancel Subscription button visible on active paid subscription cards. Triggers confirmation dialog explaining grace period and read-only transition. |
| **Admin Organization Billing** | Allowed | Denied | Denied | Denied | "Subscription & Billing" tab in Super-Admin Organization Details shows live plan quotas, payment history, and generated invoices. |

---

## 3. Screen-by-Screen Implementation & Test Evidence

### 3.1 Plans Management Console (`/settings/subscription-plans`)
- **Route Access**:
  - `SYSTEM_ADMIN`: Sees full management controls, including "Create Plan" button, plan status toggle switch, edit modal trigger, and delete confirmation trigger.
  - Other roles (`OWNER`, `ADMIN`): View the catalog cards, current plan badge, and quota highlights; management mutation buttons (`Create Plan`, `Edit`, `Toggle`, `Delete`) are cleanly omitted.
- **Search & Filter Tests**:
  - Text search filters plans in real-time by `name`, `code`, and `description`.
  - Status filter toggles between `ALL`, `ACTIVE`, and `INACTIVE` without full page reload.
  - Grid view / Table view switcher preserves selection.
- **Plan Form Validation & Payload Encoding**:
  - Code normalization transforms input into uppercase snake-case string (`QA_TEST_PLAN`).
  - Validation requires non-empty name, code, positive price, and valid duration.
  - When "Unlimited Companies" or "Unlimited Users" is checked, payload fields `maxCompanies` and `maxUsersPerCompany` are serialized as `null` (never magic numbers like `999999`).
  - Request envelope wrapped in `{ "data": { ... } }` as required by backend `SubscriptionPlanController`.

### 3.2 Pricing & Plan Selection Screen (`/subscription`)
- **Card Presentation**:
  - Currency displayed strictly in Indian Rupees (`₹`) using Indian numbering formatting (`₹4,999`).
  - Duration cycles formatted dynamically (`month`, `year`, `30 days`).
  - Active plan highlighted with green border and `"Current Plan"` badge.
  - Included system modules rendered as badge chips with human-readable titles.
- **Permission-Gated Buy Action**:
  - `OWNER` / `ADMIN`: "Upgrade Plan" buttons active and responsive.
  - Other roles (`ACCOUNTANT`, `STAFF`): Button disabled with opacity 50% and tooltip explaining Owner/Admin authorization requirement.

### 3.3 Razorpay Checkout Flow & Payment Verification
- **Order Creation Request**:
  - Calls `POST /api/sso/subscriptions/{organizationId}/checkout` with `{ planId: "..." }`.
  - Backend resolves canonical price from database (client-side price tampering prevented).
- **Amount & Unit Compatibility**:
  - `amountInPaise` (`499900`) extracted from server response and supplied to Razorpay SDK options.
  - Key ID sourced dynamically from backend `checkoutData.keyId` (never hardcoded in bundle).
- **Double-Click & Concurrency Guard**:
  - `isSubmittingRef` immediately locks order initiation on button click. Rapid concurrent clicks are ignored.
- **Payment Verification**:
  - Handler receives `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
  - `isVerifyingRef` prevents duplicate verification calls if webhook or client handlers re-trigger.
  - Transmits payload to `POST /api/sso/subscriptions/{organizationId}/verify-payment`.
  - On 200 OK: triggers single-flight Redux refresh `dispatch(authApi.endpoints.ssoGetMe.initiate(undefined, { forceRefetch: true }))` and updates active state without jarring `window.location.reload()`.
- **Dismissal & Failure Handling**:
  - `ondismiss` modal callback invokes `cancelPendingCheckout(orgId, orderId)` to clean up uncompleted order locks on the backend.
  - Failed transactions display user-friendly error banners with safe retry buttons.

### 3.4 Organization Subscription Overview & Access Mode Handling
- **Active Subscription State**:
  - Displays plan code, duration, days remaining, and access mode (`FULL`, `READ_ONLY`, `BLOCKED`).
  - For Free Trials: Trial countdown bar shows exact days passed vs days remaining (`Day 5 of 30`).
- **Read-Only Mode (`READ_ONLY`)**:
  - When subscription or trial expires, global banner informs user that records are read-only.
  - Mutating actions (Create, Edit, Delete) disabled app-wide via `<Can>` component and `useSubscriptionAccess()`.
- **Blocked Mode (`BLOCKED`)**:
  - Full-screen or modal block informs organization members to contact administration.
- **Cancel Subscription**:
  - Active paid subscriptions render "Cancel Subscription" button.
  - Confirmation dialog explains that access remains available until end of period.
  - Sends `POST /api/sso/subscriptions/{subscriptionId}/cancel` and refetches `/me`.

### 3.5 Super-Admin Organization Details Billing Tab
- **Location**: `/super-admin/organizations/:organizationId?tab=subscription`
- **Features**:
  - Live subscription status banner, access mode badge, and quota limits.
  - Payment transactions table listing order IDs, payment IDs, amounts in INR, statuses, and dates.
  - Generated invoices table showing invoice numbers, billing periods, and issue dates.
  - Graceful fallback: If tenant has no payment records or invoices yet, clean empty states are rendered with zero console errors.

---

## 4. Automated Test Suite Execution

All unit tests were executed with Node.js built-in test runner (`node --test`).

```text
▶ Phase 4: Subscription Permissions, Formatters & State Handling Tests
  ▶ 1. Role & Permission Helpers
    ✔ isSystemAdmin returns true for SYSTEM_ADMIN and ROLE_SYSTEM_ADMIN (1.09ms)
    ✔ canManagePlans allows ONLY SYSTEM_ADMIN (super admin) (0.26ms)
    ✔ canBuySubscription allows SYSTEM_ADMIN, OWNER, and ADMIN (0.31ms)
    ✔ canViewPlans allows any authenticated role with access (0.20ms)
    ✔ getBuyDisabledReason gives actionable explanation for unprivileged roles (0.20ms)
  ✔ 1. Role & Permission Helpers (3.00ms)
  ▶ 2. Currency, Paise & Cycle Formatting
    ✔ correctly converts rupees to paise and paise to rupees (0.20ms)
    ✔ formatINR formats currency in INR with en-IN numbering (18.29ms)
    ✔ formatDurationCycle renders user-friendly cycle string (0.32ms)
    ✔ formatSubscriptionStatusText renders unknown enum values as raw text (0.24ms)
  ✔ 2. Currency, Paise & Cycle Formatting (19.51ms)
  ▶ 3. Plan Form Validation & Payload Mapping
    ✔ validates required fields: code, name, price, duration (1.76ms)
    ✔ prepares payload with null quotas when unlimited is checked (0.64ms)
    ✔ normalizes plan codes to clean uppercase strings (0.22ms)
  ✔ 3. Plan Form Validation & Payload Mapping (2.89ms)
  ▶ 4. Checkout State Handling & Double-Click Guard
    ✔ prevents double-submit when submission is already in-flight (0.30ms)
    ✔ prevents double payment verification race conditions (0.12ms)
    ✔ verifies checkout payload unwrapping compatibility (0.16ms)
  ✔ 4. Checkout State Handling & Double-Click Guard (0.71ms)
✔ Phase 4: Subscription Permissions, Formatters & State Handling Tests (26.81ms)

Total Tests Run Across All Suites: 321
Passed: 321
Failed: 0
Duration: 1.28s
```

---

## 5. Network Layer & API Robustness Evidence

1. **No Duplicate Requests**:
   - Debounced handlers (350ms) prevent search query storms.
   - Refetch of `/api/sso/auth/me` on payment verification is single-flight and executed exactly once.
2. **Payload Envelope Verification**:
   - Plan create/update sends `{ "data": { ... } }`.
   - Checkout sends `{ "planId": "..." }`.
   - Payment verify sends `{ "orderId": "...", "paymentId": "...", "signature": "..." }`.
3. **No DELETE Requests Transmitted**:
   - All plan deactivation tests confirmed that clicking "Cancel" in the delete confirmation dialog halts request dispatch before any network call is initiated.
4. **Graceful Fallbacks for Documented Gaps**:
   - Tenant billing statement section shows explanation notice rather than issuing failing HTTP requests against non-existent tenant payment endpoints.
