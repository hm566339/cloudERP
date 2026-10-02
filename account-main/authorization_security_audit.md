# Authorization Architecture — Production Audit

**Phase 12 deliverable**
**Scope:** SSO authorization for `/api/**` (Spring Boot account-services), including the group-based
automatic API access feature shipped in Phase 11.
**Date:** 2026-09-21
**Status:** AUDIT COMPLETE — see Findings §8; remediation plan in `authorization_security_remediation_plan.md`.

---

## 1. How the audit was performed

| Layer | Method | Tooling |
|---|---|---|
| Static / code | Read `SecurityConfig`, `AuthenticationFilter`, `SsoAuthorizationManager`, `SsoAuthorizationProperties`, `FeatureGroupPermissionResolver`, `FeatureAuthorizationAspect/Service`, tenant-context classes, `AuthController`, SSO client flow | manual review |
| Inventory | All 66 `@RestController` classes under `modules/**` mapped to HTTP routes + security annotations | explore agent (automated) |
| Config | `application-sso-auth.yml` modules / method-actions / custom-action-suffixes / feature-groups cross-checked against every mapped route | AntPathMatcher manual trace |
| Code-level | Targeted + full test suites (82/82 security, 481/485 total) | Maven offline |
| Live E2E | `e2e_feature_group_security.py` — requires a running backend + real SSO tokens | see script |

---

## 2. Complete authorization flow (as-built)

```
HTTP /api/** request
  └─ AuthenticationFilter (shouldNotFilter only for swagger + /auth/{login,callback,logout,refresh})
       └─ extracts bearer token (Authorization header, then cookie sso.cookie-name / "ACCESS_TOKEN")
       └─ calls SSO POST /api/sso/token/verify  (SsoFeignClient)
            └─ on success builds AuthenticatedUser(permissions: moduleName/featureCode+action,
                  active, allowed) + authorities; sets SecurityContext; stores SSO UserResponse
       └─ token invalid/missing  -> no auth set -> anonymous principal flows through
  └─ SecurityConfig.authorizeHttpRequests
       ├─ permitAll : /auth/login . /auth/logout . /auth/refresh . /auth/callback
       │             /debug . /companies(+/**) . /v1/quotations/accept/** . /public/** .
       │             /swagger-ui . /v3/api-docs . /api-docs . /swagger-resources . /configuration .
       │             /webjars . /error
       ├─ /api/account/auth/me -> .authenticated()
       ├─ /api/**            -> SsoAuthorizationManager
       └─ anyRequest         -> .authenticated()

SsoAuthorizationManager.authorize  (fail-closed)
  1. ASYNC/ERROR dispatches           -> GRANT
  2. unauthenticated                  -> DENY  (401 via JwtAuthenticationEntryPoint)
  3. method == OPTIONS                -> GRANT
  4. SYSTEM_ADMIN (SSO active role)   -> GRANT (explicit SSO policy, §4)
  5. URI in {/api/account/auth/me, /api/account/auth/profile} -> GRANT
  6. modules: find YAML module whose Ant pattern matches the URI
       none matched                 -> DENY   (403; feature is "orphaned", §7.3)
  7. required actions:
       custom-action-suffix matches URI -> that action (e.g. /approve -> APPROVE)
       else method-actions: GET->READ, POST->[CREATE,WRITE], PUT/PATCH->[UPDATE,WRITE], DELETE->DELETE
       (HEAD treated as GET; write-implies-create-update=false -> no escalation)
  8. effective permissions = active+allowed SSO permissions (module OR featureCode) +
                            flat-authority fallback +
                            FeatureGroupPermissionResolver group-derived grants (§3)
  9. GRANT iff user holds any required action for the matched module/feature (case-insensitive)
     else DENY (403 via CustomAccessDeniedHandler)

FeatureAuthorizationAspect (only for controllers annotated @RequireFeature)
  order=1; first requires a valid JWT, then SYSTEM_ADMIN bypass, then active FEATURE check.
```

