# API Contract — CloudERP Multi-Service Platform

> **Architecture**: Spring Boot Microservices behind Spring Cloud Gateway (`/api/*`)  
> **Services**:
> - SSO / Auth Service: Base path `/api/sso` (Port 8090)
> - Account / Financials Service: Base path `/api/account` (Port 8081)
> - Inventory Service: Base path `/api/inventory` (Port 8082)
> - Workflow Service: Base path `/api/v1/workflow` (Port 8083)
> - Communication Service: Base path `/api/communication` (Port 8084)
>
> **Standard Response Envelope (All Services)**:
> ```json
> {
>   "success": true,
>   "message": "Operation completed successfully",
>   "data": <T>,
>   "status": 200
> }
> ```
>
> **Standard Error Envelope**:
> ```json
> {
>   "success": false,
>   "message": "Human-readable error description",
>   "status": 400,
>   "data": { "field": "fieldName", "code": "VALIDATION_ERROR" },
>   "errors": [ ... ]
> }
> ```
>
> **Token & Cookie Contract**:
> - Access Token Cookie: `ACCESS_TOKEN` (httpOnly=false for login/refresh, httpOnly=true for admin-login; maxAge derived from JWT expiry)
> - Refresh Token Cookie: `ACCESS_TOKEN_REFRESH` (httpOnly=false for login/refresh, httpOnly=true for admin-login; maxAge derived from JWT expiry)
> - Compatibility Cookie: `auth_token` (httpOnly=false, mirror of ACCESS_TOKEN)
> - Authorization Header: `Authorization: Bearer <token>` accepted across all services
> - Tenant Scoping Header: `X-Company-Id: <uuid>` injected on gateway requests

---

## 1. Authentication & Session Flow (SSO Service: `/api/sso`)

### 1.1 Organization Signup
- **Method & Path**: `POST /api/sso/signup`
- **Auth Required**: No (Public)
- **Request Headers**: `Content-Type: application/json`
- **Request Body** (Unwrapped object):
  ```json
  {
    "organizationName": "string (required, 2-100 chars)",
    "email": "string (required, valid email)",
    "password": "string (required, 8-50 chars, min 1 upper, 1 lower, 1 digit, 1 special)",
    "fullName": "string (optional)",
    "phone": "string (optional)"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Organization created successfully",
    "data": {
      "organizationId": "UUID",
      "organizationCode": "string",
      "organizationName": "string",
      "companyId": "UUID",
      "companyCode": "string"
    }
  }
  ```

### 1.2 Organization Lookup
- **Method & Path**: `GET /api/sso/organization/{organizationCode}`
- **Auth Required**: No
- **Path Params**: `organizationCode` (string, required)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "UUID",
      "code": "string",
      "name": "string",
      "status": "ACTIVE|INACTIVE",
      "companies": [
        { "id": "UUID", "code": "string", "name": "string" }
      ]
    }
  }
  ```

### 1.3 User Login
- **Method & Path**: `POST /api/sso/auth/login`
- **Auth Required**: No
- **Request Body** (Wrapped in `{ data: ... }`):
  ```json
  {
    "data": {
      "email": "string (required)",
      "password": "string (required)",
      "organizationCode": "string (optional)",
      "companyId": "UUID (optional)"
    }
  }
  ```
- **Response (200 OK)**:
  - Headers: `Set-Cookie` with `ACCESS_TOKEN`, `ACCESS_TOKEN_REFRESH`, `auth_token`
  - Body:
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "string|null",
        "refreshToken": "string|null",
        "user": {
          "id": "UUID",
          "username": "string",
          "email": "string",
          "fullName": "string",
          "empId": "string",
          "role": "string",
          "companyId": "UUID",
          "companyCode": "string"
        },
        "companies": [
          { "id": "UUID", "code": "string", "name": "string" }
        ],
        "organization": { "id": "UUID", "code": "string", "name": "string" }
      }
    }
    ```

### 1.4 Company Switch / Selection
- **Method & Path**: `POST /api/sso/auth/select-company`
- **Auth Required**: Yes (Bearer or cookie)
- **Request Body**:
  ```json
  {
    "data": {
      "organizationCode": "string (required)",
      "companyId": "UUID (required)"
    }
  }
  ```
- **Response (200 OK)**: Refreshed cookies + LoginResponse body with switched company context.

