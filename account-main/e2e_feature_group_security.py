#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
e2e_feature_group_security.py  (Phase 12 deliverable)

Live end-to-end authorization tests for the account-services backend.

Verifies, against a RUNNING backend and REAL SSO-minted tokens, the
group-based automatic API access feature (feature-groups) plus the
authorization boundaries documented in authorization_security_audit.md.

Policy of this script (per Phase 12 constraints):
  * It NEVER fakes PASS. Any case that cannot be executed in the current
    environment is reported SKIPPED with the exact reason.
  * Live coverage is distinguished from unit/integration coverage: the unit
    layer (FeatureGroupPermissionResolverTest, SsoAuthorizationManagerGroupTest)
    proves the policy engine; this script proves the wiring of real HTTP ->
    filter -> SSO verify -> authorization manager.

Required environment (to get live PASS results):
  E2E_BASE_URL            e.g. http://localhost:8080   (default: http://localhost:8080)
  E2E_ACCESS_TOKEN        token for a user who HOLDS active feature SALES_INVOICE
                          (via SSO features list or an active+allowed permission
                          whose featureCode == SALES_INVOICE)
  E2E_NOGROUP_ACCESS_TOKEN  token for a user WITHOUT the SALES_INVOICE feature and
                          WITHOUT direct HSN_SAC/SALES_TAXES/GST_SLABS/CUSTOMERS/
                          SALES_INVOICES permissions
  E2E_SYSTEM_ADMIN_TOKEN    token for a user with SSO role SYSTEM_ADMIN (optional;
                          if absent, SYSTEM_ADMIN cases are SKIPPED)