### Key properties of the model
- **Routing grants nothing.** `modules` only decides *which* module's permissions apply.
- **Fail-closed on every path**: unmapped module → deny (§7.3); undecomposable action → deny.
- **No local role/permission table.** All grants come from the SSO verify response; the only
  constants are SYSTEM_ADMIN policy and the `/me`,`/profile` allowlist.
- **Group grants are additive and API-layer only** (§3). They never remove a direct right and are
  never consulted by internal service-to-service calls.

---

## 3. Group-based automatic API access (Phase 11) — verification

Config (`application-sso-auth.yml` → `sso.authorization.feature-groups`):

```
SALES_INVOICE:  SALES_INVOICES[READ,CREATE,UPDATE]  CUSTOMERS[READ]
                HSN_SAC[READ]  SALES_TAXES[READ]  GST_SLABS[READ]
```

Held group = SSO returns `active feature/lifecycle SALES_INVOICE` **or** any `active+allowed`
permission whose `featureCode == SALES_INVOICE`. Component under test:
`FeatureGroupPermissionResolver` (`effectivePermissions`, `hasEffectivePermission`,
`activeGroupFeatures`, `ModuleAction` normalized equality).

| Property | Verified by | Result |
|---|---|---|
| Group grants apply at HTTP layer only | `SsoAuthorizationManager:159-163` (additive, inside grant loop) | PASS |
| User without the group gets nothing | `FeatureGroupPermissionResolverTest` | PASS |
| Direct permission still wins when group missing the action | `effectivePermissions` + `hasPermission` ordering | PASS |
| Actions matched exactly; `WRITE` never converted | `ModuleAction.equals` normalization test | PASS |
| `write-implies-create-update: false` preserved | `getRequiredActions` (no escalation added) | PASS |
| SYSTEM_ADMIN unaffected (still superuser) | `SsoAuthorizationManager:103-108` | PASS |
| Case-insensitive module/action matching retained | resolver normalization + manager | PASS |
| Empty `feature-groups` (feature disabled) = no auto-grants | resolver guard | PASS |
| Group holder: GET customers / hsn-sac / sales-taxes / gst-slabs 200 | unit + live (`e2e_* B*`) | unit PASS |
| Group holder: **POST customers → 403** (CUSTOMERS READ only) | unit + live | unit PASS |
| Group holder: **DELETE sales/invoices → 403** (no DELETE in group) | unit + live | unit PASS |
| Non-holder: customers/hsn-sac/sales-taxes/gst-slabs → 403 | unit + live | unit PASS |

Unit totals: `FeatureGroupPermissionResolverTest` 11 PASS, `SsoAuthorizationManagerGroupTest` 15 PASS.
No logic changed in this audit; no defect requiring rework was found in the Phase 11 implementation.

---

## 4. SYSTEM_ADMIN policy

Detected only when the **verified SSO response** carries `SYSTEM_ADMIN` active (either
`AuthenticatedUser.isSystemAdmin()` from the raw SSO data, or `SsoAuthorities.isSystemAdmin(...)`).
Not derivable from any local config. Bypasses module routing entirely (manager grants before
module resolution). This is the documented superuser affordance; it is not grantable locally.

---

## 5. Test-layer coverage (honest split)

| Layer | Examples | Excludes |
|---|---|---|
| **Unit** (in-JVM, no Spring context for resolver; context for manager) | `SsoAuthorizationManagerGroupTest`, `FeatureGroupPermissionResolverTest`, `SsoAuthorizationManagerTest`, `SsoAuthorizationManagerPermissionTest`, `SsoAuthoritiesTest`, `FeatureAuthorizationAspectTest` | DB, SSO network, servlet container, YAML runtime binding |
| **Feature/context** | `FeatureAuthorizationServiceTest` | live SSO |
| **Live E2E** | `e2e_feature_group_security.py` — real HTTP against a running backend with real SSO-minted tokens | locally NOT RUN (no live environment / tokens available in this shell) — script reports `SKIPPED`, never fake-PASS |
| **Controller annotation sweep** | 66 controllers inventoried (see §6) | spring-security method-security is DISABLED (Finding F-1) |

