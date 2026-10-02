# PROJECT.md

# Multi-Tenant ERP System

## Project Overview

A scalable Multi-Tenant ERP System with:

* Super Admin Dashboard
* Company Admin Dashboard
* Role-Based Access Control (RBAC)
* Multi-Company Support
* Dynamic Permissions
* Module-Based Architecture
* Session Management
* Portal Access Management
* Company Isolation

Business requirements are based on the ERP architecture document. 

---

# System Architecture

```text
Super Admin
    |
    +-- Create Company
    +-- Manage Companies
    +-- Global Reports
    +-- Global Settings
    +-- Global Users

Company
    |
    +-- Company Admin
    |
    +-- HR
    +-- Finance
    +-- Sales
    +-- Inventory
    +-- Purchase
    +-- Manufacturing
    +-- CRM
```

---

# User Roles

## 1. Super Admin

Full Access

Permissions:

* Create Company
* Edit Company
* Delete Company
* Activate Company
* Manage All Companies
* View Global Reports
* Create Global Roles
* Assign Company Admin
* Manage Subscription
* Manage Modules
* Manage Sessions
* Manage Portal Access

Access:

```text
Dashboard
Company Management
Global Users
Reports
Settings
Audit Logs
Subscriptions
```

---

## 2. Company Admin

Full Control Inside Company

Permissions:

* Manage Users
* Manage Roles
* Manage Departments
* Manage Modules
* Manage Portal Access
* Manage Sessions
* View Reports
* Configure Company Settings

Access:

```text
Dashboard
HR
Finance
Inventory
CRM
Sales
Purchase
Manufacturing
Users
Roles
Portal Access
Settings
Reports
```

---

## 3. HR Manager

Permissions:

```text
Employee Create
Employee Update
Employee View
Leave Approval
Attendance Management
Payroll View
Recruitment
```

Modules:

```text
HR
Employees
Attendance
Payroll
Recruitment
```

---

## 4. Finance Manager

Permissions:

```text
Invoices
Expenses
GST
Tax
Accounting
Reports
Budget Management
```

Modules:

```text
Finance
Accounting
Invoices
Expenses
Budget
Reports
```

---

## 5. Inventory Manager

Permissions:

```text
Stock Management
Warehouse Management
Stock Transfer
Barcode Management
Purchase Stock Entry
```

Modules:

```text
Inventory
Warehouse
Stocks
Transfers
```

---

## 6. Sales Manager

Permissions:

```text
Customer Management
Sales Orders
Quotations
Lead Tracking
Sales Reports
```

Modules:

```text
CRM
Sales
Customers
Leads
```

---

## 7. Purchase Manager

Permissions:

```text
Vendor Management
Purchase Requests
Purchase Orders
Supplier Quotations
Approval Workflow
```

Modules:

```text
Purchase
Vendors
Orders
Approvals
```

---

## 8. Manufacturing Manager

Permissions:

```text
Production Scheduling
Batch Management
Raw Material Usage
Production Reports
```

Modules:

```text
Manufacturing
Production
Batches
Reports
```

---

## 9. Employee/User

Permissions:

```text
View Assigned Modules
Update Profile
View Dashboard
```

Access only assigned portals.

---

# Permission Structure

Every module contains:

```json
{
  "create": true,
  "read": true,
  "update": true,
  "delete": false,
  "export": true,
  "approve": false
}
```

---

# ERP Modules

## Company Management

* Company Creation
* Company Settings
* Company Status
* Company Reports

---

## Dashboard

### Super Admin Dashboard

Widgets:

* Total Companies
* Active Companies
* Total Users
* Total Employees
* Total Revenue
* Active Sessions
* Recent Activities

### Company Dashboard

Widgets:

* Employees
* Departments
* Revenue
* Expenses
* Sales
* Inventory
* Pending Approvals

---

## HR Module

Features:

* Employees
* Attendance
* Leave
* Payroll
* Recruitment
* Performance

---

## Finance Module

Features:

* General Ledger
* Accounts Payable
* Accounts Receivable
* Expenses
* GST
* Tax
* Budget

---

## Inventory Module

Features:

