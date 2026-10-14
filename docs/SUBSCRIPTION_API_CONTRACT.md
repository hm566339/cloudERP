# CloudERP Subscription & Billing API Contract

> **Canonical Backend Source of Truth**  
> Services: `ERP_System` (SSO/Auth Service on port `8090`), routed via `gateway_service` on port `8080` (or `8085`) under `/api/sso/**`.  
> Derived directly from backend Java controllers, services, repositories, security filters, and database migrations.  
> Target: Frontend Implementation Only (Backend is READ-ONLY).

---

## 1. Authentication, Gateway Routing & Request Wrapping

### 1.1 Gateway Routing & Context Headers
- All subscription, plan, checkout, organization, and auth routes are hosted by `ERP_System` and reverse-proxied by `gateway_service` under `/api/sso/**`.
- **JWT Authentication**: Sent via `Authorization: Bearer <accessToken>` or via HttpOnly cookie `ACCESS_TOKEN` / `auth_token`.
- **Tenant Scoping Header**: `X-Company-Id: <uuid>` or authenticated session context from JWT.

### 1.2 Request & Response Envelopes
- **SSO Request Wrapper**: Certain endpoints (notably `POST /api/sso/subscription-plans`, `PUT /api/sso/subscription-plans/{id}`, `PUT /api/sso/subscription-plans/{id}/modules`) require payload wrapped in `{ "data": { ... } }`.
- **Flexible Checkout/Verification Parsing**: `SubscriptionCheckoutController` uses Jackson `readTree` and automatically unwraps `root.has("data") ? root.get("data") : root`. Therefore, `{ data: { ... } }` and raw `{ ... }` are both supported for checkout and payment verification.
- **SSO Standard Response Envelope**:
  ```json
  {
    "data": { ... },
    "error": null,
    "timestamp": "2026-10-14T05:00:00.000Z"
  }
  ```
  Unwrapping key in frontend client: `response.data?.data ?? response.data`.

---

## 2. Global ERP Shell Identity & Context: `/api/sso/auth/me`

### 2.1 Endpoint Specification
- **Method**: `GET`
- **Full Path**: `/api/sso/auth/me`
- **Query Parameters**:
  - `companyId` (UUID string, optional): Request context for a specific company switch.
