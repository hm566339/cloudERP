# Phase 6B: Platform Support & Downstream ERP Validation Report

## 1. Executive Summary

Phase 6B focuses on verifying the security and functionality of the Platform Support mechanism against downstream ERP applications, auditing SSO contract documentation against implementation, and resolving tenant IDOR and boundary enforcement gaps.

Key outcomes of Phase 6B:
- **Downstream ERP Status**: Exhaustive workspace search confirmed that `com.erp.auth_service` is the sole application in the repository. No downstream ERP business modules (Sales, Inventory, HR, Accounting) currently exist in the repository. As required by Section 1, implementation against imaginary downstream code was stopped, and the exact blocked integration requirements were codified in `phase-6b-erp-integration-blocked.md`.
- **SSO Documentation Audit**: Classified all documented endpoints in `erp-sso-integration.md` and corrected contract discrepancies regarding `/api/sso/authorize` and OAuth2 token exchange flows.
- **Tenant & Company IDOR Hardening**: Remediated IDOR vulnerabilities across `CompanyServiceImpl`, `CompanyModuleServiceImpl`, `UserServiceImpl`, `UserAccessServiceImpl`, and `PermissionController`.
- **Automated Test Suite**: Expanded test suite from 80 to 92 tests with 0 failures, 0 errors, and 0 skipped.

---

## 2. Real ERP Discovery

* **Application / Repository Found**: `com.erp:auth_service` (`ERP_System` workspace).
* **Downstream ERP Repositories**: **NONE FOUND** in the workspace.
* **Downstream Business Resources**: None (entities present are limited to SSO/Identity/Tenant administration: `User`, `Company`, `Organization`, `Module`, `PlatformAdmin`, `SupportAccessSession`, `Subscription`, `Invoice` [subscription billing invoice]).
* **Blocked Specification**: Created `docs/phase-6b-erp-integration-blocked.md` detailing the exact SSO contract, endpoint schemas, token validation requirements, and required test suites for when the downstream ERP repository is provided.

---

## 3. Resources Tested (SSO Boundary & Support Engine)

The following real controllers, services, and security components in `com.erp.auth_service` were audited and tested:
1. `PlatformSupportController` & `PlatformSupportService`:
   - `POST /api/admin/support-sessions` (Session creation with Org + Company + Module scoping)
   - `GET /api/admin/support-sessions/{id}/context` (Session introspection)
   - `POST /api/admin/support-sessions/{id}/revoke` (Session revocation)
   - `POST /api/admin/support-sessions/{id}/mutate` (Audited support mutation)
2. `CompanyController` & `CompanyServiceImpl`:
   - `GET /api/sso/company/{id}`
   - `PUT /api/sso/company/{id}`
   - `DELETE /api/sso/company/{id}`
   - `PATCH /api/sso/company/{id}/status`
3. `CompanyModuleController` & `CompanyModuleServiceImpl`:
   - `POST /api/sso/company-modules`
   - `GET /api/sso/company-modules/{id}`
   - `GET /api/sso/company-modules/company/{companyId}`
   - `PUT /api/sso/company-modules/{id}`
   - `DELETE /api/sso/company-modules/{id}`
4. `UserController` & `UserServiceImpl`:
   - `POST /api/sso/user`
   - `GET /api/sso/user/{id}`
   - `GET /api/sso/user/company/{companyId}`
   - `PUT /api/sso/user/{id}`
   - `DELETE /api/sso/user/{id}`
5. `AuthController` & `AuthServiceImpl`:
   - `GET /api/sso/authorize?user_id=...&module_id=...`
   - `POST /api/sso/token/exchange`
6. `PermissionController` & `FeatureController`:
   - `GET /api/sso/permissions/user/{userId}`
   - `GET /api/sso/permissions/user/{userId}/active`
   - `GET /api/sso/permissions/user/{userId}/effective`

---

## 4. Support Read & Write Verification

### Support Read Flow
```
Platform Admin Login
        │ (email/password -> Platform Admin Token)
        ▼
Create Support Session (Org A, Company A1, Module: SALES, duration: 30m, reason: "Ticket #4492")
        │
        ▼
Support Token Issued (principalType: PLATFORM_SUPPORT, supportSessionId, orgId, companyId, module)
        │
        ▼
Server-Side Authorization (JwtAuthenticationFilter & RequestContext)
        ├── Validates Platform Admin is ACTIVE
        ├── Validates SupportAccessSession exists, is ACTIVE, not expired, not revoked
        ├── Validates Organization is not BLOCKED
        ├── Sets RequestContext(adminId, orgA, companyA1, moduleId, accessMode)
        └── Enforces Company A1 boundary (attempting to read Company A2 throws 403 Forbidden)
```
- Customer password is **never requested**.
- Customer token is **not required**.
- Support session is visible and audited.

### Support Write Flow
```
Support Session (Company A1, Module: SALES)
        │
        ▼
Support Mutation Request (`POST /api/admin/support-sessions/{id}/mutate`)
        ├── Check Platform Admin active status
        ├── Check Admin has mutation rights (rejects READ_ONLY_SUPPORT role)
        ├── Check Organization accessMode != READ_ONLY and != BLOCKED
        ├── Set RequestContext
        ├── requireWriteAccess() check
        ├── Execute mutation
        ├── Record PlatformAuditLog (adminId, sessionId, orgId, companyId, resourceType, resourceId, reason)
        └── Clear RequestContext
```

---

## 5. Security Attack & Boundary Tests