* Stock Tracking
* Warehouses
* Stock Transfer
* QR/Barcode
* Low Stock Alerts

---

## CRM Module

Features:

* Customers
* Leads
* Follow Ups
* Inquiries
* Communication

---

## Sales Module

Features:

* Quotations
* Orders
* Invoices
* Reports

---

## Purchase Module

Features:

* Vendors
* Purchase Requests
* Purchase Orders
* Approvals

---

## Manufacturing Module

Features:

* Production
* Batch Management
* Raw Materials
* Scheduling

---

# Frontend Folder Structure

Based on your current project structure:

```text
src
│
├── api
│   ├── auth
│   ├── company
│   ├── users
│   ├── roles
│   ├── dashboard
│   ├── inventory
│   ├── hr
│   ├── finance
│   ├── crm
│   ├── sales
│   ├── purchase
│   └── manufacturing
│
├── app
│
├── components
│   ├── ui
│   ├── tables
│   ├── forms
│   ├── cards
│   ├── charts
│   └── layouts
│
├── context
│   ├── AuthContext
│   ├── CompanyContext
│   └── PermissionContext
│
├── features
│
│   ├── auth
│   ├── dashboard
│   ├── company
│   ├── users
│   ├── roles
│   ├── permissions
│   ├── sessions
│   ├── portal-access
│   ├── hr
│   ├── finance
│   ├── inventory
│   ├── crm
│   ├── sales
│   ├── purchase
│   └── manufacturing
│
├── hooks
│
├── layouts
│   ├── MainLayout
│   ├── AuthLayout
│   ├── AdminLayout
│
├── pages
│
├── router
│
├── routes
│   ├── ProtectedRoute.jsx
│   ├── RoleRoute.jsx
│   └── PermissionRoute.jsx
│
├── services
│
├── utils
│
└── validation
```

---

# Route Structure

```text
/login

/company-selector

/super-admin/dashboard
/super-admin/companies
/super-admin/users
/super-admin/reports

/dashboard

/hr
/hr/employees
/hr/attendance
/hr/payroll

/finance
/finance/accounting
/finance/invoices

/inventory
/inventory/stocks
/inventory/warehouse

/crm
/crm/customers
/crm/leads

/sales
/quotes
/orders

/purchase
/vendors
/purchase-orders

/manufacturing
/production
/batches

/settings
/profile
```

---

# Dynamic Sidebar Logic

Backend sends:

```json
{
  "role": "HR_MANAGER",
  "permissions": [
    "employee.read",
    "employee.create",
    "attendance.read"
  ]
}
```

Frontend generates menu dynamically:

```js
const visibleMenus = allMenus.filter(menu =>
  permissions.includes(menu.permission)
);
```

Never hardcode menu visibility.

---

# Authentication Flow

```text
Login
    ↓
Get Token
    ↓
Get User
    ↓
Get Role
    ↓
Get Permissions
    ↓
Get Companies
    ↓
Company Selection
    ↓
Dashboard
```

---

# State Management

Use Redux Toolkit

Slices:

```text
authSlice
companySlice
permissionSlice
roleSlice
dashboardSlice
userSlice
sessionSlice
settingsSlice
```

---

# Backend Headers

```http
Authorization: Bearer TOKEN

X-Company-Id: COMPANY_ID
```

---

# Important Rules

### Rule 1

Super Admin can access everything.

### Rule 2

Company Admin can access only own company.

### Rule 3

Managers access only assigned modules.

### Rule 4

Employees access only assigned features.

### Rule 5

Sidebar must be permission-based.

### Rule 6

Routes must be protected.

### Rule 7

Company data must remain isolated.

### Rule 8

Frontend must hide unauthorized screens.

---

# Development Order

### Phase 1

* Authentication
* Layouts
* RBAC
* Route Protection

### Phase 2

* Company Management
* Company Selector
* Dashboard

### Phase 3

* Users
* Roles
* Permissions

### Phase 4

* HR Module
* Finance Module

### Phase 5

* Inventory
* CRM
* Sales

### Phase 6

* Purchase
* Manufacturing

### Phase 7

* Reports
* Settings
* Audit Logs

### Phase 8

* Optimization
* Testing
* Deployment

---
