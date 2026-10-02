# ERP Tenant Security Audit

Phase 6 — Conducted against the central SSO service boundary.

> [!IMPORTANT]
> No downstream ERP application exists in the workspace. This audit covers only the SSO service's own tenant-sensitive surfaces. The downstream ERP audit (business entities, CRUD controllers, IDOR on business objects) is deferred until a real ERP application is available.

---

## SSO Mutation Inventory

All write operations in the SSO service and their tenant enforcement status:

### Company Management

| Operation | Controller | Tenant Enforcement |
|---|---|---|
| Create company | `CompanyController.createCompany` | SYSTEM_ADMIN only; organization context assigned server-side |
| Update company | `CompanyController.updateCompany` | SYSTEM_ADMIN only |
| Delete company | `CompanyController.deleteCompany` | SYSTEM_ADMIN only |
| Change company status | `CompanyController.changeStatus` | SYSTEM_ADMIN only |

### User Management

| Operation | Controller | Tenant Enforcement |
|---|---|---|
| Create user | `UserController.createUser` | SYSTEM_ADMIN only; company_id from param, not trusted from body |
| Update user | `UserController.updateUser` | SYSTEM_ADMIN only |
| Delete user | `UserController.deleteUser` | SYSTEM_ADMIN only |
| Change user status | `UserController.updateStatus` | SYSTEM_ADMIN only |
| Assign role | `UserController.assignRole` | SYSTEM_ADMIN only |
| Remove role | `UserController.removeRole` | SYSTEM_ADMIN only |
| Grant portal access | `UserController.grantPortalAccess` | SYSTEM_ADMIN only |
| Remove portal access | `UserController.removePortalAccess` | SYSTEM_ADMIN only |
| Toggle portal access | `UserController.togglePortalAccess` | SYSTEM_ADMIN only |
| Change password | `UserController.changePassword` | SYSTEM_ADMIN only |
| Verify email (admin) | `UserController.verifyEmailAdmin` | SYSTEM_ADMIN only |

### Role Management

| Operation | Controller | Tenant Enforcement |
|---|---|---|
| Create role | `RoleController.createRole` | SYSTEM_ADMIN only; company_id from param |
| Update role | `RoleController.updateRole` | SYSTEM_ADMIN only |
| Delete role | `RoleController.deleteRole` | SYSTEM_ADMIN only |
| Update role status | `RoleController.updateRoleStatus` | SYSTEM_ADMIN only |

### Module Management

| Operation | Controller | Tenant Enforcement |
|---|---|---|
| Create module | `ModuleController.createModule` | SYSTEM_ADMIN only |
| Update module | `ModuleController.updateModule` | SYSTEM_ADMIN only |
| Delete module | `ModuleController.deleteModule` | SYSTEM_ADMIN only |
| Update module status | `ModuleController.updateModuleStatus` | SYSTEM_ADMIN only |
| Rotate secret | `ModuleController.rotateSecret` | SYSTEM_ADMIN only |

### Company Module Management

| Operation | Controller | Tenant Enforcement |
|---|---|---|
| Create company module | `CompanyModuleController.createCompanyModule` | SYSTEM_ADMIN only |
| Update company module | `CompanyModuleController.updateCompanyModule` | SYSTEM_ADMIN only |
| Delete company module | `CompanyModuleController.deleteCompanyModule` | SYSTEM_ADMIN only |
| Change company module status | `CompanyModuleController.changeStatus` | SYSTEM_ADMIN only |

### Module Route Management

| Operation | Controller | Tenant Enforcement |
|---|---|---|
| Create module route | `ModuleRouteController.createModuleRoute` | SYSTEM_ADMIN only |
| Update module route | `ModuleRouteController.updateModuleRoute` | SYSTEM_ADMIN only |
| Delete module route | `ModuleRouteController.deleteModuleRoute` | SYSTEM_ADMIN only |
| Update route status | `ModuleRouteController.updateModuleRouteStatus` | SYSTEM_ADMIN only |

### Feature & Permission Management

| Operation | Controller | Tenant Enforcement |
|---|---|---|
| Create feature | `FeatureController.createFeature` | SYSTEM_ADMIN only |
| Update feature | `FeatureController.updateFeature` | SYSTEM_ADMIN only |
| Delete feature | `FeatureController.deleteFeature` | SYSTEM_ADMIN only |
| Grant feature to user | `FeatureController.grantFeature` | SYSTEM_ADMIN only |
| Revoke feature from user | `FeatureController.revokeFeature` | SYSTEM_ADMIN only |
| Sync user features | `FeatureController.syncUserFeatures` | SYSTEM_ADMIN only |
| Create permission | `PermissionController.createPermission` | SYSTEM_ADMIN only |
| Grant permission | `PermissionController.grantPermission` | SYSTEM_ADMIN only |
| Revoke permission | `PermissionController.revokePermission` | SYSTEM_ADMIN only |
| Sync user permissions | `PermissionController.syncUserPermissions` | SYSTEM_ADMIN only |
| Sync role permissions | `PermissionController.syncRolePermissions` | SYSTEM_ADMIN only |

### Organization Administration

| Operation | Controller | Tenant Enforcement |
|---|---|---|
| Grant company access | `OrganizationAdministrationController.grant` | Authenticated; org-scoped via RequestContext |
| Revoke company access | `OrganizationAdministrationController.revoke` | Authenticated; org-scoped + owner protection |

### Session Management

| Operation | Controller | Tenant Enforcement |
|---|---|---|
| Revoke own session | `SessionController.revokeSession` | Authenticated; own sessions only |
| Revoke all own sessions | `SessionController.revokeAllSessions` | Authenticated; own sessions only |
| Admin revoke session | `SessionController.revokeSessionByAdmin` | SYSTEM_ADMIN only |

