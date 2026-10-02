# Platform Admin Architecture

## 1. Domain Separation

The SaaS Operator / Platform Admin layer is strictly partitioned from Customer Organizations.

```
PLATFORM DOMAIN
│
├── Platform Admin Identities (platform_admin)
│   ├── SUPER_ADMIN (All platform operations + Admin user management)
│   ├── SUPPORT_ADMIN (Customer inspection & authorized support corrections)
│   ├── BILLING_ADMIN (Subscription, plan, invoice, and payment inspection/ops)
│   └── READ_ONLY_SUPPORT (Read-only customer data inspection)
│
└── Customer Organizations Domain (Isolated)
    ├── Organization Owner
    ├── Organization Admin
    └── Organization Members (MemberCompanyAccess / UserPortalAccess)
```

### Absolute Boundary Rules
1. **No Shared Roles**: Platform Admin roles (`PlatformRole`) and Customer Organization roles (`Role`, `OrganizationMember`) live in distinct database schemas and domain models.
2. **Customer Isolation**: Customer credentials, sessions, and JWTs have no access to `/api/admin/**`. Any attempt yields `403 Forbidden`.
3. **Admin Isolation**: Platform Admin credentials cannot directly access customer resources without an active, explicit `SupportAccessSession`.
4. **No Backdoors**: Support access is time-bounded, scoped to `(Organization, Company, Module)`, authorized, and logged.

---

## 2. Platform Identity & Role System

### Entities
- **`PlatformAdmin`**: Holds the operator's identity (`id`, `email`, `passwordHash`, `fullName`, `status`, `failedLoginCount`, `lockedUntil`, `lastLoginAt`).
- **`PlatformRole`**: Holds platform roles (`SUPER_ADMIN`, `SUPPORT_ADMIN`, `BILLING_ADMIN`, `READ_ONLY_SUPPORT`).
- **`PlatformPermission`**: Atomic permissions covering dashboard, orgs, users, companies, billing, support access, audit logs, and admin management.
- **`SupportAccessSession`**: Bounded customer support sessions.
- **`PlatformAuditLog`**: Append-only audit trail.

### Role & Permission Matrix

| Permission | SUPER_ADMIN | SUPPORT_ADMIN | BILLING_ADMIN | READ_ONLY_SUPPORT |
|---|:---:|:---:|:---:|:---:|
| `PLATFORM_DASHBOARD_READ` | ✅ | ✅ | ✅ | ✅ |
| `PLATFORM_ORGANIZATION_READ` | ✅ | ✅ | ✅ | ✅ |
| `PLATFORM_ORGANIZATION_WRITE` | ✅ | ❌ | ❌ | ❌ |
| `PLATFORM_USER_READ` | ✅ | ✅ | ❌ | ✅ |
| `PLATFORM_USER_WRITE` | ✅ | ❌ | ❌ | ❌ |
| `PLATFORM_COMPANY_READ` | ✅ | ✅ | ❌ | ✅ |
| `PLATFORM_COMPANY_WRITE` | ✅ | ❌ | ❌ | ❌ |
| `PLATFORM_SUBSCRIPTION_READ` | ✅ | ❌ | ✅ | ❌ |
| `PLATFORM_SUBSCRIPTION_WRITE` | ✅ | ❌ | ✅ | ❌ |
| `PLATFORM_PAYMENT_READ` | ✅ | ❌ | ✅ | ❌ |
| `PLATFORM_PAYMENT_WRITE` | ✅ | ❌ | ✅ | ❌ |
| `PLATFORM_SUPPORT_ACCESS` | ✅ | ✅ | ❌ | ✅ (Read-Only) |
| `PLATFORM_AUDIT_READ` | ✅ | ✅ | ❌ | ✅ |
| `PLATFORM_ADMIN_MANAGE` | ✅ | ❌ | ❌ | ❌ |

---

## 3. High-Risk Controls

1. **Last Active SUPER_ADMIN Protection**:
   - The platform rejects any attempt to disable (`status = INACTIVE/SUSPENDED`) or demote (remove `SUPER_ADMIN` role) the last active `SUPER_ADMIN`.
   - Prevents accidental operator lockout.
2. **Account Lockout**:
   - 5 consecutive invalid login attempts automatically locks the platform admin account for 15 minutes.
3. **Generic Error Responses**:
   - Platform admin login endpoints return a generic `"Invalid credentials"` message regardless of whether the email exists.
4. **Append-Only Platform Audit Log**:
   - Every login (success/failure), logout, support session lifecycle event, and data mutation is recorded in `platform_audit_log` with IP, user-agent, target organization, company, module, and correlation IDs.
