# Authorization Security — Remediation Plan

**Phase 12 deliverable.** Companion to `authorization_security_audit.md` (§7 findings F-1..F-7).
Priorities: **HIGH** = enforcement gap, **MEDIUM** = exposure / functional risk, **LOW** = hygiene.
No fix below was applied during this audit (constraint: do not modify completed implementation
without a genuine defect decision). Each item states owner-approved steps.

---

## R-1 (F-1 · HIGH) — Decide + enforce the method-security model

**Problem:** `@EnableMethodSecurity` is absent, so all 18 `@PreAuthorize` are inert
(`HsnSacMasterController` ×3, `GstReportController` ×7, `DashboardController` ×8,
`AccountingPeriodController` ×1). Two sub-decisions:

1. **If the SSO manager is the single enforcement point** (current contract — intended), then the
   dangling inert annotations are misleading. Choose one and apply consistently:
   - **Remove** the inert `@PreAuthorize` annotations and rely on the SSO manager (module/action +
     feature-groups), `SYSTEM_ADMIN` policy, and the `@RequireFeature` aspect for the few
     feature-gated controllers, **or**
   - **Enable** `@EnableMethodSecurity` *only after* reconciling expressions with SSO-derived
     authorities (note: `hasRole('SYSTEM_ADMIN')` will only ever match principals whose SSO
     authorities expose the `SYSTEM_ADMIN` authority — verify `SsoAuthorities` emits it as a
     `ROLE_*` style authority, otherwise expressions still never match).
2. **HSN/SAC writes:** author intent was `SYSTEM_ADMIN`-only writes. Today any user holding
   `HSN_SAC` `CREATE/UPDATE/WRITE` (direct SSO permission) can write the master. If SYSTEM_ADMIN-only
   is desired, express it as a deliberate policy: either an SSO-side grant rule (preferred) or a
   dedicated `@RequireFeature`-style gate. Group users are already limited to `READ` by `feature-groups`,
   so this does NOT affect the Phase 11 group feature.

**Do NOT** blanket-add `@RequireFeature` to every controller — that would deny group users (e.g.
`SALES_INVOICE` group would break on customers/asterisk endpoints). Scope any annotation to
deliberate feature gates only.

---

## R-2 (F-2 · MEDIUM) — Decide fate of `/api/account/auth/{verify,validate}`

**Problem:** both endpoints are unreachable — unauthenticated → 401, valid token → 403 (no module
maps `/api/account/auth/**`, and only `/me`/`/profile` are allowlisted). They fail closed, so no
data leak, but any frontend calling them breaks.

Confirm with the frontend which token-health check it actually uses (`/me`, `/refresh`, or one of
these). Then, and only then:
- If `/verify` and `/validate` are unused → delete both methods (and their `ssoresponse` DTOs if
  orphaned), or
- If needed → add them to the module-style allowlist resolver alongside `/me` and `/profile`
  (they already self-verify the token in the controller), and optionally to the filter bypass so a
  stale cookie can be diagnosed.
- Either way **do not** widen to permitAll without keeping the internal `ssoService.verifyToken`.
- Update `isAuthenticatedProfileEndpoint(...)` in `SsoAuthorizationManager` and (if required) the
  `AuthenticationFilter` bypass list together, so the two lists stay coherent (F-6).

---

## R-3 (F-3 · MEDIUM) — Restrict public company writes after onboarding

**Problem:** `POST/PUT/DELETE /api/account/companies` (and the full read) are permitAll.

- Confirm onboarding requires unauthenticated company creation; if yes, cap the public surface:
  - Allow unauthenticated `POST /api/account/companies` **only** for the bootstrap/onboarding
    scenario (e.g. verifyCompany authorization header pattern) and require authentication for
    `PUT`/`DELETE`/`GET-all` when a verified admin exists.
  - Or introduce a one-shot onboarding token/endpoint (`/api/account/companies/setup`) and remove
    the generic public `POST`.
- During login directory flows the *list* of company codes is public by design (SSO picker) — keep
  the lean `GET /api/account/companies` if that is the intended use, but do not expose customer
  data on it.

---