### 1.5 Canonical Shell Identity & Entitlements (SSO Me)
- **Method & Path**: `GET /api/sso/auth/me`
- **Auth Required**: Yes (`Authorization: Bearer <token>` or `ACCESS_TOKEN` cookie)
- **Query Params**: `companyId` (UUID, optional — switches active company evaluation)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "UUID",
        "username": "string",
        "email": "string",
        "fullName": "string",
        "empId": "string",
        "role": "string",
        "companyId": "UUID",
        "companyCode": "string",
        "accountStatus": "ACTIVE|INACTIVE",
        "emailStatus": "VERIFIED|UNVERIFIED"
      },
      "organization": { "id": "UUID", "code": "string", "name": "string", "status": "string" },
      "currentCompany": { "id": "UUID", "code": "string", "name": "string", "legalName": "string", "active": true },
      "companies": [
        { "id": "UUID", "code": "string", "name": "string", "active": true }
      ],
      "membership": {
        "memberId": "UUID",
        "memberType": "OWNER|MEMBER",
        "membershipStatus": "ACTIVE"
      },
      "subscription": {
        "id": "UUID",
        "planCode": "string",
        "status": "ACTIVE|TRIAL|EXPIRED",
        "accessMode": "FULL|READ_ONLY|BLOCKED",
        "trialing": true,
        "daysRemaining": 30,
        "trialEndsAt": "ISO-8601 string"
      },
      "accessMode": "FULL|READ_ONLY|BLOCKED",
      "modules": [
        { "id": "UUID", "name": "string", "code": "string", "canonical": "ACCOUNT|INVENTORY|CRM|WORKFLOW", "active": true }
      ],
      "features": [
        { "featureCode": "string", "featureName": "string", "moduleName": "string", "active": true }
      ],
      "permissions": [
        { "permissionCode": "string", "featureCode": "string", "action": "CREATE|READ|UPDATE|DELETE|APPROVE|PRINT|EXPORT", "moduleName": "string", "allowed": true }
      ]
    }
  }
  ```

### 1.6 Token Refresh
- **Method & Path**: `POST /api/sso/token/refresh`
- **Auth Required**: No (passes refresh token in body or cookies)
- **Request Body**: `{ "data": { "refreshToken": "string" } }` or raw `{ "refreshToken": "string" }`
- **Cookies Accepted**: `ACCESS_TOKEN_REFRESH`, `refresh_token`, `refreshToken`
- **Response (200 OK)**:
  - Cookies: Set new `ACCESS_TOKEN`, `ACCESS_TOKEN_REFRESH`, `auth_token`
  - Body: `{ "success": true, "data": { "accessToken": "string", "refreshToken": "string" } }`

### 1.7 Logout
- **Method & Path**: `POST /api/sso/auth/logout`
- **Auth Required**: Optional (extracts token if present to revoke server session)
- **Side Effects**: Clears 6 cookies (`ACCESS_TOKEN`, `ACCESS_TOKEN_REFRESH`, `auth_token`, `SSO_SESSION`, `access_token`, `refresh_token`) with `maxAge=0`.

---

## 2. Subscription, Billing & Plans (`/api/sso`)

### 2.1 Checkout (Razorpay)
- **Method & Path**: `POST /api/sso/subscriptions/{organizationId}/checkout`
- **Auth Required**: Yes (`OWNER` or `SYSTEM_ADMIN`)
- **Path Params**: `organizationId` (UUID, required)
- **Request Body**:
  ```json
  {
    "planId": "UUID (required)",
    "billingCycle": "MONTHLY|ANNUAL (required)",
    "successUrl": "string (optional)",
    "cancelUrl": "string (optional)"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "orderId": "string",
      "amount": 499900,
      "currency": "INR",
      "keyId": "string",
      "organizationName": "string"
    }
  }
  ```

### 2.2 Verify Payment & Activate
- **Method & Path**: `POST /api/sso/subscriptions/{organizationId}/verify-payment`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "razorpayOrderId": "string (required)",
    "razorpayPaymentId": "string (required)",
    "razorpaySignature": "string (required)",
    "planId": "UUID (required)"
  }
  ```
- **Response (200 OK)**: `{ "success": true, "data": <Subscription> }`

### 2.3 Cancel Subscription
- **Method & Path**: `POST /api/sso/subscriptions/{subscriptionId}/cancel`
- **Auth Required**: Yes (`OWNER`)

### 2.4 Activate Trial
- **Method & Path**: `POST /api/sso/subscriptions/{organizationId}/activate-trial`
- **Request Body**: `{ "planId": "UUID" }`

### 2.5 Subscription Plans Management
- `GET /api/sso/subscription-plans?active=true&search=...` (Public / Member)
- `GET /api/sso/subscription-plans/{id}`
- `GET /api/sso/subscription-plans/code/{code}`
- `POST /api/sso/subscription-plans` (`SYSTEM_ADMIN`, body: `{ data: SubscriptionPlanRequest }`)
- `PUT /api/sso/subscription-plans/{id}` (`SYSTEM_ADMIN`)
- `PATCH /api/sso/subscription-plans/{id}/status?active=true|false` (`SYSTEM_ADMIN`)
- `PUT /api/sso/subscription-plans/{id}/modules` (`SYSTEM_ADMIN`, body: `{ data: { moduleIds: [UUID] } }`)
- `DELETE /api/sso/subscription-plans/{id}` (`SYSTEM_ADMIN`)

---

## 3. Organization, Company, User, Role & Permissions (`/api/sso`)

