# Production-Ready Razorpay Recurring Subscription Integration

This document outlines the complete integration details, architecture, API contracts, webhook configurations, and operational guide for Razorpay Recurring Subscription Billing in the Cloud ERP system.

---

## 1. Architecture Overview

The integration follows a **Real Recurring Subscription Flow** (using Razorpay's Subscriptions API `/v1/subscriptions`, NOT a one-time order).

```
   +--------------------------------------------------------------------------+
   |                             ERP Admin                                    |
   |              Defines/Bootstraps Plans (Basic, Pro, Enterprise)            |
   +------------------------------------+-------------------------------------+
                                        |
                                        v
   +--------------------------------------------------------------------------+
   |                           ERP Database                                   |
   |           SubscriptionPlan (id, name, price, interval, razorpayPlanId)   |
   +------------------------------------+-------------------------------------+
                                        |
       1. POST /api/sso/subscriptions/{orgId}/checkout {"planId": "..."}
                                        |
                                        v
   +--------------------------------------------------------------------------+
   |                     SubscriptionBillingService                           |
   |  - Validates organization & active subscription status                   |
   |  - Retrieves authoritative plan & price from database                    |
   |  - Creates/Reuses Razorpay Plan (stores razorpayPlanId in DB)            |
   |  - Creates Razorpay Subscription via REST API (/v1/subscriptions)        |
   |  - Saves ERP Subscription in PENDING state with razorpaySubscriptionId   |
   |  - Returns Checkout payload (keyId, subscriptionId, plan details)        |
   +------------------------------------+-------------------------------------+
                                        |
       2. Checkout Response (Razorpay Key ID + Subscription ID)
                                        |
                                        v
   +--------------------------------------------------------------------------+
   |                             ERP Frontend                                 |
   |  - Opens Razorpay Checkout Popup with subscription_id                    |
   |  - Customer authorizes Mandate / Card / UPI AutoPay                      |
   +------------------------------------+-------------------------------------+
                                        |
       3. Razorpay processes payment & triggers Server-to-Server Webhook
                                        |
                                        v
   +--------------------------------------------------------------------------+
   |               BillingWebhookController & PaymentWebhookService           |
   |  - POST /api/sso/billing/webhook/razorpay                                |
   |  - Signature verification using HMAC-SHA256 (X-Razorpay-Signature)       |
   |  - Idempotency check via PaymentEvent (skips duplicate event IDs)        |
   |  - Identifies ERP Subscription by razorpaySubscriptionId                 |
   |  - Updates Subscription status (ACTIVE / PAST_DUE / CANCELLED / READ_ONLY|
   |  - Records Payment transaction & settles open Invoices                   |
   +--------------------------------------------------------------------------+
```

---

## 2. Environment Variables

The following environment variables configure the Razorpay integration in `ERP_System` and `docker-compose.yml`:

| Environment Variable | Description | Example / Default |
|----------------------|-------------|-------------------|
| `RAZORPAY_ENABLED` | Toggle Razorpay recurring billing | `true` (default: `false`) |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (Test or Live) | `rzp_test_xxxxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key (Never exposed to frontend) | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured in Razorpay Dashboard for Webhook verification | `whsec_xxxxxxxxxxxxxxxxx` |
| `RAZORPAY_BASE_URL` | Razorpay API Gateway Base URL | `https://api.razorpay.com` |

---

## 3. Razorpay Dashboard Setup

### A. API Keys
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch to **Test Mode** (for development) or **Live Mode** (for production).
3. Navigate to **Settings** -> **API Keys**.
4. Generate/Copy your **Key ID** and **Key Secret**.
5. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`.

### B. Webhook Setup
1. In Razorpay Dashboard, navigate to **Settings** -> **Webhooks**.
2. Click **+ Add New Webhook**.
3. **Webhook URL**:
   - **Production**: `https://www.mark2.in/api/sso/billing/webhook/razorpay`
   - **Local Testing**: Your ngrok or tunneling URL: `https://<subdomain>.ngrok-free.app/api/sso/billing/webhook/razorpay`
4. **Secret**: Enter a secure random string (e.g. `whsec_mysecretkey987654321`) and configure it as `RAZORPAY_WEBHOOK_SECRET`.
5. **Alert Email**: Enter system admin email for failed webhook alerts.
6. **Active Events**: Check the following required events:
   - `subscription.charged` (Primary recurring billing event)
   - `subscription.activated`
   - `subscription.cancelled`
   - `subscription.paused`
   - `subscription.resumed`
   - `subscription.completed`
   - `subscription.halted`
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
7. Click **Create Webhook**.

---

## 4. API Endpoints Reference

### 1. Initiate Subscription Checkout
- **Endpoint**: `POST /api/sso/subscriptions/{organizationId}/checkout`
- **Security**: Authenticated JWT (`ROLE_ADMIN` or authorized organization member)
- **Request Body**:
  ```json
  {
    "planId": "3491ba63-2287-4309-a796-7bb2a842cfb0"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "keyId": "rzp_test_1DP5mmOlF5G5ag",
    "subscriptionId": "sub_00000000000001",
    "erpSubscriptionId": "8fa360c7-2d4e-4e6f-9988-cb94d762d08a",
    "planName": "Pro Plan",
    "planCode": "PRO",
    "amount": 2999.00,
    "currency": "INR",
    "organizationId": "ea811382-0afc-4908-a209-9bedcc63c445",
    "organizationName": "Mohit Corp",
    "customerEmail": "admin@mohitcorp.com",
    "customerContact": "9876543210"
  }
  ```

### 2. Cancel Subscription
- **Endpoint**: `POST /api/sso/subscriptions/{subscriptionId}/cancel`
- **Security**: Authenticated JWT
- **Response** (`200 OK`):
  ```json
  {
    "message": "Subscription cancelled successfully",
    "status": "CANCELLED"
  }
  ```

### 3. Get Current Organization Subscription
- **Endpoint**: `GET /api/sso/subscriptions/{organizationId}/current`
- **Security**: Authenticated JWT
- **Response** (`200 OK`):
  Returns the active or pending subscription record with Razorpay subscription metadata.

### 4. Razorpay Webhook Ingestion
- **Endpoint**: `POST /api/sso/billing/webhook/razorpay`
- **Security**: Public endpoint permitted in `SecurityConfig`, authenticated strictly by verifying HMAC-SHA256 of payload against `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET`.
- **Response**:
  - `200 OK` on verified event processed or duplicate safely skipped.
  - `401 Unauthorized` on signature mismatch.

---

## 5. Webhook Events & ERP Subscription Lifecycle

| Razorpay Webhook Event | ERP Subscription Status | ERP Payment Status | Notes |
|------------------------|-------------------------|--------------------|-------|
| `subscription.charged` | `ACTIVE` | `PAID` | Recorded in `Payment`, advances `nextBillingDate`, settles pending `Invoice`. |
| `payment.captured` | `ACTIVE` | `PAID` | Fallback if subscription was pending. |
| `payment.failed` | `PAST_DUE` | `FAILED` | Grace period or retry required by customer. |
| `subscription.halted` | `PAST_DUE` | `FAILED` | Exhausted retries without payment. |
| `subscription.cancelled` | `CANCELLED` | - | Customer or admin cancelled. |
| `subscription.completed` / `subscription.expired` | `READ_ONLY` | - | Reached max billing cycles. |
| `subscription.paused` | `PAUSED` | - | Temporary hold. |
| `subscription.resumed` | `ACTIVE` | - | Resumed from pause. |

---

## 6. Webhook Idempotency

Webhooks from Razorpay can be retried automatically. The system guarantees idempotency via the `PaymentEvent` table:
1. When a webhook arrives, `PaymentWebhookServiceImpl` checks `paymentEventRepository.findByProviderAndProviderEventId("RAZORPAY", eventId)`.
2. If the event ID was already processed, it logs an idempotent skip and immediately returns `HTTP 200 OK` without duplicating payments, changing statuses, or double-invoicing.
3. If new, the event payload is stored with status `PROCESSED` with a unique database constraint `uk_payment_event_provider_id` (`provider`, `provider_event_id`).

---

## 7. Frontend Integration Contract

The React application uses the Razorpay standard checkout popup script (`https://checkout.razorpay.com/v1/checkout.js`).

### Flow:
1. User clicks **"Pay with Razorpay (Auto-Renew)"** on `SubscriptionPage.jsx`.
2. Frontend calls `subscriptionPlanApi.createSubscriptionCheckout(orgId, planId)`.
3. Backend creates/reuses the Razorpay Plan and creates a Razorpay Subscription (`sub_xxxxx`), returning `keyId` and `subscriptionId`.
4. Frontend initializes Razorpay options:
   ```javascript
   const options = {
     key: checkoutData.keyId,
     subscription_id: checkoutData.subscriptionId,
     name: 'Cloud ERP',
     description: `${checkoutData.planName} ERP Subscription`,
     handler: function (response) {
       // Response contains razorpay_payment_id, razorpay_subscription_id, razorpay_signature
       // Note: Authoritative activation is handled server-to-server via webhook
       fetchCurrentSubscription();
     },
     prefill: {
       email: checkoutData.customerEmail,
       contact: checkoutData.customerContact
     },
     theme: {
       color: '#2563eb'
     }
   };
   const rzp = new window.Razorpay(options);
   rzp.open();
   ```

---

## 8. Database Schema Changes

All schema changes adhere to JPA Hibernate auto-ddl / Liquibase naming conventions:

### A. `subscriptions` Table
- `razorpay_plan_id` (`VARCHAR(255)`)
- `razorpay_subscription_id` (`VARCHAR(255)`)
- `razorpay_customer_id` (`VARCHAR(255)`)
- `next_billing_date` (`TIMESTAMP`)

### B. `subscription_plans` Table
- `razorpay_plan_id` (`VARCHAR(255)`)

### C. `payments` Table
- `organization_id` (`UUID`, Foreign Key to `organization(id)`)
- `razorpay_payment_id` (`VARCHAR(255)`)
- `razorpay_order_id` (`VARCHAR(255)`)
- `razorpay_subscription_id` (`VARCHAR(255)`)
- `razorpay_signature` (`VARCHAR(255)`)
- `paid_at` (`TIMESTAMP`)
- `updated_at` (`TIMESTAMP`)

---

## 9. Testing & Validation

### Automated Unit & Service Tests
Run the Razorpay test suite:
```bash
./mvnw test -Dtest=RazorpaySubscriptionBillingTest
```

**Test Coverage (16 Test Scenarios)**:
1. `test1_PlanLookup()`: Retrieves existing active ERP subscription plan.
2. `test2_RazorpayPlanCreation()`: Creates Razorpay plan via REST API if not existing.
3. `test3_ExistingRazorpayPlanReuse()`: Reuses saved `razorpayPlanId` to prevent duplicates.
4. `test4_RazorpaySubscriptionCreation()`: Creates Razorpay subscription via API.
5. `test5_ERPSubscriptionStoresRazorpaySubscriptionId()`: Persists `razorpaySubscriptionId` on ERP entity.
6. `test6_FrontendCannotManipulatePrice()`: Discards frontend amounts, always enforcing DB price.
7. `test7_SuccessfulPaymentWebhook()`: Webhook `subscription.charged` sets subscription to `ACTIVE` and records `Payment`.
8. `test8_FailedPaymentWebhook()`: Webhook `payment.failed` sets subscription to `PAST_DUE`.
9. `test9_SubscriptionCancellationWebhook()`: Webhook `subscription.cancelled` marks subscription as `CANCELLED`.
10. `test10_SubscriptionExpiryWebhook()`: Webhook `subscription.expired` marks subscription as `READ_ONLY`.
11. `test11_InvalidWebhookSignature()`: Rejects payload with 401 on forged signature.
12. `test12_DuplicateWebhookIdempotency()`: Prevents duplicate payment creation on webhook retries.
13. `test13_UnauthorizedOrganizationAccess()`: Forbids subscription checkout across unassociated tenants.
14. `test14_DuplicateActiveSubscriptionPrevention()`: Blocks checkout if organization already has an active subscription.
15. `test15_RazorpayApiFailure()`: Properly handles external Razorpay API errors without corrupting DB.
16. `test16_MissingRazorpayConfiguration()`: Throws clear configuration exception when Razorpay credentials are missing.
