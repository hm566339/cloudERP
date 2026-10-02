# Phase 6B: Downstream ERP Integration Blocked

## 1. Executive Summary & Discovery Findings

During Phase 6B discovery, an exhaustive search was conducted across the workspace (`d:\final2\finalcode1\finalcode1\ERP_System`):

* **Applications Found**: Exactly one Spring Boot application (`com.erp:auth_service`).
* **Package Structure**: `com.erp.auth_service` and its subpackages (`billing`, `client`, `config`, `controller`, `dto`, `exception`, `mail`, `mapper`, `model`, `repository`, `security`, `service`, `utility`).
* **Downstream ERP Modules (Inventory, Sales, HR, Accounting, CRM, General Ledger)**: **NONE FOUND**.
* **Downstream ERP Controllers/Services/Repositories/Entities**: **NONE FOUND**.

Per Phase 6B Requirement 1:
> *"If no downstream ERP exists: STOP implementation against imaginary ERP resources. Instead create: `phase-6b-erp-integration-blocked.md`... Do not fabricate ERP code."*

This document defines the exact downstream ERP requirements, integration contract, token validation rules, and verification test specifications required for when the downstream ERP application is made available.

---

## 2. Missing Repository & Architecture Requirements

The downstream ERP repository (e.g. `erp-core-service` or module-specific services like `erp-sales-service`, `erp-inventory-service`) must integrate with this central SSO service (`auth_service`).

```
+-------------------------------------------------------------+
|                     Central SSO Service                     |
|                   (com.erp:auth_service)                    |
|                                                             |
|  - Platform Admin Authentication & Management               |
|  - Customer Tenant Login & Multi-Company Selection          |
|  - Scoped Support Session Creation & Introspection API      |
|  - RSA Key Pair / JWT Issuance & Verification               |
+-------------------------------------------------------------+
                               |
              Issues Bearer JWTs (CUSTOMER or PLATFORM_SUPPORT)
                               |
                               v
+-------------------------------------------------------------+
|                    Downstream ERP Service                   |
|           (MISSING - To be connected when available)         |
|                                                             |
|  - ERP Security Filter / Interceptor                        |
|  - Tenant & Support Context Enforcement                     |
|  - Business Controllers (Sales, Inventory, Invoices, etc.)  |
|  - Scoped Data Access Layer (WHERE org_id = ? AND comp_id=?) |
|  - Support Mutation Audit Logger                            |
+-------------------------------------------------------------+
```

---

## 3. Exact SSO Integration Contract for Downstream ERP

Downstream ERP services must establish communication with the Central SSO service via the following contract:

### 3.1 Token Verification & Public Keys
Downstream ERP services must obtain the SSO signing public key to verify JWT signatures:
- **Public Key Endpoint**: `GET /api/sso/.well-known/jwks.json` or local public key configuration matching SSO issuer `erp-sso`.
- **Allowed Algorithms**: RS256 / HS256 (as configured).

### 3.2 Token Introspection Endpoint (Authoritative)
To verify real-time revocation status of support sessions:
- **Support Session Context**: `GET /api/admin/support-sessions/{supportSessionId}/context`
  - Authorization: `Bearer <PLATFORM_ADMIN_OR_SUPPORT_TOKEN>`
  - Response:
    ```json
    {
      "success": true,
      "data": {
        "principalType": "PLATFORM_SUPPORT",
        "supportSessionId": "4b68427d-9443-4dc9-98e3-b09e25d2024b",
        "platformAdminId": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "platformAdminEmail": "operator@platform.com",
        "organizationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "organizationCode": "ACME_CORP",
        "companyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "companyCode": "ACME_WEST",
        "moduleId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "moduleCode": "SALES",
        "moduleName": "Sales Management",
        "reason": "Customer ticket #4492: incorrect tax calculation",
        "remainingSeconds": 1740,
        "active": true
      }
    }
    ```

---

## 4. Exact Downstream ERP Resource Endpoints Required

When the downstream ERP service is implemented, it must expose real tenant-sensitive business resources with strict tenant boundary enforcement:

### 4.1 Sales / Invoicing Resource (`/api/erp/sales/**`)
* `GET /api/erp/sales/orders`: List sales orders for the current scoped company.
* `GET /api/erp/sales/orders/{id}`: Get specific sales order (must verify `order.companyId == context.companyId` and `order.organizationId == context.organizationId`).
* `POST /api/erp/sales/orders`: Create sales order (must assign `organizationId` and `companyId` strictly from server context, ignoring request body tenant fields).
* `PUT /api/erp/sales/orders/{id}`: Correct/update sales order (must enforce support write permissions and audit trail).
* `DELETE /api/erp/sales/orders/{id}`: Cancel/delete sales order (requires write access and ownership verification).

### 4.2 Inventory Resource (`/api/erp/inventory/**`)
* `GET /api/erp/inventory/items`: List items in the authorized company's warehouse.
* `GET /api/erp/inventory/items/{id}`: Inspect inventory balance.
* `PUT /api/erp/inventory/items/{id}/adjust`: Make inventory adjustment.

