# F2 Integration Harness

This harness provisions isolated PostgreSQL databases only. It does not change
Account, Manufacturing, Inventory, authentication, or F1 behavior.

## Provision databases

```powershell
docker compose -f f2-integration/docker-compose.yml up -d postgres
```

The PostgreSQL instance listens on `localhost:55432` and creates:

- `accounting_test`
- `manufacturing_test`

Credentials are intentionally disposable and local-only:

- user: `f2_test`
- password: `f2_test`

## Start services

Start Account from `account-main` with an externally provided, legitimate SSO
test environment and these database settings:

```powershell
$env:DB_URL = 'jdbc:postgresql://localhost:55432/accounting_test'
$env:DB_USERNAME = 'f2_test'
$env:DB_PASSWORD = 'f2_test'
$env:SERVER_PORT = '18081'
$env:HIBERNATE_DDL_AUTO = 'update'
./mvnw.cmd spring-boot:run
```

Start Manufacturing from `manufacturing` with:

```powershell
$env:DB_URL = 'jdbc:postgresql://localhost:55432/manufacturing_test'
$env:DB_USERNAME = 'f2_test'
$env:DB_PASSWORD = 'f2_test'
$env:SERVER_PORT = '18084'
$env:JPA_DDL_AUTO = 'update'
$env:SERVICE_API_ACCOUNT = 'http://localhost:18081'
./mvnw.cmd spring-boot:run
```

The repository currently has no Manufacturing Dockerfile and no reusable
integration bearer token. Account authentication remains delegated to SSO.
The live HTTP test is therefore executable only when a legitimate SSO test
environment supplies a bearer token and Account/Manufacturing are started
separately.

## Verify PostgreSQL constraints

Use `psql` or an equivalent PostgreSQL client against each isolated database
and execute the corresponding query in `verify-constraints.sql`.

Expected Account constraints:

- `uk_gl_manufacturing_source`: `company_id,source_module,source_id,event_type`
- `uk_gl_manufacturing_idempotency`: `company_id,source_module,idempotency_key`

Expected Manufacturing constraints:

- `uk_mfg_acct_source`: `company_id,source_module,source_id,event_type`
- `uk_mfg_acct_idempotency`: `company_id,source_module,idempotency_key`

## Current environment limitation

Docker is not installed in the current machine, and the running Account
service returns `401` without an SSO bearer token. This harness can be
prepared here but cannot truthfully claim live cross-service execution until
those prerequisites are supplied.