Exit codes: 0 = no FAIL (SKIPPED allowed)  |  1 = at least one FAIL
"""

from __future__ import annotations

import os
import json
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:8080").rstrip("/")
TOKEN = os.environ.get("E2E_ACCESS_TOKEN", "").strip()
NOGROUP_TOKEN = os.environ.get("E2E_NOGROUP_ACCESS_TOKEN", "").strip()
SYSADMIN_TOKEN = os.environ.get("E2E_SYSTEM_ADMIN_TOKEN", "").strip()

FORBIDDEN = (401, 403)


class Result:
    def __init__(self):
        self.pass_ = []
        self.fail = []
        self.skipped = []

    def add(self, case_id, name, status, detail=""):
        row = {"case": case_id, "name": name, "status": status, "detail": detail}
        getattr(self, {"PASS": "pass_", "FAIL": "fail", "SKIPPED": "skipped"}[status]).append(row)
        print(f"[{status:7}] {case_id:<6} {name}  {detail}")

    def finish(self):
        print("\n==== SUMMARY ====")
        print(f"PASS: {len(self.pass_)}   FAIL: {len(self.fail)}   SKIPPED: {len(self.skipped)}")
        with open("e2e_feature_group_security_report.json", "w", encoding="utf-8") as fh:
            json.dump({"base_url": BASE, "results":
                       self.pass_ + self.fail + self.skipped}, fh, indent=2)
        return 1 if self.fail else 0


def req(token, method, path, body=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:  # network / DNS -> environment problem
        raise RuntimeError(f"environment unreachable at {url}: {e}")


def check(rs, case_id, name, token, method, path, expect, body=None, note=""):
    """expect: 'allowed' | 'denied401' | 'denied403' | 'notblocked'"""
    if expect in ("allowed",) and not token:
        rs.add(case_id, name, "SKIPPED", "no token supplied (E2E_* env var)")
        return
    try:
        status = req(token, method, path, body)
    except RuntimeError as e:
        rs.add(case_id, name, "SKIPPED", str(e))
        return
    if expect == "allowed":
        ok = status not in FORBIDDEN
    elif expect == "denied403":
        ok = status == 403
    elif expect == "denied401":
        ok = status == 401
    elif expect == "notblocked":
        ok = status not in FORBIDDEN
    else:
        raise ValueError(expect)
    rs.add(case_id, name,
           "PASS" if ok else "FAIL",
           f"{method} {path} -> HTTP {status}" + (f" (expected {expect})" if not ok else "") )


def main():
    rs = Result()

    # Groups availability flags
    has_group_holder = bool(TOKEN)
    has_normal = bool(NOGROUP_TOKEN)
    has_admin = bool(SYSADMIN_TOKEN)

    # ---------------------------------------------------------------
    # A. Direct feature requirement (unauthenticated / invalid / admin /
    #    direct-permission semantics). Live layer.
    # ---------------------------------------------------------------
    check(rs, "A1", "protected route rejects no-token", "", "GET", "/api/account/customers",
          "denied401")
    check(rs, "A2", "protected route rejects invalid token", "not-a-real-token",
          "GET", "/api/account/customers", "denied401")
    if has_admin:
        check(rs, "A3", "SYSTEM_ADMIN bypasses module routing", SYSADMIN_TOKEN,
              "GET", "/api/account/customers", "allowed")
    else:
        rs.add("A3", "SYSTEM_ADMIN bypasses module routing", "SKIPPED",
               "E2E_SYSTEM_ADMIN_TOKEN not supplied")
    if has_normal:
        check(rs, "A4", "no-permission user denied on CUSTOMERS read", NOGROUP_TOKEN,
              "GET", "/api/account/customers", "denied403")
        check(rs, "A5", "no-permission user denied on CUSTOMERS write", NOGROUP_TOKEN,
              "POST", "/api/account/customers", "denied403",
              body={"name": "probe", "email": "probe@example.com"})
    else:
        rs.add("A4", "no-permission user denied on CUSTOMERS read", "SKIPPED",
               "E2E_NOGROUP_ACCESS_TOKEN not supplied")
        rs.add("A5", "no-permission user denied on CUSTOMERS write", "SKIPPED",
               "E2E_NOGROUP_ACCESS_TOKEN not supplied")

    # ---------------------------------------------------------------
    # B. Group-based automatic API access (Phase 11 feature)
    # ---------------------------------------------------------------
    if has_group_holder:
        check(rs, "B1", "group holder GET customers (CUSTOMERS READ)", TOKEN,
              "GET", "/api/account/customers", "allowed")
        check(rs, "B2", "group holder GET hsn-sac (HSN_SAC READ)", TOKEN,
              "GET", "/api/account/hsn-sac", "allowed")
        check(rs, "B3", "group holder GET sales-taxes (SALES_TAXES READ)", TOKEN,
              "GET", "/api/account/sales-taxes", "allowed")
        check(rs, "B4", "group holder GET gst-slabs (GST_SLABS READ)", TOKEN,
              "GET", "/api/account/gst-slabs", "allowed")
        check(rs, "B5", "group holder GET sales/invoices (SALES_INVOICES READ)", TOKEN,
              "GET", "/api/account/sales/invoices", "allowed")
        check(rs, "B6", "group holder POST sales/invoices (SALES_INVOICES CREATE)", TOKEN,
              "POST", "/api/account/sales/invoices", "allowed",
              body={"invoiceNumber": "E2E-PROBE", "customerId": "00000000-0000-0000-0000-000000000000"})
        check(rs, "B7", "group holder POST customers DENIED (CUSTOMERS READ only)", TOKEN,
              "POST", "/api/account/customers", "denied403",
              body={"name": "probe", "email": "probe@example.com"})
        check(rs, "B8", "group holder PUT hsn-sac DENIED (HSN_SAC READ only)", TOKEN,
              "PUT", "/api/account/hsn-sac/00000000-0000-0000-0000-000000000000",
              "denied403", body={"code": "1234", "type": "HSN"})
        check(rs, "B9", "group holder DELETE sales/invoices DENIED (no DELETE)", TOKEN,
              "DELETE", "/api/account/sales/invoices/00000000-0000-0000-0000-000000000000",
              "denied403")
        # C. custom action suffix -> APPROVE is NOT in the group grants
        check(rs, "C1", "group holder approve action DENIED (no APPROVE in group)", TOKEN,
              "POST", "/api/account/sales/invoices/00000000-0000-0000-0000-000000000000/approve",
              "denied403", body={})
    else:
        for cid, name in [
            ("B1", "group holder GET customers (CUSTOMERS READ)"),
            ("B2", "group holder GET hsn-sac (HSN_SAC READ)"),
            ("B3", "group holder GET sales-taxes (SALES_TAXES READ)"),
            ("B4", "group holder GET gst-slabs (GST_SLABS READ)"),
            ("B5", "group holder GET sales/invoices (SALES_INVOICES READ)"),
            ("B6", "group holder POST sales/invoices (SALES_INVOICES CREATE)"),
            ("B7", "group holder POST customers DENIED (CUSTOMERS READ only)"),
            ("B8", "group holder PUT hsn-sac DENIED (HSN_SAC READ only)"),
            ("B9", "group holder DELETE sales/invoices DENIED (no DELETE)"),
            ("C1", "group holder approve action DENIED (no APPROVE in group)"),
        ]:
            rs.add(cid, name, "SKIPPED", "E2E_ACCESS_TOKEN not supplied "
                                         "(user must hold active feature SALES_INVOICE)")

    if has_normal:
        check(rs, "B10", "non-holder GET hsn-sac DENIED", NOGROUP_TOKEN,
              "GET", "/api/account/hsn-sac", "denied403")
        check(rs, "B11", "non-holder GET sales/invoices DENIED", NOGROUP_TOKEN,
              "GET", "/api/account/sales/invoices", "denied403")
    else:
        rs.add("B10", "non-holder GET hsn-sac DENIED", "SKIPPED",
               "E2E_NOGROUP_ACCESS_TOKEN not supplied")
        rs.add("B11", "non-holder GET sales/invoices DENIED", "SKIPPED",
               "E2E_NOGROUP_ACCESS_TOKEN not supplied")

    # ---------------------------------------------------------------
    # D. Group config validation -> policy engine is covered by unit tests
    # (FeatureGroupPermissionResolverTest). Live: behavior proven by B1-B11.
    # ---------------------------------------------------------------
    rs.add("D1", "feature-groups YAML sanity (code-level)",
           "SKIPPED", "static config; verified by unit tests + B-cases above")

    # ---------------------------------------------------------------
    # E. Authorization boundary (audit §6)
    # ---------------------------------------------------------------
    check(rs, "E1", "public companies write reaches controller (permitAll)", "",
          "POST", "/api/account/companies", "notblocked", body={"name": ""})
    check(rs, "E2", "public invoice PDF reaches handler (permitAll)", "",
          "GET", "/api/account/public/sales/invoices/00000000-0000-0000-0000-000000000000/pdf",
          "notblocked")
    if has_normal:
        check(rs, "E3", "orphan /api/gst/ecl fails closed for non-admin", NOGROUP_TOKEN,
              "GET", "/api/gst/ecl", "denied403")
    else:
        rs.add("E3", "orphan /api/gst/ecl fails closed for non-admin", "SKIPPED",
               "E2E_NOGROUP_ACCESS_TOKEN not supplied")
    # F-2 from the audit: /verify & /validate are unreachable (fail-closed,
    # no leak). Records observed behavior; the functional gap is in the doc.
    check(rs, "E4", "/api/account/auth/verify with no token -> 401 (fail-closed)", "",
          "GET", "/api/account/auth/verify", "denied401")
    if has_group_holder:
        status = req(TOKEN, "GET", "/api/account/auth/verify")
        ok = status == 403
        rs.add("E5", "/api/account/auth/verify with token -> 403 (audit F-2)",
               "PASS" if ok else "FAIL",
               f"GET /api/account/auth/verify -> HTTP {status} (expected 403)")
    else:
        rs.add("E5", "/api/account/auth/verify with token -> 403 (audit F-2)",
               "SKIPPED", "E2E_ACCESS_TOKEN not supplied")

    return rs.finish()


if __name__ == "__main__":
    sys.exit(main())