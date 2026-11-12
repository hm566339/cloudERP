# Mark2 Cloud ERP: CRM & Workflow Service Integration Specification

**Document Version:** 1.0.0  
**Initiating Service:** `crm-service` (:8086)  
**Workflow Engine:** `workflow-service` (:8083, database: `workflow_db`)  
**Design Pattern:** External Document Reference & Asynchronous Webhook Callback  

---

## 1. Architectural Philosophy: Decoupled Approval Engine

The Mark2 ERP project possesses an independent, multi-tenant approval and business process engine: **`workflow-service`**.

Under the **Microservices Database-Per-Service** pattern:
1. `crm-service` contains **zero approval tables**, **zero stage transition definitions**, and **zero approver task queues**.
2. All human governance, multi-tier approvals, role/department assignments, SLA timers, delegations, and immutable approval logs reside in `workflow_db`.
3. `crm-service` initiates workflows via the existing external document reference contract:
   - `module_name = 'CRM'`
   - `document_type = 'QUOTATION' | 'DISCOUNT_APPROVAL' | 'CUSTOMER_ONBOARDING' | 'LEAD_REASSIGNMENT'`
   - `document_id = <CRM_ENTITY_UUID>`
   - `document_number = <CRM_CODE>`
   - `callback_url = 'http://crm-service:8086/api/crm/workflows/callback'`

---

## 2. Core Approval Use Cases

### 2.1 Use Case A: High Discount Approval on Quotations
* **Trigger:** A sales representative generates a quotation where line-item or header discount exceeds the company's threshold:
  $$\text{discount\_pct} > \text{crm\_company\_setting.discount\_approval\_threshold} \quad (\text{e.g. } > 15.00\%)$$
* **Behavior:**
  1. Quotation status is set to `PENDING_APPROVAL` with `approval_status = 'PENDING'`.
  2. The quotation cannot be dispatched to the client via WhatsApp or Email.
  3. A workflow transaction is submitted to `workflow-service`.
  4. Approver hierarchy:
     - **Stage 1 (15% - 25% discount):** Regional Sales Manager (ROLE approver).
     - **Stage 2 (> 25% discount):** Vice President of Sales + Financial Controller (PARALLEL approver).
  5. Upon full approval, the callback marks the quotation `APPROVED` and enables customer dispatch.

### 2.2 Use Case B: High-Value Commercial Quotation Approval
* **Trigger:** Quotation total monetary value exceeds company commercial threshold (e.g. > ₹25,00,000).
* **Behavior:** Requires commercial viability check, margin verification, and payment terms sign-off before official quotation PDF dispatch.

### 2.3 Use Case C: Customer Account Credit Onboarding Approval
* **Trigger:** Sales representative attempts to convert an active prospect into an ERP customer with an approved credit limit (e.g. credit limit requested: ₹10,00,000 with 60 days payment terms).
* **Behavior:**
  1. `crm_account` is submitted with `CUSTOMER_ONBOARDING` document type.
  2. Legal & Credit Risk team reviews GSTIN, audited financials, and bank references.
  3. On approval, `crm-service` triggers `POST /api/account/customers` to instantiate the customer in `account-main`.

### 2.4 Use Case D: Contested Lead Reassignment Approval
* **Trigger:** A sales representative requests transferring a high-value active lead from another sales representative.
* **Behavior:** Requires affirmative approval from the current lead owner's department manager.

---

## 3. End-to-End Integration Flow & Sequence Diagram

```
┌─────────────┐               ┌─────────────┐               ┌──────────────────┐
│  CRM UI     │               │ crm-service │               │ workflow-service │
└──────┬──────┘               └──────┬──────┘               └────────┬─────────┘
       │                             │                               │
       │ 1. Click "Submit Quote"     │                               │
       ├────────────────────────────>│                               │
       │                             │ 2. Evaluate threshold         │
       │                             │    discount > 15.00%          │
       │                             │ 3. Lock quote:                │
       │                             │    status = PENDING_APPROVAL  │
       │                             │                               │
       │                             │ 4. POST /api/v1/workflow/transactions
       │                             ├──────────────────────────────>│
       │                             │                               │ 5. Lookup Definition
       │                             │                               │    module: CRM, doc: QUOTATION
       │                             │                               │ 6. Create workflow_transaction
       │                             │                               │ 7. Create workflow_task (Manager)
       │                             │                               │ 8. Send In-App / Email alert
       │                             │ 9. Return 201 Created         │
       │                             │    { transactionId: "..." }   │
       │                             │<──────────────────────────────┤
       │                             │                               │
       │ 10. Render "Pending Review" │                               │
       │<────────────────────────────┤                               │
       │                             │                               │
       │                             │                               │ 11. Manager approves in UI
       │                             │                               │ 12. Complete Task
       │                             │                               │ 13. Next Stage or Finish
       │                             │                               │
       │                             │ 14. POST callback_url         │
       │                             │     { status: 'APPROVED' }    │
       │                             │<──────────────────────────────┤
       │                             │                               │
       │                             │ 15. Update crm_quotation:     │
       │                             │     approval_status = APPROVED│
       │                             │     status = APPROVED         │
       │                             │ 16. Publish Outbox Event      │
       │                             │ 17. Return 200 OK             │
       │                             ├──────────────────────────────>│
```

