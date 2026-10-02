# Phase 5 Legacy Deprecation Plan

## Remaining legacy dependencies

- `User.company` and `user.company_id` remain required by existing entities and clients.
- Legacy login accepts `companyCode`.
- Legacy repositories and module portal-access mappings remain in use.
- `Session.refreshToken` raw-token lookup remains only as a migration fallback for pre-Phase-3 sessions.
- Module client secrets use the existing credential column until clients are migrated to hashed verification.

## Deprecation sequence

1. Inventory consuming applications and log whether requests use organization or company context.
2. Backfill and verify organization membership/access invariants.
3. Migrate each client to organization login and organization/company authorization.
4. Stop creating new company-only users and sessions.
5. Migrate remaining refresh sessions to `refresh_token_record`.
6. Hash/rotate module client secrets with dual-read verification.
7. Remove legacy fields only after all consumers pass compatibility tests and a rollback window has elapsed.

No legacy column or endpoint is removed in Phase 5.
