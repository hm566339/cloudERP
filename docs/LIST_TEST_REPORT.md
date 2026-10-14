# List Test Report — Comprehensive List, Table & Grid Verification

> **Scope**: Validation of all enterprise lists, tables, and grids against data-fetching standards, URL state synchronization, filtering, sorting, debouncing, and pagination.

---

## 1. List Views Test Matrix

| List View Component | Domain | Route Path | Fast Typing Debounced (350-400ms) | Filter Change Resets Page | Page Change Retains Filters | Sortable Columns (asc/desc) | Page Size Selector | URL Sync on Refresh / Share | Empty & Error States | Role-Gated Actions | Test Status |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `OrganizationList.jsx` | Super Admin | `/super-admin/organizations` | ✅ 350ms | ✅ Yes | ✅ Yes | Name, Status, Date | ✅ 10/20/50 | ✅ Yes (`?tab=&search=`) | ✅ Yes | SystemAdmin only | ✅ Verified |
| `OrganizationDetails.jsx` | Super Admin | `/super-admin/organizations/:id` | ✅ 350ms | ✅ Yes | ✅ Yes | Name, Role, Date | ✅ 10/20/50 | ✅ Yes (`?tab=members`) | ✅ Yes | SystemAdmin only | ✅ Verified |
| `CompanyList.jsx` | Super Admin | `/super-admin/companies` | ✅ 350ms | ✅ Yes | ✅ Yes | Name, Code, Status | ✅ 10/20/50 | ✅ Yes (`?search=&status=`) | ✅ Yes | SystemAdmin only | ✅ Verified |
| `UserList.jsx` | IAM | `/workspace/users` | ✅ 400ms | ✅ Yes | ✅ Yes | Username, Role, Status | ✅ 10/20/50 | ✅ Yes (`?role=&status=`) | ✅ Yes | Admin / Owner | ✅ Verified |
| `RoleList.jsx` | IAM | `/workspace/roles` | ✅ 350ms | ✅ Yes | ✅ Yes | Name, Description | ✅ 10/20/50 | ✅ Yes (`?search=`) | ✅ Yes | Admin / Owner | ✅ Verified |
| `ChartOfAccounts.jsx` | Finance | `/accounts/masters/ledgers` | ✅ 350ms | ✅ Yes | ✅ Yes | AccountCode, Name | ✅ 20/50/100 | ✅ Yes (`?accountType=`) | ✅ Yes | Finance / Accountant | ✅ Verified |
| `BankAccounts.jsx` | Finance | `/accounts/masters/bank-accounts` | ✅ 400ms | ✅ Yes | ✅ Yes | AccountName, Number | ✅ 10/20/50 | ✅ Yes (`?bankName=`) | ✅ Yes | Finance / Accountant | ✅ Verified |
| `BankTransactions.jsx` | Finance | `/accounts/banking/transactions` | ✅ 400ms | ✅ Yes | ✅ Yes | Date, Amount, Status | ✅ 20/50/100 | ✅ Yes (`?startDate=&endDate=`) | ✅ Yes | Finance / Accountant | ✅ Verified |
| `JournalEntries.jsx` | Finance | `/accounts/general-ledger/journals` | ✅ 400ms | ✅ Yes | ✅ Yes | EntryDate, Number | ✅ 10/20/50 | ✅ Yes (`?periodId=&status=`) | ✅ Yes | Finance / Accountant | ✅ Verified |
| `SalesInvoices.jsx` | Receivables | `/accounts/receivables/invoices` | ✅ 350ms | ✅ Yes | ✅ Yes | Date, Total, Status | ✅ 10/20/50 | ✅ Yes (`?status=&customer=`) | ✅ Yes | AR Exec / Accountant | ✅ Verified |
| `APInvoices.jsx` | Payables | `/accounts/payables/invoices` | ✅ 350ms | ✅ Yes | ✅ Yes | Date, Total, Status | ✅ 10/20/50 | ✅ Yes (`?status=&vendor=`) | ✅ Yes | AP Exec / Accountant | ✅ Verified |
| `PaymentVouchers.jsx` | Payables | `/accounts/payables/vouchers` | ✅ 400ms | ✅ Yes | ✅ Yes | Date, VoucherNo, Amount | ✅ 10/20/50 | ✅ Yes (`?vendorId=&status=`) | ✅ Yes | AP Exec / Accountant | ✅ Verified |
| `ReceiptVouchers.jsx` | Receivables | `/accounts/receivables/receipts` | ✅ 400ms | ✅ Yes | ✅ Yes | Date, VoucherNo, Amount | ✅ 10/20/50 | ✅ Yes (`?customerId=`) | ✅ Yes | AR Exec / Accountant | ✅ Verified |
| `ProductManagement.jsx` | Inventory | `/inventory/products` | ✅ 350ms | ✅ Yes | ✅ Yes | Name, Code, Price | ✅ 10/20/50 | ✅ Yes (`?categoryId=&active=`) | ✅ Yes | Inventory Mgr / Staff | ✅ Verified |
| `WarehouseManagement.jsx` | Inventory | `/inventory/warehouses` | ✅ 400ms | ✅ Yes | ✅ Yes | Name, Code, Location | ✅ 10/20/50 | ✅ Yes (`?active=`) | ✅ Yes | Inventory Mgr | ✅ Verified |
| `StockMovementManagement.jsx`| Inventory | `/inventory/movements` | ✅ 400ms | ✅ Yes | ✅ Yes | Date, MovementType | ✅ 20/50/100 | ✅ Yes (`?type=&warehouse=`) | ✅ Yes | Inventory Mgr | ✅ Verified |
| `StockAdjustmentManagement.jsx`| Inventory | `/inventory/adjustments` | ✅ 400ms | ✅ Yes | ✅ Yes | Date, Status | ✅ 10/20/50 | ✅ Yes (`?warehouse=&status=`) | ✅ Yes | Inventory Mgr | ✅ Verified |
| `PurchaseOrders.jsx` | Procurement | `/procurement/orders` | ✅ 350ms | ✅ Yes | ✅ Yes | Date, OrderNo, Total | ✅ 10/20/50 | ✅ Yes (`?vendor=&status=`) | ✅ Yes | Purchase Exec / Mgr | ✅ Verified |
| `GoodsReceipts.jsx` | Procurement | `/procurement/grn` | ✅ 400ms | ✅ Yes | ✅ Yes | Date, ReceiptNo | ✅ 10/20/50 | ✅ Yes (`?vendor=&status=`) | ✅ Yes | Purchase / Warehouse | ✅ Verified |
| `SupplierQuotations.jsx` | Procurement | `/procurement/quotations` | ✅ 400ms | ✅ Yes | ✅ Yes | Date, QuotationNo | ✅ 10/20/50 | ✅ Yes (`?status=`) | ✅ Yes | Purchase Exec | ✅ Verified |
| `QuotationsPage.jsx` | Sales | `/sales/quotations` | ✅ 350ms | ✅ Yes | ✅ Yes | Date, QuotationNo | ✅ 10/20/50 | ✅ Yes (`?customer=&status=`) | ✅ Yes | Sales Exec / Mgr | ✅ Verified |
| `ProformaInvoicesPage.jsx` | Sales | `/sales/proforma` | ✅ 350ms | ✅ Yes | ✅ Yes | Date, Number, Total | ✅ 10/20/50 | ✅ Yes (`?status=`) | ✅ Yes | Sales Exec / Mgr | ✅ Verified |
| `SalesOrdersPage.jsx` | Sales | `/sales/orders` | ✅ 350ms | ✅ Yes | ✅ Yes | Date, OrderNo, Total | ✅ 10/20/50 | ✅ Yes (`?status=&customer=`) | ✅ Yes | Sales Exec / Mgr | ✅ Verified |
| `DeliveryChallansPage.jsx` | Sales | `/sales/delivery-challans` | ✅ 350ms | ✅ Yes | ✅ Yes | Date, ChallanNo | ✅ 10/20/50 | ✅ Yes (`?status=`) | ✅ Yes | Sales / Dispatch | ✅ Verified |
| `ApprovalRequestsPage.jsx` | Workflows | `/workflows/requests` | ✅ 350ms | ✅ Yes | ✅ Yes | CreatedAt, Priority | ✅ 10/20/50 | ✅ Yes (`?status=`) | ✅ Yes | Approver / Owner | ✅ Verified |
| `WorkflowManagementPage.jsx` | Workflows | `/workflows/definitions` | ✅ 400ms | ✅ Yes | ✅ Yes | Name, ModuleCode | ✅ 10/20/50 | ✅ Yes (`?active=`) | ✅ Yes | Company Admin / Owner | ✅ Verified |

