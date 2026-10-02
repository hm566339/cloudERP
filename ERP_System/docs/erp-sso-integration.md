# ERP ↔ SSO Integration Guide

This document describes the integration contract between the central SSO service and any downstream ERP application.

## Security Domains & Principal Types

The SSO service maintains strict domain separation between customer tenant users and SaaS platform operators:

| Principal Type | Target Endpoint Group | Description |
|---|---|---|
| `CUSTOMER` | `/api/sso/**` | Tenant end users, company admins, organization owners. Identified by `User` entity. |
| `PLATFORM_ADMIN` | `/api/admin/**` | SaaS operators, platform super admins. Identified by `PlatformAdmin` entity. Strictly blocked from calling customer routes directly. |
| `PLATFORM_SUPPORT` | `/api/sso/**` & downstream ERPs | Temporary, scoped support access tokens generated from an active `SupportAccessSession`. Scoped to `(Organization, Company, Module)` with explicit expiration and audit tracking. |

For detailed platform support specifications, see:
- [Platform Admin Architecture](file:///d:/final2/finalcode1/finalcode1/ERP_System/docs/platform-admin-architecture.md)
- [Platform Support Access Guide](file:///d:/final2/finalcode1/finalcode1/ERP_System/docs/platform-support-access.md)
- [Downstream Support Contract](file:///d:/final2/finalcode1/finalcode1/ERP_System/docs/platform-admin-erp-support-contract.md)

---

## Endpoint Classification Matrix (Phase 6B Audit)

All SSO endpoints referenced across documentation and client integrations are classified as follows:

| Endpoint | Method | Classification | Description |
|---|---|---|---|
| `/api/sso/auth/login` | POST | **IMPLEMENTED** | Multi-tenant organization login and legacy company login. |
| `/api/sso/auth/select-company` | POST | **IMPLEMENTED** | Validates member company access and issues tenant-scoped tokens. |
| `/api/sso/authorize` | GET | **IMPLEMENTED** | Validates token, verifies `user_id` matches session, validates module portal access, returns JSON authorization evaluation `{ authorized: true/false, ... }`. |
| `/api/sso/token/exchange` | POST | **IMPLEMENTED** | Exchanges one-time authorization code for access and refresh tokens. |
| `/api/sso/token/refresh` | POST | **IMPLEMENTED** | Rotates refresh tokens and issues refreshed access token. |
| `/api/sso/permissions/user/{userId}/effective` | GET | **IMPLEMENTED** | Returns merged permissions (role-inherited + user overrides). Requires admin authority or matching userId. |
| `/api/sso/permissions/user/{userId}/active` | GET | **IMPLEMENTED** | Returns active permission strings for caching. Requires admin authority or matching userId. |
| `/internal/authorization/check` | POST | **IMPLEMENTED BUT INTERNAL** | High-performance feature authorization evaluation endpoint for downstream microservices. |

---

### Organization-Aware Login

```
Client → POST /api/sso/auth/login
  Body: { organizationCode, username, password }
  SSO validates:
    1. User credentials (password + account status)
    2. Organization exists and is ACTIVE
    3. User has ACTIVE OrganizationMember for the organization
    4. At least one active MemberCompanyAccess exists
    5. Organization accessMode is not BLOCKED
    6. Subscription status permits login
  Response: { accessToken, refreshToken, companies[] }
```

### Company Selection

```
Client → POST /api/sso/auth/select-company
  Body: { organizationCode, companyId, username, password }
  SSO validates:
    1. All login validations above
    2. Company belongs to the organization
    3. MemberCompanyAccess is active for this member + company
    4. Module entitlement (if module-specific login)
    5. User portal access for the target module
  Response: { accessToken, refreshToken, session context }
```

### Legacy Company Login

```
Client → POST /api/sso/auth/login
  Body: { companyCode, username, password }
  SSO validates:
    1. Company exists by companyCode
    2. User credentials
    3. Account status
  Response: { accessToken, refreshToken }
```

> Legacy login remains for backward compatibility but does not establish organization context.

## Organization Routing

The SSO provides organization discovery:

```
GET /api/sso/organization/{organizationCode}
```

Returns the organization's display name, code, and login URL. This is a public endpoint for routing/discovery only — it is **not** authorization.

## Company Selection (Authorized Companies Only)

After login, the SSO returns only companies the authenticated user has active `MemberCompanyAccess` for. The ERP must:

1. Show only the companies returned by the SSO
2. Never allow the user to select a company not in the authorized list
3. Never trust a `companyId` from request parameters as authorization proof

## Authorization Evaluation & Token Exchange

### 1. Direct Authorization Evaluation

```
GET /api/sso/authorize?user_id={userId}&module_id={moduleId}
Authorization: Bearer {ssoAccessToken}
```
SSO validates:
1. Valid, unexpired access token matching an active session
2. `userId` strictly matches token user ID (cross-user spoofing fails with `"authorized": false`)
3. Module exists and is active
4. Module is enabled for the company (`CompanyModule`)
5. User has active portal access for the module (`UserPortalAccess`)

Response:
```json
{
  "success": true,
  "data": {
    "authorized": true,
    "companyId": "...",
    "companyCode": "...",
    "moduleId": "...",
    "moduleName": "...",
    "roles": ["..."],
    "permissions": ["READ", "WRITE"]
  }
}
```

### 2. Authorization Code Exchange Flow (Module Redirect)

When initiating login with a `clientId` parameter:
```
1. Client logs in with clientId:
   POST /api/sso/auth/login (with clientId)
   SSO generates one-time authorization code bound to (user, company, module).

2. SSO returns redirectUrl:
   {module.host}/auth/callback?code={authCode}

3. ERP exchanges code for tokens:
   POST /api/sso/token/exchange
   Body: { code, clientId, clientSecret }
   Response: { accessToken, refreshToken, userId, companyId, ... }
```

The authorization code is:
- One-time use (marked `used = true` after exchange)
- Time-limited (expires after configured duration, e.g. 5 minutes)
- Bound to a specific user, company, organization, and module

## Authorization Model

### JWT Claims (Context Snapshots — NOT Authorization)

The JWT access token contains:

| Claim | Purpose | Authoritative? |
|---|---|---|
| `sub` | Username | Routing only |
| `userId` | User UUID | Routing only |
| `companyCode` | Company code | Routing only |
| `companyName` | Company name | Display only |
| `organizationCode` | Organization code | Routing only |
| `organizationId` | Organization UUID | Routing only |
| `moduleName` | Module name | Routing only |
| `roles` | Role names | Snapshot only |
| `token_type` | `access` or `refresh` | Validation |

> [!IMPORTANT]
> JWT claims are **snapshots** taken at token issuance. They are **never** sufficient by themselves to authorize a request. Server-side state (session, membership, company access, subscription) is authoritative.

### Server-Side Authorization (Authoritative)

On every authenticated request, the SSO's `JwtAuthenticationFilter` checks:

1. JWT signature and expiration
2. Session exists in database by access token
3. Session has not expired (`accessTokenValidTill`)
4. User `accountStatus == ACTIVE`
5. `OrganizationMember` with `membershipStatus == ACTIVE` (if organization session)
6. `MemberCompanyAccess` is active for member + company (if organization session)
7. `Organization.accessMode` is not `BLOCKED`
8. If `READ_ONLY` and the request is a business write → reject

This creates a `RequestContext` (thread-local) with:
- `userId` — authenticated user
- `organizationId` — authorized organization
- `companyId` — authorized company
- `clientId` — module client ID
- `accessMode` — `FULL`, `READ_ONLY`, or `BLOCKED`

## Module Entitlement

Each organization has module entitlements via `OrganizationModule`:

- Organization A has Module X (enabled = true) → users can access Module X
- Organization A does NOT have Module Y → users cannot access Module Y

Each company has module access via `CompanyModule`:
- Company A1 has Module X active → Module X available for Company A1
- Company A1 does NOT have Module Y → Module Y unavailable for Company A1

Each user has portal access via `UserPortalAccess`:
- User U1 has access to CompanyModule(A1, X) → User can use Module X in Company A1

All three layers (org, company, user) must be satisfied.

## READ_ONLY Behavior

When `Organization.accessMode == READ_ONLY`:

### Allowed
- Login and authentication
- Company selection
- All GET/read operations
- Report generation and viewing
- Dashboard access
- Subscription renewal/billing flows

### Blocked
- POST (create)
- PUT (update)
- PATCH (partial update)
- DELETE (delete)
- Bulk mutations
- Any business-state modification

The SSO filter blocks write HTTP methods on business paths when access mode is `READ_ONLY`. Excluded paths (authentication, billing, token operations) are not blocked.

## Permission Checks

### Internal Authorization Endpoint

Downstream ERP services can verify permissions via:

```
POST /internal/authorization/check
Authorization: Bearer {accessToken}
Body: {
  "userId": "...",
  "featureCode": "INVENTORY",
  "action": "WRITE"
}
Response: {
  "authorized": true/false,
  "reason": "..."
}
```

### Effective Permissions

```
GET /api/sso/permissions/user/{userId}/effective
```

Returns the merged permission set (role-inherited + user-level overrides).

### Active Permissions

```
GET /api/sso/permissions/user/{userId}/active
```

Returns currently active permission codes for caching.

## Write Enforcement

Every tenant-sensitive mutation in the ERP must:

1. Verify authenticated user from `RequestContext`
2. Verify organization context
3. Verify company context (company belongs to organization)
4. Verify active membership
5. Verify active company access
6. Check module entitlement
7. Check required permission/role
8. Call `requireWriteAccess()` before the mutation

## Revocation Behavior

### Membership Revoked
- SSO filter rejects: `OrganizationMember` check fails
- Effect: immediate on next request

### Company Access Revoked
- SSO filter rejects: `MemberCompanyAccess` check fails
- Effect: immediate on next request

### User Disabled
- SSO filter rejects: `accountStatus != ACTIVE`
- Effect: immediate on next request

### Organization Blocked
- SSO filter rejects: `accessMode == BLOCKED`
- Effect: immediate on next request

### Token Expired
- SSO filter rejects: `accessTokenValidTill < now`
- Effect: immediate; client must refresh

### Session Deleted
- SSO filter rejects: session not found by access token
- Effect: immediate

> The SSO does NOT rely solely on JWT expiration. Every request is validated against persisted session/membership/access state.

## Token Refresh

```
POST /api/sso/token/refresh
Body: { refreshToken, clientId }
```

Validates:
- Refresh token record exists and is not expired
- Token family is valid (rotation/reuse detection)
- User is active
- Module and company access are still valid

## Logout / Session Revocation

```
POST /api/sso/auth/logout
Authorization: Bearer {accessToken}
```

Deletes the session record. Subsequent requests with the same token fail immediately.

## Error Handling

| Scenario | HTTP Status | Response |
|---|---|---|
| Invalid/expired token | 401 | `{"message":"Invalid token"}` |
| Session revoked | 401 | `{"message":"Session revoked. Please login again."}` |
| User inactive | 401 | `{"message":"User account is inactive"}` |
| Org/company access revoked | 401 | `{"message":"Organization or company access revoked"}` |
| Organization blocked | 401 | `{"message":"Organization access is blocked"}` |
| Session expired | 401 | `{"message":"Session expired. Please login again."}` |
| Missing company in token | 401 | `{"message":"Invalid token. Company information missing."}` |
| Read-only write attempt | 401 | `{"message":"Organization is read-only"}` |
| Forbidden (authorization) | 403 | `{"message":"..."}` |
| Resource not found | 404 | `{"message":"..."}` |
| Direct platform admin token on customer route | 403 | `{"message":"Platform administrators cannot directly access customer resources without a support session"}` |
| Customer token on platform admin route | 403 | `{"message":"Platform administrative access required"}` |
| Support session expired | 401 | `{"message":"Support access session has expired"}` |
| Support session revoked | 401 | `{"message":"Support access session is no longer active"}` |