### 3.1 Company Management
- `POST /api/sso/company` (Multipart: `request` JSON Part, `logo` File Part, Auth Header required)
- `PUT /api/sso/company/{id}` (Multipart: `request` JSON Part, `logo` File Part)
- `GET /api/sso/company` (Params: `page` (default 1), `pageSize` (default 10), `search`, `active`)
- `GET /api/sso/company/{id}`
- `GET /api/sso/company/code/{companyCode}`
- `PATCH /api/sso/company/{id}/status?active=true|false`
- `DELETE /api/sso/company/{id}`
- `GET /api/sso/company/open` (Public)

### 3.2 User Management
- `POST /api/sso/user?companyId={uuid}&module={uuid}` (Body: `{ data: CreateUserByAdmin }`)
- `GET /api/sso/user/{id}`
- `GET /api/sso/user/company/{companyId}?page=0&pageSize=10&search=&status=&role=`
- `PUT /api/sso/user/{id}` (Body: `{ data: UpdateUserRequest }`)
- `DELETE /api/sso/user/{id}`
- `POST /api/sso/user/{id}/role` (Body: `{ data: { roleId: "UUID" } }`)
- `DELETE /api/sso/user/{id}/role/{roleId}`
- `PATCH /api/sso/user/{id}/status?status=ACTIVE|INACTIVE`

### 3.3 Role & Permission Management
- `GET /api/sso/role?companyId={uuid}&page=0&pageSize=200&search=&status=`
- `POST /api/sso/role?companyId={uuid}` (Body: `{ data: { name: "string", description: "string" } }`)
- `GET /api/sso/role/{id}`
- `PUT /api/sso/role/{id}`
- `DELETE /api/sso/role/{id}`
- `POST /api/sso/permission/assign-to-role` (Body: `{ data: { roleId: "UUID", permissionIds: ["UUID"] } }`)
- `GET /api/sso/permission/role/{roleId}`

---

## 4. Account & Financials Service (`/api/account`)

### 4.1 Master Data Endpoints
- **Chart of Accounts**: `GET|POST /api/account/chart-of-accounts`, `GET|PUT|DELETE /api/account/chart-of-accounts/{id}`
- **Account Groups**: `GET|POST /api/account/account-groups`, `GET|PUT|DELETE /api/account/account-groups/{id}`
- **Account Categories**: `GET|POST /api/account/account-categories`, `GET|PUT|DELETE /api/account/account-categories/{id}`
- **Fiscal Years**: `GET|POST /api/account/fiscal-years`, `GET|PUT|DELETE /api/account/fiscal-years/{id}`, `PATCH /api/account/fiscal-years/{id}/close`
- **Accounting Periods**: `GET|POST /api/account/accounting-periods`, `GET|PUT|DELETE /api/account/accounting-periods/{id}`, `PATCH /api/account/accounting-periods/{id}/status`
- **Bank Accounts**: `GET|POST /api/account/bank-accounts`, `GET|PUT|DELETE /api/account/bank-accounts/{id}`
- **Customers**: `GET|POST /api/account/customers`, `GET|PUT|DELETE /api/account/customers/{id}`
- **Vendors**: `GET|POST /api/account/vendors`, `GET|PUT|DELETE /api/account/vendors/{id}`

### 4.2 Invoices & Transactions
- **Sales Invoices**:
  - `GET /api/account/sales-invoices?page=0&size=10&sortOrder=desc&search=&status=`
  - `POST /api/account/sales-invoices` (Body: `{ customerId, invoiceDate, dueDate, items: [...], totalAmount }`)
  - `GET /api/account/sales-invoices/{id}`
  - `PUT /api/account/sales-invoices/{id}`
  - `POST /api/account/sales-invoices/{id}/post`
  - `POST /api/account/sales-invoices/{id}/cancel`
- **AP Invoices (Purchase Invoices)**:
  - `GET /api/account/ap-invoices?page=0&size=10`
  - `POST /api/account/ap-invoices`
  - `GET /api/account/ap-invoices/{id}`
  - `POST /api/account/ap-invoices/{id}/post`
- **Payment Vouchers**:
  - `GET /api/account/payment-vouchers?page=0&size=10`
  - `POST /api/account/payment-vouchers`
  - `GET /api/account/payment-vouchers/{id}`
  - `POST /api/account/payment-vouchers/{id}/post`
- **Receipt Vouchers**:
  - `GET /api/account/receipt-vouchers?page=0&size=10`
  - `POST /api/account/receipt-vouchers`
  - `GET /api/account/receipt-vouchers/{id}`
  - `POST /api/account/receipt-vouchers/{id}/post`
- **Credit & Debit Notes**:
  - `GET|POST /api/account/credit-notes`, `GET /api/account/credit-notes/{id}`, `POST /api/account/credit-notes/{id}/post`
  - `GET|POST /api/account/debit-notes`, `GET /api/account/debit-notes/{id}`, `POST /api/account/debit-notes/{id}/post`
- **GL Journals**:
  - `GET|POST /api/account/gl-journals`, `GET /api/account/gl-journals/{id}`, `POST /api/account/gl-journals/{id}/post`, `POST /api/account/gl-journals/{id}/reverse`

