# API Contract — CloudERP SSO / Auth Service

> **Backend**: Spring Boot Java — `@RequestMapping("/api/sso/")` base path  
> **Response Envelope (all endpoints)**:
> ```json
> { "success": true, "message": "...", "data": <T> }
> ```
> **Error Envelope**:
> ```json
> { "success": false, "message": "Human readable error", "errors": [...] }
> ```
> **Token Storage**: httpOnly cookies `ACCESS_TOKEN`, `ACCESS_TOKEN_REFRESH` + non-httpOnly `auth_token` (same value) set by backend via `Set-Cookie` headers.  
> **Auth Header**: `Authorization: Bearer <token>` (also accepted via cookies).

---

## Auth Flow Overview

| Step | Endpoint | Description |
|------|----------|-------------|
| 1. Org Lookup | `GET /api/sso/organization/{organizationCode}` | Resolve org from code before login |
| 2. Login | `POST /api/sso/auth/login` | User login → sets cookies + returns LoginResponse |
| 3. Select Company | `POST /api/sso/auth/select-company` | Select company within org → refreshes cookies |
| 4. Me / Bootstrap | `GET /api/sso/auth/me` | Canonical auth context for entire shell |
| 5. Refresh | `POST /api/sso/token/refresh` | Refresh access token via cookie or body |
| 6. Logout | `POST /api/sso/auth/logout` | Clears all 6 auth cookies (maxAge=0) |

---

## 1. Organization Signup

```
POST /api/sso/signup
```
Auth required: No  
Request body: `{ "organizationName": "string", "email": "string", "password": "string", ... }`  
Response 200: `{ "success": true, "data": { "organizationId": "uuid", "organizationCode": "string", ... } }`

---

## 2. Organization Lookup

```
GET /api/sso/organization/{organizationCode}
```
Auth required: No  
Path param: `organizationCode` (string)  
Response 200: `{ "success": true, "data": { "id": "uuid", "code": "string", "name": "string", ... } }`

---

## 3. User Login

```
POST /api/sso/auth/login
```
Auth required: No  
Request body (wrapped):
```json
{
  "data": {
    "email": "string (required)",
    "password": "string (required)",
    "organizationCode": "string (optional)",
    "companyId": "uuid (optional)"
  }
}
```
Response 200 + Set-Cookie (ACCESS_TOKEN, ACCESS_TOKEN_REFRESH, auth_token):
```json
{
  "success": true,
  "data": {
    "accessToken": "string|null",
    "refreshToken": "string|null",
    "user": { "id": "uuid", "email": "string", "username": "string", "fullName": "string" },
    "companies": [...]
  }
}
```
Cookies set: ACCESS_TOKEN (httpOnly=false), ACCESS_TOKEN_REFRESH (httpOnly=false), auth_token (httpOnly=false)

---

## 4. Admin Login

```
POST /api/sso/auth/admin-login
```
Same request body as login (wrapped).  
Response 200 — tokens set ONLY in httpOnly cookies; body has `accessToken: null`, `refreshToken: null`.  
Cookies set: ACCESS_TOKEN (httpOnly=TRUE), ACCESS_TOKEN_REFRESH (httpOnly=TRUE), auth_token (httpOnly=false)

---

## 5. Select Company

```
POST /api/sso/auth/select-company
```
Auth required: Yes  
Request body (wrapped):
```json
{ "data": { "organizationCode": "string (required)", "companyId": "uuid (required)" } }
```
Response 200 + refreshed cookies (same shape as login)

---

## 6. Logout

```
POST /api/sso/auth/logout
```
Auth required: Optional (Authorization header or cookie)  
Response 200: `{ "success": true, "data": { "message": "logged out" } }`  
Cookies cleared (maxAge=0): ACCESS_TOKEN, ACCESS_TOKEN_REFRESH, auth_token, SSO_SESSION, access_token, refresh_token

---

## 7. Get Current User (SSO Me) — CANONICAL