- **Allowed Roles / Permissions**: Any authenticated user (`authenticated()`).
- **Response Shape**: `ResponseWrapper<SsoMeResponse>`

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "username": "owner@acme.com",
      "email": "owner@acme.com",
      "fullName": "Acme Owner",
      "empId": "EMP001",
      "accountStatus": "ACTIVE",
      "emailStatus": "VERIFIED",
      "createdAt": "2026-01-01T00:00:00"
    },
    "organization": {
      "id": "uuid",
      "code": "ORG_ACME",
      "name": "Acme Corporation",
      "status": "ACTIVE",
      "accessMode": "FULL",
      "timezone": "Asia/Kolkata",
      "currency": "INR"
    },
    "currentCompany": {
      "id": "uuid",
      "code": "ACME_HQ",
      "name": "Acme Headquarters",
      "legalName": "Acme India Pvt Ltd",
      "active": true
    },
    "companies": [
      {
        "id": "uuid",
        "code": "ACME_HQ",
        "name": "Acme Headquarters",
        "legalName": "Acme India Pvt Ltd",
        "active": true
      }
    ],
    "membership": {
      "memberId": "uuid",
      "memberType": "OWNER",
      "membershipStatus": "ACTIVE",
      "joinedAt": "2026-01-01T00:00:00"
    },
    "subscription": {
      "id": "uuid",
      "planCode": "ENTERPRISE",
      "status": "ACTIVE",
      "accessMode": "FULL",
      "trialStartedAt": "2026-01-01T00:00:00",
      "trialEndsAt": "2026-01-31T00:00:00",
      "currentPeriodStart": "2026-01-01T00:00:00",
      "currentPeriodEnd": "2027-01-01T00:00:00",
      "trialing": false,
      "daysRemaining": 78
    },
    "accessMode": "FULL",
    "modules": [
      {
        "id": "uuid",
        "name": "ACCOUNT",
        "code": "account",
        "host": "http://account-service:8081",
        "active": true
      }
    ],
    "roles": [
      { "id": "uuid", "name": "OWNER", "status": true }
    ],
    "features": [ "LEDGER_VIEW", "JOURNAL_ENTRY_CREATE" ],
    "permissions": [ "ACCOUNT:READ", "ACCOUNT:CREATE", "SUBSCRIPTION:READ" ]
  }
}
```

### 2.2 Access Mode Resolution in `/me`
1. If company subscription exists and is expired (`endAt < now` or `status == EXPIRED`), `accessMode = READ_ONLY`.
2. If organization subscription is `PENDING`, `accessMode = READ_ONLY`.
3. If organization subscription is `EXPIRED` or trial has ended (`trialEndsAt < now`), `accessMode = READ_ONLY`.
4. If organization entity itself has `accessMode == BLOCKED`, `effectiveAccessMode = BLOCKED`.
5. Otherwise, `accessMode = FULL`.

---

## 3. Subscription Plan Catalog API: `/api/sso/subscription-plans`

Security Filter: `SsoAuthorizationService` checks module `SUBSCRIPTION_PLAN` via `authorization.yml`.
- System Administrator bypass: Users with role `SYSTEM_ADMIN` or `ROLE_SYSTEM_ADMIN` possess unconditional full-access bypass (`SYSTEM_ADMIN_FULL_ACCESS`).
- Database Permission rules: Non-admin users require database permissions `SUBSCRIPTION_PLAN:READ`, `SUBSCRIPTION_PLAN:CREATE`, `SUBSCRIPTION_PLAN:UPDATE`, `SUBSCRIPTION_PLAN:DELETE`.

### 3.1 List Plans
- **Method**: `GET`
- **Path**: `/api/sso/subscription-plans`
- **Query Parameters**:
  - `active` (`Boolean`, optional): `true` returns only active plans (`findByActiveTrue()`); omitted or `null` returns all plans.
  - `search` (`String`, optional): Case-insensitive substring match against `name` and `code`.
- **Response**: `ResponseWrapper<List<SubscriptionPlanResponse>>`
  Sorted by `createdAt` ascending.

### 3.2 Get Plan by ID
- **Method**: `GET`
- **Path**: `/api/sso/subscription-plans/{id}`
- **Response**: `ResponseWrapper<SubscriptionPlanResponse>`
- **Errors**: `404 Not Found` if id does not exist.

### 3.3 Get Plan by Code
- **Method**: `GET`
- **Path**: `/api/sso/subscription-plans/code/{code}`
- **Response**: `ResponseWrapper<SubscriptionPlanResponse>`
- **Errors**: `404 Not Found` if code does not exist.

### 3.4 Create Plan
- **Method**: `POST`
- **Path**: `/api/sso/subscription-plans`
- **Authorization**: `SYSTEM_ADMIN` (or `SUBSCRIPTION_PLAN:CREATE`)
- **Request Envelope**: `{ "data": { ... } }` (MANDATORY RequestWrapper)
- **Body Fields (`SubscriptionPlanRequest`)**:
  - `code` (`String`, REQUIRED, `@NotBlank`): Normalized to uppercase alphanumeric with underscores. Must be unique.
  - `name` (`String`, REQUIRED, `@NotBlank`): Plan display title.
  - `description` (`String`, optional): Plan marketing/feature summary.
  - `durationDays` (`Integer`, REQUIRED, `@NotNull`, `@Min(1)`): Validity duration in days (default 30).
  - `price` (`BigDecimal`, optional, default `0.00`): Price in currency units (Rupees for INR).
  - `currency` (`String`, optional, default `"INR"`): 3-letter currency code.
  - `active` (`Boolean`, optional, default `true`): Whether plan is active in catalog.
  - `isTrial` (`Boolean`, optional, default `false`): Mark as free evaluation plan.
  - `maxCompanies` (`Integer`, optional, nullable): Max companies allowed (NULL = unlimited).
  - `maxUsersPerCompany` (`Integer`, optional, nullable): Max users per company (NULL = unlimited).
  - `maxUsers` (`Integer`, optional): Alias fallback for `maxUsersPerCompany`.
  - `moduleIds` (`List<UUID>`, optional): Initial system module IDs to associate with plan.
- **Response**: `201 Created` with `ResponseWrapper<SubscriptionPlanResponse>`
- **Errors**:
  - `400 Bad Request`: Validation failure (blank code/name, duration < 1).
  - `409 Conflict`: `DuplicateResourceException` if `code` already exists.

### 3.5 Update Plan
- **Method**: `PUT`
- **Path**: `/api/sso/subscription-plans/{id}`
- **Authorization**: `SYSTEM_ADMIN` (or `SUBSCRIPTION_PLAN:UPDATE`)
- **Request Envelope**: `{ "data": { ... } }`
- **Side Effects**:
  - If `price` changes, backend automatically clears `razorpayPlanId` and bumps `planVersion` (e.g. `v1` -> `v2`) to preserve historical subscription immutability.
  - If `moduleIds` provided, synchronizes `SubscriptionPlanModule` join table records.
- **Response**: `ResponseWrapper<SubscriptionPlanResponse>`

### 3.6 Toggle Plan Status
- **Method**: `PATCH`
- **Path**: `/api/sso/subscription-plans/{id}/status`
- **Query Parameter**: `active` (`Boolean`, REQUIRED)
- **Response**: `ResponseWrapper<SubscriptionPlanResponse>`

### 3.7 Assign Plan Modules
- **Method**: `PUT`
- **Path**: `/api/sso/subscription-plans/{id}/modules`
- **Authorization**: `SYSTEM_ADMIN` (or `SUBSCRIPTION_PLAN:UPDATE`)
- **Request Envelope**: `{ "data": { "moduleIds": [ "uuid", ... ] } }`
- **Response**: `ResponseWrapper<SubscriptionPlanResponse>`

### 3.8 Remove Plan Module
- **Method**: `DELETE`
- **Path**: `/api/sso/subscription-plans/{id}/modules/{moduleId}`
- **Response**: `ResponseWrapper<SubscriptionPlanResponse>`

### 3.9 Delete Plan (Soft Delete)
- **Method**: `DELETE`
- **Path**: `/api/sso/subscription-plans/{id}`
- **Authorization**: `SYSTEM_ADMIN` (or `SUBSCRIPTION_PLAN:DELETE`)
- **Behavior**: Soft-deletes / deactivates plan (`plan.setActive(false)`) to protect subscribed tenants.
- **Response**: `ResponseWrapper<{ "message": "Subscription plan deactivated successfully" }>`

---

## 4. Organization Subscription & Checkout API: `/api/sso/subscriptions`

Security Rules:
- Evaluated against module `SUBSCRIPTION` in `authorization.yml`.
- `SubscriptionBillingServiceImpl.assertOrganizationManagementAccess(organizationId)`:
  - Allowed if `PlatformSecurityUtil.isElevatedAdmin()`.
  - Allowed if caller's session `organizationId == targetOrgId`.
  - Allowed if caller has active `OrganizationMember` with `memberType == OWNER` or `memberType == ADMIN`.
  - Denied (`403 Forbidden`) for regular members or unauthorized users.

### 4.1 Initiate Checkout
- **Method**: `POST`
- **Path**: `/api/sso/subscriptions/{organizationId}/checkout`
- **Body**: `{ "planId": "uuid_or_code", "totalCount": 12, "customerNotify": 1 }` (or wrapped in `{ "data": ... }`)
- **Price Security**: Backend NEVER trusts price from client. Resolves plan from database, snapshots `priceAtSubscription` as immutable record.
- **Concurrent Checkout Protection**: Synchronized lock on `organizationId`. If identical pending checkout exists, reuses existing Razorpay order ID. If switching plans, safely marks older pending checkout as `CANCELLED`.
- **Response (`RazorpayCheckoutResponse`)**:
  ```json
  {
    "data": {
      "keyId": "rzp_test_xxxxxxxx",
      "orderId": "order_xxxxxxx",
      "amountInPaise": 499900,
      "subscriptionId": "order_xxxxxxx",
      "erpSubscriptionId": "uuid",
      "planName": "Pro Business",
      "planCode": "PRO",
      "amount": 4999.00,
      "currency": "INR",
      "organizationId": "uuid",
      "organizationName": "Acme Corp"
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Organization already has active subscription to this exact plan, or selected plan is free trial / inactive.

### 4.2 Verify & Activate Payment
- **Method**: `POST`
- **Path**: `/api/sso/subscriptions/{organizationId}/verify-payment`
- **Body**:
  ```json
  {
    "orderId": "order_xxxxxxx",
    "paymentId": "pay_xxxxxxx",
    "signature": "hmac_sha256_signature"
  }
  ```
- **Backend Verification Pipeline**:
  1. `assertOrganizationManagementAccess(organizationId)`.
  2. Cryptographic signature check: `razorpayService.verifyPaymentSignature(orderId, paymentId, signature)`.
  3. Ownership verification: Payment record must belong to `organizationId`.
  4. **Idempotency check**: If payment status is already `SUCCESS`, returns subscription immediately without duplicate extension.
  5. Secondary server verification with Razorpay REST API (`status == captured/authorized`, amount >= expected).
  6. Early renewal preservation: If subscription is currently `ACTIVE` and `currentPeriodEnd > now`, extends validity by `durationDays` starting from `currentPeriodEnd`! Otherwise starts fresh period from `now`.
  7. Updates `subscription.status = ACTIVE`, `subscription.accessMode = FULL`, `organization.accessMode = FULL`.
- **Response**: `ResponseWrapper<Subscription>`

### 4.3 Cancel Active Subscription
- **Method**: `POST`
- **Path**: `/api/sso/subscriptions/{subscriptionId}/cancel`
- **Authorization**: `OWNER` or `ADMIN` of owning organization, or elevated admin.
- **Behavior**: Cancels recurring subscription on Razorpay if present, sets ERP subscription `status = CANCELLED`, sets `cancelledAt = now`.
- **Response**: `ResponseWrapper<{ "message": "Subscription cancelled successfully" }>`

### 4.4 Cancel Pending Checkout
- **Method**: `POST`
- **Path**: `/api/sso/subscriptions/{organizationId}/checkout/cancel`
- **Body**: `{ "orderId": "order_xxxxxxx" }` (optional)
- **Behavior**: Safely marks uncompleted pending order and associated payment record as `CANCELLED`.
- **Response**: `ResponseWrapper<{ "message": "Pending checkout cancelled successfully" }>`

### 4.5 Activate Free Trial
- **Method**: `POST`
- **Path**: `/api/sso/subscriptions/{organizationId}/activate-trial`
- **Body**: `{ "planId": "30_DAY_FREE_TRIAL" }` (optional, defaults to active trial plan)
- **Rules**:
  - Denied if organization already has active paid subscription (`400 Bad Request`).
  - Idempotent: If active trial already running, returns existing trial subscription.
  - Denied if organization already completed or expired a trial (`400 Bad Request: Organization has already completed or expired their free trial`).
- **Response**: `ResponseWrapper<Subscription>`

### 4.6 Get Organization Subscription
- **Method**: `GET`
- **Path**: `/api/sso/subscriptions/{organizationId}/current`
- **Authorization**: `OWNER`, `ADMIN`, or elevated admin.
- **Response**: `ResponseWrapper<Subscription>`

---

## 5. Company Subscription API: `/api/sso/company-subscriptions`

- `GET /api/sso/company-subscriptions/current`
  Reads `RequestContext.companyId()` from session. Returns `ResponseWrapper<CompanySubscriptionResponse>`.
- `GET /api/sso/company-subscriptions/company/{companyId}`
  Asserts caller has company access or elevated admin. Returns `ResponseWrapper<CompanySubscriptionResponse>`.

---

## 6. Super Admin Platform Organization APIs: `/api/sso/admin/organizations`

Only accessible by elevated administrators (`SYSTEM_ADMIN`, `ROLE_SUPER_ADMIN`, `ROLE_PLATFORM_SUPPORT`, `PERM_PLATFORM_ORGANIZATION_READ`, `PERM_PLATFORM_SUBSCRIPTION_READ`).

- `GET /api/sso/admin/organizations/{organizationId}/subscription`
  Returns `ResponseWrapper<Subscription>`.
- `GET /api/sso/admin/organizations/{organizationId}/payments`
  Returns `ResponseWrapper<List<Payment>>`.
- `GET /api/sso/admin/organizations/{organizationId}/invoices`
  Returns `ResponseWrapper<List<Invoice>>`.

---

## 7. System Modules Catalog: `/api/sso/module`

- `GET /api/sso/module?status=true&page=0&pageSize=100`
  Returns `ResponseWrapper<ModuleListResponse>` where `modules` is `List<ModuleSummaryResponse>`.
  Used by the Plan Form and Plan Details modal to select and display modules (`ACCOUNT`, `INVENTORY`, `CRM`, `PURCHASES`, `WORKFLOW`, etc.).

---

## 8. Enums & State Machine Specification

### 8.1 SubscriptionStatus
```typescript
type SubscriptionStatus =
  | 'TRIALING'   // In trial period (accessMode = FULL)
  | 'ACTIVE'      // Paid subscription active (accessMode = FULL)
  | 'PENDING'     // Checkout initiated, awaiting payment (accessMode = READ_ONLY)
  | 'PAST_DUE'    // Payment retry failed / overdue
  | 'PAUSED'      // Temporarily paused
  | 'EXPIRED'     // Trial or billing period lapsed without payment (accessMode = READ_ONLY)
  | 'CANCELLED'   // Cancelled by user or super admin
  | 'SUSPENDED';  // Manually suspended by platform admin
```

### 8.2 AccessMode
```typescript
type AccessMode =
  | 'FULL'        // Complete read/write access to entitled modules
  | 'READ_ONLY'   // Read and export allowed; all mutations, creates, updates, deletes blocked
  | 'BLOCKED';    // Tenant access restricted; full-screen lock with purchase/logout option
```

### 8.3 State Transition Graph
```
[Unregistered]
       │
       ▼
 [Trial Signup] ────> TRIALING (accessMode: FULL, 30 days)
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
      [Period Elapsed]              [Checkout]
               │                         │
               ▼                         ▼
   EXPIRED (accessMode: READ_ONLY)    PENDING (accessMode: READ_ONLY)
               │                         │
               │        ┌────────────────┴────────────────┐
               │        ▼                                 ▼
               │   [Verify HMAC]                     [User Dismiss / Cancel]
               │        │                                 │
               └───────>▼                                 ▼
                     ACTIVE (accessMode: FULL)        CANCELLED
                        │
                        ▼
                 [User Cancel]
                        │
                        ▼
                    CANCELLED
```
