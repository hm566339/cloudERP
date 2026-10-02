# Platform Admin & Support Access Security Audit Report

## 1. Executive Summary

This security audit report documents the security posture, threat model analysis, and implementation defenses established during **Phase 6A: Platform Admin & SaaS Operator Layer**.

The architecture enforces a total isolation barrier between **Customer Tenant Identities** and **Platform Operator Identities**, eliminating common SaaS vulnerabilities including cross-tenant data leakage, admin privilege creep, customer credential impersonation, and unauthenticated IDOR endpoints.

---

## 2. Threat Modeling & Defense Matrix

| Threat Category | Potential Attack Vector | Applied Mitigation / Architectural Defense |
|---|---|---|
| **Domain Cross-Contamination** | Customer user obtains platform token, or uses customer JWT to invoke `/api/admin/**` endpoints. | **Domain Segregation**: Dedicated `PlatformAdmin` entity and table. `JwtAuthenticationFilter` strictly checks `principalType == "PLATFORM_ADMIN"` for `/api/admin/**`. Customer JWTs lack this claim and are rejected with `403 Forbidden`. |
| **Global Backdoor Abuse** | Platform operator attempts direct access to customer APIs (`/api/sso/**`) without a support ticket or scope. | **Support Access Gate**: Direct operator tokens (`principalType == "PLATFORM_ADMIN"`) are explicitly blocked on customer routes. Operators can only interact through time-bound, scoped `SupportAccessSession` tokens. |
| **Cross-Tenant IDOR Tampering** | Platform operator issues a support session for Tenant A, but supplies a Company ID belonging to Tenant B. | **Hierarchy Boundary Validation**: `PlatformSupportService` verifies that `company.getOrganization().getId().equals(organization.getId())`. Mismatched company-organization pairs are immediately rejected with `BadRequestException`. |
| **Customer Credential Theft** | Support engineer asks customer for password or hashes are queried. | **Zero Customer Credential Exposure**: Platform operators authenticate with their own credentials. Organization API views mask all secrets, tokens, and password hashes (`password` field is never populated). |
| **Indefinite Support Session Persistence** | Support token is issued and forgotten, allowing prolonged unauthorized access. | **Strict TTL & Instant Revocation**: Maximum session duration is enforced (capped at 24 hours, default 2 hours). In-memory or database revocation takes effect immediately on the next HTTP request. |
| **Unauthorized Support Mutation** | Read-only tier support staff modifies customer financial or inventory data. | **Role-Based Mutation Gates**: `requireWriteAccess()` rejects mutation attempts if operator has `READ_ONLY_SUPPORT`. Only `SUPPORT_ADMIN` or `SUPER_ADMIN` can mutate. |
| **Untracked Operator Activity** | Support staff alters customer data without logging or justification. | **Mandatory Ticket Reference & Append-Only Log**: Support session initiation requires `reason` and `ticketReference`. All operations are written synchronously to `platform_audit_log`. |
| **Brute Force on Platform Admin Login** | Attacker attempts credential stuffing on `/api/admin/auth/login`. | **Account Lockout Policy**: After 5 consecutive failed login attempts, the `PlatformAdmin` account is locked for 15 minutes. |
| **Orphaned Platform Administration** | An admin deletes or revokes the status of the only remaining `SUPER_ADMIN`. | **Last Super Admin Safeguard**: `PlatformAdminManagementService` checks active `SUPER_ADMIN` counts; prevents demotion or deactivation of the last super admin. |

---

## 3. Detailed Audit Findings & Fixes in Customer SSO Endpoints

During the initial Phase 6 security audit of existing customer endpoints, two potential IDOR vulnerability vectors were identified and remediated:

### Finding 1: Authorization Code Issue Cross-User Verification
- **Vulnerability**: In `AuthServiceImpl.authorize(...)`, an authorization code could theoretically be requested for a `userId` differing from the caller's JWT token if not validated against the authenticated session context.
- **Remediation**: Added explicit token validation verifying that caller `userId` extracted from the bearer token strictly matches the `userId` in the session. Furthermore, verified that the user holds an active `MemberCompanyAccess` for multi-company organizations.
- **Verification**: Tested with unit test regression suite.

### Finding 2: Permission & Feature Inspection Endpoints (`/api/sso/permissions/user/{userId}/**`)
- **Vulnerability**: Endpoints accepting `{userId}` path variables did not enforce that the caller owned the `{userId}` or held an admin role.
- **Remediation**: Added `assertCanAccessUserData(...)` in both `PermissionController` and `FeatureController`. If caller token is present, callers requesting data for another user ID without `ROLE_ADMIN` / `ROLE_SUPER_ADMIN` are rejected with `ForbiddenException ("Access denied to target user data")`.
- **Verification**: Verified via `CustomerSecurityAuditRegressionTest` (5 tests passing).

---

## 4. Platform Role & Permission Matrix

| Role Code | Allowed Operations | Support Session Create | Support Session Mutate | Platform Admin User Management |
|---|---|---|---|---|
| `SUPER_ADMIN` | All system operations (`ALL:ALL`) | Yes | Yes | Yes (Full CRUD) |
| `SUPPORT_ADMIN` | Support session management, organization viewing, diagnostic mutations | Yes | Yes | No |
| `READ_ONLY_SUPPORT` | Organization directory, audit log view, read-only support inspection | Yes (Read Only) | **No (Blocked)** | No |
| `BILLING_ADMIN` | Organization subscription, invoices, payment plans | No | No | No |

---

## 5. Audit Logging Architecture

All security-sensitive operations generate synchronous entries in `platform_audit_log`:

```sql
CREATE TABLE platform_audit_log (
    id UUID PRIMARY KEY,
    admin_id UUID NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

- **Non-Repudiation**: The audit log table is append-only. There are no delete or update APIs for audit logs.
- **Queryability**: Platform administrators can filter audit logs by `adminId`, `action`, `targetType`, `targetId`, and date ranges via `GET /api/admin/audit-logs`.