### 4.3 Procurement & Sales Documents
- Quotations: `GET|POST /api/account/quotations`, `GET|PUT /api/account/quotations/{id}`
- RFQs: `GET|POST /api/account/rfqs`, `GET /api/account/rfqs/{id}`
- Supplier Quotations: `GET|POST /api/account/supplier-quotations`, `GET /api/account/supplier-quotations/{id}`
- Purchase Requisitions: `GET|POST /api/account/purchase-requisitions`, `GET /api/account/purchase-requisitions/{id}`
- Purchase Orders: `GET|POST /api/account/purchase-orders`, `GET /api/account/purchase-orders/{id}`
- Goods Receipts (GRN): `GET|POST /api/account/goods-receipts`, `GET /api/account/goods-receipts/{id}`
- Delivery Challans: `GET|POST /api/account/delivery-challans`, `GET /api/account/delivery-challans/{id}`

### 4.4 Financial & GST Reports
- General Ledger: `GET /api/account/reports/general-ledger?accountId=&startDate=&endDate=`
- Balance Sheet: `GET /api/account/reports/balance-sheet?asOfDate=`
- Profit & Loss: `GET /api/account/reports/profit-loss?startDate=&endDate=`
- Trial Balance: `GET /api/account/reports/trial-balance?asOfDate=`
- Cash Flow: `GET /api/account/reports/cash-flow?startDate=&endDate=`
- GST Slabs & Reports: `GET /api/account/gst-slabs`, `GET /api/account/reports/gst/gstr1`, `GET /api/account/reports/gst/gstr3b`

---

## 5. Inventory Service (`/api/inventory`)

- **Products**: `GET|POST /api/inventory/products`, `GET|PUT|DELETE /api/inventory/products/{id}`
- **Product Categories**: `GET|POST /api/inventory/product-categories`
- **Product UOMs**: `GET|POST /api/inventory/product-uoms`
- **Product Prices**: `GET|POST /api/inventory/product-prices`
- **Warehouses**: `GET|POST /api/inventory/warehouses`, `GET|PUT /api/inventory/warehouses/{id}`
- **Warehouse Locations**: `GET|POST /api/inventory/warehouse-locations`, `GET /api/inventory/warehouse-locations/warehouse/{warehouseId}`
- **Stocks**: `GET /api/inventory/inventory-stocks`, `GET /api/inventory/inventory-stocks/product/{productId}`
- **Stock Movements**: `GET|POST /api/inventory/stock-movements`
- **Stock Adjustments**: `GET|POST /api/inventory/stock-adjustments`
- **Stock Transfers**: `GET|POST /api/inventory/stock-transfers`
- **Stock Reservations**: `GET|POST /api/inventory/stock-reservations`
- **Product Batches**: `GET|POST /api/inventory/product-batches`
- **Product Serials**: `GET|POST /api/inventory/product-serials`
- **Valuation**: `GET /api/inventory/inventory-valuations`

---

## 6. Workflow & Approvals Service (`/api/v1/workflow`)

- **Workflow Definitions**:
  - `GET /api/v1/workflow/definitions?page=0&size=20&active=`
  - `GET /api/v1/workflow/definitions/{id}`
  - `GET /api/v1/workflow/definitions/active?moduleCode=`
  - `POST /api/v1/workflow/definitions` (Body: `{ data: { name, moduleCode, stages: [...] } }`)
  - `PATCH /api/v1/workflow/definitions/{id}/activate`
  - `PATCH /api/v1/workflow/definitions/{id}/deactivate`
- **Workflow Tasks**:
  - `GET /api/v1/workflow/tasks?page=0&size=20&status=PENDING`
  - `GET /api/v1/workflow/tasks/{id}`
  - `POST /api/v1/workflow/tasks/{id}/approve` (Body: `{ comments: "string" }`)
  - `POST /api/v1/workflow/tasks/{id}/reject` (Body: `{ comments: "string" }`)
- **Workflow Transactions & Audit**:
  - `GET /api/v1/workflow/transactions?transactionId=`
  - `POST /api/v1/workflow/attachments` (Multipart: file, taskId)

---

## 7. Multi-Tenancy & Query Param Scoping Rules

1. **Global Endpoints** (`/api/sso/*`):
   - Never inject `companyId` query param except when explicitly requesting company-specific access (e.g. `/api/sso/role?companyId=...`).
2. **Business Endpoints** (`/api/account/*`, `/api/inventory/*`):
   - For `OWNER` / `SYSTEM_ADMIN`: Both `companyId` query param AND `X-Company-Id` header are injected.
   - For standard tenant users (`ACCOUNTANT`, `FINANCE_MANAGER`, etc.): Backend derives company tenancy securely from JWT claims; `companyId` query param is stripped to prevent 400 parameter errors, and `X-Company-Id` header is passed.
3. **Gateway Ingress**:
   - `X-Forwarded-Prefix: /api` passed by reverse proxy.
   - CORS origin must match `localhost:3000`, `localhost:3001`, or configured domain.

---

## 8. Detailed List Endpoints Contract (Pagination, Filters, Sort & Search)

### 8.1 SSO List Endpoints (`/api/sso`)