### Cross-Company Attack Tests
- **Attack**: Authenticated caller or support session scoped to Company A1 attempts to read or mutate Company A2 via `getCompanyById`, `updateCompany`, `deleteCompany`, or `changeStatus`.
- **Result**: `ForbiddenException("Access denied: Company does not match authorized company context")`. No data leaked, no mutation performed.
- **Attack**: Querying users of Company A2 (`getAllUsers`) from Company A1 session.
- **Result**: `ForbiddenException`. Cross-company enumeration blocked.

### Cross-Organization Attack Tests
- **Attack**: Caller in Organization A targets Company B1 in Organization B.
- **Result**: `ForbiddenException("Access denied: Company does not belong to authorized organization")`.
- **Attack**: Creating a support session for Company B1 under Organization A.
- **Result**: `InvalidOperationException("Company does not belong to requested organization")`. Audit log records `CROSS_ORG_SUPPORT_ATTEMPT` with status `DENIED`.

### Cross-Module Attack Tests
- **Attack**: Operator requests support session for a module not entitled for the customer's organization.
- **Result**: `InvalidOperationException("Module is not entitled for organization")`. Session denied and audited.
- **Attack**: Operator requests support session for a module not enabled for the specific company.
- **Result**: `InvalidOperationException("Module is not enabled for company")`. Session denied and audited.

### User-ID Security & Spoofing Tests
- **Attack**: Caller authenticated as User A requests `/api/sso/authorize?user_id=USER_B&module_id=...`.
- **Result**: Evaluates to `authorized: false, reason: "User mismatch"`. No code generated for User B.
- **Attack**: Caller authenticated as User A requests `/api/sso/permissions/user/USER_B/effective` or `/active`.
- **Result**: `ForbiddenException("Access denied: Cannot access data for another user")`.

---

## 6. Support Session Lifecycle & Revocation

1. **Immediate Revocation**:
   - Calling `POST /api/admin/support-sessions/{id}/revoke` sets status to `REVOKED` and logs audit entry.
   - Subsequent request with the support token is rejected immediately with `403 Forbidden ("Support session is expired or revoked")`.
2. **Session Expiration**:
   - Requests after `expiresAt` are rejected with `403 Forbidden`.
3. **Platform Admin Disablement**:
   - Setting operator `status = INACTIVE` causes immediate rejection on all support requests with `403 Forbidden ("Platform admin is inactive")`.

---

## 7. Organization READ_ONLY Policy

- **Customer Reads**: Permitted.
- **Customer Writes**: Blocked with `403 Forbidden ("Organization is read-only")`.
- **Support Writes**: In `PlatformSupportService.executeSupportMutation()`, if `org.getAccessMode() == AccessMode.READ_ONLY`:
  - Request is blocked with `ForbiddenException ("Cannot mutate data in READ_ONLY organization")`.
  - Support sessions do **not** silently bypass `READ_ONLY`.
  - For emergency overrides, an explicit separate permission (`SUPPORT:WRITE_READ_ONLY`) and audited justification are required.

---

## 8. Audit Logging Verification

Every support action records a comprehensive audit entry in `PlatformAuditLog`:
* `platformAdminId`: UUID of operator
* `supportSessionId`: UUID of active support session
* `organizationId`: Customer organization UUID
* `companyId`: Scoped company UUID
* `moduleId`: Scoped module UUID
* `resourceType`: Affected resource type
* `resourceId`: Affected resource identifier
* `action`: Action performed (e.g., `SUPPORT_SESSION_CREATED`, `SUPPORT_SESSION_REVOKED`, mutation action)
* `reason`: Operator-supplied diagnostic justification
* `status`: `SUCCESS` or `DENIED`
* `timestamp`: Precise server timestamp
* **Credential Protection**: Passwords, secrets, and raw JWTs are never written to audit logs.

---

## 9. Documentation Discrepancies Corrected

In `docs/erp-sso-integration.md`:
1. **Added Endpoint Classification Matrix**:
   - `/api/sso/auth/login`: `IMPLEMENTED`
   - `/api/sso/auth/select-company`: `IMPLEMENTED`
   - `/api/sso/authorize`: `IMPLEMENTED`
   - `/api/sso/token/exchange`: `IMPLEMENTED`
   - `/api/sso/token/refresh`: `IMPLEMENTED`
   - `/api/sso/permissions/user/{userId}/effective`: `IMPLEMENTED`
   - `/api/sso/permissions/user/{userId}/active`: `IMPLEMENTED`
   - `/internal/authorization/check`: `IMPLEMENTED BUT INTERNAL`
2. **Clarified `/api/sso/authorize` Flow**:
   - Documentation previously described `/api/sso/authorize` as initiating an OAuth2 302 redirect.
   - Code reality: `/api/sso/authorize` is a direct JSON evaluation endpoint returning `{ success: true, data: { authorized: true/false, ... } }`.
   - Authorization codes for module redirection are generated during `POST /api/sso/auth/login` when `clientId` is provided.

---

## 10. Test Suite Results

```text
SSO (com.erp:auth_service):
Tests: 92
Failures: 0
Errors: 0
Skipped: 0

ERP (Downstream business modules):
Status: BLOCKED (No downstream ERP application in workspace)
Tests: 0
Failures: 0
Errors: 0
Skipped: 0
```

All 92 tests in the SSO test suite pass with 100% success.

---

## 11. Genuine Remaining Gaps

1. **Physical Downstream ERP Module**: End-to-end multi-service integration testing can only be executed once the downstream ERP repository (or services for Sales, Inventory, Accounting) is added to the workspace.
2. **JWKS Key Distribution**: The SSO service currently uses symmetric HMAC or configured signing keys; adding an automated JWKS (`/.well-known/jwks.json`) endpoint will simplify public key distribution to downstream microservices.
