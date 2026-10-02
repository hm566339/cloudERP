# Account ERP and Central SSO Integration

## Actual application

The integrated consumer is `account-main`, a Spring Boot 4.0.6 application using Spring Security, Feign, JPA, Flyway, PostgreSQL, and Java 17. Its SSO client is `modules/auth/service/impl/SsoServiceImpl`; request authentication is performed by `security/AuthenticationFilter` through `POST /api/sso/token/verify`.

## Flow

Browser -> account `/api/account/auth/login` -> organization-aware SSO login -> SSO authorization code -> account `/api/account/auth/callback` -> SSO `/api/sso/token/exchange` -> secure account cookies -> every account request verifies the access token with SSO.

Legacy account login still accepts `companyCode`. New organization-aware clients should open the organization login URL and let SSO establish organization/company context before callback.

## Verified context

`AuthenticationFilter` builds `AuthenticatedUser` and `CurrentUserContext` from the verified SSO response. The context now includes:

- authenticated user ID
- organization ID and code
- company ID derived through SSO-verified company code
- access mode
- SSO roles, active features, and active+allowed permissions

Caller-supplied company IDs are not used for normal-user tenant resolution. `CurrentUserContext.resolveCompanyId(requestCompanyId)` ignores the request ID for ordinary users and uses the SSO-derived context. System-admin requests remain explicit and are audited by `SystemAdminCompanyIdAspect`.

## Authorization

`SsoAuthorizationManager` maps account URL patterns to SSO modules and HTTP/custom actions. It requires active+allowed SSO permissions. Organization module entitlement and current membership/company access are checked by SSO before verification and token exchange. Account READ_ONLY sessions are denied for POST/PUT/PATCH/DELETE business paths, while auth, public, billing, subscription, renewal, and payment paths remain available.

Account services must still use `CurrentUserContext.resolveCompanyId(...)` or an equivalent verified lookup before repository access. Repository queries must include company predicates for company-owned resources.

## Revocation and logout

The account filter calls SSO verification on each request. SSO checks persisted session, user status, organization membership, and company access, so revoked membership/access is not trusted until JWT expiry. Logout calls SSO session revocation and clears account cookies. Refresh is delegated to SSO and must not be implemented locally.

## Errors

- Missing/invalid access token: account authentication entry point returns unauthorized.
- Missing SSO permission or disabled module: access denied.
- READ_ONLY business mutation: access denied.
- Cross-company ID for an ordinary user: services must resolve the current company from `CurrentUserContext`, resulting in no access to the foreign row.

## Downstream implementation rule

Do not authorize from organizationCode, companyCode, URL path, hidden form fields, request companyId, or JWT claims alone. These values identify routing/context only. SSO verification and server-side company-scoped repository queries are authoritative.

## Testing boundary

This integration has been source-compiled against the account application. A deployed end-to-end flow requires both applications, their databases, configured SSO client credentials, RSA keys, organization/module data, and a running callback URL. Downstream ERP behavior is not claimed as fully integration-tested by the central SSO test suite.