| Endpoint | Pagination Params | Max Limit | Default Sort | Sortable Fields | Search Param & Fields | Supported Filters | Response Envelope & Key |
|---|---|---|---|---|---|---|---|
| `GET /api/sso/company` | `page` (1-based), `pageSize` (default 10) | 100 | `name,asc` | `name`, `code`, `createdAt` | `search` (name, code, email) | `active` (boolean) | `{ success, data: { companies: [...], pagination: { page, pageSize, total, totalPages } } }` |
| `GET /api/sso/user/company/{companyId}` | `page` (0-based), `pageSize` (default 10) | 100 | `username,asc` | `username`, `email`, `role`, `createdAt` | `search` (username, email, fullName) | `status` (ACTIVE, INACTIVE), `role` (role name) | `{ success, data: { users: [...], pagination: { page, pageSize, total, totalPages } } }` |
| `GET /api/sso/role` | `page` (0-based), `pageSize` (default 200) | 500 | `name,asc` | `name`, `id` | `search` (name, description) | `status` (ACTIVE, INACTIVE), `companyId` (UUID) | `{ success, data: { roles: [...] } }` |
| `GET /api/sso/admin/organizations` | `page` (0-based), `size` (default 10) | 100 | `createdAt,desc` | `name`, `code`, `status`, `createdAt` | `search` (name, code) | `status` (ACTIVE, SUSPENDED), `accessMode` (FULL, READ_ONLY) | `{ success, data: { content: [...], totalElements, totalPages, number, size } }` |
| `GET /api/sso/admin/audit-logs` | `page` (0-based), `size` (default 20) | 200 | `timestamp,desc` | `timestamp`, `action` | `search` (action, actor, details) | `action` (string), `actor` (string), `startDate`, `endDate` | Spring `Page<AuditLog>` |
| `GET /api/sso/subscription-plans` | None (Unpaginated / full catalog) | N/A | `price,asc` | `name`, `price`, `code` | `search` (name, code) | `active` (boolean) | `{ success, data: [...] }` |

### 8.2 Account & Financials List Endpoints (`/api/account`)

| Endpoint | Pagination Params | Max Limit | Default Sort | Sortable Fields | Search Param & Fields | Supported Filters | Response Envelope & Key |
|---|---|---|---|---|---|---|---|
| `GET /api/account/customers` | `page` (0-based), `size` (default 10) | 100 | `name,asc` | `name`, `code`, `createdAt` | `searchKey` / `search` (name, code, gstin, phone) | `status` (ACTIVE, INACTIVE) | Spring `Page<Customer>` in `data` |
| `GET /api/account/vendors` | `page` (0-based), `size` (default 10) | 100 | `name,asc` | `name`, `code`, `createdAt` | `searchKey` / `search` (name, code, gstin, phone) | `status` (ACTIVE, INACTIVE) | Spring `Page<Vendor>` in `data` |
| `GET /api/account/chart-of-accounts` | `page` (0-based), `size` (default 50) | 200 | `accountCode,asc` | `accountCode`, `accountName` | `searchKey` (accountCode, accountName) | `accountType` (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE), `isActive` (boolean) | Spring `Page<ChartOfAccount>` in `data` |
| `GET /api/account/bank-accounts` | `page` (0-based), `size` (default 10) | 100 | `accountName,asc` | `accountName`, `accountNumber` | `search` (accountName, bankName) | `accountName`, `bankName`, `isActive` (boolean) | Spring `Page<BankAccount>` in `data` |
| `GET /api/account/bank-transactions` | `page` (0-based), `size` (default 20) | 200 | `transactionDate,desc`| `transactionDate`, `amount` | `search` (referenceNumber, description) | `bankAccountId` (UUID), `startDate`, `endDate`, `status` | Spring `Page<BankTransaction>` in `data` |
| `GET /api/account/sales-invoices` | `page` (0-based), `size` (default 10) | 100 | `invoiceDate,desc` | `invoiceDate`, `invoiceNumber`, `totalAmount` | `search` (invoiceNumber, customerName) | `status` (DRAFT, POSTED, PAID, CANCELLED), `customerId`, `startDate`, `endDate` | Spring `Page<SalesInvoice>` in `data` |
| `GET /api/account/ap-invoices` | `page` (0-based), `size` (default 10) | 100 | `invoiceDate,desc` | `invoiceDate`, `invoiceNumber`, `totalAmount` | `search` (invoiceNumber, vendorName) | `status` (DRAFT, POSTED, PAID, CANCELLED), `vendorId`, `startDate`, `endDate` | Spring `Page<ApInvoice>` in `data` |
| `GET /api/account/payment-vouchers` | `page` (0-based), `size` (default 10) | 100 | `voucherDate,desc` | `voucherDate`, `voucherNumber`, `amount` | `search` (voucherNumber, vendorName) | `vendorId` (UUID), `status` (DRAFT, POSTED), `startDate`, `endDate` | Spring `Page<PaymentVoucher>` in `data` |
| `GET /api/account/receipt-vouchers` | `page` (0-based), `size` (default 10) | 100 | `voucherDate,desc` | `voucherDate`, `voucherNumber`, `amount` | `search` (voucherNumber, customerName) | `customerId` (UUID), `status` (DRAFT, POSTED), `startDate`, `endDate` | Spring `Page<ReceiptVoucher>` in `data` |
| `GET /api/account/gl-journals` | `page` (0-based), `size` (default 10) | 100 | `entryDate,desc` | `entryDate`, `entryNumber` | `search` (entryNumber, narration) | `periodId` (UUID), `status` (DRAFT, POSTED, REVERSED), `startDate`, `endDate` | Spring `Page<GlJournalEntry>` in `data` |
| `GET /api/account/purchase-orders` | `page` (0-based), `size` (default 10) | 100 | `orderDate,desc` | `orderDate`, `orderNumber`, `totalAmount` | `search` (orderNumber, vendorName) | `vendorId` (UUID), `status` (DRAFT, APPROVED, CLOSED, CANCELLED), `startDate`, `endDate` | Spring `Page<PurchaseOrder>` in `data` |
| `GET /api/account/sales-orders` | `page` (0-based), `size` (default 10) | 100 | `orderDate,desc` | `orderDate`, `orderNumber`, `totalAmount` | `search` (orderNumber, customerName) | `customerId` (UUID), `status` (DRAFT, CONFIRMED, CLOSED, CANCELLED), `startDate`, `endDate` | Spring `Page<SalesOrder>` in `data` |
| `GET /api/account/goods-receipts` | `page` (0-based), `size` (default 10) | 100 | `receiptDate,desc` | `receiptDate`, `receiptNumber` | `search` (receiptNumber, vendorName) | `vendorId` (UUID), `status` (DRAFT, RECEIVED, VERIFIED) | Spring `Page<GoodsReceipt>` in `data` |
| `GET /api/account/delivery-challans` | `page` (0-based), `size` (default 10) | 100 | `challanDate,desc` | `challanDate`, `challanNumber` | `search` (challanNumber, customerName) | `customerId` (UUID), `status` (DRAFT, DISPATCHED, DELIVERED) | Spring `Page<DeliveryChallan>` in `data` |

