# Account ERP Tenant Security Audit

## Mutation inventory

The account service contains approximately 62 controller mutation annotations across company, company-module, feature, module, module-route, permission, role, session, and user controllers. A source scan found major persistence writes in company, company-module, feature, module, module-route, permission, role, session, user, workflow, quotation, receipt-voucher, and other accounting services.

All `/api/**` requests are routed through `SsoAuthorizationManager`; actions are derived from HTTP method or configured suffixes such as `/approve`, `/post`, `/cancel`, and `/export`. READ_ONLY now rejects business POST/PUT/PATCH/DELETE requests before permission evaluation. Authentication, public, billing, subscription, renewal, and payment paths are explicitly excluded from that READ_ONLY mutation block.

## Tenant-sensitive read inventory

Account modules use `CurrentUserContext.resolveCompanyId` and `resolveCompanyIdForQuery` as the intended tenant boundary. Reports, ledgers, invoices, customers, vendors, quotations, vouchers, workflows, and master-data services require review of repository predicates for the resolved company ID. The central SSO response now supplies organization ID/code and access mode, but local accounting rows remain company-owned.

## Findings and fixes

1. **Organization context was absent downstream.** Fixed by adding organization ID/code/access mode to the SSO user response, account DTO, authenticated principal, and request context.
2. **READ_ONLY existed centrally but was not enforced by account authorization.** Fixed in `SsoAuthorizationManager` for business mutation methods.
3. **Raw authorization code and token values were logged by account auth code.** Removed raw code/access-token logging and refresh-token payload logging.
4. **Normal-user company parameter substitution.** Existing `CurrentUserContext.resolveCompanyId` correctly ignores caller company IDs for ordinary users. This must remain the only supported resolution path.
5. **System-admin company IDs.** System-admin explicit company selection remains a privileged path, is extracted/audited by `SystemAdminCompanyIdAspect`, and must use organization-aware SSO verification before any future cross-org operation.

## IDOR / cross-tenant assessment

The central SSO rejects organization membership and company-access mismatches before token exchange and on token verification. Account ordinary-user service code resolves company context from the verified request context rather than trusting request IDs. Foreign object IDs must still be tested per module using repository methods that include company predicates; this audit does not claim every accounting module has passed an end-to-end IDOR test.

## Remaining risks

- `CompanyBootstrapServiceImpl` has legacy local lookup-by-ID/code behavior for provisioning. It is safe only when called with SSO-verified context; it must not be exposed as a generic authorization method.
- The account application has many business modules and scheduled jobs. Each module needs module-specific integration tests for foreign IDs and READ_ONLY writes.
- Client/module secret hashing, issuer/audience rollout, rate limiting, and deployment-level trusted proxy configuration remain coordinated production work.
- No downstream inventory, sales, manufacturing, or HR repositories were modified or claimed as tested.
