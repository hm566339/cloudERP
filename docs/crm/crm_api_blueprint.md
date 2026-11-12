# Mark2 Cloud ERP: CRM REST API Specification & Blueprint

**Document Version:** 1.0.0  
**Base Path:** `/api/crm`  
**Gateway Prefix:** `/api/crm/**`  
**Target Service:** `crm-service` (:8086)  
**Security & Auth:** Bearer JWT (SSO) + Mandatory `X-Company-Id` Header  

---

## 1. Global Security, Headers, & Error Envelope

### 1.1 Standard Request Headers
All client and frontend requests routed via the API Gateway must include:
* `Authorization: Bearer <JWT_TOKEN>` (issued by `ERP_System` / SSO).
* `X-Company-Id: <UUID>` (identifies active tenant company context).
* `Content-Type: application/json`

### 1.2 Standard Success Response Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-11-12T10:00:00Z"
}
```

### 1.3 Standard Paginated Response Envelope
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 482,
    "totalPages": 25,
    "isLast": false
  },
  "timestamp": "2026-11-12T10:00:00Z"
}
```

---

## 2. Lead Management Endpoints (`/api/crm/leads`)

### 2.1 List Leads (Paginated & Filtered)
* **Method & Path:** `GET /api/crm/leads`
* **RBAC Permission:** `CRM_LEADS:READ`
* **Query Parameters:** `page`, `size`, `sort`, `statusId`, `stage`, `ownerId`, `sourceId`, `search`, `scoreMin`, `fromDate`, `toDate`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "e81d4a89-2fb0-4e3a-b892-36c1e57c1201",
      "leadCode": "LD-2026-00389",
      "displayName": "Rajesh Sharma",
      "organizationName": "Sharma Precision Tools Pvt Ltd",
      "designation": "General Manager Procurement",
      "email": "rajesh@sharmatools.com",
      "phone": "+91 98220 12345",
      "state": "Maharashtra",
      "stateCode": "27",
      "gstin": "27AABCS1429B1Z2",
      "leadStatus": { "id": "uuid", "name": "Contacted", "colorCode": "#3B82F6" },
      "leadSource": { "id": "uuid", "name": "IndiaMART Portal" },
      "leadScore": 85,
      "scoreGrade": "HOT",
      "owner": { "id": "uuid", "username": "rohit.sales", "displayName": "Rohit Verma" },
      "nextFollowUpDate": "2026-11-14T11:00:00Z",
      "createdAt": "2026-11-12T08:30:00Z"
    }
  ],
  "pagination": { "page": 0, "size": 20, "totalElements": 1, "totalPages": 1 }
}
```

### 2.2 Create Lead (Manual Entry)
* **Method & Path:** `POST /api/crm/leads`
* **RBAC Permission:** `CRM_LEADS:CREATE`
* **Request Body:**
```json
{
  "firstName": "Amit",
  "lastName": "Patel",
  "organizationName": "Gujarat Steel Works",
  "email": "amit@gujaratsteel.in",
  "phone": "+91 94260 98765",
  "designation": "Director",
  "leadSourceId": "b1a7d652-...",
  "gstin": "24AAACG1234A1Z5",
  "state": "Gujarat",
  "stateCode": "24",
  "inquiredProducts": [
    { "productName": "Industrial Fasteners M12", "quantity": 5000, "budget": 150000 }
  ],
  "notes": "Met at Engineering Expo 2026",
  "ownerUserId": "uuid"
}
```
* **Response (201 Created):** Created lead object with generated `leadCode` and initial score.

### 2.3 Get Lead Details by ID
* **Method & Path:** `GET /api/crm/leads/{id}`
* **RBAC Permission:** `CRM_LEADS:READ`
* **Response (200 OK):** Full lead details including product interests, custom fields, tags, and latest 5 activities.

### 2.4 Update Lead Details
* **Method & Path:** `PUT /api/crm/leads/{id}`
* **RBAC Permission:** `CRM_LEADS:WRITE`
* **Request Body:** Partial or complete lead properties.

### 2.5 Update Lead Status
* **Method & Path:** `PATCH /api/crm/leads/{id}/status`
* **RBAC Permission:** `CRM_LEADS:WRITE`
* **Request Body:**
```json
{
  "statusId": "c3e9821a-...",
  "reasonId": "uuid-optional",
  "notes": "Qualified for demonstration stage"
}
```

### 2.6 Reassign Lead Ownership
* **Method & Path:** `POST /api/crm/leads/{id}/assign`
* **RBAC Permission:** `CRM_LEADS:ASSIGN`
* **Request Body:**
```json
{
  "targetUserId": "f29b431e-...",
  "reason": "Territory realignment to West Zone"
}
```

### 2.7 Merge Duplicate Leads
* **Method & Path:** `POST /api/crm/leads/merge`
* **RBAC Permission:** `CRM_LEADS:MERGE`
* **Request Body:**
```json
{
  "primaryLeadId": "e81d4a89-...",
  "duplicateLeadIds": ["a7c14d92-..."],
  "mergeReason": "Duplicate inquiry received from IndiaMART and Website"
}
```

### 2.8 Convert Lead to Account, Contact & Opportunity
* **Method & Path:** `POST /api/crm/leads/{id}/convert`
* **RBAC Permission:** `CRM_LEADS:CONVERT`
* **Request Body:**
```json
{
  "createAccount": true,
  "accountName": "Sharma Precision Tools Pvt Ltd",
  "createOpportunity": true,
  "opportunityName": "5000 Units Fasteners Deal",
  "pipelineId": "uuid",
  "stageId": "uuid",
  "dealValue": 250000.00,
  "expectedCloseDate": "2026-12-15"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "leadId": "e81d4a89-...",
    "accountId": "7c12f45a-...",
    "contactId": "1b9a82cd-...",
    "opportunityId": "4a71de99-..."
  }
}
```

---

## 3. Lead Ingestion & Webhook Endpoints (`/api/crm/integrations`)

### 3.1 Public Inbound Webhook Listener (Unauthenticated, Secured by Slug + Signature)
* **Method & Path:** `POST /api/crm/integrations/webhook/{slug}`
* **Security:** Public endpoint validated against `tenant_integration.webhook_secret_hash` and SHA-256 idempotency.
* **Headers:** Provider-specific signature (e.g. `X-Hub-Signature-256`, `X-IndiaMart-Token`).
* **Request Body:** Raw JSON/XML payload from IndiaMART, TradeIndia, Meta, Google, or Exotel.
* **Response (200 OK):**
```json
{
  "status": "ACCEPTED",
  "idempotencyHash": "a1b2c3d4...",
  "processingStatus": "RECEIVED"
}
```

### 3.2 Trigger Manual Pull Sync for Polling Channels
* **Method & Path:** `POST /api/crm/integrations/{id}/sync`
* **RBAC Permission:** `CRM_INTEGRATIONS:EXECUTE`
* **Response (200 OK):** `{ "syncStatus": "TRIGGERED", "queuedRecords": 14 }`

### 3.3 List Integration Channels & Connection Health
* **Method & Path:** `GET /api/crm/integrations`
* **RBAC Permission:** `CRM_INTEGRATIONS:READ`
* **Response (200 OK):** List of all active marketplace connections with `lastSyncAt`, `syncStatus`, and `errorCount`.

### 3.4 Upload CSV Batch for Lead Import
* **Method & Path:** `POST /api/crm/leads/import`
* **RBAC Permission:** `CRM_LEADS:IMPORT`
* **Content-Type:** `multipart/form-data` (file) + JSON column mapping.

---

## 4. Accounts & Contacts Endpoints (`/api/crm/accounts`, `/api/crm/contacts`)

### 4.1 Search Accounts (with GSTIN / Name autocomplete)
* **Method & Path:** `GET /api/crm/accounts?search=Tata`
* **RBAC Permission:** `CRM_ACCOUNTS:READ`

### 4.2 Create B2B Account
* **Method & Path:** `POST /api/crm/accounts`
* **RBAC Permission:** `CRM_ACCOUNTS:CREATE`
* **Request Body:**
```json
{
  "accountName": "Bharat Heavy Electricals Ltd",
  "accountType": "CUSTOMER",
  "gstin": "07AAACB0000A1Z1",
  "pan": "AAACB0000A",
  "industry": "Power & Energy",
  "businessType": "PUBLIC_LTD",
  "tier": "TIER_1",
  "billingAddress": {
    "addressLine1": "BHEL House, Siri Fort",
    "city": "New Delhi",
    "state": "Delhi",
    "stateCode": "07",
    "postalCode": "110049",
    "country": "India"
  }
}
```

### 4.3 Onboard CRM Account into ERP Customer (`account-main`)
* **Method & Path:** `POST /api/crm/accounts/{id}/onboard-erp`
* **RBAC Permission:** `CRM_ACCOUNTS:ONBOARD`
* **Response (200 OK):** Synchronizes account with `account-main.customer` and returns created `account_main_customer_id`.

---

## 5. Sales Pipeline & Opportunity Endpoints (`/api/crm/opportunities`)

### 5.1 Pipeline Kanban View
* **Method & Path:** `GET /api/crm/opportunities/kanban?pipelineId={id}`
* **RBAC Permission:** `CRM_OPPORTUNITIES:READ`
* **Response (200 OK):**
```json
{
  "pipelineId": "uuid",
  "pipelineName": "Domestic Sales",
  "stages": [
    {
      "stageId": "uuid",
      "stageName": "Proposal Submitted",
      "winProbabilityPct": 40,
      "totalValue": 1850000.00,
      "deals": [
        {
          "id": "uuid",
          "opportunityCode": "OPP-2026-00912",
          "opportunityName": "Supply 500kVA Transformers",
          "accountName": "Adani Power Ltd",
          "dealValue": 1200000.00,
          "weightedValue": 480000.00,
          "expectedCloseDate": "2026-11-30",
          "isRotting": false
        }
      ]
    }
  ]
}
```

### 5.2 Move Opportunity Stage (Drag & Drop in Kanban)
* **Method & Path:** `PATCH /api/crm/opportunities/{id}/stage`
* **RBAC Permission:** `CRM_OPPORTUNITIES:WRITE`
* **Request Body:**
```json
{
  "targetStageId": "uuid",
  "reason": "Customer agreed to pricing proposal"
}
```

### 5.3 Mark Opportunity Closed Won / Lost
* **Method & Path:** `POST /api/crm/opportunities/{id}/close`
* **RBAC Permission:** `CRM_OPPORTUNITIES:WRITE`
* **Request Body:**
```json
{
  "status": "WON",
  "winNotes": "Signed 3-year supply contract"
}
```

---

## 6. Activity & Task Endpoints (`/api/crm/tasks`, `/api/crm/activities`)

### 6.1 Schedule Follow-up Task / Call / Meeting
* **Method & Path:** `POST /api/crm/tasks`
* **RBAC Permission:** `CRM_TASKS:CREATE`
* **Request Body:**
```json
{
  "entityType": "OPPORTUNITY",
  "entityId": "4a71de99-...",
  "taskType": "DEMO",
  "title": "On-site Product Demo with Engineering Team",
  "dueDate": "2026-11-16",
  "dueTime": "14:30:00",
  "priority": "HIGH",
  "assignedToUserId": "uuid",
  "reminderAt": "2026-11-16T13:30:00Z"
}
```

### 6.2 Get Unified Activity Timeline for Any Entity
* **Method & Path:** `GET /api/crm/activities?entityType=LEAD&entityId={id}`
* **RBAC Permission:** `CRM_ACTIVITIES:READ`

---

## 7. Omnichannel Communication Endpoints (`/api/crm/communication`)

### 7.1 Send WhatsApp Message (Template or Freeform)
* **Method & Path:** `POST /api/crm/communication/whatsapp/send`
* **RBAC Permission:** `CRM_COMMUNICATION:SEND`
* **Request Body:**
```json
{
  "entityType": "LEAD",
  "entityId": "e81d4a89-...",
  "recipientPhone": "+919822012345",
  "templateCode": "quotation_dispatched_v1",
  "templateParameters": {
    "customer_name": "Rajesh Sharma",
    "quote_number": "QT-2026-00452",
    "download_link": "https://erp.mark2.in/q/qt-452"
  }
}
```

### 7.2 Ingest Cloud Telephony Call CDR (Exotel / Ozonetel Webhook)
* **Method & Path:** `POST /api/crm/communication/telephony/cdr`
* **Security:** Provider authentication token.
* **Request Body:** Caller, agent number, duration, call status, recording URL.

---

## 8. Quotation & Sales Operations Endpoints (`/api/crm/quotations`)

### 8.1 Create Quotation with Multi-Line GST
* **Method & Path:** `POST /api/crm/quotations`
* **RBAC Permission:** `CRM_QUOTATIONS:CREATE`
* **Request Body:**
```json
{
  "opportunityId": "4a71de99-...",
  "accountId": "7c12f45a-...",
  "contactId": "1b9a82cd-...",
  "quotationDate": "2026-11-12",
  "validUntil": "2026-12-12",
  "placeOfSupplyStateCode": "27",
  "discountType": "PERCENTAGE",
  "discountPct": 18.00,
  "items": [
    {
      "productId": "inv-uuid",
      "productCode": "P-1002",
      "productName": "Industrial Pump 10HP",
      "hsnSacCode": "84137010",
      "quantity": 2,
      "unitPrice": 45000.00,
      "discountPct": 18.00,
      "cgstRate": 9.00,
      "sgstRate": 9.00
    }
  ],
  "paymentTerms": "30% advance, balance on dispatch"
}
```

### 8.2 Submit Quotation for Workflow Approval
* **Method & Path:** `POST /api/crm/quotations/{id}/submit-approval`
* **RBAC Permission:** `CRM_QUOTATIONS:SUBMIT_APPROVAL`
* **Description:** Initiates a transaction in `workflow-service` if discount > 15% or total amount > threshold.

### 8.3 Workflow Service Webhook Callback Receiver
* **Method & Path:** `POST /api/crm/workflows/callback`
* **Security:** HMAC Shared Secret or Internal Service Header (`X-Internal-Service: workflow-service`).
* **Request Body:**
```json
{
  "transactionId": "wf-txn-uuid",
  "documentType": "QUOTATION",
  "documentId": "quote-uuid",
  "action": "APPROVE",
  "status": "APPROVED",
  "approverUserId": "mgr-uuid",
  "comments": "Approved 18% special discount for strategic account"
}
```
* **Response (200 OK):** Updates `crm_quotation.status = 'APPROVED'` and allows quotation dispatch to customer.

### 8.4 Convert Accepted Quotation to ERP Sales Order (`account-main`)
* **Method & Path:** `POST /api/crm/quotations/{id}/convert-to-sales-order`
* **RBAC Permission:** `CRM_QUOTATIONS:CONVERT_ORDER`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quotationId": "quote-uuid",
    "salesOrderId": "so-uuid",
    "salesOrderNumber": "SO-2026-00088",
    "status": "CONVERTED_TO_ORDER"
  }
}
```

---

## 9. Automation Engine Endpoints (`/api/crm/automation`)

### 9.1 List / Create Automation Rules
* **Method & Path:** `GET /api/crm/automation/rules` | `POST /api/crm/automation/rules`
* **RBAC Permission:** `CRM_AUTOMATION:MANAGE`

### 9.2 Configure Round-Robin Pools
* **Method & Path:** `GET /api/crm/automation/round-robin-pools` | `POST /api/crm/automation/round-robin-pools`
* **RBAC Permission:** `CRM_AUTOMATION:MANAGE`