---

## 4. Technical Request & Response Contracts

### 4.1 Step 1: `crm-service` Initiates Workflow Transaction
* **Endpoint:** `POST /api/v1/workflow/transactions`
* **Target Service:** `workflow-service` (:8083)
* **Headers:**
  * `X-Company-Id: 4a2b9f10-7e3c-4b5a-901d-8f2c3d4e5f60`
  * `Authorization: Bearer <SERVICE_OR_USER_JWT>`
  * `Content-Type: application/json`
* **Payload:**
```json
{
  "companyId": "4a2b9f10-7e3c-4b5a-901d-8f2c3d4e5f60",
  "moduleName": "CRM",
  "documentType": "QUOTATION",
  "documentId": "c81d4a89-2fb0-4e3a-b892-36c1e57c1201",
  "documentNumber": "QT-2026-00452",
  "entityType": "QUOTATION",
  "entityId": "c81d4a89-2fb0-4e3a-b892-36c1e57c1201",
  "initiatedBy": "e91b431e-45a1-432d-9876-543210fedcba",
  "initiatedByName": "Rohit Verma",
  "callbackUrl": "http://crm-service:8086/api/crm/workflows/callback",
  "variables": {
    "totalAmount": 450000.00,
    "discountPercentage": 18.50,
    "discountAmount": 83250.00,
    "currency": "INR",
    "customerName": "Sharma Precision Tools Pvt Ltd",
    "paymentTerms": "30% advance, balance on dispatch",
    "salesRepName": "Rohit Verma"
  }
}
```

* **Response from `workflow-service` (201 Created):**
```json
{
  "success": true,
  "data": {
    "transactionId": "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
    "documentType": "QUOTATION",
    "documentId": "c81d4a89-2fb0-4e3a-b892-36c1e57c1201",
    "documentNumber": "QT-2026-00452",
    "status": "IN_PROGRESS",
    "currentStage": {
      "stageId": "stage-uuid-01",
      "stageName": "Sales Manager Approval",
      "stageOrder": 1,
      "executionType": "SEQUENTIAL"
    },
    "assignedTasks": [
      {
        "taskId": "task-uuid-001",
        "assignedUserId": "mgr-uuid-10",
        "assignedUserName": "Vikram Malhotra",
        "dueDate": "2026-11-14T18:30:00Z"
      }
    ]
  }
}
```

---

### 4.2 Step 2: `workflow-service` Delivers Callback Notification
Once all approval stages are resolved (or if rejected/returned), `workflow-service` invokes the registered `callbackUrl`:

* **Endpoint:** `POST http://crm-service:8086/api/crm/workflows/callback`
* **Headers:**
  * `X-Company-Id: 4a2b9f10-7e3c-4b5a-901d-8f2c3d4e5f60`
  * `X-Workflow-Signature: sha256=...` (HMAC validation)
  * `Content-Type: application/json`
* **Payload (Approval Event):**
```json
{
  "transactionId": "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
  "moduleName": "CRM",
  "documentType": "QUOTATION",
  "documentId": "c81d4a89-2fb0-4e3a-b892-36c1e57c1201",
  "documentNumber": "QT-2026-00452",
  "action": "APPROVE",
  "status": "APPROVED",
  "resolvedByUserId": "mgr-uuid-10",
  "resolvedByUserName": "Vikram Malhotra",
  "resolvedAt": "2026-11-12T11:45:00Z",
  "comments": "Approved special 18.5% strategic discount for key account."
}
```

* **Payload (Rejection Event):**
```json
{
  "transactionId": "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
  "moduleName": "CRM",
  "documentType": "QUOTATION",
  "documentId": "c81d4a89-2fb0-4e3a-b892-36c1e57c1201",
  "documentNumber": "QT-2026-00452",
  "action": "REJECT",
  "status": "REJECTED",
  "resolvedByUserId": "mgr-uuid-10",
  "resolvedByUserName": "Vikram Malhotra",
  "resolvedAt": "2026-11-12T11:45:00Z",
  "comments": "Margin too thin. Reduce discount to maximum 12% and re-submit."
}
```

* **Response from `crm-service` (200 OK):**
```json
{
  "received": true,
  "transactionId": "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
  "documentId": "c81d4a89-2fb0-4e3a-b892-36c1e57c1201",
  "updatedStatus": "APPROVED"
}
```

---

## 5. Resiliency, Idempotency & Fault Tolerance

1. **Callback Idempotency:**
   If network jitter causes `workflow-service` to re-deliver a callback webhook, `crm-service` checks `crm_quotation.approval_status`. If already `APPROVED`, it responds `200 OK` immediately without re-triggering side effects or duplicate notification events.
2. **Workflow Engine Failure Fallback:**
   If `workflow-service` is unreachable during submission, `crm-service` enqueues the transaction request in `crm_outbox` (`event_type = 'WORKFLOW_SUBMISSION_REQUESTED'`), ensuring automatic retry by the outbox scheduler once `workflow-service` recovers.
3. **Audit Trail Synchronization:**
   Approver comments and rejection reasons received via the callback are logged directly into `crm_activity` with `activity_type = 'WORKFLOW_EVENT'`, providing sales reps with full transparency directly within the CRM quotation timeline.