Unit + feature tests alone do **not** constitute proof of production readiness (SSO timeouts,
RBAC drift in SSO, gateway/CORS, network 401-wrapping, cookie/`SameSite` are outside the JVM).

---

## 6. Controller / boundary sweep (66 controllers)

Matching method: AntPathMatcher against `application-sso-auth.yml` `modules` and the `SecurityConfig`
permitAll list. Only findings of interest are tabulated; every fully-matching module is PASS.

### 6.1 PermitAll surfaces (intended or risk-bearing) — see F-3 / F-4 / F-5
| Route | Behavior | Intended? |
|---|---|---|
| `/api/account/companies` + `/**` (POST/PUT/DELETE) | no auth at all; only `verifyCompany` self-checks Authorization header in-body | bootstrap/onboarding pattern — **review F-3** |
| `/api/account/debug` | returns auth/tenant/identity diagnostics | dev aid — **disable in prod F-4** |
| `/api/account/public/**` (sales invoice PDF, AP invoice PDF) | no token / no ownership check | public-sharing design (risk noted F-5) |
| `/api/account/v1/quotations/accept/**` + `/public/accept/{token}` | token-based public acceptance | intended business flow |

### 6.2 Orphaned routes — fail-closed to DENY for all non-SYSTEM_ADMIN (F-7)
| Route | Module needed | Effect |
|---|---|---|
| `/api/gst/ecl/**` (ElectronicCreditLedger) | none matches | ALL non-SYSTEM_ADMIN get 403. Controller also calls `repository.findAll()` with no company scoping (only reachable by SYSTEM_ADMIN). |
| `/api/gst/gstr2b/**` (Gstr2bReconciliation) | none matches | 403 for all non-SYSTEM_ADMIN |
| `/api/account/integration/manufacturing/**` | none matches | 403 for all non-SYSTEM_ADMIN |
| `/api/account/v2/proforma-invoices/**` | PROFORMA_INVOICES maps **v1 only** | 403 for all non-SYSTEM_ADMIN |

These are **secure-by-default** (nobody reaches them but SYSTEM_ADMIN) but may be **functional
regressions** if the features were meant for company users.

### 6.3 `/api/**` module coverage
54 module patterns cover the primary business modules (customers, vendors, sales invoices/orders,
quotations, proforma v1, purchases, expenses, AR, AP/payments/receipts, GL/COA/banks/budgets,
reports, dashboard, GST master/tax masters, reconciliation, audit-logs, accounting-periods,
fiscal-years, settings). Only the four orphan sets in §6.2 lie outside.

---

## 7. Findings

