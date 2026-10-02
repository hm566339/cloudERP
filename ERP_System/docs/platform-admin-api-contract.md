# Platform Admin API Contract & Frontend Specifications

This contract defines the APIs and frontend UX requirements for the **Platform Admin / SaaS Operator Layer**.

All platform admin routes are prefixed with `/api/admin/`.

---

## 1. Authentication APIs

### 1.1 Platform Admin Login
* **Endpoint**: `POST /api/admin/auth/login`
* **Access**: Public
* **Request**:
```json
{
  "email": "operator@platform.com",
  "password": "StrongPassword123!"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsIn...",
    "tokenType": "Bearer",
    "adminId": "8f8c2b53-...",
    "email": "operator@platform.com",
    "fullName": "Jane Operator",
    "roles": ["SUPPORT_ADMIN"],
    "permissions": [
      "PLATFORM_DASHBOARD_READ",
      "PLATFORM_ORGANIZATION_READ",
      "PLATFORM_USER_READ",
      "PLATFORM_COMPANY_READ",
      "PLATFORM_SUPPORT_ACCESS",
      "PLATFORM_AUDIT_READ"
    ],
    "expiresIn": 28800
  }
}
```
* **Error Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```
*(Generic error; does not disclose whether email exists)*

### 1.2 Platform Admin Logout
* **Endpoint**: `POST /api/admin/auth/logout`
* **Access**: Authenticated (`PLATFORM_ADMIN`)

---

## 2. Platform Dashboard

### 2.1 Get Operational Metrics
* **Endpoint**: `GET /api/admin/dashboard`
* **Access**: Requires `PLATFORM_DASHBOARD_READ`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalOrganizations": 12,
    "activeOrganizations": 10,
    "trialOrganizations": 3,
    "expiredOrganizations": 1,
    "blockedOrganizations": 1,
    "totalUsers": 145,
    "totalCompanies": 28,
    "activeSubscriptions": 9,
    "activeSupportSessions": 1,
    "recentSecurityEvents": 4,
    "recentSupportSessions": [...],
    "recentAuditEvents": [...]
  }
}
```

---

## 3. Organization Management APIs

### 3.1 List Organizations
* **Endpoint**: `GET /api/admin/organizations?page=0&size=10&search=acme&status=ACTIVE&accessMode=FULL`
* **Access**: Requires `PLATFORM_ORGANIZATION_READ`
* **Returns**: Paginated summaries with user count, company count, access mode, subscription status.

### 3.2 Organization Detail
* **Endpoint**: `GET /api/admin/organizations/{organizationId}`
* **Access**: Requires `PLATFORM_ORGANIZATION_READ`
* **Returns**: Organization metadata, company listings, enabled modules, subscription summary.
*(Never returns customer passwords, JWT secrets, or client secrets)*

### 3.3 Organization Members
* **Endpoint**: `GET /api/admin/organizations/{organizationId}/members`
* **Access**: Requires `PLATFORM_USER_READ`
* **Returns**: Users, membership type, status, and authorized companies.

### 3.4 Organization Companies
* **Endpoint**: `GET /api/admin/organizations/{organizationId}/companies`
* **Access**: Requires `PLATFORM_COMPANY_READ`
* **Returns**: Companies belonging to the organization and enabled modules.

### 3.5 Organization Subscriptions & Billing
* **Endpoints**:
  * `GET /api/admin/organizations/{organizationId}/subscription` (Requires `PLATFORM_SUBSCRIPTION_READ`)
  * `GET /api/admin/organizations/{organizationId}/payments` (Requires `PLATFORM_PAYMENT_READ`)
  * `GET /api/admin/organizations/{organizationId}/invoices` (Requires `PLATFORM_SUBSCRIPTION_READ` or `PLATFORM_PAYMENT_READ`)

---

## 4. Support Access APIs

### 4.1 Create Support Session
* **Endpoint**: `POST /api/admin/support-sessions`
* **Access**: Requires `PLATFORM_SUPPORT_ACCESS`
* **Request**:
```json
{
  "organizationId": "d3b07384-...",
  "companyId": "c81e54c7-...",
  "moduleCode": "SALES",
  "reason": "Customer reported invoice calculation error on INV-1023",
  "durationMinutes": 30
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Support session created successfully",
  "data": {
    "id": "e9b2075a-...",
    "platformAdminId": "8f8c2b53-...",
    "organizationId": "d3b07384-...",
    "organizationName": "Acme Corp",
    "organizationCode": "ACME",
    "companyId": "c81e54c7-...",
    "companyName": "Acme Delhi",
    "companyCode": "ACMEDEL",
    "moduleId": "a1b2c3d4-...",
    "moduleCode": "SALES",
    "reason": "Customer reported invoice calculation error on INV-1023",
    "durationMinutes": 30,
    "status": "ACTIVE",
    "active": true,
    "expiresAt": "2026-09-24T04:45:00",
    "supportToken": "eyJhbGciOiJSUzI1Ni..."
  }
}
```

### 4.2 Revoke Support Session
* **Endpoint**: `POST /api/admin/support-sessions/{id}/revoke`
* **Access**: Requires `PLATFORM_SUPPORT_ACCESS`

### 4.3 Support Context Metadata
* **Endpoint**: `GET /api/admin/support-sessions/{id}/context`
* **Access**: Requires `PLATFORM_SUPPORT_ACCESS`
* **Returns**: Principal type (`PLATFORM_SUPPORT`), remaining seconds countdown, organization, company, and module metadata.

### 4.4 Execute Support Mutation
* **Endpoint**: `POST /api/admin/support-sessions/{id}/mutate`
* **Access**: Requires `SUPPORT_ADMIN` or `SUPER_ADMIN` (Blocked for `READ_ONLY_SUPPORT`)
* **Request**:
```json
{
  "action": "UPDATE_INVOICE",
  "resourceType": "INVOICE",
  "resourceId": "INV-1023",
  "reason": "Fixing line item rounding issue per ticket #4582",
  "payload": {
    "total": 1250.00
  }
}
```

---

## 5. Frontend UI / UX Specifications

Since this repository contains no frontend source code, the consuming frontend application (React, Angular, Vue, Next.js) must implement the following views:

### 5.1 Route Tree
```
/admin
├── /login                (Operator login page)
├── /dashboard            (KPIs, active support sessions, recent audit logs)
├── /organizations        (Searchable/filterable org directory)
│   └── /:id              (Org details: companies, members, subscriptions)
├── /support              (Active support sessions & session creator)
└── /admins               (Platform admin management - SUPER_ADMIN only)
```

### 5.2 Support Mode UX Safety Standards
When an operator starts a support session and enters customer context:
1. **Unmistakable Visual Banner**:
   A prominent fixed banner must appear across the top of the viewport (e.g., high-contrast warning amber/red) stating:
   ```
   ⚠️ SUPPORT MODE ACTIVE
   Organization: Acme Corp (ACME) | Company: Acme Delhi (ACMEDEL) | Module: Sales
   Reason: Ticket #4582 - Tax calculation fix
   Time Remaining: 24:31 [Exit Support Mode]
   ```
2. **Never Mask as Normal User**:
   The UI must never display customer profile avatars or mimic a standard customer login.
3. **Live Countdown Timer**:
   The remaining time must count down second-by-second. When 00:00 is reached, the UI immediately locks and redirects out of support mode.
4. **Immediate Exit Button**:
   Clicking `[Exit Support Mode]` immediately calls `POST /api/admin/support-sessions/{id}/revoke`, clears the session context, and returns to `/admin/support`.