---

## 2. Test Edge Case Scenarios

| Test Case | Scenario | Expected Behavior | Observed Result | Status |
|---|---|---|---|---|
| **E1** | User types rapidly ("Ram 12345") then clears text | Exactly one debounced API request fires 350ms after typing ceases; intermediate requests aborted via AbortController. | No out-of-order responses; clean result. | ✅ Pass |
| **E2** | User is on Page 4 and changes filter | Page resets to 1 (0-index 0) immediately; new filtered results loaded from page 1. | Page correctly resets to 1; URL updates to `page=1`. | ✅ Pass |
| **E3** | User on Page 2 clicks to change Page Size from 10 to 50 | Total pages recomputed; page clamped to `max(1, min(page, totalPages))`. | Seamless re-clamping; no empty page error. | ✅ Pass |
| **E4** | User refreshes browser on `/super-admin/organizations/ram?tab=members&search=admin` | State accurately parsed from URL searchParams; input initialized with "admin" without double fetch. | State perfectly restored from URL. | ✅ Pass |
| **E5** | Query returns 0 records for applied filter | Renders `EmptyState` with distinct message: "No results for these filters" and a "Clear Filters" action button. | "Clear Filters" resets state cleanly. | ✅ Pass |
| **E6** | Delete last item on last page (e.g. Item 1 of 1 on Page 3) | Total items shrink by 1; `useListQuery` detects `page >= totalPages` and automatically decrements active page to Page 2. | Gracefully moves to Page 2 without 404 or empty crash. | ✅ Pass |
| **E7** | Concurrent 401 token expiration across 3 simultaneous list queries | All 3 in-flight requests share ONE single token refresh call; upon resolution, all 3 retry and succeed. | Single-flight refresh token rotation preserved; zero repeated 401s. | ✅ Pass |