### F-1 (HIGH) — `@EnableMethodSecurity` is OFF; all 18 `@PreAuthorize` uses are inert
`SecurityConfig` only has `@EnableWebSecurity`. Therefore:
- `HsnSacMasterController` POST/PUT/DELETE `hasRole('SYSTEM_ADMIN')` — **never enforced**. Writes
  are governed solely by the SSO manager: any user holding `HSN_SAC` `CREATE`/`UPDATE`/`WRITE` can
  mutate the master (least-privilege drift vs. the author's intent). Group holders only get `READ`,
  so Phase 11 does not widen this.
- `GstReportController` (6 × `hasAnyRole(...)`, 1 × `hasAuthority('REPORT_EXPORT')`), `DashboardController`
  (8 × `isAuthenticated()`), `AccountingPeriodController` (1) — all inert. Only the SSO manager's
  module/action gates and (for reports) the `GST_REPORTS`/`REPORTS` module decide access.
   
   The system is *secure-by-contract* (manager fails closed for the above routes), so this is a
   **defense-in-depth and intent gap**, not a wide-open hole. Do **not** blanket-add `@RequireFeature`
   to every controller; first decide the enforcement model (see remediation R-1).

### F-2 (MEDIUM) — `/api/account/auth/{verify,validate}` are unreachable for everyone
Both are outside permitAll, outside the profile allowlist (`/me`,`/profile` only), and outside the
filter bypass. Consequence: no token → 401; valid token → manager finds no module → **403**. The
controllers never run. These endpoints are therefore dead today. They fail closed (no data leak),
so this is a functional gap: any frontend relying on `/verify` or `/validate` gets 403. (Frontend
refs must be confirmed; `/me` and `/refresh` are permitted and working.)

### F-3 (MEDIUM) — Company controller is fully public writable
`POST/PUT/DELETE /api/account/companies` require no authentication. Likely deliberate for onboarding
(create company → company code login), but it means the company directory (`GET /api/account/companies`)
and writes are open to the Internet. Confirm the intended threat model; if onboarding is the only
reason, scope public writes to bootstrap keys or a dedicated onboarding token (R-3).

### F-4 (LOW) — `/api/account/debug` is permitAll
Returns diagnostics (auth, tenant, identity) to anonymous callers. Fine for dev; gate or disable in
production. (R-4.)

### F-5 (LOW/RISK) — Public PDF endpoints have no tamper/ownership token
`GET /api/account/public/sales/invoices/{invoiceId}/pdf` (and AP equivalent) are reachable by anyone
knowing an invoice id. Accepted design for emailed links; consider time-limited signed URLs if these
circulate publicly. Not changed in this audit.

### F-6 (INFO) — Auth-flow bypass list vs manager mismatch
`AuthenticationFilter` bypasses `/auth/{login,callback,logout,refresh}`; `SecurityConfig` also marks
4 of them permitAll. `/auth/me` is intentionally *not* in the filter bypass yet is `.authenticated()`
— that is correct (filter authenticates, manager allows it via allowlist). `/verify`/`/validate`
fall into F-2. The two lists are otherwise coherent.

### F-7 (MEDIUM) — Orphaned modules deny company users (functional risk, secure default)
See §6.2. If ECL / gstr2b / manufacturing-integration / proforma-v2 are intended for company users,
no module mapping exists; only SYSTEM_ADMIN can reach them. Add module patterns + feature-group or
permission grants for the intended audience (R-7); otherwise document as SYSTEM_ADMIN-only ops surface.

### F-8 (LOW) — `GET` card/list endpoints accept WRITE via custom suffix only; DELETE actions explicit
No unexpected escalations found. `confirm`→POST, `/approve`→APPROVE, `/verify`→UPDATE (note: this is
a URL suffix map; the blocked `/auth/verify` endpoint is unaffected). `write-implies-create-update`
stays `false` — a user holding only UPDATE **cannot** CREATE, verified by unit test.

---

## 8. Verification results

| Suite | Result |
|---|---|
| `FeatureGroupPermissionResolverTest` (11) | 11 PASS |
| `SsoAuthorizationManagerGroupTest` (15) | 15 PASS |
| `SsoAuthorizationManagerTest` / `PermissionTest` / `SsoAuthoritiesTest` / `FeatureAuthorization*` | PASS |
| Full `mvn test` | 481/485 PASS — the 4 failures are **pre-existing** in `SupplierQuotationServiceImplTest` (`this.mapper == null`; that test never declares a `SupplierQuotationMapper` mock). Unrelated to authorization. |
| Live E2E | See `e2e_feature_group_security.py`. Requires a running backend + real SSO tokens (env: `E2E_BASE_URL`, `E2E_ACCESS_TOKEN`, `E2E_NOGROUP_ACCESS_TOKEN`, `E2E_SYSTEM_ADMIN_TOKEN`). Without them the suite reports `SKIPPED` with the exact reason — it does not report PASS. |

---

## 9. Residual risk / outside this audit
- SSO service-side role/feature/permission *provisioning* (who gets what) is not verifiable here.
- Network path (API gateway, WAF, CORS origins) not exercised.
- Method-security stack (`@EnableMethodSecurity`) intentionally disabled — see F-1/R-1.
- Performance of the per-request SSO `verify` round-trip (no local token cache) not profiled.

---

See `authorization_security_remediation_plan.md` for the prioritized remediation plan (R-1..R-7).