```
GET /api/sso/auth/me
```
Auth required: Yes — Bearer token in Authorization header OR cookies  
Query params: `companyId` (UUID, optional — switches company context)  
Response 200:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid", "username": "string", "email": "string",
      "fullName": "string", "empId": "string",
      "accountStatus": "ACTIVE|INACTIVE",
      "emailStatus": "VERIFIED|UNVERIFIED",
      "role": "string", "companyCode": "string", "companyId": "uuid"
    },
    "organization": { "id": "uuid", "code": "string", "name": "string", "status": "string" },
    "currentCompany": { "id": "uuid", "code": "string", "name": "string", "legalName": "string", "active": true },
    "companies": [...],
    "membership": { "memberId": "uuid", "memberType": "OWNER|MEMBER", "membershipStatus": "string" },
    "subscription": {
      "id": "uuid", "planCode": "string", "status": "string",
      "accessMode": "FULL|READ_ONLY|BLOCKED",
      "trialing": true, "daysRemaining": 30, "trialEndsAt": "ISO-date"
    },
    "accessMode": "FULL|READ_ONLY|BLOCKED",
    "modules": [{ "id": "uuid", "name": "string", "code": "string", "canonical": "string", "active": true }],
    "features": [{ "featureCode": "string", "featureName": "string", "moduleName": "string", "active": true }],
    "permissions": [{ "featureCode": "string", "action": "string", "permissionCode": "string", "moduleName": "string", "allowed": true, "active": true }]
  }
}
```
Error 401: token missing or invalid

---

## 8. Token Refresh

```
POST /api/sso/token/refresh
```
Auth required: No (refresh token in cookie or body)  
Request body (any form): `{ "data": { "refreshToken": "string" } }`  
OR cookies: ACCESS_TOKEN_REFRESH / refresh_token / refreshToken  
Response 200 + new cookies:
```json
{ "success": true, "data": { "accessToken": "string", "refreshToken": "string" } }
```
Cookies set: ACCESS_TOKEN (httpOnly=false), ACCESS_TOKEN_REFRESH (httpOnly=false), auth_token (httpOnly=false)

---

## 9. Admin Token Refresh

```
POST /api/sso/admin/token/refresh
```
Same as above but cookies set httpOnly=TRUE.

---

## 10. Token Verify

```
POST /api/sso/token/verify
```
Auth required: Yes (Authorization: Bearer header)  
Response 200: `{ "success": true, "data": { "valid": true, "userId": "uuid" } }`

---

## 11. Token Revoke

```
POST /api/sso/token/revoke
```
Auth required: Yes  
Request body (wrapped): `{ "data": { "token": "string" } }`  
Response 200: `{ "success": true, "data": { "message": "token revoked" } }`

---

## 12. Token Exchange

```
POST /api/sso/token/exchange
```
Auth required: No (client credentials)  
Request body (wrapped): `{ "data": { "code": "string", "clientId": "uuid", "clientSecret": "string" } }`  
Response 200 + cookies: `{ accessToken, refreshToken, ... }`

---

## 13. Authorize

```
GET /api/sso/authorize
```
Auth required: Yes (Authorization header)  
Query params: `user_id` (UUID), `module_id` (UUID)  
Response 200: `{ "success": true, "data": { ... } }`

---

## 14. Portal Access

```
GET /api/sso/portal-access/{companyId}
```
Auth required: Yes  
Path param: companyId (UUID)  
Query params: `page` (int, required), `pageSize` (int, required), `search` (optional), `status` (boolean, optional)  
Response 200: `{ "success": true, "data": { "items": [...], "pagination": { ... } } }`

---

## 15. User Endpoints — `/api/sso/user`

| Method | Path | Params | Notes |
|--------|------|--------|-------|
| POST | /api/sso/user | q: companyId, module (both UUID, required) | body: `{data: CreateUserByAdmin}` |
| GET | /api/sso/user/{id} | — | — |
| GET | /api/sso/user/company/{companyId} | q: page, pageSize, search?, status?, role? | — |
| PUT | /api/sso/user/{id} | — | body: `{data: UpdateUserRequest}` |
| DELETE | /api/sso/user/{id} | — | — |
| POST | /api/sso/user/{id}/resend-setup-email | — | — |
| POST | /api/sso/user/{id}/role | — | body: `{data: {roleId: uuid}}` |
| DELETE | /api/sso/user/{id}/role/{roleId} | — | — |
| POST | /api/sso/user/{id}/portal-access | — | body: `{data: {moduleId: uuid}}` |
| DELETE | /api/sso/user/{id}/portalaccess/{moduleId} | — | — |
| PATCH | /api/sso/user/{userId}/portal/{moduleId}/toggle | — | — |
| POST | /api/sso/user/{id}/change-password | — | body: `{data: {currentPassword, newPassword}}` |
| GET | /api/sso/user/verify-email | q: token (string) | No auth |
| POST | /api/sso/user/forgot-password | q: email, companyCode | No auth |
| POST | /api/sso/user/reset-password | q: token? | body: `{token, password, confirmPassword}` |
| PATCH | /api/sso/user/{userId}/verify-email | q: status | — |
| PATCH | /api/sso/user/{id}/status | q: status (ACTIVE/INACTIVE) | — |

Password: 8-50 chars, must contain uppercase + lowercase + digit + special char (@#$%^&+=)

---

## 16. Role Endpoints — `/api/sso/role`

| Method | Path | Params |
|--------|------|--------|
| POST | /api/sso/role | q: companyId (UUID) |
| GET | /api/sso/role | q: companyId (required), page, pageSize, search?, status? |
| GET | /api/sso/role/{id} | q: page, pageSize, search?, status? |
| PUT | /api/sso/role/{id} | — |
| PATCH | /api/sso/role/{id}/status | q: status (boolean) |
| DELETE | /api/sso/role/{id} | — |

---

## 17. Company Endpoints — `/api/sso/company`

| Method | Path | Notes |
|--------|------|-------|
| POST | /api/sso/company | multipart: request (JSON part), logo (file, optional). Auth header required. |
| PUT | /api/sso/company/{id} | multipart: request (JSON part), logo (file, optional) |
| GET | /api/sso/company/{id} | — |
| GET | /api/sso/company/code/{companyCode} | — |
| GET | /api/sso/company | q: page(1), pageSize(10), search?, active? |
| DELETE | /api/sso/company/{id} | — |
| PATCH | /api/sso/company/{id}/status | q: active (boolean) |
| GET | /api/sso/company/open | No auth |
| GET | /api/sso/company/company-verify | q: id?, companyCode? |

File upload (logo): Content-Type multipart/form-data, field name `logo`

---

## Role Model

| Backend String | Normalized (frontend) | Level |
|---------------|----------------------|-------|
| SUPER_ADMIN / SystemAdmin | super_admin | Platform |
| OWNER / OrganizationOwner | owner | Organization |
| COMPANY_ADMIN | company_admin | Company |
| FINANCE_MANAGER | finance_manager | Role |
| ACCOUNTANT | accountant | Role |
| AP_EXECUTIVE | ap_executive | Role |
| AR_EXECUTIVE | ar_executive | Role |
| CASHIER | cashier | Role |
| GL_ACCOUNTANT | gl_accountant | Role |
| TAX_MANAGER | tax_manager | Role |
| BUDGET_MANAGER | budget_manager | Role |
| BANK_MANAGER | bank_manager | Role |
| AUDITOR | auditor | Role |
| CFO | cfo | Role |

Membership type: `OWNER` | `MEMBER`  
Access modes: `FULL` | `READ_ONLY` | `BLOCKED`

---

## Multi-Tenancy Rules

- Global (no companyId): All `/api/sso/*` paths
- Business (company-scoped): `/api/account/*`, `/api/inventory/*`, `/api/purchase/*`, `/api/sales-crm/*`, `/api/hr/*`, `/api/dashboard/*`, etc.
- OWNER/SystemAdmin: MUST send `companyId` query param AND `X-Company-Id` header
- Non-privileged roles: backend resolves company from JWT; do NOT send `companyId` query param; send `X-Company-Id` header

---

## Session/Cookie Summary

| Cookie | httpOnly | Notes |
|--------|----------|-------|
| ACCESS_TOKEN | false (login/refresh), true (admin-login) | Access JWT |
| ACCESS_TOKEN_REFRESH | false (login/refresh), true (admin-login) | Refresh JWT |
| auth_token | false | Alias for ACCESS_TOKEN |
| SSO_SESSION | true | Cleared on logout only |