### Billing

| Operation | Controller | Tenant Enforcement |
|---|---|---|
| Webhook receive | `BillingWebhookController.receive` | Provider signature verification |

---

## SSO Tenant-Sensitive Read Inventory

| Read Operation | Tenant Scope | Enforcement |
|---|---|---|
| Get company by ID | Company | SYSTEM_ADMIN for arbitrary; authenticated for own context |
| Get all companies | Company | SYSTEM_ADMIN only (paginated) |
| Get user by ID | User | Authenticated for own; SYSTEM_ADMIN for arbitrary |
| Get all users by company | Company | SYSTEM_ADMIN only |
| Get role details | Company (via role.company_id) | SYSTEM_ADMIN only |
| Get all roles by company | Company | SYSTEM_ADMIN only |
| Get dashboard | Company | SYSTEM_ADMIN only |
| Get sessions by company | Company | SYSTEM_ADMIN only |
| Get accessible companies | Organization | Authenticated; scoped to RequestContext.organizationId |
| Get user permissions | User | Authenticated |
| Get user features | User | Authenticated |
| Internal authorization check | User | Authenticated |
| Get portal access | Company | Authenticated |

---

## IDOR Analysis (SSO Boundary)

### SSO Admin Endpoints

Most SSO endpoints that accept resource IDs (company ID, user ID, role ID, module ID) are gated by `SYSTEM_ADMIN` authority. A non-admin cannot access these endpoints regardless of ID manipulation.

### Organization Administration

- `POST /api/sso/organization/members/{memberId}/companies` — grants company access
  - **Enforcement**: `OrganizationAdministrationServiceImpl` verifies the member belongs to the current organization (from `RequestContext`), the company belongs to the current organization, and the actor is an owner/admin
  - **IDOR risk**: Low — membership and company ownership are verified server-side

- `DELETE /api/sso/organization/members/{memberId}/companies/{companyId}` — revokes company access
  - **Enforcement**: Same ownership verification + owner protection (cannot revoke owner's access)
  - **IDOR risk**: Low

- `GET /api/sso/organization/members/companies` — list accessible companies
  - **Enforcement**: Scoped to `RequestContext.organizationId` (server-derived)
  - **IDOR risk**: None — no user-supplied tenant ID

### Session Endpoints

- `DELETE /api/sso/session/{id}` — revoke session
  - **Enforcement**: `SessionServiceImpl` verifies the session belongs to the current user (from access token)
  - **IDOR risk**: Low — user-scoped verification

### Portal Access

- `GET /api/sso/portal-access/{companyId}` — list portal access
  - **Enforcement**: Authenticated, but `companyId` is from path parameter
  - **Finding**: Non-admin users with `authenticated()` access could query portal access for arbitrary company IDs if they have a valid token. The security config places this under `.authenticated()` not `.hasAuthority("SYSTEM_ADMIN")`.
  - **Severity**: Low (read-only, SSO-internal data)
  - **Recommendation**: Verify companyId against RequestContext or restrict to SYSTEM_ADMIN

---

## Cross-Tenant Analysis (SSO Boundary)

### Token-Based Isolation

The `JwtAuthenticationFilter` performs per-request validation:
1. Session must exist in DB for the presented token
2. Organization membership is rechecked (not just from JWT)
3. Company access is rechecked
4. Access mode is rechecked

A token issued for Organization A / Company A1 **cannot** be used to access Organization B's data because:
- The session record is bound to a specific organization and company
- Membership and access are re-validated on every request
- RequestContext is set from the **session** (server-side), not from JWT claims

### RequestContext Integrity

`RequestContext.set()` is called only in `JwtAuthenticationFilter` using server-derived values from the session record. It is never set from request parameters, headers, or JWT claims directly. This prevents context injection.

### Company-Scoped Queries

SSO repositories that accept company_id typically operate under SYSTEM_ADMIN authority, which is acceptable for the central SSO service. The risk area is downstream ERP modules where per-user company-scoped queries will be required.

---

## Downstream ERP Audit — Deferred

The following audit categories require a real downstream ERP application:

| Category | Status | Reason |
|---|---|---|
| Business entity IDOR (`/customers/{id}`, `/orders/{id}`) | ⏸ Deferred | No business entities |
| Tenant-scoped CRUD isolation | ⏸ Deferred | No CRUD operations |
| `findAll()` / `findById()` without company predicates | ⏸ Deferred | No business repositories |
| Native SQL / JPQL tenant leakage | ⏸ Deferred | No business queries |
| Bulk mutation authorization | ⏸ Deferred | No bulk operations |
| Scheduled job tenant isolation | ⏸ Deferred | No business scheduled jobs |
| Report/export tenant isolation | ⏸ Deferred | No business reports |

---

## Fixes Applied

No fixes were applied because:
1. The SSO service's own tenant isolation is adequate for its scope
2. No downstream ERP exists to fix
3. The SSO code was not modified in Phase 6

## Remaining Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Portal access endpoint accepts arbitrary companyId from path | Low | Restrict to SYSTEM_ADMIN or verify against RequestContext |
| Dashboard endpoint accepts arbitrary companyId from path | Low | Already SYSTEM_ADMIN-gated |
| Session listing by companyId accepts arbitrary companyId | Low | Already SYSTEM_ADMIN-gated |
| JWT claims could be stale between issuance and expiry | Medium | Mitigated by per-request session/membership validation |
| No audit log persistence | Medium | Security events are logged but not persisted to a dedicated audit table |
| Client secrets stored as plaintext in Module table | Medium | Requires hash migration (Phase 5 documented) |