### 8.3 Inventory List Endpoints (`/api/inventory`)

| Endpoint | Pagination Params | Max Limit | Default Sort | Sortable Fields | Search Param & Fields | Supported Filters | Response Envelope & Key |
|---|---|---|---|---|---|---|---|
| `GET /api/inventory/products` | `page` (0-based), `size` (default 10) | 100 | `name,asc` | `name`, `code`, `createdAt` | `search` (name, code, barcode) | `categoryId` (UUID), `active` (boolean) | Spring `Page<Product>` in `data` |
| `GET /api/inventory/warehouses` | `page` (0-based), `size` (default 10) | 100 | `name,asc` | `name`, `code` | `search` (name, code, address) | `active` (boolean) | Spring `Page<Warehouse>` in `data` |
| `GET /api/inventory/inventory-stocks` | `page` (0-based), `size` (default 20) | 200 | `quantity,desc` | `quantity`, `reservedQuantity` | `search` (productCode, productName) | `productId` (UUID), `warehouseId` (UUID) | Spring `Page<InventoryStock>` in `data` |
| `GET /api/inventory/stock-movements` | `page` (0-based), `size` (default 20) | 200 | `movementDate,desc`| `movementDate`, `movementNumber` | `search` (movementNumber, remarks) | `movementType` (IN, OUT, TRANSFER, ADJUSTMENT), `warehouseId`, `startDate`, `endDate` | Spring `Page<StockMovement>` in `data` |
| `GET /api/inventory/stock-adjustments` | `page` (0-based), `size` (default 10) | 100 | `adjustmentDate,desc`| `adjustmentDate`, `adjustmentNumber`| `search` (adjustmentNumber, reason) | `warehouseId` (UUID), `status` (DRAFT, POSTED) | Spring `Page<StockAdjustment>` in `data` |
| `GET /api/inventory/stock-transfers` | `page` (0-based), `size` (default 10) | 100 | `transferDate,desc`| `transferDate`, `transferNumber` | `search` (transferNumber) | `sourceWarehouseId` (UUID), `destinationWarehouseId` (UUID), `status` (DRAFT, IN_TRANSIT, COMPLETED) | Spring `Page<StockTransfer>` in `data` |

### 8.4 Workflow List Endpoints (`/api/v1/workflow`)

| Endpoint | Pagination Params | Max Limit | Default Sort | Sortable Fields | Search Param & Fields | Supported Filters | Response Envelope & Key |
|---|---|---|---|---|---|---|---|
| `GET /api/v1/workflow/definitions` | `page` (0-based), `size` (default 20) | 100 | `name,asc` | `name`, `moduleCode` | `search` (name) | `active` (boolean), `moduleCode` (string) | `ApiResponse<Page<WorkflowDefinition>>` or `List` |
| `GET /api/v1/workflow/tasks` | `page` (0-based), `size` (default 20) | 100 | `createdAt,desc` | `createdAt`, `priority` | `search` (title, referenceNumber) | `status` (PENDING, APPROVED, REJECTED), `assigneeId` (UUID) | Spring `Page<WorkflowTask>` in `data` |
| `GET /api/v1/workflow/transactions` | None (by transaction ID) | N/A | `createdAt,asc` | `createdAt` | None | `transactionId` (UUID) | `ApiResponse<List<WorkflowTransaction>>` |