---

## 5. Exact Support-Token Validation Requirements

Every downstream ERP security filter MUST enforce the following pipeline on incoming requests:

```
[Incoming HTTP Request]
          │
          ▼
1. Extract Bearer Token from Authorization Header
          │
          ▼
2. Validate JWT Signature and Expiry
          │
          ▼
3. Inspect `principalType` Claim:
   ├── "CUSTOMER" ────────► Standard tenant authorization flow
   ├── "PLATFORM_ADMIN" ──► REJECT with 403 Forbidden (No direct access without support session)
   └── "PLATFORM_SUPPORT" ─► Proceed to Support Validation Flow
                                      │
                                      ▼
4. Validate Support Session Server-Side:
   - Call SSO Introspection or local cache: verify session is ACTIVE
   - Verify Platform Admin is ACTIVE
   - Verify Organization is not BLOCKED
   - Verify Company belongs to Organization
                                      │
                                      ▼
5. Enforce Module Boundary:
   - Target API module (e.g. "SALES") MUST match token claim `module == "SALES"`
   - If token is for "INVENTORY" and request hits "/api/erp/sales/**" ──► REJECT with 403 Forbidden
                                      │
                                      ▼
6. Enforce Scoped Tenant Boundaries:
   - Set thread-local TenantContext: `orgId = token.organizationId`, `companyId = token.companyId`
   - All SQL queries MUST execute with `WHERE organization_id = :orgId AND company_id = :companyId`
                                      │
                                      ▼
7. Enforce READ_ONLY Policy:
   - If `org.accessMode == READ_ONLY`:
     * Read operations (GET) allowed.
     * Write operations (POST, PUT, DELETE) blocked unless token has explicit `SUPPORT:WRITE_READ_ONLY`.
                                      │
                                      ▼
8. Audit Correlation:
   - For any mutation under `PLATFORM_SUPPORT`, write audit log with:
     `operatorAdminId`, `supportSessionId`, `organizationId`, `companyId`, `resourceType`, `resourceId`, `reason`.
```

---

## 6. Exact Test Suite Required Once Downstream ERP Is Available

The following test suites must be executed against the downstream ERP application:

### Test Suite A: Authentication & Token Separation
1. `customerToken_cannotAccessPlatformAdminRoutes()`: Verify 403 Forbidden.
2. `directPlatformAdminToken_cannotAccessDownstreamErpRoutes()`: Verify 403 Forbidden.
3. `platformSupportToken_canAccessScopedErpRoutes()`: Verify 200 OK.

### Test Suite B: Tenant Isolation & IDOR
1. `supportRead_crossCompany_sameOrg_failsWith403Or404()`: Support token for Company A1 cannot read order from Company A2.
2. `supportWrite_crossCompany_sameOrg_failsWith403Or404()`: Support token for Company A1 cannot update order from Company A2.
3. `supportRead_crossOrg_failsWith403Or404()`: Support token for Org A cannot read order from Org B.
4. `supportMutation_setsServerDerivedTenantIds()`: Mutation payload with spoofed `companyId` is ignored; server context is preserved.

### Test Suite C: Module Boundary Enforcement
1. `supportSessionForSales_accessingInventoryApi_rejectedWith403()`: Token with `module = "SALES"` rejected when calling `/api/erp/inventory/**`.
2. `supportSessionForBilling_accessingSalesApi_rejectedWith403()`: Token with `module = "BILLING"` rejected when calling `/api/erp/sales/**`.

### Test Suite D: Session Lifecycle & Revocation
1. `activeSupportSession_readsSuccessfully()`: Initial read returns 200 OK.
2. `revokedSupportSession_subsequentRequestFailsWith401Or403()`: After calling `/api/admin/support-sessions/{id}/revoke`, downstream immediately rejects.
3. `expiredSupportSession_failsWith401()`: Token past `exp` or session past `expiresAt` fails.
4. `disabledPlatformAdmin_failsWith403()`: When operator status set to `INACTIVE`, support session immediately fails.

### Test Suite E: READ_ONLY Organization Handling
1. `orgReadOnly_supportRead_allowed()`: GET requests succeed.
2. `orgReadOnly_supportStandardWrite_blocked()`: Normal mutation attempt returns 403 Forbidden.
3. `orgReadOnly_emergencySupportWrite_allowedOnlyWithExplicitPermissionAndAudit()`: Blocked without `SUPPORT:WRITE_READ_ONLY`.

### Test Suite F: Audit Trail
1. `supportMutation_createsAuditEntryInDownstreamAndSSO()`: Verify database records operator ID, session ID, target IDs, timestamp, and action without logging secrets.

---

## 7. Status Sign-off

* **Implementation Status**: BLOCKED pending downstream ERP application repository.
* **SSO Implementation**: Complete & verified (Auth, Session, Scoped Support Token issuance, Introspection API, Tenant Scoping, and Audit logging).
