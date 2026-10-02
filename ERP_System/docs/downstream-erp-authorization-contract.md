# Downstream ERP Authorization Contract

This repository provides the central SSO boundary. Downstream ERP applications must enforce authorization for every request.

> URL parameters, hostnames, company codes, organization codes, and JWT claims are routing/context information and are never sufficient by themselves to authorize tenant access.

## Required request sequence

1. Validate signature, issuer configuration, expiration, subject, token type, and persisted session.
2. Establish organization context from the authenticated session/token snapshot, then recheck active `OrganizationMember` state.
3. Establish company context only after checking that the company belongs to the organization.
4. Check active `MemberCompanyAccess` for the authenticated member and company.
5. Check module entitlement for the organization and requested module.
6. Check current role and permission from server-side state.
7. Check subscription status and organization `accessMode`.
8. Call `requireReadAccess()` for protected reads.
9. Call `requireWriteAccess()` before create, update, delete, approval, posting, submission, cancellation, or financial/inventory mutations.

## Example flows

Read: `GET /customers/{id}` -> authenticate -> resolve org/company -> verify member access -> verify CUSTOMER entitlement and READ permission -> `requireReadAccess()` -> query with organization/company predicates.

Create: `POST /customers` -> authenticate -> resolve org/company -> verify member/access/module/permission -> `requireWriteAccess()` -> persist with server-derived organization/company IDs; ignore caller-supplied tenant IDs.

Update: `PUT /customers/{id}` -> authenticate -> verify the existing row belongs to current organization/company -> verify permission -> `requireWriteAccess()` -> update.

Delete: `DELETE /customers/{id}` -> authenticate -> verify ownership and permission -> `requireWriteAccess()` -> soft-delete or delete according to ERP policy.

Cross-tenant mismatch must return the existing application convention, normally 403 or a non-enumerating 404. Do not reveal whether another organization's resource exists.