## R-4 (F-4 · LOW) — Disable or gate `/api/account/debug`

Problem: permitAll diagnostic endpoint (auth/tenant/identity echo).

- Gate behind an operator flag (e.g. `debug.enabled`, default `false` in prod profile) returning 403
  when off, or restrict to a VPN/network allowlist, or remove in production profile.
- Keep enabled in dev only.

---

## R-5 (F-5 · LOW) — Harden public invoice PDF links

Problem: `GET /api/account/public/sales/invoices/{invoiceId}/pdf` (and the AP equivalent) are open
to anyone with the id.

- If invoices are shared externally by email, add signed, expiring URLs (HMAC query param checked
  by the controller) while retaining the current path for backward compatibility, or
- Bound the surface to the exported-only identifiers and rate-limit.

---

## R-6 (F-6 · LOW) — Keep SecurityConfig permitAll and filter bypass in sync

Problem: two hand-maintained allow lists (`SecurityConfig` + `AuthenticationFilter.shouldNotFilter`)
can drift (already coherent today except the F-2 pair).

- Extract both to the same constants/helper consumed by SecurityConfig and the filter.

---

## R-7 (F-7 · MEDIUM) — Decide the fate of orphaned routes

Problem: `/api/gst/ecl/**`, `/api/gst/gstr2b/**`, `/api/account/integration/manufacturing/**`,
`/api/account/v2/proforma-invoices/**` match no SSO module → 403 for every non-SYSTEM_ADMIN
(secure default, but possibly a functional regression).

- If any of these are meant for company users: add a `modules` pattern (+ optional
  `feature-groups` grant / direct SSO permission) for the intended audience.
- If any are SYSTEM_ADMIN-only operations surfaces: document them as such and optionally add
  explicit deny-all for non-admins (self-documenting).
- `ElectronicCreditLedgerController` also calls `repository.findAll()` with no company scoping —
  only reachable by SYSTEM_ADMIN today, but add company scoping before ever granting it wider access.

---

## Acceptance & re-test after remediation

1. Re-run unit/feature suites: `FeatureGroupPermissionResolverTest`, `SsoAuthorizationManagerGroupTest`,
   `SsoAuthorizationManager*`, `SsoAuthoritiesTest`, `FeatureAuthorization*` (82 security tests green).
2. Run full `mvn test` (expect 481/485; the 4 `SupplierQuotationServiceImplTest` errors are
   pre-existing and unrelated — fix `SupplierQuotationMapper` mock separately).
3. Run `e2e_feature_group_security.py` against a live backend with real SSO tokens
   (`E2E_BASE_URL`, `E2E_ACCESS_TOKEN`, `E2E_NOGROUP_ACCESS_TOKEN`, `E2E_SYSTEM_ADMIN_TOKEN`);
   expect 0 FAIL. Any SKIPPED must carry an explicit reason.
4. For prohibited scenarios, the script asserts 401/403 and must never be green-lighted on a
   non-fail-closed result.

---

## Summary

| ID | Severity | Route(s) | Action | Applies during group-feature scope? |
|---|---|---|---|---|
| R-1 | HIGH | HSN/SAC, GST reports, dashboard, accounting periods | Decide SSO-manager-vs-method-security; remove or enable inert `@PreAuthorize`; reaffirm HSN/SAC write policy | No — independent defense-in-depth gap |
| R-2 | MEDIUM | `/auth/verify`, `/auth/validate` | Confirm frontend need; allowlist + optionally delete | No — pre-existing auth-flow dead-end |
| R-3 | MEDIUM | `/api/account/companies/**` | Scoped onboarding restriction | No |
| R-4 | LOW | `/api/account/debug` | Gate/disable in prod | No |
| R-5 | LOW | public PDF endpoints | Signed expiring URLs (optional) | No |
| R-6 | LOW | allowlists | Single-source both lists | No |
| R-7 | MEDIUM | ECL / gstr2b / manufacturing-integration / proforma v2 | Map or document as SYSTEM_ADMIN-only; add company scoping to ECL `findAll` | No |

Phase 11 group-based feature itself: **no genuine defect found**; do not rework.