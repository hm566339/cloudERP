# Phase 5 Security Audit

## Authorization boundaries

| Boundary | Caller-supplied context | Server-side enforcement | Tenant boundary | Result / residual risk |
|---|---|---|---|---|
| `POST /api/sso/auth/login` | `organizationCode`, `companyId`, legacy `companyCode` | `OrganizationResolverService`; password check; active `OrganizationMember`; active `MemberCompanyAccess`; active company; subscription mode; module and portal access | Organization and company | Organization-aware branch is server-authorized. Legacy company branch remains for compatibility and must be migrated later. |
| `POST /api/sso/auth/select-company` | organization code and company ID | Repeats credential, membership, organization/company ownership, active access, entitlement, and module checks | Organization + company | IDs are routing inputs only. |
| `POST /api/sso/token/exchange` | code and client ID | One-time code, expiry, registered module/client match, company-module status, live membership/access/entitlement for organization codes | Organization + company + client | Legacy codes remain supported; legacy codes without organization context use legacy checks. |
| Authenticated request filter | Bearer token and JWT claims | Persisted session, token expiry, active user, active membership/access, organization access mode, request-context creation | Session organization and company | JWT roles/context are snapshots; DB/session state is authoritative. |
| Refresh | refresh token and client ID | Hashed token record, family status, expiry, active user, client module, company module, portal access; organization sessions are rechecked by session path | Session + client | New tokens are hash-only. Legacy raw-token fallback remains during migration. |
| Organization lookup | organization code path | Active organization resolver; response contains only name/code/login URL | Routing only | Public discovery is not authorization. |
| Company access grant/revoke | member ID and company ID | Request context; active owner/admin actor; target membership belongs to current organization; company belongs to current organization; owner protection; write access | Organization + member + company | Direct service calls also enforce write access. |
| Company mutation | company ID/request data | `AuthorizationService.requireWriteAccess`; organization context assigns new companies; plan maxCompanies check | Organization | Downstream ERP resources are not present in this repository. |
| Payment webhook | provider, signature, payload IDs | Provider signature; unique provider event ID; stored subscription/payment/invoice reconciliation; transaction | Subscription organization | Provider-neutral contract; concrete provider must implement its own parser. |

## Informational versus authorization-sensitive JWT claims

`userId`, `organizationId`, `organizationCode`, `companyCode`, `companyName`, `moduleName`, and roles are context snapshots. They are never sufficient to authorize a request. Current membership, company access, subscription/access mode, module entitlement, user status, and persisted session state are checked server-side.

The JWT decoder verifies the RSA signature and expiration. Issuer and audience are not currently configured in the legacy token contract; adding mandatory `iss`/`aud` validation requires coordinated client migration and is a follow-up compatibility change.

## Public endpoints

Intentionally public: login, signup, legacy register, organization lookup, authorization-code exchange, refresh, verification/reset-password routes, module callback routes, billing webhook, Swagger/API docs, and actuator routes as currently configured. Organization administration is not public: only the single-segment lookup route bypasses the JWT filter; member administration requires authentication.

`/api/sso/company/open` remains a legacy public discovery route and should be deprecated after consuming clients migrate because its response may expose more company information than organization lookup.

## Known gaps

- Downstream ERP business services are absent and cannot be modified here.
- Audit-log persistence is not present; security events are currently logged selectively without secrets.
- Client secrets are still represented by the legacy module credential field and require a coordinated hash migration.
- Rate limiting and trusted proxy/header configuration are infrastructure requirements, not implemented by this service.