---

## 9. File Upload Endpoints Contract

| Endpoint | Method | Form Field Name(s) | Content Type | Allowed File Types | File Size Limit | Response Payload |
|---|:---:|---|---|---|:---:|---|
| `/api/sso/company` | `POST` | `request` (JSON), `logo` (File) | `multipart/form-data` | `image/png`, `image/jpeg`, `image/webp` | 5 MB | `{ success: true, data: { ...company, logoUrl: string } }` |
| `/api/sso/company/{id}` | `PUT` | `request` (JSON), `logo` (File) | `multipart/form-data` | `image/png`, `image/jpeg`, `image/webp` | 5 MB | `{ success: true, data: { ...company, logoUrl: string } }` |
| `/api/account/v1/expenses/attachments` | `POST` | `file` (File), `companyId` (Query) | `multipart/form-data` | `image/jpeg`, `image/png`, `application/pdf` | 10 MB | `{ success: true, data: { fileId, fileName, fileUrl, fileType, fileSize } }` |
| `/api/v1/workflow/attachments` | `POST` | `file` (File), `taskId` (UUID) | `multipart/form-data` | `*/*` (PDF, images, documents) | 25 MB | `{ success: true, data: { id, fileName, fileUrl } }` |

---

## 10. Real-Time & Asynchronous Event Architecture

### 10.1 Real-Time / Socket.IO Status
- **Client-Facing WebSockets / Socket.IO**: None exposed publicly. All public ingress through Spring Cloud Gateway (`/api/*`) operates on HTTP REST protocols.
- **Inter-Service Event Broker**: Backend microservices communicate asynchronously via RabbitMQ (`erp-rabbitmq:5672` over isolated `erp-network`). Events include accounting transaction postings, inventory ledger movements, and workflow stage triggers.
- **Frontend Strategy**: The frontend employs stateful RTK Query / cache polling with smart lifecycle guards (`skip` when inactive, document visibility listeners to pause background polling, and AbortController on unmount/navigation).

---

## 11. Backend Observations (Architectural & Quality Analysis)

1. **Inconsistent Request & Response Envelopes**:
   - `POST /api/sso/signup` expects an unwrapped root object (`{ organizationName, email, password }`), whereas `POST /api/sso/auth/login` expects a wrapped `{ data: { ... } }` structure.
   - List endpoints vary across three different response structures:
     - SSO custom wrapper: `{ success: true, data: { items: [...], pagination: { page, pageSize, total, totalPages } } }`
     - Spring Data standard page: `{ success: true, data: { content: [...], totalElements, totalPages, number, size } }`
     - Unpaginated arrays: `{ success: true, data: [...] }`
2. **Missing Controller Parameter Defaults**:
   - `GET /api/sso/portal-access/{companyId}` throws 400 if `page` or `pageSize` are omitted because the controller declares raw `@RequestParam int page, @RequestParam int pageSize` without defaults.
3. **Endpoints Lacking Server-Side Pagination & Filtering**:
   - `GET /api/sso/subscription-plans` returns the entire plan catalog.
   - Financial report endpoints (`/api/account/reports/*`) return full ledger aggregations without pagination.
4. **Tenant Parameter Sensitivity**:
   - Non-privileged tenant users (e.g., standard Accountants) receive a 400 Bad Request if `companyId` is sent as a query parameter on `/api/account/*` endpoints, as tenancy must be derived solely from JWT claims.
5. **N+1 Database Query Risks**:
   - In `OrganizationAdministrationController`, fetching organizations performs separate lookups for member counts and company structures rather than executing a single join query.
6. **Missing DB Search Indexes**:
   - Wildcard text search across customers (`searchKey`) and products (`search`) issues SQL `LIKE %term%` queries without GIN or trigram indexes on the respective columns.

---

## 12. Backend Gaps (Not Touched — Strict Read-Only Backend Guard)

Per the strict read-only backend requirement, the following architectural and security gaps were NOT changed in backend microservices code. Comprehensive frontend adaptations and guards have been implemented:

1. **SSO Portal Access Mandatory Pagination (Missing Defaults)**:
   - **Backend File & Line**: `ERP_System/src/main/java/com/erp/auth_service/controller/UserController.java:51-52` and `RoleController.java:41-42`
   - **Issue**: Declares raw `@RequestParam int page, @RequestParam int pageSize` without `defaultValue`. Missing query parameters triggers HTTP 400 Bad Request.
   - **Recommended Backend Fix**: Annotate with `@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int pageSize`.
   - **Frontend Adaptation**: Central table-driven mapper in `baseApi.js` guarantees explicit injection of `page: 0, pageSize: 10` for all `/api/sso/user` and `/api/sso/role` requests.

