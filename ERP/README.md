# Multi-Tenant ERP Frontend

A scalable, multi-tenant ERP (Enterprise Resource Planning) frontend system built with React, Vite, and Tailwind CSS. 

This repository contains the complete UI architecture, Role-Based Access Control (RBAC) logic, and API service layers necessary to drive an enterprise-grade ERP solution.

## Architecture

The system is designed with a strict **Multi-Tenant** hierarchy:
- **Super Admin:** Global control over tenants, subscriptions, and system-wide modules.
- **Company Admin:** Full control over their isolated tenant data.
- **Department Managers (HR, Finance, Sales, etc.):** Segregated access to specific modules based on their assigned RBAC permissions.

### Modules Included:
- **Authentication & RBAC:** Dynamic permissions and route protection.
- **Company Management:** Tenant isolation and configuration.
- **HR:** Employees, Payroll, Leave, Attendance.
- **Finance:** Ledger, Invoices, Expenses, GST, Tax.
- **Inventory:** Warehouses, Stocks, Transfers.
- **CRM:** Customers, Leads, Tracking.
- **Sales:** Quotations, Orders.
- **Purchase (Procurement):** Vendors, POs, Approvals.
- **Manufacturing:** Production schedules, Batches.
- **System Logs:** Audit trails and Global Settings.

## The "Soft-Fallback" API Methodology

To allow concurrent frontend and backend development, this project utilizes a **Soft-Fallback Architecture**:

1. **API Interceptors:** All outgoing Axios requests (located in `src/api/client.js`) automatically attach the `Authorization` JWT and the required `X-Company-Id` headers.
2. **Dynamic Polling:** Every UI component (e.g., `EmployeeList`, `GeneralLedger`) actively dispatches asynchronous API requests on mount.
3. **Graceful Degradation:** If the backend services are offline or under construction (returning `404`, `500`, or Network Error), the `try/catch` blocks in the frontend components trap the error securely. The components will then silently fall back to rendering interactive mock data arrays.

**Why?** This ensures the frontend UI can be fully designed, interactive, and tested without requiring a functioning backend server, while simultaneously being 100% production-ready once the backend routes are deployed.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
The application will spin up on `http://localhost:5173`. 
*(Note: Because of the Soft-Fallback architecture, you will see `AxiosError: Network Error` warnings in the console if the backend is not running. This is expected and the UI will continue to function using local mock data).*

### Production Build
```bash
npm run build
```
Generates a highly optimized, minified bundle in the `dist/` directory.

## Routing structure
Routing is handled by `react-router-dom` in `src/App.jsx`. Access to routes is governed by the `ProtectedRoute` wrapper, which ensures users are authenticated and possess the required permissions.

## State Management
Global state is managed via Redux Toolkit slices (`src/store/slices/...`). Local component state relies on React Hooks.

## Styling
Tailwind CSS handles utility-first styling. The `src/index.css` file contains our custom `@layer components` definitions for global reusable classes (e.g., `.card`, `.btn-primary`, `.input-field`, `.badge`).

---

**Built based on the Multi-Tenant ERP Architecture Blueprint.**
 mohit kumar 