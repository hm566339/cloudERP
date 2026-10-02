# Phase 5 Migration Readiness

## Pre-migration

1. Back up PostgreSQL and verify restore procedures.
2. Confirm `user.company_id`, `company.id`, and all legacy client/module rows exist.
3. Run the verification queries at the end of `docs/phase-2-organization-migration.sql`.
4. Resolve slug collisions, orphan companies, missing users, and legacy relationships without silently merging accounts.
5. Confirm webhook secret, RSA key files, database credentials, and trusted public URLs are supplied by deployment configuration.

## Migration order

1. Create organizations and additive organization/company columns.
2. Create organization members from each existing user/company relationship.
3. Create member-company access for each active legacy relationship.
4. Create subscriptions/plans/modules and payment/refresh tables.
5. Add foreign keys and indexes after backfill validation.
6. Deploy with legacy login and `User.company` retained.
7. Enable organization-aware login for migrated organizations.
8. Set production profile `spring.jpa.hibernate.ddl-auto=validate`.

## Post-migration verification

- Every active legacy user/company relationship has an active organization member and member-company access row.
- No access row points across organizations.
- Organization/company codes are unique.
- Refresh token hashes are unique and raw-token compatibility rows are tracked for removal.
- Payment event and payment provider IDs are unique.
- Hibernate validation succeeds without schema mutation.

## Rollback and mitigation

Do not drop columns or tables. If organization-aware login must be disabled, route clients back to the existing company-based login while retaining additive rows. If a backfill is wrong, correct organization/member/access rows from the backup and verification report before re-enabling the new flow. Existing legacy company data remains the compatibility source until all consumers migrate.