2. **Inconsistent Pagination Base (0-based vs 1-based)**:
   - **Backend File & Line**: `ERP_System/src/main/java/com/erp/auth_service/controller/CompanyController.java:68-70` vs `account-main/.../BaseController.java`
   - **Issue**: `CompanyController` defaults to 1-based indexing (`defaultValue = "1"`), whereas `account-main`, `inventory`, and Spring Data controllers use standard 0-based indexing.
   - **Recommended Backend Fix**: Standardize all backend controllers to 0-based Spring Data `page` indexing.
   - **Frontend Adaptation**: `baseApi.js` endpoint contract table automatically increments page to 1-based (`page + 1`) for `/api/sso/company` requests and normalizes responses back to 0-based UI indexing.

3. **Inconsistent Pagination Parameter Casing (`pageSize` vs `size`)**:
   - **Backend File & Line**: `ERP_System/src/main/java/com/erp/auth_service/controller/UserController.java:52` (`pageSize`) vs `account-main` controllers (`size`)
   - **Issue**: SSO services expect `pageSize`, while financial & inventory services bind to Spring Data `Pageable` expecting `size`.
   - **Recommended Backend Fix**: Adopt standard Spring Data `Pageable` across all controllers.
   - **Frontend Adaptation**: `baseApi.js` dynamically maps `size` ↔ `pageSize` according to `ENDPOINT_CONTRACTS[prefix].sizeParam`.

4. **SSO List Response Key Discrepancy (`companies`/`users`/`roles` vs `items`)**:
   - **Backend File & Line**: `ERP_System/src/main/java/com/erp/auth_service/controller/CompanyController.java:75-80` (`companies`), `UserController.java:57` (`users`), `RoleController.java:45` (`roles`)
   - **Issue**: SSO endpoints encapsulate collections inside domain-specific root keys rather than a standardized `items` or `content` array.
   - **Recommended Backend Fix**: Standardize list responses to `ApiResponse<PageResponse<T>>` with a consistent `content` key.
   - **Frontend Adaptation**: `baseApi.js` unwrap function extracts the domain key dynamically via `domainKey` specification and normalizes to `{ items, pagination }`.

5. **Missing Total Count Endpoint for Organizations**:
   - **Backend File & Line**: `ERP_System/src/main/java/com/erp/auth_service/controller/platform/PlatformOrganizationController.java:28-36`
   - **Issue**: Lacks a lightweight `/count` endpoint, forcing clients to pull 200 items just to calculate total organizations.
   - **Recommended Backend Fix**: Expose `@GetMapping("/count")` returning `long` count.
   - **Frontend Adaptation**: Frontend queries with `size=1` and reads `_pageInfo.totalElements` directly from Spring Page metadata without loading items.

6. **Missing Batch Status Update for Invoices**:
   - **Backend File & Line**: `account-main/src/main/java/com/erp/account/modules/salesinvoice/controller/SalesInvoiceController.java:60-70`
   - **Issue**: Controller only provides single-item update `@PutMapping("/{invoiceId}")`.
   - **Recommended Backend Fix**: Implement `PATCH /api/account/sales-invoices/batch-status` accepting `List<UUID> invoiceIds, InvoiceStatus status`.
   - **Frontend Adaptation**: Frontend implements chunked batch concurrency limited to 5 parallel requests at a time (`p-limit` / chunking pattern) with live progress toast feedback.

7. **Security Finding — Non-httpOnly Authentication Cookies (Report Only)**:
   - **Backend File & Line**: `ERP_System/src/main/java/com/erp/auth_service/controller/AuthController.java:603-627`
   - **Issue**: Sets `.httpOnly(false)` on `ACCESS_TOKEN` and `ACCESS_TOKEN_REFRESH` response cookies during login and token refresh.
   - **Security Risk**: Non-httpOnly cookies are exposed to client-side JavaScript, increasing risk of credential exposure via XSS.
   - **Recommended Backend Fix**: Configure `.httpOnly(true)` with `.sameSite("Lax")` and `.secure(true)` in production.

8. **Security Finding — Tokens Returned in Response Body (Report Only)**:
   - **Backend File & Line**: `ERP_System/src/main/java/com/erp/auth_service/controller/AuthController.java:132-136, 172-177`
   - **Issue**: Returns raw JWT tokens (`accessToken` and `refreshToken`) in the JSON response body alongside setting cookies.
   - **Frontend Protection**: Frontend Redux slices and storage handlers do not write tokens to `localStorage` or `sessionStorage`, relying exclusively on browser cookie management.

9. **Security Finding — Non-httpOnly `auth_token` Mirror Cookie (Report Only)**:
   - **Backend File & Line**: `ERP_System/src/main/java/com/erp/auth_service/controller/AuthController.java:143-149`
   - **Issue**: Generates an extra duplicate cookie named `auth_token` with `.httpOnly(false)`.
   - **Recommended Backend Fix**: Remove redundant mirror cookie and enforce httpOnly on the canonical `ACCESS_TOKEN`.

