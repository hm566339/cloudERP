# Phase 5 Subscription State Machine

## Valid transitions

| From | Event | To | Organization access |
|---|---|---|---|
| `TRIALING` | `trialEndsAt <= now` | `EXPIRED` | `READ_ONLY` |
| `TRIALING` | verified payment succeeded | `ACTIVE` | `FULL` |
| `ACTIVE` | verified cancellation | `CANCELLED` | policy-controlled; never delete data |
| `ACTIVE` | trusted suspension/policy | `SUSPENDED` | policy-controlled |
| `EXPIRED` | verified renewal/payment | `ACTIVE` | `FULL` |

Trial expiry is idempotent: only `TRIALING` records at or past `trialEndsAt` are changed. Payment webhooks are idempotent on `(provider, providerEventId)` and payment provider ID. Unsupported event types are marked `IGNORED`.

The current webhook contract handles verified `payment.succeeded` events. Failed/pending payment policy is intentionally not guessed; a provider-specific policy must define grace periods before mapping access to `READ_ONLY` or `BLOCKED`.

Organization access mode is separate from subscription status. Login is allowed in `READ_ONLY`; business writes are rejected. `BLOCKED` prevents normal organization session requests.
